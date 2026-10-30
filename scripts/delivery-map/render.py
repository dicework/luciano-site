"""Render the delivery-zone map as SVG (Bulgarian and English) and export the zones as GeoJSON."""

import base64
import heapq
import html
import json
import os
from collections import defaultdict

import shapely
from shapely.ops import linemerge, polylabel, unary_union

from mapdata import layer, lonlat, to_ll
from zones import build

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, '.data', 'out')
BADGE = os.path.join(ROOT, 'public', 'images', 'brand', 'luchiano-badge.webp')
GEOJSON = os.path.join(ROOT, 'docs', 'delivery-zones.geojson')

W, H = 2400, 1600
X0, X1 = -3800, 3400
Y1 = 2650
S = W / (X1 - X0)
Y0 = Y1 - H / S
VIEW = shapely.box(X0, Y0, X1, Y1)
CLIP = VIEW.buffer(200)

LUCIANO = lonlat(27.91163, 43.20335)

C = {
    'land': '#121210',
    'green': '#17201a',
    'building': '#1c1b17',
    'water': '#0c1c29',
    'coast': '#2c3a44',
    'minor': '#2b2924',
    'tertiary': '#3e392d',
    'secondary': '#5a4e36',
    'primary': '#7a6942',
    'rail': '#34332d',
    'zone_fill': '#d8aa4f',
    'zone_line': '#e7c06c',
    'label': '#f7e9c6',
    'halo': '#121210',
    'street': '#a0906a',
    'context': '#7d93a3',
    'park_label': '#6f8b6a',
}

TEXT = {
    'bg': {
        'title': 'Зони за доставка',
        'subtitle': 'Лучиано · Варна',
        'legend_zone': 'Зона за доставка',
        'legend_pin': 'Лучиано, ул. „Русе“ 13',
        'pin_name': 'Лучиано',
        'pin_address': 'ул. „Русе“ 13',
        'sea': 'Черно море',
        'lake': 'Варненско езеро',
        'park': 'Морска градина',
        'port': 'Пристанище Варна',
        'km': 'км',
        'm': 'м',
        'north': 'С',
        'attribution': 'Картни данни © OpenStreetMap contributors, Overture Maps Foundation · ODbL',
    },
    'en': {
        'title': 'Delivery zones',
        'subtitle': 'Luchiano · Varna',
        'legend_zone': 'Delivery zone',
        'legend_pin': 'Luchiano, 13 Ruse Street',
        'pin_name': 'Luchiano',
        'pin_address': '13 Ruse Street',
        'sea': 'Black Sea',
        'lake': 'Lake Varna',
        'park': 'Sea Garden',
        'port': 'Port of Varna',
        'km': 'km',
        'm': 'm',
        'north': 'N',
        'attribution': 'Map data © OpenStreetMap contributors, Overture Maps Foundation · ODbL',
    },
}

ZONE_LABELS = {
    'Център': ('Център', 'City Centre'),
    'Гръцка махала': ('Гръцка\nмахала', 'Greek\nQuarter'),
    'Фестивален комплекс': ('Фестивален\nкомплекс', 'Festival\nComplex'),
    'Колхозен пазар': ('Колхозен\nпазар', 'Kolhozen\nPazar'),
    'Окръжна болница': ('Окръжна\nболница', 'District\nHospital'),
    'Генералите': ('Генералите', 'Generalite'),
    'Червен площад': ('Червен\nплощад', 'Cherven\nPloshtad'),
    'Чаталджа': ('Чаталджа', 'Chataldzha'),
    'Спортна зала': ('Спортна\nзала', 'Sports\nHall'),
    'Левски': ('Левски', 'Levski'),
    'Трошево': ('Трошево', 'Troshevo'),
}

# Label anchors (lon, lat) where the pole of inaccessibility collides with a neighbour's label or the pin.
LABEL_AT = {
    'Център': (27.90575, 43.20275),
    'Фестивален комплекс': (27.92250, 43.20400),
}
SMALL_ZONES = {'Фестивален комплекс', 'Червен площад', 'Генералите'}

STREETS = [
    'бул. Владислав Варненчик',
    'бул. Сливница',
    'бул. Цар Освободител',
    'бул. Васил Левски',
    'бул. Христо Смирненски',
    'бул. 8-ми Приморски полк',
    'бул. Княз Борис I',
    'бул. Генерал Колев',
]

