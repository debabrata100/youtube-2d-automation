# M2.3.4 — pre-change timing and overlay audit

Baseline: 1936889dfb60df8adfde5b9bc040f771b57875f1, branch codex/m2-3-3-elevenlabs-captions. Clean working tree at task start. This audit was written before implementation edits.

The permanent AI-GENERATED NARRATION banner originates from an unconditional div in src/captions/renderer.tsx. The same div displays MOCK TEST AUDIO for synthetic test audio. Both are development/provenance disclosures rather than educational labels. Captions are a separate div and audio is a separate Remotion Audio component. No layout space is reserved by the absolutely positioned banner; omitting it requires no replacement spacer.

Other text: generic scene headlines/kickers are intentionally hidden when narration captions are present. LayeredSubject renders educational Magma chamber and Conduit annotations with connectors; these must remain. Invisible Img loading gates are not visible debug overlays. The contact-sheet frame/scene labels are external review artifacts, not production overlays. No other visible debug/prototype overlays were found in the active production composition.

The root composition builds Sequences from storyboardTimeline(), which simply accumulates durationFrames. The source volcano storyboard has five 90-frame scenes and an 8-frame crossfade. Audio/caption timing is computed independently from provider character alignment by captionsFromProviderTiming(). It never changes scene durations. Thus accurate subtitles coexist with late visual scene starts.

| Scene | Old frames (end exclusive) | Spoken caption start | Old start lag |
| --- | --- | --- | --- |
| Exterior / hook | 0–90 | 0 | 0 |
| Magma accumulation | 90–180 | 70 | 20 frames / 0.667 s |
| Magma rise | 180–270 | 154 | 26 frames / 0.867 s |
| Eruption | 270–360 | 247 | 23 frames / 0.767 s |
| Summary | 360–450 | 322 | 38 frames / 1.267 s |

These values compare nominal scene starts with rounded caption starts. Maximum is 1.267 s; mean is 0.713 s including the opening, or 0.892 s across the four transitions. Crossfade completion occurs later still. Exact new comparisons must use unrounded provider phrase timestamps and distinguish transition start, midpoint and completion.

Layer animation keys and subject timeOffset values are authored in a 90-frame clock (internal group resumes at frame 90; active group resumes at frame 90 in the summary). Changing durations without adapting this clock would either cut off or reset animation. Add opt-in normalized animation-clock metadata while retaining old behavior for plans without it. Camera endpoints already support arbitrary scene durations. The final scene's old camera has identical endpoints and a 60-frame hold; molten brightness and ash opacity still animate. A minimal opt-in camera pull-back can improve the silent ending without changing artwork or adding audio.

Approved input remains 13.1425 seconds / 28 words / 169 characters. The final video remains 450 frames, with a natural 1.8575-second silent ending. No new paid services or image generation are needed.
