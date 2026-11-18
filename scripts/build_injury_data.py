"""
The Fantasy Sanctuary - Injury Report data build
Builds injuries/injury-report.json for sanctuary-injury-report.html

Data: nflverse (injury reports, weekly rosters, snap counts, schedules)
Model: logistic regression trained on every regular-season injury report
       since 2019, where the target is "was the player active on game day"
       (weekly roster ACT vs INA/RES). Player history adjusts the result
       using how often that player beat or missed the model before.

Run:  python build_injury_data.py --out injuries/injury-report.json
"""
import argparse, io, json, os, sys, datetime as dt
from zoneinfo import ZoneInfo
import urllib.request
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression

BUILD_VERSION = "1.2.0"
REL = "https://github.com/nflverse/nflverse-data/releases/download"
GAMES = "https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv"
FIRST_SEASON = 2019            # first season with game-day INA statuses
FANTASY_POS = ["QB", "RB", "WR", "TE", "K"]
PRACTICE = {
    "Did Not Participate In Practice": "DNP",
    "Limited Participation in Practice": "LP",
    "Full Participation in Practice": "FP",
}
HIST_K, HIST_C, HIST_CAP = 15.0, 6.0, 1.5   # tuned on 2025-26 holdout
MAIN_FEATS = ["st*pr", "usage", "pos", "st*prev", "st*usage", "pos*st", "st*inj"]
PROV_FEATS = ["pr", "usage", "pos", "prev", "pr*prev", "inj"]
BODY = ["hamstring", "ankle", "knee", "concussion", "illness", "back", "shoulder", "hip",
        "groin", "calf", "foot", "toe", "quad", "rib", "hand", "thumb", "wrist", "finger",
        "neck", "elbow", "achilles", "chest", "abdomen", "oblique"]


def log(*a):
    print("[injury-build]", *a, file=sys.stderr)


def fetch_csv(url, cache):
    name = os.path.join(cache, url.rsplit("/", 1)[-1])
    if not os.path.exists(name):
        log("download", url)
        with urllib.request.urlopen(url, timeout=120) as r:
            data = r.read()
        with open(name, "wb") as f:
            f.write(data)
    return pd.read_csv(name, low_memory=False)


def try_csv(url, cache):
    try:
        return fetch_csv(url, cache)
    except Exception as e:  # noqa
        log("missing", url, e)
        return None


def body(s):
    s = str(s).lower()
    if s in ("nan", "", "none"):
        return "none"
    if "rest" in s or "not injury" in s:
        return "rest"
    for k in BODY:
        if k in s:
            return k
    return "other"


def pos_group(p):
    return p if p in ("QB", "RB", "WR", "TE") else "OTH"


def key_val(row, feat):
    if "*" in feat:
        a, b = feat.split("*")
        return f"{feat}={row[a]}|{row[b]}"
    return f"{feat}={row[feat]}"


def design(df, feats):
    cols = {}
    for f in feats:
        if "*" in f:
            a, b = f.split("*")
            v = f + "=" + df[a].astype(str) + "|" + df[b].astype(str)
        else:
            v = f + "=" + df[f].astype(str)
        for k in v.unique():
            cols[k] = (v == k).astype(float).values
    return pd.DataFrame(cols, index=df.index)


def fit(df, feats):
    Xd = design(df, feats)
    m = LogisticRegression(C=1.0, max_iter=4000).fit(Xd, df["y"])
    coef = {k: round(float(c), 4) for k, c in zip(Xd.columns, m.coef_[0])}
    return {"intercept": round(float(m.intercept_[0]), 4), "feats": feats, "coef": coef}


def score(df, model):
    z = np.full(len(df), model["intercept"])
    for f in model["feats"]:
        if "*" in f:
            a, b = f.split("*")
            keys = f + "=" + df[a].astype(str) + "|" + df[b].astype(str)
        else:
            keys = f + "=" + df[f].astype(str)
        z = z + keys.map(model["coef"]).fillna(0).values
    return z


