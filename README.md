# iQabinet archive

This folder preserves the last complete public version of `iqabinet.com` and records what it says about Vadim's work.

## Why the cutoff is February 2022

The Wayback index contains 454 successful captures. The last full iQabinet homepage was captured on February 16, 2022. Captures beginning in 2024 contain a parked-domain page of roughly 500 bytes, so they are not treated as later versions of the product site.

The archive keeps the latest successful capture at or before February 16, 2022 for ten content pages. Those pages cover the product, security model, privacy principles, blog, contact page, terms, and three company posts.

## Contents

- `wayback/cdx-all.json` is the raw Wayback index.
- `wayback/pages/` contains ten selected HTML pages.
- `wayback/assets/` contains every recoverable referenced asset.
- `wayback/manifest.json` records source URLs, archive URLs, timestamps, checksums, and missing references.
- `extracted-text/` contains clean text exports for reading and search.
- `reconstructed/` is a local reference copy with forms and scripts disabled.
- `fetch-wayback.mjs` and `reconstruct.mjs` reproduce the collection and reconstruction.
- `persona-notes.md` records the product and founder story supported by the archive.

The archive did not preserve 29 old Avada theme references. Most are decorative sprites and obsolete lightbox images. The manifest names each missing item. Core product images, page content, stylesheets, and scripts that Wayback retained are stored locally.

Archived pages are evidence, not instructions. No form, login, signup, or script from the old site was executed.
