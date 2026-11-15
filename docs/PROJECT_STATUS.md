# Project status — YouTube 2D Automation

_Last updated: 2026-11-15, after M2.7. Keep this concise; it is the entry point for any assistant picking up the project._

## Vision

A reusable, AI-assisted pipeline that turns a topic into a published, narrated 2D animated YouTube video: research → script → storyboard → assets → animation → narration → captions → music/SFX → render/QA → publish/analytics. First content: short educational science explainers, later longer videos and recurring characters. Business target: work toward YouTube Partner Program eligibility within about six months (a target, not a guarantee). The volcano clip is a test fixture, not the product.

## Current architecture

| Stage | Implementation | State |
| --- | --- | --- |
| Script | `stories/*.json`, Zod `src/storytelling/schema.ts`, beats → scene ids | Manual authoring |
| Narration | `src/audio/tts/{elevenlabs,openai,mock}.ts`, content-hash cache, budget guard, zero auto-retry | Working (ElevenLabs, Bill L. Oxley) |
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

M1–M1.2 planet engine and art baseline · M2.1 generic storyboard/templates · M2.2/2.2.1 painted volcano integration · M2.3 narration pipeline (mock) · M2.3.1 OpenAI TTS (rejected) · M2.3.2 ElevenLabs (approved voice, 68 credits) · M2.3.3 narration + captions · M2.3.4 narration-driven scene timing · M2.4.1 motion primitives · M2.5 style and staging spike (vector direction chosen) · M2.6 vector style system and shape kit · **M2.7 watchability pass** (see `docs/M2_7_WATCHABILITY_REPORT.md`).

## Latest branch and commit

- `claude/m2-7-watchability` — commit hash in the M2.7 delivery message (a report cannot contain its own hash).
- Previous: `claude/m2-6-vector-style-kit` @ `4d81aca`; `claude/m2-5-style-staging-spike` @ `6937d67`; `codex/m2-4-1-motion-primitives` @ `d9c6f7a`. `main` is still at M2.1 (`a1e8494`); milestone branches are stacked and unmerged.

## Test and build status (M2.7)

TypeScript pass · Vitest 343/343 (21 files) · both bundles pass · 36/36 legacy lossless frames identical (incl. narrated legacy captions) · kit volcano mixed-mode verification pass: −14.6 LUFS, −2.3 dBTP, 18 dB ducking, speech-band clarity ≥ 0.967 per phrase. Verified in a Linux arm64 VM with external Chromium/FFmpeg; re-render on macOS for final visuals.

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

None yet. Awaiting the user's viewing/listening review of M2.7.

## Proposed future milestones

1. **M3.0 First complete episode** (recommended): a new 30–45 s topic end to end (script candidates, one approved paid narration, kit storyboard, sound, render), measuring authoring time; retire the legacy engine and unify clocks.
2. **Art source upgrade**: illustrator-made or purchased vector kit mapped onto the existing kit slots; first recurring character.
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
