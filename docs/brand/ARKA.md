# Arka: character reference

![Arka reference sheet](arka-reference-sheet.png)

Arka is Gahanarka's mascot: a curious girl astronaut in a gold suit, named after the Sun (Arka is Sanskrit for "sun").

## Who Arka is (decided 19 Nov 2026)

- **She/her.** Arka is a grown-up woman (around thirty in voice and manner). Her voice from M1 on is **Arka D2** (ElevenLabs Voice Design, `TL9f5lGrdeX5wHMushRC`, chosen in a blind test on 21 Nov 2026 with the grown-up positioning); Eps 2-5 used Jessica (`cgSgspJ2msm6clMCkdW9`). The switch happens at the start of the new "thought experiment" series, as decided on 20 Nov. **22 Nov:** D2 sounds angry to Debabrata; a new candidate **Arka E3** (`cZLjGmrtLimQNbJ9cosF`, warm and curious, grown-up) is saved next to D2. Which one voices M1 is Debabrata's call, decided later (see `docs/VOICE_LICENSING.md`).
- **Voice backup plan.** D2 is private to our account, so no Voice Library owner can withdraw it. Keep the recorded takes (`jobs/avt-d2`, later `jobs/*/audio/takes/arka.wav`) as the reference if it ever had to be recreated with Voice Design (prompt in `docs/VOICE_LICENSING.md`).
- **Role:** she asks the questions viewers are thinking, makes the jokes, and from Ep 5 on ends each episode with the next question (see `docs/CONTENT_PLAN.md`).
- **In scripts:** the narrator calls her by name ("Sorry, Arka"); use "she" in descriptions, comments and docs.

## Why this sheet is the canonical design

- **Who made it:** the sheet is drawn by the channel's own animation code (`src/engine/kit/FigureElement.tsx`), the same component the videos use. No AI imagery is involved, so the character rests on human-authored work.
- **Thumbnails:** the AI-generated Arka in earlier thumbnails (OpenAI, M3.5b) is a variation, not the reference. Render Arka for future thumbnails from our own code, and use AI only for backgrounds and effects.
- **History:** git keeps the dated record of the design's development.

## Regenerate

```
npx tsx scripts/brand/arka-sheet.tsx docs/brand/arka-reference-sheet.svg
rsvg-convert docs/brand/arka-reference-sheet.svg -o docs/brand/arka-reference-sheet.png   # needs the Patrick Hand font installed
```

## Specification

- **Colours:** suit gold `#e8b84a`, visor `#ffe6a3`, theme ink outline, white face.
- **Poses:** stand, wave, point, think, shrug, cheer, float, panic (plus the other `POSE_IDS` in `src/engine/kit/figure.ts`).
- **Expressions:** happy, grin, shocked, smug, sad, dizzy (plus the other `FACE_IDS`).
- **Helmet:** on by default; off for close-ups and expressions.

## Where Arka is used on the channel

- **Profile picture** (since 19 Nov 2026): `arka-watermark.png` (600×600), replacing the gold "G".
- **Video watermark:** still the older stick-figure `jobs/branding/gahanarka-watermark-150.png` (as of 19 Nov 2026).
