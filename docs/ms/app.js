// MS County Risk Dashboard; independent analysis by Rosario Palacios.
// Read-only; no backend. Parallel to the GA build, adapted for MS factors.

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

// FIPS in MS data is already the full 5-digit integer (28xxx); topo geometries also use integer ids 28xxx.
// We key on that integer directly.
const fipsKey = (c) => c.fips;

// ---------- LOAD DATA ----------
let DATA = { counties: [], topo: null, summary: null, byFips: {} };
let SELECTED_FIPS = null;
let MAP_MODE = 'risk_tier';
let SORT_KEY = 'risk_total';
let SORT_DIR = -1;

Promise.all([
  fetch('../data/ms-counties-data.json').then(r => r.json()),
  fetch('../data/ms-counties-topo.json').then(r => r.json()),
  fetch('../data/ms-summary.json').then(r => r.json()),
]).then(([counties, topo, summary]) => {
  DATA.counties = counties;
  DATA.topo = topo;
  DATA.summary = summary;
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
  renderRaidBars();
  renderTable();
  bindFilters();
  bindModeToggle();
}

// ---------- KPIs ----------
function renderKPIs() {
  const s = DATA.summary;

  const tierKeys = ['Critical', 'High', 'Medium', 'Low'];
  const tierColors = {
    Critical: cssVar('--risk-critical'),
    High: cssVar('--risk-high'),
    Medium: cssVar('--risk-medium'),
    Low: cssVar('--risk-low'),
  };
  const fbByTier = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  for (const c of DATA.counties) {
    if (c.risk_tier in fbByTier) fbByTier[c.risk_tier] += (c.foreign_born || 0);
  }

  // 287(g) by model (active only)
  const p287gGroups = {};
  for (const c of DATA.counties) {
    const k = c['287g_status'];
    if (!k || k === 'None') continue;
    p287gGroups[k] = (p287gGroups[k] || 0) + 1;
  }
  const p287gColorMap = {
    'Task Force Model (pending)': cssVar('--risk-critical'),
    'Jail Enforcement Model': cssVar('--risk-high'),
    'Warrant Service Officer': cssVar('--risk-medium'),
  };

  // Meatpacking by intensity
  const meatGroups = { heavy: 0, moderate: 0, some: 0 };
  for (const c of DATA.counties) {
    const m = c.meatpacking_status || '';
    if (m.startsWith('Heavy')) meatGroups.heavy++;
    else if (m.startsWith('Moderate')) meatGroups.moderate++;
    else if (m.startsWith('Some')) meatGroups.some++;
  }

  // segmented horizontal bar
  const segBar = (parts) => {
    const total = parts.reduce((a, p) => a + p.v, 0) || 1;
    return `<div class="seg-bar" role="img" aria-label="${parts.map(p => p.label + ' ' + p.v).join('; ')}">` +
      parts.map(p => `<i style="width:${(p.v / total * 100).toFixed(1)}%;background:${p.color}" title="${p.label}: ${p.v}"></i>`).join('') +
    `</div>` +
    `<div class="spark-legend">${parts.filter(p => p.v > 0).map(p => `<span><i style="background:${p.color}"></i>${p.label}: <strong style="font-family:var(--font-mono);color:var(--color-text);font-weight:600">${p.v}</strong></span>`).join('')}</div>`;
  };

  const microBars = (parts, fmtFn = (n) => n) => {
    const max = Math.max(1, ...parts.map(p => p.v));
    return `<div class="spark" role="img" aria-label="${parts.map(p => p.label + ' ' + fmtFn(p.v)).join('; ')}">` +
      `<svg viewBox="0 0 100 28" preserveAspectRatio="none">` +
        parts.map((p, i) => {
          const w = (100 - (parts.length - 1) * 3) / parts.length;
          const x = i * (w + 3);
          const h = (p.v / max) * 22;
          const y = 28 - h;
          return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.4" fill="${p.color}"><title>${p.label}: ${fmtFn(p.v)}</title></rect>`;
        }).join('') +
      `</svg>` +
    `</div>` +
    `<div class="spark-legend">${parts.map(p => `<span><i style="background:${p.color}"></i>${p.label.charAt(0)}<strong style="font-family:var(--font-mono);color:var(--color-text);font-weight:600;margin-left:2px">${fmtFn(p.v)}</strong></span>`).join('')}</div>`;
  };

  const donut = (value, total, color, label) => {
    const pct = total ? (value / total * 100) : 0;
    const r = 16, c = 2 * Math.PI * r;
    const dash = (pct / 100) * c;
    return `<div class="donut" role="img" aria-label="${label}: ${pct.toFixed(0)} percent">` +
      `<svg width="42" height="42" viewBox="0 0 42 42">` +
        `<circle cx="21" cy="21" r="${r}" fill="none" stroke="var(--color-surface-offset)" stroke-width="5"/>` +
        `<circle cx="21" cy="21" r="${r}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${dash} ${c}" transform="rotate(-90 21 21)"/>` +
      `</svg>` +
      `<div class="donut-lab"><strong>${pct.toFixed(0)}%</strong>${label}</div>` +
    `</div>`;
  };

  const cards = [
    {
      label: t('kpi.counties_tracked'), value: s.total_counties, sub: t('kpi.counties_tracked.sub'), accent: 'var(--color-primary)',
      context: t('kpi.counties_tracked.context'),
      viz: segBar(tierKeys.map(tk => ({ label: t('tier.' + tk.toLowerCase()), v: s.tier_counts[tk] || 0, color: tierColors[tk] }))),
    },
    {
      label: t('kpi.critical_high'), value: s.tier_counts.Critical + s.tier_counts.High, sub: t('kpi.critical_high.sub', { critical: s.tier_counts.Critical, high: s.tier_counts.High }), accent: 'var(--risk-critical)',
      context: t('kpi.critical_high.context'),
      viz: donut(s.tier_counts.Critical + s.tier_counts.High, s.total_counties, cssVar('--risk-critical'), t('kpi.critical_high.donut_lab')),
    },
    {
      label: t('kpi.287g'), value: s['287g_active_count'], sub: t('kpi.287g.sub'), accent: 'var(--risk-high)',
      context: t('kpi.287g.context'),
      viz: segBar(Object.entries(p287gGroups).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, v, color: p287gColorMap[k] || cssVar('--risk-high') }))),
    },
    {
      label: t('kpi.raid'), value: s.raid_2019_total_count, sub: t('kpi.raid.sub', { workers: fmt(s.raid_2019_workers_arrested), plants: s.raid_2019_plants }), accent: 'var(--risk-critical)',
      context: t('kpi.raid.context'),
      viz: segBar([
        { label: t('kpi.raid.direct'), v: s.raid_2019_direct_count, color: cssVar('--risk-critical') },
        { label: t('kpi.raid.adjacent'), v: s.raid_2019_total_count - s.raid_2019_direct_count, color: cssVar('--risk-high') },
      ]),
    },
    {
      label: t('kpi.detention'), value: s.detention_county_count + s.detention_proximity_count, sub: t('kpi.detention.sub', { adams: fmt(s.adams_county_avg_detainees) }), accent: 'var(--risk-high)',
      context: t('kpi.detention.context'),
      viz: segBar([
        { label: t('kpi.detention.host'), v: s.detention_county_count, color: cssVar('--risk-critical') },
        { label: t('kpi.detention.proximity'), v: s.detention_proximity_count, color: cssVar('--risk-medium') },
      ]),
    },
    {
      label: t('kpi.fb'), value: fmt(s.total_foreign_born), sub: t('kpi.fb.sub', { total: fmt(s.total_pop) }), accent: 'var(--color-primary)',
      context: t('kpi.fb.context'),
      viz: microBars(tierKeys.map(tk => ({ label: t('tier.' + tk.toLowerCase()), v: fbByTier[tk], color: tierColors[tk] })), (n) => fmt(n)),
    },
  ];

  // Optionally append meatpacking as a 7th KPI if i18n provides it
  if (s.meatpacking_heavy_count != null) {
    cards.push({
      label: t('kpi.meatpacking'), value: s.meatpacking_heavy_count + meatGroups.moderate, sub: t('kpi.meatpacking.sub'), accent: 'var(--color-accent)',
      context: t('kpi.meatpacking.context'),
      viz: segBar([
        { label: t('kpi.meatpacking.heavy'), v: meatGroups.heavy, color: cssVar('--risk-critical') },
        { label: t('kpi.meatpacking.moderate'), v: meatGroups.moderate, color: cssVar('--risk-high') },
        { label: t('kpi.meatpacking.some'), v: meatGroups.some, color: cssVar('--risk-medium') },
      ]),
    });
  }

  const grid = document.getElementById('kpi-grid');
  grid.innerHTML = cards.map(c => `
    <div class="kpi" style="--accent-color: ${c.accent}">
      <div class="label">${c.label}</div>
      <div class="value">${c.value}</div>
      <div class="sub">${c.sub}</div>
      ${c.context ? `<div class="context">${c.context}</div>` : ''}
      ${c.viz || ''}
    </div>
  `).join('');
}

