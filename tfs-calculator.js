var ASSETS = [{"n": "Josh Allen", "pos": "QB", "sf": 100, "qb": 28}, {"n": "Lamar Jackson", "pos": "QB", "sf": 100, "qb": 28}, {"n": "Drake Maye", "pos": "QB", "sf": 92, "qb": 25}, {"n": "Joe Burrow", "pos": "QB", "sf": 90, "qb": 24}, {"n": "Justin Herbert", "pos": "QB", "sf": 80, "qb": 20}, {"n": "Patrick Mahomes", "pos": "QB", "sf": 76, "qb": 16}, {"n": "Caleb Williams", "pos": "QB", "sf": 70, "qb": 14}, {"n": "Jalen Hurts", "pos": "QB", "sf": 65, "qb": 17}, {"n": "Jayden Daniels", "pos": "QB", "sf": 60, "qb": 18}, {"n": "Jordan Love", "pos": "QB", "sf": 60, "qb": 15}, {"n": "Trevor Lawrence", "pos": "QB", "sf": 55, "qb": 14}, {"n": "Dak Prescott", "pos": "QB", "sf": 50, "qb": 12}, {"n": "Brock Purdy", "pos": "QB", "sf": 48, "qb": 12}, {"n": "Cam Ward", "pos": "QB", "sf": 42, "qb": 11}, {"n": "Sam Darnold", "pos": "QB", "sf": 40, "qb": 10}, {"n": "CJ Stroud", "pos": "QB", "sf": 36, "qb": 9}, {"n": "Bo Nix", "pos": "QB", "sf": 36, "qb": 9}, {"n": "Baker Mayfield", "pos": "QB", "sf": 32, "qb": 8}, {"n": "Jared Goff", "pos": "QB", "sf": 30, "qb": 6}, {"n": "Jaxson Dart", "pos": "QB", "sf": 26, "qb": 10}, {"n": "Kyler Murray", "pos": "QB", "sf": 24, "qb": 6}, {"n": "Bryce Young", "pos": "QB", "sf": 20, "qb": 4}, {"n": "Shedeur Sanders", "pos": "QB", "sf": 10, "qb": 0}, {"n": "Anthony Richardson", "pos": "QB", "sf": 10, "qb": 1}, {"n": "JJ McCarthy", "pos": "QB", "sf": 12, "qb": 1}, {"n": "Tua Tagovailoa", "pos": "QB", "sf": 13, "qb": 0}, {"n": "Jahmyr Gibbs", "pos": "RB", "val": 60}, {"n": "Bijan Robinson", "pos": "RB", "val": 60}, {"n": "Devon Achane", "pos": "RB", "val": 50}, {"n": "Jeremiyah Love", "pos": "RB", "val": 42}, {"n": "Ashton Jeanty", "pos": "RB", "val": 40}, {"n": "Jonathan Taylor", "pos": "RB", "val": 37}, {"n": "Omarion Hampton", "pos": "RB", "val": 30}, {"n": "James Cook", "pos": "RB", "val": 30}, {"n": "TreVeyon Henderson", "pos": "RB", "val": 25}, {"n": "Saquon Barkley", "pos": "RB", "val": 22}, {"n": "Kenneth Walker", "pos": "RB", "val": 22}, {"n": "Christian McCaffrey", "pos": "RB", "val": 20}, {"n": "Breece Hall", "pos": "RB", "val": 20}, {"n": "Travis Etienne", "pos": "RB", "val": 18}, {"n": "Kyren Williams", "pos": "RB", "val": 18}, {"n": "Chase Brown", "pos": "RB", "val": 18}, {"n": "Bucky Irving", "pos": "RB", "val": 18}, {"n": "Quinshon Judkins", "pos": "RB", "val": 14}, {"n": "Josh Jacobs", "pos": "RB", "val": 13}, {"n": "Cam Skattebo", "pos": "RB", "val": 13}, {"n": "RJ Harvey", "pos": "RB", "val": 12}, {"n": "Rico Dowdle", "pos": "RB", "val": 10}, {"n": "Derrick Henry", "pos": "RB", "val": 10}, {"n": "Blake Corum", "pos": "RB", "val": 10}, {"n": "Zach Charbonnet", "pos": "RB", "val": 9}, {"n": "Tyrone Tracy Jr", "pos": "RB", "val": 9}, {"n": "Rhamondre Stevenson", "pos": "RB", "val": 8}, {"n": "David Montgomery", "pos": "RB", "val": 8}, {"n": "Tyjae Spears", "pos": "RB", "val": 7}, {"n": "Nick Singleton", "pos": "RB", "val": 7}, {"n": "Braelon Allen", "pos": "RB", "val": 7}, {"n": "Dylan Sampson", "pos": "RB", "val": 7}, {"n": "Tony Pollard", "pos": "RB", "val": 6}, {"n": "Kaleb Johnson", "pos": "RB", "val": 6}, {"n": "Jordan Mason", "pos": "RB", "val": 6}, {"n": "Chuba Hubbard", "pos": "RB", "val": 6}, {"n": "Aaron Jones", "pos": "RB", "val": 6}, {"n": "Tank Bigsby", "pos": "RB", "val": 5}, {"n": "JaMarr Chase", "pos": "WR", "val": 85}, {"n": "Jaxon Smith-Njigba", "pos": "WR", "val": 78}, {"n": "Justin Jefferson", "pos": "WR", "val": 72}, {"n": "Puka Nacua", "pos": "WR", "val": 72}, {"n": "Amon-Ra St Brown", "pos": "WR", "val": 70}, {"n": "CeeDee Lamb", "pos": "WR", "val": 68}, {"n": "Malik Nabers", "pos": "WR", "val": 60}, {"n": "Drake London", "pos": "WR", "val": 50}, {"n": "Rashee Rice", "pos": "WR", "val": 48}, {"n": "Nico Collins", "pos": "WR", "val": 45}, {"n": "Garrett Wilson", "pos": "WR", "val": 40}, {"n": "Tetairoa McMillan", "pos": "WR", "val": 35}, {"n": "Chris Olave", "pos": "WR", "val": 35}, {"n": "DeVonta Smith", "pos": "WR", "val": 34}, {"n": "Tee Higgins", "pos": "WR", "val": 32}, {"n": "Emeka Egbuka", "pos": "WR", "val": 32}, {"n": "George Pickens", "pos": "WR", "val": 30}, {"n": "Jaylen Waddle", "pos": "WR", "val": 30}, {"n": "Jordyn Tyson", "pos": "WR", "val": 30}, {"n": "Marvin Harrison Jr", "pos": "WR", "val": 27}, {"n": "Carnell Tate", "pos": "WR", "val": 27}, {"n": "Zay Flowers", "pos": "WR", "val": 26}, {"n": "Rome Odunze", "pos": "WR", "val": 26}, {"n": "Ladd McConkey", "pos": "WR", "val": 25}, {"n": "Brian Thomas", "pos": "WR", "val": 25}, {"n": "Luther Burden", "pos": "WR", "val": 25}, {"n": "AJ Brown", "pos": "WR", "val": 20}, {"n": "Davante Adams", "pos": "WR", "val": 15}, {"n": "Josh Downs", "pos": "WR", "val": 15}, {"n": "Jameson Williams", "pos": "WR", "val": 14}, {"n": "Jordan Addison", "pos": "WR", "val": 13}, {"n": "Terry McLaurin", "pos": "WR", "val": 13}, {"n": "DK Metcalf", "pos": "WR", "val": 13}, {"n": "Jayden Reed", "pos": "WR", "val": 13}, {"n": "Brandon Aiyuk", "pos": "WR", "val": 12}, {"n": "Courtland Sutton", "pos": "WR", "val": 12}, {"n": "Xavier Worthy", "pos": "WR", "val": 11}, {"n": "Jayden Higgins", "pos": "WR", "val": 11}, {"n": "DJ Moore", "pos": "WR", "val": 10}, {"n": "Khalil Shakir", "pos": "WR", "val": 10}, {"n": "Travis Hunter", "pos": "WR", "val": 8}, {"n": "Matthew Golden", "pos": "WR", "val": 8}, {"n": "Makai Lemon", "pos": "WR", "val": 22}, {"n": "Adonai Mitchell", "pos": "WR", "val": 6}, {"n": "Trey McBride", "pos": "TE", "tep": 55, "ppr": 40}, {"n": "Brock Bowers", "pos": "TE", "tep": 60, "ppr": 42}, {"n": "Colston Loveland", "pos": "TE", "tep": 30, "ppr": 18}, {"n": "Tucker Kraft", "pos": "TE", "tep": 28, "ppr": 17}, {"n": "Harold Fannin", "pos": "TE", "tep": 27, "ppr": 17}, {"n": "Tyler Warren", "pos": "TE", "tep": 27, "ppr": 17}, {"n": "Kyle Pitts", "pos": "TE", "tep": 20, "ppr": 15}, {"n": "George Kittle", "pos": "TE", "tep": 15, "ppr": 10}, {"n": "Sam LaPorta", "pos": "TE", "tep": 15, "ppr": 10}, {"n": "Jake Ferguson", "pos": "TE", "tep": 13, "ppr": 9}, {"n": "Dalton Kincaid", "pos": "TE", "tep": 10, "ppr": 8}, {"n": "Mark Andrews", "pos": "TE", "tep": 9, "ppr": 6}, {"n": "Isaiah Likely", "pos": "TE", "tep": 8, "ppr": 6}, {"n": "Gunnar Helm", "pos": "TE", "tep": 7, "ppr": 6}, {"n": "Mason Taylor", "pos": "TE", "tep": 6, "ppr": 4}, {"n": "Dallas Goedert", "pos": "TE", "tep": 6, "ppr": 4}, {"n": "Travis Kelce", "pos": "TE", "tep": 6, "ppr": 4}, {"n": "David Njoku", "pos": "TE", "tep": 5, "ppr": 3}, {"n": "Theo Johnson", "pos": "TE", "tep": 5, "ppr": 3}, {"n": "Elijah Arroyo", "pos": "TE", "tep": 5, "ppr": 3}, {"n": "Kenyon Sadiq", "pos": "TE", "tep": 16, "ppr": 14}, {"n": "Oronde Gadsden", "pos": "TE", "tep": 10, "ppr": 8}, {"n": "Max Klare", "pos": "TE", "tep": 9, "ppr": 7}, {"n": "Eli Stowers", "pos": "TE", "tep": 12, "ppr": 10}, {"n": "2026 1.01-1.02", "pos": "PICK", "sf": 42, "qb": 38}, {"n": "2026 1.03-1.04", "pos": "PICK", "sf": 30, "qb": 28}, {"n": "2026 1.05-1.06", "pos": "PICK", "sf": 25, "qb": 22}, {"n": "2026 1.07-1.09", "pos": "PICK", "sf": 20, "qb": 17}, {"n": "2026 1.10-1.12", "pos": "PICK", "sf": 15, "qb": 13}, {"n": "2026 Early 2nd", "pos": "PICK", "sf": 11, "qb": 9}, {"n": "2026 Late 2nd", "pos": "PICK", "sf": 9, "qb": 7}, {"n": "2026 3rd", "pos": "PICK", "sf": 4, "qb": 3}, {"n": "2026 4th", "pos": "PICK", "sf": 2, "qb": 1}, {"n": "2027 1st", "pos": "PICK", "sf": 30, "qb": 28}, {"n": "2027 2nd", "pos": "PICK", "sf": 13, "qb": 11}, {"n": "2027 3rd", "pos": "PICK", "sf": 4, "qb": 3}, {"n": "2028 1st", "pos": "PICK", "sf": 23, "qb": 20}, {"n": "2028 2nd", "pos": "PICK", "sf": 10, "qb": 8}, {"n": "2029 1st", "pos": "PICK", "sf": 20, "qb": 18}, {"n": "2029 2nd", "pos": "PICK", "sf": 9, "qb": 7}];

