#!/usr/bin/env python3
"""
Singapore Pools TOTO results -> local accumulating database.

Behaviour
--------
DEFAULT (incremental / append mode):
  * Reads existing toto_official.csv (if present) to learn the highest stored
    draw number.
  * Fetches ONLY draws newer than that (stored_max+1 .. latest on site).
  * Appends the new rows to the existing file. Old records are NEVER deleted,
    so the file is a self-contained growing history that survives the website
    going down.

FULL mode (--full):
  * Ignores the existing file and re-fetches the entire window
    (--start floor .. latest), rewriting both CSV and JSON. Use this once to
    backfill, or occasionally to reconcile against any site corrections.

Output shape (matches the React app import):
  DrawNo,Date,N1,N2,N3,N4,N5,N6,Additional   (draw-descending)

Mechanism
--------
Each draw lives at:
  /en/product/sr/Pages/toto_results.aspx?sppl=<base64("DrawNumber=N")>
No sppl (or empty/invalid) returns the LATEST draw, so we first fetch latest
to learn the top draw number, then walk downward selecting exact draws.

Usage
-----
  python parse_toto.py                 # append any new draws since last run
  python parse_toto.py --full          # regenerate whole history (floor 3892)
  python parse_toto.py --start 4154    # floor for --full backfill
  python parse_toto.py --out DIR       # output directory (default: script dir)
  python parse_toto.py --verify        # read-only integrity check of toto_official.csv (+json), no network
"""
import argparse
import base64
import csv
import json
import os
import re
import time
import urllib.request

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
PAGE = "https://www.singaporepools.com.sg/en/product/sr/Pages/toto_results.aspx"

MONTHS = {m: f"{i:02d}" for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep",
     "Oct", "Nov", "Dec"], start=1)}

date_re = re.compile(r"drawDate'>(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d{2}) ([A-Za-z]+) (\d{4})<")
num_re  = re.compile(r"drawNumber'>Draw No\. (\d+)<")
win_re  = re.compile(r"win[1-6]'>\s*(\d+)<")
add_re  = re.compile(r"additional'>(\d+)<")


def fetch_html(draw):
    tok = base64.b64encode(f"DrawNumber={draw}".encode()).decode()
    url = PAGE + ("?sppl=" + tok if draw else "")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def parse(draw):
    html = fetch_html(draw)
    dm = date_re.search(html)
    nm = num_re.search(html)
    am = add_re.search(html)
    wins = win_re.findall(html)
    if not (dm and nm and am and len(wins) == 6):
        raise ValueError(f"draw {draw}: incomplete parse "
                         f"(date={bool(dm)} no={bool(nm)} add={bool(am)} wins={len(wins)})")
    _, dd, mon, yyyy = dm.groups()
    return {
        "drawNo": int(nm.group(1)),
        "date": f"{yyyy}-{MONTHS[mon]}-{dd}",
        "numbers": sorted(int(w) for w in wins),
        "additional": int(am.group(1)),
    }


def get_latest():
    return parse(0)["drawNo"]


def load_existing(path):
    d = {}
    if os.path.exists(path):
        with open(path, newline="") as f:
            for r in csv.DictReader(f):
                d[int(r["DrawNo"])] = {
                    "drawNo": int(r["DrawNo"]),
                    "date": r["Date"],
                    "numbers": [int(r[f"N{i}"]) for i in range(1, 7)],
                    "additional": int(r["Additional"]),
                }
    return d


def self_check(records):
    bad = 0
    for r in records:
        nums = r["numbers"]
        if nums != sorted(nums) or len(set(nums)) != 6:
            bad += 1; print("SANITY: unsorted/dup main", r["drawNo"])
        if not all(1 <= n <= 49 for n in nums + [r["additional"]]):
            bad += 1; print("SANITY: out of range", r["drawNo"])
    prev = None
    for r in sorted(records, key=lambda x: -x["drawNo"]):
        if prev is not None and r["drawNo"] != prev - 1:
            bad += 1; print("SANITY: drawNo gap", r["drawNo"], prev)
        prev = r["drawNo"]
    return bad


def write_outputs(records, csv_path, json_path):
    recs = sorted(records, key=lambda x: -x["drawNo"])  # draw-descending
    with open(csv_path, "w", newline="") as f:
        f.write("DrawNo,Date,N1,N2,N3,N4,N5,N6,Additional\n")
        for r in recs:
            f.write(f"{r['drawNo']},{r['date']},"
                    + ",".join(str(n) for n in r["numbers"])
                    + f",{r['additional']}\n")
    with open(json_path, "w") as f:
        json.dump(recs, f, indent=2)


