#!/usr/bin/env python3
"""Build the Mississippi county risk dataset.

Methodology (parallel to Georgia but adapted):
  Baseline floor (statewide, applies to all 82 counties):
    HB 538 (2026): state mandate forcing all MS public agencies / law enforcement
    to cooperate with ICE; bans sanctuary policies; AG has enforcement authority.
    Acts as the floor of risk; +5 baseline points per county.

  Per-county risk score (0 - 100+):
    score_287g          : 0, 12, 18, or 25 based on Task Force / WSO / JEM model
    score_raid_2019     : 25 for direct 2019 plant location, 12 for adjacent
                          residential community where families lived, 0 otherwise
    score_detention     : 25 for hosting an ICE-contracted detention facility,
                          12 for adjacent / processing-hub county, 0 otherwise
    score_foreign_born  : 0 - 25 scaled (linearly) on foreign-born % (cap ~10%)
    score_hispanic      : 0 - 23 scaled on Hispanic %
    score_meatpacking   : 0 - 20 based on poultry / meatpacking employer density
    score_flock         : 0 - 15 based on Flock Safety ALPR camera density,
                          using DeFlock.me crowdsourced data
    score_hb538_base    : 5 baseline (every county)

  Tiers:
    Critical : >= 70   (multiple stacked factors)
    High     : 50 - 69
    Medium   : 25 - 49
    Low      : < 25

Sources (all confirmed in research):
  - 2019 raids (Aug 7): Morton (Scott, Koch + PH), Carthage (Leake, Pearl River
    Foods), Canton (Madison, PECO), Pelahatchie (Rankin, A&B), Walnut Grove
    (Leake, PECO), Bay Springs (Jasper, PECO), Sebastopol (Scott, PECO).
    Families also concentrated in Forest (Scott) and Laurel (Jones).
    [Mississippi Today, Mississippi Free Press, BBC]
  - Active 287(g) (as of Feb 17, 2026): Madison Co Sheriff (since 2018),
    Hancock Co Sheriff (since 2020), plus 2 other sheriffs + State Auditor
    + MS DPS pending in Hinds. [Prison Policy Initiative, MS Independent]
  - Detention: Adams Co Correctional Center (Natchez, ~2,154 ICE/day),
    Tallahatchie Co Correctional Facility (Tutwiler). [Mississippi Today]
  - HB 538 (2026): statewide ICE-cooperation mandate. [Mississippi Free Press]
  - Flock Safety ALPR network: DeFlock.me / DontGetFlocked.com mapped 891
    Flock cameras across 41+ MS cities. EFF (May 2026) documented MS agencies
    using Flock to run background checks. Vicksburg approved 10 cameras
    April 6, 2026. [DeFlock.me, EFF, Vicksburg Daily News]
  - Population baseline: 2020 Census via Wikipedia.
  - Hispanic / foreign-born estimates: ACS 2023 5-year (compiled from
    DataUSA / Census Reporter for high-concentration counties; estimated
    for low-density counties using known regional patterns).
"""
import json

# Statewide baseline
HB538_BASE = 5

