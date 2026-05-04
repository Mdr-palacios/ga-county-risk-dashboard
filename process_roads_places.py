"""Process GA interstate highways + cities/towns from OSM into compact JSON for the dashboard.

- Interstates: keep `highway=motorway` ways with ref starting "I "; group by ref;
  output as MultiLineString per interstate (e.g. I-75, I-85, I-285).
- Places: keep place=city or place=town; output as {name, lon, lat, place, pop}.

Inputs: /tmp/ga-roads.json, /tmp/ga-places.json (Overpass API output)
Outputs: docs/data/roads.json, docs/data/places.json
"""

import json
from pathlib import Path
from collections import defaultdict
from shapely.geometry import LineString
from shapely.ops import linemerge, unary_union

OUT_DIR = Path('/home/user/workspace/ga_risk_dashboard/docs/data')

# ---------- ROADS ----------
roads = json.load(open('/tmp/ga-roads.json'))
elements = roads['elements']

interstate_segments = defaultdict(list)  # ref -> list of [[lon,lat], ...]
for el in elements:
    if el.get('type') != 'way':
        continue
    tags = el.get('tags', {})
    if tags.get('highway') != 'motorway':
        continue
    ref = (tags.get('ref') or '').split(';')[0].strip()
    if not ref.startswith('I '):
        continue
    geom = el.get('geometry') or []
    if len(geom) < 2:
        continue
    # Reduce precision to 5 decimals (~1 m)
    coords = [[round(g['lon'], 5), round(g['lat'], 5)] for g in geom]
    interstate_segments[ref].append(coords)

# Merge contiguous segments per interstate, then simplify with Douglas-Peucker
# Tolerance ~0.001 deg (~100 m) is plenty for small zoom maps
SIMPLIFY_TOL = 0.001

features = []
for ref, segs in sorted(interstate_segments.items()):
    # Skip toll spurs: they duplicate the main interstate
    if 'Toll' in ref:
        continue
    lines = [LineString(s) for s in segs if len(s) >= 2]
    if not lines:
        continue
    merged = linemerge(unary_union(lines))
    # Result may be LineString or MultiLineString
    if merged.geom_type == 'LineString':
        merged_list = [merged]
    else:
        merged_list = list(merged.geoms)
    out_segs = []
    for ln in merged_list:
        simp = ln.simplify(SIMPLIFY_TOL, preserve_topology=False)
        if simp.is_empty or len(simp.coords) < 2:
            continue
        out_segs.append([[round(x, 4), round(y, 4)] for x, y in simp.coords])
    features.append({
        'ref': ref,
        'name': ref.replace(' ', '-'),
        'segments': out_segs,
    })

# Print stats
total_pts = sum(sum(len(s) for s in f['segments']) for f in features)
print(f'Interstates after merge+simplify: {len(features)}; total vertices: {total_pts}')
for f in features:
    pts = sum(len(s) for s in f['segments'])
    print(f"  {f['name']:10s} {len(f['segments']):4d} segments  {pts:6d} pts")

(OUT_DIR / 'roads.json').write_text(json.dumps({'interstates': features}))
print(f'Wrote roads.json ({(OUT_DIR / "roads.json").stat().st_size / 1024:.1f} KB)')

# ---------- PLACES ----------
places = json.load(open('/tmp/ga-places.json'))
out_places = []
for el in places['elements']:
    if el.get('type') != 'node':
        continue
    tags = el.get('tags', {})
    name = tags.get('name')
    if not name:
        continue
    place_type = tags.get('place', '')
    pop = tags.get('population')
    try:
        pop_int = int(pop) if pop else 0
    except ValueError:
        pop_int = 0
    out_places.append({
        'n': name,
        'lon': round(el['lon'], 5),
        'lat': round(el['lat'], 5),
        'p': place_type,    # 'city' or 'town'
        'pop': pop_int,
    })

# Sort by population desc
out_places.sort(key=lambda p: -p['pop'])
print(f'\nPlaces: {len(out_places)}')
print('Top 10 by population:')
for p in out_places[:10]:
    print(f"  {p['n']:25s} {p['p']:6s} {p['pop']:>10,}")

(OUT_DIR / 'places.json').write_text(json.dumps({'places': out_places}))
print(f'Wrote places.json ({(OUT_DIR / "places.json").stat().st_size / 1024:.1f} KB)')
