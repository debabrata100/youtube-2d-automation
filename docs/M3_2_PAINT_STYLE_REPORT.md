# M3.2: Hand-drawn ("Paint Explainer") style prototype

_2026-11-15 · branch `claude/m3-2-paint-style` (stacked on M3.1 `61b819a`) · no paid requests_

## Why

The user supplied four reference videos: Alan Becker, two from Kurzgesagt, and The Paint Explainer. Of these, The Paint Explainer is the only style the engine could realistically produce (estimated at 65–75% before this milestone). That style is simple ink drawings on a white page, a stick-figure astronaut, red handwritten notes with arrows, pop-ins timed to narration, and hard cuts. This milestone builds the missing pieces and checks the result against the reference.

## What was built (all reusable and JSON-driven)

| Piece | Where | Notes |
| --- | --- | --- |
| Stick-figure rig | `src/engine/kit/figure.ts`, `FigureElement.tsx`, kit `figure` | 17 poses: stand, wave, point left/right, shrug, cheer, panic, scared, hands-on-hips, think, float, tumble, reach, cower, lie, plus walk and run as procedural cycles. Poses blend along the shortest angle over `blend` frames, starting at each key; keys can be word anchors. 9 faces: neutral, happy, shocked, scared, sad, dizzy, angry, smug, pain. Seeded blinks, a `shiver` setting, `facing`, and an `astronaut` outfit with helmet, suit tubes, chest panel and boots. |
| Drawn planet | kit `planet` | Base colour, wavy bands (gas giants, with optional spin), craters, ring drawn in front of and behind the disc, soft terminator shading, glow. |
| Hand-drawn ground | kit `terrain` | Outlined horizon with bumps, optional planet curvature, speckle texture and outlined horizon rocks. |
| Ink notes | annotation `variant: "ink"`, optional `color` | Handwritten text in marker weight, with an optional curved arrow and arrowhead. |
| `paint-notebook` theme | `src/engine/style/themes/paint-notebook.json` | White page, black ink, red notes, the Patrick Hand font, and **line boil**: a seeded noise displacement that redraws 8 times a second so lines wobble like hand drawing. Burned-in captions are off (`caption.enabled: false`) because the reference style uses none. Upload captions to YouTube instead. |
| Font loading | `src/engine/style/fonts.ts` + `fonts/PatrickHand-Regular.ttf` (OFL) | Bundled with webpack. Each frame waits for the font to load, so renders are deterministic. |
| 16:9 support | captions | Caption size now follows the shorter side of the frame, so 9:16 renders are unchanged and 16:9 captions are not oversized. Captions can be turned off per theme. |
| Test clip | `stories/mars-paint-test.json`, `scripts/authoring/build-mars-paint-storyboard.py` | 29 s, 1920×1080, 5 scenes, about 100 word anchors. The backdrop terrain appears and disappears on anchored words. Facts were checked against NASA, ESA, Space.com and Live Science: about 95% CO₂, pressure under 1% of Earth's, average about −60 °C (−80 °F), consciousness lasting about 10–15 s, exposed saliva boiling. |

## Result

The clip is at `jobs/m3-2-mars/output/narrated-animation.mp4`, with a silent planning narration and estimated timing. Contact sheet: `docs/m3-2/mars-clip-sheet.jpg`. Pose library: `docs/m3-2/pose-library.jpg`.

**Honest comparison with The Paint Explainer:**
- **Matches:** white page, black ink, red handwritten notes with arrows, the title at the top, stick figure with expressions, astronaut, CO₂ molecule, pop-ins on spoken words, hard cuts, wobbly line feel. A viewer would place it in the same genre at a glance. I'd put the match at roughly **80–85%**, up from 65–75%.
- **Gaps that remain:**
  1. Their planets are real NASA photos. Ours are cartoon discs. The engine can already place public-domain images, so this is an editorial choice.
  2. Their figure has wider, more comic mouths (open screams with teeth) and props (a hand at the mouth, motion lines). Our faces are smaller and gentler.
  3. Their titles use a heavy comic font. Patrick Hand thickened with a stroke is close but lighter.
  4. They use props: lander, rocket, flames, a cutaway Neptune. We have none yet beyond the astronaut.
  5. Our 29 s clip has no real voice yet, and in this format the writing and voice carry most of the appeal.

## Engineering notes

- **Render cost:** line boil is expensive. In this VM, frames take about 0.57 s each in one process, against about 0.10 s for the lightning episode. Three parallel chunks rendered the 870 frames in about 4 minutes. An 8-minute video (14,400 frames) would take about 40 minutes in 4 parallel chunks here, and less on the Mac. Possible optimisation: since the boil only changes 8 times a second, frames could be cached per boil tick. This is optional.
- The Mars clip's voice checks fail **by design**, because the narration is a silent planning track (same as the M3.0 animatic). The visual and timeline checks pass.
- `lie` is a pose made for "falls down" moments. Pair it with a layer `y` drop of about 0.45 × the figure's height. A future helper could compute the drop automatically.

## Verification

- TypeScript passes. Vitest: 371 tests passed, 371 total, across 25 files; 7 are new.
- Both production bundles pass.
- Lossless regression: 22 of 22 frames are byte-identical to M3.1. That covers 19 legacy frames plus 3 frames of the captioned lightning board, which proves the caption-size change leaves 9:16 output unchanged.
- Paid requests: 0. Approved narration, assets and captions are unchanged.

Details: `docs/M3_2_VERIFICATION.json`.