var fmt = "sf";
var tefmt = "tep";
var sides = {A:[],B:[]};
var sel = null;
var hits = [];

function gv(a) {
  if (a.pos === "QB" || a.pos === "PICK") return fmt === "sf" ? (a.sf||0) : (a.qb||0);
  if (a.pos === "TE") return tefmt === "tep" ? (a.tep||0) : (a.ppr||0);
  return a.val||0;
}

function doSearch() {
  var q = document.getElementById("srch").value.toLowerCase().trim();
  var rl = document.getElementById("rlist");
  sel = null;
  if (!q) { rl.style.display = "none"; rl.innerHTML = ""; return; }
  hits = [];
  for (var i = 0; i < ASSETS.length; i++) {
    if (ASSETS[i].n.toLowerCase().indexOf(q) !== -1) hits.push(ASSETS[i]);
    if (hits.length >= 30) break;
  }
  if (!hits.length) {
    rl.innerHTML = "<div class=\"nores\">No players found</div>";
    rl.style.display = "block";
    return;
  }
  var html = "";
  for (var j = 0; j < hits.length; j++) {
    var a = hits[j];
    var v = gv(a);
    html += "<div class=\"ritem\" onclick=\"pick(" + j + ")\">" +
      "<span class=\"riname\">" + a.n + "</span>" +
      "<span class=\"rival\">" + v + "</span>" +
      "<span class=\"ripos p" + a.pos + "\">" + a.pos + "</span>" +
      "</div>";
  }
  rl.innerHTML = html;
  rl.style.display = "block";
}

