# YouTube 2D Automation — reusable motion graphics

A deterministic 2D animation engine and a 15-second vertical science explainer, **How Planets Form**. M1.2 received human visual approval on 2026-11-14 as the project's illustrated animation baseline. The sequence simplifies a process that takes millions of years.



## M2.4.1 — controlled motion prototype, review pending

Generic JSON-configurable line/cubic path motion, seeded analytic particles and keyframed camera movement extend the existing layered renderer. The [prototype storyboard](storyboards/volcano-motion-prototype.json) adds clipped upward magma highlights, localized eruption particles and restrained camera guidance. [Non-volcano examples](config/motion-examples.json) demonstrate circulation, snowfall and camera tracking.

[Prototype MP4](jobs/volcano-m2-4-1-prototype/output/narrated-animation.mp4), [chronology](jobs/volcano-m2-4-1-prototype/chronological-contact-sheet.png), [before/after](jobs/volcano-m2-4-1-prototype/before-after-comparison.png), [report](docs/M2_4_1_MOTION_PRIMITIVES_REPORT.md). Output remains 1080×1920 / 30 FPS / 450 frames / 15 seconds, H.264/AAC. Narration, captions, scene boundaries and approved artwork remain unchanged. Render/encode/mux: **44.15 seconds**, versus the reused 37.01-second baseline (+19.3%). TypeScript, 280 tests, both production builds, 20 unchanged legacy samples and encoded-video checks pass. Two repeated prototype frames are losslessly identical; byte-identical MP4 output is not guaranteed.

Effects use the existing illustration clock plus explicit offsets; camera keys use output scene-local frames. Particle counts are bounded. Human playback review is pending, particularly subtle mobile-size particles and camera handoffs. Zero paid calls or new artwork/audio. Generated outputs remain local and ignored. M2.4.2 has not started.

## M2.3.4 — narration-driven scenes and clean production overlays

The latest [volcano MP4](jobs/volcano-m2-3-4-final/output/narrated-animation.mp4) removes the permanent AI disclosure banner and aligns scene crossfade midpoints to provider phrase timing. Nominal scene boundaries are **0 / 66 / 150 / 243 / 318 / 450**, with variable lengths and unchanged scene order. Transition-midpoint error: **8.67 ms maximum, 4.50 ms average**; transition-start error stays within 122 ms. No minimum-duration exception was needed.

[volcano-narrated.json](storyboards/volcano-narrated.json) opts into generic `narrationTiming` and per-scene `narrationCue` metadata. `animationDurationFrames` preserves illustration keyframe clocks when scenes change length. Existing plans without metadata retain their timing and rendering. `showAiDisclosureBanner` defaults to false; explicit true is available for debug proof frames. Mock-test CLI output still opts into its development warning.

```bash
npm run story:render-cached -- --script stories/volcano-elevenlabs-a.json --storyboard storyboards/volcano-narrated.json --audio /absolute/path/to/approved/narration.wav --metadata /absolute/path/to/narration-metadata.json --output jobs/<new-m2-3-4-job>
```

The approved 13.1425-second voice, 28-word script, subtitles and artwork are unchanged. Final output: 1080×1920, 30 FPS, 450 frames, 15.000 seconds, H.264/AAC. Render/encode/mux: **37.01 seconds**. The silent ending retains molten/ash motion and adds a gentle camera pull-back. TypeScript, 256 tests, both production bundles, encoded-media checks and 20 lossless backward-compatibility samples pass. No paid calls, new audio, new artwork, music or effects. See the [report](docs/M2_3_4_REPORT.md), [chronological sheet](jobs/volcano-m2-3-4-final/chronological-contact-sheet.png) and [timing comparison](jobs/volcano-m2-3-4-final/scene-timing-comparison.png). Final human video review remains pending. The M2.4.1 prototype above is a separate opt-in storyboard.

## M2.3.3 — approved narration integration

