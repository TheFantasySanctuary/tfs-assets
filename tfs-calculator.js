// ============================================================
// The Fantasy Sanctuary — Dynasty Trade Calculator
// Values loaded live from Google Sheets CSV
// ============================================================

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSHDN2QSRWf9QQpAB395HyNHstIXC9LYh_7d23i6zeS-uLqkDgjYSR1SVwdUgtqKIwHzuN26N1uH3s/pub?output=csv";

// Sheet column layout (0-indexed):
// 0  = QB Name
// 1  = QB SF Value
// 2  = QB 1QB Value
// 3  = (blank)
// 4  = RB Name
// 5  = RB Value (SF & 1QB same)
// 6  = (blank)
// 7  = WR Name
// 8  = WR Value
// 9  = (blank)
// 10 = TE Name
// 11 = TE TEP Value
// 12 = TE PPR Value
// 13 = (blank)
// 14 = Pick Name
// 15 = Pick SF Value
// 16 = Pick 1QB Value

let ALL_PLAYERS = [];
let fmt = 'sf';   // 'sf' | 'qb'
let tep = 'tep';  // 'tep' | 'ppr'

// ── Helpers ──────────────────────────────────────────────────

function parseNum(s) {
  if (!s) return 0;
  const n = parseFloat(s.toString().replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function posColor(pos) {
  return { QB: 'pQB', RB: 'pRB', WR: 'pWR', TE: 'pTE', PICK: 'pPICK' }[pos] || 'pWR';
}

function getValue(p) {
  if (p.pos === 'QB') return fmt === 'sf' ? p.sf : p.qb1;
  if (p.pos === 'TE') return tep === 'tep' ? p.tep : p.ppr;
  if (p.pos === 'PICK') return fmt === 'sf' ? p.sf : p.qb1;
  return p.sf; // RB, WR same for both formats
}

// ── CSV Fetching & Parsing ────────────────────────────────────

async function loadCSV() {
  const res = await fetch(CSV_URL + "&t=" + Date.now()); // bust cache
  const text = await res.text();
  return text;
}

function parseCSV(text) {
  const lines = text.split('\n');
  const players = [];

  // Skip header row (row 0)
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));

    // QBs — cols 0,1,2
    if (cols[0]) {
      const sf = parseNum(cols[1]);
      const qb1 = parseNum(cols[2]);
      if (cols[0].length > 1) {
        players.push({ name: cols[0], pos: 'QB', sf, qb1, tep: sf, ppr: sf });
      }
    }

    // RBs — cols 4,5
    if (cols[4]) {
      const val = parseNum(cols[5]);
      if (cols[4].length > 1) {
        players.push({ name: cols[4], pos: 'RB', sf: val, qb1: val, tep: val, ppr: val });
      }
    }

    // WRs — cols 7,8
    if (cols[7]) {
      const val = parseNum(cols[8]);
      if (cols[7].length > 1) {
        players.push({ name: cols[7], pos: 'WR', sf: val, qb1: val, tep: val, ppr: val });
      }
    }

    // TEs — cols 10,11,12
    if (cols[10]) {
      const tepVal = parseNum(cols[11]);
      const pprVal = parseNum(cols[12]);
      if (cols[10].length > 1) {
        players.push({ name: cols[10], pos: 'TE', sf: tepVal, qb1: tepVal, tep: tepVal, ppr: pprVal });
      }
    }

    // Picks — cols 14,15,16
    if (cols[14]) {
      const sf = parseNum(cols[15]);
      const qb1 = parseNum(cols[16]);
      if (cols[14].length > 1) {
        players.push({ name: cols[14], pos: 'PICK', sf, qb1, tep: sf, ppr: qb1 });
      }
    }
  }

  // Deduplicate by name (keep first occurrence)
  const seen = new Set();
  return players.filter(p => {
    if (seen.has(p.name.toLowerCase())) return false;
    seen.add(p.name.toLowerCase());
    return true;
  });
}

// ── State ─────────────────────────────────────────────────────

const teams = { A: [], B: [] };
let selected = null; // last highlighted search result

// ── UI Rendering ──────────────────────────────────────────────

