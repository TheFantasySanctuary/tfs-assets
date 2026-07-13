// The Fantasy Sanctuary - Sleeper Trade Calculator add-ons
// patches + trade balancer + sleeper sync + share image
// Loaded as an external file so WordPress cannot alter the JS.

window.setTE = function () {};

(function patchTEPMode() {
  function applyTEPMode() {
    var active = (typeof settings !== 'undefined') && settings.tepLevel;
    if (typeof tepMode !== 'undefined') {
      tepMode = active ? 'tep' : 'ppr';
    }
  }
  function wrapToggle() {
    if (typeof toggleTEPLevel === 'undefined') { setTimeout(wrapToggle, 50); return; }
    var _orig = window.toggleTEPLevel;
    window.toggleTEPLevel = function (level) {
      _orig(level);
      applyTEPMode();
      if (typeof refreshValues === 'function') refreshValues();
    };
    applyTEPMode();
  }
  window.addEventListener('load', wrapToggle);
})();

(function patchSettingsUI() {
  function patchLabel() {
    document.querySelectorAll('.ls-label').forEach(function (lbl) {
      if (lbl.textContent.includes('TE Premium')) {
        lbl.innerHTML = 'TE Premium Level <span class="ls-note">(0.5pt = base sheet values)</span>';
      }
    });
  }
  document.addEventListener('DOMContentLoaded', function () { setTimeout(patchLabel, 500); });
  window.addEventListener('load', function () { setTimeout(patchLabel, 500); });
})();

// ── ALLOW DUPLICATE ASSETS ──
// The external script blocks duplicates in addTo() with a .find() name check.
// We override addTo() to skip that check and allow the same pick/player multiple times.
// Each entry gets a unique _key so remove() still works correctly by index.
(function patchAddTo() {
  function tryPatch() {
    if (typeof addTo === 'undefined' || typeof teams === 'undefined' || typeof renderList === 'undefined') {
      setTimeout(tryPatch, 100);
      return;
    }
    window.addTo = function(side) {
      // Resolve selected — mirror the original logic exactly
      if (!selected) {
        var q = document.getElementById('srch').value.trim().toLowerCase();
        if (q) selected = ALL_PLAYERS.find(function(p) { return p.name.toLowerCase().includes(q); });
      }
      if (!selected) return;

      // Push a shallow copy with a unique key — no duplicate check
      var entry = Object.assign({}, selected, { _key: selected.name + '_' + Date.now() + '_' + Math.random() });
      teams[side].push(entry);
      renderList(side);

      selected = null;
      document.getElementById('srch').value = '';
      document.getElementById('rlist').style.display = 'none';
    };
  }
  tryPatch();
})();

// ============================================================

