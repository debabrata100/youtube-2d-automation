# M2.5 — Style and staging spike

**Status:** implemented, rendered and technically verified. **Human visual decision pending.**
**Branch:** `claude/m2-5-style-staging-spike` (based on M2.4.1 `d9c6f7a`). **Paid requests:** 0.

## Question

M2.4.1 review showed that the eruption payoff was barely visible on a phone. M2.4.2 proposed polishing flattened painted layers further. M2.5 replaced it with a cheaper question: **is the bottleneck the engine, the staging, or the art style?** The same 15-second narrated video was rendered three ways with identical narration, captions timing and scene boundaries:

| Variant | Art | What changed |
| --- | --- | --- |
| **A** baseline | Approved painted assets | Nothing (M2.4.1 prototype storyboard) |
| **B** painted, re-staged | Approved painted assets, untouched | Eruption only: procedural smoke column + dark burst masked behind the crater rim, larger glowing ejecta, punch-in camera with impact wobble, pull-back reveal; outline captions |
| **C** flat vector | Six new hand-authored SVGs | All five scenes: vector backdrop, cone, cutaway, chamber; magma rise and lava as animated strokes; gas bubbles on the conduit path; same smoke/ejecta primitives; outline captions |

## Results

| Measure | A | B | C |
| --- | ---: | ---: | ---: |
| Plume height at peak (fraction of 1920 px frame) | ≈0.10 (measured on frame 285) | **0.31** | **0.27** |
| Plume height at payoff caption (frame ≈288) | ≈0.10 | 0.28 | 0.23 |
| Render + encode, 450 frames (Linux VM, 3 × 150-frame segments) | 82.7 s | 100.6 s (+22%) | **70.6 s (−15%)** |
| Output size (CRF 18) | 13.9 MB | 15.3 MB | **4.1 MB** |
| Topic-specific fitting scripts/masks needed | many | same as A | **none** |

B/C plume heights are analytic estimates from the puff configuration, group placement and camera pose (puffs ≥ 30 % opacity, 1.3 × radius for lobes); A was measured visually. Acceptance target (≥ 0.25 at peak) is met by B and C. Render times come from this Linux arm64 VM and are only comparable with each other, not with the macOS figures in earlier reports (M2.4.1: 44.15 s).

Comparison material (local, git-ignored): `jobs/m2-5-comparison/eruption-abc-phone-size.mp4` (A | B | C side by side at 360 × 640, 7 s, with narration) and `jobs/m2-5-comparison/comparison-grid.png` (frames 230 / 262 / 285 / 330 / 420). Full videos: `jobs/m2-5-{a,b,c}/output/narrated-animation.mp4`.

## Assessment (reviewer: Claude; your playback decision is what counts)

- **Staging was the larger problem than the engine.** B uses the same painted art as A and reads far better at phone size purely through scale, camera and a dedicated smoke primitive.
- **B exposes a style clash.** Procedural cel-shaded smoke over painterly raster art looks pasted on. Making it match would need painterly smoke textures (paid generation and fitting work per topic), which is what M2.4.2 would have spent its time on.
- **C is the most coherent and the most automatable.** Every element shares one canvas, so registration is exact by construction; magma, lava, smoke and labels are data, not pixels; it renders fastest and encodes smallest. Its weakness is art quality: the hand-written SVGs are clean but plain, and a generic look risks reading as template content.
- **Recommendation:** adopt the vector direction (C) as the production style, and invest next in art direction and reusable vector assets, rather than further painted-layer work. Keep the painted pipeline as legacy.

## Reusable capabilities added

All JSON-driven, Zod-validated, deterministic (analytic functions of frame, seeded), and free of topic names (tested).

- **`puffs` effect** (`src/engine/motion/primitives/puffs.ts`): seeded billowing cloud column. Per-puff travel, deceleration, growth, wind drift and lumpy multi-lobe silhouettes; cel-style shadow/body/highlight rendering with adjustable edge softness (0 = flat cartoon, higher = painterly). Budget: 48 per effect, 96 per group. Uses: smoke, steam, clouds, dust, explosions, breath.
- **`stroke-reveal` effect** (`stroke.ts`): progressive stroke along a normalized path with optional glow, travelling highlight dashes confined to the revealed portion, and a hot head. Uses: lava, rivers, blood flow, arrows, wiring, routes, diagrams.
- **Effects-only layers:** a layer may omit `asset` when it declares effects; source-image features (clipToSource, textureDrift, flow) are rejected on such layers.
- **Caption style variants:** `variant: box | outline`, `textColor`, `outlineColor`; `--caption-style <json>` on `story:render-cached`; preset `config/caption-styles/outline.json`. Default remains the legacy box.
- **Authoring and rendering tools:** `scripts/preview-stills.ts` (schedule + render selected stills in seconds); chunked/resumable rendering (`render-cached-story --prepare-only`, `scripts/render-job-frames.ts`, `scripts/assemble-job.ts`); `REMOTION_BROWSER_EXECUTABLE` override; `CONTACT_SHEET_MODE=ffmpeg` browser-free contact sheets in `verify-storyboard.ts`.

Story-specific work: the two storyboards, the generator `scripts/authoring/build-style-spike-storyboards.py`, and the vector volcano SVG set (`assets/illustrations/vector-volcano-v1/`).

## Verification

- TypeScript: pass. Vitest: **305 passed / 19 files** (280 existing + 25 new: 13 primitive/caption tests, 12 storyboard-contract tests). Both production entry points bundle.
- **Regression:** 23 lossless frames rendered from the original M2.4.1 tree and from this branch in the same environment are **byte-identical** (generic-demo, volcano, volcano-narrated, volcano-motion-prototype × 5 frames; LegacyStoryboard planet × 3).
- Encoded verification for A, B and C (`verify-storyboard`, `verify-cached-story`): H.264/AAC, 1080 × 1920, 30 FPS, 450 frames, 15.000 s, no unintended black frames, chronological timeline, approved narration preserved (PCM correlation 0.99992, 37.8 dB), all 28 words captioned in 5 cues, scene boundaries 0/66/150/243/318/450.
- Storyboard contracts: scene ids/templates/narration cues and the narration-driven schedule unchanged; camera poses match at every handoff; B leaves the approved asset registry and existing layers untouched; C uses only local SVGs over an opaque backdrop, with no scripts or remote references.
- Approved narration, script, provider timing and painted artwork were not modified. Zero paid API, synthesis, alignment, sound-effect or image-generation requests.

## Environment notes

Verification ran in a Linux arm64 VM, because the repository's `node_modules` are macOS builds. Remotion's own browser download is blocked there, so a headless Chromium build (Sparticuz v153 arm64, GitHub release) and an FFmpeg 8.1 build (BtbN) were used outside the repository. Arial is substituted by metric-compatible Liberation Sans, so text glyphs differ slightly from macOS renders. **Re-render on your Mac for final visual review:** `npm run story:render-cached -- --storyboard storyboards/volcano-style-c.json --caption-style config/caption-styles/outline.json ...` (see README).

## Known limitations

- Smoke is stylized; no fluid simulation and no turbulence inside a puff. Highlights are fixed up-left.
- Plume top and captions share the upper frame in C's closing shot; legible with outline captions but a layout rule (subject-aware caption placement) would be better.
- The vector art is hand-written placeholder quality, not illustrator quality, and has no texture or line variation.
- Plume measurement for B/C is analytic, not image-based.
- Camera wobble is keyframed rotation only (no positional shake).
- Encoded MP4 byte identity across machines is still not guaranteed.
