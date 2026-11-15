# M3.1 — Word-anchored timing and storyboard drafting

_2026-11-15 · branch `claude/m3-1-word-anchors` (stacked on M3.0 `1061a0d`) · no paid requests_

## Why this milestone

In M3.0, every effect, label, sound and camera move was a frame number that someone tuned by hand against one narration take. Any new take (a different voice, a script edit, a re-synthesis) would put the lightning strike on the wrong word, and someone would have to retime about 140 values. That manual step is what blocked "topic in, episode out". M3.1 removes it: story-critical moments are tied to spoken words, and a drafter writes the first storyboard straight from the script.

## What was built

| Piece | File | What it does |
| --- | --- | --- |
| Word anchors | `src/storytelling/timing/anchors.ts` | Any frame field in scene `camera`, scene `sounds` or a group can be `{"at": "flashes", "offset": 2, "n": 1, "edge": "start", "beat": "strike"}` instead of a number. After scheduling, each anchor resolves into the correct clock: scene output frames for cameras and sounds, the scene's animation clock (plus subject `timeOffset`) for group layers, and global frames for the backdrop group. Matching ignores case and punctuation and supports multi-word phrases, the nth occurrence, and end edges. By default a search is limited to the beat the scene narrates. |
| Order guard | same | On a compressed animation clock (a slower take), anchors a frame or two apart can round onto the same frame. The resolver nudges them apart deterministically and reports each nudge as a warning. |
| Pipeline integration | `render-cached-story.ts`, `preview-stills.ts`, `synthesize-narration.ts` | Anchored boards validate on a timing skeleton and resolve after provider timing is mapped. Renders write `reports/anchor-report.json`. Boards without anchors take exactly the old code path. |
| Lightning converted | `scripts/authoring/build-lightning-storyboard.py` | 140 anchors: the strike on "flashes", the streamer on "spark … ground", the leader's last steps on "step by step", the shock rings on "blast", the rumble at the end of "thunder", and every label, pop and camera shake on its word. Incidental motion stays in nominal frames. |
| Sync check | `scripts/check-anchor-sync.ts` (`npm run anchors:check`) | Free QA. Resolves a board against the cached take or a planning estimate at any pace, and reports where each anchored cue lands. With `--compare` it also shows how far a hand-timed board would drift. |
| Drafter | `src/storytelling/draft.ts`, `scripts/draft-storyboard.ts` (`npm run storyboard:draft`) | Takes a script and a theme and returns a valid, deterministic, word-anchored skeleton: a themed backdrop, one hero-reveal scene per beat with a placeholder visual, matched camera handoffs ending on each beat's last word, pill labels and pop/boom sounds on emphasis words (it picks a content word when the script names none), whooshes on cuts, a generated music bed, and narration cues. Scene lengths come from the timing estimate, so real narration barely rescales them. If the script is too long for its duration, it refuses with a suggested `durationSeconds`. |

## Results

**Same take, anchored board.** The lightning episode re-rendered from the anchored board with the approved M3.0 narration, and no new paid request:

- All mixed-mode checks pass: −14.8 LUFS, −2.4 dBTP.
- Scene cue deviation is unchanged (≤ 10.7 ms), and speech correlation is unchanged (0.917).
- 40 numeric values moved compared with the hand-timed board, all by 16 frames or fewer. Most moves come from deliberately re-anchoring cues onto better words: the "Updraft" label on "upward", the pops on each noun, the leader steps on "step by step". The strike, the boom and the thunder rumble resolve to the same frames as the hand-tuned M3.0 values.

**Re-narration proof.** The same board was resolved against estimated takes at 155 wpm (37.4 s) and 170 wpm (34.5 s):

| Cue | 155 wpm: anchored vs word | 155 wpm: hand-timed drift | 170 wpm: hand-timed drift |
| --- | --- | --- | --- |
| Strike boom on "flashes" | on the word (30.10 s) | 11 frames early | 1 frame |
| "Negative" pop | +4 frames by design | 16 frames early | 9 frames |
| Thunder rumble | end of "thunder" −1 frame | 8 frames early | 4 frames late |
| Worst cue overall | — | 30 frames (1.0 s) | 19 frames |

In `docs/m3-1/renarration-proof.jpg`, the hand-timed board strikes while the caption is still on "the". The anchored board strikes on "flashes".

**Drafter demo.** `stories/rainbow-draft-demo.json` is a new 6-beat topic, not narrated and not fact-reviewed for publishing.

- One command produced a 990-frame storyboard with 23 anchors and no warnings, in the day theme.
- Auto-picked labels: "Raindrop", "Reflects", "Rainbow". Given labels: "Your Back", "Violet", "Forty-two Degrees".
- See `docs/m3-1/draft-demo.jpg`. The placeholders are deliberately visible, so a draft cannot pass as finished work.

## Quality assessment (honest)

- **Timing is now a solved problem for kit episodes.** A new take or a script edit costs one command. The boom lands on its word to the frame.
- **The drafter gives structure, not art.** It handles timing, camera handoffs, labels, sound and captions. Each scene's actual visual (the bolt, the charges, the raindrop) still has to be authored. On lightning that was most of the creative work. The drafter removes about the first third of authoring time.
- Drafted labels sit over the placeholder cloud at y = 200, which is readable but crowded. Placement will need subject awareness once real visuals exist.
- Auto-emphasis is a simple heuristic (longest content word, ties go to the later word). It is good enough for a draft, and the author or an LLM should choose the final emphasis.
- Anchors work in scene cameras, scene sounds and groups. Templates other than hero-reveal resolve correctly through `sceneAssetIds`, but only hero-reveal is exercised by an episode.

## Verification

- TypeScript passes. Vitest: 364 tests passed, 364 total, across 24 files; 13 are new (word anchors 8, drafter 4, lightning anchor contract 1), and the lightning contract tests now resolve anchors.
- Legacy lossless regression: 19 of 19 PNG frames are byte-identical to M3.0 HEAD. The boards checked were generic-demo, volcano-kit, volcano-motion-prototype, volcano-style-c and water-cycle-demo.
- Anchored lightning final: verify-cached-story passes every check in mixed mode.
- Paid requests: 0. Approved narration, assets and captions are unchanged.

Details: `docs/M3_1_VERIFICATION.json`.

## Reusable versus story-specific

Reusable: the anchor resolver, the order guard, `anchors:check`, the drafter, and the timing-estimate-driven nominal lengths. Story-specific: the lightning anchor choices in its generator, and the rainbow demo script.
