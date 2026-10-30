"""Build delivery zones from real street blocks.

Every street splits the city into small blocks; each goes to the closest
neighbourhood seed. Seeds are landmarks, businesses whose name or address
carries the neighbourhood's name, and (for Генералите) the generals' streets
that give the quarter its name. Seeds of neighbouring areas outside the
delivery area stop zones from spreading past their real extent.

Main roads then group the small blocks: a main-road block goes to one zone as a
whole when that zone holds most of it, so borders follow boulevards wherever
the neighbourhoods agree and side streets only where they genuinely meet.
"""

import re

import shapely
from shapely.ops import polygonize, unary_union

from mapdata import layer, lonlat

BORDER_CLASSES = {'motorway', 'trunk', 'primary', 'secondary', 'tertiary'}
FINE_CLASSES = {'residential', 'unclassified', 'living_street', 'pedestrian'}
# Share of a main-road block one label needs to take the whole block.
MAJORITY = 0.5
GAP_FILL = 200

# Anchors are (lon, lat) from Overture places; radius (m) caps the zone's reach from them.
ZONES = {
    'Център': {
        # Cathedral, Независимост square, Luciano, Overture's Център point.
        'anchors': [(27.90990, 43.20524), (27.91268, 43.20385), (27.91163, 43.20335), (27.90983, 43.20588)],
        'radius': 850,
    },
    'Гръцка махала': {
        # Roman Thermae and Overture's Гръцката махала point.
        'anchors': [(27.91819, 43.20022), (27.91969, 43.20116), (27.91928, 43.20325)],
        'name': r'гръцка(та)? махала|в гръцката',
        'radius': 650,
    },
    'Фестивален комплекс': {
        # Festival and Congress Centre, бул. Сливница 2.
        'anchors': [(27.92224, 43.20420)],
        'address': r'фестивален и конгресен|festival complex',
        # Many businesses give the venue as their address from elsewhere; trust only pins at the venue.
        'evidence_radius': 200,
        'radius': 550,
    },
    'Колхозен пазар': {
        'anchors': [(27.90363, 43.20965)],
        'name': r'колхоз|kolhoz|kolohoz',
        'radius': 650,
    },
    'Окръжна болница': {
        # МБАЛ „Света Анна“, бул. Цар Освободител 100.
        'anchors': [(27.91706, 43.21459), (27.91748, 43.21479)],
        'name': r'окръжна болница|света анна',
        'radius': 700,
    },
    'Генералите': {
        'anchors': [(27.91991, 43.21251), (27.92150, 43.21240)],
        'name': r'генералите',
        'streets': r'^(Ген\.|Генерал) (?!Колев|Георги Попов|Кантарджиев|Петър Кюркчиев|Радко)',
        'street_radius': 280,
        'radius': 500,
    },
    'Червен площад': {
        # The ул. Княз Николаевич / ул. Иван Аксаков junction and бул. Цар Освободител 12.
        'anchors': [(27.92297, 43.21042), (27.92126, 43.20926)],
        'name': r'червен площад',
        'radius': 650,
    },
    'Чаталджа': {
        # Chataldzha market and the ул. Цар Иван Асен / ул. Драва Чех junction.
        'anchors': [(27.92453, 43.21522), (27.92315, 43.21365)],
        'name': r'чаталджа|chataldj|chataldzh',
        'radius': 800,
    },
    'Спортна зала': {
        # Дворец на културата и спорта, бул. Княз Борис I 115.
        'anchors': [(27.93089, 43.21042)],
        'address': r'дворец на културата|palace of culture|спортна зала, bul',
        'radius': 700,
    },
    'Левски': {
        'anchors': [(27.92146, 43.22355), (27.93170, 43.22335)],
        'name': r'(кв\.|ж\.к\.|квартал|varna) ?левски|levski|базар левски',
        'exclude': r'васил левски|vasil levski|училище',
        'radius': 1000,
    },
    'Трошево': {
        'anchors': [(27.88272, 43.22256)],
        'name': r'трошево|troshevo',
        'address': r'трошево|troshevo',
        'radius': 1100,
    },
}

