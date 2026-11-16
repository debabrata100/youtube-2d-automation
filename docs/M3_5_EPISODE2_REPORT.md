# M3.5 — Episode 2: "What happens if you take your helmet off in space?"

_2026-11-16 · branch `claude/m3-5-helmet-off` (from `claude/m3-4-shorts`) · **complete**. Human viewing and listening review is pending._

## Delivered

| Item | Where | Notes |
|---|---|---|
| Main episode (16:9) | `jobs/m3-5-final/output/upload/` (gitignored) | 88 s, 9 scenes, narrator + Arka. sha256 `56c0fdd3…`. Captions SRT, thumbnail. |
| Short (9:16) | `jobs/m3-5-short-final/output/upload/` | 27 s, 6 scenes, hook-first script, burned-in word captions, real-time countdown. sha256 `d7f0cb56…`. |
| Multi-voice narration | `src/audio/multivoice.ts`, `scripts/synthesize-narration.ts` | `phraseSpeakers` on beats; one take per speaker, cut at speaker turns, joined with shifted timings; other voices level-matched to the narrator (Arka −2.2 dB). `--resume` reuses takes. |
| Mascot and kit | `src/engine/kit/*` | Gold astronaut Arka. New pieces: counter (held or real-time ramp), MYTH stamp, blackout vignette, space station with airlock, loose helmet, doodle stars, vacuum chamber, outward arrows. Figure helmet on/off, skin flush, puffed/tongue/asleep faces, layer rotation. Tick and heartbeat SFX. |
| Story and fact check | `stories/helmet-off*.json`, `stories/helmet-off-notes.md` | Every claim has a source. The main-episode counter is narrative; the Short's runs in real time. |
| Generators | `scripts/authoring/build-helmet-off*-storyboard.py` | Word-anchored. Share `paintkit.py` with the Titan boards. |

## Verification

- `tsc` clean. `vitest`: 30 files, 404 tests pass.
- Main episode, all checks pass:
  - −15.0 LUFS, −2.3 dBTP;
  - phrase clarity at least 0.95 on 55 phrases;
  - exact decoded timestamps;
  - all words captioned.
- Short, all checks pass: −14.7 LUFS, clarity at least 0.95.
- Decoded frame review covered the counter steps, Arka's three entrances, the blackout keeping the counter readable, the 1966 flashback and helmet back on.

## Paid usage

| Request | Characters | Result |
|---|---|---|
| Narrator, main #1 | 1,078 | Response lost to a validation bug (see below). Charged. |
| Narrator, main #2 | 1,078 | Response saved, then recovered offline after the fix. |
| Arka, main | 78 | OK |
| Narrator + Arka, Short | 321 + 17 | OK |
| **Total** | **2,572** | Planned: 1,494. Excess: 1,078, from the bug. |

## Bugs found and fixed (all reusable)

1. **Paid takes discarded on long audio.** The base64 check was a regex with a repeated group. It overflowed V8's stack on about 5 MB of base64 (roughly 80 s of audio). Titan (about 62 s) was just under the limit.
   - Fixed with a linear check.
   - The raw response is now saved before validation, and a saved response can be recovered with no new request.
   - Overlapping provider timings are repaired.
   - The timeout is now 300 s.
   - The ledger records the failure detail.
2. **Verifier crashed on videos over about 87 s.** It decoded audio into a 4 MB buffer.
3. **Refused runs created the output folder**, which blocked the next run.

## Honest quality assessment

- **Works:** a clear hook, a running countdown with tension (ticks, heartbeat, blackout), myth stamps every few seconds, a recurring mascot with personality, and a satisfying ending.
- **Weaker:**
  - Figures still float in place for most scenes. More camera moves and secondary motion would help.
  - The main episode has no burned-in captions; the SRT is uploaded instead.
  - The thumbnail is built from a frame, not designed.
- The take was not listened to by a human yet: please listen to both before publishing.