def sig(z):
    return 1 / (1 + np.exp(-z))



# ---------------- long-term absences ----------------
def clean(o):
    """Turn NaN into null so the browser can parse the file."""
    if isinstance(o, float) and o != o:
        return None
    if isinstance(o, dict):
        return {k: clean(v) for k, v in o.items()}
    if isinstance(o, list):
        return [clean(v) for v in o]
    return o


def km(rem, ev, maxr=20):
    """Kaplan-Meier survival of games still to miss. Season end = censored."""
    rem = np.asarray(rem); ev = np.asarray(ev, dtype=bool); S = []; s = 1.0
    for r in range(maxr + 1):
        at = (rem >= r).sum(); dd = ((rem == r) & ev).sum()
        if at > 0:
            s *= (1 - dd / at)
        S.append(s)
    return S


def build_spells(rw, inj_lookup):
    """Every run of consecutive missed games (INA or RES) linked to an injury."""
    out = []
    r = rw[rw.status.notna()].sort_values(["season", "week"]).drop_duplicates(["season", "week", "gsis_id"])
    for (season, gid), g in r.groupby(["season", "gsis_id"], sort=False):
        rows = list(zip(g.week, g.status))
        k = 0
        while k < len(rows):
            if rows[k][1] in ("INA", "RES"):
                start = k
                while k < len(rows) and rows[k][1] in ("INA", "RES"):
                    k += 1
                seq = "".join("R" if rows[j][1] == "RES" else "I" for j in range(start, k))
                sw = rows[start][0]
                hit = inj_lookup.get((season, gid, sw)) or inj_lookup.get((season, gid, sw - 1))
                if hit is None and "R" not in seq:
                    continue          # inactive with no injury: healthy scratch
                out.append({"season": season, "gsis": gid, "start": sw, "end": rows[k - 1][0],
                            "L": k - start, "ret": k < len(rows) and rows[k][1] == "ACT",
                            "open": k == len(rows), "seq": seq,
                            "inj": hit[0] if hit else "unlisted", "text": hit[1] if hit and pd.notna(hit[1]) else None})
            else:
                k += 1
    return pd.DataFrame(out)


