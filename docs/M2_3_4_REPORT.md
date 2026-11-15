# M2.3.4 — Narration-driven scenes and production cleanup

Baseline: `1936889dfb60df8adfde5b9bc040f771b57875f1`. See the [pre-change audit](M2_3_4_TIMING_AUDIT.md), written before code changes. The task began on a clean M2.3.3 branch. No paid API requests, synthesis, forced alignment, Sound Effects, music or image generation were used.

## Root cause and implementation

M2.3.3 scheduled five fixed 90-frame scenes independently from provider-derived captions. Accurate speech captions therefore led visual scenes. `NarrationOverlay` also rendered its provenance banner unconditionally. Neither issue required changing the approved voice or images.

Production now defaults `showAiDisclosureBanner` to false. Explicit true retains the debug disclosure; the mock CLI explicitly enables its test-tone warning. The absolutely positioned banner has no spacer, so disabling it exposes the existing painted sky. Educational Magma chamber / Conduit labels and connectors, and the synchronized subtitles, remain. No other temporary visible debug overlays were found in the active composition. Review contact-sheet labels remain outside production frames.

Optional storyboard `narrationTiming` metadata defines a minimum scene duration (45 frames here) and alignment tolerance (0.2 seconds). Each scene references a `narrationCue` containing beat ID, phrase index and start/end edge. The generic planner resolves exact phrase timings from provider character/word alignment, aligns crossfade midpoints to those semantic cues, rounds boundaries to whole frames, reserves minimum durations and fixes the last end to frame 450. Missing, duplicate or reversed cues fail; constrained deviations are reported explicitly. There are no volcano-name or topic tests in React or the planner.

The original `storyboards/volcano.json` remains unchanged. `storyboards/volcano-narrated.json` opts into scheduling through the existing offline CLI's `--storyboard` override. The original approved script file remains unchanged. The resolved plan is saved in the job's `storyboard.json`; Remotion consumes resolved frame durations rather than consulting speech APIs at render time. Plans without metadata retain their original timing and lossless samples.

`animationDurationFrames` keeps the illustration's existing 90-frame keyframe clock while scenes become shorter or longer. Group `timeOffset` continuity remains intact at internal/eruption handoffs. Camera interpolation and scene envelopes use output time. The ending retains existing magma brightness/ash changes plus a gentle 3% camera pull-back, avoiding a frozen silent finish. No illustration pixel or animation template redesign was needed.

## Before and after

Frame ranges below are end-exclusive. They form one contiguous 450-frame nominal partition. The existing 8-frame crossfade intentionally blends adjacent scene layers; it does not introduce duplicate or missing encoded frames.

| Scene | M2.3.3 frames / seconds | M2.3.4 frames / seconds | Exact phrase start | New midpoint error |
| --- | --- | --- | --- | --- |
| Exterior | 0–90 / 0–3.00 | 0–66 / 0–2.20 | 0.000 s | 0 ms |
| Magma accumulation | 90–180 / 3.00–6.00 | 66–150 / 2.20–5.00 | 2.322 s | 5.33 ms |
| Magma rise | 180–270 / 6.00–9.00 | 150–243 / 5.00–8.10 | 5.120 s | 3.33 ms |
| Eruption | 270–360 / 9.00–12.00 | 243–318 / 8.10–10.60 | 8.208 s | 8.67 ms |
| Summary | 360–450 / 12.00–15.00 | 318–450 / 10.60–15.00 | 10.716 s | 0.67 ms |

Across the four transitions, new **midpoint deviation is 8.67 ms maximum / 4.50 ms average**. Transition **start** deviation is 122 ms maximum / 116.5 ms average. The 8-frame fades straddle speech cues, and even their start/completion remain within 0.2 seconds. Minimum actual scene length is 66 frames / 2.2 seconds. **No minimum-duration or animation constraint exception.**

For consistent midpoint comparison, old deviations were maximum 1.4007 seconds / mean 1.0252 seconds. Old nominal-start deviations against exact speech were max 1.284 seconds / mean 0.9085 seconds. The older reported max 1.267 seconds compared starts with rounded caption frames instead; these different measurement definitions are stated to avoid a misleading improvement claim.

Character-to-word conversion retains the original aligned text, punctuation-bearing source spans and character index provenance. All 28 word times and five caption intervals retain the same spoken timing as M2.3.3. No guessed evenly spaced word timing is used. Caption starts round upward to video frames (less than 33.34 ms). Subtitles stay in the existing upper mobile-safe area and end with speech, without occupying the silent finish. Decoded chronological and transition sheets were inspected: subtitles remain well above educational labels, with no observed overlap.

