# M1.2 milestone closeout

M1.2 is complete. On 2026-11-14 the user approved the final M1.2.5 animation as the project's illustrated animation baseline and authorized this closeout commit. This approval supersedes pending review fields in historical checkpoint reports; newly generated videos still require their own review. M2 has not started.

## Audit scope

The closeout inspected the full intended change set against `0da7c925667b7209cc4464dbeaabc4fa34b4760d`: tracked diffs, new source files, tests, artwork and provenance, render/review scripts, and documentation. The final implementation includes:

- Reusable semantic illustration layers, registry and style tokens; approved painted Sun and rocky planet, disk and accretion-body illustrations.
- Deterministic celestial breathing/glow, seeded debris/contact effects, mass growth, camera choreography, shot presets and matched subject poses across five chronological scenes.
- Explicit frame-to-scene mapping and contiguous timeline validation; regression tests for chronology, assets, motion, contacts, continuity and final text.
- Encoded-MP4 chronological and transition extraction, asset audits, staged review tools and rendering/verification reports.

Closeout itself corrects stale README/roadmap descriptions, review-script milestone labels and ignore rules. It does not alter the approved animation source or artwork. The generic review workflow no longer depends on historical comparison jobs; specialized checkpoint comparisons retain their historical prerequisites.

## Preserved artwork and workflow

Original artwork was developed and refined with AI-assisted image generation, reviewed by a human, and saved as local approved RGBA assets. Prompt provenance is committed beside the artwork. Generation is an authoring step; rendering does not invoke an image-generation or LLM API. Integration preserves the approved PNG pixels, proportions, alpha and baked lighting, then applies restrained frame-based motion and compositing through the reusable illustration system.

Both approved images are 1254 × 1254. SHA-256 values at closeout:

| Asset | SHA-256 |
| --- | --- |
| `assets/illustrations/star/sun-approved.png` | `d7fbf21f09cf0e55283ffc25b9e2c737f6b7a05c406746da0b8bcd8f617c7511` |
| `assets/illustrations/sun-approved.png` (identical provenance/test copy) | `d7fbf21f09cf0e55283ffc25b9e2c737f6b7a05c406746da0b8bcd8f617c7511` |
| `assets/illustrations/planet/rocky-planet-approved.png` | `9ca412dbfbf32c8dfbdd83552e9d64e7983fa47fece5ba899bd670890efa11b6` |

## Final approved output and verification

Local job: `jobs/planet-formation-m1-2-5-2026-11-14T05-41-24-380Z/`.

- Video: `output/animation.mp4`, 7,353,663 bytes; SHA-256 `23738d08124498a8fe02cd792d0eb1450280bd68183a36fd92c0eb837b1d31df`.
- H.264, 1080 × 1920, 30 FPS, 450 frames, 15.000 seconds.
- Original measured full rendering/encoding: **38.44 seconds**, 11.71 effective frames/s. Node coordinator peak RSS: 132.6 MB, excluding browser and FFmpeg subprocesses. Closeout verifies the approved file rather than replacing it with a new render.
- `npm run typecheck`: passed.
- `npm test`: 4 test files, 61 tests passed, 0 failed.
- `git diff --check`: passed.
- Final video verification passed all automated checks, including format/duration/frame count, coverage, chronological plan order, asset presence, completion and black-frame detection. The sandbox blocked the `tsx` CLI's IPC socket during the final rerun, so the identical verifier was invoked with `node --import tsx scripts/verify.ts jobs/planet-formation-m1-2-5-2026-11-14T05-41-24-380Z`; it exited successfully.
- The encoded video supplies 15 whole-second samples (0–14 seconds) and 12 samples surrounding the four scene boundaries. Numbered chronological and transition sheets accompany the local job, alongside the before/after sheet. Automated extraction supports human scene-order review; it does not classify scene content from pixels.

The intended sequence is young star (0–3s), gas/dust disk (3–6s), accretion (6–10s), planet reveal (10–13s), summary (13–15s). Production scenes have zero full-scene overlap and use matched poses and localized entrance/occlusion effects for continuity.

[M1_2_FINAL_VERIFICATION.json](M1_2_FINAL_VERIFICATION.json) preserves the exact artifact identity, asset hashes, checks and approval separately from ignored job outputs.

## Repository hygiene

Jobs, encoded videos, preview outputs, logs, cache, coverage and temporary files are ignored. Only `jobs/.gitkeep` is tracked under jobs. No generated MP4/MOV/WebM or scratch output belongs in this milestone commit. Ignore rules were checked against the actual final video and contact sheet, representative output/temp paths, and the superseded Sun draft. Approved PNG assets remain included. The older `young-star-painted-v1` draft and its prompt are preserved locally but excluded from the approved baseline.

## Current limitations

Lighting and texture are flattened into PNGs, so true surface rotation, independent plasma articulation and relighting are unavailable. The faint corona echo is compositing rather than a physically animated corona. Future aligned albedo, shading, corona, molten-detail and silhouette layers would enable richer motion without rotating baked lighting.

Disk/accretion physics are stylized, procedural debris is less detailed than painted artwork, and platform compression may soften fine texture. Some shot poses, timing and effect constants remain specific to this example; not every art-direction choice is exposed through the plan. Schema/preset depth metadata includes descriptive fields. Tests establish frame-based determinism and continuity, not pixel identity across browser/codec versions.

There is no audio, narration, word-timed subtitle system, automatic illustration generation or publishing. Technical verification complements human review of pacing, texture, readability and compression. The approved baseline does not imply automatic approval of subsequent renders or changes. No push, tag or M2 work is part of this closeout.
