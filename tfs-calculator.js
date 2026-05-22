// ============================================================
// The Fantasy Sanctuary — Dynasty Trade Calculator
// Values loaded live from Google Sheets CSV
// Includes league setting value adjustments
// ============================================================

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSHDN2QSRWf9QQpAB395HyNHstIXC9LYh_7d23i6zeS-uLqkDgjYSR1SVwdUgtqKIwHzuN26N1uH3s/pub?output=csv";

// ── State ─────────────────────────────────────────────────────

let ALL_PLAYERS = [];
let fmt = 'sf';       // 'sf' | 'qb'
let tepMode = 'tep';  // 'tep' | 'ppr'

const settings = {
  teamSize: null,           // null | '8' | '10' | '12' | '14' | '16'
  tepLevel: null,           // null | '0.5pt' | '1pt' | '1.5pt' | '2pt'
  start2TEs: false,
  sixPtPass: false,
  pointPerCarry: false,
  pointPerFirstDown: false,
  tieredPPR: false,
};

const teams = { A: [], B: [] };
let selected = null;

// ── Adjustment Multipliers ────────────────────────────────────
// Source: Value Adjustments table (image provided)

function getMultipliers() {
  const m = { QB: 1, RB: 1, WR: 1, TE: 1, PICK: 1 };

  // Team size
  if (settings.teamSize === '8')  { m.QB *= 0.75; m.TE *= 0.90; m.PICK *= 1.25; }
  if (settings.teamSize === '10') { m.QB *= 0.90; m.PICK *= 1.10; }
  if (settings.teamSize === '12') { /* 12 team = base values, no adjustment */ }
  if (settings.teamSize === '14') { m.QB *= 1.10; m.PICK *= 0.95; }
  if (settings.teamSize === '16') { m.QB *= 1.25; m.RB *= 1.05; m.TE *= 1.10; m.PICK *= 0.90; }

  // TE Premium level
  if (settings.tepLevel === '0.5pt') { /* 0.5pt TEp = base TEp values, no adjustment */ }
  if (settings.tepLevel === '1pt')   { m.TE *= 1.10; }
  if (settings.tepLevel === '1.5pt') { m.TE *= 1.25; }
  if (settings.tepLevel === '2pt')   { m.TE *= 1.40; m.PICK *= 1.05; }

  // Start 2 TEs (bonus)
  if (settings.start2TEs) { m.TE *= 1.50; }

  // 6pt Passing TD
  if (settings.sixPtPass) { m.QB *= 1.05; }

  // Point Per Carry (QB boost approximate for rushing QBs)
  if (settings.pointPerCarry) { m.QB *= 1.20; m.RB *= 1.50; m.PICK *= 1.05; }

  // Point per First Down
  if (settings.pointPerFirstDown) { m.RB *= 1.10; m.WR *= 1.20; m.TE *= 1.15; m.PICK *= 1.05; }

  // Tiered PPR
  if (settings.tieredPPR) { m.RB *= 0.95; m.WR *= 1.20; m.TE *= 1.10; }

  return m;
}

// ── Helpers ───────────────────────────────────────────────────