## Output and verification

Job: `jobs/volcano-m2-3-4-final/`.

- Final MP4: `output/narrated-animation.mp4`.
- Chronological sheet: `chronological-contact-sheet.png`; transition/motion sheets are alongside it.
- Before/after timing image: `scene-timing-comparison.png` (also SVG and exact JSON under `reports/scene-timing-comparison.json`).
- Caption/word/phrase timing: `captions/`.
- Machine verification: `reports/verification-report.json`, `production-overlay-audit.json`, `compatibility-report.json`, `build-check.json`, `preservation-report.json`.

Final video is **1080×1920, 30 FPS, 450 frames, exactly 15.000 seconds, H.264/AAC**. Render/encode/mux: **37.01 seconds**, excluding bundling and verification. Audio is the unchanged 13.1425-second, 24 kHz mono PCM input followed by the natural 1.8575-second silent ending; AAC output is 48 kHz mono. The retained M2.3.3 copy matches the approved audio SHA-256 `bd2653de8af3eaac0abf20c0a63c91e53bc6486303fcd589b5cbf84430531249`; the original M2.3.2 job directory was no longer present at task start. No need to regenerate audio.

FFmpeg/FFprobe pass full decode, no black frames, exact dimensions/duration, all 450 decoded presentation timestamps in order with no missing/duplicate PTS, source/encoded audio integrity, provider caption mapping and scene scheduling. AAC-to-source correlation: **0.999930**, signal-to-difference **38.48 dB**; audio is not sped up, clipped or truncated by the pipeline.

Production/debug reference stills differ only by the banner flag. The actual encoded banner band is much closer to production-off than debug-on (MSE 1.216 versus 1354.918). Pixels below the banner are identical between lossless references. This confirms no blank replacement region or subtitle removal. Production flag gating applies to all frames. Final encoded samples at 14.0 and 14.967 seconds differ, confirming an active ending.

TypeScript and **256 tests / 16 files** pass, including new rendered-banner, punctuation/index, phrase-edge mapping, minimum-duration, chronology, rounding, exact-total, normalized-clock and backward-compatibility coverage. Existing tests were retained; Vitest discovery was extended to include TSX component tests. Both `src/index.ts` and `src/storyboard-index.ts` production bundles build. **20/20 lossless compatibility samples** match 1936889: seven generic-demo, three planet-formation and five samples from each original/refined volcano plan, all with narration absent. All 100 snapshotted asset/provenance/input paths retain their hashes, including approved artwork, the previous MP4 and approved WAV/script.

## Files changed

- `src/storytelling/timing/scene-scheduler.ts`: new generic semantic scheduler.
- `src/engine/storyboard/schema.ts`, `timeline.ts`, `src/compositions/StoryboardComposition.tsx`: opt-in cue/clock metadata and normalized illustration clocks.
- `src/captions/provider-timing.ts`, `schema.ts`, `renderer.tsx`: phrase/word provenance and configurable disclosure.
- `storyboards/volcano-narrated.json`: narrated production variant; source illustration groups and registry unchanged.
- `scripts/render-cached-story.ts`, `verify-cached-story.ts`: offline resolution and exact encoded timeline/production checks.
- `scripts/audit-production-overlays.ts`, `audit-scene-scheduling-compatibility.ts`: new proof/regression tooling.
- `scripts/story.ts`: retain mock-only debug disclosure.
- `src/tests/narration-scenes.test.tsx`, `vitest.config.ts`: component and timing regressions.
- `README.md`, `docs/ROADMAP.md`, this report, timing audit and verification receipt.

## Limitations and review

Provider timestamps and frame quantization are not perceptual ground truth; final normal-speed playback remains a human review. A scene crossfade can align within milliseconds while its illustrated cutaway/plume develops over subsequent frames; this intentional animation is not claimed to be instantly complete at the phrase onset. Educational illustrations remain schematic, the compact plume is inherited, and flattened layers limit fluid realism. No independent audio listening approval is claimed beyond the already user-approved source voice. Byte-identical rerendered MP4s are not guaranteed.

The requested milestone branch is based on 1936889. Only task source/config/tests/docs are committed; credentials, jobs, generated audio/videos/caches and temporary proof assets remain ignored. The completion message reports actual branch/hash/push outcome. No force push, default-branch merge, tag or M2.4 work. Stop for human final-video review after publication.
