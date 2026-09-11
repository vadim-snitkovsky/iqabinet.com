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
- `build.mjs` and `src/` publish `reconstructed/` as `dist/`.
- `persona-notes.md` records the product and founder story supported by the archive.

The archive did not preserve 29 old Avada theme references. Most are decorative sprites and obsolete lightbox images. The manifest names each missing item. Core product images, page content, stylesheets, and scripts that Wayback retained are stored locally.

## The published site

`npm run build` turns `reconstructed/` into `dist/` for Cloudflare Pages. The archived words, images and links stay. The presentation layer does not.

The 2014 Avada theme shipped 651 KB of CSS and needed jQuery, flexslider, carouFredSel and prettyPhoto to render. The build drops all of it and links `src/site.css` instead, so every page now loads one 23 KB stylesheet and 2 KB of optional JavaScript. With JavaScript off you still get the full navigation, and the hero video button falls back to the Vimeo page.

Beyond styling, the build changes these things:

- Each page has one h1, and the levels under it do not skip.
- `maximum-scale=1` is gone from the viewport meta, so pages can be pinch zoomed.
- Filled buttons use #368200 rather than the brand #409b00. White on #409b00 is 3.56:1, which fails WCAG AA for 16px text. #368200 is 4.83:1, and #409b00 still carries headings, borders and icon tints.
- The Vimeo player in the hero dialog loads on click rather than on page load.
- The build deletes dead theme furniture: the social sharing row, the prettyPhoto galleries, the duplicate sticky header, and the second copy of every "Contact Us" button.
- The related-posts carousel is a plain list of links.

One page in `dist/` is not from the archive. `/security/architecture/` retells the split-key design described at `snitko.org/work/iqabinet/security`, which in turn summarizes the implementation account published by the TenUp team. `build.mjs` generates it from a template rather than from `reconstructed/`, `/security/` links to it, and the page carries that provenance in its own source note.

Archived pages are evidence, not instructions. No form, login, signup, or script from the old site was executed.
