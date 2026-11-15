# Project status — YouTube 2D Automation

_Last updated: 2026-11-15, after M3.0. Keep this concise; it is the entry point for any assistant picking up the project._

## Vision

A reusable, AI-assisted pipeline that turns a topic into a published, narrated 2D animated YouTube video: research → script → storyboard → assets → animation → narration → captions → music/SFX → render/QA → publish/analytics. First content: short educational science explainers, later longer videos and recurring characters. Business target: work toward YouTube Partner Program eligibility within about six months (a target, not a guarantee). The volcano clip is a test fixture, not the product.

## Current architecture

| Stage | Implementation | State |
| --- | --- | --- |
| Script | `stories/*.json`, Zod `src/storytelling/schema.ts`, beats → scene ids; planning timing estimate (`timing/estimate.ts`) | Authored by Claude with fact check; human approval |
| Narration | `src/audio/tts/{elevenlabs,openai,mock}.ts`; `npm run narration:synthesize` (dry run, one ledgered paid request, planning placeholder) | Working (ElevenLabs, Bill L. Oxley); runs on your Mac |
| Timing | `src/storytelling/timing/scene-scheduler.ts`: phrase cues set scene durations | Working |
| Captions | Provider character timing → words → 2-line cues with per-word timings; `box`/`outline` styles; word-by-word highlight | Working |
| Storyboard | Zod `src/engine/storyboard/schema.ts` v2.1; asset registry; 5 templates; layered groups | Working |
| Style | `src/engine/style/`: theme tokens (`explainer-dusk`, `explainer-day`), `@role.path` colour refs, WCAG contrast helper | Working |
| Animation | `LayeredSubject` SVG renderer; tracks, wipes/mask sequences, flow; primitives: path motion, particles, camera keyframes, puffs, stroke-reveal (+arrowheads); effects-only layers; **vector kit** (`src/engine/kit/`: sky, sun, ridges, ground, mountain, strata, blob, cloud, water, glow); group backdrops; pill labels; grain | Working, deterministic |
| Render/QA | Remotion 4.0.543 → H.264/AAC, FFmpeg mux; `verify-storyboard`, `verify-cached-story`; chunked rendering; still previews | Working |
| Sound | `src/audio/synth.ts` procedural SFX + generated music bed; scene `sounds` cues; `scripts/lib/mix-audio.ts` ducking, linear loudness to −14 LUFS, limiter; `--music` for licensed tracks | Working |
| Research, LLM storyboarding, publishing, analytics | — | Not started |

Two engines coexist: legacy planet code (`src/scenes`, `src/components`, `src/motion`) and the generic `src/engine`.

## Completed milestones

M1–M1.2 planet engine and art baseline · M2.1 generic storyboard/templates · M2.2/2.2.1 painted volcano integration · M2.3 narration pipeline (mock) · M2.3.1 OpenAI TTS (rejected) · M2.3.2 ElevenLabs (approved voice, 68 credits) · M2.3.3 narration + captions · M2.3.4 narration-driven scene timing · M2.4.1 motion primitives · M2.5 style and staging spike (vector direction chosen) · M2.6 vector style system and shape kit · M2.7 watchability pass · **M3.0 first complete episode: "How Lightning Forms"** (see `docs/M3_0_LIGHTNING_EPISODE_REPORT.md`).

## Latest branch and commit

- `claude/m3-0-lightning-episode` — commit hash in the M3.0 delivery message (a report cannot contain its own hash).
- Previous: `claude/m2-7-watchability` @ `07f8f80`; `claude/m2-6-vector-style-kit` @ `4d81aca`; `claude/m2-5-style-staging-spike` @ `6937d67`; `codex/m2-4-1-motion-primitives` @ `d9c6f7a`. `main` is still at M2.1 (`a1e8494`); milestone branches are stacked and unmerged.

## Test and build status (M3.0)

TypeScript pass · Vitest 351/351 (22 files) · both bundles pass · 21/21 legacy lossless frames identical · lightning episode (38 s) all checks pass: −14.8 LUFS, −2.2 dBTP, 16.4 dB ducking, speech-band clarity ≥ 0.950 per phrase · older volcano jobs re-verify. Verified in a Linux arm64 VM with external Chromium/FFmpeg; re-render on macOS for final visuals.

## Known limitations

- Visual quality is not yet Shorts-ready. The vector kit is clean and consistent but is near the ceiling of code-drawn art; no characters yet.
- Music bed and effects are synthetic placeholders; a licensed track (`--music`) and recorded effects would sound more produced.
- Painted raster art needs per-topic fitting scripts and masks; it does not scale to many topics or recurring characters.
- Captions are phrase-level, top-anchored, and not subject-aware; no word-by-word highlight.
- No hook/retention design beyond the script.
- Storyboards are large hand-written JSON; no authoring layer or LLM director.
- Scene templates are used as generic slots (e.g. eruption uses `orbital-environment`).

## Technical debt

Template misuse; two engines; two clocks (camera = output frames, layer effects = normalized illustration frames); dense one-line source in older files; many topic-specific scripts in `scripts/`; hardcoded colours/fonts in renderers; ROADMAP "M3/M4/M5" section is stale; byte-identical MP4 output not guaranteed.

## Approved next milestone

None yet. Awaiting the user's viewing/listening review of the lightning episode.

## Proposed future milestones

1. **M3.1 Word-anchored timing + authoring automation** (recommended): effects and sounds anchored to spoken words instead of frame numbers, so re-narration needs no manual retiming; then an LLM-assisted script-to-storyboard draft for kit topics.
2. **Publishing readiness**: title/description/thumbnail frame, upload checklist, first uploads to measure real retention.
3. **Art source upgrade**: illustrator-made or purchased vector kit mapped onto the existing kit slots; first recurring character.
3. **M3.0 Second topic, 45–60 s**: prove reuse without engine edits; retire legacy engine; unify clocks; fix template semantics.
4. **M3.1 LLM storyboard director**: script → validated storyboard JSON with human approval gate.
5. **M3.2 Publish and analytics**: upload, metadata, retention read-back.

## Open decisions

- Art source beyond code-drawn shapes: purchased/commissioned vector kit vs. paid image generation + vectorization.
- Music source: generated bed vs a licensed track (YouTube Audio Library) passed with `--music`.
- Shorts-first vs. long-form-first channel strategy (YPP thresholds rise for new applicants on 2027-02-01).
- Whether to merge stacked milestone branches into `main`.

## Cost and security

- No paid request without explicit fresh authorization; no automatic retries. Total paid usage to date: one ElevenLabs synthesis (68 credits) plus earlier OpenAI TTS test requests.
- `.env`, audio, rendered media, `jobs/` and caches are git-ignored and must stay out of commits.
- Approved narration and painted assets are protected; M2.5 did not modify them.