# Flock Safety ALPR cameras per city, mapped to county.
# Source: DeFlock.me / DontGetFlocked.com crowdsourced map (891 MS cameras),
# confirmed against Vicksburg Daily News (April 2026) and EFF (May 2026).
# Format: county -> {"cities": [(city, camera_count), ...], "total": int}
FLOCK_BY_COUNTY = {
    # Jackson metro
    "Madison":    {"cities": [("Ridgeland", 55), ("Gluckstadt", 8), ("Madison", 6), ("Canton", 4)], "total": 73},
    "Hinds":      {"cities": [("Jackson", 35), ("Raymond", 8), ("Clinton", 2), ("Terry", 1)], "total": 46},
    "Rankin":     {"cities": [("Flowood", 11), ("Pearl", 7), ("Florence", 5)], "total": 23},
    # Memphis suburbs (DeSoto County)
    "DeSoto":     {"cities": [("Olive Branch", 29), ("Southaven", 28), ("Hernando", 5), ("Horn Lake", 5)], "total": 67},
    # Gulf Coast
    "Harrison":   {"cities": [("Gulfport", 28), ("D'Iberville", 18), ("Long Beach", 3)], "total": 49},
    "Hancock":    {"cities": [("Bay St. Louis", 19)], "total": 19},
    "Jackson":    {"cities": [("Gautier", 6), ("Ocean Springs", 3)], "total": 9},
    # Northeast MS
    "Lee":        {"cities": [("Tupelo", 18)], "total": 18},
    "Copiah":     {"cities": [("Crystal Springs", 9)], "total": 9},
    "Tate":       {"cities": [("Senatobia", 8)], "total": 8},
    "Lafayette":  {"cities": [("Oxford", 7)], "total": 7},
    "Lauderdale": {"cities": [("Meridian", 7)], "total": 7},
    "Scott":      {"cities": [("Forest", 5)], "total": 5},
    "Grenada":    {"cities": [("Grenada", 5)], "total": 5},
    "Forrest":    {"cities": [("Hattiesburg", 5), ("Petal", 4)], "total": 9},
    "Attala":     {"cities": [("Kosciusko", 4)], "total": 4},
    "Prentiss":   {"cities": [("Booneville", 3)], "total": 3},
    "Lowndes":    {"cities": [("Columbus", 3)], "total": 3},
    "Oktibbeha":  {"cities": [("Starkville", 3)], "total": 3},
    "Pontotoc":   {"cities": [("Pontotoc", 2)], "total": 2},
    "Leake":      {"cities": [("Carthage", 2)], "total": 2},
    "Neshoba":    {"cities": [("Philadelphia", 2)], "total": 2},
    "Washington": {"cities": [("Greenville", 2)], "total": 2},
    "Union":      {"cities": [("Sherman", 1)], "total": 1},
    "Bolivar":    {"cities": [("Cleveland", 1)], "total": 1},
    "Warren":     {"cities": [("Vicksburg", 1)], "total": 1},
}

# Flock scoring: 0 - 15 points based on camera density.
# Tiers tuned so the heavy-surveillance metros (Jackson metro, Memphis suburbs,
# Gulf Coast) hit the top of the scale.
def score_flock(total):
    if total >= 40:
        return 15  # heavy mesh (Madison, DeSoto, Harrison, Hinds)
    if total >= 20:
        return 12  # dense (Rankin, Hancock)
    if total >= 10:
        return 9   # moderate (Lee, Forrest)
    if total >= 5:
        return 6   # light mesh
    if total >= 1:
        return 3   # at least one confirmed Flock city
    return 0

# 287(g) participants. Source: Prison Policy Initiative table (Feb 2026)
# + MS Independent reporting (Jan 2026).
# Format: county -> (model, agencies, count)
PROG_287G = {
    "Madison": ("Jail Enforcement Model", "Madison County Sheriff's Office (since 2018)", 1),
    "Hancock": ("Jail Enforcement Model", "Hancock County Sheriff's Office (since 2020)", 1),
    # Two additional sheriffs + state agencies; specific counties partially
    # public. Best-confirmed additions:
    "Harrison": ("Warrant Service Officer", "Harrison County Sheriff's Office", 1),
    "DeSoto": ("Warrant Service Officer", "DeSoto County Sheriff's Office", 1),
    # Statewide agencies (apply pressure but not pinned to a single county):
    # MS State Auditor (Sept 2025), MS DPS (pending Hinds).
    "Hinds": ("Task Force Model (pending)", "MS Dept. of Public Safety (pending)", 1),
}

# 2019 raid plant locations (direct hit) and adjacent residential communities.
RAID_DIRECT = {
    "Scott": "Koch Foods (Morton) + PH Food (Morton) + PECO Foods (Sebastopol) - 3 plants in this county",
    "Leake": "Pearl River Foods (Carthage) + PECO Foods (Walnut Grove) - 2 plants in this county",
    "Madison": "PECO Foods (Canton)",
    "Rankin": "A&B Inc. (Pelahatchie)",
    "Jasper": "PECO Foods (Bay Springs)",
}
RAID_ADJACENT = {
    # Counties where significant numbers of affected families lived even
    # though the plants weren't located there.
    "Jones": "Significant population of affected families (Laurel)",
    "Forrest": "Hattiesburg / Forrest area connected to raid families",
    # Forest the town is in Scott (already direct); skipping double-count.
    "Newton": "Adjacent to Scott / Leake plant cluster",
    "Smith": "Adjacent to Jasper / Scott plant cluster",
    "Neshoba": "Adjacent to Leake / Scott plant cluster",
    "Simpson": "Adjacent to Scott plant cluster",
}

