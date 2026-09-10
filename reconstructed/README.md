# Local reconstruction

These files reconstruct the latest complete archived iQabinet site for local reference. They use the recovered styles and media in `../wayback/assets/`.

Forms, login actions, signup behavior, and scripts are disabled or inert in this copy. The raw HTML remains in `../wayback/pages/`.

Wayback did not retain 29 old Avada theme references. The missing items are mostly decorative images used by generic theme components. See `../wayback/manifest.json` for the exact list.

Open `index.html` to browse the reconstruction. Run `node ../reconstruct.mjs` after refreshing the archive.
