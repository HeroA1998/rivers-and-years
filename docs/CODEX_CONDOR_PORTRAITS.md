# Codex task: Original HD portraits for *The Legend of the Condor Heroes* / 《射鵰英雄傳》

> **DO NOT implement placeholder vectors or paint characters procedurally.** Deliver real, high-quality raster character illustrations created by a supported image-generation tool, or report clearly that such a tool is unavailable. Keep the game code and the historical story canon intact.

## 0. Repository, approved art direction, and scope

Repository: `HeroA1998/rivers-and-years`. This is a **noncommercial derivative fan game** about a player's original Jianghu protagonist witnessing Jin Yong's fictional historical events. The project uses vanilla HTML/CSS/JS, has persistent `localStorage` saves, and features the 1222–1236 *Condor Heroes* era. The user has already approved a **premium HD wuxia book-scroll mockup**.

**Your art-direction anchor is `assets/ui/approved-wuxia-atlas.svg`.** Its upper-left 80×80 portion is a crop of the approved female portrait; the remaining sprites are gilded illustrated item icons. Use this as a *style guide*, not a face reference for other characters. If the full approved mockup image is supplied in context, use it as the stronger style reference.

Style: polished semi-realistic Chinese historical-fantasy character painting; distinctive natural facial structure; fine dark hair; soft, complex painted skin; controlled gold ornaments; sophisticated jade-green, cinnabar-red, and parchment tones; Song/Jin-era grounded wuxia clothing. A subtle artistic finish similar in level of finish to high-end historical RPG portraiture, **not a replica of any proprietary game's visual assets or a named living artist**.

**Do not** imitate recognizable actors, television adaptations, film posters, existing game character art, copyrighted publicity photos, or a specific production's signature costumes. Interpret the characters freshly from their **novel personalities and roles**. Keep all content appropriate and nonsexual.

## 1. Characters to create (12 mandatory, first batch)

Produce a distinct adult character portrait for each, preserving the canonical character's role and personality. Suggested creative direction (not a claim of exact novel-specified clothing):

| File stem | Name | Portrait direction |
|---|---|---|
| `guo_jing` | 郭靖 | earnest, broad-featured, sturdy young adult warrior; restrained earth-toned robe; steadfast, kind eyes; subtle grasslands influence |
| `huang_rong` | 黃蓉 | exceptionally alert, intelligent young adult woman; quick lively eyes, elegant but practical jade/sage garments; clever, self-possessed expression |
| `yang_kang` | 楊康 | handsome young adult with refined Jin-court upbringing; fine layered robe and muted regal trim; charming but guarded eyes |
| `mu_nianci` | 穆念慈 | resolute, warm young adult martial woman; practical travel clothes in warm red/umber, hair securely tied; humble elegance |
| `hong_qigong` | 洪七公 | elderly roaming beggar-master; expressive weathered face, unpretentious patched robe; wise, humorous, formidable |
| `huang_yaoshi` | 黃藥師 | proud, brilliant middle-aged or older eccentric scholar; muted teal/green scholarly robe, elegant presence, cool discerning gaze |
| `ouyang_feng` | 歐陽鋒 | imposing older western-region martial master; white/sand garments, severe face, intimidating but restrained poise |
| `yideng` | 一燈大師／段智興 | elderly Buddhist monk, former royal bearing; simple ochre or muted saffron robes; compassionate, serene face |
| `zhou_botong` | 周伯通 | whimsical elderly Taoist, silver hair and beard, playful curious eyes; plain modest robes |
| `qiu_chuji` | 丘處機 | disciplined Quanzhen Taoist elder; dark simple robes and topknot, stern principled expression |
| `mei_chaofeng` | 梅超風 | mature imposing woman with a haunted, determined mien; dark travel garments; avoid monster/horror makeup |
| `ke_zhen_e` | 柯鎮惡 | elderly blind martial master with a firm austere face; practical well-worn clothing; eyes represented respectfully |

Optional second batch **after first-batch approval only**: `ouyang_ke` 歐陽克, `li_ping` 李萍, `bao_xiruo` 包惜弱, `wanyan_honglie` 完顏洪烈.

## 2. Production specification

**Master prompt to adapt per character:**

```text
Create one ORIGINAL, premium quality Chinese wuxia RPG character portrait.
Character: [NAME AND BRIEF].
Visual art direction: unified, semi-realistic hand-painted historical RPG portrait,
natural facial anatomy, subtle expressive eyes, fine controlled strands of dark or
age-appropriate hair, richly but selectively detailed textiles, refined outlines,
soft museum-quality illustration finish; restrained jade green, ochre, cinnabar
red and old-gold accents, matched to the approved Jianghu Suiyuelu atlas.
Period feel: Southern Song / Jin / Song-Jin frontier wuxia, no modern items.
Composition: eye-level, bust/shoulders-up, slightly three-quarter to camera,
consistent head size, head completely within safe margins, neck and both shoulders
visible; no weapon or accessories covering the face. Clear silhouette,
expressive but not exaggerated. Transparent background, natural shading
inside the character ONLY, no background scenery or letterforms.
This is a novel-inspired, ORIGINAL design, not an actor, TV adaptation
or an existing game's portrait.
Square 1024 x 1024 PNG source; center portrait, safe crop for
96x96, 128x128, 256x256 and 512x512 UI cards.
```

