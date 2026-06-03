// GA County Risk Dashboard; independent analysis by Rosario Palacios
// Data is read-only; no backend.

// ---------- THEME TOGGLE ----------
(function () {
  const t = document.querySelector('[data-theme-toggle]');
  const r = document.documentElement;
  let d = window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  r.setAttribute('data-theme', d);
  function setIcon() {
    t.innerHTML = d === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
  setIcon();
  t.addEventListener('click', () => {
    d = d === 'dark' ? 'light' : 'dark';
    r.setAttribute('data-theme', d);
    setIcon();
    // Re-render map colors that read CSS vars
    if (window.__renderMap) window.__renderMap();
  });
})();

// build date stamp
document.getElementById('build-date').textContent = new Date().toISOString().slice(0, 10);

// ---------- HELPERS ----------
const fmt = (n) => (n == null ? '·' : new Intl.NumberFormat('en-US').format(n));
const fmtPct = (n) => (n == null ? '·' : `${n.toFixed(1)}%`);
const TIERS = ['Critical', 'High', 'Medium', 'Low'];
const TIER_COLORS = {
  Critical: () => getComputedStyle(document.documentElement).getPropertyValue('--risk-critical').trim(),
  High: () => getComputedStyle(document.documentElement).getPropertyValue('--risk-high').trim(),
  Medium: () => getComputedStyle(document.documentElement).getPropertyValue('--risk-medium').trim(),
  Low: () => getComputedStyle(document.documentElement).getPropertyValue('--risk-low').trim(),
};
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

function pad3(n) { return String(n).padStart(3, '0'); }
function fipsKey(c) { return '13' + pad3(c.fips); }

// ---------- LOAD DATA ----------
let DATA = { counties: [], topo: null, summary: null, byFips: {} };
let SELECTED_FIPS = null;
let MAP_MODE = 'risk_tier_v3';
let SORT_KEY = 'risk_total_v3';
let SORT_DIR = -1; // desc by default

Promise.all([
  fetch('./data/counties.json').then(r => r.json()),
  fetch('./data/ga-counties.json').then(r => r.json()),
  fetch('./data/summary.json').then(r => r.json()),
  fetch('./data/cameras.json').then(r => r.json()).catch(() => ({ cameras: [], count: 0, flock_count: 0 })),
  fetch('./data/roads.json').then(r => r.json()).catch(() => ({ interstates: [] })),
  fetch('./data/places.json').then(r => r.json()).catch(() => ({ places: [] })),
]).then(([counties, topo, summary, cams, roads, places]) => {
  DATA.counties = counties;
  DATA.topo = topo;
  DATA.summary = summary;
  DATA.cameras = cams.cameras || [];
  DATA.roads = roads.interstates || [];
  DATA.places = places.places || [];
  DATA.cameraTotals = { total: cams.count || 0, flock: cams.flock_count || 0 };
  DATA.byFips = Object.fromEntries(counties.map(c => [fipsKey(c), c]));
  window.DATA = DATA;
  init();
}).catch(err => {
  console.error('Data load failed', err);
  document.querySelector('main').innerHTML = `<div class="loading-shell"><p>Failed to load data: ${err.message}</p></div>`;
});

// ---------- INIT ----------
function init() {
  renderKPIs();
  renderMap();
  renderTierBars();
  render287gBars();
  renderSurvBars();
  renderTable();
  bindFilters();
  bindModeToggle();
  // bindExport(); // removed per coalition request
}

// ---------- KPIs ----------
function renderKPIs() {
  const s = DATA.summary;
  const arrestsCount = DATA.counties.filter(c => c.observed_arrests > 0).length;
  const camTotal = DATA.cameraTotals.total;
  const cards = [
    { label: t('kpi.counties_tracked'), value: s.total_counties, sub: t('kpi.counties_tracked.sub'), accent: 'var(--color-primary)' },
    { label: t('kpi.critical_high'), value: s.tier_counts.Critical + s.tier_counts.High, sub: t('kpi.critical_high.sub', { critical: s.tier_counts.Critical, high: s.tier_counts.High }), accent: 'var(--risk-critical)' },
    { label: t('kpi.287g'), value: s['287g_active_count'], sub: t('kpi.287g.sub'), accent: 'var(--risk-high)' },
    { label: t('kpi.cameras'), value: fmt(camTotal), sub: t('kpi.cameras.sub', { flock: fmt(DATA.cameraTotals.flock), counties: s.counties_with_cameras || s.flock_county_count }), accent: 'var(--color-accent)' },
    { label: t('kpi.fb'), value: fmt(s.total_foreign_born), sub: t('kpi.fb.sub'), accent: 'var(--color-primary)' },
    { label: t('kpi.arrests'), value: fmt(s.total_observed_arrests), sub: t('kpi.arrests.sub', { n: arrestsCount }), accent: 'var(--risk-medium)' },
  ];
  const grid = document.getElementById('kpi-grid');
  grid.innerHTML = cards.map(c => `
    <div class="kpi" style="--accent-color: ${c.accent}">
      <div class="label">${c.label}</div>
      <div class="value">${c.value}</div>
      <div class="sub">${c.sub}</div>
    </div>
  `).join('');
}

// ---------- MAP ----------
let PROJECTION = null;
function renderMap() {
  const svg = d3.select('#map');
  svg.selectAll('*').remove();
  const W = 700, H = 720;
  const counties = topojson.feature(DATA.topo, DATA.topo.objects.counties);
  PROJECTION = d3.geoMercator().fitSize([W, H], counties);
  const path = d3.geoPath(PROJECTION);

  const g = svg.append('g');

  g.selectAll('path.county-shape')
    .data(counties.features)
    .join('path')
    .attr('class', 'county-shape')
    .attr('d', path)
    .attr('fill', d => fillForFeature(d))
    .attr('data-fips', d => d.id)
    .on('mouseenter', (e, d) => showTip(e, d))
    .on('mousemove', (e) => moveTip(e))
    .on('mouseleave', hideTip)
    .on('click', (e, d) => selectCounty(d.id));

  // Cameras layer (above counties, below selected outline)
  svg.append('g').attr('id', 'camera-layer').attr('pointer-events', 'none');

  // selected outline overlay
  svg.append('path').attr('id', 'selected-outline').attr('fill', 'none').attr('stroke', cssVar('--color-text')).attr('stroke-width', 2).attr('pointer-events', 'none');

  drawLegend();
  drawCameras();
  if (SELECTED_FIPS) updateSelectedOutline();
}

function drawCameras() {
  const layer = d3.select('#camera-layer');
  layer.selectAll('*').remove();
  const checkbox = document.getElementById('show-cameras');
  if (!checkbox || !checkbox.checked || !PROJECTION || !DATA.cameras.length) return;
  // Filter to selected county if any (otherwise show all)
  const cams = SELECTED_FIPS
    ? DATA.cameras.filter(c => c.f === SELECTED_FIPS)
    : DATA.cameras;
  // Project once
  const proj = PROJECTION;
  const flockColor = cssVar('--risk-critical');
  const otherColor = cssVar('--color-primary');
  layer.selectAll('circle.cam')
    .data(cams)
    .join('circle')
    .attr('class', 'cam')
    .attr('cx', d => proj([d.lon, d.lat])[0])
    .attr('cy', d => proj([d.lon, d.lat])[1])
    .attr('r', SELECTED_FIPS ? 3 : 1.5)
    .attr('fill', d => d.flk ? flockColor : otherColor)
    .attr('fill-opacity', SELECTED_FIPS ? 0.9 : 0.55)
    .attr('stroke', SELECTED_FIPS ? cssVar('--color-surface') : 'none')
    .attr('stroke-width', 0.6);
}
window.__renderMap = renderMap;

function fillForFeature(d) {
  const row = DATA.byFips[d.id];
  if (!row) return cssVar('--color-divider');
  if (MAP_MODE === 'risk_tier_v3') return TIER_COLORS[row.risk_tier_v3]();
  if (MAP_MODE === '287g_status') {
    if (row['287g_status'].includes('TFM')) return cssVar('--risk-critical');
    if (row['287g_count'] >= 2) return cssVar('--risk-critical');
    if (row['287g_count'] === 1) return cssVar('--risk-high');
    return cssVar('--color-divider');
  }
  if (MAP_MODE === 'has_flock') {
    if (row.documented_ice_query) return cssVar('--risk-critical');
    if (row.shares_with_apd || row.has_fusus_connect) return cssVar('--risk-high');
    if (row.has_flock) return cssVar('--risk-medium');
    return cssVar('--color-divider');
  }
  if (MAP_MODE === 'camera_count') {
    const max = d3.max(DATA.counties, c => c.camera_count) || 1;
    if (!row.camera_count) return cssVar('--color-surface-offset');
    // Log scale to handle Fulton (895) vs small counties (1-2)
    const t = Math.log(row.camera_count + 1) / Math.log(max + 1);
    return d3.interpolateRgb(cssVar('--color-surface-offset'), cssVar('--risk-critical'))(t);
  }
  if (MAP_MODE === 'fb_pct') {
    const max = d3.max(DATA.counties, c => c.fb_pct) || 1;
    const t = Math.min(1, row.fb_pct / max);
    // sequential ramp through risk colors
    return d3.interpolateRgb(cssVar('--color-surface-offset'), cssVar('--risk-critical'))(t);
  }
  return cssVar('--color-divider');
}

function drawLegend() {
  const el = document.getElementById('map-legend');
  let items = [];
  if (MAP_MODE === 'risk_tier_v3') {
    items = TIERS.map(tier => ({ label: t('tier.' + tier.toLowerCase()), color: TIER_COLORS[tier]() }));
  } else if (MAP_MODE === '287g_status') {
    items = [
      { label: t('legend.multiple_agencies'), color: cssVar('--risk-critical') },
      { label: t('legend.one_agency'), color: cssVar('--risk-high') },
      { label: t('legend.no_287g'), color: cssVar('--color-divider') },
    ];
  } else if (MAP_MODE === 'has_flock') {
    items = [
      { label: t('legend.ice_query'), color: cssVar('--risk-critical') },
      { label: t('legend.shares_apd'), color: cssVar('--risk-high') },
      { label: t('legend.has_flock'), color: cssVar('--risk-medium') },
      { label: t('legend.no_flock'), color: cssVar('--color-divider') },
    ];
  } else if (MAP_MODE === 'camera_count') {
    items = [
      { label: t('legend.fewer_cameras'), color: cssVar('--color-surface-offset') },
      { label: t('legend.more_cameras'), color: cssVar('--risk-critical') },
    ];
  } else if (MAP_MODE === 'fb_pct') {
    items = [
      { label: t('legend.lower_pct'), color: cssVar('--color-surface-offset') },
      { label: t('legend.higher_pct'), color: cssVar('--risk-critical') },
    ];
  }
  el.innerHTML = items.map(i =>
    `<span class="legend-item"><span class="legend-swatch" style="background:${i.color};border:1px solid var(--color-border);"></span>${i.label}</span>`
  ).join('');
}

function bindModeToggle() {
  document.querySelectorAll('#map-mode button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#map-mode button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      MAP_MODE = btn.dataset.mode;
      d3.select('#map').selectAll('path.county-shape').attr('fill', d => fillForFeature(d));
      drawLegend();
    });
  });
  const cb = document.getElementById('show-cameras');
  if (cb) cb.addEventListener('change', () => {
    drawCameras();
    if (SELECTED_FIPS && DATA.byFips[SELECTED_FIPS]) renderCountyZoom(DATA.byFips[SELECTED_FIPS]);
  });
}

