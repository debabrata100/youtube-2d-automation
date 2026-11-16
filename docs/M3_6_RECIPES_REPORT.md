# M3.6 — Scene recipes and camera language

_2026-11-16 · branch `claude/m3-6-recipes` (from `claude/m3-5b-thumbnails`) · **complete**. Human viewing review of the v2 render is pending._

## What changed

Episodes are now written as **plans**: per beat, a recipe plus the creative choices. The creative choices are:

- who is on stage;
- poses and faces on word anchors;
- the notes;
- the props.

Everything mechanical is derived by `scripts/authoring/recipes.py`, for 16:9 and 9:16.

| Capability | How it works |
|---|---|
| Layout solver | Characters go to named stage slots. Notes are placed automatically in free space, never over a character, prop, earlier note, MYTH stamp, the counter or the Shorts UI. Notes follow reading order (top to bottom). If there's no space, **generation fails** with the scene and the note named, instead of rendering an overlap. |
| Exact text widths | `patrick-hand-widths.json` stores the font's real character widths, so there's no guessing (my old estimate wasted up to 33% of space). |
| Camera presets | `settle` (eases out of a 5% zoom), `push` (slow zoom across the beat), `punch` (quick zoom on a word), `drift` (sideways pan). Zoom happens *about* the focus character, so it doesn't jump across the frame. That bug showed in the first pass: the engine's `focus` is a look-at point. |
| Idle motion | Floating drift, breathing, entrances (pop, slide from left or right) and reaction jolts. |
| Sound cues | Whoosh on cuts, pops on notes (silent for name labels), a thump on MYTH stamps, plus per-scene extras. |
| Recipes | `explain`, `myth_bust`, `comparison`, `countdown` (scene counter above a dimmer, heartbeats, push-in), `flashback`. |

## Test: Episode 2 rebuilt from plans

| | Hand-placed (M3.5) | Recipe plan (M3.6) |
|---|---|---|
| 16:9 generator | 237 lines | **82 lines** |
| Short generator | 149 lines | **45 lines** |
| Total | 386 lines | **127 lines (−67%)**, plus the 376-line reusable `recipes.py` |
| Notes placed | by hand | 24 + 8, auto-placed; 2 pinned in the Short's moving rescue scene |

**Full 16:9 v2 render** (`jobs/m3-6-v2-final/output/helmet-off-recipes-v2.mp4`, gitignored): all checks pass at −15.0 LUFS with clarity at least 0.950. It uses the same narration with 0 paid requests.

The solver caught 4 real layout conflicts while building, which a hand-placed version would only reveal in a render:

- the counter's zone was too big;
- the thermometer blocked the note column;
- the chamber left no room for the caption;
- the Short's rescue scene had no static free space.

## Fixes found on the way (reusable)

- **Sound-cue limit:** the mixer allowed only 48 cues. It now allows 400, since long anthologies need hundreds.
- **Text and stamp layout:**
  - Notes keep reading order.
  - Stamps get reserved space.
  - Name labels don't pop, because they often land on dialogue; this kept Arka's first line clear.
- **Rendering memory:** four parallel renders of darkened scenes crashed Chromium on the 4 GB VM. Use 2 in parallel for dimmed scenes.

## Honest assessment and limits

- **Visual quality** is about equal to the hand-placed version. It isn't better yet. Notes sometimes land in slightly less designed spots than a person would choose.
- **Camera moves are subtle.** They add life but aren't dramatic.
- **The solver is static:** it doesn't know when a character moves. Moving scenes need pins (`Note(pos=...)`) or careful staging. The next step is time-aware obstacles.
- **Old generators are still there:** `build-helmet-off*.py` remain until we decide which version ships; the M3.5 final was rendered from them.
- **Python plans have no type checking:** mistakes surface at generation, which is fast, or at storyboard validation.
