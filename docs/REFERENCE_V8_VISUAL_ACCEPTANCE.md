# v8 — Approved concept fidelity and acceptance record

**Status:** Working draft branch, not merged into `main`. Original concept-derived images are now committed and live in the PR preview; detailed art fidelity and gameplay acceptance remain open.

## Design source
- **Single approved reference:** the 941×1672 mobile wuxia concept image accepted by the player on 2026-11-22.
- Measured reference groups: portrait + two vitality rows + six attributes, decorative gold rule, story prose/choices, illustrated six-button footer. **The player's latest instruction supersedes the approved reference's top title banner: no gameplay masthead.**
- Active game UI remains live HTML: names, attributes, HP, qi, XP, story text and choices are **never baked into a screenshot**.

## Implemented on this branch
- Removed the extra top 「江湖歲月錄」 masthead entirely, including its CSS and optional artwork integration. The title screen remains unchanged. The portrait HUD now starts at the top safe area and the story receives the reclaimed vertical space.
- Separate central story scrolling from top HUD and six-choice navigation. On a long event, status and navigation remain visible while the story is scrollable.
- Referenced typography hierarchy, 〈chapter〉 title, small folio number and restrained choice markers.
- Explicit 320–375px small-screen rules, 390/430px mobile styling and landscape under 500px height.
- Style consistency for the character and inventory tabs; existing dialogue, battle and save flow retained.
- No gameplay files edited. Existing `SAVE_KEY=jianghu_jinyong_v1` retained.
- Cache-busting version: `20261122-reference-layout-v8-assets`. Uses `css/v8-reference-art.css` linked after the base stylesheet.

## Artwork and real-browser evidence
- **13 original WebP art assets now committed** at `assets/ui/v8/`: female protagonist portrait (166×166), six ability icons (50×50), red/green flower icons, 780px-wide mountain/ornament/footer crops and unused header image. Total binary payload 119,786 bytes. These are faithful crops from the approved concept, not independent 1024px masters. No fal service was used.
- The game page now loads `css/v8-reference-art.css` which binds those actual assets to the dynamic HTML elements. The title banner remains removed as requested.
- Real game GitHub Actions / Playwright **320×700, 390×844, 430×932** tests succeeded for: title screen, new character, world HUD, original event, injected long event, independent story scroll, choice transcript, result, "Continue" to following event, all nav shortcuts and settings panel.
- The first successful action run is [Wuxia UI visual smoke test #44993505274](https://github.com/HeroA1998/rivers-and-years/actions/runs/44993505274). It uploaded nine screenshots and JSON validation report.
- Real-game render at 390×844: character HUD y=0–138, scrollable content y=138–743, footer y=743–844; no horizontal overflow, no masthead.
- Static mockups remain **illustrative only**. The actual-game screenshots are the relevant visual acceptance basis.
- Visual review still finds excess whitespace between story headline and first paragraph and a portrait originally cropped to 166px. Further typography/spacing refinement is in progress.

## Remaining must-pass gates before merge
- [x] Commit 13 source-derived WebP assets under `assets/ui/v8/`, and activate the linked artwork stylesheet.
- [ ] At least one original **high-resolution, transparent, approved** protagonist portrait per required gender; do not mislabel a low-resolution upscaled crop or checkerboard RGB file as a transparent master.
- [x] Capture 320px, 390px and 430px portrait screenshots from **the actual game**; [ ] add landscape coverage.
- [ ] Compare actual game screenshot with approved concept: portrait framing, header background, vitality icons, six stat badges, story/choice proportions and footer illustrated icons.
- [x] Automated new game, long story, dialogue choice, appended result, continuation, and six bottom navigation actions. [ ] Add explicit save/reload, battle/die-roll, equipment, chapter transition and legacy checks.
- [ ] Obtain user approval of actual game screenshots before merging into `main`.

**Do not merge this branch merely because JavaScript parses, CSS braces match or the static mock looks good.**