The approved Bill L. Oxley / ElevenLabs `eleven_multilingual_v2` performance is integrated into the existing five-scene [volcano storyboard](storyboards/volcano.json). All 28 words map from provider character timestamps to five mobile-safe caption segments. The 13.1425-second approved WAV is reused unchanged, followed by an intentional 1.8575-second silent ending. This milestone makes zero synthesis, paid alignment, Sound Effects or image-generation requests.

[Final local MP4](jobs/volcano-m2-3-3-final/output/narrated-animation.mp4): **1080×1920, 30 FPS, 450 frames, 15.000 seconds, H.264/AAC**. Render/encode/mux: **40.78 seconds**. [Chronological sheet](jobs/volcano-m2-3-3-final/chronological-contact-sheet.png), [transition sheet](jobs/volcano-m2-3-3-final/transition-contact-sheet.png), [milestone report](docs/M2_3_3_INTEGRATION_REPORT.md). Generated media remains ignored and is absent from a fresh clone.

The offline command does not load `.env` or import a synthesis adapter:

```bash
npm run story:render-cached -- --script stories/volcano-elevenlabs-a.json --audio /absolute/path/to/approved/narration.wav --metadata /absolute/path/to/narration-metadata.json
npm run story:verify-cached -- jobs/<new-job>
```

Metadata must contain the approved audio SHA-256, exact script text and provider character alignment. Output directories must be new. No audio shortening or acceleration is allowed. TypeScript, 243 tests, encoded-video checks and 15 unchanged lossless baseline samples pass. The source WAV and all protected artwork/videos retain their hashes. Caption rounding is bounded to one frame; unchanged visual scene boundaries follow some spoken beats by up to 1.27 seconds. Human final-video review remains useful, and byte-identical MP4 generation is not guaranteed.

The earlier M2.3/M2.3.2 entries below retain historical checkpoint findings. The narration has since received user approval. One Free-plan synthesis attempt failed with HTTP 402; one separately authorized Starter request succeeded. Both allowances are exhausted. Starter generation reported 68 credits, with a matching account balance decrease. M2.3.3 reuses that output locally and does not renew any paid authorization.

## M2.1 storyboard architecture — complete

An isolated, topic-independent engine now renders validated JSON through five reusable templates: hero reveal, orbital environment, transformation, comparison and summary. It resolves local PNG/SVG/WebP asset references, derives scene timing, and exposes operational camera, motion and caption presets. The approved M1.2 composition, entry point, artwork and choreography remain unchanged; a versioned adapter delegates to that renderer.

```bash
npm run dev:storyboard
npm run render:storyboard -- storyboards/generic-demo.json
npm run verify:storyboard -- jobs/<generic-job>
```

Start with [generic-demo.json](storyboards/generic-demo.json). See the [architecture audit](docs/M2_1_ARCHITECTURE_AUDIT.md), [schema/authoring reference](docs/M2_1_STORYBOARD_SCHEMA.md), [verification report](docs/M2_1_VERIFICATION.md) and [compatibility report](docs/M2_1_COMPATIBILITY.md). M2.1 received human approval as an architectural demonstration on 2026-11-14, with the final transition check completed. The brief backdrop-only dip at 8 seconds is intentional; regression tests bound it to frames 239–240, with the summary fully visible again at frame 246. Frame-based configuration is deterministic, but byte-identical MP4 output is not guaranteed: unresolved run-to-run encoded pixel differences are documented.

M2.2 **How a Volcano Erupts** is rendered and technically verified, awaiting human visual approval. [volcano.json](storyboards/volcano.json) drives all five existing templates through reusable registered groups, per-layer tracks, directional and path-mask reveals, crater occlusion, matched camera endpoints and a final caption hold. No volcano-specific React component or runtime image-generation service was added. Approved artwork and the original videos remain unchanged. See the [integration/verification report](docs/M2_2_INTEGRATION_REPORT.md), [updated reusability audit](docs/M2_2_REUSABILITY_AUDIT.md) and historical [artwork brief](docs/M2_2_ASSET_APPROVAL.md).