function renderList(side) {
  const el = document.getElementById('lst' + side);
  const tot = document.getElementById('tot' + side);
  const arr = teams[side];
  if (!arr.length) {
    el.innerHTML = '<div class="empty">Search above to add players</div>';
    tot.textContent = '0';
    updateBanner();
    return;
  }
  let sum = 0;
  el.innerHTML = arr.map((p, i) => {
    const v = getValue(p);
    sum += v;
    return `<div class="chip">
      <span class="cpos ${posColor(p.pos)}">${p.pos}</span>
      <span class="cname">${p.name}</span>
      <span class="cval">${v}</span>
      <button class="crem" onclick="remove('${side}',${i})">✕</button>
    </div>`;
  }).join('');
  tot.textContent = sum;
  updateBanner();
}

function updateBanner() {
  const a = teams.A.reduce((s, p) => s + getValue(p), 0);
  const b = teams.B.reduce((s, p) => s + getValue(p), 0);
  const banner = document.getElementById('rbanner');
  const rtext = document.getElementById('rtext');
  const rscores = document.getElementById('rscores');
  const barA = document.getElementById('barA');
  const barB = document.getElementById('barB');

  if (!teams.A.length && !teams.B.length) {
    banner.classList.remove('show', 'wa', 'wb');
    return;
  }

  banner.classList.add('show');
  const total = a + b || 1;
  const pctA = Math.round((a / total) * 100);
  const pctB = 100 - pctA;
  barA.style.width = pctA + '%';
  barB.style.width = pctB + '%';
  rscores.textContent = `Team A: ${a} pts  |  Team B: ${b} pts`;

  if (a === b) {
    rtext.textContent = '⚖️ Even Trade';
    banner.classList.remove('wa', 'wb');
  } else if (a > b) {
    const edge = a - b;
    rtext.textContent = `Team A wins by ${edge} pts`;
    banner.classList.add('wa');
    banner.classList.remove('wb');
  } else {
    const edge = b - a;
    rtext.textContent = `Team B wins by ${edge} pts`;
    banner.classList.add('wb');
    banner.classList.remove('wa');
  }
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

  if (!results.length) {
    rlist.innerHTML = '<div class="nores">No players found</div>';
  } else {
    rlist.innerHTML = results.map((p, i) => {
      const v = getValue(p);
      return `<div class="ritem" onclick="selectPlayer(${ALL_PLAYERS.indexOf(p)})">
        <span class="ripos ${posColor(p.pos)}">${p.pos}</span>
        <span class="riname">${p.name}</span>
        <span class="rival">${v}</span>
      </div>`;
    }).join('');
  }
  rlist.style.display = 'block';
}

function selectPlayer(idx) {
  selected = ALL_PLAYERS[idx];
  document.getElementById('srch').value = selected.name;
  document.getElementById('rlist').style.display = 'none';
}

// ── Actions ───────────────────────────────────────────────────

function addTo(side) {
  if (!selected) {
    // try to match current search text
    const q = document.getElementById('srch').value.trim().toLowerCase();
    if (q) {
      const match = ALL_PLAYERS.find(p => p.name.toLowerCase().includes(q));
      if (match) selected = match;
    }
  }
  if (!selected) return;
  // prevent duplicates within the same side
  if (!teams[side].find(p => p.name === selected.name)) {
    teams[side].push(selected);
    renderList(side);
  }
  selected = null;
  document.getElementById('srch').value = '';
  document.getElementById('rlist').style.display = 'none';
}

function remove(side, idx) {
  teams[side].splice(idx, 1);
  renderList(side);
}

function clearAll() {
  teams.A = []; teams.B = [];
  renderList('A'); renderList('B');
  document.getElementById('rbanner').classList.remove('show', 'wa', 'wb');
}

function setFmt(f) {
  fmt = f;
  document.getElementById('fmtSF').classList.toggle('on', f === 'sf');
  document.getElementById('fmt1Q').classList.toggle('on', f === 'qb');
  renderList('A'); renderList('B');
}

function setTE(t) {
  tep = t;
  document.getElementById('teTEP').classList.toggle('on', t === 'tep');
  document.getElementById('tePPR').classList.toggle('on', t === 'ppr');
  renderList('A'); renderList('B');
}

async function doRefresh() {
  const dot = document.getElementById('sdot');
  const stxt = document.getElementById('stxt');
  dot.className = 'sdot';
  stxt.textContent = 'Refreshing values…';
  try {
    const csv = await loadCSV();
    ALL_PLAYERS = parseCSV(csv);
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
  await doRefresh();
  document.getElementById('srch').addEventListener('input', doSearch);
  document.getElementById('srch').addEventListener('focus', doSearch);
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.ssec')) document.getElementById('rlist').style.display = 'none';
  });
})();