TRANSLIT = dict(
    zip(
        'абвгдежзийклмнопрстуфхцчшщъьюя',
        [
            'a', 'b', 'v', 'g', 'd', 'e', 'zh', 'z', 'i', 'y', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u',
            'f', 'h', 'ts', 'ch', 'sh', 'sht', 'a', 'y', 'yu', 'ya',
        ],
    )
)


def translit(text):
    out = []
    for ch in text:
        low = ch.lower()
        if low in TRANSLIT:
            t = TRANSLIT[low]
            out.append(t.capitalize() if ch != low else t)
        else:
            out.append(ch)
    return ''.join(out)


def street_label(name, lang):
    if lang == 'bg':
        return name
    base = name.removeprefix('бул. ')
    return translit(base) + ' Blvd'


def px(x, y):
    return (x - X0) * S, (Y1 - y) * S


def ring_d(coords):
    pts = [px(x, y) for x, y in coords]
    return 'M' + 'L'.join(f'{a:.1f} {b:.1f}' for a, b in pts) + 'Z'


def poly_d(geom):
    parts = []
    for p in getattr(geom, 'geoms', [geom]):
        if p.geom_type != 'Polygon' or p.is_empty:
            continue
        parts.append(ring_d(p.exterior.coords))
        parts.extend(ring_d(r.coords) for r in p.interiors)
    return ''.join(parts)


def line_d(geom):
    parts = []
    for ln in getattr(geom, 'geoms', [geom]):
        if ln.geom_type != 'LineString' or ln.is_empty:
            continue
        pts = [px(x, y) for x, y in ln.coords]
        parts.append('M' + 'L'.join(f'{a:.1f} {b:.1f}' for a, b in pts))
    return ''.join(parts)


def clipped(geoms):
    return [g.intersection(CLIP) for g in geoms if g.intersects(CLIP)]


def polygons_only(g):
    if g.geom_type in ('Polygon', 'MultiPolygon'):
        return g
    return unary_union([p for p in getattr(g, 'geoms', []) if p.geom_type in ('Polygon', 'MultiPolygon')])


def text_lines(x, y, lines, size, cls, line_height=1.08):
    n = len(lines)
    top = y - (n - 1) * size * line_height / 2
    spans = ''.join(
        f'<tspan x="{x:.1f}" y="{top + i * size * line_height:.1f}">{html.escape(t)}</tspan>' for i, t in enumerate(lines)
    )
    return f'<text class="{cls}" dominant-baseline="central">{spans}</text>'


def load_layers():
    segs = layer('transportation-segment', ['geometry', 'names', 'subtype', 'class'])
    water = layer('base-water', ['geometry', 'names', 'subtype', 'class'])
    land_use = layer('base-land_use', ['geometry', 'names', 'subtype', 'class'])
    land = layer('base-land', ['geometry', 'names', 'subtype', 'class'])
    buildings = layer('buildings-building', ['geometry'])
    return segs, water, land_use, land, buildings


def base_map(segs, water, land_use, land, buildings):
    out = []
    greens = [u['geom'] for u in land_use if u['subtype'] in ('park', 'recreation', 'cemetery', 'protected')]
    greens += [r['geom'] for r in land if r['subtype'] in ('forest', 'shrub', 'grass', 'wetland')]
    greens = polygons_only(unary_union(clipped([g for g in greens if g.geom_type in ('Polygon', 'MultiPolygon')])))
    out.append(f'<path fill="{C["green"]}" d="{poly_d(greens)}"/>')

    blds = unary_union(clipped([b['geom'] for b in buildings if b['geom'].geom_type in ('Polygon', 'MultiPolygon')]))
    out.append(f'<path fill="{C["building"]}" d="{poly_d(polygons_only(blds))}"/>')

    wet = [w['geom'] for w in water if w['geom'].geom_type in ('Polygon', 'MultiPolygon')]
    wet = polygons_only(unary_union(clipped(wet)))
    out.append(f'<path fill="{C["water"]}" stroke="{C["coast"]}" stroke-width="1.2" d="{poly_d(wet)}"/>')
    streams = [w['geom'] for w in water if w['geom'].geom_type in ('LineString', 'MultiLineString')]
    out.append(
        f'<path fill="none" stroke="{C["water"]}" stroke-width="1.6" d="{line_d(unary_union(clipped(streams)))}"/>'
    )

    rail = unary_union(clipped([s['geom'] for s in segs if s['subtype'] == 'rail']))
    out.append(f'<path fill="none" stroke="{C["rail"]}" stroke-width="1.6" stroke-dasharray="6 4" d="{line_d(rail)}"/>')

    styles = [
        (('residential', 'unclassified', 'living_street', 'pedestrian', 'service'), C['minor'], 1.1),
        (('tertiary',), C['tertiary'], 2.0),
        (('secondary',), C['secondary'], 2.8),
        (('primary', 'trunk', 'motorway'), C['primary'], 3.8),
    ]
    for classes, colour, width in styles:
        lines = [s['geom'] for s in segs if s['subtype'] == 'road' and s['class'] in classes]
        geom = unary_union(clipped(lines))
        out.append(
            f'<path fill="none" stroke="{colour}" stroke-width="{width}" stroke-linecap="round" '
            f'stroke-linejoin="round" d="{line_d(geom)}"/>'
        )
    return out, wet


