"""Download the Varna slice of the Overture Maps release into scripts/delivery-map/.data/.

Reads only the row groups whose bbox statistics overlap Varna, so the global
files are never downloaded in full.
"""

import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor

import pyarrow as pa
import pyarrow.compute as pc
import pyarrow.fs as fs
import pyarrow.parquet as pq

RELEASE = '2026-10-21.0'
# Central Varna, from Varna Lake in the west to beyond the Sea Garden in the east.
XMIN, YMIN, XMAX, YMAX = 27.84, 43.17, 27.98, 43.25
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.data')
TYPES = sys.argv[1:] or [
    'transportation/segment',
    'base/water',
    'base/land',
    'base/land_use',
    'places/place',
    'buildings/building',
]

s3 = fs.S3FileSystem(anonymous=True, region='us-west-2')
os.makedirs(OUT, exist_ok=True)


def overlaps(stats):
    xmin, xmax, ymin, ymax = stats
    return xmin.min < XMAX and xmax.max > XMIN and ymin.min < YMAX and ymax.max > YMIN


def read_file(path):
    f = pq.ParquetFile(path, filesystem=s3)
    md = f.metadata
    names = [md.schema.column(i).path for i in range(md.num_columns)]
    idx = [names.index(n) for n in ('bbox.xmin', 'bbox.xmax', 'bbox.ymin', 'bbox.ymax')]
    groups = [
        g for g in range(md.num_row_groups) if overlaps([md.row_group(g).column(i).statistics for i in idx])
    ]
    if not groups:
        return None
    table = f.read_row_groups(groups)
    bbox = table.column('bbox')
    mask = pc.and_(
        pc.and_(pc.less(pc.struct_field(bbox, 'xmin'), XMAX), pc.greater(pc.struct_field(bbox, 'xmax'), XMIN)),
        pc.and_(pc.less(pc.struct_field(bbox, 'ymin'), YMAX), pc.greater(pc.struct_field(bbox, 'ymax'), YMIN)),
    )
    table = table.filter(mask)
    return table if table.num_rows else None


for item in TYPES:
    theme, kind = item.split('/')
    start = time.time()
    base = f'overturemaps-us-west-2/release/{RELEASE}/theme={theme}/type={kind}'
    paths = [i.path for i in s3.get_file_info(fs.FileSelector(base)) if i.path.endswith('.parquet')]
    with ThreadPoolExecutor(16) as pool:
        tables = [t for t in pool.map(read_file, paths) if t is not None]
    table = pa.concat_tables(tables) if tables else None
    rows = table.num_rows if table is not None else 0
    if table is not None:
        pq.write_table(table, f'{OUT}/{theme}-{kind}.parquet')
    print(f'{item}: {rows} rows from {len(paths)} files in {time.time() - start:.0f}s', flush=True)