// ── TRADE BALANCER SUGGESTIONS ──
(function() {
  var BALANCE_THRESHOLD = 5;
  var posColors = { QB:'pQB', RB:'pRB', WR:'pWR', TE:'pTE', PICK:'pPICK' };
  var cachedPlayers = [];
  var seeded = false;

  function parseSearchRow(row) {
    var nameEl = row.querySelector('.riname');
    var valEl  = row.querySelector('.rival');
    var posEl  = row.querySelector('.ripos');
    if (!nameEl || !valEl) return null;
    var val = parseFloat(valEl.textContent);
    if (isNaN(val) || val <= 0) return null;
    return { name: nameEl.textContent.trim(), pos: posEl ? posEl.textContent.trim().toUpperCase() : '', val: val };
  }

  function harvestDropdown() {
    var rlist = document.getElementById('rlist');
    if (!rlist) return;
    rlist.querySelectorAll('.ritem').forEach(function(row) {
      var p = parseSearchRow(row);
      if (!p) return;
      var exists = cachedPlayers.some(function(x) { return x.name.toLowerCase() === p.name.toLowerCase(); });
      if (!exists) cachedPlayers.push(p);
    });
  }

  var SEED_QUERIES = ['a','e','i','j','k','t','b','d','m','r','s','w','c','l','n'];
  var seedIdx = 0;

  function seedNext() {
    if (seedIdx >= SEED_QUERIES.length) { seeded = true; return; }
    var srch = document.getElementById('srch');
    var rlist = document.getElementById('rlist');
    if (!srch || !rlist) { setTimeout(seedNext, 300); return; }
    var prev = srch.value;
    srch.value = SEED_QUERIES[seedIdx];
    srch.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(function() {
      harvestDropdown();
      srch.value = prev;
      if (rlist) rlist.style.display = 'none';
      srch.dispatchEvent(new Event('input', { bubbles: true }));
      seedIdx++;
      setTimeout(seedNext, 400);
    }, 350);
  }

  setTimeout(function() {
    var srch = document.getElementById('srch');
    if (srch) { srch.addEventListener('input', function() { setTimeout(harvestDropdown, 300); }); }
    seedNext();
  }, 3000);

  function getTotals() {
    var a = parseFloat((document.getElementById('totA') || {}).textContent) || 0;
    var b = parseFloat((document.getElementById('totB') || {}).textContent) || 0;
    return { a: a, b: b, diff: a - b };
  }

  function hasPlayers() {
    var lstA = document.getElementById('lstA');
    var lstB = document.getElementById('lstB');
    if (!lstA || !lstB) return false;
    return lstA.querySelectorAll('.chip').length > 0 && lstB.querySelectorAll('.chip').length > 0;
  }

  function getAddedNames() {
    var names = [];
    ['lstA','lstB'].forEach(function(id) {
      var lst = document.getElementById(id);
      if (!lst) return;
      lst.querySelectorAll('.cname').forEach(function(el) { names.push((el.textContent || '').toLowerCase().trim()); });
    });
    return names;
  }

  function getPosClass(pos) {
    if (!pos) return 'pQB';
    var p = pos.toUpperCase();
    if (p.includes('PICK') || p.includes('RD')) return 'pPICK';
    return posColors[p] || 'pQB';
  }

  function findClosest(targetVal, excludeNames, count) {
    if (!targetVal || targetVal <= 0 || cachedPlayers.length === 0) return [];
    var lower = targetVal * 0.15;
    var upper = targetVal * 1.35;
    var candidates = cachedPlayers.filter(function(p) {
      if (p.val <= lower || p.val > upper) return false;
      if (excludeNames.indexOf(p.name.toLowerCase()) !== -1) return false;
      return true;
    });
    candidates.sort(function(a, b) { return Math.abs(a.val - targetVal) - Math.abs(b.val - targetVal); });
    return candidates.slice(0, count);
  }

  function renderCard(p) {
    var posClass = getPosClass(p.pos);
    return '<div class="sugg-card">'
      + '<span class="sugg-pos ' + posClass + '">' + (p.pos || '?') + '</span>'
      + '<span class="sugg-name">' + p.name + '</span>'
      + '<span class="sugg-val">' + Math.round(p.val) + '</span>'
      + '</div>';
  }

  function tfsGetVal(p){ try { return (typeof getValue === 'function') ? getValue(p) : 0; } catch(e){ return 0; } }

  function rosterSuggCard(p, side){
    var posClass = getPosClass(p.pos);
    var safe = (p.name || '').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return '<div class="sugg-card" style="cursor:pointer" title="Click to add to Team ' + side + '" onclick="tfsAddRosterPlayer(\'' + safe + '\',\'' + side + '\')">'
      + '<span class="sugg-pos ' + posClass + '">' + (p.pos || '?') + '</span>'
      + '<span class="sugg-name">' + p.name + '</span>'
      + '<span class="sugg-val">' + Math.round(p.val) + '</span>'
      + '</div>';
  }

  function updateSuggestionsRoster(body){
    if (!hasPlayers()) {
      body.innerHTML = '<div class="sugg-hidden">Add players to both sides to see balancing suggestions from the synced rosters.</div>';
      return;
    }
    var totals = getTotals();
    var diff = totals.diff;
    if (Math.abs(diff) <= BALANCE_THRESHOLD) {
      body.innerHTML = '<div class="sugg-balanced">✅ This trade looks balanced! Neither side needs sweetening.</div>';
      return;
    }
    var losing = diff > 0 ? 'B' : 'A';
    var gap = Math.abs(diff);
    var traded = getAddedNames();
    var roster = (window.TFS_ROSTERS && window.TFS_ROSTERS[losing]) || [];
    var cands = [];
    roster.forEach(function(p){
      if (traded.indexOf((p.name || '').toLowerCase().trim()) !== -1) return;
      var v = tfsGetVal(p);
      if (!v || v <= 0) return;
      if (v > gap * 1.6 || v < gap * 0.08) return;
      cands.push({ name: p.name, pos: p.pos, val: v });
    });
    cands.sort(function(a, b){ return Math.abs(a.val - gap) - Math.abs(b.val - gap); });
    cands = cands.slice(0, 8);
    var colClass = losing === 'A' ? 'sugg-col-a' : 'sugg-col-b';
    var cardsHtml = cands.length
      ? cands.map(function(p){ return rosterSuggCard(p, losing); }).join('')
      : '<div class="sugg-hidden" style="padding:6px 0">No player on Team ' + losing + '\'s roster sits near ~' + Math.round(gap) + ' pts. Try adjusting the trade.</div>';
    body.innerHTML = '<div class="sugg-col ' + colClass + '">'
      + '<div class="sugg-col-head">Team ' + losing + ' could add from their roster (~' + Math.round(gap) + ' pts needed)</div>'
      + cardsHtml + '</div>';
  }

  window.tfsAddRosterPlayer = function(name, side){
    try {
      var AP; try { AP = ALL_PLAYERS; } catch(e){ AP = null; }
      if (!AP) return;
      var p = AP.find(function(x){ return x.name === name; });
      if (!p) return;
      var TM; try { TM = teams; } catch(e){ TM = null; }
      if (TM && TM[side] && TM[side].some(function(x){ return x.name === p.name; })) return;
      selected = p;
      addTo(side);
    } catch(e){ console.error(e); }
  };

  function updateSuggestions() {
    var body = document.getElementById('sugg-body');
    if (!body) return;
    if (window.TFS_ROSTERS && window.TFS_ROSTERS.A && window.TFS_ROSTERS.B) {
      return updateSuggestionsRoster(body);
    }
    if (!hasPlayers()) {
      body.innerHTML = '<div class="sugg-hidden">Add players to both sides to see balancing suggestions.</div>';
      return;
    }
    var totals = getTotals();
    var diff = totals.diff;
    if (Math.abs(diff) <= BALANCE_THRESHOLD) {
      body.innerHTML = '<div class="sugg-balanced">✅ This trade looks balanced! Neither side needs sweetening.</div>';
      return;
    }
    var losing = diff > 0 ? 'B' : 'A';
    var gap = Math.abs(diff);
    var excluded = getAddedNames();
    if (!seeded || cachedPlayers.length < 10) {
      body.innerHTML = '<div class="sugg-hidden">Team ' + losing + ' is short by ~' + Math.round(gap) + ' pts. Still loading player list — search for a player above to help populate suggestions.</div>';
      return;
    }
    var singles = findClosest(gap, excluded, 10);
    var addSideHtml = singles.length > 0
      ? singles.map(renderCard).join('')
      : '<div class="sugg-hidden" style="padding:6px 0">No single player found near that value</div>';
    var colClass = losing === 'A' ? 'sugg-col-a' : 'sugg-col-b';
    body.innerHTML = '<div class="sugg-col ' + colClass + '">'
      + '<div class="sugg-col-head">Team ' + losing + ' could add (~' + Math.round(gap) + ' pts needed)</div>'
      + addSideHtml + '</div>';
  }

  setInterval(updateSuggestions, 800);

  function observeTotals() {
    var totA = document.getElementById('totA');
    var totB = document.getElementById('totB');
    if (!totA || !totB) { setTimeout(observeTotals, 200); return; }
    var obs = new MutationObserver(function() { setTimeout(updateSuggestions, 100); });
    obs.observe(totA, { childList: true, characterData: true, subtree: true });
    obs.observe(totB, { childList: true, characterData: true, subtree: true });
  }
  observeTotals();
})();

