# Delivery zones map

The Contact page (`/contact/`, `/en/contact/`) shows the delivery zones on a map drawn from real map data. It replaces a hand-drawn illustration whose streets, coastline and neighbourhood positions did not match Varna (for example, it placed Фестивален комплекс and Спортна зала in the west; both are by Морска градина in the east).

- `public/images/delivery/delivery-zones-{bg,en}.webp`: 2400 × 1600 maps with Bulgarian or English labels.
- `public/images/delivery/delivery-zones-{bg,en}-1200.webp`: the same maps at 1200 × 800 for phones.
- `docs/delivery-zones.geojson`: the zone polygons (WGS 84), for checking in any GIS tool or geojson.io.
- `content/delivery.ts`: the zone names listed under the map.
- `scripts/delivery-map/`: the generator.

## Data and accuracy

Every street, building, park, coastline, the port and Varna Lake come from the [Overture Maps](https://overturemaps.org/) release `2026-10-21.0`, whose streets, water, land use and buildings are derived from OpenStreetMap. Nothing on the base map is drawn by hand.

- The projection is a Transverse Mercator centred on Varna: north is exactly up and the 1 km scale bar is true across the whole map.
- The restaurant pin is the Overture place record for Luciano, ул. „Русе“ 13 (43.20335 N, 27.91163 E).
- Street names on the map are the boulevards' names in the data; English labels are transliterated.

Licence: streets, water, land use and buildings are ODbL, so the map image and the caption under it carry „© OpenStreetMap contributors, Overture Maps Foundation“ with a link to the OpenStreetMap copyright page. Places data is CDLA-Permissive-2.0. Keep the attribution whenever the image is reused.

## How the zones are drawn

Most of these names are informal neighbourhoods with no official boundary, so the zones are built from evidence in the data and always run along real streets:

1. Every street splits the city into small blocks.
2. Each zone has seeds: a landmark, plus every business whose name or address carries the neighbourhood name (for example „Еконт Чаталджа“, „Берьозка Червен площад“, addresses on „ж.к. Трошево“). Генералите also uses the streets named after generals (Гурко, Паренсов, Скобелев, Столетов, Столипин, Цимерман, Киселов) that give the quarter its name.
3. Neighbouring areas outside the delivery area are seeds too (Чайка, Победа, Цветен квартал, Христо Ботев, Максуда, ЖП гара, the port, Морска градина, and the Varna Towers retail area, whose businesses give „Западна промишлена зона Младост“ as their address), so zones stop where those areas begin.
4. Each block joins the zone of its nearest seed. A block bounded by main roads goes to one zone as a whole when that zone holds most of it, so borders follow boulevards wherever possible.
5. Gaps between zones go to the zone sharing the longest border; the sea, the port and Морска градина are left out.

| Zone                | Landmark                                       | Main border streets                                                 |
| ------------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| Център              | Cathedral, пл. Независимост, Luciano           | ул. Девня, бул. Христо Ботев, бул. Мария Луиза, бул. Сливница       |
| Гръцка махала       | Римски терми                                   | бул. Приморски, ул. Шипка, ул. Преслав, ул. Стефан Стамболов        |
| Фестивален комплекс | Фестивален и конгресен център, бул. Сливница 2 | бул. Приморски, бул. Цар Освободител, бул. Княз Борис I             |
| Червен площад       | ул. Княз Николаевич / ул. Иван Аксаков         | бул. Цар Освободител, бул. Мария Луиза, бул. Княз Борис I           |
| Колхозен пазар      | Колхозен пазар                                 | бул. Сливница, бул. Владислав Варненчик, бул. Христо Ботев          |
| Окръжна болница     | МБАЛ „Света Анна“, бул. Цар Освободител 100    | бул. Сливница, бул. Цар Освободител, бул. Васил Левски              |
| Генералите          | the generals' streets                          | бул. Цар Освободител, бул. 8-ми Приморски полк, бул. Генерал Колев  |
| Чаталджа            | Пазар Чаталджа, бул. Чаталджа 35               | бул. 8-ми Приморски полк, бул. Генерал Колев, бул. Чаталджа         |
| Спортна зала        | Дворец на културата и спорта                   | бул. Княз Борис I, бул. 8-ми Приморски полк, бул. Цар Освободител   |
| Левски              | кв. Левски, базар Левски                       | бул. Христо Смирненски, бул. 8-ми Приморски полк, бул. Васил Левски |
| Трошево             | ж.к. Трошево                                   | бул. Сливница, бул. Владислав Варненчик, бул. Янош Хунияди          |

The restaurant decides its delivery area. To move a border, change a zone's anchors or `radius` in `scripts/delivery-map/zones.py` (or add a seed to `OUTSIDE`), regenerate, and check the result in `docs/delivery-zones.geojson`. Changing the list of zones also means updating `content/delivery.ts` and the English names in `i18n/en.ts` and `ZONE_LABELS` in `render.py`.

## Regenerating

Requirements: Python 3 (tested with 3.13), Node, the project's `node_modules`, and Playwright with Chromium (used to draw the SVG with the site's own Manrope and Cormorant Garamond fonts).

```sh
python3 -m venv .venv-delivery-map
.venv-delivery-map/bin/pip install -r scripts/delivery-map/requirements.txt
.venv-delivery-map/bin/python scripts/delivery-map/fetch_overture.py
.venv-delivery-map/bin/python scripts/delivery-map/render.py
node scripts/delivery-map/rasterize.mjs
```

`fetch_overture.py` downloads only the Varna slice (about 20 MB) from Overture's public bucket `overturemaps-us-west-2.s3.us-west-2.amazonaws.com` into the ignored `scripts/delivery-map/.data/`. To use newer data, set `RELEASE` to the latest folder listed at `https://overturemaps-us-west-2.s3.us-west-2.amazonaws.com/?list-type=2&prefix=release/&delimiter=/`.

OpenStreetMap's own servers (`overpass-api.de`, `download.geofabrik.de`) refused connections from this project's Claude cloud sessions in October 2026, which is why the generator uses Overture's copy of the same data.
