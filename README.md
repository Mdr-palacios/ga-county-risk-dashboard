# Georgia County Risk Dashboard

A coalition data dashboard from **Common Cause Georgia** tracking county-level immigration enforcement risk across all 159 Georgia counties.

**Live site:** https://mdr-palacios.github.io/ga-county-risk-dashboard/

## What's in the dashboard

- Interactive choropleth map of all 159 Georgia counties
- Risk tier distribution (Critical / High / Medium / Low) using a v3 composite model
- 287(g) participation by program model (Task Force, Jail Enforcement, Warrant Service Officer, hybrids)
- Surveillance mesh scoring (Flock LPR deployment, APD data sharing, FUSUS connection, documented ICE queries)
- Sortable, searchable, filterable county table with CSV export
- Light and dark mode

## Risk model (v3)

Composite score combining:

- 287(g) status (up to 25 pts)
- Foreign-born population share (up to 25 pts)
- Hispanic population share (up to 25 pts)
- ICE infrastructure proximity (up to 25 pts)
- HB 1105 base contribution (5 pts)
- Observed arrests (up to ~20 pts)
- Surveillance mesh density (up to ~10 pts)

**Tiers:** Critical >= 100, High 70 to 99, Medium 40 to 69, Low < 40.

The model is directional, not predictive: a county scoring "Medium" is not safe; it just has fewer of the indicators we can track from public sources.

## Data sources

- Demographics: U.S. Census ACS 5-year, 2018 to 2022
- 287(g): ICE program list, cross-referenced with county sheriff and city PD announcements
- Surveillance: Flock Safety deployment records, EFF reporting, local press
- Observed arrests: aggregated coalition incident reports

## What's intentionally NOT in this dashboard

To protect operational and personnel security, the public dashboard excludes:

- Observer deployment locations and shift counts
- Attorney roster and escalation triggers
- Named contacts at sheriff or GBI offices
- Older risk-model versions (only v3 is exposed)

## Stack

- Static HTML, CSS, vanilla JS
- D3 v7 + topojson-client for the map
- Inter and JetBrains Mono via Google Fonts
- No build step; no backend; no tracking

## Local preview

```bash
cd dist
python3 -m http.server 8000
# open http://localhost:8000
```

## Contact

Rosario Palacios, Executive Director, Common Cause Georgia
rosario@palacios.community