// ============================================================

// ── SLEEPER LEAGUE SYNC ──
(function(){
  var SL = { id:null, users:{}, rosters:[], teams:[], labels:{}, refMap:{} };
  var PLAYERS_MAP = null;
  var PKEY = 'tfs_sleeper_players_v1';

  function status(msg, type){
    var e = document.getElementById('sleeperStatus');
    if(!e) return;
    e.textContent = msg || '';
    e.className = 'sleeper-status' + (type ? ' ' + type : '');
  }

  function tfsToast(msg){
    var t = document.getElementById('tfs-toast');
    if(!t){ t = document.createElement('div'); t.id = 'tfs-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(function(){ t.classList.remove('show'); }, 2200);
  }

  function jsq(s){ return (s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }
  function esc(s){ return (s||'').replace(/"/g,'&quot;'); }
  function posClass(pos){ return ({QB:'pQB',RB:'pRB',WR:'pWR',TE:'pTE',PICK:'pPICK'})[(pos||'').toUpperCase()] || 'pWR'; }
  function tfsGetVal(p){ try { return (typeof getValue === 'function') ? getValue(p) : 0; } catch(e){ return 0; } }

  function norm(s){
    return (s||'').toLowerCase()
      .replace(/[.'’`\-]/g,'')
      .replace(/\s+(jr|sr|ii|iii|iv|v)$/,'')
      .replace(/\s+/g,' ').trim();
  }

  function extractId(raw){ var m = (raw||'').match(/(\d{6,})/); return m ? m[1] : ''; }

  async function fetchJson(url){ var r = await fetch(url); if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }

  async function getPlayersMap(){
    if(PLAYERS_MAP) return PLAYERS_MAP;
    try {
      var raw = localStorage.getItem(PKEY);
      if(raw){ var o = JSON.parse(raw); if(o && o.t && o.d && (Date.now() - o.t < 7*864e5)){ PLAYERS_MAP = o.d; return PLAYERS_MAP; } }
    } catch(e){}
    var full = await fetchJson('https://api.sleeper.app/v1/players/nfl');
    var slim = {};
    Object.keys(full).forEach(function(pid){
      var p = full[pid]; if(!p) return;
      var pos = p.position;
      if(pos !== 'QB' && pos !== 'RB' && pos !== 'WR' && pos !== 'TE') return;
      var nm = p.full_name || (((p.first_name||'') + ' ' + (p.last_name||'')).trim());
      if(!nm) return;
      slim[pid] = { n: nm, p: pos };
    });
    PLAYERS_MAP = slim;
    try { localStorage.setItem(PKEY, JSON.stringify({ t: Date.now(), d: slim })); } catch(e){}
    return PLAYERS_MAP;
  }

  function buildAPIndex(){
    var idx = {}; var AP; try { AP = ALL_PLAYERS; } catch(e){ AP = []; }
    (AP||[]).forEach(function(p){ var k = norm(p.name); (idx[k] = idx[k] || []).push(p); });
    return idx;
  }
  function matchPlayer(idx, name, pos){
    var arr = idx[norm(name)];
    if(!arr || !arr.length) return null;
    if(arr.length === 1) return arr[0];
    var byPos = arr.filter(function(p){ return p.pos === pos; });
    var pick = byPos.length ? byPos : arr;
    pick.sort(function(a, b){ return (b.sf||0) - (a.sf||0); });
    return pick[0];
  }

  function populateSelects(opts){
    var a = document.getElementById('sleeperTeamA'), b = document.getElementById('sleeperTeamB');
    if(!a || !b) return;
    var html = opts.map(function(o, i){
      var sub = (o.manager && o.manager !== o.label) ? ' (' + o.manager + ')' : '';
      return '<option value="' + i + '">' + esc(o.label + sub) + '</option>';
    }).join('');
    a.innerHTML = html; b.innerHTML = html;
    a.value = '0'; b.value = String(opts.length > 1 ? 1 : 0);
  }

  function nearestSize(n){
    var sizes = [8,10,12,14,16], best = sizes[0], bd = Infinity;
    sizes.forEach(function(s){ var d = Math.abs(s - n); if(d < bd){ bd = d; best = s; } });
    return String(best);
  }

  function applyLeagueSettings(lg){
    var applied = [];
    var S; try { S = settings; } catch(e){ S = null; }
    var rp = lg.roster_positions || [];
    var sc = lg.scoring_settings || {};

    // Format: Superflex vs 1QB
    var sf = rp.indexOf('SUPER_FLEX') !== -1 || rp.filter(function(x){ return x === 'QB'; }).length >= 2;
    try { if(typeof setFmt === 'function') setFmt(sf ? 'sf' : 'qb'); } catch(e){}
    applied.push(sf ? 'Superflex' : '1QB');

    // Team size
    var size = nearestSize(lg.total_rosters || (lg.settings && lg.settings.num_teams) || 12);
    if(S && S.teamSize !== size && typeof toggleTeamSize === 'function'){ try { toggleTeamSize(size); } catch(e){} }
    applied.push(size + '-team');

    // TE premium level (from per-reception TE bonus)
    var bte = +(sc.bonus_rec_te || 0);
    var tep = null;
    if(bte >= 1.75) tep = '2pt';
    else if(bte >= 1.25) tep = '1.5pt';
    else if(bte >= 0.75) tep = '1pt';
    else if(bte >= 0.25) tep = '0.5pt';
    var curTep = S ? S.tepLevel : null;
    if(tep !== curTep && typeof toggleTEPLevel === 'function'){
      try {
        if(curTep && curTep !== tep) toggleTEPLevel(curTep); // clear existing
        if(tep) toggleTEPLevel(tep);                          // set new
      } catch(e){}
    }
    if(tep) applied.push(tep + ' TEp');

    // Boolean bonuses
    function setBonus(key, desired, label){
      if(!S || typeof toggleBonus !== 'function') return;
      if(!!S[key] !== !!desired){ try { toggleBonus(key); } catch(e){} }
      if(desired) applied.push(label);
    }
    setBonus('sixPtPass', (+sc.pass_td || 0) >= 6, '6pt Pass TD');
    setBonus('pointPerCarry', (+sc.rush_att || 0) >= 0.5, 'Pt Per Carry');
    setBonus('pointPerFirstDown', ((+sc.rush_fd || 0) >= 0.5 || (+sc.rec_fd || 0) >= 0.5), 'Pt Per 1st Down');
    setBonus('start2TEs', rp.filter(function(x){ return x === 'TE'; }).length >= 2, 'Start 2 TEs');
    // tieredPPR left manual — no reliable Sleeper flag

    return applied;
  }

  var SLEEPER = 'https://api.sleeper.app/v1';

  async function loadLeagueById(id, btn){
    if(!id){ status('No league selected', 'err'); return; }
    if(btn) btn.disabled = true;
    status('Loading league…');
    try {
      var lg = await fetchJson(SLEEPER + '/league/' + id);
      if(!lg || !lg.league_id){ status('League not found — check the ID', 'err'); return; }
      var res = await Promise.all([
        fetchJson(SLEEPER + '/league/' + id + '/users'),
        fetchJson(SLEEPER + '/league/' + id + '/rosters'),
        fetchJson(SLEEPER + '/league/' + id + '/traded_picks').catch(function(){ return []; }),
        fetchJson(SLEEPER + '/league/' + id + '/drafts').catch(function(){ return []; })
      ]);
      var users = res[0] || [], rosters = res[1] || [];
      SL.id = id; SL.users = {}; users.forEach(function(u){ SL.users[u.user_id] = u; });
      SL.rosters = rosters;
      SL.rosterIds = rosters.map(function(r){ return r.roster_id; });
      SL.tradedPicks = res[2] || [];
      SL.drafts = res[3] || [];
      SL.season = lg.season;
      SL.status = lg.status;
      SL.teams = rosters.map(function(r){
        var u = SL.users[r.owner_id];
        var manager = (u && (u.display_name || u.username)) || '';
        var teamName = (u && u.metadata && u.metadata.team_name) || '';
        var label = teamName || manager || ('Roster ' + r.roster_id);
        return { rid: r.roster_id, label: label, manager: manager, players: r.players || [] };
      });
      populateSelects(SL.teams);
      var applied = applyLeagueSettings(lg);
      var pk = document.getElementById('sleeperPick'); if(pk) pk.style.display = 'block';
      status('Loaded "' + (lg.name || 'League') + '" · ' + SL.teams.length + ' teams. Applied: ' + applied.join(', ') + '. Pick two teams below.', 'ok');
    } catch(e){ console.error(e); status('Could not load league. Try again.', 'err'); }
    finally { if(btn) btn.disabled = false; }
  }

  window.tfsLoadLeague = function(){
    var raw = (document.getElementById('sleeperLeagueId') || {}).value || '';
    var id = extractId(raw);
    if(!id){ status('Enter a valid Sleeper league ID or URL', 'err'); return; }
    loadLeagueById(id, document.getElementById('sleeperLoadBtn'));
  };

  window.tfsLoadSelectedLeague = function(){
    var sel = document.getElementById('sleeperLeagueSelect');
    var id = sel ? sel.value : '';
    if(!id){ status('Pick a league from the list', 'err'); return; }
    loadLeagueById(id, document.getElementById('sleeperLoadSelBtn'));
  };

  window.tfsSyncMethod = function(m){
    var userMode = (m !== 'id');
    var uRow = document.getElementById('sleeperUserRow');
    var iRow = document.getElementById('sleeperIdRow');
    var lRow = document.getElementById('sleeperLeagueRow');
    if(uRow) uRow.style.display = userMode ? 'flex' : 'none';
    if(iRow) iRow.style.display = userMode ? 'none' : 'flex';
    if(lRow && !userMode) lRow.style.display = 'none';
    var bu = document.getElementById('slmUser'), bi = document.getElementById('slmId');
    if(bu) bu.classList.toggle('on', userMode);
    if(bi) bi.classList.toggle('on', !userMode);
  };

  async function fetchUserLeagues(userId){
    var yr = new Date().getFullYear();
    var leagues = [];
    try { leagues = await fetchJson(SLEEPER + '/user/' + userId + '/leagues/nfl/' + yr); } catch(e){ leagues = []; }
    if(!leagues || !leagues.length){
      try { leagues = await fetchJson(SLEEPER + '/user/' + userId + '/leagues/nfl/' + (yr - 1)); } catch(e){ leagues = []; }
    }
    return leagues || [];
  }

  window.tfsFindLeagues = async function(){
    var uname = ((document.getElementById('sleeperUsername') || {}).value || '').trim();
    if(!uname){ status('Enter your Sleeper username', 'err'); return; }
    var btn = document.getElementById('sleeperFindBtn'); if(btn) btn.disabled = true;
    status('Finding leagues…');
    try {
      var user = await fetchJson(SLEEPER + '/user/' + encodeURIComponent(uname));
      if(!user || !user.user_id){ status('Username not found — check the spelling', 'err'); return; }
      var leagues = await fetchUserLeagues(user.user_id);
      if(!leagues.length){ status('No NFL leagues found for that user', 'err'); return; }
      var sel = document.getElementById('sleeperLeagueSelect');
      if(sel){
        sel.innerHTML = leagues.map(function(l){
          var lbl = (l.name || 'League') + ' (' + (l.total_rosters || '?') + '-team' + (l.season ? ', ' + l.season : '') + ')';
          return '<option value="' + l.league_id + '">' + esc(lbl) + '</option>';
        }).join('');
      }
      var lRow = document.getElementById('sleeperLeagueRow'); if(lRow) lRow.style.display = 'flex';
      status('Found ' + leagues.length + ' league(s) for ' + (user.display_name || uname) + '. Pick one and load it.', 'ok');
    } catch(e){ console.error(e); status('Could not look up that user. Try again.', 'err'); }
    finally { if(btn) btn.disabled = false; }
  };

  function mapRoster(team, pmap, idx){
    var matched = [], unmatched = [];
    (team.players || []).forEach(function(pid){
      var m = pmap[pid]; if(!m) return;
      var ref = matchPlayer(idx, m.n, m.p);
      if(ref) matched.push(ref); else unmatched.push(m.n);
    });
    matched.sort(function(x, y){ return tfsGetVal(y) - tfsGetVal(x); });
    return { label: team.label, manager: team.manager, matched: matched, unmatched: unmatched };
  }

  // ── DRAFT PICKS ──
  function parsePick(name){
    var ym = name.match(/\b(20\d{2})\b/) || name.match(/\b(\d{2})\b/);
    var y = ym ? (ym[1].length === 2 ? '20' + ym[1] : ym[1]) : null;
    var m = name.match(/(\d)\s*(?:st|nd|rd|th)\b/i)
         || name.match(/round\s*(\d)/i)
         || name.match(/\br(\d)\b/i)
         || name.match(/\b(\d)\.\d/);
    var r = m ? m[1] : null;
    var tier = /early/i.test(name) ? 'early' : (/late/i.test(name) ? 'late' : (/mid/i.test(name) ? 'mid' : 'plain'));
    return { year: y, round: r, tier: tier };
  }

  function buildPickIndex(){
    var idx = {}; var AP; try { AP = ALL_PLAYERS; } catch(e){ AP = []; }
    (AP || []).forEach(function(p){
      if((p.pos || '').toUpperCase() !== 'PICK') return;
      var pp = parsePick(p.name);
      if(!pp.year || !pp.round) return;
      idx[pp.year] = idx[pp.year] || {};
      idx[pp.year][pp.round] = idx[pp.year][pp.round] || {};
      idx[pp.year][pp.round][pp.tier] = p;
    });
    return idx;
  }

  function pickRef(year, round){
    var slot = (SL.pickIndex[year] || {})[round];
    if(!slot) return null;
    return slot.plain || slot.mid || slot.early || slot.late || null;
  }

  function preparePicks(){
    SL.pickIndex = buildPickIndex();
    var seasonNum = parseInt(SL.season, 10) || new Date().getFullYear();

    // Authoritative: exclude any season whose rookie draft is already complete.
    var maxDrafted = 0;
    (SL.drafts || []).forEach(function(d){
      if(d && d.status === 'complete'){
        var ds = parseInt(d.season, 10);
        if(ds && ds > maxDrafted) maxDrafted = ds;
      }
    });

    var startYear;
    if(maxDrafted){
      startYear = maxDrafted + 1;
    } else {
      // Fallback when no draft data is available: infer from league status.
      var drafted = (SL.status === 'in_season' || SL.status === 'complete' || SL.status === 'post_season');
      startYear = drafted ? seasonNum + 1 : seasonNum;
    }

    SL.pickYears = Object.keys(SL.pickIndex).filter(function(y){ return parseInt(y, 10) >= startYear; }).sort();
    SL.pickOwnerMap = {};
    (SL.tradedPicks || []).forEach(function(t){
      SL.pickOwnerMap[t.season + '|' + t.round + '|' + t.roster_id] = t.owner_id;
    });
  }

  function computeOwnedPicks(rosterId){
    var owned = [];
    if(!SL.pickYears || !SL.rosterIds) return owned;
    SL.pickYears.forEach(function(y){
      var rounds = Object.keys(SL.pickIndex[y] || {});
      rounds.forEach(function(r){
        SL.rosterIds.forEach(function(orig){
          var key = y + '|' + r + '|' + orig;
          var owner = (SL.pickOwnerMap[key] != null) ? SL.pickOwnerMap[key] : orig;
          if(String(owner) === String(rosterId)){
            var ref = pickRef(y, r);
            if(ref) owned.push(ref);
          }
        });
      });
    });
    return owned;
  }

  function poolChip(ref, side){
    return '<div class="sl-chip" data-name="' + esc(ref.name.toLowerCase()) + '" onclick="tfsAddRosterPlayer(\'' + jsq(ref.name) + '\',\'' + side + '\')">'
      + '<span class="sl-pos ' + posClass(ref.pos) + '">' + ref.pos + '</span>'
      + '<span class="sl-name">' + ref.name + '</span>'
      + '<span class="sl-val">' + Math.round(tfsGetVal(ref)) + '</span>'
      + '</div>';
  }

  function teamCol(data, side){
    var chips = data.matched.length
      ? data.matched.map(function(r){ return poolChip(r, side); }).join('')
      : '<div class="sl-note">No tradeable assets matched.</div>';
    var note = '';
    if(data.unmatched && data.unmatched.length){
      note += '<div class="sl-note">' + data.unmatched.length + ' player(s) not matched to a value.</div>';
    }
    if(data.pickCount){
      note += '<div class="sl-note">' + data.pickCount + ' draft pick(s) loaded, valued at mid-tier (draft slot unknown pre-season).</div>';
    }
    var mgr = (data.manager && data.manager !== data.label)
      ? '<span style="display:block;font-weight:600;font-size:.68rem;color:var(--muted);opacity:.85;margin-top:2px;">@' + esc(data.manager) + '</span>'
      : '';
    return '<div class="sl-team side-' + side.toLowerCase() + '">'
      + '<div class="sl-team-head"><span>' + esc(data.label) + mgr + '</span><span>Team ' + side + '</span></div>'
      + '<div class="sl-team-body">' + chips + note + '</div>'
      + '</div>';
  }

  function renderPools(a, b){
    SL.refMap = {};
    a.matched.forEach(function(r){ SL.refMap[r.name.toLowerCase()] = r; });
    b.matched.forEach(function(r){ SL.refMap[r.name.toLowerCase()] = r; });
    var el = document.getElementById('sleeperRosters');
    if(el) el.innerHTML = teamCol(a, 'A') + teamCol(b, 'B');
  }

  window.tfsLoadRosters = async function(){
    if(!SL.teams || !SL.teams.length){ status('Load a league first', 'err'); return; }
    var ai = +(document.getElementById('sleeperTeamA') || {}).value;
    var bi = +(document.getElementById('sleeperTeamB') || {}).value;
    if(ai === bi){ status('Pick two different teams', 'err'); return; }
    status('Loading player database (one-time, ~5MB)…');
    try {
      var pmap = await getPlayersMap();
      var idx = buildAPIndex();
      preparePicks();
      var a = mapRoster(SL.teams[ai], pmap, idx);
      var b = mapRoster(SL.teams[bi], pmap, idx);
      var aPicks = computeOwnedPicks(SL.teams[ai].rid);
      var bPicks = computeOwnedPicks(SL.teams[bi].rid);
      a.pickCount = aPicks.length; b.pickCount = bPicks.length;
      a.matched = a.matched.concat(aPicks);
      b.matched = b.matched.concat(bPicks);
      a.matched.sort(function(x, y){ return tfsGetVal(y) - tfsGetVal(x); });
      b.matched.sort(function(x, y){ return tfsGetVal(y) - tfsGetVal(x); });
      window.TFS_ROSTERS = { A: a.matched, B: b.matched };
      SL.labels = { A: a.label, B: b.label };
      renderPools(a, b);
      status('Rosters loaded, including draft picks. Tap assets to build the trade — the balancer suggests from these rosters.', 'ok');
    } catch(e){ console.error(e); status('Could not load rosters. Try again.', 'err'); }
  };

  window.tfsClearSync = function(){
    window.TFS_ROSTERS = null; SL.refMap = {};
    var el = document.getElementById('sleeperRosters'); if(el) el.innerHTML = '';
    var pk = document.getElementById('sleeperPick'); if(pk) pk.style.display = 'none';
    status('Sync cleared. Balancer is back to the full player list.', '');
  };

  function tradedSet(){
    var s = {};
    ['lstA','lstB'].forEach(function(id){
      var l = document.getElementById(id); if(!l) return;
      l.querySelectorAll('.cname').forEach(function(e){ s[(e.textContent||'').toLowerCase().trim()] = 1; });
    });
    return s;
  }
  function poolTick(){
    var rost = document.getElementById('sleeperRosters'); if(!rost) return;
    var traded = tradedSet();
    rost.querySelectorAll('.sl-chip').forEach(function(ch){
      var nm = ch.getAttribute('data-name');
      var ref = SL.refMap[nm];
      if(ref){ var vs = ch.querySelector('.sl-val'); if(vs) vs.textContent = Math.round(tfsGetVal(ref)); }
      ch.classList.toggle('dim', !!traded[nm]);
    });
  }
  setInterval(poolTick, 1000);

  var idInput = document.getElementById('sleeperLeagueId');
  if(idInput){ idInput.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); window.tfsLoadLeague(); } }); }
  var userInput = document.getElementById('sleeperUsername');
  if(userInput){ userInput.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); window.tfsFindLeagues(); } }); }
})();