Final local output: `jobs/volcano-m2-2-2026-11-14T13-56-49-609Z/output/animation.mp4` — H.264, 1080×1920, 30 FPS, 450 frames, 15 seconds; render/encode **40.86 seconds**. Generated jobs remain ignored. M2.2 visual closure remains pending; its source dependencies are included in the M2.3.3 integration branch.

```bash
node --import tsx scripts/prepare-volcano-masks.ts
node --import tsx scripts/review-volcano.ts composition
# Inspect the five full-size proofs and detail crops; record composition-review.json.
node --import tsx scripts/review-volcano.ts motion jobs/<new-volcano-job>
# Inspect decoded motion previews before the full render.
node --import tsx scripts/review-volcano.ts final jobs/<new-volcano-job>
```

The review gate requires `composition-review.json` with `status: "passed"`; record the findings after inspecting the proofs. Generic layer controls and authoring details are documented in the integration report. Source artwork generation is a separate, human-reviewed authoring step; masks are deterministic local image processing. Flattened smoke permits limited internal motion, the cutaway is schematic, and normal-speed playback still needs human review. Byte-identical MP4 reproducibility remains unresolved.

M2.2.1 cinematic refinement is available in [volcano-m2-2-1.json](storyboards/volcano-m2-2-1.json): stronger parallax push, spatial cutaway, clipped directional/path flow highlights, larger crater-anchored eruption and a complete-process ending. Five 90-frame scenes and all five existing templates are preserved. See the [initial motion audit](docs/M2_2_1_MOTION_AUDIT.md) and [implementation/review report](docs/M2_2_1_IMPLEMENTATION_REPORT.md). Human visual approval remains pending; M2.2 visual closure remains pending; the refinement is retained as a separate demonstration.


## M2.3 storytelling and narration — mock review checkpoint

A separate validated [StoryScript](stories/volcano.json) now drives measured per-beat audio, cache reuse and estimated phrase captions over the existing `storyboards/volcano.json`. Three authored candidates are evaluated in [the candidate report](stories/script-candidates.md). Visual-only rendering remains compatible. M2.2.1 has not received visual-quality approval; further visual refinement is deliberately postponed.

```bash
npm run story:validate -- --script stories/volcano.json
npm run story:preview -- --script stories/volcano.json
npm run story:render -- --script stories/volcano.json --tts mock
```

The mock emits clearly disclosed **test tones, not spoken narration**. The final [mock MP4](jobs/volcano-m2-3-2026-11-14T15-32-49-383Z/output/narrated-animation.mp4) is verified at 1080×1920, 30 FPS, 450 frames and 15.000 seconds, with AAC audio and ten timed caption phrases. Render/encode/mux: 43.80 seconds. All five audio clips were reused from cache; no paid API request was made. TypeScript, 180 tests and video checks pass; 15 visual-only lossless samples match prior baselines.

At the original M2.3 mock checkpoint, the OpenAI adapter was contract-tested only. M2.3.1 below records the subsequent authorized live test. Real voice requires `OPENAI_API_KEY` and explicit paid authorization before `--authorize-paid-tts` is used. The currently documented Speech API model family is scheduled to shut down on 2027-01-06, so recheck support before spending credits. See the [full storytelling report](docs/M2_3_STORYTELLING_REPORT.md) for configuration, timing limits, cache/cost assumptions, provider sources and output paths. M2.3 is not closed; M2.4 has not started.


## M2.3.1 real narration — listening approval pending

Story commands now securely load the ignored project-root `.env` using Node 22 native `--env-file-if-exists=.env`. No credentials are printed or copied into render assets. Five authorized `gpt-4o-mini-tts-2025-12-15` / `marin` requests succeeded, with a persistent pre-request counter and **USD 0.0458616 conservative reservation** against the authorized USD 0.05 estimate. Actual billing is unavailable. The request allowance is exhausted.