def street_paths(segs, lang):
    defs, texts = [], []
    for i, name in enumerate(STREETS):
        lines = [s['geom'] for s in segs if s['name'] == name and s['subtype'] == 'road']
        line = longest_route(unary_union(lines).intersection(VIEW.buffer(-60)))
        if line is None:
            continue
        line = line.simplify(25)
        if line.coords[0][0] > line.coords[-1][0]:
            line = shapely.LineString(line.coords[::-1])
        defs.append(f'<path id="st{i}" d="{line_d(line)}"/>')
        label = html.escape(street_label(name, lang))
        texts.append(
            f'<text class="street"><textPath href="#st{i}" startOffset="{STREET_OFFSET.get(name, 50)}%" '
            f'text-anchor="middle">{label}</textPath></text>'
        )
    return defs, texts


# Where along each boulevard its name sits (percent of its visible length).
STREET_OFFSET = {'бул. Цар Освободител': 82, 'бул. Христо Смирненски': 80, 'бул. Княз Борис I': 62}


def longest_route(geom):
    """Route along a street between its two ends that lie farthest apart.

    Dual carriageways form loops, so the ends are chosen by straight-line
    separation and joined by the shortest path through the street's own graph.
    """
    merged = linemerge(geom)
    pieces = [g for g in getattr(merged, 'geoms', [merged]) if g.geom_type == 'LineString' and g.length > 0]
    if not pieces:
        return None
    key = lambda c: (round(c[0]), round(c[1]))
    graph = defaultdict(list)
    for i, p in enumerate(pieces):
        a, b = key(p.coords[0]), key(p.coords[-1])
        graph[a].append((b, p.length, i, False))
        graph[b].append((a, p.length, i, True))

    def paths_from(src):
        dist, prev, heap = {src: 0}, {}, [(0, src)]
        while heap:
            d, u = heapq.heappop(heap)
            if d > dist[u]:
                continue
            for v, w, i, rev in graph[u]:
                if d + w < dist.get(v, float('inf')):
                    dist[v] = d + w
                    prev[v] = (u, i, rev)
                    heapq.heappush(heap, (d + w, v))
        return dist, prev

    # Work in the connected component with the most street length.
    seen, best, best_len = set(), [], -1
    for start in graph:
        if start in seen:
            continue
        comp, stack, length = [], [start], 0
        seen.add(start)
        while stack:
            u = stack.pop()
            comp.append(u)
            for v, w, _, _ in graph[u]:
                length += w / 2
                if v not in seen:
                    seen.add(v)
                    stack.append(v)
        if length > best_len:
            best, best_len = comp, length
    nodes = best
    a, b = max(
        ((p, q) for i, p in enumerate(nodes) for q in nodes[i + 1 :]),
        key=lambda pq: (pq[0][0] - pq[1][0]) ** 2 + (pq[0][1] - pq[1][1]) ** 2,
    )
    _, prev = paths_from(a)
    coords, node = [], b
    while node != a:
        u, i, rev = prev[node]
        seg = list(pieces[i].coords)
        seg = seg if rev else seg[::-1]  # walk from node back towards u
        coords.extend(seg if not coords else seg[1:])
        node = u
    return shapely.LineString(coords[::-1]) if len(coords) > 1 else None