# Neighbouring areas outside the delivery area (Overture division points and landmarks).
OUTSIDE = {
    'Цветен квартал': (27.91383, 43.22386),
    'Победа': (27.90137, 43.22441),
    'кв. Христо Ботев': (27.89570, 43.21057),
    'Максуда': (27.88839, 43.21110),
    'Св. Иван Рилски': (27.88532, 43.21394),
    'Чайка': (27.93970, 43.21590),
    'Бриз': (27.95027, 43.22149),
    'Изгрев': (27.92091, 43.23424),
    'Младост 2': (27.88545, 43.23000),
    'Младост 1': (27.87385, 43.23191),
    'Възраждане 3': (27.89417, 43.23366),
    'ЖП гара': (27.91222, 43.19806),
    'Аспарухово': (27.89709, 43.18049),
    'Западна промишлена зона': (27.86490, 43.21790),
    # Varna Towers / Retail Park: businesses there give „Западна промишлена зона Младост“ as their address.
    'Западна промишлена зона (Varna Towers)': (27.87642, 43.22173),
    'Южна промишлена зона': (27.89440, 43.19160),
    'Пристанище': (27.90930, 43.19640),
    'Морска градина (плаж)': (27.92450, 43.20100),
    'Морска градина': (27.93000, 43.20600),
}


def centre_of(cfg):
    return shapely.MultiPoint([lonlat(*a) for a in cfg['anchors']]).centroid


def evidence(places, segs, cfg):
    pts = [lonlat(*a) for a in cfg['anchors']]
    centre = centre_of(cfg)
    name_re = re.compile(cfg['name'], re.I) if cfg.get('name') else None
    addr_re = re.compile(cfg['address'], re.I) if cfg.get('address') else None
    excl_re = re.compile(cfg['exclude'], re.I) if cfg.get('exclude') else None
    for p in places:
        name = p['name'] or ''
        addr = ' '.join((a or {}).get('freeform') or '' for a in (p.get('addresses') or []))
        hit = (name_re and name_re.search(name)) or (addr_re and addr_re.search(addr))
        if not hit or (excl_re and excl_re.search(name + ' ' + addr)):
            continue
        # Drop stray pins far from the neighbourhood (mis-geocoded businesses).
        if p['geom'].distance(centre) <= cfg.get('evidence_radius', cfg['radius']):
            pts.append(p['geom'])
    if cfg.get('streets'):
        street_re = re.compile(cfg['streets'])
        for s in segs:
            if s['name'] and street_re.search(s['name']):
                line = s['geom']
                for d in range(0, int(line.length) + 1, 40):
                    pt = line.interpolate(d)
                    if pt.distance(centre) <= cfg['street_radius']:
                        pts.append(pt)
    return pts


