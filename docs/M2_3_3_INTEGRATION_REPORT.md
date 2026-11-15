# M2.3.3 — Narration integration and final volcano video

Approved input: Bill L. Oxley, ElevenLabs voice `iiidtqDt9FBdT1vfBluA`, model `eleven_multilingual_v2`, 28 words / 169 characters, 13.1425 seconds. This milestone reuses the previously approved PCM performance and timing. **Zero new synthesis, paid alignment, Sound Effects or image-generation requests.**

## Output

Job: `jobs/volcano-m2-3-3-final/`.

- `output/narrated-animation.mp4` — 1080×1920, 30 FPS, 450 frames, exactly 15.000 seconds, H.264/yuv420p video and 48 kHz mono AAC.
- `captions/provider-character-timing.json`, `word-timing.json`, `captions.json` — original provider alignment, all 28 word intervals and five rendered segments.
- `chronological-contact-sheet.png`, `transition-contact-sheet.png`, `motion-audit-contact-sheet.png` — decoded actual MP4 samples, clearly numbered.
- `previews/opening-hook.mp4`, `explanation.mp4`, `eruption-payoff.mp4`.
- `reports/render-report.json`, `timing-report.json`, `verification-report.json`, `preservation-report.json`, `visual-only-compatibility-report.json`; root `compatibility-report.json`.

Render + encoding + mux: **40.78 seconds**, excluding bundle/verification. The approved WAV is copied without modification and padded only during final AAC mux to produce an intentional 1.8575-second silent ending. No narration edits, speed-up, clipping or source truncation. WAV SHA-256: `bd2653de8af3eaac0abf20c0a63c91e53bc6486303fcd589b5cbf84430531249`.

## Timing and visual behavior

All 169 provider character timestamps match the exact approved text and map to 28 words. Word starts/ends determine the five authored caption segments. Starts round upward to the next 30-FPS frame, with less than one frame of timing quantization. Existing caption layout, two-line limit, safe margins and restrained fades are reused. Provider timestamps are a timing source, not perceptual ground truth; final playback review remains appropriate.

The five existing generic templates, approved illustrations and 90-frame scene durations are unchanged. No topic-specific React component or visual redesign is introduced. Narration starts at the timeline origin with the source's natural onset and ends before the video finishes. Narration/caption boundaries can lead the next visual scene: setup 20 frames, rise 26, eruption 23, closing 38 (maximum 1.267 seconds). Closing narration overlaps the eruption image before the final-summary scene. This is documented rather than concealed by retiming approved visuals or changing the voice. Review educational pacing during playback. The compact plume and schematic cutaway are inherited visual limitations.

Inspected actual decoded whole-second and transition sheets: exterior → underground magma → rising conduit → eruption → final exterior. Captions are mobile-readable, do not cover the central volcano, and disappear after speech before the silent finish. Contact-sheet labels represent expected timeline metadata, not automated scene recognition. Independent audio-input listening is unavailable in this tool surface; the user has already approved the source narration, and final perceptual synchronization/visual approval is not claimed.

## Verification

TypeScript, **243 Vitest tests / 15 files**, and whitespace checks pass. Four new continuous-narration tests validate all-word coverage, provider timing/rounding, intentional uncaptained ending and mismatch rejection. Alignment validation moved into a pure module so the offline render path imports no TTS adapter and loads no credentials.

FFmpeg/FFprobe pass full decode, black-frame detection, dimensions, frame count/rate, H.264/AAC, exact video/audio/container duration, source integrity, safe caption bounds and all-word coverage. Actual decoded AAC is compared to approved PCM: correlation **0.999930**, signal-to-difference **38.48 dB**; the intentional ending is silent. This supports preservation of the approved performance through lossy encoding, not byte identity.

Regression: **15/15 lossless samples identical**: seven M2.1 generic-demo frames, three M1.2 planet-formation frames, and five M2.2.1 visual-only volcano frames. All 46 snapshotted protected paths (prior assets/videos and original/selected scripts) retain their hashes. The approved narration source hash is separately checked. No earlier media is overwritten.

## Source and Git scope

New generic scripts: `scripts/render-cached-story.ts`, `scripts/verify-cached-story.ts`; npm `story:render-cached` / `story:verify-cached`. Provider mapping now exports word intervals as well as caption cues. Source metadata SHA/text checks reject mismatched audio. Audio is assembled offline, with local asset copies only. Video verification does not contact ElevenLabs or OpenAI.

HEAD at task start was M2.1 (`a1e84941967e5bd7ef875d91e2cb68fa540afe6c`). The pending M2.2/M2.3 source, approved volcano assets, masks, JSON storyboards, audio/caption architecture, provider guards, tests and historical reports are prerequisites for this branch's reproducible source snapshot and are included. Source histories do not grant additional paid authorization or visual approval to the separate M2.2.1 refinement. No unrelated user changes are discarded.

Credentials, `.env`, generated WAV/MP3/AAC/media, jobs, caches and temporary outputs are ignored and excluded from the commit. `.env.example` contains empty credential placeholders and public voice/model IDs only. A staged-content scan checks actual credential values in memory without printing them. The approved local narration/MP4 must be copied separately on another machine; generated media is not distributed through Git.

The user's M2.3.3 instruction authorizes a milestone branch, commit and ordinary push to the existing remote. No force push, default-branch merge, tag or next milestone is part of this work. The final branch/hash/push result are reported in the task completion message to avoid self-referential commit metadata.
