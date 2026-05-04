"""
Process OSM ALPR data → assign each camera to a Georgia county via point-in-polygon.
Outputs:
  docs/data/cameras.json        - lightweight array {lat, lon, op, dir, fips}
  docs/data/cameras_by_fips.json - {fips5: count}
Also updates counties.json to add `camera_count` and `cameras_per_100k`.
"""
import json
from pathlib import Path

ROOT = Path('/home/user/workspace/ga_risk_dashboard')
OSM = json.load(open('/tmp/overpass-result.json'))
TOPO = json.load(open(ROOT / 'docs/data/ga-counties.json'))
COUNTIES = json.load(open(ROOT / 'docs/data/counties.json'))
SUMMARY = json.load(open(ROOT / 'docs/data/summary.json'))

# --- Decode TopoJSON arcs into county polygons in lon/lat space ---
tx = TOPO['transform']
sx, sy = tx['scale']
ox, oy = tx['translate']

def decode_arc(arc):
    """Delta-decode a single arc → list of [lon, lat]."""
    x = y = 0
    pts = []
    for dx, dy in arc:
        x += dx; y += dy
        pts.append([x * sx + ox, y * sy + oy])
    return pts

decoded_arcs = [decode_arc(a) for a in TOPO['arcs']]

def assemble_ring(arc_indices):
    ring = []
    for i, idx in enumerate(arc_indices):
        if idx >= 0:
            seg = decoded_arcs[idx]
        else:
            seg = decoded_arcs[~idx][::-1]
        if i == 0:
            ring.extend(seg)
        else:
            ring.extend(seg[1:])
    return ring

def assemble_geometry(geom):
    """Returns list of polygons, each polygon = list of rings (outer + holes)."""
    t = geom['type']
    arcs = geom['arcs']
    if t == 'Polygon':
        return [[assemble_ring(r) for r in arcs]]
    if t == 'MultiPolygon':
        return [[assemble_ring(r) for r in poly] for poly in arcs]
    return []

def point_in_ring(lon, lat, ring):
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if ((yi > lat) != (yj > lat)) and (lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-15) + xi):
            inside = not inside
        j = i
    return inside

def point_in_polygon(lon, lat, polygon):
    if not polygon: return False
    if not point_in_ring(lon, lat, polygon[0]): return False
    for hole in polygon[1:]:
        if point_in_ring(lon, lat, hole): return False
    return True

# Build county lookup: fips5 -> [polygons]
county_geoms = {}
county_bbox = {}
for g in TOPO['objects']['counties']['geometries']:
    polys = assemble_geometry(g)
    fips5 = str(g['id'])
    county_geoms[fips5] = polys
    # Bounding box for fast pre-filter
    xs = [p[0] for poly in polys for ring in poly for p in ring]
    ys = [p[1] for poly in polys for ring in poly for p in ring]
    county_bbox[fips5] = (min(xs), min(ys), max(xs), max(ys))

print(f'Loaded {len(county_geoms)} county geometries')

# --- Assign each camera to a county ---
cameras = []
unmatched = 0
for el in OSM.get('elements', []):
    if 'lat' not in el or 'lon' not in el:
        continue
    lat = el['lat']; lon = el['lon']
    tags = el.get('tags', {})
    # Identify operator
    op_raw = tags.get('operator') or tags.get('manufacturer') or tags.get('brand') or ''
    is_flock = 'flock' in op_raw.lower() or tags.get('operator:wikidata') == 'Q108485435' or tags.get('manufacturer:wikidata') == 'Q108485435' or tags.get('brand:wikidata') == 'Q108485435'
    operator_clean = 'Flock Safety' if is_flock else (op_raw or 'Unknown')
    direction = tags.get('direction', '')
    try:
        direction = int(float(direction)) if direction != '' else None
    except (ValueError, TypeError):
        direction = None

    # Find county via bbox + PIP
    matched = None
    for fips5, (minx, miny, maxx, maxy) in county_bbox.items():
        if lon < minx or lon > maxx or lat < miny or lat > maxy:
            continue
        for poly in county_geoms[fips5]:
            if point_in_polygon(lon, lat, poly):
                matched = fips5
                break
        if matched:
            break

    if matched is None:
        unmatched += 1
        continue

    cameras.append({
        'lat': round(lat, 5),
        'lon': round(lon, 5),
        'op': operator_clean,
        'flk': 1 if is_flock else 0,
        'dir': direction,
        'f': matched,  # fips5
    })

print(f'Cameras processed: {len(cameras)} ({unmatched} unmatched dropped)')
print(f'Flock-confirmed: {sum(1 for c in cameras if c["flk"])}')

# --- Per-county counts ---
from collections import Counter
counts = Counter(c['f'] for c in cameras)
flock_counts = Counter(c['f'] for c in cameras if c['flk'])

# Update COUNTIES with camera_count + per-100k
def fips5(c): return '13' + str(c['fips']).zfill(3)

for c in COUNTIES:
    f = fips5(c)
    cc = counts.get(f, 0)
    fc = flock_counts.get(f, 0)
    c['camera_count'] = cc
    c['flock_camera_count'] = fc
    pop = c.get('total_pop') or 0
    c['cameras_per_100k'] = round(cc / pop * 100000, 1) if pop else 0

# Top counties report
top = sorted(COUNTIES, key=lambda x: -x['camera_count'])[:15]
print('\nTop 15 counties by camera count:')
for r in top:
    print(f"  {r['county']:20} cams={r['camera_count']:5}  flock={r['flock_camera_count']:5}  per100k={r['cameras_per_100k']:6.1f}  pop={r['total_pop']:>9,}")

print(f'\nTotal counties with >=1 camera: {sum(1 for c in COUNTIES if c["camera_count"] > 0)}')
print(f'Counties with Flock-confirmed cameras: {sum(1 for c in COUNTIES if c["flock_camera_count"] > 0)}')

# --- Write outputs ---
# Lightweight cameras file (used by the map dot layer)
out_cams = {
    'count': len(cameras),
    'flock_count': sum(1 for c in cameras if c['flk']),
    'cameras': cameras,
}
with open(ROOT / 'docs/data/cameras.json', 'w') as f:
    json.dump(out_cams, f, separators=(',', ':'))

with open(ROOT / 'docs/data/counties.json', 'w') as f:
    json.dump(COUNTIES, f)

# Update summary
SUMMARY['camera_total'] = len(cameras)
SUMMARY['camera_flock_confirmed'] = sum(1 for c in cameras if c['flk'])
SUMMARY['counties_with_cameras'] = sum(1 for c in COUNTIES if c['camera_count'] > 0)
with open(ROOT / 'docs/data/summary.json', 'w') as f:
    json.dump(SUMMARY, f, indent=2)

import os
for p in ['cameras.json', 'counties.json', 'summary.json']:
    sz = os.path.getsize(ROOT / 'docs/data' / p)
    print(f'  {p}: {sz:,} bytes')
