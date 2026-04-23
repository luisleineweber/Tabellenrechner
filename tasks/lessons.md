# Lessons

- The WAM search bootstrap should retry transient upstream failures and stop early when a selected filter branch has no downstream options; otherwise the UI can surface avoidable 500s from invalid follow-up requests.
- Keep official table adjustments separate from raw result aggregation; otherwise the zero-edit table and movement indicators can drift away from the imported fussball.de baseline.
- GitHub Pages can only serve the repository as static files; a Next.js app that depends on `src/app/api` routes needs a server-capable deployment target, so the root Pages site should explain that instead of falling back to the README render.
- For Vercel deployments from this repository, the correct project root is `webapp`; trying to deploy from the repo root risks missing Next.js auto-detection and can pick an unintended Node major unless `engines.node` is pinned.
- Once the production deployment exists on Vercel, the root README, workspace README, and any static handoff page should link to the live domain first; otherwise the repository keeps advertising the retired fallback hosting path.
- Horizontal touch/trackpad rails need both wheel interception and `touch-action`/`overscroll-behavior` guards; handling only mouse drag still lets the page scroll-chain while users navigate the rail.
- For draggable desktop rails with clickable child tabs, do not call `setPointerCapture` on `pointerdown`; capture only after real drag movement starts, or normal tab clicks can stop firing.
- When adding alternate layouts, keep the default render path explicit and verify it still renders the table plus active-matchday selector; shared helpers should not replace the main workspace with the stacked route by accident.
- When fixing German UI copy on Windows, verify suspect strings by reading the source as UTF-8 before editing; PowerShell output can show mojibake even when the file content is already correct.
- `fussball.de` can emit repeated `spielfrei` fixtures without detail links, so imported match IDs need a collision-safe fallback instead of relying on matchday plus team names alone.
- When importing optional match metadata from `Promise.all`, collect the non-null rows into an explicitly typed accumulator before passing them onward; otherwise the TypeScript build can reject a nullable union that a `filter(Boolean)`-style expression did not narrow enough.
- For the GitHub Pages handoff page, if user feedback says the design feels weak, stop iterative styling and rebuild from a new concept with clear motion and stronger hierarchy; prevention rule: after a design complaint, define a fresh visual direction first, then implement from scratch instead of patching the old layout.
- Table sorting must treat zero-game rows as non-participating tie-breaker cases after points are equal; otherwise withdrawn teams with 0:0 goals can rank above clubs that actually played and lost.
- For the public landing page, keep copy user-facing and avoid internal/developer details; if no-scroll is required, enforce `100dvh` + `overflow:hidden` and add height-based breakpoints (`max-height`) so content still fits on short screens.
- For final visual polish on cross-surface pages, remap shared colors to canonical webapp tokens first (accent/text/bg/border) and only then layer secondary accents like green sports panels.
