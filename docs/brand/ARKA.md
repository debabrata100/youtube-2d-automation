# Arka: character reference

![Arka reference sheet](arka-reference-sheet.png)

Arka is Gahanarka's mascot: a gold stick-figure astronaut. The name is Sanskrit for "sun".

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