def render(lang, zones, layers):
    t = TEXT[lang]
    segs, water, land_use, land, buildings = layers
    base, wet = base_map(*layers)
    street_defs, street_texts = street_paths(segs, lang)

    zone_fill = ''.join(f'<path d="{poly_d(g)}"/>' for g in zones.values())

    labels = []
    for zone, g in zones.items():
        if zone in LABEL_AT:
            pt = lonlat(*LABEL_AT[zone])
        else:
            body = max(getattr(g, 'geoms', [g]), key=lambda p: p.area)
            pt = polylabel(body, tolerance=5)
        x, y = px(pt.x, pt.y)
        text = ZONE_LABELS[zone][0 if lang == 'bg' else 1]
        small = zone in SMALL_ZONES
        labels.append(text_lines(x, y, text.split('\n'), 25 if small else 30, 'zone small' if small else 'zone'))

    # Restaurant pin with the restaurant badge.
    lx, ly = px(LUCIANO.x, LUCIANO.y)
    pin = f'''
<g class="pin" transform="translate({lx:.1f} {ly:.1f})">
  <ellipse cx="0" cy="0" rx="12" ry="4.5" fill="#000" opacity=".55"/>
  <path d="M0 0 C-10 -22 -38 -40 -38 -70 A38 38 0 1 1 38 -70 C38 -40 10 -22 0 0Z" fill="#e7c06c" stroke="#121210" stroke-width="3"/>
  <circle cx="0" cy="-70" r="32" fill="#000"/>
  <image href="data:image/webp;base64,{BADGE_B64}" x="-32" y="-102" width="64" height="64" clip-path="url(#badge)"/>
  <path d="M0 4 L-60 178" stroke="#e7c06c" stroke-width="2"/>
  <g transform="translate(-200 178)">
    <rect width="250" height="70" rx="10" fill="#121210" fill-opacity=".94" stroke="#e7c06c" stroke-width="2"/>
    <text class="pin-name" x="18" y="29">{html.escape(t["pin_name"])}</text>
    <text class="pin-addr" x="18" y="55">{html.escape(t["pin_address"])}</text>
  </g>
</g>'''

    # Context labels.
    def ctx(lon, lat, text, cls, rotate=0):
        x, y = px(*lonlat(lon, lat).coords[0])
        tr = f' transform="rotate({rotate} {x:.1f} {y:.1f})"' if rotate else ''
        return f'<text class="{cls}" x="{x:.1f}" y="{y:.1f}" text-anchor="middle"{tr}>{html.escape(text)}</text>'

    context = [
        ctx(27.9420, 43.1965, t['sea'], 'sea'),
        ctx(27.8790, 43.1975, t['lake'], 'lake'),
        ctx(27.9338, 43.2083, t['park'], 'park', -33),
    ]

    # Scale bar (1 km) and north arrow.
    bar_m = 1000
    bar_px = bar_m * S
    sx, sy = 70, H - 92
    scale = f'''
<g class="scale" transform="translate({sx} {sy})">
  <rect x="-22" y="-44" width="{bar_px + 44:.0f}" height="78" rx="10" fill="#121210" fill-opacity=".85"/>
  <rect x="0" y="0" width="{bar_px / 2:.1f}" height="8" fill="#e7c06c"/>
  <rect x="{bar_px / 2:.1f}" y="0" width="{bar_px / 2:.1f}" height="8" fill="#121210" stroke="#e7c06c" stroke-width="2"/>
  <text class="scale-t" x="0" y="-12" text-anchor="middle">0</text>
  <text class="scale-t" x="{bar_px / 2:.1f}" y="-12" text-anchor="middle">500 {t["m"]}</text>
  <text class="scale-t" x="{bar_px:.1f}" y="-12" text-anchor="middle">1 {t["km"]}</text>
</g>'''
    nx, ny = W - 90, 110
    north = f'''
<g transform="translate({nx} {ny})">
  <circle r="46" fill="#121210" fill-opacity=".85" stroke="#e7c06c" stroke-width="2"/>
  <path d="M0 -34 L13 8 L0 0 L-13 8Z" fill="#e7c06c"/>
  <path d="M0 34 L13 -8 L0 0 L-13 -8Z" fill="#5a4e36"/>
  <text class="north" x="0" y="-52" text-anchor="middle">{t["north"]}</text>
</g>'''

    # Title and legend panel.
    title = f'''
<g transform="translate(860 40)">
  <rect width="520" height="250" rx="16" fill="#121210" fill-opacity=".9" stroke="#3e392d" stroke-width="2"/>
  <text class="title" x="32" y="78">{html.escape(t["title"])}</text>
  <text class="subtitle" x="34" y="118">{html.escape(t["subtitle"])}</text>
  <rect x="34" y="150" width="46" height="30" rx="5" fill="{C["zone_fill"]}" fill-opacity=".3" stroke="{C["zone_line"]}" stroke-width="2.5"/>
  <text class="legend" x="98" y="172">{html.escape(t["legend_zone"])}</text>
  <path transform="translate(57 232) scale(.36)" d="M0 0 C-10 -22 -38 -40 -38 -70 A38 38 0 1 1 38 -70 C38 -40 10 -22 0 0Z" fill="#e7c06c"/>
  <text class="legend" x="98" y="219">{html.escape(t["legend_pin"])}</text>
</g>'''
    attribution = (
        f'<text class="attr" x="{W - 28}" y="{H - 24}" text-anchor="end">{html.escape(t["attribution"])}</text>'
    )

    css = f'''
.zone {{ font: 700 30px Manrope, sans-serif; fill: {C["label"]}; text-anchor: middle; paint-order: stroke; stroke: {C["halo"]}; stroke-width: 7px; stroke-linejoin: round; letter-spacing: .01em; }}
.zone.small {{ font-size: 25px; stroke-width: 6px; }}
.street {{ font: 600 15px Manrope, sans-serif; fill: {C["street"]}; paint-order: stroke; stroke: {C["halo"]}; stroke-width: 4px; stroke-linejoin: round; letter-spacing: .04em; }}
.sea {{ font: italic 500 54px 'Cormorant Garamond', serif; fill: {C["context"]}; letter-spacing: .18em; }}
.lake {{ font: italic 500 36px 'Cormorant Garamond', serif; fill: {C["context"]}; letter-spacing: .12em; }}
.park {{ font: italic 500 30px 'Cormorant Garamond', serif; fill: {C["park_label"]}; letter-spacing: .1em; paint-order: stroke; stroke: {C["halo"]}; stroke-width: 4px; }}
.title {{ font: 500 58px 'Cormorant Garamond', serif; fill: #f3e2b8; }}
.subtitle {{ font: 600 22px Manrope, sans-serif; fill: #c9a85e; letter-spacing: .14em; text-transform: uppercase; }}
.legend {{ font: 600 21px Manrope, sans-serif; fill: #e9dcc0; }}
.pin-name {{ font: 700 22px Manrope, sans-serif; fill: #f3e2b8; }}
.pin-addr {{ font: 600 18px Manrope, sans-serif; fill: #c9b78f; }}
.scale-t {{ font: 600 17px Manrope, sans-serif; fill: #e9dcc0; }}
.north {{ font: 700 18px Manrope, sans-serif; fill: #e7c06c; }}
.attr {{ font: 600 15px Manrope, sans-serif; fill: #8c8572; paint-order: stroke; stroke: {C["halo"]}; stroke-width: 4px; }}
'''

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
  <clipPath id="badge"><circle cx="0" cy="-70" r="31"/></clipPath>
  {''.join(street_defs)}
  <style>{css}</style>
