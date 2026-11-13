# UI Polish Overhall

The calculator keeps its red football identity with a smaller loaded header, quieter surfaces, readable club names, and one competition action. Scores use direct numeric entry on every screen size. Edited results have a visible reset action and original-score caption. Bye rows use plain text. The full-table dialog keeps rank and club names visible while it scrolls.

## Council review

Target met in round 5: Claude Opus, GPT Sol, Muse, and DeepSeek each gave the same 14-image set 9/10, with no design blockers. The reviewed UI and images are from commit 2c9e7dd. Later changes only record the results. Earlier ratings apply only to their original screenshot sets.

| Delegate | Round 1 | Round 2 | Round 3 | Round 4 | Round 5 |
| --- | --- | --- | --- | --- | --- |
| Claude Opus 5.5 | 7/10 | 8/10 | no score | 9/10 | 9/10 |
| GPT Sol | 8/10 | 8.5/10 | 9/10 | 9/10 | 9/10 |
| Muse 1.3 Contributor | 7/10 | no score: server unavailable | no score | 9/10 | 9/10 |
| DeepSeek Free | 7.5/10 | no score: server unavailable | no score | 8.5/10 | 9/10 |

Round 5 fixes DeepSeek's remaining findings: sticky rank/club columns, 44x44px reset targets, one direct-entry control model, and ellipses for long filter values. The full selected label is available in the field title. The mobile result link preserves quick access while keeping the full table above the matches. Official shared ranks remain stable after unrelated edits.

## Checks

- All 31 tests, lint, and production build pass on Node.js 26.
- A live fussball.de import returned 200. Later captures reuse that exact response for stable match data.
- Browser checks pass for score edits, full and single reset, active tab visibility at 320/390/768/1024/1440px, and no root overflow or page errors.
- Reset targets measure 44x44px. Full-table points appear in the first 320px viewport. Rank and club bounds stay fixed after horizontal scrolling.
- The filter dialog fits a 320x667 viewport and can scroll at shorter heights.
- Vercel rejected the old Node.js 20 pin before compilation. Aligned Node.js 26 pins restored preview builds without package version changes.
- Native preview tools timed out. Captures use Playwright and installed Chrome, omit the development toolbar, and move the pointer away from rows. Normal viewport captures avoid a Chrome full-page capture scroll side effect.

## Current screenshots

- [desktop-empty](round5/desktop-empty.png)
- [desktop-loaded](round5/desktop-loaded.png)
- [desktop-edited](round5/desktop-edited.png)
- [desktop-table-bottom](round5/desktop-table-bottom.png)
- [mobile-empty](round5/mobile-empty.png)
- [mobile-loaded](round5/mobile-loaded.png)
- [mobile-matches](round5/mobile-matches.png)
- [mobile-edited](round5/mobile-edited.png)
- [mobile-filter](round5/mobile-filter.png)
- [mobile-320](round5/mobile-320.png)
- [mobile-filter-short](round5/mobile-filter-short.png)
- [mobile-full-table](round5/mobile-full-table.png)
- [mobile-full-table-scrolled](round5/mobile-full-table-scrolled.png)
- [mobile-table-bottom](round5/mobile-table-bottom.png)

Older images remain available for the earlier review records.