# Detention infrastructure
DETENTION_DIRECT = {
    "Adams": "Adams County Correctional Center (Natchez) - largest ICE detention in MS, avg 2,154 detainees/day (CoreCivic)",
    "Tallahatchie": "Tallahatchie County Correctional Facility (Tutwiler) - ICE detainees held; contract expanded Feb 2025 (CoreCivic)",
}
DETENTION_ADJACENT = {
    # Processing-hub counties: ICE field office sub-locations, transit
    "Hinds": "Jackson ICE/HSI field office; processing hub for central MS",
    "Harrison": "Gulfport ICE sub-office; coastal processing hub",
    "Jackson": "Pascagoula processing; coastal transit corridor",
}

# Meatpacking / poultry employer density
# Sources: industry reports, MS DOE, 2019 raid concentration
MEATPACKING = {
    # Heaviest density (15-20 score)
    "Scott": 20,    # Koch, PH Food, multiple plants
    "Leake": 20,    # Pearl River Foods, PECO; Tyson presence
    "Jasper": 18,
    "Rankin": 14,
    "Madison": 16,  # PECO Canton
    "Jones": 18,    # Sanderson Farms HQ in Laurel
    "Forrest": 14,  # Hattiesburg area processors
    "Smith": 12,
    "Neshoba": 10,
    "Newton": 10,
    "Simpson": 10,
    "Pike": 8,
    "Lincoln": 8,
    "Lawrence": 6,
    "Wayne": 8,
    "Clarke": 6,
    "Walthall": 6,
    "Covington": 8,
    "Marion": 6,
    "Lamar": 6,
    "Perry": 4,
    "Greene": 4,
    "George": 4,
    "Stone": 4,
    "Pearl River": 4,
    "Hancock": 4,
    "Harrison": 4,
    "Jackson": 4,
    "Lauderdale": 6,
    "Kemper": 4,
    "Winston": 4,
}

# Hispanic % estimates (ACS 5-year). Sources: DataUSA / Census Reporter
# for the high-concentration counties; remaining counties estimated from
# state baseline (~3.6% statewide Hispanic).
HISP_PCT = {
    "Scott": 14.8,      # heaviest Hispanic concentration in MS
    "Leake": 8.6,
    "Madison": 3.7,     # large county, Latinos concentrate in Canton
    "Rankin": 2.9,
    "Forrest": 3.8,
    "Jasper": 4.5,
    "Jones": 3.4,
    "Hinds": 1.8,
    "Harrison": 6.2,
    "Jackson": 4.8,
    "DeSoto": 6.5,
    "Lee": 4.2,
    "Lamar": 2.8,
    "Pearl River": 3.2,
    "Hancock": 4.5,
    "Lauderdale": 1.9,
    "Lincoln": 2.4,
    "Newton": 4.1,
    "Neshoba": 2.6,
    "Smith": 3.2,
    "Simpson": 3.0,
    "Tate": 3.2,
    "Marshall": 3.0,
    "Warren": 1.8,
    "Bolivar": 2.6,
    "Washington": 1.8,
    "Sunflower": 3.2,
    "Tunica": 3.4,
    "Pontotoc": 4.6,
    "Union": 4.8,
    "Tippah": 4.4,
    "Calhoun": 5.2,
    "Chickasaw": 3.4,
    "Lafayette": 2.6,
    "Oktibbeha": 2.8,
    "Clarke": 3.2,
    "Wayne": 2.4,
    "Walthall": 2.2,
    "Pike": 2.2,
    "Lowndes": 2.0,
    "Monroe": 2.6,
    "Itawamba": 2.8,
    "Prentiss": 2.4,
    "Alcorn": 2.6,
    "Tishomingo": 1.8,
}

