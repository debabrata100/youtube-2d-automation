# Roadmap

## M1 — Illustrated motion graphics engine

Declarative scene plans, deterministic 2D animation primitives, reusable SVG components, five scene templates, rendering, contact sheets, and technical verification. Completed in baseline commit `fbbcc1c`.

## M1.1 — Cinematic visual quality refinement

Richer procedural illustrations, layered space depth, purposeful multi-stage camera choreography, reusable particle-to-object convergence, transition overlap, stronger vertical composition, and expanded visual verification. Human visual approval remains pending.

## M1.2 — Art direction and cinematic storytelling — complete

Human visual approval received on 2026-11-14. The M1.2.5 output is the project's approved illustrated animation baseline. This approval supersedes the pending review notes retained in historical checkpoint documents, including the earlier M1.1 entry.

Delivered: AI-assisted original Sun/rocky-planet artwork and prompt provenance; transparent, hash-verified approved assets; semantic illustration layers/registry; reusable shot presets and deterministic camera/orbital/convergence/contact motion; continuous hybrid accretion; improved procedural debris/disk; pose-matched scene handoffs; phone-readable final caption hold; chronological encoded-video audit sheets and regression tests.

Final job: `jobs/planet-formation-m1-2-5-2026-11-14T05-41-24-380Z/`. Verified H.264 MP4: 1080 × 1920, 30 FPS, 450 frames, 15.000 seconds, correct chronological plan, no detected black frames or timeline gaps. TypeScript, 61 Vitest tests and whitespace checks passed. Measured render/encoding time: 38.44 seconds. Outputs remain local and Git-ignored; see [closeout](M1_2_CLOSEOUT.md) and [verification receipt](M1_2_FINAL_VERIFICATION.json).

Current limitations: flattened painted lighting limits surface rotation; procedural debris is less detailed; disk/accretion are illustrative rather than physical; some choreography remains topic-specific; no narration, audio or publishing. Image generation is a separate human-reviewed authoring step, never automatic during rendering. Future work can add aligned layered asset exports and more compositional controls.

## M2 — Visual asset and scene-template library

M2.1 complete — approved as an architectural demonstration on 2026-11-14: repository audit, generic versioned storyboard schema, five configurable templates, local asset registry, deterministic presets, generic demonstration, rendering/verification and a legacy compatibility adapter. See [architecture audit](M2_1_ARCHITECTURE_AUDIT.md), [schema](M2_1_STORYBOARD_SCHEMA.md), [verification](M2_1_VERIFICATION.md) and [compatibility](M2_1_COMPATIBILITY.md).

Final closeout confirmed the intentional two-frame backdrop dip around 8 seconds and added transition regression coverage. The M1.2 approved production baseline remains preserved. Encoded-output reproducibility remains unresolved; byte-identical MP4 output is not guaranteed. M2.2 has not started and requires a new explicit instruction. No push or tag is part of M2.1 closeout.

## M3 — LangGraph AI storyboard director

Research-to-plan orchestration, structured creative decisions, and plan evaluation. No M3 code is included.

## M4 — Narration, captions, and audio synchronization

Voice tracks, word timing, caption layouts, audio mixing, and timing-aware scene adaptation.

## M5 — Automated production and visual QA

Production scheduling, render farms, richer visual diagnostics, human approval gates, and publishing workflow integrations.
