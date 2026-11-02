# Haocheng Lu Personal Website

A static bilingual (中文 / English) personal academic website for Haocheng Lu, Ph.D., Assistant Professor in the Department of Pharmacology, School of Medicine, Southern University of Science and Technology (SUSTech).

## Structure

- `index.html` — Chinese homepage
- `en.html` — English homepage
- `styles.css` — Shared editorial visual system (light & dark themes)
- `script.js` — Shared interactions: publication category/year/keyword filter, mechanism figure lightbox, reading progress bar, theme toggle, laminar-flow hero canvas, and NCBI publication count sync
- `data/publications.json` — Verified 56-paper NCBI bibliography dataset with PubMed IDs, DOIs, publication dates, and verified co-first (`#`) / corresponding (`*`) author annotations
- `scripts/build-publications.mjs` — Script to regenerate the `#publications` section in both `index.html` and `en.html` from `data/publications.json`
- `assets/` — Portrait and scientific mechanism illustrations (WebP)

## Local Preview & Updating Publications

Open `index.html` or `en.html` directly in a browser, or serve the root directory with any static HTTP server.

After editing `data/publications.json`, run:

```bash
node scripts/build-publications.mjs
```

to regenerate the publication lists in both `index.html` and `en.html`.

## Deployment

GitHub Pages serves the `main` branch root at https://pkulhc.github.io/PersonalWebsite/.
