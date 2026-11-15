# M2.2.1 initial motion audit — completed before code changes

2026-11-14. Inspected README, ROADMAP, the M2.2 integration report, production storyboard, registered local assets, reusable layer renderer, camera/motion presets and overlap scheduling. Git has pre-existing uncommitted M2.2 source, artwork, tests and documentation; preserve it. Baseline video: `jobs/volcano-m2-2-2026-11-14T13-56-49-609Z/output/animation.mp4`. Decoded chronology and transition samples were inspected again (`/tmp/m221-baseline-audit.png`). All 26 protected source/art/video hashes match the previous compatibility receipt before implementation.

## Findings and targeted changes

| Area | Current behavior / deficiency | Proposed reusable treatment |
| --- | --- | --- |
| Opening | 1.00→1.04 camera zoom; fixed landscape; weak depth cue | Existing eased camera endpoints, wider 0.94→1.09 staging; slight frame-driven backdrop zoom/offset for differential parallax |
| Cutaway | Complementary opacity fades over 24 frames; partial landscape shows through the combined fade | Complementary spatial wipe, opaque registered interior backing; exterior preserved above the wipe; no geometry translation |
| Magma | Whole material remains stationary apart from tiny cyclic echo and brightness pulse; conduit simply fills | Keep stationary painted base; add soft traveling, self-clipped highlights with upward phase and bounded texture echo; retain progressive upward mask |
| Eruption | Compact plume grows only 0.86→1.015; slow reveal competes with simultaneous lava | Brief vent buildup, anchored eased burst to larger plume, slower subsequent expansion; independently drifting ash, delayed lava onset |
| Lava | Good geodesic branch reveal, then mostly stationary | Retain nested path masks, slower staged downhill front and restrained traveling highlight; keep support alpha unchanged |
| Ending | Exterior repeats eruption; no visible reservoir/conduit relationship | Registered cutaway with surface lava and crater plume, sparse labels and stable caption; same five templates, no extra scene |

## Minimal engine extensions justified

1. Optional inverse directional wipe, so a shared spatial front replaces the surface with the interior without opacity leakage.
2. Generic frame-driven flow highlight, clipped to source alpha and existing layer reveal; optional nested path-band masks for branch-following lava rather than unrelated vertical movement.
3. Opt-in extra mask extent for anchored assets growing beyond their original transparent registration; fixed crater occlusion remains after all transforms.
4. Optional backdrop camera track with bounded scale/offset for parallax, preserving legacy defaults.
5. Existing layer scale tracks and pivots suffice for burst staging; existing camera endpoints suffice for the stronger opening. No new camera implementation or volcano-specific React component is needed.

Keep five 90-frame scenes for now (0/90/180/270/360/450 boundaries): 3 seconds each gives readable internal explanation and a 3-second ending. Make the eruption burst earlier in its existing window, then continue plume/lava motion through the final scene. Reassess only if decoded motion requires redistribution.

## Preservation and review constraints

Do not alter approved PNGs or existing fitted assets, registration, Sun/planet files, M1.2/M2.1 MP4s, or the prior M2.2 video. New masks/metadata must be derived separately and reproducible. Keep `storyboards/volcano.json` as the earlier production baseline and author the refinement in a separate storyboard. Preserve current tests and compare lossless legacy/demo frames against `a1e8494`. Do not require byte-identical H.264 output.

Render focused previews, then full H.264 1080×1920 / 30 FPS / 450 frames. Review decoded output in three separate passes: story/composition, motion, polish. Human approval remains pending. No commit, push, tag, milestone closure, new artwork generation, AI agents or M2.3 work.
