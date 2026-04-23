# Todo

- [x] Align landing-page base colors with webapp palette tokens while preserving the green field identity.
- [x] Keep no-scroll responsive behavior unchanged after palette remap.
- [x] Verify the color-adjusted landing page with build.

- [x] Remove technical/internal handoff details from the GitHub Pages landing copy.
- [x] Make the landing page strictly single-screen with no page scrolling.
- [x] Harden responsive behavior for narrow and short viewports and verify with build.

- [x] Rebuild the GitHub Pages handoff page from scratch with a new visual concept.
- [x] Add purposeful animations and motion-safe fallbacks for the new page.
- [x] Verify the redesigned static page and document the lesson from this revision request.

- [x] Add a regression test for 0-point teams with played matches ranking above withdrawn 0-game teams.
- [x] Update the live table sorting tie-breaker for equal-point teams with zero played matches.
- [x] Verify the table logic with focused tests and lint/build.

- [x] Add a design context file for the static landing page and align the handoff page with it.
- [x] Redesign the GitHub Pages handoff page with the new editorial sports visual direction.
- [x] Verify the updated static page renders cleanly.

- [x] Refresh the root README so it matches the current Vercel deployment and `webapp` workspace layout.
- [x] Verify the updated README against the current repo structure and scripts.

- [x] Set match team names to font-weight 500.
- [x] Verify the targeted CSS correction.

- [x] Set the matchday heading weight to 500 across mobile and desktop.
- [x] Verify the small CSS correction.

- [x] Align matchday navigation typography with the table/body font.
- [x] Verify the matchday font correction with lint/build.

- [x] Restore stronger match-row typography across desktop and mobile.
- [x] Remove the search import action container and keep only the import button.
- [x] Verify the UI correction with lint/build.

- [x] Add short-lived server-side cache for fussball.de HTML and WAM JSON fetches.
- [x] Deduplicate concurrent upstream fetches and keep retry/timeout behavior intact.
- [x] Verify cache behavior with focused tests plus lint/build.

- [x] Add desktop match-row team crests and tighten the score inputs on wider screens.
- [x] Add or update importer and UI tests for match-row logo rendering.
- [x] Verify the slice with focused tests and a production build.

- [x] Add green, orange, and red odd/even table zone row variants.

- [x] Add fussball.de playoff table zones and render them orange.

- [x] Add fussball.de table zone import for promotion/relegation rows.
- [x] Render imported promotion/relegation zones in the recalculated live table.
- [x] Verify parser/table behavior with fixture tests plus lint/build.

- [x] Restyle matchday tabs so the Spieltag number is visually primary and match count is secondary.
- [x] Polish previous/next matchday buttons and score controls.
- [x] Verify lint/build after the UI styling pass.

- [x] Diagnose current broken code state with lint/tests/build and inspect changed files.
- [x] Fix the smallest set of compile/runtime/test failures without discarding unrelated work.
- [x] Re-run verification and record any repair lesson before marking this slice done.

