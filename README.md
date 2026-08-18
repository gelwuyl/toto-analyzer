# TOTO-RO

Singapore Pools TOTO Analyzer React app deployed to GitHub Pages. Ships the complete TOTO draw history embedded
in the build — a snapshot that is continuously extended as new draws are scraped — then auto-refreshes from the
hosted `toto_official.csv` on load. A scheduled GitHub Action re-scrapes the latest draws and redeploys — no server,
no container, no cost (GitHub Actions free tier).

## Local dev
```
npm install
npm run dev        # http://localhost:5173
```

## Build / preview
```
npm run build
npm run preview
```

## Deploy (one-time, needs your GitHub account)
1. Create a repo on GitHub (e.g. `toto-ro`).
2. From this folder:
   ```
   git remote add origin git@github.com:<you>/toto-ro.git
   git branch -M main
   git push -u origin main
   ```
3. Repo **Settings -> Pages -> Build and deployment -> Source: GitHub Actions**.
4. Watch the **Deploy to GitHub Pages** workflow. Live at:
   `https://<you>.github.io/toto-ro/`

## How the data stays live
- `parse_toto.py` scrapes Singapore Pools and writes `public/toto_official.csv`.
- `deploy.yml` runs it at every build, then builds and publishes the site.
- `update-data.yml` runs on a schedule (3x/day) and commits any new draws,
  which re-triggers the deploy. If the scrape is blocked from CI, the app
  falls back to the embedded base dataset — it never breaks.

## Files
- `src/TotoAnalyzer.jsx`  -- the app (deploy copy of `toto_analyzer_refactored.jsx`)
- `public/toto_official.csv` / `.json`  -- the growing database
- `parse_toto.py`  -- scraper used by the Actions
- `.github/workflows/*`  -- deploy + data-refresh pipelines
- `toto_analyzer_refactored.jsx`  -- canonical source; copy to `src/` after edits
