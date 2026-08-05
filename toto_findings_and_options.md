# TOTO Analyzer - Findings & Progress Log

Scope: Singapore Pools TOTO Analyzer (React). Single self-contained component
that analyzes overlap between consecutive draws, simulates bet ROI, renders
stats/matrices, and (nested) a wheeling generator. No external file paths
required in this log; the canonical code now lives in a single refactored file.

---

## 1. Probability verification (unchanged from initial investigation)

Headline: P(exactly k shared numbers between consecutive draws)?

| Model | 0 | 1 | 2 | 3 | 4+ |
|-------|------|------|------|------|------|
| 6 vs 6 (core method) | 43.60% | 41.30% | 13.24% | 1.77% | 0.10% |
| 6 vs 7 (main vs 6+addl) | 37.51% | 42.58% | 16.81% | 2.87% | 0.22% |
| 7 vs 7 (both incl. addl) | 31.41% | 42.75% | 20.80% | 4.56% | 0.49% |
| 6 vs 8 (definitional hack) | 32.15% | 42.87% | 20.28% | 4.27% | 0.41% |

- Monte Carlo matched theory to 3 decimals -> formula correct, no sim error.
- Real 49-pair sample: chi-square vs theory = 5.61 (critical 0.05 ~ 11.07) ->
  consistent. Consecutive draws = random pairs. No "hot carryover" to exploit.
  Only real edge is EV spikes on jackpot rollovers beating 1-in-13,983,816.

---

## 2. Data-accuracy defect (ROOT CAUSE, now FIXED)

The original history builder had NO parser: hardcoded top 5 draws + a
Math.random() generator for the other 47 (4154-4200). Draws 4154-4200 (incl.
Feb 5 = draw 4154) were fabricated and never matched reality. Wrong bonus
numbers even in the "known real" block (4203: 12 vs real 28; 4202: 29 vs 35;
4201: 12 vs 44).

FIX APPLIED: replaced the fabricated IIFE with a real embedded base dataset of
314 verified draws (3892-2026-08-03 back to 2023-08-04), parsed from the
official Singapore Pools site via parse_toto.py (base64 DrawNumber token).
Embedded array was programmatically regenerated from the CSV and verified to
have 0 mismatches vs the source CSV. No random data anywhere on first run.

---

## 3. THEORETICAL_7 labeling bug (FIXED)

With includeBonus ON the app intersects two 7-ball sets (true 7-vs-7). The
old THEORETICAL_7 was hardcoded to the "cited figures" row (6-vs-8 approx):
0:32.07 1:43.25 2:19.66 3:3.82 4:0.38. True 7-vs-7 is
0:31.41 1:42.75 2:20.80 3:4.56 4:0.49.

FIX APPLIED: THEORETICAL_7 corrected to true 7-vs-7 values. THEORETICAL_6
(6-vs-6) was already correct and left intact.

---

## 4. Crash / boundary defects (FIXED)

- Custom CSV import could crash coOccurrence matrix on out-of-range numbers
  (matrix[a][b]++ with a<1 or a>49). FIX: added isValidDraw() guard (1-49, 6
  unique main + 1 additional) in parseCSVData; coOccurrence filters each ball
  to 1-49 before indexing; frequencyStats guards the same way.
- Empty dataset runtime exceptions (sumStats Math.min(...[]) -> Infinity;
  consecutivePairs on <2 draws). FIX: both guarded; consecutivePairs returns []
  when activeDraws.length < 2; sumStats uses sums.length ? checks.
- ErrorBoundary retained as last-resort catch.

---

## 5. Wheeling System (RELOCATED)

Originally a standalone tab with its own 24-number selector. User wanted it
nested under "Next Bet & ROI" using the shared betNumbers selector.

FIX APPLIED: standalone 'wheeling' tab removed; wheeling generator now sits at
the end of the planner tab, reusing betNumbers (6-15). Full/Abbreviated modes
kept. Clear All clears both. Cleaned up the old separate wheelNumbers state and
toggleWheelNumber handler.

---

## 6. "Pull Latest Results" button (REWORKED)

Old handler invented Math.random() data ("Simulate Latest Results"). Browser /
Canvas cannot run the Python scraper or scrape the official site (CORS).

FIX APPLIED: button now prefers a hosted endpoint if LIVE_SYNC_ENDPOINT is set
(fetch + merge, with validity checks), otherwise opens the local CSV import
and shows a clear CORS note. No fabricated data. LIVE_SYNC_ENDPOINT is a single
const = null (wire to a Cloud Run / serverless scraper later).

---

## 7. Final file inventory (toolchain dir)

- toto_analyzer_refactored.jsx  -- CANONICAL deliverable. Drop into Gemini
  Canvas as a React component. Real 314-draw base, corrected theory, hardened
  crashes, wheeling nested, Pull Latest reworked. 15/15 structural checks PASS.
- toto_official.csv  -- CANONICAL 314-draw source (LF endings). Single source of
  truth; parse_toto.py accumulating-DB target (incremental append, never loses
  old draws). Data-identical to the now-removed toto_history_4205.csv (only line
  endings differed).
- toto_official.json  -- same 314 draws, structured JSON.
- parse_toto.py  -- standalone/incremental scraper (base64 sppl token); default
  floor 3892; appends only newer draws, never loses old. Now also has a
  read-only `--verify` mode (no network) that checks schema, per-ball rules
  (6 unique mains 1-49, sorted, additional 1-49), draw contiguity, date/weekday
  sanity (Fri = legit CNY/special, not flagged), and CSV/JSON parity.

REMOVED (old / redundant): toto_analyzer_original_backup.jsx (pre-wheeling .jsx),
app.txt (Gemini source, demo data), toto_base_regen.txt and toto_base_literal.txt
(scratch literals of the base data; data now lives inline in the component),
toto_history_4205.csv (duplicate of toto_official.csv; only CRLF vs LF differed),
verify_toto.py (its two-CSV diff purpose died once the 2nd CSV was removed; its
useful sanity/cadence checks were folded into parse_toto.py --verify).

---

## 8. Status

- All mandatory fixes (A: real data, B: THEORETICAL_7, C: cadence logic folded
  into crash guards) DONE.
- D (live sync) DEFERRED but scaffolded via LIVE_SYNC_ENDPOINT const; needs a
  hosted parser (Cloud Run) to activate.
- Component verified: embedded dataset 0 mismatches vs CSV; 15/15 structural
  checks pass; no demo-data path remains.
- Database integrity verified: parse_toto.py --verify passes on the 314-draw CSV
  (0 problems); proven to catch dup-ball / out-of-range / missing-draw /
  bad-header / unsorted-mains corruption. Run `python parse_toto.py --verify`
  after any manual edit or append.

## 9. Next steps (outstanding, user-deferred)

- Host parse_toto.py (Flask/FastAPI) on Cloud Run; set LIVE_SYNC_ENDPOINT in the
  component to enable one-click live pull.