- [x] Add repository metadata, MIT license, and root `.gitignore`.
- [x] Define the project scope for a standalone `fussball.de` Tabellenrechner and align repo instructions.
- [x] Set up the `webapp` Next.js workspace and install parser/test dependencies.
- [x] Implement WAM-based competition search and URL import endpoints.
- [x] Implement legacy HTML parsing, obfuscation-font decoding, and competition normalization.
- [x] Build the Tabellenrechner UI with editable results and live table recalculation.
- [x] Add root-level npm scripts so the app can be started from the repository root on port 3001.
- [x] Verify with lint, tests, and production build.
- [x] Add a root README with setup, architecture, and usage notes.
- [x] Make Spieltage horizontally selectable with click-through navigation instead of stacking all matchdays vertically.
- [x] Split the current repository state into a sensible initial commit history.
- [x] Complete mobile optimizations (compact tabs, hidden columns, stacked match list) for a responsive kicker-like view.
- [x] Show the current spieltag first in the matchday navigation instead of always starting with matchday 1.
- [x] Harden the WAM search bootstrap against transient upstream failures and empty filter branches.
- [x] Replace `ae`/`oe`/`ue` placeholders with real umlauts in German UI copy and error messages.
- [x] Replace duplicate Spieltag header labels with derived date summaries that handle multiple match dates.
- [x] Make the mobile URL import less prominent by moving it behind a button dialog.
- [x] Rework the compact competition info bar to avoid redundant region labels and improve readability.
- [x] Keep Spieltag 1 on the right, auto-scroll the rail to the current Spieltag, and restore desktop scrolling in the selector.
- [x] Keep the desktop league search fully editable and collapse only the optional URL import into a quick-open summary.
- [x] Show team logos from the imported original table in the Tabellenansicht.
- [x] Add a small release footer with GitHub repo and issue-report links.
- [x] Convert the footer links into SVG icon buttons.
- [x] Add a grab-and-drag mouse interaction to the Spieltage rail.
- [x] Stop page scrolling from chaining while wheel or touch gestures are used on the Spieltage rail.
- [x] Audit remaining German UI and error texts for broken or placeholder umlauts.
- [x] Remove duplicate matchday dates by moving multi-date labels into inline date split rows.
- [x] Reorganize the repository layout so sample `fussball.de` fixtures live in a dedicated folder tree instead of the repo root.
- [x] Harden URL imports, table baseline integrity, font-cache recovery, and score-input accessibility.
- [x] Add a GitHub Pages landing page and document that the live Next.js importer needs a server-capable host.
- [x] Prepare the repo for Vercel deployment with explicit `webapp` root-directory guidance and pinned Node major version.
- [x] Add Vercel Analytics to the deployed Next.js app layout.
- [x] Add SEO basics for Google discovery: canonical metadata, robots, sitemap, and a crawlable landing headline.
- [x] Add env-backed site URL and Google Search Console verification support for Vercel deployments.
- [x] Add a direct `fussball.de` link for the currently selected competition in the compact info bar.
- [x] Refresh the README and structure notes now that production runs on Vercel instead of the old GitHub Pages placeholder.
- [x] Polish mobile table headers, compact filter dropdown labels, and table reset emphasis.
- [x] Replace the app favicon with the leaderboard-star SVG via the Next.js `app/icon.svg` convention.
- [x] Simplify the mobile table card header by removing the redundant original-link action and unsticking the reset control.
- [x] Keep imported match IDs unique even when fussball.de emits repeated `spielfrei` rows without detail links.
- [x] Center the mobile Direktimport dialog reliably within the viewport.
- [x] Reduce the mobile competition info density and make the `fussball.de` source clearly tappable.
- [x] Flatten the competition source link styling and remove the redundant `Wettbewerb` label.
- [x] Polish the Tabellenrechner UI (redundancy cleanup, user-friendly copy).
- [x] Add a clickable club focus so selecting a team in the table shows all of that club's matches with editable results.
- [x] Remove the outer page padding from the Tabellenrechner page module.
- [x] Align the repository-level Node version with the webapp and Vercel deployment target.
- [x] Tighten the mobile spacing rhythm so section cards, match rows, and headers feel denser on small screens.
- [x] Refine the mobile Tabellenrechner UX with a collapsed filter sheet, tighter spacing, clearer matchday navigation, and a leaner table.
- [x] Move the mobile URL import into the same filter sheet as the competition selection.
- [x] Keep the mobile pre-import flow direct and collapse filters only after a competition is loaded.
- [x] Replace the always-open mobile pre-import URL block with a compact expandable direct-import card.
- [x] Tighten the remaining mobile spacing between intro, competition picker, info modules, and matchday sections.
- [x] Prevent duplicated rescheduled matches from being counted twice in the live table when fussball.de lists the same fixture in multiple matchdays.
- [x] Suppress hydration mismatches on the root body when browser extensions inject client-only attributes.
- [x] Review frontend/backend against the Kicker Tabellenrechner reference and capture addable feature gaps.
- [x] Add Kicker-style score steppers and improve pending/unchanged edit handling so one-sided edits do not create surprising table jumps.
- [x] Add a mobile live-table preview with a fullscreen table view while keeping the desktop split layout.
- [x] Restore the full mobile table above the match list and keep a compact table-focus rail for quick club jumps.
- [x] Prioritize club names on mobile by removing score steppers there and dropping the outer shell gutters.
- [x] Box the editable result area and place the home plus button on the left edge and the guest plus button on the right edge.
- [ ] Add table and matchlist affordances for truncated content, trend explanation, and withdrawn-team hints.
- [ ] Add scenario export/share affordances, including CSV export and URL-shareable edited predictions.
- [ ] Add dark mode with the existing red editorial identity preserved.
- [x] Harden competition import fetches with timeout/retry behavior and clearer parser failures.
- [ ] Add optional short-lived server-side caching for imported competition pages and obfuscation fonts.
- [x] Remove unused Next.js starter SVG assets from `webapp/public`.
- [x] Simplify the desktop shell and widen the workspace so match rows have more room for team names.
- [x] Refine the desktop filter, table, and fixtures hierarchy with clearer spacing, zone bands, and larger score controls.
- [x] Add a separate mobile stacked-view route with all matchdays visible and a side live-table rail.
- [x] Refine the stacked mobile route with a persistent right-side table rail and denser score inputs.
- [x] Replace the split mobile table rail with a shared sticky live-table dock and wider touch controls across both mobile layouts.
- [x] Try the simple compact mobile match-row variant with smaller score controls and team text.
