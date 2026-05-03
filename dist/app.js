// GA County Risk Dashboard — Common Cause Georgia
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
]).then(([counties, topo, summary]) => {
  DATA.counties = counties;
  DATA.topo = topo;
  DATA.summary = summary;
  DATA.byFips = Object.fromEntries(counties.map(c => [fipsKey(c), c]));
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
  bindExport();
}

// ---------- KPIs ----------
function renderKPIs() {
  const s = DATA.summary;
  const arrestsCount = DATA.counties.filter(c => c.observed_arrests > 0).length;
  const cards = [
    { label: 'Counties tracked', value: s.total_counties, sub: 'All Georgia counties', accent: 'var(--color-primary)' },
    { label: 'Critical · High tier', value: s.tier_counts.Critical + s.tier_counts.High, sub: `${s.tier_counts.Critical} Critical · ${s.tier_counts.High} High`, accent: 'var(--risk-critical)' },
    { label: '287(g) agreements', value: s['287g_active_count'], sub: 'Active local agency partnerships', accent: 'var(--risk-high)' },
    { label: 'Flock-network counties', value: s.flock_county_count, sub: `${s.ice_query_documented_count} with documented ICE queries`, accent: 'var(--color-accent)' },
    { label: 'Foreign-born residents', value: fmt(s.total_foreign_born), sub: 'Across the state', accent: 'var(--color-primary)' },
    { label: 'Observed arrests', value: fmt(s.total_observed_arrests), sub: `Across ${arrestsCount} counties; coalition-aggregated`, accent: 'var(--risk-medium)' },
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
function renderMap() {
  const svg = d3.select('#map');
  svg.selectAll('*').remove();
  const W = 700, H = 720;
  const counties = topojson.feature(DATA.topo, DATA.topo.objects.counties);
  const projection = d3.geoMercator().fitSize([W, H], counties);
  const path = d3.geoPath(projection);

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

  // selected outline overlay
  g.append('path').attr('id', 'selected-outline').attr('fill', 'none').attr('stroke', cssVar('--color-text')).attr('stroke-width', 2).attr('pointer-events', 'none');

  drawLegend();
  if (SELECTED_FIPS) updateSelectedOutline();
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
    items = TIERS.map(t => ({ label: t, color: TIER_COLORS[t]() }));
  } else if (MAP_MODE === '287g_status') {
    items = [
      { label: 'Multiple agencies', color: cssVar('--risk-critical') },
      { label: 'One agency', color: cssVar('--risk-high') },
      { label: 'No 287(g)', color: cssVar('--color-divider') },
    ];
  } else if (MAP_MODE === 'has_flock') {
    items = [
      { label: 'Documented ICE query', color: cssVar('--risk-critical') },
      { label: 'Shares with APD or FUSUS', color: cssVar('--risk-high') },
      { label: 'Has Flock', color: cssVar('--risk-medium') },
      { label: 'No Flock', color: cssVar('--color-divider') },
    ];
  } else if (MAP_MODE === 'fb_pct') {
    items = [
      { label: 'Lower %', color: cssVar('--color-surface-offset') },
      { label: 'Higher %', color: cssVar('--risk-critical') },
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
      // re-fill paths in place
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
  const ag = row['287g_status'] === 'None' ? 'no 287(g)' : row['287g_status'];
  tip.innerHTML = `<div class="t-name">${row.county} County</div><div class="t-meta">${row.risk_tier_v3} · score ${row.risk_total_v3} · ${ag}${row.has_flock ? ' · Flock' : ''}</div>`;
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
  SELECTED_FIPS = fips5;
  d3.selectAll('path.county-shape').classed('selected', d => d.id === fips5);
  updateSelectedOutline();
  renderDetail(DATA.byFips[fips5]);
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
  if (c.metro_atlanta) tags.push({ t: 'Metro Atlanta', cls: '' });
  if (c['287g_count'] > 0) tags.push({ t: `${c['287g_count']} × 287(g)`, cls: 'warn' });
  if (c.documented_ice_query) tags.push({ t: 'ICE query documented', cls: 'danger' });
  else if (c.has_flock) tags.push({ t: 'Flock deployed', cls: 'warn' });
  if (c.shares_with_apd) tags.push({ t: 'Shares with APD', cls: 'warn' });
  if (c.has_fusus_connect) tags.push({ t: 'FUSUS-connected', cls: 'warn' });
  if (c.observed_arrests > 0) tags.push({ t: `${c.observed_arrests} observed arrests`, cls: 'danger' });
  if (tags.length === 0) tags.push({ t: 'No tracked indicators', cls: 'ok' });

  // score breakdown bars (each scaled to its max possible weight)
  const maxBars = [
    { label: '287(g)', val: c.score_287g, max: 25 },
    { label: 'Foreign-born', val: c.score_foreign_born, max: 25 },
    { label: 'Hispanic %', val: c.score_hispanic, max: 25 },
    { label: 'ICE infra', val: c.score_ice_infra, max: 25 },
    { label: 'HB 1105 base', val: c.score_hb1105_base, max: 5 },
    { label: 'Surveillance', val: c.surveillance_mesh_score * 2, max: 10 },
  ];

  const arrestsBar = c.observed_arrests > 0 ? `
    <div class="score-bar-row" style="margin-top: var(--space-2);">
      <span class="lab">Observed arrests</span>
      <div class="track"><div class="fill" style="width: ${Math.min(100, c.observed_arrests / 5)}%; background: var(--risk-high);"></div></div>
      <span class="num">${c.observed_arrests}</span>
    </div>` : '';

  el.innerHTML = `
    <div class="panel-head">
      <div>
        <h3>${c.county} County</h3>
        <p class="sub">FIPS 13${pad3(c.fips)} · ${c.metro_atlanta ? 'Metro Atlanta' : 'Outside Metro Atlanta'} · pop ${fmt(c.total_pop)}</p>
      </div>
      <span class="tier-badge tier-${c.risk_tier_v3}">${c.risk_tier_v3} · ${c.risk_total_v3}</span>
    </div>

    <div class="stat-grid">
      <div class="row"><span class="l">Foreign-born</span><span class="v">${fmt(c.foreign_born)} <span style="color: var(--color-text-muted); font-weight: 500;">(${fmtPct(c.fb_pct)})</span></span></div>
      <div class="row"><span class="l">Hispanic</span><span class="v">${fmt(c.hispanic)} <span style="color: var(--color-text-muted); font-weight: 500;">(${fmtPct(c.hisp_pct)})</span></span></div>
      <div class="row"><span class="l">287(g) status</span><span class="v" style="font-size: var(--text-sm); font-family: var(--font-body); font-weight: 600;">${c['287g_status'] === 'None' ? 'Not participating' : c['287g_status']}</span></div>
      <div class="row"><span class="l">HB 1105</span><span class="v" style="font-size: var(--text-sm); font-family: var(--font-body); font-weight: 600;">${c.hb1105_status}</span></div>
    </div>

    ${c['287g_agencies'] ? `<p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: var(--space-3);"><strong style="color: var(--color-text);">287(g) agencies:</strong> ${c['287g_agencies']}</p>` : ''}
    ${c.ice_infrastructure ? `<p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: var(--space-4);"><strong style="color: var(--color-text);">ICE infrastructure:</strong> ${c.ice_infrastructure}</p>` : ''}

    <h4 style="font-size: var(--text-sm); font-weight: 700; margin: var(--space-4) 0 var(--space-3); letter-spacing: -0.01em;">Score breakdown</h4>
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

    ${c.flock_agencies ? `<p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: var(--space-4); line-height: 1.55;"><strong style="color: var(--color-text);">Flock agencies:</strong> ${c.flock_agencies}</p>` : ''}
    ${c.surveillance_flags ? `<p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: var(--space-2); line-height: 1.55;"><strong style="color: var(--color-text);">Surveillance flags:</strong> ${c.surveillance_flags}</p>` : ''}
  `;
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
  el.innerHTML = tiers.map(t => `
    <div class="bar-row">
      <span class="lab">${t.tier}</span>
      <div class="track"><div class="fill" style="width: ${(t.count / max) * 100}%; background: ${t.color};">${t.count}</div></div>
    </div>
  `).join('') + `
    <div style="margin-top: var(--space-5); display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--color-divider);">
      <div>
        <div style="font-size: var(--text-xs); font-weight: 600; color: var(--color-text-muted); letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: var(--space-2);">Foreign-born share by tier</div>
        ${tiers.map(t => `<div style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);margin-bottom:4px;"><div style="width:8px;height:8px;border-radius:2px;background:${t.color}"></div><span style="width:60px">${t.tier}</span><span style="font-family:var(--font-mono);font-weight:600;">${(t.fb / totalFB * 100).toFixed(0)}%</span></div>`).join('')}
      </div>
      <div>
        <div style="font-size: var(--text-xs); font-weight: 600; color: var(--color-text-muted); letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: var(--space-2);">Observed arrests by tier</div>
        ${tiers.map(t => `<div style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);margin-bottom:4px;"><div style="width:8px;height:8px;border-radius:2px;background:${t.color}"></div><span style="width:60px">${t.tier}</span><span style="font-family:var(--font-mono);font-weight:600;">${totalArr ? (t.arrests / totalArr * 100).toFixed(0) : 0}%</span></div>`).join('')}
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
  el.innerHTML = groups.map(g => `
    <div class="bar-row">
      <span class="lab" style="width: 168px; font-size: var(--text-xs);">${g.k}</span>
      <div class="track"><div class="fill" style="width: ${(g.v / max) * 100}%; background: ${colors[g.k] || cssVar('--color-primary')}; color: ${g.k === 'No 287(g)' ? 'var(--color-text)' : 'white'};">${g.v}</div></div>
    </div>
  `).join('');
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
      <td><strong>${c.county}</strong>${c.metro_atlanta ? ' <span style="color:var(--color-text-faint);font-weight:400;font-size:var(--text-xs);">· Metro</span>' : ''}</td>
      <td class="num"><strong>${c.risk_total_v3}</strong></td>
      <td><span class="tier-badge tier-${c.risk_tier_v3}" style="padding:2px 8px;font-size:11px;">${c.risk_tier_v3}</span></td>
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

function bindExport() {
  document.getElementById('export-csv').addEventListener('click', () => {
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