def build():
    segs = layer('transportation-segment', ['geometry', 'names', 'subtype', 'class'])
    water = layer('base-water', ['geometry', 'names', 'subtype', 'class'])
    land_use = layer('base-land_use', ['geometry', 'names', 'subtype', 'class'])
    places = layer('places-place', ['geometry', 'names', 'addresses'])

    sea = unary_union([w['geom'] for w in water if w['subtype'] in ('ocean', 'lake') or w['class'] == 'dock'])
    excluded = unary_union(
        [u['geom'] for u in land_use if u['name'] == 'Морска градина' or (u['name'] or '').startswith('Пристанище')]
    )

    lo, hi = lonlat(27.86, 43.185), lonlat(27.96, 43.24)
    frame = shapely.box(lo.x, lo.y, hi.x, hi.y)
    land = frame.difference(sea).difference(excluded)

    def blocks_from(classes):
        lines = [s['geom'] for s in segs if s['subtype'] == 'road' and s['class'] in classes]
        lines += [frame.exterior, sea.boundary, excluded.boundary]
        out = []
        for b in polygonize(unary_union(lines)):
            b = b.intersection(land)
            if not b.is_empty and b.area > 50:
                out.append(b)
        return out

    coarse = blocks_from(BORDER_CLASSES)
    fine = blocks_from(BORDER_CLASSES | FINE_CLASSES)
    fine_points = [f.representative_point() for f in fine]
    fine_tree = shapely.STRtree(fine_points)

    seeds = []
    for zone, cfg in ZONES.items():
        seeds += [(p, zone) for p in evidence(places, segs, cfg)]
    seeds += [(lonlat(*ll), None) for ll in OUTSIDE.values()]
    seed_tree = shapely.STRtree([s[0] for s in seeds])
    centres = {z: centre_of(cfg) for z, cfg in ZONES.items()}

    def label(pt):
        zone = seeds[seed_tree.nearest(pt)][1]
        if zone is None or pt.distance(centres[zone]) > ZONES[zone]['radius']:
            return None
        return zone

    fine_label = [label(p) for p in fine_points]

    assigned = {z: [] for z in ZONES}
    for block in coarse:
        members = fine_tree.query(block, predicate='contains')
        if len(members) == 0:
            zone = label(block.representative_point())
            if zone:
                assigned[zone].append(block)
            continue
        share = {}
        for i in members:
            share[fine_label[i]] = share.get(fine_label[i], 0) + fine[i].area
        top = max(share, key=share.get)
        if share[top] >= MAJORITY * sum(share.values()):
            if top:
                assigned[top].append(block)
        else:
            for i in members:
                if fine_label[i]:
                    assigned[fine_label[i]].append(fine[i].intersection(block))

    # Fill holes and gaps narrower than ~400 m between zones, giving each gap to the
    # zone it shares the longest border with, so the delivery area has no holes.
    bodies = {z: unary_union(parts) for z, parts in assigned.items()}
    taken = unary_union(list(bodies.values()))
    closed = taken.buffer(GAP_FILL).buffer(-GAP_FILL)
    closed = unary_union([shapely.Polygon(p.exterior) for p in getattr(closed, 'geoms', [closed])])
    gaps = closed.difference(taken).intersection(land)
    for gap in getattr(gaps, 'geoms', [gaps]):
        if gap.geom_type != 'Polygon' or gap.area < 20:
            continue
        edge = gap.buffer(3)
        zone = max(bodies, key=lambda z: edge.intersection(bodies[z]).area)
        assigned[zone].append(gap)

    def unions():
        # Close hairline cracks, then drop road-width slivers (under ~16 m) that poke into neighbours.
        return {z: unary_union(parts).buffer(4).buffer(-4).buffer(-8).buffer(8) for z, parts in assigned.items()}

    # A fragment cut off from its zone's main body joins the neighbour it shares
    # the longest border with; isolated crumbs are dropped.
    zones = unions()
    for zone, u in zones.items():
        if u.geom_type != 'MultiPolygon':
            continue
        biggest = max(u.geoms, key=lambda g: g.area)
        assigned[zone] = [g for g in u.geoms if g.area > 0.15 * biggest.area]
        for g in u.geoms:
            if g.area > 0.15 * biggest.area:
                continue
            edge = g.buffer(8)
            shared = {o: edge.intersection(zones[o]).area for o in zones if o != zone}
            best = max(shared, key=shared.get)
            if shared[best] > 0:
                assigned[best].append(g)
    zones = unions()
    for zone, u in zones.items():
        if u.geom_type == 'MultiPolygon':
            biggest = max(u.geoms, key=lambda g: g.area)
            zones[zone] = unary_union([g for g in u.geoms if g.area > 0.15 * biggest.area])

    # Removing slivers can leave thin cracks; each goes to the zone around it.
    taken = unary_union(list(zones.values()))
    closed = taken.buffer(GAP_FILL).buffer(-GAP_FILL)
    closed = unary_union([shapely.Polygon(p.exterior) for p in getattr(closed, 'geoms', [closed])])
    cracks = closed.difference(taken).intersection(land)
    for crack in getattr(cracks, 'geoms', [cracks]):
        if crack.geom_type != 'Polygon' or crack.is_empty:
            continue
        edge = crack.buffer(3)
        zone = max(zones, key=lambda n: edge.intersection(zones[n]).area)
        zones[zone] = unary_union([zones[zone], crack]).buffer(2).buffer(-2)
    return zones, seeds


if __name__ == '__main__':
    zones, _ = build()
    for z, g in zones.items():
        print(f'{z:22s} {g.area / 1e4:7.1f} ha  {g.geom_type}')