The [real narrated MP4](jobs/volcano-m2-3-1-2026-11-14T16-27-39-560Z/output/narrated-animation.mp4) is 1080×1920, 30 FPS, 450 frames, H.264/AAC and 15.000 seconds; render/encode/mux 43.58 seconds. Complete-take/silence cleanup and an explicit **1.09× pitch-preserving correction** retain all 35 authored words. Raw and unsped comparisons are preserved. Captions use local ASR phrase estimates, not word-perfect timestamps. Please check the closing pronunciation of “magma”; local ASR was inconclusive.

See [narration review](docs/M2_3_1_NARRATION_REVIEW.md) for request accounting, exact timing adjustments, three review passes, limitations and artifact paths. The full 190-test suite, video checks, fresh mock render, 15 lossless baseline comparisons and 43 protected-file hashes pass. M2.3 remains open pending human listening approval; M2.2.1 visuals remain unapproved and deferred.

Re-rendering the prepared media needs no API key and cannot make speech requests:

```bash
node --import tsx scripts/render-prepared-story.ts jobs/volcano-m2-3-1-2026-11-14T16-27-39-560Z
```

## Setup

Use Node.js 22, npm, FFmpeg and ffprobe on PATH. The current macOS renderer configuration uses Google Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`; other environments need an appropriate Remotion browser configuration.

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run render
npm run review
```

`render` produces a unique `jobs/planet-formation-m1-2-5-<timestamp>/output/animation.mp4`. `review` also runs checks, extracts preview/chronological/transition sheets and writes verification and render reports. It works without historical job directories. A newly rendered artifact does not automatically inherit visual approval.

```bash
npm run verify -- jobs/<job-directory>
# Optional staged development review; requires the local M1.2.4 comparison job:
npm run review:polish -- A
npm run review:polish -- B jobs/<job-directory>
npm run review:polish -- C jobs/<job-directory>
npm run review:polish -- final jobs/<job-directory>
```

Earlier Sun and planet checkpoint workflows remain available as `review:sun` and `review:planet`; their comparisons require earlier local outputs. All render-time assets are local. Rendering makes no LLM or image-generation API calls.

## AI-assisted illustration workflow

1. Develop explicit art direction and original artwork with the built-in image-generation tool, outside the render pipeline.
2. Inspect and refine candidate images; obtain human visual approval.
3. Preserve the approved RGBA PNG pixels, proportions and fixed upper-left light direction. Check source hashes, alpha and bounds.
4. Integrate the asset into semantic illustration layers through Remotion `Img`, `staticFile` and the `assets/` public directory.
5. Add restrained deterministic compositing/motion, validate several sizes and adjacent encoded frames, then obtain approval for the finished video.

Approved assets and prompt provenance are committed. The canonical Sun is [sun-approved.png](assets/illustrations/star/sun-approved.png); an identical root-level approved copy is retained as the provenance/test fixture. The planet is [rocky-planet-approved.png](assets/illustrations/planet/rocky-planet-approved.png). Both are native 1254 × 1254 RGBA images. Superseded draft artwork stays local and is ignored.

## Reusable architecture

- `src/plans/planet-formation.json`: JSON scene configuration, checked by Zod for unique IDs and ordered, contiguous coverage of all 450 frames.
- `src/illustrations`: reusable semantic layers, registry, style tokens, approved raster illustrations and procedural space materials.
- `src/components`: compatible Star/Planet wrappers, seeded debris, particles, text, layered background and Camera2D.
- `src/composition`: establishing, explanatory, tracking, detail and hero shot presets, plus the final composition.
- `src/motion`: frame-based orbital motion, differential disk rotation, convergence, contact timing, absorption, continuous mass growth and restrained celestial motion.
- `src/timeline`: explicit chronological frame-to-scene mapping.
- `src/scenes`: five scene templates. Subjects are pose-matched at boundaries; foreground occlusion and environment entrances replace generic full-scene overlap. The reusable transition helper remains available, but production scene overlap is zero.
- `scripts`: unique-job rendering, source-asset audits, staged previews, numbered sheets decoded from actual MP4s and FFmpeg verification.
- `src/tests`: schema/timeline, determinism, illustration configuration, asset integrity, impact/growth, camera/subject continuity and final-caption checks.

