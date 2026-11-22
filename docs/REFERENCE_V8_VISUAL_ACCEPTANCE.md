# v8 — Approved concept fidelity and acceptance record

**Status:** Working branch, not merged into `main`. Current branch improves responsive DOM layout but does **not** yet meet the artwork fidelity gate.

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
- Cache-busting version: `20261122-reference-layout-v8`.

## Artwork and visual evidence
The extracted high-resolution artwork derived from the approved **original screenshot** is available in the conversation's review package, but **not yet present in the GitHub repository**. Its source is 941px wide, not a new 1024px portrait master. The existing low-resolution `approved-wuxia-atlas.svg` remains a temporary fallback in this branch.

A separate static HTML/CSS mock with these local art crops was rendered in headless Chromium at:
- 320×700 — body stays within 700px; scrolling is confined to main content.
- 390×844 — body stays within 844px; navigation begins at y=743px.
- 430×932 — body stays within 932px; navigation begins at y=831px.

Those screenshots show the **art-directed static mock with the previous top title**, not the actual deployed game. New screenshots without the masthead are required. Do not treat them as a live game screenshot or as proof that binary assets were committed.

## Remaining must-pass gates before merge
- [ ] Commit all non-embedded, original screenshot-derived art crops under `assets/ui/v8/` (or higher-quality newly generated replacement masters), and point actual UI CSS to those local files.
- [ ] At least one original **high-resolution, transparent, approved** protagonist portrait per required gender; do not mislabel a low-resolution upscaled crop or checkerboard RGB file as a transparent master.
- [ ] Capture screenshots from **the actual game source code**, not only from the static approximation, using its real DOM at 320, 390, 430 and landscape.
- [ ] Compare actual game screenshot with approved concept: portrait framing, header background, vitality icons, six stat badges, story/choice proportions and footer illustrated icons.
- [ ] Walk through new game, continue from saved game, long story, dialogue choice, fight/die roll, equipment, settings, chapter transition and legacy.
- [ ] Obtain user approval of actual game screenshots before merging into `main`.

**Do not merge this branch merely because JavaScript parses, CSS braces match or the static mock looks good.**