def verify_database(out_dir):
    """Read-only integrity check of the single CSV (+ JSON) database.

    No network. Validates schema (exact 9-column header), per-row ball rules
    (6 unique mains 1-49, sorted, additional 1-49), draw-number contiguity,
    date validity, weekday sanity (Mon/Thu expected; Fri = legit CNY/special;
    Sat/Sun flagged), and CSV/JSON parity. Returns (ok, report_lines).
    """
    import datetime
    from collections import Counter

    csv_path = os.path.join(out_dir, "toto_official.csv")
    json_path = os.path.join(out_dir, "toto_official.json")
    expected_header = ["DrawNo", "Date", "N1", "N2", "N3", "N4", "N5", "N6", "Additional"]
    problems = []
    if not os.path.exists(csv_path):
        return False, [f"MISSING: {csv_path}"]

    with open(csv_path, newline="") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        if header != expected_header:
            problems.append(f"HEADER: expected {expected_header}, got {header}")
        raw = [r for r in reader if any(c.strip() for c in r)]  # drop blank lines

    draws = {}
    for i, r in enumerate(raw, start=2):  # line 1 = header
        if len(r) != 9:
            problems.append(f"LINE {i}: expected 9 cols, got {len(r)} -> {r}")
            continue
        try:
            dn = int(r[0])                       # DrawNo
            addl = int(r[8])                      # Additional
            mains = [int(r[k]) for k in range(2, 8)]  # N1..N6 (idx1 = Date)
        except ValueError:
            problems.append(f"LINE {i}: non-integer field -> {r}")
            continue
        if not (1 <= addl <= 49) or any(not (1 <= n <= 49) for n in mains):
            problems.append(f"DRAW {dn}: ball out of range 1-49 -> {r}")
        if len(set(mains)) != 6:
            problems.append(f"DRAW {dn}: duplicate main numbers -> {mains}")
        if mains != sorted(mains):
            problems.append(f"DRAW {dn}: mains not sorted -> {mains}")
        if dn in draws:
            problems.append(f"DRAW {dn}: DUPLICATE row")
        draws[dn] = r[1]

    if draws:
        lo, hi = min(draws), max(draws)
        missing = [d for d in range(lo, hi + 1) if d not in draws]
        if missing:
            problems.append(f"DRAW GAP: missing {len(missing)} draws in {lo}..{hi} "
                            f"(e.g. {missing[:10]})")

    wd = Counter()
    for dn, datestr in draws.items():
        try:
            dt = datetime.date.fromisoformat(datestr)
            wd[dt.strftime("%a")] += 1
        except ValueError:
            problems.append(f"DRAW {dn}: invalid date '{datestr}'")
    weird = {k: v for k, v in wd.items() if k not in ("Mon", "Thu", "Fri")}
    if weird:
        problems.append(f"WEEKDAY: unexpected draw weekdays {weird} "
                        f"(Sat/Sun would be suspicious)")

    if os.path.exists(json_path):
        try:
            with open(json_path) as f:
                j = json.load(f)
            jnos = sorted(x["drawNo"] for x in j)
            if jnos != sorted(draws):
                problems.append(f"JSON/CSV mismatch: {len(jnos)} json vs "
                                f"{len(draws)} csv draws")
        except Exception as e:
            problems.append(f"JSON: unreadable ({e})")

    n = len(draws)
    summary = [f"verified {n} draws, contiguous window {lo}..{hi}" if draws
               else "verified 0 draws",
               f"weekdays: {dict(wd)}",
               f"problems: {len(problems)}"]
    if problems:
        return False, summary + problems
    return True, summary + ["OK: rows + columns intact"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--full", action="store_true",
                    help="regenerate entire history (ignore existing file)")
    ap.add_argument("--start", type=int, default=3892,
                    help="floor draw number for --full backfill (default 3892)")
    ap.add_argument("--out", default=os.path.dirname(os.path.abspath(__file__)),
                    help="output directory (default: script folder)")
    ap.add_argument("--verify", action="store_true",
                    help="read-only integrity check of existing toto_official.csv (+json), no network")
    args = ap.parse_args()

    if args.verify:
        ok, report = verify_database(args.out)
        print("\n".join(report))
        raise SystemExit(0 if ok else 1)

    os.makedirs(args.out, exist_ok=True)
    csv_path = os.path.join(args.out, "toto_official.csv")
    json_path = os.path.join(args.out, "toto_official.json")

    existing = {} if args.full else load_existing(csv_path)
    latest = get_latest()

    if existing and not args.full:
        floor = max(existing) + 1
        mode = "INCREMENTAL"
    else:
        floor = args.start
        mode = "FULL"

    new_records = []
    if floor <= latest:
        print(f"[{mode}] fetching draws {latest} -> {floor} ...")
        for d in range(latest, floor - 1, -1):
            for attempt in range(3):
                try:
                    rec = parse(d)
                    new_records.append(rec)
                    print(f"  +{rec['drawNo']}  {rec['date']}  "
                          f"{rec['numbers']} +{rec['additional']}")
                    break
                except Exception as e:
                    print(f"  ! draw {d}: {e}")
                    time.sleep(1.5)
            else:
                print(f"  !! draw {d} FAILED after retries - stopping")
                break
            time.sleep(0.2)
    else:
        print(f"[{mode}] already up to date (latest={latest}, "
              f"stored_max={max(existing) if existing else 'none'})")

    # merge: existing records win on conflict, new appended
    merged = dict(existing)
    for r in new_records:
        merged[r["drawNo"]] = r

    sanity = self_check(list(merged.values()))
    write_outputs(list(merged.values()), csv_path, json_path)

    print(f"\nDONE: mode={mode}  added={len(new_records)}  "
          f"total={len(merged)}  sanity_violations={sanity}")
    print(f"CSV  -> {csv_path}")
    print(f"JSON -> {json_path}")


if __name__ == "__main__":
    main()
