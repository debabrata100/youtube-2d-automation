# Visual lessons for long episodes (from Ep 4 "What If the Moon Disappeared Tonight?")

Apply these in the **first** storyboard pass of every new episode, so review rounds go to taste, not to fixes we already know.
Source: the M3.8 review commits (7ee7d03, ffdb8f1, 8cdc6fb, 9fb412b, 803ed1d, 9dc9186) and Debabrata's notes on the Moon Shorts.

## Readability
- **Night page notes are warm yellow** (`#ffd25e`, 9.7:1 contrast on navy). Red (`#ff5a4a`) only for myths, warnings and danger, so red always means "wrong" or "bad".
- **Signs and labels are readable from the first frame** of the shot, not popping in late (m7 fix).
- **Text never sits on top of a photo or busy drawing.** Put photo captions below the photo, with real contrast (the Miranda Short's "20 km" note was hard to read over the NASA photo).
- **Labels sit under/next to the object they name** (Theia's label under Theia), and props that need a caption get one (clock captions).
- **Light ink for line-art props on the night page** (`LIGHT_INK` set), so they read on navy.

## Composition
- **Bigger drawings, more spacing.** Main props are large enough to read on a phone; no cramped clusters.
- **Chapter header fixed at the top centre** in every non-Arka shot, so viewers always know where they are.
- **Arka shots stay simple:** Arka on one side, one prop, one short punchline note.
- **Rotations happen about the object's own centre** (set `anchor`), never swinging around the page corner.

## Timing and motion
- **Every change lands on its word** (word anchors): swaps (sky goes out), list items (each loss in m68 animates on its word), counters, pops.
- **At least one moment of real motion per chapter** (the lion's pounce, Theia's impact, the Moon drifting away). Keep anything violent non-graphic.
- **State changes are swaps between two layers** at the exact word (lit Moon → ghost Moon), not slow fades that blur the moment.

## Brand
- **Brand sting after the hook** (from Ep 5): `recipes.brand_sting()` adds a Sun, the GAHANARKA wordmark and the tagline with one whoosh, about 2.5 s, right after the cold open's question. Make room with a ~2.6 s gap in the narration (`scripts/cut-narration.py`, free). Never in Shorts. Check the retention graph at the sting after launch.

## Proof and honesty
- **Real photos as proof** where we have them (NASA/NOAA public domain), with credits in the upload sheet.
- **Name the study on screen** when a fact rests on one (for example "Packer et al. 2011").

## Sound
- **One licensed track per chapter**, in a different order from the previous episode, with short music dropouts on the biggest moments.
- **End card: 12 seconds** after the last line (YouTube end-screen elements need 5-20 s).

## Process
- **Check a mid-beat still for every shot** before rendering (Ep 4 reached 98% coverage with no weak shots left).
- Shorts: notes get an explicit `pos=`, kit size ≤ 1, at most 12 caption phrases per beat.

## Text colour on night pages (Voyager Shorts, 20 Nov 2026)

- No red text on the navy night page: low contrast and it reads as an error. Titles and big numbers in warm gold (#ffd25e), handwritten notes in pale sky blue (#a9d8ff), small labels in light ink.
- Red stays only where it means something (a failure cross). Comparison bars use amber, not red.
- Shorts: keep the brand tag top-left; the Shorts player puts its own buttons top-right.
