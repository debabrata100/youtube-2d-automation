# Project status — YouTube 2D Automation

_Last updated: 2026-11-15, after M2.5. Keep this concise; it is the entry point for any assistant picking up the project._

## Vision

A reusable, AI-assisted pipeline that turns a topic into a published, narrated 2D animated YouTube video: research → script → storyboard → assets → animation → narration → captions → music/SFX → render/QA → publish/analytics. First content: short educational science explainers, later longer videos and recurring characters. Business target: work toward YouTube Partner Program eligibility within about six months (a target, not a guarantee). The volcano clip is a test fixture, not the product.

## Current architecture

| Stage | Implementation | State |
| --- | --- | --- |
| Script | `stories/*.json`, Zod `src/storytelling/schema.ts`, beats → scene ids | Manual authoring |
| Narration | `src/audio/tts/{elevenlabs,openai,mock}.ts`, content-hash cache, budget guard, zero auto-retry | Working (ElevenLabs, Bill L. Oxley) |
| Timing | `src/storytelling/timing/scene-scheduler.ts`: phrase cues set scene durations | Working |
| Captions | Provider character timing → words → 2-line cues; `src/captions/`, `box`/`outline` styles | Working, phrase-level (no word highlight) |
| Storyboard | Zod `src/engine/storyboard/schema.ts` v2.1; asset registry; 5 templates; layered groups | Working |
| Animation | `LayeredSubject` SVG renderer; tracks, wipes/mask sequences, flow; primitives: path motion, particles, camera keyframes, **puffs**, **stroke-reveal**; effects-only layers | Working, deterministic |
| Render/QA | Remotion 4.0.543 → H.264/AAC, FFmpeg mux; `verify-storyboard`, `verify-cached-story`; chunked rendering; still previews | Working |
| Music/SFX, research, LLM storyboarding, publishing, analytics | — | Not started |

Two engines coexist: legacy planet code (`src/scenes`, `src/components`, `src/motion`) and the generic `src/engine`.

## Completed milestones

M1–M1.2 planet engine and art baseline · M2.1 generic storyboard/templates · M2.2/2.2.1 painted volcano integration · M2.3 narration pipeline (mock) · M2.3.1 OpenAI TTS (rejected) · M2.3.2 ElevenLabs (approved voice, 68 credits) · M2.3.3 narration + captions · M2.3.4 narration-driven scene timing · M2.4.1 motion primitives · **M2.5 style and staging spike** (see `docs/M2_5_STYLE_SPIKE_REPORT.md`).

## Latest branch and commit

- `claude/m2-5-style-staging-spike` — commit hash in the M2.5 delivery message (a report cannot contain its own hash).
- Previous: `codex/m2-4-1-motion-primitives` @ `d9c6f7a`. `main` is still at M2.1 (`a1e8494`); milestone branches are stacked and unmerged.

## Test and build status (M2.5)

TypeScript pass · Vitest 305/305 (19 files) · both bundles pass · 23/23 legacy lossless frames identical · A/B/C encoded verification pass. Verified in a Linux arm64 VM with external Chromium/FFmpeg; re-render on macOS for final visuals.

## Known limitations

- Visual quality is not yet Shorts-ready. M2.5 vector variant is the strongest direction but the art is placeholder quality.
- Painted raster art needs per-topic fitting scripts and masks; it does not scale to many topics or recurring characters.
- Captions are phrase-level, top-anchored, and not subject-aware; no word-by-word highlight.
- No music or sound design; no hook/retention design beyond the script.
- Storyboards are large hand-written JSON; no authoring layer or LLM director.
- Scene templates are used as generic slots (e.g. eruption uses `orbital-environment`).

## Technical debt

Template misuse; two engines; two clocks (camera = output frames, layer effects = normalized illustration frames); dense one-line source in older files; many topic-specific scripts in `scripts/`; hardcoded colours/fonts in renderers; ROADMAP "M3/M4/M5" section is stale; byte-identical MP4 output not guaranteed.

## Approved next milestone

None yet. Awaiting the user's visual decision on M2.5 (A / B / C).

## Proposed future milestones

1. **M2.6 Vector art direction and asset kit**: style tokens, a reusable vector shape library, consistent line/texture treatment; re-author volcano at higher quality as the reference.
2. **M2.7 Audio bed**: music + SFX with ducking under narration; free/licensed sources.
3. **M3.0 Second topic, 45–60 s**: prove reuse without engine edits; retire legacy engine; unify clocks; fix template semantics.
4. **M3.1 LLM storyboard director**: script → validated storyboard JSON with human approval gate.
5. **M3.2 Publish and analytics**: upload, metadata, retention read-back.

## Open decisions

- Production art style (M2.5: vector recommended).
- Art source for the vector style: hand/LLM-authored SVG vs. paid image generation + vectorization vs. commissioned kit.
- Shorts-first vs. long-form-first channel strategy (YPP thresholds rise for new applicants on 2027-02-01).
- Whether to merge stacked milestone branches into `main`.

## Cost and security

- No paid request without explicit fresh authorization; no automatic retries. Total paid usage to date: one ElevenLabs synthesis (68 credits) plus earlier OpenAI TTS test requests.
- `.env`, audio, rendered media, `jobs/` and caches are git-ignored and must stay out of commits.
- Approved narration and painted assets are protected; M2.5 did not modify them.
