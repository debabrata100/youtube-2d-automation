# M3.3: Hand-drawn pilot episode "The Only Place You Could Go Outside Without a Spacesuit" (Titan)

_2026-11-15 · branch `claude/m3-3-paint-pilot` (from `main` @ `cae7e60`, tag `v0.3.2`) · **complete**: stage 1 (free work and animatic) and stage 2 (one approved paid narration and the final render). Human viewing and listening review is pending._

## Stage 1: delivered (no paid requests)

| Piece | Where | Notes |
| --- | --- | --- |
| Pilot script | `stories/titan-pilot.json`, `stories/titan-pilot-notes.md` | 8 beats, 167 words, 921 characters, estimated at about 80 s. Every figure is checked against ESA, Britannica, the Planetary Society, Space.com and JPL, with sources and simplifications listed in the notes. |
| Figure accessories | kit `figure.accessories: [{item: mask \| coat \| wings, from, until?}]` | The mask has a hose and tank, the coat a hood and quilted panels, the wings feathers along each arm that follow the pose. Each appears and disappears on word anchors. |
| Flapping flight | pose `flap` | A procedural wing-beat cycle with body bob. |
| Comic faces | `scream` (open mouth, tongue, teeth), `grin` (wide toothy smile, happy eyes) | 11 faces in total. |
| Props | kit `prop`: `thermometer` (level animates on anchors), `pressure-arrows`, `motion-lines`, `exclaim`, `question`, `check`, `cross` | |
| Raindrops | particle `shape: "drop"` + `outline` | |
| Caption files | `src/captions/srt.ts`, `npm run captions:export -- <job>` → `output/captions.srt`, `captions.vtt` | For uploading to YouTube, since the hand-drawn style has no burned-in captions. |
| Line-boil speed-up | `src/engine/style/ink.ts` + 4 seamless noise tiles | Tiled noise images plus a tighter filter region replace per-frame `feTurbulence`. That is about 20% faster on line-boil frames (60-frame benchmark: 15.6 s → 12.7 s). The filter itself remains the main cost: about 8 s of the 12.7 s goes to the filter pass. |
| Long-episode fix | `scripts/verify-storyboard.ts` | The timeline-audit frame decode failed on episodes over about 60 s because ffmpeg's `select` expression grew too long. It now decodes in batches of 40. |
| Storyboard | `scripts/authoring/build-titan-pilot-storyboard.py` → `storyboards/titan-pilot.json` | 16:9, 8 scenes, 235 word anchors, and no hand-timed story moments. The generator takes the final duration as an argument, so after narration one command refits the timeline. |
| Animatic | `jobs/m3-3-animatic/output/narrated-animation.mp4` (82 s, silent planning narration) + captions | `docs/m3-3/titan-animatic-sheet.jpg` |

## Animatic review (honest)

- **Works:** the story reads without sound. Each beat has one clear visual joke or diagram: the "no spacesuit?!" hook, the pressure arrows, the nitrogen molecules with "oxygen: 0%", the falling thermometer, the coat appearing, flapping flight, slow methane rain next to fast Earth rain, the sinking swimmer, and the closing checklist. The figure, accessories, props and notes all come from reusable parts, and no topic-specific engine code was written.
- **Weaker:**
  - Most scenes are one figure plus notes on a plain ground, so the frames are visually similar. The reference channel varies its compositions more, with close-ups, cutaways and photos.
  - The lake is cartoon blue. Real methane lakes would read darker.
  - The flying moment is short. With a real voice it may need a longer hold.
  - In the 9:16 sense the frames are well filled, but at 16:9 the right half is often empty.
- **Comedy timing can only be judged with the real voice.** That is the point of stage 2.

## Render cost (this VM)

The 2,460-frame animatic took about 27 minutes in 4 parallel chunks: 0.6–1.9 s per frame per process under contention. Frames with the lake and particles are the slowest. Expect several times faster on an Apple Silicon Mac. Rendering time is now the largest practical cost of longer episodes, and a native Mac render is recommended for finals.

## Stage 2: narration and final (done)

- **Narration:** one ElevenLabs request, run by the user after approval. 921 characters, request `jHzMXb3BzHMlvlj6xaO7`, 61.7 s, sha256 `01bd1ca1…`. The ledger records 1 attempt that succeeded, with no retries.
- **Refit:** `build-titan-pilot-storyboard.py 64` gives a 64 s timeline (2.3 s of ending room). All 233 anchors re-resolved to the real word timings with no manual retiming. Two layout fixes were made after previewing with the real take: the flight is lower so it clears the title and notes, and the rain starts below the title.
- **Mix fix:** the first mix failed the speech-clarity check. "There's a catch." scored 0.86 and "flap, and actually fly." scored 0.79, because pops, whooshes and a riser sat on top of the words. The sound effects were made quieter (pops −21 dB, cut whooshes −24 dB, risers −26 dB) and the duplicate whoosh on "flap" was removed. Only the audio was remixed; the video frames were reused.
- **Final:** `jobs/m3-3-final/output/narrated-animation.mp4`, 1920×1080, 30 fps, 64.0 s, 14.4 MB, sha256 `9883336000b9…`. Captions are in `output/captions.srt` and `.vtt`. Contact sheet: `docs/m3-3/titan-final-sheet.jpg`.
- **Checks:** all 32 checks in `verify-cached-story` (mixed mode) pass:
  - Loudness: −14.9 LUFS, true peak −2.3 dBTP, loudness range 2.9.
  - Ducking: 17.4 dB.
  - Speech: correlation 0.987, lowest phrase clarity 0.955.
  - Timing: largest cue deviation 15.7 ms.
  - 41 sound cues.
- **Finding: the timing estimator was badly off for this take.** It predicted 80.2 s; the real take was 61.7 s, so the estimate was 30% too long. For lightning it had been 8% too long. This voice reads short punchy lines much faster than the volcano take the estimator was calibrated on. Planning still worked because anchors absorb the difference, but scene lengths and the story duration had to be refitted. Next time, recalibrate the estimator from the three approved takes, or measure the voice's pace on a short sample.

## Verification

- TypeScript passes. Vitest: 379 tests passed, 379 total, across 26 files; 8 are new.
- Both production bundles pass.
- Lossless regression: 22 of 22 frames are byte-identical to `main` (19 legacy frames plus 3 captioned lightning frames).
- The Mars test clip from M3.2 will render with slightly different boil noise because the tiles replace `feTurbulence`. This is intended and that clip is not protected.
- Paid requests: stage 1 had 0; stage 2 had 1, the approved narration.
- After the refit, the Titan board test resolves anchors at the take's measured pace (≈210 wpm estimate).