**Negative prompt:**

```text
pixel art, chibi, cartoon simplification, flat SVG, vector silhouette, mobile
avatar sticker, anime school uniform, plastic 3D face, glossy AI skin,
photoreal actor likeness, TV drama costume reproduction, copyright character
reference screenshot, low resolution, strange eyes, incorrect fingers,
mutated ears, overblown jewelry, bright neon armor, face obscured by hair,
face out of frame, cut head, text, logo, watermark, borders, image grid,
multiple subjects, scene background, inconsistent lighting, altered age.
```

- **One person per output.** Do not request a 4×4 grid of all twelve in a single generation (it will degrade face fidelity).
- Generate one anchor, approve visual consistency against the approved mockup, then do individual characters using the SAME model/settings/reference.
- Export 1024×1024 master PNG; 512×512 / 256×256 / 128×128 clean PNG or WebP derivatives from the approved master, not from screenshots.
- Preserve alpha/transparent background when possible; avoid halo edges. If transparent generation is unsupported, supply a uniform neutral backdrop and remove it cleanly with an appropriate editor before production.
- No background, name labels, border, HUD widgets, weapon frame, or text baked into a portrait.
- Every character must have unique facial anatomy and hair; do not simply change one master portrait's clothing or palette.
- Never stretch a portrait to a different aspect ratio. Use `object-fit:contain` for a full bust and `object-fit:cover;object-position:50% 20%` for portrait thumbnails as appropriate.
- Avoid using output with obvious artifacts. Retry failed images **individually**; retain only the successful versions.

## 3. Workflow and output files

1. **Inspect first:** read `js/ui.js`, `js/art.js`, `js/data.js`, `js/chronicle.js`, `js/events.js`, current `assets/ui/approved-wuxia-atlas.svg`, and relevant `CREDITS.md`. Determine how the 12 iconic characters are referenced (if they are currently referenced at all); do not assume that they are `NPCS` IDs.
2. Create a working branch `art/condor-character-portraits`, not a direct `main` commit.
3. Generate portraits, using an **actual image-generation capability**. If Codex has no appropriate image-generation API/tool, do not pretend to have drawn anything in code; provide exact image-generation prompts and a list of blocked outputs instead.
4. Save masters as `assets/portraits/condor/<stem>.png`. Place mobile-optimized approved exports as `assets/portraits/condor/mobile/<stem>.webp`.
5. Create `assets/portraits/condor/manifest.json` with `id`, `name_zh`, `src`, `master`, `role`, `credit`, `generation_method`, `license_status`, `approved`, and `era`. Don't label artwork as CC0 unless the asset's actual rights permit that.
6. Build a single `docs/CONDOR_PORTRAIT_CONTACT_SHEET.md` with linked thumbnails and a character-by-character checklist; do not generate a huge image sheet directly as a stand-in for master files.
7. **Wait for visual approval** before adding portraits to gameplay or merging to `main`. Do not introduce characters into the wrong historical years, add fictional encounters, or rewrite literary canon. Only after approved, map explicit event-character IDs via a registry and add graceful fallbacks.

## 4. Strict acceptance checks

- Twelve distinct **raster** portraits, 1024×1024, correct filename, safe crop, consistent palette, cohesive lighting and facial fidelity; no distorted anatomy or clone faces.
- Source images and derivatives tracked in the working branch; no hotlinking to AI services or fragile image-CDN preview URLs.
- Existing original game protagonist remains an original player character and is never confused with 郭靖, 黃蓉 or a named NPC.
- A production build must still work on narrow mobile screens (320, 390, 430px), with normal story choices, continuous story progression, equipment, battle and existing saves.
- Do not use commercial TV/game promotional character art, adaptation actor likeness or unlicensed extracted textures.
- These characters and the source work are associated with rights holders. **Fan-art generation does not itself grant commercial redistribution rights**; keep the fan project noncommercial and record rights considerations honestly.

## 5. Stop conditions

If any generation tool is missing, quality checks fail, or source-text characterization is uncertain, report the specific blocker and produce a reviewable prompt/asset checklist. Do not silently substitute low-fidelity SVGs or mark a portrait complete before its actual file exists.

**Deliver first batch for approval; no automatic merge.**