# Foreign-born % estimates (ACS 5-year). Generally ~2/3 of Hispanic %
# in non-college MS counties; higher in coastal Vietnamese/Asian areas.
FB_PCT = {
    "Scott": 11.2,
    "Leake": 6.8,
    "Madison": 3.4,
    "Rankin": 2.6,
    "Forrest": 3.6,
    "Jasper": 3.2,
    "Jones": 2.8,
    "Hinds": 2.2,
    "Harrison": 6.8,   # Vietnamese fishing community, Asian pop
    "Jackson": 5.4,    # Vietnamese fishing community
    "DeSoto": 5.0,
    "Lee": 3.2,
    "Lamar": 2.6,
    "Pearl River": 2.4,
    "Hancock": 3.2,
    "Lauderdale": 2.2,
    "Lincoln": 1.8,
    "Newton": 2.8,
    "Neshoba": 2.0,
    "Smith": 2.4,
    "Simpson": 2.2,
    "Tate": 2.4,
    "Marshall": 2.2,
    "Warren": 1.6,
    "Bolivar": 2.0,
    "Washington": 1.4,
    "Sunflower": 2.4,
    "Tunica": 2.6,
    "Pontotoc": 3.2,
    "Union": 3.4,
    "Lafayette": 4.2,  # Ole Miss international students
    "Oktibbeha": 4.8,  # Miss State international students
}

# All 82 MS counties with 2020 pop (FIPS is 28xxx)
COUNTIES = [
    ("Adams", 1, 30061), ("Alcorn", 3, 34569), ("Amite", 5, 12487),
    ("Attala", 7, 17100), ("Benton", 9, 7502), ("Bolivar", 11, 28262),
    ("Calhoun", 13, 12643), ("Carroll", 15, 9226), ("Chickasaw", 17, 16730),
    ("Choctaw", 19, 8048), ("Claiborne", 21, 8058), ("Clarke", 23, 15102),
    ("Clay", 25, 18238), ("Coahoma", 27, 19849), ("Copiah", 29, 27497),
    ("Covington", 31, 17898), ("DeSoto", 33, 197918), ("Forrest", 35, 79034),
    ("Franklin", 37, 7491), ("George", 39, 26331), ("Greene", 41, 13707),
    ("Grenada", 43, 20868), ("Hancock", 45, 46873), ("Harrison", 47, 217136),
    ("Hinds", 49, 211888), ("Holmes", 51, 15465), ("Humphreys", 53, 7001),
    ("Issaquena", 55, 1263), ("Itawamba", 57, 24152), ("Jackson", 59, 147666),
    ("Jasper", 61, 15785), ("Jefferson", 63, 6825), ("Jefferson Davis", 65, 10941),
    ("Jones", 67, 66496), ("Kemper", 69, 8600), ("Lafayette", 71, 59597),
    ("Lamar", 73, 67403), ("Lauderdale", 75, 70317), ("Lawrence", 77, 11819),
    ("Leake", 79, 21662), ("Lee", 81, 83731), ("Leflore", 83, 25686),
    ("Lincoln", 85, 35012), ("Lowndes", 87, 57346), ("Madison", 89, 116298),
    ("Marion", 91, 24001), ("Marshall", 93, 34654), ("Monroe", 95, 33318),
    ("Montgomery", 97, 9354), ("Neshoba", 99, 28732), ("Newton", 101, 20960),
    ("Noxubee", 103, 9798), ("Oktibbeha", 105, 51896), ("Panola", 107, 32691),
    ("Pearl River", 109, 59363), ("Perry", 111, 11577), ("Pike", 113, 38712),
    ("Pontotoc", 115, 32096), ("Prentiss", 117, 25284), ("Quitman", 119, 5364),
    ("Rankin", 121, 162181), ("Scott", 123, 28073), ("Sharkey", 125, 3097),
    ("Simpson", 127, 25498), ("Smith", 129, 13991), ("Stone", 131, 19654),
    ("Sunflower", 133, 22893), ("Tallahatchie", 135, 10877), ("Tate", 137, 28725),
    ("Tippah", 139, 21389), ("Tishomingo", 141, 18639), ("Tunica", 143, 8819),
    ("Union", 145, 28459), ("Walthall", 147, 13928), ("Warren", 149, 41759),
    ("Washington", 151, 40446), ("Wayne", 153, 19807), ("Webster", 155, 10167),
    ("Wilkinson", 157, 7582), ("Winston", 159, 17473), ("Yalobusha", 161, 12375),
    ("Yazoo", 163, 22947),
]

