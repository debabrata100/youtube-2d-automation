# 18: Episode 7, What If Apophis Hit? Most Videos Get It Wrong

- **Status (23 Nov 2026):** rendered on the Mac (`jobs/e7-full/output/narrated-animation.mp4`, 9:57 = 597 s incl. the 12 s end card, 1920×1080, −16.2 LUFS). Verification: every picture, timing, loudness, peak, ducking and narration check passed. One caption-coverage flag: three captions end on "a" and that word starts on the caption's last frame (1/30 s); captions are a separate subtitle file, so viewers see no difference. Not uploaded yet.
- **Upload folder:** `~/Downloads/gahanarka-upload/18-apophis/`: the video as `what-if-apophis-hit.mp4`, `captions-english.srt`, thumbnails.
- **Script, sources and fact check:** `stories/apophis-script.md` (fact-check table + credibility audit). Narration: Gahanarka R1 (request `Dg6fCHzAJMSijzvLDY1g`, 7,067 characters) + Arka E3 (take from the 22 Nov voice test, reused at no cost), cut with a free 3.4 s brand-sting gap (`jobs/e7-narration-sting`).
- **Storyboard:** `scripts/authoring/plan-apophis.py` → `storyboards/apophis.json` (60 shots). Thumbnail art: `scripts/authoring/plan-apophis-thumbs.py`; lettering `thumbnails/apophis/{a,b,c}.json`.
- **Before publishing:** the ending teases S2 ("If the Sun turned into a black hole… would it pull us in?"). S2's script is drafted and approved, so the rule is met.

## Title

**What If Apophis Hit? Most Videos Get It Wrong** (45 characters; chosen by Debabrata 22 Nov 2026)

## Thumbnails (3 for Test & compare, in `18-apophis/`)
1. `thumb-a-myth-reality.png`: "MYTH | REALITY": Earth blown apart (the scary videos) vs Arka riding Apophis past an intact Earth. Same concept as Ep 4's leading thumbnail.
2. `thumb-b-inside-the-ring.png`: "INSIDE / THE RING": Apophis, with Arka on it, inside the satellite ring.
3. `thumb-c-we-rode-apophis.png`: "WE RODE / APOPHIS.": Arka cheering on the rock, Earth filling the sky.

## Description (paste as is)

```
What would really happen if asteroid Apophis hit Earth? On Friday the 13th of April 2029, a rock the size of a skyscraper will pass closer to us than the satellites that carry our TV. You may have heard it would wipe out a continent, end the world or raise a wall of water hundreds of metres high. So we check every claim, by riding Apophis through the flyby: what's a myth, what's half true, and the one part nobody can promise. Plus the three astronomers who found it, and the night about two billion people can watch it cross the sky.

Where will you be on 13 April 2029? Tell us in the comments.

0:00 The claims
0:41 Standing on Apophis
1:17 The 2004 scare
2:19 Through the satellite ring
4:10 What if it hit?
5:52 Quick round: the end of the world?
7:04 Who's flying with us
8:17 Watch it from your balcony

Sources and notes:
Apophis will not hit Earth in 2029, 2036 or 2068; the impact part is a thought experiment. Numbers are rounded; drawings are not to scale. Lines marked "our maths" are our own calculations from the published figures.
- Flyby on 13 April 2029, less than 32,000 km above the surface; 2.7% (1 in 37) odds in Dec 2004, the highest Torino rating ever; discovery at Kitt Peak, 19 June 2004 (Tucker, Tholen, Bernardi): ESA; NASA; Astronomy.com (Dec 2004)
- Size about 450 m along its longest axis; best view from Europe, Africa and western Asia, about 2 billion people: The Planetary Society
- Radar in March 2021 (Goldstone, Green Bank) ruled out impacts for at least 100 years: NASA/JPL
- Satellite collision very unlikely: USGS fact sheet (2025)
- Speed at closest approach about 7.4 km/s: Pravec et al. (2014)
- Surface gravity changes of a few percent; possible landslides and quakes: EPSC 2024 (Royal Observatory of Belgium); NASA SVS; ESA
- One in a million / one in a billion odds of a small-rock nudge: Wiegert (2024)
- Energy estimates from 40 to 10,000 megatons; NASA estimate about 880 megatons: J. Melosh; NASA via Universe Today
- Global climate effects need asteroids about 1 km or larger: Universe Today
- Ocean impacts and tsunami uncertainty: Acta Astronautica 188 (2021); Eltanin impact study (off Chile, ~2.1 million years ago)
- Ramses (ESA and JAXA) and its two CubeSats: ESA (2026). OSIRIS-APEX: NASA; University of Arizona
- Brightness like a Little Dipper star, a full Moon's width in about a minute: NASA/JPL (2019)

More from Gahanarka:
▶ If the Sun Disappeared, Even the Air Would Fall: https://youtu.be/Rtcxj2-wTuo
▶ What Actually Happens If the Moon Disappears? https://youtu.be/ZbEeo3Xx0Iw

All drawings and animation are original.
Music from the YouTube Audio Library: False Vacuum Decay, Frame-Dragging, Event Horizon, Laniakea and Singularity (The Grey Room / Density & Time), Science Montage (Jeremy Blake), Surface of the Moon (John Patitucci), Sweet Math (Mini Vandals), Taking Flight (Blue Deer Studio).
Narration voiced with AI (ElevenLabs).

#Apophis #Asteroid #Space
```

(Chapter times are from the final storyboard on the real narration timing. Check two of them against the rendered file before pasting.)

## Pinned comment

```
On Friday 13 April 2029, about two billion people could watch Apophis cross the sky. Where will you be watching from? 🌍👇
```

## Tags
apophis, asteroid apophis, apophis 2029, what if apophis hit earth, apophis asteroid 2029, friday the 13th asteroid, asteroid flyby, will apophis hit earth, apophis myths, osiris-apex, ramses mission, asteroid impact, space what if, gahanarka

## Settings
- End screen: the last 12 s (9:45 to 9:57). One video element: Ep 5 (Rtcxj2-wTuo, the Sun episode; the ending's question is about the Sun) + subscribe. When S2 goes live, switch the video element to S2.
- Playlist: "What If…?"
- Not made for kids · Science & Technology · English (video, title and description)
- Altered or synthetic content: No (drawn animation and AI narrators for a cartoon; no realistic AI footage, no imitation of a real person)
- Subtitles: upload the English SRT (`node --import tsx scripts/export-captions.ts jobs/e7-full` → `jobs/e7-full/output/captions.srt`)

## Schedule (to agree)
Proposed: **Thu 3 Dec 2026, 9:30 PM IST**, four days after Ep 5 (Sun 29 Nov), in the first week of December as planned. The lions Short (Tue 1 Dec) and S10 (Fri 4 Dec) sit either side. Alternative: Sun 6 Dec, which gives Ep 5 a full week alone.

## Checklist before upload
- [ ] Watch the full render once (sound on).
- [ ] Captions exported (`captions.srt`).
- [ ] Two chapter times checked against the render.
- [x] Three thumbnails made and checked at phone size (23 Nov).
- [ ] Compliance checklist ticked (`docs/YOUTUBE_COMPLIANCE_CHECKLIST.md`).
- [ ] After publishing: pinned comment (ask first), end screen, register entry and scorecard row, Related video of E7's Shorts (once made).