The approved Sun uses gentle breathing, glow and a faint masked corona echo. The planet uses a stationary approved texture revealed inside an evolving irregular body; seeded contact events drive mass growth and localized effects. Whole-PNG rotation is avoided because shading is baked into the artwork. Camera movement, parallax, orbital motion and the final caption hold provide continuity.

To add a topic, create a validated JSON plan and extend the scene-template map/schema with components accepting `SceneProps`. Reuse illustration and motion primitives, and add relevant timing and continuity checks. Some current subject poses and effect constants remain specific to this five-scene example; the plan does not expose every art-direction decision.

## Final approved and verified output

Approved reference job: `jobs/planet-formation-m1-2-5-2026-11-14T05-41-24-380Z/`.

- [Final MP4](jobs/planet-formation-m1-2-5-2026-11-14T05-41-24-380Z/output/animation.mp4)
- [Comparison](jobs/planet-formation-m1-2-5-2026-11-14T05-41-24-380Z/before-after-contact-sheet.png), [chronological sheet](jobs/planet-formation-m1-2-5-2026-11-14T05-41-24-380Z/chronological-contact-sheet.png), [transition sheet](jobs/planet-formation-m1-2-5-2026-11-14T05-41-24-380Z/transition-contact-sheet.png)
- 1080 × 1920; 30 FPS; 450 frames; H.264; 15.000 seconds; no detected black frames or timeline gaps.
- TypeScript, 61 Vitest tests and whitespace checks passed at closeout.
- Measured full rendering/encoding: 38.44 seconds (11.71 effective frames/s); Node coordinator peak RSS 132.6 MB, excluding Chrome/FFmpeg.

Jobs, videos, generated preview sheets, logs and scratch outputs are intentionally ignored and are not distributed by Git. Those local links will be absent on a fresh clone until outputs are regenerated or copied separately. The committed [closeout record](docs/M1_2_CLOSEOUT.md) and [verification receipt](docs/M1_2_FINAL_VERIFICATION.json) identify the exact approved media and assets without checking in generated media.

## Current limitations

The approved artwork has flattened lighting and cannot provide real independent surface rotation or articulated plasma. Accretion and disk dynamics are stylized 2D approximations, not physical simulations. Procedural debris remains less detailed than painted assets, and tiny features may soften after platform compression. Camera interpolation is smooth but equal-spacing assumptions and scene-specific pose constants limit arbitrary retiming. Some schema fields and preset depth metadata are descriptive rather than universally applied controls.

The engine supports cached narration, provider-timed captions and audio/video verification. Publishing and automatic image generation are not implemented. Automated checks validate technical structure; they do not infer scene identity from pixels or replace human visual review. Future exports could separate albedo, shading, corona, molten details and silhouettes into aligned layers.

Historical M1 checkpoint documents retain their review-time pending statuses; the approved M1.2 closeout record supersedes them. M2.1 is complete as an approved architectural demonstration. See [ROADMAP](docs/ROADMAP.md) and the [visual style guide](docs/VISUAL_STYLE_GUIDE.md).


## M2.3.2 — ElevenLabs free preparation

Stage A adds a configurable ElevenLabs adapter, continuous-take script candidates, exact-text audio/timing cache support, natural-speed caption timing and persistent paid request guards. No paid synthesis or new video has been produced. Sound Effects remain disabled. Live read-only account/voice/model checks returned HTTP 401; Bill L. Oxley access is not yet verified. See the [Stage A report](docs/M2_3_2_ELEVENLABS_REPORT.md) for the blocked synthesis plan and review requirements.

```bash
npm run story:prepare -- --script stories/volcano-elevenlabs-a.json --tts elevenlabs --validate-remote
```

