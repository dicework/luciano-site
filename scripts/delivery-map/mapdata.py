"""Load the downloaded Overture slice as shapely geometries in metres.

Transverse Mercator centred on Varna: true north is straight up and scale
error across the map is below 0.0001%.
"""

import os

import pyarrow.parquet as pq
import shapely
from pyproj import Transformer
from shapely.ops import transform

LOCAL = '+proj=tmerc +lat_0=43.21 +lon_0=27.91 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs'
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.data')
_to_m = Transformer.from_crs('EPSG:4326', LOCAL, always_xy=True).transform
_to_ll = Transformer.from_crs(LOCAL, 'EPSG:4326', always_xy=True).transform


def to_m(geom):
    return transform(_to_m, geom)


def to_ll(geom):
    return transform(_to_ll, geom)


def lonlat(lon, lat):
    return to_m(shapely.Point(lon, lat))


def layer(name, columns=None):
    rows = pq.read_table(os.path.join(DATA, name + '.parquet'), columns=columns).to_pylist()
    for r in rows:
        r['geom'] = to_m(shapely.from_wkb(r['geometry']))
        r['name'] = (r.get('names') or {}).get('primary')
    return rows