def project(sp, inj, m, flag, minn=30):
    """Games still to miss for someone who has missed m games, currently I (inactive) or R (reserve/IR)."""
    c = max(m - 1, 0)
    base = sp[(sp.L >= max(m, 1)) & (sp.seq.str.len() > c)]
    base = base[base.seq.str[c] == flag]
    sub, basis = base[base.inj == inj], inj
    if len(sub) < minn:
        sub, basis = base, "all injuries"
    if len(sub) < 10:
        return None
    S = km(sub.L - m, sub.ret)
    return {"S": [round(float(x), 3) for x in S], "n": int(len(sub)), "basis": basis}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="injuries/injury-report.json")
    ap.add_argument("--cache", default=".nflverse-cache")
    ap.add_argument("--season", type=int, default=None)
    args = ap.parse_args()
    os.makedirs(args.cache, exist_ok=True)
    # always refresh the current-season files
    today = dt.datetime.now(dt.timezone.utc)
    # Daily practice log. nflverse only keeps the latest practice status, so every
    # run saves what it sees against the US Eastern date of that day's report.
    # Reports come out mid-afternoon ET, so a run before 15:00 ET belongs to the day before.
    et = today.astimezone(ZoneInfo("America/New_York"))
    report_day = (et.date() - dt.timedelta(days=1 if et.hour < 15 else 0)).isoformat()
    old = None
    if os.path.exists(args.out):
        try:
            with open(args.out) as f:
                old = json.load(f)
        except Exception:  # noqa
            old = None
    season = args.season or (today.year if today.month >= 8 else today.year - 1)
    for f in [f"injuries_{season}.csv", f"roster_weekly_{season}.csv", f"snap_counts_{season}.csv", "games.csv"]:
        p = os.path.join(args.cache, f)
        if os.path.exists(p):
            os.remove(p)

    games = fetch_csv(GAMES, args.cache)
    games = games[(games.season == season) & (games.game_type == "REG")]
    open_weeks = games[games.result.isna()].week
    cur_week = int(open_weeks.min()) if len(open_weeks) else int(games.week.max())

    inj, rw, sn = [], [], []
    for y in range(FIRST_SEASON, season + 1):
        i = try_csv(f"{REL}/injuries/injuries_{y}.csv", args.cache)
        r = try_csv(f"{REL}/weekly_rosters/roster_weekly_{y}.csv", args.cache)
        s = try_csv(f"{REL}/snap_counts/snap_counts_{y}.csv", args.cache)
        if i is not None: inj.append(i[i.game_type == "REG"])
        if r is not None: rw.append(r[r.game_type == "REG"])
        if s is not None: sn.append(s[s.game_type == "REG"])
    s0 = try_csv(f"{REL}/snap_counts/snap_counts_{FIRST_SEASON - 1}.csv", args.cache)
    if s0 is not None: sn.append(s0[s0.game_type == "REG"])
    inj = pd.concat(inj, ignore_index=True)
    rw = pd.concat(rw, ignore_index=True)
    sn = pd.concat(sn, ignore_index=True)

    inj["t"] = inj.season * 100 + inj.week
    rw["t"] = rw.season * 100 + rw.week
    cur_t = season * 100 + cur_week

    # ---- labels: active on game day (completed weeks only)
    lab = rw[rw.status.isin(["ACT", "INA", "RES"]) & (rw.t < cur_t)][["t", "gsis_id", "status"]]
    lab = lab.drop_duplicates(["t", "gsis_id"])
    lab["y"] = (lab.status == "ACT").astype(int)

    # ---- usage: mean snap share over last 3 games played, before this week
    pfr = rw[["pfr_id", "gsis_id"]].dropna().drop_duplicates("pfr_id")
    sn = sn.merge(pfr, left_on="pfr_player_id", right_on="pfr_id")
    sn["pct"] = sn[["offense_pct", "defense_pct"]].max(axis=1)
    sn = sn[(sn.offense_snaps.fillna(0) + sn.defense_snaps.fillna(0)) > 0]
    sn["tg"] = sn.season * 100 + sn.week
    sn = sn.sort_values("tg")
    sn["r3"] = sn.groupby("gsis_id").pct.transform(lambda s: s.rolling(3, min_periods=1).mean())
    use = sn[["gsis_id", "tg", "r3"]].sort_values("tg")

    # ---- previous game status (same season)
    prv = rw[rw.status.isin(["ACT", "INA", "RES"]) & (rw.t < cur_t)][["gsis_id", "t", "status"]]
    prv = prv.drop_duplicates(["t", "gsis_id"]).rename(columns={"t": "tp", "status": "prev_status"}).sort_values("tp")

    d = inj.copy()
    d["st"] = d.report_status.fillna("None")
    d["pr"] = d.practice_status.map(PRACTICE).fillna("FP")
    d["pos"] = d.position.map(pos_group)
    d["inj"] = d.report_primary_injury.fillna(d.practice_primary_injury).map(body)
    d = d.sort_values("t")
    d = pd.merge_asof(d, use, left_on="t", right_on="tg", by="gsis_id", allow_exact_matches=False)
    d["usage"] = pd.cut(d.r3.fillna(0), [-1, 0.15, 0.5, 2], labels=["Depth", "Rotation", "Starter"]).astype(str)
    d = pd.merge_asof(d, prv, left_on="t", right_on="tp", by="gsis_id", allow_exact_matches=False)
    same = (d.tp // 100) == d.season
    d["prev"] = np.where(~same | d.prev_status.isna(), "unk", np.where(d.prev_status == "ACT", "played", "missed"))
    d = d.merge(lab[["t", "gsis_id", "y"]], on=["t", "gsis_id"], how="left")

    train = d[d.y.notna() & d.st.isin(["Questionable", "Doubtful", "Out", "None"])].copy()
    train["y"] = train.y.astype(int)
    log("training rows", len(train))
    main_m = fit(train, MAIN_FEATS)
    prov_m = fit(train, PROV_FEATS)

    # ---- player history residuals (Q/D listings only)
    train["p"] = sig(score(train, main_m))
    qd = train[train.st.isin(["Questionable", "Doubtful"])]
    hist = qd.assign(res=qd.y - qd.p).groupby("gsis_id").agg(n=("y", "size"), played=("y", "sum"), res=("res", "sum"))
    logs = {}
    for g, grp in qd.sort_values("t", ascending=False).groupby("gsis_id", sort=False):
        logs[g] = [[int(r.season), int(r.week), r.st[0], r.pr, str(r.report_primary_injury if pd.notna(r.report_primary_injury) else r.practice_primary_injury), int(r.y)]
                   for r in grp.head(12).itertuples()]

    # ---- bucket rates (status x practice) for display
    buckets = {}
    for (st, pr), g in train[train.pos != "OTH"].groupby(["st", "pr"]):
        buckets[f"{st}|{pr}"] = [round(float(g.y.mean()), 3), int(len(g))]
    for st, g in train[train.pos != "OTH"].groupby("st"):
        buckets[f"{st}|ALL"] = [round(float(g.y.mean()), 3), int(len(g))]

    # ---- sleeper ids
    sl = rw.dropna(subset=["sleeper_id"]).sort_values("t").drop_duplicates("gsis_id", keep="last")
    sleeper = dict(zip(sl.gsis_id, sl.sleeper_id.astype("int64").astype(str)))

    def team_info(week):
        g = games[games.week == week]
        out = {}
        for r in g.itertuples():
            for tm, opp, home in [(r.home_team, r.away_team, True), (r.away_team, r.home_team, False)]:
                out[tm] = {"opp": opp, "home": home, "day": r.gameday, "time": r.gametime,
                           "wd": r.weekday[:3], "done": bool(pd.notna(r.result))}
        return out

    def old_days(week):
        src = []
        if old and old.get("season") == season:
            if old.get("week") == week:
                src = old.get("players", [])
            elif old.get("recap") and old["recap"].get("week") == week:
                src = old["recap"].get("players", [])
        return {p["id"]: p.get("days") or {} for p in src}

    def player_rows(week, record=False):
        prior = old_days(week)
        w = d[(d.season == season) & (d.week == week) & d.position.isin(FANTASY_POS)]
        final_teams = set(w[w.report_status.notna()].team)
        rows = []
        for r in w.itertuples():
            days = dict(prior.get(r.gsis_id, {}))
            if record and pd.notna(r.practice_status):
                days[report_day] = r.pr
            h = hist.loc[r.gsis_id] if r.gsis_id in hist.index else None
            rows.append({
                "id": r.gsis_id, "sid": sleeper.get(r.gsis_id), "name": r.full_name, "pos": r.position,
                "team": r.team, "st": r.st, "pr": r.pr if pd.notna(r.practice_status) else None,
                "injury": r.report_primary_injury if pd.notna(r.report_primary_injury) else (r.practice_primary_injury if pd.notna(r.practice_primary_injury) else None),
                "inj": r.inj, "usage": r.usage, "snap": None if pd.isna(r.r3) else round(float(r.r3), 2),
                "prev": r.prev, "final": r.team in final_teams, "days": days,
                "rest": "not injury" in str(r.practice_primary_injury).lower(),
                "h": None if h is None else {"n": int(h.n), "played": int(h.played), "res": round(float(h.res), 3)},
                "log": logs.get(r.gsis_id, []),
                "y": None if pd.isna(r.y) else int(r.y),
            })
        return rows

    # ---- long-term absences
    il = inj[inj.season >= FIRST_SEASON].copy()
    il["grp"] = il.report_primary_injury.fillna(il.practice_primary_injury).map(body)
    il["txt"] = il.report_primary_injury.fillna(il.practice_primary_injury)
    il = il[~il.grp.isin(["rest", "none"])]
    lookup = {(a, b, c): (g, t) for a, b, c, g, t in zip(il.season, il.gsis_id, il.week, il.grp, il.txt)}
    done = rw[rw.status.isin(["ACT", "INA", "RES"]) & (rw.t < cur_t)]
    spells = build_spells(done, lookup)
    hist_sp = spells[~(spells.open & (spells.season == season))]
    log("absence spells", len(spells))
    last_wk = int(done[done.season == season].week.max()) if (done.season == season).any() else 0
    cur_sp = spells[(spells.season == season) & spells.open]
    last_status = done[(done.season == season) & (done.week == last_wk)].set_index("gsis_id").status
    cur_sp = cur_sp[cur_sp.gsis.isin(last_status.index) & (cur_sp.end == last_wk)]
    names = rw[rw.season == season].sort_values("t").drop_duplicates("gsis_id", keep="last").set_index("gsis_id")
    longterm = []
    seen = set()
    for x in cur_sp.itertuples():
        if x.gsis not in names.index: continue
        nm = names.loc[x.gsis]
        if nm.position not in FANTASY_POS: continue
        flag = x.seq[-1]
        pj = project(hist_sp, x.inj, x.L, flag)
        longterm.append({"id": x.gsis, "sid": sleeper.get(x.gsis), "name": nm.full_name, "pos": nm.position,
                         "team": nm.team, "m": int(x.L), "since": int(x.start), "ir": flag == "R",
                         "injury": x.text, "inj": x.inj, "proj": pj})
        seen.add(x.gsis)
    wk = d[(d.season == season) & (d.week == cur_week) & (d.st == "Out") & d.position.isin(FANTASY_POS)]
    for r in wk.itertuples():
        if r.gsis_id in seen: continue
        pj = project(hist_sp, r.inj if r.inj not in ("rest", "none") else "other", 0, "I")
        longterm.append({"id": r.gsis_id, "sid": sleeper.get(r.gsis_id), "name": r.full_name, "pos": r.position,
                         "team": r.team, "m": 0, "since": cur_week, "ir": False,
                         "injury": r.report_primary_injury if pd.notna(r.report_primary_injury) else None,
                         "inj": r.inj, "proj": pj})
    sched = {}
    for g in games[games.week >= cur_week].itertuples():
        sched.setdefault(g.home_team, []).append(int(g.week)); sched.setdefault(g.away_team, []).append(int(g.week))
    sched = {k: sorted(v) for k, v in sched.items()}

    out = {
        "build": BUILD_VERSION,
        "built": today.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "season": season, "week": cur_week,
        "trainRows": int(len(train)), "trainSeasons": [FIRST_SEASON, season],
        "model": main_m, "prov": prov_m,
        "hist": {"k": HIST_K, "c": HIST_C, "cap": HIST_CAP},
        "buckets": buckets,
        "teams": team_info(cur_week),
        "players": player_rows(cur_week, record=True), "reportDay": report_day,
        "longterm": longterm, "sched": sched, "spellRows": int(len(hist_sp)),
        "recap": {"week": cur_week - 1, "teams": team_info(cur_week - 1), "players": player_rows(cur_week - 1)} if cur_week > 1 else None,
    }
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    if os.path.exists(args.out):
        try:
            with open(args.out) as f:
                old = json.load(f)
            old.pop("built", None)
            new = clean(json.loads(json.dumps({k: v for k, v in out.items() if k != "built"}, default=lambda o: None)))
            if old == new:
                log("no change in data, file left as is")
                return
        except Exception:  # noqa
            pass
    with open(args.out, "w") as f:
        json.dump(clean(out), f, separators=(",", ":"), default=lambda o: None, allow_nan=False)
    log(f"wrote {args.out}: week {cur_week}, {len(out['players'])} players, recap {len(out['recap']['players']) if out['recap'] else 0}")


if __name__ == "__main__":
    main()