// ---------- MAP ----------
let PROJECTION = null;

function renderMap() {
  const svg = d3.select('#map');
  svg.selectAll('*').remove();
  const W = 540, H = 720;
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

  svg.append('path').attr('id', 'selected-outline').attr('fill', 'none').attr('stroke', cssVar('--color-text')).attr('stroke-width', 2).attr('pointer-events', 'none');

  drawLegend();
  if (SELECTED_FIPS != null) updateSelectedOutline();
}
window.__renderMap = renderMap;

function fillForFeature(d) {
  const row = DATA.byFips[d.id];
  if (!row) return cssVar('--color-divider');
  if (MAP_MODE === 'risk_tier') return TIER_COLORS[row.risk_tier]();
  if (MAP_MODE === '287g_status') {
    if (row['287g_status'].includes('Task Force')) return cssVar('--risk-critical');
    if (row['287g_status'] === 'Jail Enforcement Model') return cssVar('--risk-high');
    if (row['287g_status'] === 'Warrant Service Officer') return cssVar('--risk-medium');
    return cssVar('--color-divider');
  }
  if (MAP_MODE === 'raid_2019') {
    if (row.raid_2019_status === 'Direct 2019 raid site') return cssVar('--risk-critical');
    if (row.raid_2019_status === 'Adjacent / affected community') return cssVar('--risk-high');
    return cssVar('--color-divider');
  }
  if (MAP_MODE === 'detention') {
    if (row.detention_status === 'Hosts ICE detention facility') return cssVar('--risk-critical');
    if (row.detention_status === 'ICE processing hub') return cssVar('--risk-high');
    return cssVar('--color-divider');
  }
  if (MAP_MODE === 'fb_pct') {
    const max = d3.max(DATA.counties, c => c.fb_pct) || 1;
    const v = Math.min(1, row.fb_pct / max);
    return d3.interpolateRgb(cssVar('--color-surface-offset'), cssVar('--risk-critical'))(v);
  }
  return cssVar('--color-divider');
}

