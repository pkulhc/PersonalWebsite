# Haocheng Lu Personal Website

A modern static personal academic website for Haocheng Lu, Department of Pharmacology, School of Medicine, Southern University of Science and Technology.

## Local Preview

Open `index.html` directly in a browser.

## Deployment

This site is static and can be deployed with GitHub Pages from the repository root.

## Publications

`data/publications.json` is the shared, dated bibliography for both languages.
The 2026-10-26 snapshot contains 56 unique PubMed records from both pages of
the public NCBI My Bibliography. PubMed XML supplies bibliographic metadata;
verified author-credit annotations are retained separately in each author record.
The ten featured papers are first-/corresponding-author selections.

After editing the dataset, run `node scripts/build-publications.mjs` to regenerate
the marked sections of `index.html` and `en.html`. The generated HTML is the
deployed content; there are no runtime API calls or required build dependencies.
Full publication text and links remain available without JavaScript.

Author names are bold for Haocheng Lu; `#` identifies co-first authors and `*`
identifies corresponding authors, including co-corresponding authors. Long author
lists can be expanded. The autophagy guidelines retain only Daniel J. Klionsky
(first and corresponding author), Haocheng Lu and ellipses.

Local Lucide icons are version 0.468.0; their license is in `assets/icons/LICENSE`.

## Motion

The shared script uses the Web Animations API for one-shot hero entrances,
scroll reveals and short control transitions. CSS adds hover feedback without
changing layout dimensions. All content remains readable without animation
support or JavaScript. Motion respects `prefers-reduced-motion`, including
changes made while the page is open, and keyboard focus cancels entrance motion.