function pick(j) {
  sel = hits[j];
  var items = document.getElementById("rlist").getElementsByClassName("ritem");
  for (var i = 0; i < items.length; i++) {
    items[i].style.background = i === j ? "rgba(0,225,255,0.15)" : "";
  }
}

function addTo(side) {
  var a = sel || (hits.length === 1 ? hits[0] : null);
  if (!a) return;
  sides[side].push({n:a.n,pos:a.pos,sf:a.sf,qb:a.qb,val:a.val,tep:a.tep,ppr:a.ppr});
  renderSide(side);
  updateResult();
  sel = null;
  document.getElementById("srch").value = "";
  document.getElementById("rlist").style.display = "none";
  hits = [];
}

function rem(side, idx) {
  sides[side].splice(idx, 1);
  renderSide(side);
  updateResult();
}

function renderSide(side) {
  var tot = 0;
  for (var i = 0; i < sides[side].length; i++) tot += gv(sides[side][i]);
  document.getElementById("tot" + side).textContent = tot;
  var el = document.getElementById("lst" + side);
  if (!sides[side].length) { el.innerHTML = "<div class=\"empty\">Search above to add players</div>"; return; }
  var h = "";
  for (var i = 0; i < sides[side].length; i++) {
    var a = sides[side][i];
    h += "<div class=\"chip\">" +
      "<span class=\"cpos p" + a.pos + "\">" + a.pos + "</span>" +
      "<span class=\"cname\">" + a.n + "</span>" +
      "<span class=\"cval\">" + gv(a) + "</span>" +
      "<button class=\"crem\" onclick=\"rem('" + side + "'," + i + ")\">x</button>" +
      "</div>";
  }
  el.innerHTML = h;
}

