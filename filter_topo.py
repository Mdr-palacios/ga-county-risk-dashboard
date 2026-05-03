"""Filter us-atlas counties-10m.json to just Georgia (state FIPS 13)."""
import json

src = "/tmp/us-counties-10m.json"
out = "/home/user/workspace/ga_risk_dashboard/dist/data/ga-counties.json"

with open(src) as f:
    topo = json.load(f)

# us-atlas structure: objects.counties.geometries[].id is 5-digit FIPS string
counties = topo["objects"]["counties"]["geometries"]
ga = [g for g in counties if str(g.get("id", "")).startswith("13")]
print(f"Total US counties: {len(counties)}; GA counties: {len(ga)}")

# Build a minimal topology with only GA counties.
# We need to keep the arcs they reference. Collect arc indices.
def collect_arcs(arcs_field, used):
    """Recursively walk a geometry's arcs field and collect arc indices."""
    if isinstance(arcs_field, int):
        # Negative arcs are encoded as ~i (one's complement)
        used.add(arcs_field if arcs_field >= 0 else ~arcs_field)
    elif isinstance(arcs_field, list):
        for item in arcs_field:
            collect_arcs(item, used)

used_arcs = set()
for g in ga:
    if "arcs" in g:
        collect_arcs(g["arcs"], used_arcs)

print(f"Arcs used: {len(used_arcs)} / {len(topo['arcs'])}")

# Remap arcs: build new arc list and old->new index map
sorted_used = sorted(used_arcs)
old_to_new = {old: new for new, old in enumerate(sorted_used)}
new_arcs = [topo["arcs"][i] for i in sorted_used]

# Remap geometry arc references
def remap(arcs_field):
    if isinstance(arcs_field, int):
        if arcs_field >= 0:
            return old_to_new[arcs_field]
        else:
            return ~old_to_new[~arcs_field]
    elif isinstance(arcs_field, list):
        return [remap(item) for item in arcs_field]
    return arcs_field

for g in ga:
    if "arcs" in g:
        g["arcs"] = remap(g["arcs"])

# Compute GA bbox from arc coordinates (approximate, in delta-coords; better to derive from properties)
# Just emit the topology with original transform; D3 handles it fine.
ga_topo = {
    "type": "Topology",
    "transform": topo["transform"],
    "arcs": new_arcs,
    "objects": {
        "counties": {
            "type": "GeometryCollection",
            "geometries": ga,
        }
    },
}

with open(out, "w") as f:
    json.dump(ga_topo, f, separators=(",", ":"))

import os
print(f"Wrote {out}: {os.path.getsize(out):,} bytes")

# Sanity check: list the GA county FIPS
fips = sorted([str(g["id"]) for g in ga])
print(f"GA FIPS range: {fips[0]}..{fips[-1]}; sample: {fips[:5]}")
print(f"Sample names: {[g.get('properties', {}).get('name') for g in ga[:5]]}")
