# Original approved mockup artwork atlas

**File:** `approved-wuxia-atlas.svg`, 216×116 SVG wrapper containing a 216×116 WebP sprite sheet.

- Portrait: first 80×80 pixels (top left), an **original AI-generated female wuxia protagonist image** approved as visual direction in the current conversation.
- Six illustrated icons: 36×36 cells on the bottom row, offset Y=80, columns X=0/36/72/108/144/180, derived from the same original AI-generated mockup.
- Image isn't extracted from a published TV adaptation or a third-party game.
- Keep it in the repository (no remote hotlinks) and preserve aspect ratios.
- This is **not** a released reusable character pack and is not to be represented as a CC0 asset or someone else's artwork.
- The sprite is optimized for mobile UI. Do not upscale the 80-pixel portrait to create a fake HD 1024-pixel master.
- Female player character may use this artwork; male player character must use a separately approved original male portrait. Never silently reuse a female portrait for male characters.
- Codex portrait-production spec: `docs/CODEX_CONDOR_PORTRAITS.md`. Create high-resolution masters using an actual image-generation capability rather than tracing this 80px crop into placeholders.

## Implementation

CSS sprite positions in `css/style.css`:
```css
.approved-portrait { width:80px; height:80px; background-position:0 0; }
.nav-art-0 { background-position:0 -80px; }
.nav-art-1 { background-position:-36px -80px; }
.nav-art-2 { background-position:-72px -80px; }
.nav-art-3 { background-position:-108px -80px; }
.nav-art-4 { background-position:-144px -80px; }
.nav-art-5 { background-position:-180px -80px; }
```

The atlas background size is 216×116 CSS pixels. Avoid `image-rendering: pixelated` and colored filters over the portrait. An external SVG wrapper with embedded WebP was smoke tested in headless Chromium for CSS background rendering; live GitHub Pages mobile tests remain necessary.
