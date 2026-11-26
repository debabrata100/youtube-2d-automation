# Channels

This repo runs more than one YouTube channel on the same engine.

- **Shared, channel-neutral code** stays where it is: `src/` (renderer, kit, captions, audio), `scripts/` (narration,
  render, verify, thumbnails), `config/` (providers, caption styles), `assets/music/`.
- **Everything that belongs to one channel** lives in `channels/<channel-id>/`:
  - `channel.json`: name, niche, audience, brand (fonts, colours, voice), and where that channel's content lives.
  - `brand/`: fonts (with their licences), logo, palette.
  - `films/<NN-slug>/` (new channels): script, storyboard, thumbnails, publishing sheet for one video, kept together.
  - `CONCEPT.md`: what the channel is, what it is not, and the rules that keep it original.

Gahanarka predates this layout. Its content stays in the top-level `stories/`, `storyboards/`, `publishing/`,
`thumbnails/` and `docs/` folders, and `channels/gahanarka/channel.json` points at them, so no existing script
or render job breaks. New Gahanarka work can keep using those folders; a move is optional and only worth doing
in one planned step.

Rules:
- A channel never imports another channel's assets or brand files.
- Shared code takes the channel's values as inputs (theme id, fonts, voice ids). No channel name is hardcoded in `src/`.
- Credentials stay in `.env` (never per channel, never committed).

| id | Name | Niche | Status |
|---|---|---|---|
| `gahanarka` | Gahanarka (@Gahanarka) | Animated space and science thought experiments | Live since Nov 2026 |
| `things-that-saw-it` | Things That Saw It (working name) | Short animated life stories told by an object that watched | **Dropped 26 Nov 2026** (Debabrata: the cadence it needs is too low to be worth it next to Gahanarka); kept for reference |
