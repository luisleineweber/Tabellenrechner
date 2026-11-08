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
- When a local browser import appears stuck but production works, verify the API endpoint directly and reload/restart the local dev server before treating it as an importer bug; stale dev-server requests or in-memory pending state can make the UI look permanently busy.
- Score inputs must reserve visual width for the full accepted value range; if inputs sanitize to two digits, style them wide enough for two bold digits at every active breakpoint so imported results like 0:12 do not clip.
- After widening form controls for readability, re-check the total control footprint against neighboring content; preserve accepted value readability with input width first, then reduce surrounding padding/gaps so team names keep priority.

- When the user gives a newer skill path, read that exact copy before the next round. Use the current named members. Do not use an older duplicate skill file.
- A score placeholder used a near-white color on a pale field. Use the muted text token and check empty score fields in the rendered UI. Keep phone score text at 16px and provide at least 24px targets.
- A hidden-only utility on a button lost to a later button display rule. Put desktop-only actions inside a wrapper and verify the mobile render. Show the imported competition in its summary, not the unimported search selection.
- Smooth scrollIntoView did not keep the selected matchday visible after a viewport change. Scroll only the matchday rail and observe its width. Verify the selected tab bounds after import and at every test width.

- Rank assignment used each array index after a score edit. This broke official shared ranks and showed false movement for tied withdrawn teams. Preserve shared official ranks while their ranking criteria remain equal. Keep a regression test for unrelated score edits.
- Vercel rejected the obsolete Node.js 20 pin before compilation. Match the root, webapp, lockfile, .nvmrc files, and setup guide to the supported runtime. Read deployment logs when a preview fails despite a passing local build.
- At 320px, preserve whole words in club names and move one secondary statistic to the full-table view. Keep original score captions under the score controls so edits do not reduce club-name space. Check both edited and unchanged rows.
