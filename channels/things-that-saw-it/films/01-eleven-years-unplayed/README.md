# Film 01: "11 Years Unplayed"

An upright piano in a hallway narrates eleven years of silence, until the girl who quit comes back and plays for one
minute. See `../../CONCEPT.md`. Status (26 Nov 2026): packaging first; script not written yet.

## Thumbnails (free, drawn in code; no AI images)
- `thumbnails/draw.py` writes `a.svg`, `b.svg`, `c.svg` (build outputs, not committed). Render each to 1280x720:
  `node --import tsx scripts/render-svg.ts --input channels/things-that-saw-it/films/01-eleven-years-unplayed/thumbnails/a.svg --output <out>/a.png`
- A "11 YEARS / UNPLAYED": dusty piano, afternoon light, moving boxes, nobody there.
- B "SHE CAME / BACK.": same piano at night, lamp on, lid open, bench out, tea, one glowing key.
- C "I WAITED / 11 YEARS": close-up of the closed lid, dust, a finger trail, a child's star sticker and note.
PNGs are build outputs (not committed); copies for review go to `~/Downloads/things-that-saw-it-upload/01-eleven-years-unplayed/`.
