# M2.2 volcano integration — ready for human review

2026-11-14. Baseline commit: `a1e84941967e5bd7ef875d91e2cb68fa540afe6c`. Status: rendered and technically verified, **human visual approval pending**. M2.2 is not closed. No commit, push, tag or M2.3 work was performed.

## Output and review artifacts

Local job: `jobs/volcano-m2-2-2026-11-14T13-56-49-609Z/` (Git-ignored).

- `output/animation.mp4`: H.264/yuv420p, 1080×1920, 30 FPS, exactly 450 frames, 15.000 seconds.
- `storyboard.json`: normalized production snapshot of `storyboards/volcano.json`.
- `previews/composition/scene-1.png` through `scene-5.png`: full-size static proofs, with full material poses for geometric inspection. `static-storyboard.json` records those deliberate proof overrides.
- Detail proofs: `crater-detail.png`, `chamber-detail.png`, `conduit-detail.png`, `chamber-conduit-junction.png`, `lava-ground-detail.png`.
- `previews/magma-motion.mp4` and `previews/eruption-motion.mp4`: 3-second, 540×960, 30 FPS previews rendered before the final MP4. Their decoded five-frame sheets are adjacent.
- `chronological-contact-sheet.png`: numbered encoded samples at every whole second, 0–14.
- `transition-contact-sheet.png`: encoded frames before, at and after every boundary, including overlap completion.
- `motion-audit-contact-sheet.png`: denser encoded samples through the third and fourth scenes.
- `verification-report.json`, `render-report.json`, `compatibility-report.json`, `composition-review.json`, `visual-review-report.md`.

The scene schedule is 0–89 exterior, 90–179 interior, 180–269 ascent, 270–359 eruption and 360–449 summary. Eight-frame overlaps retain outgoing content while incoming content appears; the exact boundary frame intentionally still shows outgoing content. Sheet labels indicate the incoming scheduled scene, not image-recognition results. The new video has no intentional background-only gap. The original generic demo retains its approved two-frame backdrop dip.

## Architecture and authoring

All five scenes use the existing template registry: hero-reveal, comparison, transformation, orbital-environment and summary. Comparison overlays aligned surface/interior groups rather than forcing an unrelated side-by-side diagram. Transformation uses layer reveals with whole-object scales fixed at 1. The environment template's optional rising particle mode depicts restrained ash; the original orbital behavior remains the default. No volcano-specific React component or engine branch was added.

One new reusable component, `LayeredSubject` (with internal `Layer`), consumes registered groups. Topic identity, assets, camera targets, captions, layer order, masks and timing are JSON data. Schema extensions are opt-in under version 2.1; old boards retain their original defaults. The existing local asset registry is unchanged.

Generic controls added:

| Control | Validated contract / reason |
| --- | --- |
| `groups` | Registered width/height, ordered named layers, optional annotations; references resolve to real file assets |
| Layer tracks | Strictly increasing integer frame keys for opacity, translation, uniform scale and brightness; smoothstep interpolation, clamped endpoints |
| `anchor` | Fixed local pivot for uniform plume growth, preserving its attachment point |
| `pulse` / `textureDrift` | Frame-driven bounded illumination and a low-opacity self-masked texture duplicate; base material remains stationary |
| Wipe reveal | Up/down/left/right bounds, keyed progress and optional feather; conduit rises from chamber to vent |
| Mask sequence | Previous mask remains fully applied while the next nested mask fades in; already revealed branches do not dim |
| Layer masks | Alpha or inverse-alpha PNG masks applied after transforms/reveal; crater rim stays fixed while plume grows |
| Subject `timeOffset` | Continue group animation across scene changes instead of resetting lava and smoke |
| Camera `from` / `to` / `holdFrames` | Explicit matching endpoints using existing camera interpolation; no return-to-neutral teleport |
| `backdrop` / `environmentDim` | Painted cover background, optional decoration and controlled cutaway contrast |
| `crossfadeFrames` / caption `hold` | Contiguous overlaps and readable ending through frame 449 |

No wall-clock motion, unseeded random animation, per-frame raster fitting, physical simulation, paid API, image generation, narration or publishing was introduced.

## Asset inventory and fitting

Production registry: 32 files, comprising 11 illustration/support images and 21 lava reveal masks. Four compositing groups: quiet, surface-dissolve, internal and active. All square layers retain the approved 1254×1254 registration; the landscape is 941×1672 and covers the vertical canvas. Foreground group width is 972 pixels before camera transforms. Original artwork and fitted Batch B/C PNGs are unchanged.

