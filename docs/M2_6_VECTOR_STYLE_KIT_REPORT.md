# M2.6 — Vector style system and shape kit

**Status:** implemented, rendered and technically verified. **Human visual review pending.**
**Branch:** `claude/m2-6-vector-style-kit` (based on M2.5 `6937d67`). **Paid requests:** 0.

## Goal

Turn the M2.5 vector direction into something reusable: one file defines the channel's look, and new topics are composed from parametric building blocks instead of hand-drawn files. The volcano is rebuilt from the kit as the reference, and a second topic (the water cycle) is built from the same kit with no engine changes.

Style chosen: bold flat infographic with three-tone shading, rim lighting, outlines and a light printed grain.

## What was built

### 1. Style system (`src/engine/style/`)
- `theme.ts`: Zod theme schema, a registry, and `@role.path` colour references (e.g. `"@hot.core"`, `"@ridges.2"`). `parseStoryboard` resolves them to hex before validation, so every renderer still sees plain colours and older storyboards are unaffected. Unknown roles fail validation.
- Two themes: `explainer-dusk` (volcano) and `explainer-day` (water cycle). Each sets palette roles, outline weight and colour, light direction, grain, label font/radius and the caption style.
- `render-cached-story` and `preview-stills` take caption style from the storyboard's theme when no `--caption-style` is passed.
- `contrastRatio()` (WCAG 2.x) for automated legibility checks.

### 2. Vector shape kit (`src/engine/kit/`)
A layer can now declare `kit: {...}` instead of an image asset. All elements are seeded, deterministic, themed, and work with existing layer tracks, masks, reveals and effects.

| Element | Use |
| --- | --- |
| `sky` | Gradient sky with optional seeded stars |
| `sun` | Sun with soft glow |
| `ridges` | 1–4 seeded mountain-ridge layers with atmospheric colour ramp and parallax drift |
| `ground` | Ground plane with patches and seeded rocks |
| `mountain` | Parametric cone (crater or peak, concavity, gullies, snow cap, ground shadow), three-tone shading, rim light, outline; parts `full`, `left`, `right` (split-open reveals) and `rim-front` (occlusion lip) |
| `strata` | Cross-section block (optionally following a mountain silhouette) with wavy layers, underground bands, pebbles, cavities and channels |
| `blob` | Irregular seeded body with hot/water/rock/cloud fill (chambers, cells, lakes) |
| `cloud` | Flat cartoon cloud with drift and wrap-around |
| `water` | Water body with animated wave lines and foam edge |
| `glow` | Radial glow (hot, sun, sky tones) |

Also:
- **Group backdrops:** `backdrop: {group: "<id>"}` renders a full-frame layered group on the global clock (animated sky, drifting clouds, parallax ridges).
- **Pill labels:** annotation `variant: "pill"` gives themed rounded labels with dot-anchored leader lines. The default `plain` look is unchanged.
- **Arrowheads** on `stroke-reveal` (`arrowHead`), for process diagrams.
- **Film grain:** a static seeded overlay from the theme.
- Storyboards may now have zero image assets.

### 3. Volcano rebuilt from the kit (`storyboards/volcano-kit.json`)
Same five scenes, narration cues, templates, timing and camera handoffs. No image assets and no raw hex colours. New: animated backdrop (sky, sun, drifting clouds, parallax ridges, ground), a **split-open cutaway** (the cone's halves slide apart to reveal the cross-section, replacing the crossfade), pill labels, and grain.

### 4. Reuse proof (`storyboards/water-cycle-demo.json`)
A five-second water-cycle diagram in the day theme: sea, snow-capped mountain, clouds, evaporation arrows, rain, runoff river and four pill labels. **No new engine code was written for it**; it uses five of the same kit element types as the volcano plus the M2.5 effects.

### 5. Automated style checks (`src/tests/style-kit.test.ts`)
- Both themes pass WCAG AA (≥ 4.5:1) for labels, captions and text.
- Kit storyboards contain no raw hex colours (palette lint) and no raster assets.
- Every label is at least 12 px tall on a 360 px-wide phone.
- Kit source contains no topic names or unseeded randomness.
- Geometry determinism, schema rejections and kit-volcano contracts (scene ids, cues, schedule, camera handoffs).

Generator: `scripts/authoring/build-kit-storyboards.py`.

## Results

| Measure | M2.5 C | M2.6 kit |
| --- | ---: | ---: |
| Render + encode, 450 frames (Linux VM, 3 × 150 segments) | 70.6 s | 85.3 s (+21%) |
| Output size | 4.1 MB | 5.5 MB |
| Image asset files | 6 SVG | **0** |
| Raw colours in storyboard | many hex | **0** (theme refs only) |
| Second topic possible without new art files | no | **yes** |

Water-cycle clip: 150 frames rendered in 26.4 s. Extra render cost comes mainly from the animated backdrop and grain overlay.

Comparison material (local, git-ignored): `jobs/m2-6-comparison/c-vs-kit-phone-size.mp4` (side by side with narration), `jobs/m2-6-comparison/c-vs-kit-grid.png`, `jobs/m2-6-comparison/water-cycle-frame-120.png`. Full videos: `jobs/m2-6-kit/output/narrated-animation.mp4`, `jobs/m2-6-water-cycle/output/animation.mp4`.

## Honest assessment

- **Pipeline value: high.** The look now lives in one theme file, scenes are data, and a new diagram topic took one storyboard and no engine work. This is the shape an AI storyboard writer can target.
- **Visual improvement over M2.5 C: moderate, not dramatic.** Gains are the split-open cutaway, pill labels, sky depth and texture. The art is clean and consistent but still reads as competent programmer art: simple shapes, little texture variation, no characters.
- **This is roughly the ceiling of code-drawn art.** Further gains will come from better source shapes (an illustrator-made or purchased vector kit mapped onto these kit slots), stronger motion design (anticipation, overshoot, secondary motion) and sound, not from more geometry code.

## Verification

- TypeScript pass. Vitest **323 passed / 20 files** (305 existing + 18 new). Both production entry points bundle.
- **Regression:** 33 lossless frames from the M2.5 tree and this branch, in the same environment, are **byte-identical** (generic-demo, volcano, volcano-narrated, motion prototype, style B, style C × 5 frames; planet × 3). One mismatch found during the check (round line caps leaking into legacy plain labels) was fixed before the final run.
- Kit volcano encoded verification: H.264/AAC, 1080 × 1920, 30 FPS, 450 frames, 15.000 s, no unintended black frames, approved narration preserved (PCM correlation 0.99992), 28 words in 5 cues, boundaries 0/66/150/243/318/450. Water-cycle clip: storyboard verifier passes.
- Approved narration, script, provider timing and painted assets untouched. Zero paid requests.

## Environment notes
Same as M2.5: Linux arm64 VM with external headless Chromium and FFmpeg 8.1; Arial substituted by metric-compatible Liberation Sans. Re-render on macOS for final review (commands in README).

## Known limitations
- Code-drawn art ceiling (see assessment). No characters yet.
- The comparison template is still used as a layering slot (left = interior, right = splitting halves).
- Kit elements use fractional coordinates of the group canvas; the mountain and strata must share the same shape parameters to stay registered (authoring helper does this).
- Theme switching is per storyboard; no per-scene theme.
- Grain is static (no film flicker), by design for encode size.
