# M3.0 — First complete episode: "How Lightning Forms"

**Status:** rendered and technically verified; **your viewing/listening approval pending**.
**Branch:** `claude/m3-0-lightning-episode` (based on M2.7 `07f8f80`). **Paid requests:** 1 (approved; run by you on your Mac).

## Goal

Make a new topic end to end with the full pipeline and measure what it takes: script, fact check, storyboard, sound, one approved narration, final render and checks. This is the real test of whether the system can scale to a channel.

## Outcome

A 38-second vertical explainer (1080 × 1920, 30 FPS, 1,140 frames), with:
- Bill L. Oxley narration.
- Word-highlighted captions.
- Seven scenes in a new night-storm theme.
- Twenty-three timed sound effects, a ducked music bed, and loudness set to −14.8 LUFS.

Final video: `jobs/m3-0-final/output/narrated-animation.mp4` (local, git-ignored).

## What it took

| Step | Who | Effort |
| --- | --- | --- |
| Topic shortlist and choice | Claude | minutes |
| Fact check (NOAA, NWS, NSSL) and three script candidates | Claude | minutes |
| Storyboard in the kit, storm theme, sound cues | Claude | most of the time (visual tuning) |
| Animatic with estimated timing for review before spending | Claude | ~3 min render |
| Paid narration: approve, dry run, one request | **You** | two commands |
| Retime to real word timings, final render, mix, verification | Claude | ~2 min render + checks |

About **25 minutes of agent working time** in total, plus your approval and two commands. **No engine code was written for the topic itself**; all visuals are kit elements and existing effects. The remaining manual cost is visual tuning and choosing word anchors. Both are good targets for automation (see "Recommended next").

## Pipeline capabilities added (reusable)

- **`narration:synthesize`**, a general ElevenLabs command:
  - `--dry-run` prints the plan (characters, words, estimated duration, request hash) with no network call.
  - `--authorize-paid-tts --max-characters N` makes exactly one ledgered request with no retries.
  - `--planning` writes a silent placeholder narration with estimated timing, for animatics.
  - The API key is read from `.env` on your machine and never printed or stored.
- **Timing estimator** (`src/storytelling/timing/estimate.ts`): planning-only character timings shaped like provider alignment. It is calibrated so the volcano script estimates at 13.1 s against 13.14 s measured. For lightning it estimated 37.4 s against 34.7 s actual (7% long, so it errs on the safe side).
- **`preview-stills --estimate-timing`:** captions, scheduling and stills before any spending.
- **Storm theme** (`explainer-storm`). Kit cloud width and glow radius now allow overshoot for full-bleed skies.
- **Verifier works for any episode length** (it previously assumed 15 s and 450 frames). Mixed-mode narration correlation is now measured over speech only, so intentional effects after the last word don't fail the check. Jobs rendered before per-word captions still verify.
- **Test timeout** raised to 20 s, fixing the recurring image-test flake.

## Story and science

Script A (82 words, 465 characters; alternatives in `stories/lightning-candidates.md`):
> A lightning bolt can be five times hotter than the Sun's surface. It begins inside a storm cloud, where strong winds toss ice upward. Ice crystals and soft hail collide and trade electric charge. Positive charge rises to the top. Negative charge sinks to the bottom. Then a faint channel of charge zigzags down, step by step. When it meets a spark rising from the ground, the air flashes white-hot. That blast of heat makes the air explode outward. We hear thunder.

Claims were checked against:
- **NOAA / National Weather Service:** about 50,000 °F, five times hotter than the Sun's surface.
- **NOAA JetStream and the NSSL primer:**
  - Graupel and ice-crystal collisions separate charge, with positive charge carried aloft and negative charge lower down.
  - A faint stepped leader zigzags down in roughly 50-yard steps.
  - A rising streamer meets it, the return stroke is the flash, and thunder is the air's explosive expansion.

Simplifications are documented. The video shows the common negative cloud-to-ground case; most lightning stays inside clouds, and the charging mechanism is still debated.

## Word-anchored timing

After the real take, key moments were moved onto provider word timings:

| Visual | Spoken word |
| --- | --- |
| Hook bolt | "lightning" |
| Updraft arrows | "winds" |
| Ice rising | "toss ice upward" |
| Sparks | "collide" |
| Negative charges and label | "Negative" |
| Leader steps (final two) | "step by step" |
| Streamer | "spark rising" |
| Main strike, flash, boom, shake | "flashes" |
| Shockwaves | "blast" |
| Thunder label | "thunder" |
| Thunder roll | just after "thunder" |

The timeline was cut from 42 s to 38 s at no cost, leaving 3.3 s of ending room instead of 7.3 s.

## Verification

- TypeScript pass. Vitest **351 passed / 22 files** (8 new episode tests). Both bundles build.
- **Regression:** 21 lossless frames from the M2.7 tree and this branch are byte-identical (generic demo, motion prototype, style C, kit volcano, water cycle, planet).
- Final episode, all checks pass:

  | Check | Result |
  | --- | --- |
  | Format | H.264/AAC, 1080 × 1920, 30 FPS, 1,140 frames, 38.000 s, no unintended black frames, ordered timestamps |
  | Scene cuts | Within 10.7 ms (mean 7.6 ms) of their phrase cues; no exceptions |
  | Captions | All 82 words captioned in 14 word-highlighted cues |
  | Approved narration | Hash unchanged |
  | Narration correlation (speech only) | 0.917 |
  | Speech-band clarity per phrase | Minimum 0.950 (the boundary), median 0.97 |
  | Loudness | −14.8 LUFS integrated; true peak −2.2 dBTP |
  | Music ducking | 16.4 dB |
  | Ending | Fades to −83.5 dBFS |

- The M2.6 and M2.7 volcano jobs still pass the updated verifier.
- **Paid usage:** exactly one ElevenLabs request (465 characters, request `7Kq7Rp7MYFHZ3LzjPjeP`), recorded in `jobs/m3-0-narration/paid-request-ledger.json`. Generated narration and video are not committed.

## Honest assessment

- **The pipeline works end to end for a new topic**, and the approval gate held: nothing was spent until you saw the animatic and ran the command.
- **Visual quality is consistent with the volcano.** The bolt, flash and charge-separation scenes read well at phone size.
- **The storm cloud is still a large, fairly flat mass.** Cloud art is the weakest element, and the same code-art ceiling noted in M2.6 applies.
- **One phrase sits exactly at the 0.95 clarity threshold:** "Ice crystals and soft hail collide", under the spark pops. It passes, but a slightly quieter pop would give margin.
- **The narration estimator ran 7% long.** That is safe (it never under-budgets the timeline), but expect the real take to come in shorter.
- **Word anchoring was manual.** I read the provider word times and edited frame numbers by hand.

## Limitations

- Effect timings are frame numbers in the storyboard; re-narration requires retiming (manual today).
- Only negative cloud-to-ground lightning is shown.
- Mono mix; generated music bed (a licensed track can be passed with `--music`).
- Renders were made in the Linux VM with Liberation Sans in place of Arial; render on your Mac for final review.
