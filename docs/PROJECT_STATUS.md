# Project status — YouTube 2D Automation

_Last updated: 2026-11-16, after M3.5. Keep this concise; it is the entry point for any assistant picking up the project._

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
| Style | `src/engine/style/`: theme tokens (`explainer-dusk`, `explainer-day`, `explainer-storm`, **`paint-notebook`** hand-drawn with line boil), `@role.path` colour refs, bundled OFL fonts, WCAG contrast helper | Working |
| Animation | `LayeredSubject` SVG renderer; tracks, wipes/mask sequences, flow; primitives: path motion, particles, camera keyframes, puffs, stroke-reveal (+arrowheads); effects-only layers; **vector kit** (`src/engine/kit/`: sky, sun, ridges, ground, mountain, strata, blob, cloud, water, glow, **figure** stick-figure/astronaut rig with 18 poses (incl. walk, run, flap cycles), 11 faces and mask/coat/wings accessories, **planet**, **terrain**, **prop** thermometer/pressure arrows/motion lines/!/?/tick/cross); ink notes; drop-shaped particles; group backdrops; pill labels; grain | Working, deterministic |
| Render/QA | Remotion 4.0.543 → H.264/AAC, FFmpeg mux; `verify-storyboard`, `verify-cached-story`; chunked rendering; still previews | Working |
| Sound | `src/audio/synth.ts` procedural SFX + generated music bed; scene `sounds` cues; `scripts/lib/mix-audio.ts` ducking, linear loudness to −14 LUFS, limiter; `--music` for licensed tracks | Working |
| Research, LLM storyboarding, publishing, analytics | — | Not started |

Two engines coexist: legacy planet code (`src/scenes`, `src/components`, `src/motion`) and the generic `src/engine`.

## Completed milestones

M1–M1.2 planet engine and art baseline · M2.1 generic storyboard/templates · M2.2/2.2.1 painted volcano integration · M2.3 narration pipeline (mock) · M2.3.1 OpenAI TTS (rejected) · M2.3.2 ElevenLabs (approved voice, 68 credits) · M2.3.3 narration + captions · M2.3.4 narration-driven scene timing · M2.4.1 motion primitives · M2.5 style and staging spike (vector direction chosen) · M2.6 vector style system and shape kit · M2.7 watchability pass · M3.0 first complete episode: "How Lightning Forms" · M3.1 word-anchored timing and storyboard drafter · M3.2 hand-drawn (Paint Explainer) style prototype (`main` @ `cae7e60`, tag `v0.3.2`) · M3.3 Titan pilot (64 s, real narration, all 32 checks pass; published on Gahanarka) · M3.4 Titan Short (9:16 re-layout, burned-in word captions) · **M3.5 Episode 2 "Helmet off in space" (16:9 88 s + 27 s Short, narrator + Arka multi-voice, all checks pass)** (see `docs/M3_5_EPISODE2_REPORT.md`).

## Latest branch and commit

- `claude/m3-3-paint-pilot` — in progress; commit hash in the delivery message.
- `main` = M3.2 (`cae7e60`, tag `v0.3.2`), fast-forwarded by the user. Previous: `claude/m3-1-word-anchors` @ `61b819a`; `claude/m3-0-lightning-episode` @ `1061a0d`; `claude/m2-7-watchability` @ `07f8f80`; `claude/m2-6-vector-style-kit` @ `4d81aca`; `claude/m2-5-style-staging-spike` @ `6937d67`; `codex/m2-4-1-motion-primitives` @ `d9c6f7a`. `main` is still at M2.1 (`a1e8494`); milestone branches are stacked and unmerged.

## Test and build status (M3.3)

TypeScript pass · Vitest 379/379 (26 files) · both bundles pass · 22/22 lossless frames identical to `main` · Titan pilot final (64 s, 1920×1080, real ElevenLabs narration, 921 characters): verify-cached-story 32/32 — −14.9 LUFS, −2.3 dBTP, 17.4 dB ducking, phrase clarity ≥ 0.955, cue deviation ≤ 15.7 ms · captions exported (SRT/VTT). The timing estimator overestimated this take by 30% (recalibrate).

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

Titan pilot scheduled on YouTube; Titan Short (`jobs/m3-4-short/output/upload/`) and Episode 2 (`jobs/m3-5-final`, `jobs/m3-5-short-final`) ready for upload. Next milestone awaits approval. Channel: Gahanarka (@Gahanarka), banner made in M3.3's session. Direction: The Paint Explainer style (hand-drawn, 16:9, stick-figure astronaut).

## Proposed future milestones

1. **Publishing package** (recommended): title/thumbnail/description/tags, AI-disclosure, upload checklist; first uploads for retention data.
2. **Visual variety pack**: close-up/cutaway compositions, public-domain NASA photo inserts, darker methane palette, scene-composition presets.
3. **LLM visual director** for the hand-drawn kit (script → poses, props, notes) with a human approval gate.

## Open decisions

- Art source beyond code-drawn shapes: purchased/commissioned vector kit vs. paid image generation + vectorization.
- Music source: generated bed vs a licensed track (YouTube Audio Library) passed with `--music`.
- Shorts-first vs. long-form-first channel strategy (YPP thresholds rise for new applicants on 2027-02-01).
- Whether to merge stacked milestone branches into `main`.

## Cost and security

- No paid request without explicit fresh authorization; no automatic retries. Paid usage to date: ElevenLabs syntheses for volcano (68 credits), lightning (465 characters) and Titan (921 characters), plus earlier OpenAI TTS test requests.
- `.env`, audio, rendered media, `jobs/` and caches are git-ignored and must stay out of commits.
- Approved narration and painted assets are protected; M2.5 did not modify them.
