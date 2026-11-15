# Project status — YouTube 2D Automation

_Last updated: 2026-11-15, after M3.1. Keep this concise; it is the entry point for any assistant picking up the project._

## Vision

A reusable, AI-assisted pipeline that turns a topic into a published, narrated 2D animated YouTube video: research → script → storyboard → assets → animation → narration → captions → music/SFX → render/QA → publish/analytics. First content: short educational science explainers, later longer videos and recurring characters. Business target: work toward YouTube Partner Program eligibility within about six months (a target, not a guarantee). The volcano clip is a test fixture, not the product.

## Current architecture

| Stage | Implementation | State |
| --- | --- | --- |
| Script | `stories/*.json`, Zod `src/storytelling/schema.ts`, beats → scene ids; planning timing estimate (`timing/estimate.ts`) | Authored by Claude with fact check; human approval |
| Narration | `src/audio/tts/{elevenlabs,openai,mock}.ts`; `npm run narration:synthesize` (dry run, one ledgered paid request, planning placeholder) | Working (ElevenLabs, Bill L. Oxley); runs on your Mac |
| Timing | `src/storytelling/timing/scene-scheduler.ts`: phrase cues set scene durations; **word anchors** (`timing/anchors.ts`): `{"at": "word"}` in place of frame numbers, resolved per clock after scheduling; `anchors:check` sync QA | Working |
| Captions | Provider character timing → words → 2-line cues with per-word timings; `box`/`outline` styles; word-by-word highlight | Working |
| Storyboard | Zod `src/engine/storyboard/schema.ts` v2.1; asset registry; 5 templates; layered groups; **drafter** `storyboard:draft` (script + theme → anchored skeleton with placeholder visuals) | Working |
| Style | `src/engine/style/`: theme tokens (`explainer-dusk`, `explainer-day`), `@role.path` colour refs, WCAG contrast helper | Working |
| Animation | `LayeredSubject` SVG renderer; tracks, wipes/mask sequences, flow; primitives: path motion, particles, camera keyframes, puffs, stroke-reveal (+arrowheads); effects-only layers; **vector kit** (`src/engine/kit/`: sky, sun, ridges, ground, mountain, strata, blob, cloud, water, glow); group backdrops; pill labels; grain | Working, deterministic |
| Render/QA | Remotion 4.0.543 → H.264/AAC, FFmpeg mux; `verify-storyboard`, `verify-cached-story`; chunked rendering; still previews | Working |
| Sound | `src/audio/synth.ts` procedural SFX + generated music bed; scene `sounds` cues; `scripts/lib/mix-audio.ts` ducking, linear loudness to −14 LUFS, limiter; `--music` for licensed tracks | Working |
| Research, LLM storyboarding, publishing, analytics | — | Not started |

Two engines coexist: legacy planet code (`src/scenes`, `src/components`, `src/motion`) and the generic `src/engine`.

## Completed milestones

M1–M1.2 planet engine and art baseline · M2.1 generic storyboard/templates · M2.2/2.2.1 painted volcano integration · M2.3 narration pipeline (mock) · M2.3.1 OpenAI TTS (rejected) · M2.3.2 ElevenLabs (approved voice, 68 credits) · M2.3.3 narration + captions · M2.3.4 narration-driven scene timing · M2.4.1 motion primitives · M2.5 style and staging spike (vector direction chosen) · M2.6 vector style system and shape kit · M2.7 watchability pass · M3.0 first complete episode: "How Lightning Forms" · **M3.1 word-anchored timing and storyboard drafter** (see `docs/M3_1_WORD_ANCHORS_REPORT.md`).

## Latest branch and commit

- `claude/m3-1-word-anchors` — commit hash in the M3.1 delivery message (a report cannot contain its own hash).
- Previous: `claude/m3-0-lightning-episode` @ `1061a0d`; `claude/m2-7-watchability` @ `07f8f80`; `claude/m2-6-vector-style-kit` @ `4d81aca`; `claude/m2-5-style-staging-spike` @ `6937d67`; `codex/m2-4-1-motion-primitives` @ `d9c6f7a`. `main` is still at M2.1 (`a1e8494`); milestone branches are stacked and unmerged.

## Test and build status (M3.1)

TypeScript pass · Vitest 364/364 (24 files) · both bundles pass · 19/19 legacy lossless frames identical to M3.0 · anchored lightning re-render with the approved take passes all mixed-mode checks (−14.8 LUFS, −2.4 dBTP, 16.4 dB ducking) · re-narration proof at 155/170 wpm keeps anchored cues on their words (hand-timed drift up to 1.0 s). Verified in a Linux arm64 VM with external Chromium/FFmpeg; re-render on macOS for final visuals.

## Known limitations

- Visual quality is not yet Shorts-ready. The vector kit is clean and consistent but is near the ceiling of code-drawn art; no characters yet.
- Music bed and effects are synthetic placeholders; a licensed track (`--music`) and recorded effects would sound more produced.
- Painted raster art needs per-topic fitting scripts and masks; it does not scale to many topics or recurring characters.
- Captions are phrase-level, top-anchored, and not subject-aware; no word-by-word highlight.
- No hook/retention design beyond the script.
- The drafter writes timing, camera, labels and sound, but each scene's visual is still hand-authored (placeholders in drafts); no LLM director yet.
- Scene templates are used as generic slots (e.g. eruption uses `orbital-environment`).

## Technical debt

Template misuse; two engines; two clocks (camera = output frames, layer effects = normalized illustration frames — word anchors now hide this from authors); dense one-line source in older files; many topic-specific scripts in `scripts/`; hardcoded colours/fonts in renderers; ROADMAP "M3/M4/M5" section is stale; byte-identical MP4 output not guaranteed.

## Approved next milestone

None yet. Awaiting the user's review of M3.1.

## Proposed future milestones

1. **M3.2 Second episode via the drafter + publishing package** (recommended): draft → author visuals → one paid take → final, timing the human/agent effort; add a thumbnail-frame picker, title/description/tags and AI-disclosure metadata, and an upload checklist so both episodes can go live and return real retention data.
2. **Art source upgrade**: an illustrator-made or purchased vector set mapped onto the kit slots; first recurring character.
3. **LLM visual director**: fill drafted placeholders from a vetted library of scene recipes (bolt, particles, flows, diagrams) with a human approval gate.
4. **Publish and analytics automation**: YouTube API upload and retention read-back (needs OAuth setup and approval).

## Open decisions

- Art source beyond code-drawn shapes: purchased/commissioned vector kit vs. paid image generation + vectorization.
- Music source: generated bed vs a licensed track (YouTube Audio Library) passed with `--music`.
- Shorts-first vs. long-form-first channel strategy (YPP thresholds rise for new applicants on 2027-02-01).
- Whether to merge stacked milestone branches into `main`.

## Cost and security

- No paid request without explicit fresh authorization; no automatic retries. Total paid usage to date: one ElevenLabs synthesis (68 credits) plus earlier OpenAI TTS test requests.
- `.env`, audio, rendered media, `jobs/` and caches are git-ignored and must stay out of commits.
- Approved narration and painted assets are protected; M2.5 did not modify them.