function updateResult() {
  var tA = 0; for (var i=0;i<sides.A.length;i++) tA+=gv(sides.A[i]);
  var tB = 0; for (var i=0;i<sides.B.length;i++) tB+=gv(sides.B[i]);
  var b = document.getElementById("rbanner");
  if (!sides.A.length && !sides.B.length) { b.className = "rbanner"; return; }
  b.classList.add("show");
  var tot = tA + tB;
  var pA = tot > 0 ? (tA/tot*100) : 50;
  document.getElementById("barA").style.width = pA + "%";
  document.getElementById("barB").style.width = (100-pA) + "%";
  var diff = Math.abs(tA-tB);
  b.className = "rbanner show";
  if (tA === tB) { document.getElementById("rtext").textContent = "Even Trade"; document.getElementById("rscores").textContent = tA + " vs " + tB; }
  else if (tA > tB) { document.getElementById("rtext").textContent = "Team A wins by " + diff; document.getElementById("rscores").textContent = tA + " vs " + tB; b.classList.add("wa"); }
  else { document.getElementById("rtext").textContent = "Team B wins by " + diff; document.getElementById("rscores").textContent = tA + " vs " + tB; b.classList.add("wb"); }
}

function setFmt(f) {
  fmt = f;
  document.getElementById("fmtSF").className = "tbtn" + (f==="sf"?" on":"");
  document.getElementById("fmt1Q").className = "tbtn" + (f==="qb"?" on":"");
  doSearch(); renderSide("A"); renderSide("B"); updateResult();
}
function setTE(t) {
  tefmt = t;
  document.getElementById("teTEP").className = "tbtn" + (t==="tep"?" on":"");
  document.getElementById("tePPR").className = "tbtn" + (t==="ppr"?" on":"");
  doSearch(); renderSide("A"); renderSide("B"); updateResult();
}
function clearAll() { sides.A=[]; sides.B=[]; renderSide("A"); renderSide("B"); updateResult(); }