The command loads local `.env` securely and makes only three metadata GETs; omit `--validate-remote` for offline planning. It never synthesizes. `story:render --tts elevenlabs` remains blocked even with the old OpenAI authorization flag. Fix credential/account access locally and obtain separate bounded approval before Stage B. The original script, approved artwork and prior videos are preserved; M2.3 remains open.

Authentication follow-up: the live voice GET reports **HTTP 401 / `missing_permissions`**, while local environment loading and the header are correct. Review Voices: Read on the existing key, then use `npm run story:auth -- --script stories/volcano-elevenlabs-a.json --voice iiidtqDt9FBdT1vfBluA` for exactly one read-only voice check. See the [diagnostic](docs/M2_3_2_AUTH_DIAGNOSTIC.md). No synthesis authorization is implied.

## M2.5 style spike — quick reference

```bash
# Fast stills while authoring (offline, cached narration)
node --import tsx scripts/preview-stills.ts --script stories/volcano-elevenlabs-a.json \
  --storyboard storyboards/volcano-style-c.json --caption-style config/caption-styles/outline.json \
  --audio jobs/volcano-m2-3-4-final/audio/narration.wav --metadata jobs/volcano-m2-3-4-final/audio/narration-metadata.json \
  --frames 30,200,285,420 --output jobs/<new-preview>

# Full render of a variant
npm run story:render-cached -- --script stories/volcano-elevenlabs-a.json \
  --storyboard storyboards/volcano-style-c.json --caption-style config/caption-styles/outline.json \
  --audio jobs/volcano-m2-3-4-final/audio/narration.wav --metadata jobs/volcano-m2-3-4-final/audio/narration-metadata.json \
  --output jobs/<new-job>

# Chunked/resumable alternative: add --prepare-only above, then
node --import tsx scripts/render-job-frames.ts jobs/<new-job> 0 149   # repeat per range
node --import tsx scripts/assemble-job.ts jobs/<new-job>
```

Regenerate the B/C storyboards with `python3 scripts/authoring/build-style-spike-storyboards.py`. See `docs/M2_5_STYLE_SPIKE_REPORT.md`.

## M2.6 vector kit — quick reference

- Themes live in `src/engine/style/themes/*.json`; a storyboard picks one with `"themeId"` and uses colours as `"@role.path"` (e.g. `"@hot.core"`).
- A layer can be `{"id": "cone", "kit": {"type": "mountain", ...}}`; see `src/engine/kit/schema.ts` for all element types.
- `"backdrop": {"group": "backdrop"}` renders a full-frame animated group behind every scene.
- Kit storyboards: `storyboards/volcano-kit.json` (narrated) and `storyboards/water-cycle-demo.json` (no narration: `node --import tsx scripts/render-storyboard.ts storyboards/water-cycle-demo.json`).
- Regenerate both with `python3 scripts/authoring/build-kit-storyboards.py`. Captions default to the theme's caption style. See `docs/M2_6_VECTOR_STYLE_KIT_REPORT.md`.

## M2.7 sound and captions — quick reference

- Scene sound cues: `"sounds": [{"sound": "boom", "frame": 3, "gainDb": -14}]` (ids: rumble, whoosh, boom, pop, bubble, sizzle, riser; all synthesised in `src/audio/synth.ts`).
- Storyboard mix: `"audio": {"music": "generated-pad", "musicGainDb": -21, "duckRatio": 8, "targetLufs": -14}`.
- Licensed music: add `--music path/to/track.mp3` to `story:render-cached` (looped/trimmed, ducked, faded). Use only tracks licensed for monetized YouTube use.
- Word-highlight captions come from the theme (`caption.highlight: "word"`).
- Mix outputs: `<job>/audio/stems/`, `<job>/audio/mix-report.json`; mixed-mode checks in `reports/verification-report.json`. See `docs/M2_7_WATCHABILITY_REPORT.md`.
