# M2.7 — Watchability pass

**Status:** implemented, rendered and technically verified. **Human viewing/listening review pending.**
**Branch:** `claude/m2-7-watchability` (based on M2.6 `4d81aca`). **Paid requests:** 0.

## Goal

Improve what viewers notice most and what the art alone cannot fix: sound, caption rhythm, motion feel and the first second. Everything is reusable pipeline capability. The kit volcano is the reference application.

## What was built

### 1. Word-by-word captions
- Provider word timings now travel with each caption cue (`words: [{text, startFrame, endFrame}]`).
- Caption style `highlight: "word"` colours the most recently started word with `highlightColor` and pops it slightly. Both themes opt in; the default remains phrase captions, so older renders are unchanged.
- The highlight colour must pass WCAG AA against the outline (tested).

### 2. Motion polish
- New easings `ease-out-back` (overshoot), `ease-in-back` (anticipation) and `ease-in-out-back`, available to camera keyframes and all effects.
- Any track key can carry its own `ease` for the segment arriving at it. Keys without one keep the legacy smoothstep, bit for bit.
- Pill labels can `pop` in, scaling with overshoot as they fade in.
- Applied to the volcano:
  - **Hook:** opens tight on a trembling, glowing crater, then springs back to the full volcano (overshoot).
  - **Cutaway:** the halves dip inward before splitting (anticipation).
  - **Eruption:** the cone squashes before the burst and stretches past rest after it.
  - **Labels:** they pop in.

### 3. Sound design (`src/audio/synth.ts`)
- Seven procedural effects synthesised in TypeScript: `rumble`, `whoosh`, `boom`, `pop`, `bubble`, `sizzle`, `riser`.
- A **generated music bed**: a soft A minor–F–C–G pad with chord crossfades, a gentle pulse and a short delay space.
- No samples, no network and no licence needed. Output is deterministic and byte-identical on any machine.
- Scenes declare `sounds: [{sound, frame, gainDb}]` at scene-local frames; they are resolved to absolute times after narration scheduling, so they follow the voice if timing changes.
- The storyboard `audio` block selects the music (`generated-pad` or `none`), music gain, ducking ratio and loudness target.
- **`--music <file>`** replaces the generated bed with a licensed track (looped or trimmed to length, faded out). The path was tested with an MP3.

### 4. Mix stage (`scripts/lib/mix-audio.ts`)
- **Ducking:** narration plus music side-chain-ducked under the voice, plus effects at their offsets.
- **Loudness:** EBU R128 measurement, one linear gain to the target (−14 LUFS, YouTube's reference), then a latency-compensated peak limiter. A dynamic normaliser would change the voice/effects balance.
- **Stems and report:** stems are kept (mix before loudness, ducked music, un-ducked music reference), and `mix-report.json` records everything.
- **Legacy path:** storyboards without sound or music take the exact narration-only mux as before.

### 5. Verification upgrades (`verify-cached-story`, mixed mode)
- **Loudness:** within ±1 LU of target. **True peak:** at most −1 dBTP after AAC.
- **Music ducking:** at least 6 dB lower during speech than the un-ducked reference.
- **Narration clarity:** per-phrase correlation of at least 0.95 with the approved performance, measured in the speech band (200 Hz–4 kHz).
- **Narration presence:** whole-track correlation above 0.9.
- **Ending:** fades to silence.
- **Sound cues:** all fall inside the timeline.

## Results (kit volcano)

| Measure | Result |
| --- | ---: |
| Integrated loudness | −14.6 LUFS (target −14) |
| True peak | −2.3 dBTP |
| Music ducking under speech | 18.1 dB |
| Narration clarity per phrase (speech band) | 0.985 / 0.967 / 0.977 / 0.988 / 0.987 |
| Sound cues | 11 across all five scenes |
| Ending level | −83 dBFS |
| Render + encode (Linux VM, 3 × 150 frames) | 99.3 s (M2.6: 85.3 s) |

The first mix failed the new clarity check: hook 0.83, payoff 0.79. The fixes were:
- Re-staged effect gains so effects sit about 10 dB under the voice.
- Steeper filtering on the boom's noise.
- Moved the riser off the payoff line.
- Replaced dynamic loudness normalisation with linear gain plus a limiter.

The check caught real problems, which is the point.

Comparison material (local, git-ignored):
- `jobs/m2-7-comparison/kit-vs-watch-phone-size.mp4`: M2.6 and M2.7 side by side, with M2.7 audio.
- `jobs/m2-7-comparison/review-sheet.png`: key frames plus the mix waveform.
- Full video: `jobs/m2-7-watch/output/narrated-animation.mp4`.

## Honest assessment

- **This should be the largest perceived jump since M2.4.** Sound and word captions change how the clip feels more than any art change so far. Treat that as my expectation until you listen; I cannot hear the audio myself and judged it from measurements and waveforms.
- **The music bed is a functional placeholder.** It is pleasant and safe, but a licensed track from the YouTube Audio Library will sound more produced. `--music` is ready for one.
- **The effects are synthetic.** The boom, whoosh and pops read clearly. The rumble and sizzle are basic, so recorded or licensed effects could replace them later through the same cue system.
- **The motion polish is subtle by design**, and it is noticeable in playback, not stills.

## Verification

- TypeScript pass. Vitest **343 passed / 21 files** (323 existing + 20 new). The word-caption tests use the local approved alignment file and are skipped where it is absent. Both production entry points bundle.
- **Regression:** 36 lossless frames from the M2.6 tree and this branch, in the same environment, are byte-identical. That covers six legacy storyboards × 5 frames, planet × 3, and 3 narrated frames with legacy box captions, proving the caption renderer change is invisible when highlighting is off.
- Kit volcano: `verify-storyboard` and mixed-mode `verify-cached-story` pass all checks (H.264/AAC, 1080 × 1920, 30 FPS, 450 frames, 15.000 s, scene boundaries unchanged, 28 words in 5 cues).
- Approved narration, script, provider timing and painted assets are untouched. Zero paid requests; all audio is generated by code.

## Known limitations

- The music bed is synthetic and short-form. It is not a substitute for a real score.
- Effect gains are hand-staged per storyboard; there is no automatic effects ducking yet.
- Clarity checks prove the voice is not masked; they do not judge taste. Listening review is required.
- The water-cycle demo's labels now pop (shared generator), but it was not re-rendered and has no sound.
- The mix is mono, which is fine for Shorts but limiting for long-form.
