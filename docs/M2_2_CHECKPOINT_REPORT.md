# M2.2 asset checkpoint report

> Historical preproduction checkpoint. The later approved/fitted Batch A/B/C assets are now integrated into the rendered second-topic demonstration. See [current integration report](M2_2_INTEGRATION_REPORT.md). The final animation still awaits human visual approval; historical “missing asset” statements below describe the earlier checkpoint.


Date: 2026-11-14. Baseline: `a1e84941967e5bd7ef875d91e2cb68fa540afe6c`. Status: **awaiting original artwork and human approval; M2.2 is not complete**.

## Delivered before stopping

- [Reusability audit](M2_2_REUSABILITY_AUDIT.md), completed before code changes, including genuine template/motion gaps and projected minimal reusable extensions.
- `storyboards/volcano.draft.json`: validated version 2.1 storyboard with five concise captioned stages, existing template references, registered target layers and exact 1080×1920 / 30 FPS / 450-frame format.
- [Asset inventory and production brief](M2_2_ASSET_APPROVAL.md): seven original illustrated layers plus one derived composite, proposed paths, registration, lighting, alpha and human approval proofs.
- Three draft regression tests; README and roadmap checkpoint notes. No engine, scene-template, renderer or approved illustration implementation was changed.

## Proposed chronological narrative

| Frames (end exclusive) | Seconds | Stage |
| --- | --- | --- |
| 0–75 | 0–2.5 | Volcano exterior |
| 75–165 | 2.5–5.5 | Magma accumulates below |
| 165–270 | 5.5–9 | Rising magma and expanding gas |
| 270–375 | 9–12.5 | Ash, gas and lava reach the surface |
| 375–450 | 12.5–15 | Summary |

This is a simplified gas-rich explosive example, not a claim that all volcanoes erupt this way. Scientific source links and the distinction between trapped pressure and decompression-driven gas expansion are recorded in the audit.

## Verification results

| Check | Result |
| --- | --- |
| TypeScript | `npm run typecheck` passed |
| Vitest | `npm test`: 99 passed across 6 files; all previous 96 tests retained |
| Whitespace | `git diff --check` and new-file whitespace inspection passed |
| Volcano schema/reference validation | Passed; all eight declared IDs resolve through the existing registry |
| Volcano frame mapping | All 450 frames checked against the intended five stages; no scheduling gaps/overlaps |
| Volcano actual image files | **Blocked: all eight proposed PNG files are absent**; real-file preflight correctly rejects the draft |
| Volcano encoded-video verification | Not performed: no approved assets or rendered video |
| Original M1.2 MP4 | FFmpeg/ffprobe verification passed on preserved approved output; SHA-256 still matches the M1.2 receipt |
| Approved Sun/planet PNGs | All three stored files still match approved receipt hashes |
| Existing M2.1 generic demo | Schema/unit contracts retained; FFmpeg/ffprobe verification passed on existing MP4, whose hash is unchanged |

Existing outputs rechecked:

- Planet: `jobs/planet-formation-m1-2-5-2026-11-14T05-41-24-380Z/output/animation.mp4`, SHA-256 `23738d08124498a8fe02cd792d0eb1450280bd68183a36fd92c0eb837b1d31df`.
- Generic demo: `jobs/generic-template-demo-m2-1-2026-11-14T08-03-11-052Z/output/animation.mp4`, SHA-256 `aceb0eb779e74114273a4815904386ec933fa0518f1da8b3930cf6d30544e7a7`.

These were verification reruns, not new renders. Prior encoded-output reproducibility limits remain unresolved; no byte-identical MP4 guarantee is added.

## Reusability and remaining work

Draft layout reuse: **5/5 scenes, 100%**, across hero-reveal and summary. This is not a production-motion completion percentage. Required independent chamber, conduit, plume, lava and environmental animation is not implemented. The existing final pull-back returns to neutral, so it does not yet supply a held terminal wide shot. Projected reusable extensions and rough line estimates are in the audit.

New reusable components: **0**. Topic-specific React components: **0**. Storyboard authoring required **no React source edits**. Asset registry changes: **0**. Existing camera/motion support is partial; reusing group scale or orbital particles would misrepresent the process. After examining approved layers, implement only topic-independent controls and validate motion previews before producing a full video.

Volcano final MP4, chronological/transition contact sheets and render time: **not available / not applicable at this checkpoint**. The existing combined sheet tool will need a separate transition export based on the new boundaries, not planet-specific hardcoded frame numbers.

Awaiting: landscape, exterior, cutaway rock, chamber magma, conduit magma, eruption plume, lava flows, and the derived exterior presentation composite. No asset-generation API, placeholder vector art, stock illustration or final-video claim was used. Once artwork is approved, update draft dimensions from actual metadata and review registration and phone-size readability before continuing.

Uncommitted changes are limited to this report, the audit/asset brief, draft JSON, draft tests, README and roadmap. No commit, push, tag or M2.3 work performed.
