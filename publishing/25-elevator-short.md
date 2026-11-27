# 25: No-narration Short A, "Taking the Elevator to Space 🛗"

- **Status:** rendered 27 Nov 2026 (`jobs/elevator-final-6`, 43.0 s, 9:16, software GL (`REMOTION_GL=swangle`), all verification checks pass: speech 0.97, −15.5 LUFS, silent ending; `scripts/check-dropouts.py` clean; 0 paid requests in the render). Not uploaded yet.
- **Upload folder:** `~/Downloads/gahanarka-upload/25-elevator-short/`: `taking-the-elevator-to-space.mp4`, `upload-info.md` (this sheet). **Slot: Mon 7 Dec, 9:30 PM IST** (approved 27 Nov); S15 (the 7-second atmosphere loop) moved to Mon 14 Dec.
- **Format test:** first Short without narration (live counter + Arka's reactions + one closing line), inspired by countdown/HUD Shorts. Compare stayed-to-watch with S23/S24 (narrated photo Shorts) and S4 Miranda (58.5%).
- **Narration:** one line, Arka E3, *"...I'll take the stairs."* (`jobs/elevator-arka-line`, ElevenLabs, 24 characters, run by Debabrata 26 Nov), padded to 39.6 s (`jobs/elevator-narration-2`).
- **Visuals:** drawn (paint-night). Commits 1ad16b3 → 9421bf0: Arka walks in at sunrise and presses ISS; live floor/height/time/air/temperature readout; 3D Burj Khalifa, natural Everest, shooting stars, northern lights; ISS close-up, Arka presses G, "Going down: 11 h 38 min", his line, then "Stairs: 119,714 floors".
- **Facts and sources:** `stories/no-narration-shorts-facts.md` (section A and the draft-2 additions).

## Title
**Taking the Elevator to Space 🛗**
(30 characters.)

## Description (paste as is)

```
What if the world's fastest lift never stopped? 🛗 At 21 m/s (the record lift in Guangzhou's CTF Finance Centre), you'd pass the top of Burj Khalifa in 39 seconds, Everest in 7 minutes, and reach space in about 1 hour 19 minutes.

Milestones:
• Burj Khalifa top, 828 m: 39 s (floor 237)
• Everest, 8,849 m: 7 min 01 s, air 31%, −42 °C
• Airliners, 10.7 km: 8 min 28 s
• Armstrong limit, 19.2 km: your tears and saliva would boil (not your blood)
• Shooting stars burn up at about 80-120 km
• Kármán line, 100 km: space begins, 1 h 19 min
• Northern lights glow at about 100-200 km
• ISS, about 419 km: 5 h 33 min, floor 119,714
• Going back down at 10 m/s: 11 h 38 min
• Or the stairs: 119,714 floors

Floors counted at 3.5 m each. Air shown as a share of sea-level pressure.

Sources: Hitachi, NASA, NOAA, FAI, EarthSky.
Animation drawn by our own renderer. Arka's line voiced with AI (ElevenLabs).
Music: "Singularity" by The Grey Room / Density & Time (YouTube Audio Library).

#Space #Elevator #Shorts
```

(The channel's default footer is added automatically.)

## Related video
S23 "The Moon Is Leaving Earth 🌕" (already public).

## Pinned comment

```
Going down takes 11 h 38 min because lifts descend slower (10 m/s). Would you take the stairs? 👇
```

## Tags
elevator to space, fastest elevator, how high is space, karman line, armstrong limit, burj khalifa, mount everest, iss, space facts, shorts

## Settings
Not made for kids · Science & Technology · Altered or synthetic content: No (cartoon animation; nothing realistic) · no paid promotion · captions are burned in (only the last line is spoken). Playlist: What If…?

## Compliance check
- [x] Facts checked (`stories/no-narration-shorts-facts.md`); Debabrata approved the idea and the voice line.
- [x] Narration on a paid ElevenLabs plan; music from `docs/MUSIC_SOURCES.md` (6-space-singularity, YouTube Audio Library).
- [x] Everything drawn by our renderer; no third-party images. Originality: inspired by the countdown/HUD format and Neal Agarwal's "Space Elevator" idea, but our own drawings, character, milestones list and ending.
- [x] Title ≤ 50 characters; the first second shows Arka walking into the lift, the live floor counter and "What if this lift never stopped?".
- [x] Frame check: earlier Mac GPU renders dropped Arka for single frames; final-6 rendered in software and `check-dropouts.py` is clean.
- [ ] Copyright check passed in Studio before scheduling.