# Statewide defaults for counties not in the high-density lists
DEFAULT_HISP = 1.8
DEFAULT_FB = 1.4


def score_287g(model):
    if not model or model.lower() == "none":
        return 0
    m = model.lower()
    if "task force" in m and "pending" not in m:
        return 25
    if "jail enforcement" in m:
        return 20
    if "pending" in m:
        return 12
    if "warrant service" in m:
        return 15
    return 10


def score_pop_scaled(pct, cap_pct, max_score):
    return min(max_score, round(pct / cap_pct * max_score, 1))


def build():
    rows = []
    for name, fips_short, pop in COUNTIES:
        fips = 28000 + fips_short
        hisp_pct = HISP_PCT.get(name, DEFAULT_HISP)
        fb_pct = FB_PCT.get(name, DEFAULT_FB)

        hispanic = round(pop * hisp_pct / 100)
        foreign_born = round(pop * fb_pct / 100)

        # 287(g)
        prog = PROG_287G.get(name)
        if prog:
            model, agencies, n287 = prog
        else:
            model, agencies, n287 = "None", "", 0
        s_287g = score_287g(model)

        # Raid footprint
        if name in RAID_DIRECT:
            s_raid = 25
            raid_notes = RAID_DIRECT[name]
            raid_status = "Direct 2019 raid site"
        elif name in RAID_ADJACENT:
            s_raid = 12
            raid_notes = RAID_ADJACENT[name]
            raid_status = "Adjacent / affected community"
        else:
            s_raid = 0
            raid_notes = ""
            raid_status = "Not in 2019 raid footprint"

        # Detention
        if name in DETENTION_DIRECT:
            s_det = 25
            det_notes = DETENTION_DIRECT[name]
            det_status = "Hosts ICE detention facility"
        elif name in DETENTION_ADJACENT:
            s_det = 12
            det_notes = DETENTION_ADJACENT[name]
            det_status = "ICE processing hub"
        else:
            s_det = 0
            det_notes = ""
            det_status = "No major detention infrastructure"

        # Flock ALPR mesh
        flock = FLOCK_BY_COUNTY.get(name)
        if flock:
            flock_total = flock["total"]
            flock_cities = flock["cities"]
            flock_status = (
                "Heavy Flock mesh" if flock_total >= 40 else
                "Dense Flock deployment" if flock_total >= 20 else
                "Moderate Flock deployment" if flock_total >= 10 else
                "Light Flock deployment" if flock_total >= 5 else
                "At least one Flock city"
            )
        else:
            flock_total = 0
            flock_cities = []
            flock_status = "No confirmed Flock cities"
        s_flock = score_flock(flock_total)

        # Meatpacking density
        s_meat = MEATPACKING.get(name, 0)
        if s_meat >= 16:
            meat_status = "Heavy meatpacking / poultry concentration"
        elif s_meat >= 8:
            meat_status = "Moderate meatpacking / poultry employers"
        elif s_meat > 0:
            meat_status = "Some agricultural processing"
        else:
            meat_status = "Not a meatpacking hub"

        # Demographic scaled scores
        s_fb = score_pop_scaled(fb_pct, 10.0, 25)
        s_hisp = score_pop_scaled(hisp_pct, 10.0, 23)

        # Statewide HB 538 floor
        s_hb538 = HB538_BASE

        total = (
            s_287g + s_raid + s_det + s_meat + s_fb + s_hisp + s_flock + s_hb538
        )

        if total >= 70:
            tier = "Critical"
        elif total >= 50:
            tier = "High"
        elif total >= 25:
            tier = "Medium"
        else:
            tier = "Low"

        rows.append({
            "county": name,
            "fips": fips,
            "total_pop": pop,
            "foreign_born": foreign_born,
            "fb_pct": fb_pct,
            "hispanic": hispanic,
            "hisp_pct": hisp_pct,
            "hb538_status": "Subject (statewide mandate, HB 538 / 2026)",
            "287g_status": model,
            "287g_agencies": agencies,
            "287g_count": n287,
            "raid_2019_status": raid_status,
            "raid_2019_notes": raid_notes,
            "detention_status": det_status,
            "detention_notes": det_notes,
            "meatpacking_status": meat_status,
            "flock_status": flock_status,
            "flock_total": flock_total,
            "flock_cities": [{"city": c, "count": n} for c, n in flock_cities],
            "score_287g": s_287g,
            "score_raid_2019": s_raid,
            "score_detention": s_det,
            "score_meatpacking": s_meat,
            "score_foreign_born": s_fb,
            "score_hispanic": s_hisp,
            "score_flock": s_flock,
            "score_hb538_base": s_hb538,
            "risk_total": round(total, 1),
            "risk_tier": tier,
        })

    return rows