function parseNum(s) {
  if (!s) return 0;
  const n = parseFloat(s.toString().replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function posColor(pos) {
  return { QB: 'pQB', RB: 'pRB', WR: 'pWR', TE: 'pTE', PICK: 'pPICK' }[pos] || 'pWR';
}

function getBaseValue(p) {
  if (p.pos === 'QB')   return fmt === 'sf' ? p.sf : p.qb1;
  if (p.pos === 'TE')   return tepMode === 'tep' ? p.tep : p.ppr;
  if (p.pos === 'PICK') return fmt === 'sf' ? p.sf : p.qb1;
  return p.sf; // RB and WR are the same across formats
}

function getValue(p) {
  const base = getBaseValue(p);
  const m = getMultipliers();
  return Math.round(base * (m[p.pos] || 1));
}

// ── CSV Fetching & Parsing ────────────────────────────────────

async function loadCSV() {
  const res = await fetch(CSV_URL + "&t=" + Date.now());
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}

function parseCSV(text) {
  const lines = text.split('\n');
  const players = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));

    if (cols[0] && cols[0].length > 1)
      players.push({ name: cols[0], pos: 'QB',
        sf: parseNum(cols[1]), qb1: parseNum(cols[2]),
        tep: parseNum(cols[1]), ppr: parseNum(cols[1]) });

    if (cols[4] && cols[4].length > 1) {
      const v = parseNum(cols[5]);
      players.push({ name: cols[4], pos: 'RB', sf: v, qb1: v, tep: v, ppr: v });
    }

    if (cols[7] && cols[7].length > 1) {
      const v = parseNum(cols[8]);
      players.push({ name: cols[7], pos: 'WR', sf: v, qb1: v, tep: v, ppr: v });
    }

    if (cols[10] && cols[10].length > 1)
      players.push({ name: cols[10], pos: 'TE',
        sf: parseNum(cols[11]), qb1: parseNum(cols[11]),
        tep: parseNum(cols[11]), ppr: parseNum(cols[12]) });

    if (cols[14] && cols[14].length > 1)
      players.push({ name: cols[14], pos: 'PICK',
        sf: parseNum(cols[15]), qb1: parseNum(cols[16]),
        tep: parseNum(cols[15]), ppr: parseNum(cols[16]) });
  }

  const seen = new Set();
  return players.filter(p => {
    const k = p.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
}

// ── League Settings UI ────────────────────────────────────────

function buildSettingsUI() {
  const container = document.getElementById('leagueSettings');
  if (!container) return;

  container.innerHTML = `
    <div class="ls-title">⚙️ League Settings <span class="ls-sub">Adjust values for your league</span></div>

    <div class="ls-section">
      <div class="ls-label">Team Size</div>
      <div class="tgroup">
        <button class="tbtn" id="ts8"  onclick="toggleTeamSize('8')">8 Team</button>
        <button class="tbtn" id="ts10" onclick="toggleTeamSize('10')">10 Team</button>
        <button class="tbtn" id="ts12" onclick="toggleTeamSize('12')">12 Team</button>
        <button class="tbtn" id="ts14" onclick="toggleTeamSize('14')">14 Team</button>
        <button class="tbtn" id="ts16" onclick="toggleTeamSize('16')">16 Team</button>
      </div>
    </div>

    <div class="ls-section">
      <div class="ls-label">TE Premium Level <span class="ls-note">(stacks with TE toggle above)</span></div>
      <div class="tgroup">
        <button class="tbtn" id="tepL0.5pt" onclick="toggleTEPLevel('0.5pt')">0.5pt TEp</button>
        <button class="tbtn" id="tepL1pt"   onclick="toggleTEPLevel('1pt')">1pt TEp</button>
        <button class="tbtn" id="tepL1.5pt" onclick="toggleTEPLevel('1.5pt')">1.5pt TEp</button>
        <button class="tbtn" id="tepL2pt"   onclick="toggleTEPLevel('2pt')">2pt TEp</button>
      </div>
    </div>

    <div class="ls-section">
      <div class="ls-label">Bonuses</div>
      <div class="tgroup ls-wrap">
        <button class="tbtn" id="s6pt"  onclick="toggleBonus('sixPtPass')">6pt Pass TD</button>
        <button class="tbtn" id="sPPC"  onclick="toggleBonus('pointPerCarry')">Point Per Carry</button>
        <button class="tbtn" id="sPPFD" onclick="toggleBonus('pointPerFirstDown')">Pt Per 1st Down</button>
        <button class="tbtn" id="sTPPR" onclick="toggleBonus('tieredPPR')">Tiered PPR</button>
        <button class="tbtn" id="s2TE"  onclick="toggleBonus('start2TEs')">Start 2 TEs</button>
      </div>
    </div>

    <div id="adjSummary" style="display:none;" class="adj-summary"></div>
  `;
}

function toggleTeamSize(size) {
  settings.teamSize = settings.teamSize === size ? null : size;
  ['8','10','12','14','16'].forEach(s =>
    document.getElementById('ts' + s)?.classList.toggle('on', settings.teamSize === s));
  refreshValues();
}

function toggleTEPLevel(level) {
  settings.tepLevel = settings.tepLevel === level ? null : level;
  ['0.5pt','1pt','1.5pt','2pt'].forEach(v =>
    document.getElementById('tepL' + v)?.classList.toggle('on', settings.tepLevel === v));
  refreshValues();
}

function toggleBonus(key) {
  settings[key] = !settings[key];
  const ids = { sixPtPass:'s6pt', pointPerCarry:'sPPC', pointPerFirstDown:'sPPFD', tieredPPR:'sTPPR', start2TEs:'s2TE' };
  document.getElementById(ids[key])?.classList.toggle('on', settings[key]);
  refreshValues();
}

function refreshValues() {
  renderList('A');
  renderList('B');
  updateAdjSummary();
}

function updateAdjSummary() {
  const el = document.getElementById('adjSummary');
  if (!el) return;
  const active = [];
  if (settings.teamSize) active.push(settings.teamSize + '-team');
  if (settings.tepLevel) active.push(settings.tepLevel + ' TEp');
  if (settings.sixPtPass) active.push('6pt Pass TD');
  if (settings.pointPerCarry) active.push('Pt Per Carry');
  if (settings.pointPerFirstDown) active.push('Pt Per 1st Down');
  if (settings.tieredPPR) active.push('Tiered PPR');
  if (settings.start2TEs) active.push('Start 2 TEs');

  if (!active.length) { el.style.display = 'none'; return; }
  const m = getMultipliers();
  el.style.display = 'block';
  el.innerHTML = `
    <div class="adj-active">Active: ${active.join(' · ')}</div>
    <div class="adj-mults">
      <span class="mult-pill pQB">QB ×${m.QB.toFixed(2)}</span>
      <span class="mult-pill pRB">RB ×${m.RB.toFixed(2)}</span>
      <span class="mult-pill pWR">WR ×${m.WR.toFixed(2)}</span>
      <span class="mult-pill pTE">TE ×${m.TE.toFixed(2)}</span>
      <span class="mult-pill pPICK">Pick ×${m.PICK.toFixed(2)}</span>
    </div>`;
}

// ── Rendering ─────────────────────────────────────────────────

function renderList(side) {
  const el  = document.getElementById('lst' + side);
  const tot = document.getElementById('tot' + side);
  const arr = teams[side];
  if (!arr.length) {
    el.innerHTML = '<div class="empty">Search above to add players</div>';
    tot.textContent = '0'; updateBanner(); return;
  }
  let sum = 0;
  el.innerHTML = arr.map((p, i) => {
    const v = getValue(p); sum += v;
    return `<div class="chip">
      <span class="cpos ${posColor(p.pos)}">${p.pos}</span>
      <span class="cname">${p.name}</span>
      <span class="cval">${v}</span>
      <button class="crem" onclick="remove('${side}',${i})">✕</button>
    </div>`;
  }).join('');
  tot.textContent = sum; updateBanner();
}

function updateBanner() {
  const a = teams.A.reduce((s, p) => s + getValue(p), 0);
  const b = teams.B.reduce((s, p) => s + getValue(p), 0);
  const banner = document.getElementById('rbanner');
  if (!teams.A.length && !teams.B.length) {
    banner.classList.remove('show','wa','wb'); return;
  }
  banner.classList.add('show');
  const total = a + b || 1;
  document.getElementById('barA').style.width = Math.round((a / total) * 100) + '%';
  document.getElementById('barB').style.width = Math.round((b / total) * 100) + '%';
  document.getElementById('rscores').textContent = `Team A: ${a} pts  |  Team B: ${b} pts`;
  const rtext = document.getElementById('rtext');
  if (a === b) { rtext.textContent = '⚖️ Even Trade'; banner.classList.remove('wa','wb'); }
  else if (a > b) { rtext.textContent = `Team A wins by ${a-b} pts`; banner.classList.add('wa'); banner.classList.remove('wb'); }
  else { rtext.textContent = `Team B wins by ${b-a} pts`; banner.classList.add('wb'); banner.classList.remove('wa'); }
}

// ── Search ────────────────────────────────────────────────────

function doSearch() {
  const q = document.getElementById('srch').value.trim().toLowerCase();
  const rlist = document.getElementById('rlist');
  if (!q) { rlist.style.display = 'none'; return; }
  const results = ALL_PLAYERS
    .filter(p => p.name.toLowerCase().includes(q))
    .sort((a, b) => getValue(b) - getValue(a))
    .slice(0, 20);
  rlist.innerHTML = results.length
    ? results.map(p => {     const safeName = p.name.replace(/'/g, "\'");     return `<div class="ritem" onclick="selectPlayer('${safeName}')">
        <span class="ripos ${posColor(p.pos)}">${p.pos}</span>
        <span class="riname">${p.name}</span>
        <span class="rival">${getValue(p)}</span>
      </div>`).join('')
    : '<div class="nores">No players found</div>';
  rlist.style.display = 'block';
}

function selectPlayer(name) {
  selected = ALL_PLAYERS.find(p => p.name === name);
  document.getElementById('srch').value = name;
  document.getElementById('rlist').style.display = 'none';
}

// ── Actions ───────────────────────────────────────────────────

function addTo(side) {
  if (!selected) {
    const q = document.getElementById('srch').value.trim().toLowerCase();
    if (q) selected = ALL_PLAYERS.find(p => p.name.toLowerCase().includes(q));
  }
  if (!selected) return;
  if (!teams[side].find(p => p.name === selected.name)) {
    teams[side].push(selected); renderList(side);
  }
  selected = null;
  document.getElementById('srch').value = '';
  document.getElementById('rlist').style.display = 'none';
}

function remove(side, idx) { teams[side].splice(idx, 1); renderList(side); }

function clearAll() {
  teams.A = []; teams.B = [];
  renderList('A'); renderList('B');
  document.getElementById('rbanner').classList.remove('show','wa','wb');
}

function setFmt(f) {
  fmt = f;
  document.getElementById('fmtSF').classList.toggle('on', f === 'sf');
  document.getElementById('fmt1Q').classList.toggle('on', f === 'qb');
  renderList('A'); renderList('B');
}

function setTE(t) {
  tepMode = t;
  document.getElementById('teTEP').classList.toggle('on', t === 'tep');
  document.getElementById('tePPR').classList.toggle('on', t === 'ppr');
  renderList('A'); renderList('B');
}

async function doRefresh() {
  const dot = document.getElementById('sdot');
  const stxt = document.getElementById('stxt');
  dot.className = 'sdot'; stxt.textContent = 'Refreshing values…';
  try {
    ALL_PLAYERS = parseCSV(await loadCSV());
    dot.className = 'sdot live';
    stxt.textContent = `${ALL_PLAYERS.length} players loaded · ${new Date().toLocaleTimeString()}`;
    renderList('A'); renderList('B');
  } catch (e) {
    dot.className = 'sdot err';
    stxt.textContent = 'Failed to load — check connection';
    console.error(e);
  }
}

// ── Init ──────────────────────────────────────────────────────

(async function init() {
  buildSettingsUI();
  await doRefresh();
  document.getElementById('srch').addEventListener('input', doSearch);
  document.getElementById('srch').addEventListener('focus', doSearch);
  document.addEventListener('click', e => {
    if (!e.target.closest('.ssec')) document.getElementById('rlist').style.display = 'none';
  });
})();
