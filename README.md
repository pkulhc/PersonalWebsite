# Haocheng Lu Personal Website

A static bilingual (中文 / English) academic website for Haocheng Lu, Department of Pharmacology, School of Medicine, Southern University of Science and Technology (SUSTech).

## Structure

- `index.html` — Chinese page
- `en.html` — English page
- `styles.css` — shared editorial visual system, including light and dark themes
- `script.js` — shared interactions: publication filter/search, figure lightbox, theme toggle, hero canvas, and the NCBI publication counter
- `assets/` — portrait and mechanism illustrations (WebP)

## Local Preview

Open `index.html` directly in a browser, or serve the folder with any static server.

## Deployment

GitHub Pages serves the `main` branch root at https://pkulhc.github.io/PersonalWebsite/.

## Publications

The selected publication lists are maintained directly in the Publications section of
`index.html` and `en.html`; there is no build step. Journal Impact Factors follow the
latest JCR release — when the annual data updates, change every occurrence of a
journal consistently on both pages. Author names are bold for Haocheng Lu; `#`
marks co-first authors and `*` marks corresponding authors. The statistics bar
defaults to the current NCBI count (56) and refreshes from NCBI E-utilities at
runtime when the API is reachable.

## Design

Typography pairs Newsreader / Noto Serif SC for display headings with Inter /
Noto Sans SC for UI and body text. The color system draws on the vascular
illustrations (arterial red, TFEB emerald, laminar blue) on an acid-free paper
ground. The theme choice is stored in `localStorage` and follows
`prefers-color-scheme` when unset. Motion respects `prefers-reduced-motion`, and
all content remains readable without JavaScript.
