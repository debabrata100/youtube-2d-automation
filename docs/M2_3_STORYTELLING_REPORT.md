# M2.3 storytelling and narration pipeline — mock review checkpoint

> Historical M2.3 mock checkpoint. The later [M2.3.1 review](M2_3_1_NARRATION_REVIEW.md) supersedes the missing-key/live-untested status below. Story npm commands now securely load the ignored root `.env` through native Node support; real narration has been generated within the separate five-request authorization. Human listening approval remains pending.


2026-11-14. **Mock implementation and technical verification complete; real voice generation and human approval pending.** M2.2.1 remains technically implemented and **not visually approved**. Its visual quality is intentionally postponed. No illustration, lava, smoke, gradient, parallax or camera refinement was performed in this milestone. No paid speech request, scriptwriting API, agent orchestration, music, effects, publishing, commit, push or tag was performed. M2.4 has not started.

## Story selection

Three authored candidates are stored as `stories/volcano-a.json`, `volcano-b.json` and `volcano-c.json`, with an evaluation in `stories/script-candidates.md`. Candidate A is selected in `stories/volcano.json`.

A curiosity question is followed by an underground definition, a causal ascent explanation, a qualified eruption example and the magma/lava distinction. Candidate B offers a more cinematic opening but less conversational wording and a fragmented ending. C prioritizes textbook clarity but has a weaker curiosity gap. Retention judgments are editorial hypotheses, not measured audience results. All three candidates contain 35 words; an estimate at 145 WPM is 14.483 seconds before provider-specific pauses. This estimate is not a measurement of real speech.

Selected script:

1. “What really makes a quiet volcano erupt?”
2. “Molten rock, called magma, collects deep underground.”
3. “Buoyancy and gas pressure can lift magma.”
4. “Some eruptions release gas, ash, and lava.”
5. “At the surface, that magma becomes lava.”

