# M2.4.1 — Reusable motion primitives: controlled prototype

The prototype adds JSON-configurable path motion, seeded particles and keyframed camera movement to the existing layered-subject architecture. It is rendered and technically verified; human review is pending. M2.4.2 has not started.

## Architecture and interfaces

`src/engine/motion/primitives/schema.ts` defines bounded Zod configurations. `path.ts`, `particles.ts` and `camera.ts` evaluate frame-derived state; `renderer.tsx` renders SVG effects inside existing illustration layers. The existing camera preset dispatcher handles the new keyframes through the existing Camera2D transform. No new dependency, topic-specific engine component or parallel compositor was introduced.

- **Path:** `type: "path-motion"`, normalized `path.start` and line/cubic-Bezier `segments`; `startFrame`, `durationFrames`, optional `endFrame`, `repeat`, phased `copies`, easing, radius, aspect, scale, opacity, color and optional tangent orientation. Precomputed 256-subdivision segment tables approximate arc length in the host's actual pixel aspect. Sampling uses a binary search. A layer's `clipToSource: true` masks effects to its source PNG alpha, preserving the painted conduit geometry.
- **Particles:** `type: "particles"`, seeded bounded records, emission start/end, normalized emitter region, lifetime and radius ranges, directional velocity, acceleration, opacity/scale tracks, colors and circle/streak/diamond shapes. Positions are analytical functions of age, not simulation history. Each layer allows six effects; the group-wide budget is 240 particle records. Individual emitters allow at most 96. Records are precomputed with the existing seeded random helper, independent of React render order.
- **Camera:** ordered `camera.keyframes` with frame, normalized focus, screen-normalized X/Y translation, zoom, rotation and easing. No keyframes yields a centered, static utility fallback. Existing storyboard defaults remain unchanged. `cover` protects the inverse viewport corners, including rotation; `backdrop` permits foreground framing only when the storyboard declares a fixed opaque backdrop. The prototype uses the latter. A second camera wrapper is not added.

All coordinates use a top-left origin, positive X right and positive Y down. Safe ranges, sorted keys/tracks, unique effect IDs, nonzero paths and incompatible camera configurations are validated. JSON contains no executable expressions.

### Clock and lifecycle contract

Camera keys use **output scene-local frames**. Layer effects deliberately use the existing **normalized illustration clock plus subject timeOffset**, matching the layers' existing reveal and motion tracks. Prototype illustrations use a 90-frame reference duration; velocity and acceleration are expressed per reference frame. Retiming the scene changes real-time effect speed. This extends the established clock instead of adding a competing timeline.

The conduit starts at reference frame 90 in the magma-rise scene. Four repeating highlights traverse the same upward cubic path until frame 180, clipped by the conduit source alpha. The eruption uses 64 total records: 12 buildup sparks, 20 burst sparks, 24 drifting ash and eight debris pieces. Emission is finite. The active group continues at timeOffset 90 in the summary; it does not emit a second burst or reset. Sampled visibility progresses from buildup at frame 8, to burst at 35, to residual ash at 90, and no new particles by 130. Existing painted plume/lava motion continues through the ending.

Camera endpoints match across scenes. The exterior pushes in, accumulation focuses lower, magma rise follows upward, and eruption/summary pull back. Captions remain in their existing screen-space overlay.

## Configuration and reuse

The prototype is `storyboards/volcano-motion-prototype.json`. It preserves the original registry, layer order, annotations, artwork registrations and narration scheduling. Only optional layer effects and camera keyframes are added.

`config/motion-examples.json` contains validated non-volcano examples: circulation along a cubic path, seeded snowfall and a camera-follow sequence. These illustrate reuse for vessels, falling material or diagram tracking without editing React source. Moving illustrations along arbitrary paths is not implemented; this prototype's path renderer supports small geometric highlights, while its sampling utilities are reusable for future object renderers.

Reproduce using the already approved local cache (no synthesis adapter or environment loading):

```bash
npm run story:render-cached -- \
  --script stories/volcano-elevenlabs-a.json \
  --storyboard storyboards/volcano-motion-prototype.json \
  --audio jobs/volcano-m2-3-4-final/audio/narration.wav \
  --metadata jobs/volcano-m2-3-4-final/audio/narration-metadata.json \
  --output jobs/<new-prototype-job>
node --import tsx scripts/review-motion-prototype.ts jobs/<new-prototype-job> jobs/volcano-m2-3-4-final
```

Output directories must be new. Approved audio and metadata are local, ignored prerequisites and are not distributed by Git.

## Outputs and verification

Local root: `/Users/deb/Documents/learn/ai-foundation/youtube-2d-automation/`.

