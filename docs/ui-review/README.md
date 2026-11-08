# UI Polish Overhall

The calculator keeps its red football identity. The page now uses more space, quieter borders, readable club names, and a smaller header after import. Competition controls close after import. Phones use direct score entry to give club names room. Edited results show a reset button. Bye rows use plain text.

## Checks

- 31 tests pass, including the regression test for official shared ranks after an unrelated score edit.
- Lint and production build pass.
- Live fussball.de URL import returned 200. The screenshot check then reused that exact response for stable match data.
- Score edits and full reset work. The active matchday stays visible at 320, 390, 768, 1024, and 1440px. No page overflow or browser errors were found.
- Single-result reset works with one click or tap. The 320×667 filter dialog fits and permits scrolling. The full table exposes hidden phone columns.
- Captures use normal viewports. Full-page capture changed the rail position in Chrome; a separate diagnostic confirmed that ordinary score editing preserved its position.
- Native preview tools timed out. Captures use Playwright with installed Chrome. The development toolbar is omitted from captures.
- Screenshots use real imported football data. Third-party crests can change.

## Council review

Target: every named member must give the same screenshot set at least 9/10. Review is in progress.

| Delegate | Round 1 | Round 2 | Round 3 | Round 4 |
| --- | --- | --- | --- | --- |
| Claude Opus 5.5 | 7/10 | 8/10 | no score | pending |
| GPT Sol | 8/10 | 8.5/10 | 9/10 | pending |
| Muse 1.3 Contributor | 7/10 | no score: server unavailable | no score | pending |
| DeepSeek Free | 7.5/10 | no score: server unavailable | no score | pending |

Round 1 found an off-screen active matchday, repeated mobile controls, small secondary text, excessive header space, weak reset feedback, and a false rank arrow for a tied withdrawn team. These have fixes and new captures. Direct mobile entry is deliberate: 16px text and 24px-wide fields preserve space for full club names. The mobile result link goes directly to the score fields while preserving the full table above them. Official shared ranks are retained, so the withdrawn teams legitimately share rank 15 without false movement. The review does not require a full rewrite of the existing large page files.

## Screenshots

- [Desktop before import](round4/desktop-empty.png)
- [Desktop loaded](round4/desktop-loaded.png)
- [Desktop edited](round4/desktop-edited.png)
- [Mobile before import](round4/mobile-empty.png)
- [Mobile loaded](round4/mobile-loaded.png)
- [Mobile matches](round4/mobile-matches.png)
- [Mobile edited](round4/mobile-edited.png)
- [Mobile filters](round4/mobile-filter.png)

- [Mobile at 320px](round4/mobile-320.png)
- [Short phone filter dialog](round4/mobile-filter-short.png)
- [Full table on a phone](round4/mobile-full-table.png)

## Preview runtime

Vercel rejected Node.js 20 before compilation. Runtime pins now use Node.js 26, which also ran the local checks. Dependency versions did not change.

## Next review set

Round 2 Sol: 8.5/10. Its remaining findings were poor word breaks at 320px and less name space after desktop edits. The new set keeps whole words, moves goal difference to the full table below 360px, and puts original-score captions under the controls. Browser checks, lint, and build pass after these changes. Opus round 2 scored 8/10. OpenCode is unreachable, so Muse and DeepSeek gave no second-round score. Sol gave round 3 a score of 9/10. Round 4 adds the remaining Opus fixes: points visible on opening the full table, a quieter disabled reset, and footer/legend captures. All four members still need to approve the same final set.

The Node.js 26 preview deployment passed on commit be2e97e.

- [Desktop table footer and legend](round4/desktop-table-bottom.png)
- [Mobile table footer and legend](round4/mobile-table-bottom.png)