The qualifying “can” and “some” avoid implying identical or universally explosive eruptions. The reservoir is depicted visually; the script does not imply that all reservoirs have the illustrated depth or shape. Science references: [USGS volcano overview](https://www.usgs.gov/programs/VHP/about-volcanoes) supports buoyancy/gas pressure and terminology; [USGS eruption FAQ](https://www.usgs.gov/faqs/how-do-volcanoes-erupt) distinguishes eruption behaviors.

## Reusable architecture

The existing `storyboards/volcano.json` is the explicitly requested visual source. The separate M2.2.1 refinement storyboard and earlier MP4s remain untouched. Five scene templates and visual motion are unchanged. Narration is an optional compositor overlay, and existing visual-only commands retain their original captions and behavior.

`StoryScript` is independent of artwork. Strict Zod validation checks nonempty narration, unique beat IDs, exact ordered scene references, one beat per scene, target duration matching the visual timeline, English language support, hook/closing coverage and phrase word coverage. An authored candidates-report path and preview beat ranges keep topic-specific report content and clip naming out of the generic CLI.

The provider configuration is separate in `config/narration.json`. Model, voice, instructions and speaking rate are not embedded in the visual storyboard. The current supported story language is `en-US`; broader language support is not claimed. Provider settings and the cache include material synthesis parameters. No new scene template or topic-specific React component was added.

Main source additions:

- `src/storytelling/schema.ts`, `validate.ts`, `timing/frames.ts`, `timing/align.ts`
- `src/audio/tts/provider.ts`, `openai.ts`, `mock.ts`, `cache.ts`, `metadata.ts`, `assemble.ts`
- `src/captions/schema.ts`, `timing.ts`, `layout.ts`, `renderer.tsx`
- `scripts/story.ts`, `verify-story.ts`, `check-story-visual-compatibility.ts`
- `stories/` candidates/selected script and `config/narration.json`
- `src/tests/storytelling.test.ts`

Small integration edits add the optional overlay to `StoryboardComposition`/`StoryboardRoot`, an optional output filename to the generic verifier, npm scripts and local-secret ignore patterns. No asset registry or five-template rewrite was needed.

## Provider verification and authorization boundary

No OpenAI SDK is installed. The adapter uses Node 22's native fetch against the verified HTTP contract; tests inject a fake transport and never contact the service. Official [TypeScript/HTTP speech reference](https://developers.openai.com/api/reference/typescript/resources/audio/subresources/speech/methods/create) verifies `POST /v1/audio/speech`, input/model/voice, optional instructions/speed, and audio formats. This implementation deliberately chooses WAV for reliable measurement. The API's broad speed range is narrowed to an explicitly configured 0.9–1.1; there is no automatic acceleration.

Intended real provider: OpenAI, `gpt-4o-mini-tts-2025-12-15`, voice `marin`, speed 1.0, calm conversational American-English science direction. The [official speech guide](https://developers.openai.com/api/docs/guides/text-to-speech) lists voice compatibility and recommends marin/cedar quality. Real outputs include a visible AI-narration disclosure.

**Time-sensitive limitation:** the official reference currently lists the Speech API TTS models as deprecated, with shutdown scheduled for **2027-01-06**. The adapter blocks uncached synthesis on/after that date and reports an actionable migration error. The recommended Realtime replacement uses a different API workflow; it must not simply be substituted into `/audio/speech`. No Realtime migration is implemented in M2.3. Recheck official support before an authorized real run.

`OPENAI_API_KEY` is currently unavailable. The missing-key command was exercised: it reports model/voice/estimate and fails before any request. Even with a key, uncached paid generation requires the explicit `--authorize-paid-tts` flag after human authorization. There are no automatic retries or logged credentials/server bodies. No real voice quality, pronunciation, duration or live provider success is claimed.

## Full-script versus per-beat synthesis

| Approach | Delivery and timing | Requests/cache tradeoff |
| --- | --- | --- |
| Full script | Usually gives the narrator more prosodic context; without timestamps, beat boundaries are only estimated | One request; editing a beat invalidates the whole recording |
| Per beat — selected | Actual clip boundaries and durations are measurable; individual sentence resets may sound less continuous and need a human listening review | Up to five uncached requests; unchanged beats are reused independently |

The current CLI implements per-beat synthesis. Full-script synthesis is an evaluated alternative, not a claimed implemented alignment mode. A future forced-alignment step could allow continuous narration with reliable internal boundaries. Current phrase timing is estimated by authored phrase word counts within measured beat files; it is not word-perfect, and file boundaries are not claimed to be phoneme-level alignment.

## Measured timing — mock audio only

The deterministic `pcm-test-v1` / `test-pulse` adapter emits portable PCM tone patterns, **not spoken words or natural AI speech**. It exists to test scheduling, caching, rendering and muxing at no API cost. The video displays “MOCK TEST AUDIO · NOT SPOKEN NARRATION.” Real voice duration remains unknown until an authorized request.

| Beat | Scene frames | Measured mock clip | Intended start | Declared silence hold |
| --- | --- | --- | --- | --- |
| Hook | 0–89 | 2.896542 s | 0.000 s | 0.103458 s |
| Setup | 90–179 | 2.896542 s | 3.000 s | 0.103458 s |
| Explanation | 180–269 | 2.896542 s | 6.000 s | 0.103458 s |
| Payoff | 270–359 | 2.896542 s | 9.000 s | 0.103458 s |
| Closing | 360–449 | 2.896542 s | 12.000 s | 0.103458 s |

Source mock clips sum to **14.482710 seconds**. The assembled PCM master is exactly **15.000 seconds**, with **0.517290 seconds** of declared scene/end holds. No speech overlap, automatic scene retiming, source clipping or audio time stretching is used. Assembly delays clips at 24 kHz sample precision into the fixed visual slots. The integer caption span for each beat is 87 frames, conservatively rounded upward from the measured duration.

Strict mode fails if audio would exceed a scene slot, even by a frame. Long unexplained silence beyond the configured 0.35-second hold limit plus 0.02-second measurement tolerance also fails. Diagnostic `--no-strict` can report intentionally allowed long holds, but never permits overflow/clipping. Errors recommend shortening the script or explicitly revising delivery/timing rather than silently speeding up audio. No tolerance is used as permission to truncate speech.

A real seven-word beat may take a different duration than the mock fixture. If it does, strict validation may reject the first real pass; the operator must revise the script/delivery and reuse unaffected cached clips. The mock does not prove that a natural narrator will fit.

## Captions

Ten authored phrases cover all narration words in order. Their boundaries are allocated proportionally inside measured per-beat audio. Cue windows are half-open and non-overlapping; the last phrase ends at the measured beat span rather than falsely claiming exact word timings. Smooth three-frame opacity/translation entrances and exits remain restrained.

Layout is generic, high-contrast and top-positioned, with left/right safety margins reserving extra right-side UI space. Explicit lines cap the layout at two; actual Arial font widths are measured in the renderer to fit the available width. If fitting would shrink below the readability threshold, rendering fails and asks the author to split the phrase. Captions do not cover the volcano's central focal region in inspected encoded frames. Captions can be disabled independently of audio; original visual-only headlines remain unchanged when narration is absent.

## Audio cache and costs

The stable SHA-256 key includes normalized text, provider, model, voice, language, speaking rate, instructions, format and mock-specific parameters. Cached audio has a recorded content hash and is remeasured on reuse; corruption forces a miss. WAV/metadata writes use temporary files and atomic replacement. The cache version must be bumped if synthesis semantics change. `.cache/tts/`, jobs and credentials are ignored by Git. `--force-tts` intentionally bypasses reuse and may incur another charge in authorized OpenAI mode. Parallel-process duplicate request suppression is not implemented; the CLI synthesizes sequentially.

The first mock run had five misses. The final run reused **5/5 cached clips with zero synthesis calls**, zero external TTS requests and **$0 actual API cost**. Cache reuse and invalidation/forced regeneration are covered by tests. Live binary speech responses do not supply token usage in this implementation; no actual paid usage is invented.

For the proposed five-request real pass, an **illustrative** budget of 500 total text-input tokens and 300 audio-output tokens yields **$0.0039**, using the [official model card](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts) rates of $0.60/M text-input and $12/M audio-output tokens. These token counts are assumptions, not measured narration usage or a guaranteed audio-token rate. A **$0.02 planning allowance** is suggested for the initial pass; it is not an enforced billing cap. Different durations, instruction tokens, retries explicitly requested later or forced regeneration change cost. No paid request has been made or authorized.

## CLI

```bash
npm run story:validate -- --script stories/volcano.json
npm run story:preview -- --script stories/volcano.json
npm run story:render -- --script stories/volcano.json --tts mock
```

`story:preview` is a dry script/duration planning preview, not a generated voice preview. Rendering creates a new unique job by default; `--output` must name an empty directory. Options include `--voice`, `--model`, `--config`, `--speaking-rate`, `--force-tts`, `--strict` (default), `--no-strict`, `--max-pause`, `--timing-tolerance` and `--no-captions`.

Real voice is ready to attempt only **after explicit authorization and locally configuring the key**, without pasting secrets into chat:

```bash
npm run story:render -- --script stories/volcano.json --tts openai --authorize-paid-tts
```

The environment variable must be present in the process environment; `.env` files are ignored for safety but are not auto-loaded. Missing-key or authorization errors do not break mock mode.

## Final verified output

Job: `jobs/volcano-m2-3-2026-11-14T15-32-49-383Z/`.

- `output/narrated-animation.mp4`: mock test audio plus timed captions
- `audio/narration.wav` and five beat WAVs
- `story/selected-script.json`, `script-candidates.md`, `timing-plan.json`
- `captions/captions.json`
- `reports/narration-report.json`, `timing-report.json`, `verification-report.json`, `render-report.json`, `implementation-report.md`
- `reports/visual-only-compatibility-report.json`, `preservation-report.json`
- `previews/opening-hook.mp4`, `magma-explanation.mp4`, `eruption-payoff.mp4`
- `chronological-contact-sheet.png` and additional transition/motion audit sheets

The final encoded MP4 is **1080×1920, H.264, 30 FPS, 450 frames, exactly 15.000 seconds** with embedded AAC audio. Exact-duration muxing copies the rendered H.264 stream and encodes from the validated PCM master; it avoids extra AAC merge padding in the reported container duration without dropping narration. The render/encode/mux stage took **43.80 seconds**, excluding synthesis/cache preparation, bundling and verification.

FFmpeg/FFprobe verification passes full decode, black-frame detection, video/audio/container timeline checks, onset, declared gaps, no overlap/truncation and caption frame/safety bounds. Encoded caption frames and the chronological sheet were inspected. The final listening/voice-quality review remains unavailable because this is a tone mock, not natural speech.

TypeScript, **180 Vitest tests / 11 files** and `git diff --check` pass. Tests cover script validation/order, timing/overflow/holds, caption layout/timing, cache stability/invalidation/integrity, actual FFprobe measurements, deterministic PCM, sample-accurate assembly, credentials/authorization/shutdown guards and injected HTTP request behavior. Tests do not call the paid API.

Visual-only compatibility: **15/15 lossless samples identical**—ten M1.2/M2.1 baseline samples plus five layered-volcano M2.2.1 reference samples with narration disabled. Narrated/caption-enabled images intentionally differ; no pixel-identity claim is made for those renders. **42 protected paths retain their hashes**, including earlier videos and approved illustrations. M2.2.1's preserved technical output has not acquired visual approval.

## Remaining limitations and recommended next step

Obtain explicit paid-TTS authorization and configure the API key, then evaluate real pronunciation, naturalness, per-beat prosody and actual duration. Shorten/rebalance narration if strict timing rejects it; do not use the mock's duration as evidence of a real fit. Phrase boundaries remain estimates until actual alignment data is available. Current support is one English beat per scene and per-beat synthesis, with no forced alignment, concurrent cache locking or automatic provider retries. The OpenAI Speech API retirement requires a separately scoped provider migration before 2027-01-06. Existing visual quality concerns remain deliberately unresolved.

Recommended next work is the authorized real-voice listening/timing review, followed by a decision on continuous synthesis plus alignment and provider migration. This is a recommendation, not implementation or the start of M2.4. Human approval remains required before milestone closure.