</defs>
<rect width="{W}" height="{H}" fill="{C["land"]}"/>
{''.join(base)}
<g fill="{C["zone_fill"]}" fill-opacity=".24">{zone_fill}</g>
<g fill="none" stroke="#000" stroke-opacity=".6" stroke-width="7" stroke-linejoin="round">{zone_fill}</g>
<g fill="none" stroke="{C["zone_line"]}" stroke-width="3" stroke-linejoin="round">{zone_fill}</g>
{''.join(street_texts)}
{''.join(context)}
{''.join(labels)}
{pin}
{scale}
{north}
{title}
{attribution}
</svg>'''


if __name__ == '__main__':
    with open(BADGE, 'rb') as f:
        BADGE_B64 = base64.b64encode(f.read()).decode()
    zones, _ = build()
    layers = load_layers()
    os.makedirs(OUT, exist_ok=True)
    for lang in ('bg', 'en'):
        with open(os.path.join(OUT, f'delivery-zones-{lang}.svg'), 'w') as f:
            f.write(render(lang, zones, layers))
    feats = [
        {
            'type': 'Feature',
            'properties': {'name': z, 'name_en': ZONE_LABELS[z][1].replace('\n', ' ')},
            'geometry': shapely.geometry.mapping(shapely.set_precision(to_ll(g.simplify(1)), 1e-6)),
        }
        for z, g in zones.items()
    ]
    with open(GEOJSON, 'w') as f:
        json.dump({'type': 'FeatureCollection', 'features': feats}, f, ensure_ascii=False)
        f.write('\n')
    print('ok')