function drawLegend() {
  const el = document.getElementById('map-legend');
  let items = [];
  if (MAP_MODE === 'risk_tier') {
    items = TIERS.map(tier => ({ label: t('tier.' + tier.toLowerCase()), color: TIER_COLORS[tier]() }));
  } else if (MAP_MODE === '287g_status') {
    items = [
      { label: t('legend.multiple_agencies'), color: cssVar('--risk-critical') },
      { label: t('legend.one_agency'), color: cssVar('--risk-high') },
      { label: t('legend.no_287g'), color: cssVar('--color-divider') },
    ];
  } else if (MAP_MODE === 'raid_2019') {
    items = [
      { label: t('legend.raid_direct'), color: cssVar('--risk-critical') },
      { label: t('legend.raid_adjacent'), color: cssVar('--risk-high') },
      { label: t('legend.raid_none'), color: cssVar('--color-divider') },
    ];
  } else if (MAP_MODE === 'detention') {
    items = [
      { label: t('legend.detention_host'), color: cssVar('--risk-critical') },
      { label: t('legend.detention_hub'), color: cssVar('--risk-high') },
      { label: t('legend.detention_none'), color: cssVar('--color-divider') },
    ];
  } else if (MAP_MODE === 'fb_pct') {
    items = [
      { label: t('legend.lower_pct') || 'Lower %', color: cssVar('--color-surface-offset') },
      { label: t('legend.higher_pct') || 'Higher %', color: cssVar('--risk-critical') },
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
}

// ---------- TOOLTIP ----------
const tip = document.getElementById('tooltip');
function showTip(e, d) {
  const row = DATA.byFips[d.id];
  if (!row) return;
  const ag = row['287g_status'] === 'None' ? t('tip.no_287g') : row['287g_status'];
  const tierLabel = t('tier.' + row.risk_tier.toLowerCase());
  const raidBit = row.raid_2019_status === 'Direct 2019 raid site' ? ' · 2019' : '';
  tip.innerHTML = `<div class="t-name">${row.county} ${t('detail.county_suffix')}</div><div class="t-meta">${tierLabel} · ${t('tip.score')} ${row.risk_total} · ${ag}${raidBit}</div>`;
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
function selectCounty(fips) {
  const isNewSelection = SELECTED_FIPS !== fips;
  SELECTED_FIPS = fips;
  window.SELECTED_FIPS = SELECTED_FIPS;
  d3.selectAll('path.county-shape').classed('selected', d => d.id === fips);
  updateSelectedOutline();
  renderDetail(DATA.byFips[fips]);
  if (isNewSelection && typeof window.maybeTriggerSignup === 'function') window.maybeTriggerSignup();
  if (window.innerWidth < 980) {
    document.getElementById('detail-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function updateSelectedOutline() {
  const counties = topojson.feature(DATA.topo, DATA.topo.objects.counties);
  const f = counties.features.find(x => x.id === SELECTED_FIPS);
  if (!f) return;
  const W = 540, H = 720;
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
  if (c['287g_count'] > 0) tags.push({ t: t('detail.tag.287g', { status: c['287g_status'] }), cls: 'warn' });
  if (c.raid_2019_status === 'Direct 2019 raid site') tags.push({ t: t('detail.tag.raid_direct'), cls: 'danger' });
  else if (c.raid_2019_status === 'Adjacent / affected community') tags.push({ t: t('detail.tag.raid_adjacent'), cls: 'warn' });
  if (c.detention_status === 'Hosts ICE detention facility') tags.push({ t: t('detail.tag.detention_host'), cls: 'danger' });
  else if (c.detention_status === 'ICE processing hub') tags.push({ t: t('detail.tag.detention_hub'), cls: 'warn' });
  if ((c.meatpacking_status || '').startsWith('Heavy')) tags.push({ t: t('detail.tag.meat_heavy'), cls: 'warn' });
  else if ((c.meatpacking_status || '').startsWith('Moderate')) tags.push({ t: t('detail.tag.meat_mod'), cls: '' });
  if (tags.length === 0) tags.push({ t: t('detail.tag.none'), cls: 'ok' });

  const maxBars = [
    { label: t('detail.score.287g'), val: c.score_287g, max: 20 },
    { label: t('detail.score.raid'), val: c.score_raid_2019, max: 25 },
    { label: t('detail.score.detention'), val: c.score_detention, max: 25 },
    { label: t('detail.score.meatpacking'), val: c.score_meatpacking, max: 20 },
    { label: t('detail.score.fb'), val: c.score_foreign_born, max: 25 },
    { label: t('detail.score.hisp'), val: c.score_hispanic, max: 23 },
    { label: t('detail.score.hb538'), val: c.score_hb538_base, max: 5 },
  ];

  const tierLabel = t('tier.' + c.risk_tier.toLowerCase());

  el.innerHTML = `
    <div class="panel-head">
      <div>
        <h3>${c.county} ${t('detail.county_suffix')}</h3>
        <p class="sub">${t('detail.fips')} ${c.fips} · ${t('detail.pop')} ${fmt(c.total_pop)}</p>
      </div>
      <span class="tier-badge tier-${c.risk_tier}">${tierLabel} · ${c.risk_total}</span>
    </div>

    <div class="stat-grid">
      <div class="row"><span class="l">${t('detail.stat.fb')}</span><span class="v">${fmt(c.foreign_born)} <span style="color: var(--color-text-muted); font-weight: 500;">(${fmtPct(c.fb_pct)})</span></span></div>
      <div class="row"><span class="l">${t('detail.stat.hisp')}</span><span class="v">${fmt(c.hispanic)} <span style="color: var(--color-text-muted); font-weight: 500;">(${fmtPct(c.hisp_pct)})</span></span></div>
      <div class="row"><span class="l">${t('detail.stat.287g')}</span><span class="v" style="font-size: var(--text-sm); font-family: var(--font-body); font-weight: 600;">${c['287g_status'] === 'None' ? t('detail.stat.not_participating') : c['287g_status']}</span></div>
      <div class="row"><span class="l">${t('detail.stat.hb538')}</span><span class="v" style="font-size: var(--text-sm); font-family: var(--font-body); font-weight: 600;">${c.hb538_status}</span></div>
      <div class="row"><span class="l">${t('detail.stat.detention')}</span><span class="v" style="font-size: var(--text-sm); font-family: var(--font-body); font-weight: 600;">${c.detention_status}</span></div>
      <div class="row"><span class="l">${t('detail.stat.meatpacking')}</span><span class="v" style="font-size: var(--text-sm); font-family: var(--font-body); font-weight: 600;">${c.meatpacking_status}</span></div>
    </div>

    ${c['287g_agencies'] ? `<p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: var(--space-3);"><strong style="color: var(--color-text);">${t('detail.287g_agencies')}</strong> ${c['287g_agencies']}</p>` : ''}
    ${c.raid_2019_notes ? `<p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: var(--space-3);"><strong style="color: var(--color-text);">${t('detail.raid_notes')}</strong> ${c.raid_2019_notes}</p>` : ''}
    ${c.detention_notes ? `<p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: var(--space-4);"><strong style="color: var(--color-text);">${t('detail.detention_notes')}</strong> ${c.detention_notes}</p>` : ''}

    <h4 style="font-size: var(--text-sm); font-weight: 700; margin: var(--space-4) 0 var(--space-3); letter-spacing: -0.01em;">${t('detail.score_breakdown')}</h4>
    ${maxBars.map(b => `
      <div class="score-bar-row">
        <span class="lab">${b.label}</span>
        <div class="track"><div class="fill" style="width: ${b.max ? (b.val / b.max) * 100 : 0}%; background: ${tierColorForScore(b.val, b.max)};"></div></div>
        <span class="num">${b.val}</span>
      </div>
    `).join('')}

    <div class="tag-row">
      ${tags.map(tt => `<span class="tag ${tt.cls}">${tt.t}</span>`).join('')}
    </div>
  `;
}

function tierColorForScore(val, max) {
  if (!max) return cssVar('--color-divider');
  const ratio = val / max;
  if (ratio >= 0.75) return cssVar('--risk-critical');
  if (ratio >= 0.5) return cssVar('--risk-high');
  if (ratio >= 0.25) return cssVar('--risk-medium');
  if (ratio > 0) return cssVar('--risk-low');
  return cssVar('--color-divider');
}

// ---------- TIER BARS ----------
function renderTierBars() {
  const tiers = TIERS.map(tt => {
    const counties = DATA.counties.filter(c => c.risk_tier === tt);
    return {
      tier: tt,
      count: counties.length,
      fb: counties.reduce((s, c) => s + c.foreign_born, 0),
      hisp: counties.reduce((s, c) => s + c.hispanic, 0),
      color: TIER_COLORS[tt](),
    };
  });
  const max = d3.max(tiers, x => x.count) || 1;
  const totalFB = d3.sum(tiers, x => x.fb) || 1;
  const totalHisp = d3.sum(tiers, x => x.hisp) || 1;
  const el = document.getElementById('tier-bars');
  el.innerHTML = tiers.map(tt => `
    <div class="bar-row">
      <span class="lab">${t('tier.' + tt.tier.toLowerCase())}</span>
      <div class="track"><div class="fill" style="width: ${(tt.count / max) * 100}%; background: ${tt.color};">${tt.count}</div></div>
    </div>
  `).join('') + `
    <div style="margin-top: var(--space-5); display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--color-divider);">
      <div>
        <div style="font-size: var(--text-xs); font-weight: 600; color: var(--color-text-muted); letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: var(--space-2);">${t('tier.fb_share') || 'FB share'}</div>
        ${tiers.map(tt => `<div style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);margin-bottom:4px;"><div style="width:8px;height:8px;border-radius:2px;background:${tt.color}"></div><span style="width:60px">${t('tier.' + tt.tier.toLowerCase())}</span><span style="font-family:var(--font-mono);font-weight:600;">${(tt.fb / totalFB * 100).toFixed(0)}%</span></div>`).join('')}
      </div>
      <div>
        <div style="font-size: var(--text-xs); font-weight: 600; color: var(--color-text-muted); letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: var(--space-2);">${t('tier.hisp_share') || 'Hispanic share'}</div>
        ${tiers.map(tt => `<div style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);margin-bottom:4px;"><div style="width:8px;height:8px;border-radius:2px;background:${tt.color}"></div><span style="width:60px">${t('tier.' + tt.tier.toLowerCase())}</span><span style="font-family:var(--font-mono);font-weight:600;">${(tt.hisp / totalHisp * 100).toFixed(0)}%</span></div>`).join('')}
      </div>
    </div>
  `;
}

// ---------- 287g BARS ----------
function render287gBars() {
  const active = DATA.counties.filter(c => c['287g_status'] !== 'None');
  const groups = d3.rollups(active, v => v.length, c => c['287g_status'])
    .map(([k, v]) => ({ k, v }))
    .sort((a, b) => b.v - a.v);
  const noneCount = DATA.counties.filter(c => c['287g_status'] === 'None').length;
  groups.push({ k: 'None', v: noneCount });

  const max = d3.max(groups, g => g.v) || 1;
  const colors = {
    'Task Force Model (pending)': cssVar('--risk-critical'),
    'Jail Enforcement Model': cssVar('--risk-high'),
    'Warrant Service Officer': cssVar('--risk-medium'),
    'None': cssVar('--color-divider'),
  };
  const el = document.getElementById('287g-bars');
  el.innerHTML = groups.map(g => {
    const label = g.k === 'None' ? (t('p287g.bar.none') || t('legend.no_287g')) : g.k;
    return `
      <div class="bar-row">
        <span class="lab" style="width: 168px; font-size: var(--text-xs);">${label}</span>
        <div class="track"><div class="fill" style="width: ${(g.v / max) * 100}%; background: ${colors[g.k] || cssVar('--color-primary')}; color: ${g.k === 'None' ? 'var(--color-text)' : 'white'};">${g.v}</div></div>
      </div>
    `;
  }).join('');
}

// ---------- RAID BARS (2019) ----------
function renderRaidBars() {
  const direct = DATA.counties.filter(c => c.raid_2019_status === 'Direct 2019 raid site')
    .sort((a, b) => b.risk_total - a.risk_total);
  const adjacent = DATA.counties.filter(c => c.raid_2019_status === 'Adjacent / affected community')
    .sort((a, b) => b.risk_total - a.risk_total);

  const rows = [
    ...direct.map(c => ({ county: c.county, score: 25, color: cssVar('--risk-critical'), kind: t('kpi.raid.direct') })),
    ...adjacent.map(c => ({ county: c.county, score: 12, color: cssVar('--risk-high'), kind: t('kpi.raid.adjacent') })),
  ];
  const max = 25;
  const el = document.getElementById('raid-bars');
  if (!rows.length) { el.innerHTML = ''; return; }
  el.innerHTML = rows.map(r => `
    <div class="bar-row">
      <span class="lab" style="width: 130px; font-size: var(--text-sm);">${r.county}</span>
      <div class="track"><div class="fill" style="width: ${(r.score / max) * 100}%; background: ${r.color};">${r.score}</div></div>
    </div>
  `).join('');
}

// ---------- TABLE ----------
function renderTable() {
  let rows = filterRows();
  rows = sortRows(rows);
  const tbody = document.getElementById('county-tbody');
  tbody.innerHTML = rows.map(c => {
    const isDirect = c.raid_2019_status === 'Direct 2019 raid site';
    const isAdj = c.raid_2019_status === 'Adjacent / affected community';
    const isHost = c.detention_status === 'Hosts ICE detention facility';
    const isHub = c.detention_status === 'ICE processing hub';
    return `
      <tr data-fips="${fipsKey(c)}">
        <td><strong>${c.county}</strong></td>
        <td class="num"><strong>${c.risk_total}</strong></td>
        <td><span class="tier-badge tier-${c.risk_tier}" style="padding:2px 8px;font-size:11px;">${t('tier.' + c.risk_tier.toLowerCase())}</span></td>
        <td>${c['287g_status'] !== 'None' ? `<span class="tag warn" style="padding:2px 6px;font-size:11px;">${c['287g_status']}</span>` : '<span class="dash">·</span>'}</td>
        <td>${isDirect ? `<span class="tag danger" style="padding:1px 5px;font-size:10px;">2019</span>` : isAdj ? `<span class="tag warn" style="padding:1px 5px;font-size:10px;">adj.</span>` : '<span class="dash">·</span>'}</td>
        <td>${isHost ? `<span class="tag danger" style="padding:1px 5px;font-size:10px;">host</span>` : isHub ? `<span class="tag warn" style="padding:1px 5px;font-size:10px;">hub</span>` : '<span class="dash">·</span>'}</td>
        <td class="num">${c.score_meatpacking || '<span class="dash">·</span>'}</td>
        <td class="num">${fmtPct(c.fb_pct)}</td>
        <td class="num">${fmtPct(c.hisp_pct)}</td>
      </tr>
    `;
  }).join('');
  tbody.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('click', () => {
      const fips = parseInt(tr.dataset.fips, 10);
      selectCounty(fips);
      document.getElementById('detail-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
  updateSortIndicators();
  // Update county-count pill
  const pill = document.getElementById('county-count-pill');
  if (pill) pill.textContent = `${rows.length} / ${DATA.counties.length} ${t('hero.meta.counties') ? '' : 'counties'}`.trim();
}

function filterRows() {
  const q = (document.getElementById('search').value || '').trim().toLowerCase();
  const tier = document.getElementById('filter-tier').value;
  const ag = document.getElementById('filter-287g').value;
  const raid = document.getElementById('filter-raid').value;
  return DATA.counties.filter(c => {
    if (q && !c.county.toLowerCase().includes(q)) return false;
    if (tier && c.risk_tier !== tier) return false;
    if (ag === 'active' && c['287g_status'] === 'None') return false;
    if (ag === 'inactive' && c['287g_status'] !== 'None') return false;
    if (raid === 'direct' && c.raid_2019_status !== 'Direct 2019 raid site') return false;
    if (raid === 'adjacent' && c.raid_2019_status !== 'Adjacent / affected community') return false;
    if (raid === 'outside' && c.raid_2019_status !== 'Not in 2019 raid footprint') return false;
    return true;
  });
}

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    let av = a[SORT_KEY], bv = b[SORT_KEY];
    if (SORT_KEY === 'risk_tier') {
      const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      av = order[av]; bv = order[bv];
    }
    if (SORT_KEY === '287g_status') {
      const score = (s) => s === 'None' ? 0 : s.includes('Task Force') ? 3 : s === 'Jail Enforcement Model' ? 2 : 1;
      av = score(a['287g_status']); bv = score(b['287g_status']);
    }
    if (SORT_KEY === 'raid_2019_status') {
      const score = (s) => s === 'Direct 2019 raid site' ? 2 : s === 'Adjacent / affected community' ? 1 : 0;
      av = score(a.raid_2019_status); bv = score(b.raid_2019_status);
    }
    if (SORT_KEY === 'detention_status') {
      const score = (s) => s === 'Hosts ICE detention facility' ? 2 : s === 'ICE processing hub' ? 1 : 0;
      av = score(a.detention_status); bv = score(b.detention_status);
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
  document.getElementById('filter-raid').addEventListener('change', renderTable);
  document.querySelectorAll('#county-table thead th').forEach(th => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (SORT_KEY === k) SORT_DIR *= -1;
      else { SORT_KEY = k; SORT_DIR = (k === 'county' ? 1 : -1); }
      renderTable();
    });
  });
}

// ---------- LIVE RERENDER FOR LANG/THEME SWITCH ----------
window.__rerender = function () {
  if (!DATA.counties.length) return;
  renderKPIs();
  renderTierBars();
  render287gBars();
  renderRaidBars();
  renderTable();
  drawLegend();
  if (SELECTED_FIPS != null && DATA.byFips[SELECTED_FIPS]) renderDetail(DATA.byFips[SELECTED_FIPS]);
};

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

  document.querySelectorAll('[data-lang-btn]').forEach(b => {
    b.addEventListener('click', () => {
      if (typeof window.setLang === 'function') window.setLang(b.dataset.langBtn);
    });
  });

  window.maybeTriggerSignup = function () {
    try {
      if (localStorage.getItem(SIGNUP_KEY)) return;
      const n = (parseInt(localStorage.getItem(COUNT_KEY) || '0', 10)) + 1;
      localStorage.setItem(COUNT_KEY, String(n));
      if (n === 3) setTimeout(() => openModal('signup'), 400);
    } catch (_) {}
  };
})();