- Reused valid baseline: `jobs/volcano-m2-3-4-final/output/narrated-animation.mp4`.
- Prototype: `jobs/volcano-m2-4-1-prototype/output/narrated-animation.mp4`.
- Chronology: `jobs/volcano-m2-4-1-prototype/chronological-contact-sheet.png`.
- Transition sheet: `jobs/volcano-m2-4-1-prototype/transition-contact-sheet.png`.
- Before/after: `jobs/volcano-m2-4-1-prototype/before-after-comparison.png`.
- Motion audit, detail crops and short playback previews remain in that job. Machine reports are under its `reports/` directory. The committed [verification receipt](M2_4_1_VERIFICATION.json) retains the results and media hashes.

TypeScript and all **280 Vitest tests in 17 files** pass (24 added; no existing tests weakened). Both production entry points bundle successfully. Twenty legacy lossless samples match M2.3.4 commit `f7f1bed7c34ea1454826318df1610558ba57ce68`: seven generic-demo, three planet, five volcano and five refined-volcano samples. Prototype frames 210 and 280 were each rendered twice as lossless PNGs and are byte-identical.

A same-camera effect-on/off proof at frame 210 changes 13,995 significant pixels and finds zero outside the conduit alpha, allowing two pixels for antialiasing and an eight-level channel difference threshold. The mask proof derives a temporary white alpha image in the ignored job; no source PNG is rewritten. This is a sampled visual containment test, complemented by the source mask applied on every frame.

Encoded-video verification passes: H.264/AAC, 1080×1920, 30 FPS, 450 frames, 15.000 seconds, full decode, ordered presentation timestamps, no detected black frames, chronological samples, mobile caption bounds and all 28 words covered. Scene boundaries remain **0 / 66 / 150 / 243 / 318 / 450**. Provider transition midpoint error remains max 8.67 ms / mean 4.50 ms. The source narration lasts 13.1425 seconds at natural speed, followed by 1.8575 seconds of intentional silence. Encoded PCM correlation to the approved performance is 0.999930; SNR is 38.48 dB.

Baseline/prototype WAV, encoded AAC payload and caption JSON are identical. The asset registry and 106 protected paths retain their hashes, including prior videos and approved illustrations. Disclosure is disabled; encoded banner-region checks match the production reference. Ending frames 420/449 differ, confirming continuing visual motion. Zero paid API, synthesis, alignment, Sound Effects or image-generation requests occurred. Whitespace checks pass.

## Performance and visual findings

| Render/encode/mux | Seconds |
|---|---:|
| Retained M2.3.4 baseline | 37.01 |
| M2.4.1 prototype | 44.15 |
| Increase | 7.14 (19.3%) |

These timings exclude bundling and QA. This is one retained baseline and one prototype run; some regression/build checks ran concurrently with the prototype. It is an observed pipeline cost, not an isolated benchmark. Added SVG alpha masks, flow highlights and particle nodes add rendering work; no quality or count reduction was used to hide the increase. Sampling tables and emitter records are memoized and generation is bounded.

Inspected encoded chronology, comparison and detail crops show upward molten highlights confined to the painted conduit, preserved scientific labels, modest camera reframing and localized ash/sparks beside the existing plume. The changes are restrained; particles are small at mobile size. Playback should be reviewed for directional readability, eruption buildup/burst/dissipation, camera handoffs and caption comfort before approval.

## Known limitations

Arc-length traversal is a numerical approximation. Particle dynamics are stylized analytical trajectories, not fluid physics; a flattened painted plume cannot develop new internal billows. Path effects use geometric highlights rather than textured moving sprites. Alpha clipping prevents spill but cannot correct a poorly authored route inside a mask. Effect reference clocks require deliberate offsets when authoring new scene transitions. The fixed-backdrop camera mode depends on truthful opaque asset metadata; cover mode protects the rectangular world rather than arbitrary artwork bounds. Human visual review and normal-speed playback remain necessary. Repeat-frame tests demonstrate sampled lossless determinism, not a guarantee of byte-identical encoded MP4 output.

## Files changed

Added: five files under `src/engine/motion/primitives/`; `src/tests/motion-primitives.test.ts`; `scripts/review-motion-prototype.ts`; `storyboards/volcano-motion-prototype.json`; `config/motion-examples.json`; this report and `docs/M2_4_1_VERIFICATION.json`.

Modified: `src/engine/camera/presets.ts`, `src/engine/storyboard/layers.ts`, `src/engine/storyboard/schema.ts`, `src/engine/templates/LayeredSubject.tsx`, README and ROADMAP. No dependency, approved artwork, narration, original storyboard or protected video changes.

## Git delivery

Publication branch: `codex/m2-4-1-motion-primitives`, based on M2.3.4 `f7f1bed7c34ea1454826318df1610558ba57ce68`. Commit message: `feat(animation): add reusable motion primitives`. The final response and ignored job's `reports/git-publication.json` record the resulting commit and push result after publication; this committed report cannot contain its own commit hash. Generated media, audio, caches, temporary masks and credentials are excluded. Publication does not merge the default branch, tag a release, grant visual approval or begin M2.4.2.
