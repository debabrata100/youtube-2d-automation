# Visual checklist: storyboard every shot right the first time

Use this on every new long episode and Short, from the **first storyboard pass**, before any preview stills are sent for review.
It comes from Debabrata's review of Ep 5 "If the Sun Disappeared, Even the Air Would Fall" (21 Nov 2026), where 20 fixes were
found after the full render. Each item below would have caught one of them. Tick each item per episode, or write why it doesn't apply.

Related: `docs/SCRIPT_CRAFT_CHECKLIST.md` (the words), `docs/EPISODE_VISUAL_LESSONS.md` (style rules and past lessons).

## 1. Every line gets a picture that acts it out
- [ ] **Go through the script line by line and write the visual next to each line** (in the storyboard notes). No line is covered only by a static prop or a label.
- [ ] **Show the process, not just its name.** If the narration says something travels, falls, freezes, fades, snaps or spreads, the picture moves that way (a light pulse along a line, snow falling, planets winking out, a rope snapping).
- [ ] **Analogies are drawn literally and correctly.** A "ball on a string" shows a ball, a string and the hand holding it, not a stand-in symbol.
- [ ] **One memorable set piece per chapter:** a moment big enough to remember after the video (the noon town going dark with stars and streetlights appearing).
- [ ] **Chains are drawn as chains:** food chains, cause-and-effect and sequences get arrows and links, and when one link breaks, the rest visibly follow.

## 2. Every number becomes something you can see
- [ ] **Distances:** a ruler line between the two objects, with the number on it (150,000,000 km between the Sun and Earth).
- [ ] **Durations:** a clock or counter that runs exactly the stated time and stops (12:00:00 → 12:08:20), not a clock that just spins.
- [ ] **Speeds:** something moving along a line while a counter runs, marked "sped up" if it is.
- [ ] **Big numbers get an everyday comparison on screen** (about 15,000 km: more than Earth's width).
- [ ] **Counts and lists show every item named** (all eight planets when the narration says "every world"), not just a few.

## 3. The picture must be physically right
- [ ] **Day and night:** a planet lit by a star is always half-lit. Night sides start dark; "the lights go out" darkens the day side, so the whole globe goes dark.
- [ ] **Directions of motion:** an orbiting body that is let go flies off along its direction of motion (the tangent), not straight away from the centre.
- [ ] **Timing within the story:** if the event takes years or millions of years, the picture says so ("millions of years later") so it doesn't look instant.
- [ ] **Honest labels:** "not to scale", "sped up", "about", "average" wherever they apply. Average values for things that vary (planet distances, light times).
- [ ] **Every on-screen number is in the episode's fact-check table**, including numbers that appear only on screen.
- [ ] **Sequences in the right order:** things that happen one by one are shown one by one (the planets wink out in the order their last light reaches us), not all at once.

## 4. Notes appear when the words are spoken
- [ ] **Anchor each note to the first word of what it shows.** A number note appears on the first word of the number ("sixteen"), not on a word later in the sentence ("back").
- [ ] **Audit pass:** for every note, compare its anchor word with its text before rendering stills. Fix any note that appears more than about half a second after its words.
- [ ] **No note outlives its shot's meaning;** notes that contradict the next line are hidden before that line.

## 5. Arka moments are visual jokes
- [ ] **Each Arka line gets a matching visual gag**, not just a pose and a caption (bees sitting on a flower with an "ON STRIKE" sign; a shivering Arka trying to turn the clock back).
- [ ] **Arka's emotion is readable with the sound off:** pose, face and a prop or effect (shivering lines, sweat drops, frost).

## 6. Colour, text and backgrounds
- [ ] **Background chosen from the concept**, never the night sky by default; no more than two uploads in a row on the same background. A story can switch backgrounds when the story changes (bright noon page → night page when the Sun goes).
- [ ] **No red text on dark pages.** Gold (#ffd25e) for titles and big numbers, pale sky blue (#a9d8ff) for handwritten notes, light ink for small labels. Red only for meaning (a failure cross).
- [ ] **Text never sits behind moving effects** (snow, stars, signals) where it gets hard to read.
- [ ] **Shorts:** brand tag top-left (the Shorts player covers the top-right); the first frame shows the subject and the problem at once.

## 7. Callbacks and consistency
- [ ] **Visual callbacks:** when the script calls back to something, reuse the same drawing (the sunlight food chain early on, the vent food chain later, drawn the same way).
- [ ] **The same object always looks the same** within an episode (same Earth, same clock, same colours for the same idea).

## 8. Review before rendering
- [ ] **Contact sheet per shot with its narration line printed beside it**, sent to Debabrata before the full render.
- [ ] **Sound-off test:** looking at the stills alone, would a viewer understand what each shot is saying? If not, the shot needs more action or a clearer label.
- [ ] **Check stills at the key words** (numbers, "disappears", "snaps", "falls") rather than at evenly spaced frames, so the moments that matter are seen.
- [ ] **Sample render of the first few minutes** before the full render (`scripts/render-sample.sh`).
- [ ] **Whole-timeline sweep: one frame every 3 s, start to end** (`preview-stills --frames 45,135,…` at scale 0.25, ~5 min), read as contact sheets before every full render. Key-word stills alone miss empty stretches. (Added 22 Nov after Every Moon v2: two photos were tiny and late, so "Apollo 17, 1972" and the sneezing beat looked empty; map cards held 6–9 s; notes covered the planets.) Look for: any frame with nothing new for 3+ s, photos under ~35% of the frame width, text over a planet, figure or another note, captions you can't read on a dark page.

## 9. Grown-up audience signals (positioning, 21 Nov 2026)
- [ ] **Editorial, not toddler:** the hand-drawn notebook or night style with measured colour; no all-primary, bouncy toy-box palettes or cartoon chaos.
- [ ] **No child characters as the stars;** Arka behaves as a witty grown-up companion, not a baby mascot.
- [ ] **Thumbnails promise a real idea or question** (a number, a striking consequence), not just a cute character.
- [ ] **Sound:** no children's music or toy sound effects; the music stays from our licensed library list.
- [ ] **After launch:** when Studio shows age data, check the audience age split; if under-18 viewers grow unusually, review tone and thumbnails.