document.addEventListener("click", function(e) {
  if (!e.target.closest(".ssec")) document.getElementById("rlist").style.display = "none";
});

function doRefresh() {
  document.getElementById("stxt").textContent = "Refreshing...";
  var url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSHDN2QSRWf9QQpAB395HyNHstIXC9LYh_7d23i6zeS-uLqkDgjYSR1SVwdUgtqKIwHzuN26N1uH3s/pub?gid=1395165281&single=true&output=csv";
  var proxies = [
    "https://thefantasysanctuary.com/wp-content/uploads/sheet-proxy.php?t=" + Date.now(),
    url + "&t=" + Date.now(),
    "https://api.allorigins.win/raw?url=" + encodeURIComponent(url),
    "https://corsproxy.io/?" + encodeURIComponent(url)
  ];
  var i = 0;
  function tryNext() {
    if (i >= proxies.length) { document.getElementById("stxt").textContent = "Built-in values loaded"; return; }
    fetch(proxies[i++], {cache:"no-store"}).then(function(r){ return r.text(); }).then(function(t){
      if (!t || t.trim()[0] === "<" || t.length < 200) { tryNext(); return; }
      var parsed = parseCSV(t);
      if (parsed.length < 10) { tryNext(); return; }
      ASSETS = parsed;
      document.getElementById("sdot").className = "sdot live";
      document.getElementById("stxt").textContent = "Live values loaded";
      doSearch(); renderSide("A"); renderSide("B"); updateResult();
    }).catch(function(){ tryNext(); });
  }
  tryNext();
}

function parseCSV(text) {
  var lines = text.split("\n");
  var out = []; var seen = {};
  function add(a) { var k=a.n+"|"+a.pos; if(!seen[k]&&a.n){seen[k]=1;out.push(a);} }
  function cl(v){return(v||"").replace(/^"|"$/g,"").trim()||null;}
  function nm(v){var s=cl(v);if(!s)return null;var n=parseFloat(s);return isNaN(n)?null:n;}
  function row(line){var res=[],cur="",q=false;for(var i=0;i<line.length;i++){var c=line[i];if(c==='"'){q=!q;}else if(c===","&&!q){res.push(cur);cur="";}else{cur+=c;}}res.push(cur);return res;}
  for (var i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    var r = row(lines[i]);
    var qn=cl(r[0]),qs=nm(r[1]),qq=nm(r[2]); if(qn&&qs!==null) add({n:qn,pos:"QB",sf:qs,qb:qq||0});
    var rn=cl(r[4]),rv=nm(r[5]); if(rn&&rv!==null) add({n:rn,pos:"RB",val:rv});
    var wn=cl(r[7]),wv=nm(r[8]); if(wn&&wv!==null) add({n:wn,pos:"WR",val:wv});
    var tn=cl(r[10]),tt=nm(r[11]),tp=nm(r[12]); if(tn&&tt!==null) add({n:tn,pos:"TE",tep:tt,ppr:tp||tt});
    var pn=cl(r[14]),ps=nm(r[15]),pq=nm(r[16]);
    if(pn&&ps!==null&&/\d/.test(pn)){var pname=/^\d{4}/.test(pn)?pn:"2026 "+pn;add({n:pname,pos:"PICK",sf:ps,qb:pq||ps});}
  }
  return out;
}
// Auto-refresh on load
doRefresh();