// ============================================================

// ── SHARE TRADE AS IMAGE ──
(function(){
  var POS = {
    QB:{bg:'rgba(245,200,0,.2)',c:'#f5c800'},
    RB:{bg:'rgba(187,212,34,.2)',c:'#bbd422'},
    WR:{bg:'rgba(0,225,255,.18)',c:'#00e1ff'},
    TE:{bg:'rgba(232,133,42,.2)',c:'#e8852a'},
    PICK:{bg:'rgba(150,100,220,.2)',c:'#b07cff'}
  };

  function posStyle(pos){
    var p = (pos||'').toUpperCase();
    if(p.indexOf('PICK')!==-1 || p.indexOf('RD')!==-1 || /^\d/.test(p)) return POS.PICK;
    return POS[p] || POS.QB;
  }

  function readSide(id){
    var lst = document.getElementById(id), out = [];
    if(!lst) return out;
    lst.querySelectorAll('.chip').forEach(function(c){
      var pos = c.querySelector('.cpos'), name = c.querySelector('.cname'), val = c.querySelector('.cval');
      out.push({
        pos: pos ? pos.textContent.trim() : '',
        name: name ? name.textContent.trim() : '',
        val: val ? val.textContent.trim() : ''
      });
    });
    return out;
  }

  function toast(msg){
    var t = document.getElementById('tfs-toast');
    if(!t){ t = document.createElement('div'); t.id='tfs-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(function(){ t.classList.remove('show'); }, 2600);
  }

  function chipHtml(p){
    var s = posStyle(p.pos);
    return '<div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:7px 10px;margin-bottom:6px;">'
      + '<span style="font-size:11px;font-weight:800;padding:2px 7px;border-radius:4px;min-width:34px;text-align:center;background:'+s.bg+';color:'+s.c+';">'+(p.pos||'?')+'</span>'
      + '<span style="flex:1;font-size:14px;font-weight:700;color:#e8fcff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+p.name+'</span>'
      + '<span style="font-size:14px;font-weight:900;color:#bbd422;">'+p.val+'</span>'
      + '</div>';
  }

  function sideHtml(label, colour, total, players){
    var rows = players.length
      ? players.map(chipHtml).join('')
      : '<div style="text-align:center;color:#5bc8d8;font-size:13px;font-style:italic;padding:18px 0;">Empty</div>';
    return '<div style="flex:1;background:rgba(0,0,0,.35);border:1px solid #0e3a4a;border-radius:14px;overflow:hidden;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid '+colour+'33;background:'+colour+'1a;">'
        + '<span style="font-family:\'Almendra Display\',serif;font-size:17px;color:'+colour+';letter-spacing:1px;">'+label+'</span>'
        + '<span style="font-family:\'Almendra Display\',serif;font-size:26px;color:#fff;">'+total+'</span>'
      + '</div>'
      + '<div style="padding:10px 12px;">'+rows+'</div>'
      + '</div>';
  }

  function buildCard(){
    var a = readSide('lstA'), b = readSide('lstB');
    if(a.length===0 && b.length===0){ return null; }

    var totA = (document.getElementById('totA')||{}).textContent || '0';
    var totB = (document.getElementById('totB')||{}).textContent || '0';
    var fmt = document.getElementById('fmtSF') && document.getElementById('fmtSF').classList.contains('on') ? 'Superflex' : '1QB';

    var na = parseFloat(totA)||0, nb = parseFloat(totB)||0, diff = na - nb;
    var verdict, vColour;
    if(Math.abs(diff) <= 5){ verdict='⚖️ Even trade'; vColour='#2ecc71'; }
    else if(diff > 0){ verdict='Team A wins by '+Math.round(diff); vColour='#00e1ff'; }
    else { verdict='Team B wins by '+Math.round(-diff); vColour='#e84040'; }

    var card = document.createElement('div');
    card.style.cssText = 'position:fixed;left:-99999px;top:0;width:620px;font-family:Nunito,sans-serif;';
    card.innerHTML =
      '<div style="background:linear-gradient(180deg,#071820 0%,#0a2230 60%,#071a10 100%);border:1px solid rgba(0,225,255,.25);border-radius:20px;padding:26px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
        + '<div style="display:flex;align-items:center;gap:9px;font-weight:900;font-size:13px;letter-spacing:2px;color:#00e1ff;text-transform:uppercase;">🏈 The Fantasy Sanctuary</div>'
        + '<div style="font-size:11px;font-weight:800;letter-spacing:1px;color:#071820;background:#00e1ff;padding:4px 11px;border-radius:20px;">'+fmt+'</div>'
      + '</div>'
      + '<div style="font-family:\'Almendra Display\',serif;font-size:30px;color:#fff;margin-bottom:18px;">Dynasty Trade Breakdown</div>'
      + '<div style="display:flex;gap:14px;align-items:stretch;margin-bottom:16px;">'
        + sideHtml('Team A','#00e1ff',totA,a)
        + sideHtml('Team B','#e84040',totB,b)
      + '</div>'
      + '<div style="text-align:center;font-family:\'Almendra Display\',serif;font-size:22px;color:'+vColour+';background:rgba(0,0,0,.35);border:1px solid '+vColour+'40;border-radius:12px;padding:12px;margin-bottom:16px;">'+verdict+'</div>'
      + '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:700;color:#5bc8d8;">'
        + '<span>🌴 thefantasysanctuary.com</span>'
        + '<span>Dynasty Trade Calculator</span>'
      + '</div>'
      + '</div>';
    return card;
  }

  window.shareTrade = function(){
    if(typeof html2canvas === 'undefined'){ toast('Still loading, try again in a sec'); return; }
    var card = buildCard();
    if(!card){ toast('Add players to both teams first'); return; }

    document.body.appendChild(card);
    toast('Building image…');

    html2canvas(card.firstChild, { backgroundColor:null, scale:2, useCORS:true, logging:false })
      .then(function(canvas){
        card.remove();
        canvas.toBlob(function(blob){
          if(!blob){ toast('Could not create image'); return; }
          var file = new File([blob], 'dynasty-trade.png', { type:'image/png' });
          if(navigator.canShare && navigator.canShare({ files:[file] })){
            navigator.share({
              files:[file],
              title:'Dynasty Trade',
              text:'Trade breakdown from The Fantasy Sanctuary'
            }).catch(function(){});
          } else {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url; a.download = 'dynasty-trade.png';
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
            toast('Image downloaded');
          }
        }, 'image/png');
      })
      .catch(function(){ card.remove(); toast('Something went wrong'); });
  };
})();