def summary(rows):
    tiers = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for r in rows:
        tiers[r["risk_tier"]] += 1
    return {
        "total_counties": len(rows),
        "tier_counts": tiers,
        "287g_active_count": sum(1 for r in rows if r["287g_count"] > 0),
        "raid_2019_direct_count": sum(1 for r in rows if r["score_raid_2019"] == 25),
        "raid_2019_total_count": sum(1 for r in rows if r["score_raid_2019"] > 0),
        "detention_county_count": sum(1 for r in rows if r["score_detention"] == 25),
        "detention_proximity_count": sum(1 for r in rows if r["score_detention"] > 0),
        "meatpacking_heavy_count": sum(1 for r in rows if r["score_meatpacking"] >= 16),
        "flock_county_count": sum(1 for r in rows if r["flock_total"] > 0),
        "flock_total_cameras": sum(r["flock_total"] for r in rows),
        "flock_cities_count": sum(len(r["flock_cities"]) for r in rows),
        "total_foreign_born": sum(r["foreign_born"] for r in rows),
        "total_hispanic": sum(r["hispanic"] for r in rows),
        "total_pop": sum(r["total_pop"] for r in rows),
        # 2019 raid headline numbers
        "raid_2019_workers_arrested": 680,
        "raid_2019_plants": 7,
        "raid_2019_cities": 6,
        "raid_2019_counties": 5,
        # Adams County detention scale
        "adams_county_avg_detainees": 2154,
    }


def main():
    rows = build()
    s = summary(rows)
    with open("/home/user/workspace/ga_risk_dashboard/docs/data/ms-counties-data.json", "w") as f:
        json.dump(rows, f, indent=2)
    with open("/home/user/workspace/ga_risk_dashboard/docs/data/ms-summary.json", "w") as f:
        json.dump(s, f, indent=2)
    print("counties:", len(rows))
    print("tiers:", s["tier_counts"])
    print("287(g) active:", s["287g_active_count"])
    print("Raid direct:", s["raid_2019_direct_count"])
    print("Detention host:", s["detention_county_count"])
    print("Meatpacking heavy:", s["meatpacking_heavy_count"])
    print("Flock counties:", s["flock_county_count"], "with", s["flock_total_cameras"], "cameras in", s["flock_cities_count"], "cities")
    print("Total foreign-born:", s["total_foreign_born"])
    print()
    print("Top 12 by risk:")
    for r in sorted(rows, key=lambda x: -x["risk_total"])[:12]:
        print(f"  {r['county']:<14} {r['risk_tier']:<8} score={r['risk_total']:>5.1f}  "
              f"287g={r['score_287g']:>2}  raid={r['score_raid_2019']:>2}  "
              f"det={r['score_detention']:>2}  meat={r['score_meatpacking']:>2}  "
              f"fb={r['score_foreign_born']:>4}  hisp={r['score_hispanic']:>4}  "
              f"flock={r['score_flock']:>2} ({r['flock_total']:>2}cam)")


if __name__ == "__main__":
    main()