| Role | Registered source under `assets/illustrations/volcano/` |
| --- | --- |
| Background / exterior / cutaway | `batch-a/landscape-v1.png`, `exterior-v1.png`, `cutaway-rock-v1.png` |
| Molten material | `batch-b/fitted-v1/magma-chamber-fitted.png`, `conduit-magma-fitted.png` |
| Surface lava | `batch-c/fitted-v1/lava-flows-fitted.png` |
| Plume | `batch-c/fitted-v1/eruption-plume-placed-unoccluded.png`, with fixed `crater-rim-mask.png` |
| Ash / grounding | `batch-c/fitted-v1/ash-wisp-fitted.png`, `ground-contact-shadow.png` |
| Technical underlay / reveal masks | `animation-masks-v1/cavity-shadow.png`, `lava-reveal-00.png` through `20.png` |

`prepare-volcano-masks.ts` derives the dark cavity underlay from the connected rock opening (one-pixel hidden underlap). A four-neighbor geodesic traversal follows the fitted lava alpha, with four-source-pixel support dilation. It reaches **94,325/94,325 painted pixels (100%)**, producing nested path-distance masks. The final white mask reveals only existing fitted artwork; it does not paint unrelated background. Lava never translates or scales independently of the mountain, so the validated terrain support remains intact. The final art already contains soft terrain masking; it is not indiscriminately silhouette-clipped again.

The Batch B fitting receipt reports 100% chamber and conduit coverage, zero uncovered junction pixels and identical RGB across the shared material overlap. Both layers use the same illumination phase. Material lies behind foreground rock. The conduit is revealed upward over frames 180–264; the chamber is never globally scaled. Smoke expands uniformly around source-coordinate vent (640,334), with fixed inverse-alpha rim occlusion and bounded independent ash drift. No plume rotation or nonuniform stretching is used.

## Validation and compatibility

- TypeScript: passed.
- Vitest: **127 tests / 9 files passed**, preserving the earlier 114 tests and adding 13 production integration checks.
- `git diff --check`: passed.
- FFprobe: required dimensions, FPS, H.264 codec, 450 frames and 15-second duration passed.
- FFmpeg: full decode and individual-frame black detection passed; numbered chronology and transition samples extracted from the actual MP4.
- Tests cover production schema/files, exact chronology, layer stacking, fixed rim mask, registered shared material, upward conduit reveal, actual nested mask alpha, protected file hashes, fixed plume anchor, matching cameras, final-caption hold, evaluation-order-independent calculations, rejected invalid JSON and legacy defaults.
- Baseline comparison: **10/10 lossless samples identical** against `a1e8494`: GenericStoryboard frames 29,89,149,209,239,240,269; PlanetFormation frames 0,225,420. This is sampled compatibility evidence, not an exhaustive new render of both original videos.
- Both existing approved MP4 hashes and all available protected artwork hashes match the earlier receipts. No old MP4 was overwritten. Approved Sun/planet files are unchanged.
- Vitest is scoped to `src/**/*.test.ts` so archived baseline source inside ignored job folders is not accidentally discovered as another test suite.

Frame-driven calculations are deterministic. The previously documented encoded-output reproducibility issue remains unresolved: byte-identical MP4 output is **not guaranteed**. Lossless compatibility samples do not establish universal cross-run encoder identity or cross-platform font/raster identity.

## Performance

Actual final render plus encoding: **40.86 seconds**, concurrency 1, H.264 CRF 18; excludes bundling, previews and verification. Output is approximately 12 MB. This is about 1.06× the recorded M1.2 baseline time of 38.44 seconds, but the different scene content and single runs make this descriptive, not a controlled benchmark. No render stalls or memory failure occurred. System process/RSS inspection was denied by the sandbox, so no measured peak-memory claim is made. Masks are computed offline once; the render only samples tracks, masks and existing painted images.

## Visual review and limitations

Static proofs were inspected before motion/final rendering. Decoded short previews and final whole-second/boundary/motion sheets show chronological progression, upward magma, branch-following lava, crater-attached smoke and a persistent closing caption. Human visual approval remains separate from these checks.

Normal-speed playback was not independently observed through an available reliable playback surface in this run. The final MP4 and short clips are supplied for human playback review. Please review the 6–12-second motion pacing, dissolve presentation, plume development, mobile-size underground labels and final hold.

The cutaway is a schematic rock block composited over a dimmed landscape, not a physically excavated ground plane. Reservoir dimensions, depth and timescale are illustrative. This depicts a simplified gas-rich eruption, not every eruption style. The supplied flattened plume is compact and supports silhouette reveal/uniform growth rather than internal turbulent billowing; chamber texture drift is deliberately restrained. Lava is a painted branching network revealed progressively, not a fluid simulation, and some branch endpoints terminate on the approved slopes. The landscape itself remains static while the subject camera and ash provide depth. A future layered plume/terrain export could improve independent billowing, atmospheric parallax and interaction lighting without changing the storyboard architecture.