// ---------- TOOLTIP ----------
const tip = document.getElementById('tooltip');
function showTip(e, d) {
  const row = DATA.byFips[d.id];
  if (!row) return;
  const ag = row['287g_status'] === 'None' ? t('tip.no_287g') : row['287g_status'];
  const tierLabel = t('tier.' + row.risk_tier_v3.toLowerCase());
  tip.innerHTML = `<div class="t-name">${row.county} ${t('detail.county_suffix')}</div><div class="t-meta">${tierLabel} · ${t('tip.score')} ${row.risk_total_v3} · ${ag}${row.has_flock ? ' · Flock' : ''}</div>`;
  tip.classList.add('show');
  moveTip(e);
}
function moveTip(e) {
  const pad = 14;
  let x = e.clientX + pad;
  let y = e.clientY + pad;
  const rect = tip.getBoundingClientRect();
  if (x + rect.width > window.innerWidth - 8) x = e.clientX - rect.width - pad;
  if (y + rect.height > window.innerHeight - 8) y = e.clientY - rect.height - pad;
  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
}
function hideTip() { tip.classList.remove('show'); }

// ---------- SELECT COUNTY ----------
function selectCounty(fips5) {
  const isNewSelection = SELECTED_FIPS !== fips5;
  SELECTED_FIPS = fips5;
  window.SELECTED_FIPS = SELECTED_FIPS;
  d3.selectAll('path.county-shape').classed('selected', d => d.id === fips5);
  updateSelectedOutline();
  drawCameras();
  renderDetail(DATA.byFips[fips5]);
  if (isNewSelection && typeof window.maybeTriggerSignup === 'function') window.maybeTriggerSignup();
  // Smooth scroll to top of section if mobile
  if (window.innerWidth < 980) {
    document.getElementById('detail-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function updateSelectedOutline() {
  // Move the selected county outline above all by re-pathing
  const counties = topojson.feature(DATA.topo, DATA.topo.objects.counties);
  const f = counties.features.find(x => x.id === SELECTED_FIPS);
  if (!f) return;
  const W = 700, H = 720;
  const projection = d3.geoMercator().fitSize([W, H], counties);
  const path = d3.geoPath(projection);
  d3.select('#selected-outline').attr('d', path(f));
}

function renderDetail(c) {
  if (!c) return;
  document.getElementById('detail-empty').classList.add('hidden');
  const el = document.getElementById('detail-content');
  el.classList.remove('hidden');

  const tags = [];
  if (c.metro_atlanta) tags.push({ t: t('detail.metro'), cls: '' });
  if (c['287g_count'] > 0) tags.push({ t: t('detail.tags.287g_count', { n: c['287g_count'] }), cls: 'warn' });
  if (c.camera_count > 0) tags.push({ t: t('detail.tags.alpr_cameras', { n: fmt(c.camera_count) }), cls: c.camera_count >= 100 ? 'danger' : 'warn' });
  if (c.documented_ice_query) tags.push({ t: t('detail.tags.ice_query'), cls: 'danger' });
  if (c.shares_with_apd) tags.push({ t: t('detail.tags.shares_apd'), cls: 'warn' });
  if (c.has_fusus_connect) tags.push({ t: t('detail.tags.fusus'), cls: 'warn' });
  if (c.observed_arrests > 0) tags.push({ t: t('detail.tags.arrests', { n: c.observed_arrests }), cls: 'danger' });
  if (tags.length === 0) tags.push({ t: t('detail.tags.none'), cls: 'ok' });

  // score breakdown bars (each scaled to its max possible weight)
  const maxBars = [
    { label: t('detail.score.287g'), val: c.score_287g, max: 25 },
    { label: t('detail.score.fb'), val: c.score_foreign_born, max: 25 },
    { label: t('detail.score.hisp'), val: c.score_hispanic, max: 25 },
    { label: t('detail.score.ice_infra'), val: c.score_ice_infra, max: 25 },
    { label: t('detail.score.hb1105'), val: c.score_hb1105_base, max: 5 },
    { label: t('detail.score.surv'), val: c.surveillance_mesh_score * 2, max: 10 },
  ];

  const arrestsBar = c.observed_arrests > 0 ? `
    <div class="score-bar-row" style="margin-top: var(--space-2);">
      <span class="lab">${t('detail.score.arrests')}</span>
      <div class="track"><div class="fill" style="width: ${Math.min(100, c.observed_arrests / 5)}%; background: var(--risk-high);"></div></div>
      <span class="num">${c.observed_arrests}</span>
    </div>` : '';

  const tierLabel = t('tier.' + c.risk_tier_v3.toLowerCase());

  el.innerHTML = `
    <div id="county-zoom-slot"></div>
    <div class="panel-head">
      <div>
        <h3>${c.county} ${t('detail.county_suffix')}</h3>
        <p class="sub">${t('detail.fips')} 13${pad3(c.fips)} · ${c.metro_atlanta ? t('detail.metro') : t('detail.nonmetro')} · ${t('detail.pop')} ${fmt(c.total_pop)}</p>
      </div>
      <span class="tier-badge tier-${c.risk_tier_v3}">${tierLabel} · ${c.risk_total_v3}</span>
    </div>

    <div class="stat-grid">
      <div class="row"><span class="l">${t('detail.stat.fb')}</span><span class="v">${fmt(c.foreign_born)} <span style="color: var(--color-text-muted); font-weight: 500;">(${fmtPct(c.fb_pct)})</span></span></div>
      <div class="row"><span class="l">${t('detail.stat.hisp')}</span><span class="v">${fmt(c.hispanic)} <span style="color: var(--color-text-muted); font-weight: 500;">(${fmtPct(c.hisp_pct)})</span></span></div>
      <div class="row"><span class="l">${t('detail.stat.287g')}</span><span class="v" style="font-size: var(--text-sm); font-family: var(--font-body); font-weight: 600;">${c['287g_status'] === 'None' ? t('detail.stat.not_participating') : c['287g_status']}</span></div>
      <div class="row"><span class="l">${t('detail.stat.hb1105')}</span><span class="v" style="font-size: var(--text-sm); font-family: var(--font-body); font-weight: 600;">${c.hb1105_status}</span></div>
      <div class="row"><span class="l">${t('detail.stat.cameras')}</span><span class="v">${fmt(c.camera_count || 0)}${c.flock_camera_count ? ` <span style="color: var(--color-text-muted); font-weight: 500;">(${fmt(c.flock_camera_count)} Flock)</span>` : ''}</span></div>
      <div class="row"><span class="l">${t('detail.stat.cam_per_100k')}</span><span class="v">${c.cameras_per_100k || 0}</span></div>
    </div>

    ${c['287g_agencies'] ? `<p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: var(--space-3);"><strong style="color: var(--color-text);">${t('detail.287g_agencies')}</strong> ${c['287g_agencies']}</p>` : ''}
    ${c.ice_infrastructure ? `<p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: var(--space-4);"><strong style="color: var(--color-text);">${t('detail.ice_infra')}</strong> ${c.ice_infrastructure}</p>` : ''}

    <h4 style="font-size: var(--text-sm); font-weight: 700; margin: var(--space-4) 0 var(--space-3); letter-spacing: -0.01em;">${t('detail.score_breakdown')}</h4>
    ${maxBars.map(b => `
      <div class="score-bar-row">
        <span class="lab">${b.label}</span>
        <div class="track"><div class="fill" style="width: ${(b.val / b.max) * 100}%; background: ${tierColorForScore(b.val, b.max)};"></div></div>
        <span class="num">${b.val}</span>
      </div>
    `).join('')}
    ${arrestsBar}

    <div class="tag-row">
      ${tags.map(t => `<span class="tag ${t.cls}">${t.t}</span>`).join('')}
    </div>

    ${c.flock_agencies ? `<p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: var(--space-4); line-height: 1.55;"><strong style="color: var(--color-text);">${t('detail.flock_agencies')}</strong> ${c.flock_agencies}</p>` : ''}
    ${c.surveillance_flags ? `<p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: var(--space-2); line-height: 1.55;"><strong style="color: var(--color-text);">${t('detail.surv_flags')}</strong> ${c.surveillance_flags}</p>` : ''}
  `;
  renderCountyZoom(c);
}

// ---------- COUNTY ZOOM (mini-map) ----------
function renderCountyZoom(c) {
  const slot = document.getElementById('county-zoom-slot');
  if (!slot) return;
  const cb = document.getElementById('show-cameras');
  if (!cb || !cb.checked) { slot.innerHTML = ''; return; }
  const fips5 = fipsKey(c);
  const feature = (DATA.topo && DATA.topo.objects && DATA.topo.objects.counties)
    ? topojson.feature(DATA.topo, DATA.topo.objects.counties).features.find(f => f.id === fips5)
    : null;
  if (!feature) { slot.innerHTML = ''; return; }
  const cams = (DATA.cameras || []).filter(cm => cm.f === fips5);
  const W = 300, H = 300, PAD = 14;
  const proj = d3.geoMercator().fitExtent([[PAD, PAD], [W - PAD, H - PAD]], feature);
  const path = d3.geoPath(proj);
  const flockColor = cssVar('--risk-critical');
  const otherColor = cssVar('--color-primary');
  const roadColor = cssVar('--color-text-muted');
  const placeColor = cssVar('--color-text');
  const flockCount = cams.filter(c2 => c2.flk).length;
  const otherCount = cams.length - flockCount;

  // County bbox in lon/lat for filtering roads + places
  const bbox = d3.geoBounds(feature); // [[w,s],[e,n]]
  const w = bbox[0][0], s = bbox[0][1], e = bbox[1][0], n = bbox[1][1];
  const pad = Math.max((e - w), (n - s)) * 0.08; // small padding to show context
  const inBox = (lon, lat) => lon >= w - pad && lon <= e + pad && lat >= s - pad && lat <= n + pad;

  // Roads: keep interstate segments where ANY vertex falls in expanded bbox
  const roadPaths = [];
  const roadLabels = []; // {x,y,name}
  (DATA.roads || []).forEach(road => {
    road.segments.forEach(seg => {
      const visible = seg.some(([lo, la]) => inBox(lo, la));
      if (!visible) return;
      const projected = seg.map(([lo, la]) => proj([lo, la])).filter(Boolean);
      if (projected.length < 2) return;
      const d = projected.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
      roadPaths.push(d);
      // Label at vertex closest to viewBox center (and inside bounds)
      let best = null, bestDist = Infinity;
      for (const p of projected) {
        if (p[0] < PAD || p[0] > W - PAD || p[1] < PAD || p[1] > H - PAD) continue;
        const dx = p[0] - W/2, dy = p[1] - H/2;
        const d2 = dx*dx + dy*dy;
        if (d2 < bestDist) { bestDist = d2; best = p; }
      }
      if (best) roadLabels.push({ x: best[0], y: best[1], name: road.name, ref: road.ref });
    });
  });
  // Dedupe road labels by ref (keep one closest to center)
  const labelByRef = {};
  roadLabels.forEach(l => {
    const cur = labelByRef[l.ref];
    const dist = (l.x - W/2)**2 + (l.y - H/2)**2;
    if (!cur || dist < cur._dist) labelByRef[l.ref] = { ...l, _dist: dist };
  });
  const finalRoadLabels = Object.values(labelByRef);

  // Places: inside bbox; cap at 6 by population descending
  const placesInBox = (DATA.places || [])
    .filter(p => inBox(p.lon, p.lat))
    .slice(0, 6)
    .map(p => ({ ...p, xy: proj([p.lon, p.lat]) }))
    .filter(p => p.xy && p.xy[0] >= 0 && p.xy[0] <= W && p.xy[1] >= 0 && p.xy[1] <= H);

  slot.innerHTML = `
    <div class="county-zoom">
      <div class="county-zoom-head">
        <h4>${t('detail.zoom.h4', { county: c.county })}</h4>
        <span class="county-zoom-stat">${t('detail.zoom.stat', { cams: fmt(cams.length), per: c.cameras_per_100k || 0 })}</span>
      </div>
      <svg class="county-zoom-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('detail.zoom.aria', { county: c.county })}">
        <defs>
          <clipPath id="zoom-clip-${fips5}"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>
        </defs>
        <g clip-path="url(#zoom-clip-${fips5})">
          <path class="zoom-county" d="${path(feature)}" fill="${cssVar('--color-surface')}" stroke="${cssVar('--color-text')}" stroke-width="1.5" stroke-linejoin="round"/>
          ${roadPaths.map(d => `<path d="${d}" fill="none" stroke="${roadColor}" stroke-width="2" stroke-opacity="0.55" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
          ${cams.map(cm => {
            const p = proj([cm.lon, cm.lat]);
            if (!p) return '';
            return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6" fill="${cm.flk ? flockColor : otherColor}" fill-opacity="0.85" stroke="${cssVar('--color-surface')}" stroke-width="0.5"/>`;
          }).join('')}
          ${finalRoadLabels.map(l => `
            <g class="zoom-road-label" transform="translate(${l.x.toFixed(1)},${l.y.toFixed(1)})">
              <rect x="-12" y="-7" width="24" height="14" rx="3" fill="${cssVar('--color-surface')}" fill-opacity="0.92" stroke="${roadColor}" stroke-width="0.8"/>
              <text text-anchor="middle" dy="3.5" font-size="9" font-weight="700" fill="${cssVar('--color-text')}">${l.name}</text>
            </g>`).join('')}
          ${placesInBox.map(p => `
            <g class="zoom-place" transform="translate(${p.xy[0].toFixed(1)},${p.xy[1].toFixed(1)})">
              <circle r="3" fill="${placeColor}" stroke="${cssVar('--color-surface')}" stroke-width="1.2"/>
              <text x="5" y="3.5" font-size="10" font-weight="600" fill="${cssVar('--color-text')}" stroke="${cssVar('--color-surface')}" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${p.n}</text>
            </g>`).join('')}
        </g>
      </svg>
      <div class="county-zoom-legend">
        <span><span class="swatch" style="background:${flockColor}"></span>${t('detail.flock_count')} (${fmt(flockCount)})</span>
        ${otherCount > 0 ? `<span><span class="swatch" style="background:${otherColor}"></span>${t('detail.other_alpr')} (${fmt(otherCount)})</span>` : ''}
        ${finalRoadLabels.length ? `<span><span class="swatch line" style="background:${roadColor}"></span>${t('detail.interstates')}</span>` : ''}
        ${placesInBox.length ? `<span><span class="swatch" style="background:${placeColor}"></span>${t('detail.cities_towns')}</span>` : ''}
      </div>
    </div>`;
}

function tierColorForScore(val, max) {
  const ratio = val / max;
  if (ratio >= 0.75) return cssVar('--risk-critical');
  if (ratio >= 0.5) return cssVar('--risk-high');
  if (ratio >= 0.25) return cssVar('--risk-medium');
  if (ratio > 0) return cssVar('--risk-low');
  return cssVar('--color-divider');
}

// ---------- TIER BARS ----------
function renderTierBars() {
  const tiers = TIERS.map(t => {
    const counties = DATA.counties.filter(c => c.risk_tier_v3 === t);
    return {
      tier: t,
      count: counties.length,
      fb: counties.reduce((s, c) => s + c.foreign_born, 0),
      arrests: counties.reduce((s, c) => s + c.observed_arrests, 0),
      color: TIER_COLORS[t](),
    };
  });
  const max = d3.max(tiers, t => t.count);
  const totalFB = d3.sum(tiers, t => t.fb);
  const totalArr = d3.sum(tiers, t => t.arrests);
  const el = document.getElementById('tier-bars');
  el.innerHTML = tiers.map(tt => `
    <div class="bar-row">
      <span class="lab">${t('tier.' + tt.tier.toLowerCase())}</span>
      <div class="track"><div class="fill" style="width: ${(tt.count / max) * 100}%; background: ${tt.color};">${tt.count}</div></div>
    </div>
  `).join('') + `
    <div style="margin-top: var(--space-5); display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--color-divider);">
      <div>
        <div style="font-size: var(--text-xs); font-weight: 600; color: var(--color-text-muted); letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: var(--space-2);">${t('tier.fb_share')}</div>
        ${tiers.map(tt => `<div style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);margin-bottom:4px;"><div style="width:8px;height:8px;border-radius:2px;background:${tt.color}"></div><span style="width:60px">${t('tier.' + tt.tier.toLowerCase())}</span><span style="font-family:var(--font-mono);font-weight:600;">${(tt.fb / totalFB * 100).toFixed(0)}%</span></div>`).join('')}
      </div>
      <div>
        <div style="font-size: var(--text-xs); font-weight: 600; color: var(--color-text-muted); letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: var(--space-2);">${t('tier.arrests_by_tier')}</div>
        ${tiers.map(tt => `<div style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);margin-bottom:4px;"><div style="width:8px;height:8px;border-radius:2px;background:${tt.color}"></div><span style="width:60px">${t('tier.' + tt.tier.toLowerCase())}</span><span style="font-family:var(--font-mono);font-weight:600;">${totalArr ? (tt.arrests / totalArr * 100).toFixed(0) : 0}%</span></div>`).join('')}
      </div>
    </div>
  `;
}

// ---------- 287g BARS ----------
function render287gBars() {
  // Show counties with active 287(g) by model; show 'No 287(g)' (status 'None') as separate bar.
  const active = DATA.counties.filter(c => c['287g_status'] !== 'None' && c['287g_count'] > 0);
  const groups = d3.rollups(active, v => v.length, c => c['287g_status'])
    .map(([k, v]) => ({ k, v }))
    .sort((a, b) => b.v - a.v);
  const noneCount = DATA.counties.filter(c => c['287g_status'] === 'None' || c['287g_count'] === 0).length;
  groups.push({ k: 'No 287(g)', v: noneCount });

  const max = d3.max(groups, g => g.v);
  const colors = {
    'JEM + TFM (highest)': cssVar('--risk-critical'),
    'Task Force Model': cssVar('--risk-critical'),
    'JEM + WSO': cssVar('--risk-high'),
    'Jail Enforcement Model': cssVar('--risk-high'),
    'Warrant Service Officer': cssVar('--risk-medium'),
    'No 287(g)': cssVar('--color-divider'),
  };
  const el = document.getElementById('287g-bars');
  el.innerHTML = groups.map(g => {
    const label = g.k === 'No 287(g)' ? t('p287g.bar.none') : g.k;
    return `
    <div class="bar-row">
      <span class="lab" style="width: 168px; font-size: var(--text-xs);">${label}</span>
      <div class="track"><div class="fill" style="width: ${(g.v / max) * 100}%; background: ${colors[g.k] || cssVar('--color-primary')}; color: ${g.k === 'No 287(g)' ? 'var(--color-text)' : 'white'};">${g.v}</div></div>
    </div>
  `; }).join('');
}

// ---------- SURVEILLANCE BARS ----------
function renderSurvBars() {
  const top = [...DATA.counties].sort((a, b) => b.surveillance_mesh_score - a.surveillance_mesh_score || b.risk_total_v3 - a.risk_total_v3).slice(0, 12);
  const max = 5;
  const el = document.getElementById('surv-bars');
  el.innerHTML = top.map(c => {
    const color = c.surveillance_mesh_score >= 4 ? cssVar('--risk-critical')
      : c.surveillance_mesh_score >= 3 ? cssVar('--risk-high')
      : c.surveillance_mesh_score >= 2 ? cssVar('--risk-medium')
      : cssVar('--risk-low');
    return `
      <div class="bar-row">
        <span class="lab" style="width: 110px; font-size: var(--text-sm);">${c.county}</span>
        <div class="track"><div class="fill" style="width: ${(c.surveillance_mesh_score / max) * 100}%; background: ${color};">${c.surveillance_mesh_score}</div></div>
      </div>
    `;
  }).join('');
}

// ---------- TABLE ----------
function renderTable() {
  let rows = filterRows();
  rows = sortRows(rows);
  const tbody = document.getElementById('county-tbody');
  tbody.innerHTML = rows.map(c => `
    <tr data-fips="${fipsKey(c)}">
      <td><strong>${c.county}</strong>${c.metro_atlanta ? ` <span style="color:var(--color-text-faint);font-weight:400;font-size:var(--text-xs);">· ${t('detail.metro')}</span>` : ''}</td>
      <td class="num"><strong>${c.risk_total_v3}</strong></td>
      <td><span class="tier-badge tier-${c.risk_tier_v3}" style="padding:2px 8px;font-size:11px;">${t('tier.' + c.risk_tier_v3.toLowerCase())}</span></td>
      <td>${c['287g_count'] > 0 && c['287g_status'] !== 'None' ? `<span class="tag warn" style="padding:2px 6px;font-size:11px;">${c['287g_status']}</span>` : '<span class="dash">·</span>'}</td>
      <td>${c.has_flock ? `<span class="check">●</span>${c.documented_ice_query ? ' <span class="tag danger" style="padding:1px 5px;font-size:10px;">ICE</span>' : ''}` : '<span class="dash">·</span>'}</td>
      <td class="num">${fmtPct(c.fb_pct)}</td>
      <td class="num">${fmtPct(c.hisp_pct)}</td>
      <td class="num">${c.observed_arrests || '<span class="dash">·</span>'}</td>
      <td class="num">${c.surveillance_mesh_score || '<span class="dash">·</span>'}</td>
    </tr>
  `).join('');
  tbody.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('click', () => {
      const fips = tr.dataset.fips;
      selectCounty(fips);
      document.getElementById('detail-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
  updateSortIndicators();
}

function filterRows() {
  const q = (document.getElementById('search').value || '').trim().toLowerCase();
  const tier = document.getElementById('filter-tier').value;
  const ag = document.getElementById('filter-287g').value;
  const region = document.getElementById('filter-region').value;
  return DATA.counties.filter(c => {
    if (q && !c.county.toLowerCase().includes(q)) return false;
    if (tier && c.risk_tier_v3 !== tier) return false;
    if (ag === 'active' && c['287g_count'] === 0) return false;
    if (ag === 'inactive' && c['287g_count'] > 0) return false;
    if (region === 'metro' && !c.metro_atlanta) return false;
    if (region === 'non-metro' && c.metro_atlanta) return false;
    return true;
  });
}

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    let av = a[SORT_KEY], bv = b[SORT_KEY];
    if (SORT_KEY === 'risk_tier_v3') {
      const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      av = order[av]; bv = order[bv];
    }
    if (SORT_KEY === '287g_status') {
      av = a['287g_count']; bv = b['287g_count'];
    }
    if (SORT_KEY === 'has_flock') {
      av = a.has_flock ? 1 : 0; bv = b.has_flock ? 1 : 0;
    }
    if (typeof av === 'string') return av.localeCompare(bv) * SORT_DIR;
    return ((av ?? 0) - (bv ?? 0)) * SORT_DIR;
  });
}

function updateSortIndicators() {
  document.querySelectorAll('#county-table thead th').forEach(th => {
    const k = th.dataset.sort;
    const arrow = th.querySelector('.arrow');
    if (arrow) arrow.remove();
    if (k === SORT_KEY) {
      const a = document.createElement('span');
      a.className = 'arrow';
      a.textContent = SORT_DIR === 1 ? '▲' : '▼';
      th.appendChild(a);
    }
  });
}

function bindFilters() {
  document.getElementById('search').addEventListener('input', renderTable);
  document.getElementById('filter-tier').addEventListener('change', renderTable);
  document.getElementById('filter-287g').addEventListener('change', renderTable);
  document.getElementById('filter-region').addEventListener('change', renderTable);
  document.querySelectorAll('#county-table thead th').forEach(th => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (SORT_KEY === k) SORT_DIR *= -1;
      else { SORT_KEY = k; SORT_DIR = (k === 'county' ? 1 : -1); }
      renderTable();
    });
  });
}

function bindExport_REMOVED() {
  document.getElementById('export-csv')?.addEventListener('click', () => {
    const rows = filterRows();
    const cols = ['county','fips','total_pop','foreign_born','fb_pct','hispanic','hisp_pct','metro_atlanta','hb1105_status','287g_status','287g_count','287g_agencies','ice_infrastructure','observed_arrests','has_flock','flock_agencies','shares_with_apd','has_fusus_connect','documented_ice_query','surveillance_mesh_score','surveillance_flags','risk_total_v3','risk_tier_v3'];
    const esc = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const csv = [cols.join(',')].concat(rows.map(r => cols.map(c => esc(r[c])).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ga_county_risk.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

// ---------- MODALS + ENGAGEMENT GATE ----------
(function () {
  const SIGNUP_KEY = 'ga-dash-signup-dismissed';
  const COUNT_KEY = 'ga-dash-county-clicks';
  const BANNER_KEY = 'ga-dash-banner-dismissed';

  function openModal(name) {
    const m = document.getElementById('modal-' + name);
    if (!m) return;
    const iframe = m.querySelector('iframe');
    if (iframe && !iframe.src && iframe.dataset.formId) {
      iframe.src = 'https://form.jotform.com/' + iframe.dataset.formId;
    }
    m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
  function closeModal(m) {
    if (!m) return;
    m.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.openModal));
  });
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const m = e.currentTarget.closest('.modal-backdrop');
      if (btn.hasAttribute('data-dismiss-signup')) {
        try { localStorage.setItem(SIGNUP_KEY, '1'); } catch (_) {}
      }
      closeModal(m);
    });
  });
  document.querySelectorAll('.modal-backdrop').forEach(b => {
    b.addEventListener('click', (e) => { if (e.target === b) closeModal(b); });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop[aria-hidden="false"]').forEach(closeModal);
    }
  });

  // Banner dismiss (close X if present)
  const banner = document.getElementById('partnership-banner');
  if (banner) {
    try {
      if (localStorage.getItem(BANNER_KEY)) banner.style.display = 'none';
    } catch (_) {}
    const x = banner.querySelector('[data-dismiss-banner]');
    if (x) {
      x.addEventListener('click', () => {
        banner.style.display = 'none';
        try { localStorage.setItem(BANNER_KEY, '1'); } catch (_) {}
      });
    }
  }

  // Language switch buttons
  document.querySelectorAll('[data-lang-btn]').forEach(b => {
    b.addEventListener('click', () => {
      if (typeof window.setLang === 'function') window.setLang(b.dataset.langBtn);
    });
  });

  // Expose trigger so selectCounty can call it
  window.maybeTriggerSignup = function () {
    try {
      if (localStorage.getItem(SIGNUP_KEY)) return;
      const n = (parseInt(localStorage.getItem(COUNT_KEY) || '0', 10)) + 1;
      localStorage.setItem(COUNT_KEY, String(n));
      if (n === 3) setTimeout(() => openModal('signup'), 400);
    } catch (_) {}
  };
})();
