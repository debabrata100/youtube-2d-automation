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

Final closeout confirmed the intentional two-frame backdrop dip around 8 seconds and added transition regression coverage. The M1.2 approved production baseline remains preserved. Encoded-output reproducibility remains unresolved; byte-identical MP4 output is not guaranteed. No push or tag is part of M2.1 closeout.

M2.2 — **rendered, technical checks passed; human visual approval pending**. Approved Batch A/B/C artwork is integrated through `storyboards/volcano.json`, using all five existing template types in five 90-frame scenes. One reusable layered-subject renderer adds validated tracks, wipe/path masks, independent illumination/drift, fixed occlusion and annotations; matched camera endpoints, optional terrestrial backdrop, rising particles and overlap/hold controls are opt-in. No topic-specific React component, new AI service or M2.3 implementation was added.

Final job: `jobs/volcano-m2-2-2026-11-14T13-56-49-609Z/`. Full H.264: 1080×1920 / 30 FPS / 450 frames / 15.000 seconds; render/encode 40.86 seconds. Static and short-motion proofs preceded the final render. Decoded chronology/transition sheets and technical verification passed; TypeScript, 127 Vitest tests and whitespace checks passed. Ten lossless comparison frames match the M2.1 commit; both prior MP4 hashes and approved artwork are preserved. See [integration report](M2_2_INTEGRATION_REPORT.md) and [reusability audit](M2_2_REUSABILITY_AUDIT.md).

Remaining review: normal-speed playback, cutaway presentation, compact plume development, lava pacing, final composition. Flattened illustrated layers limit fluid/smoke realism; encoded-output byte reproducibility is not guaranteed. No commit, push, tag or milestone closeout is authorized. M2.3 has not started.

M2.2.1 — cinematic refinement rendered for review through the same five templates: stronger opening/parallax, spatial cutaway with opaque underlap, stationary-source flow highlights, larger anchored plume and a connected underground-to-surface final diagram. Approved artwork and previous outputs are preserved. [Motion audit](M2_2_1_MOTION_AUDIT.md) and [implementation report](M2_2_1_IMPLEMENTATION_REPORT.md) document the refinements and limitations. Human approval is pending; this does not close M2.2 or start M2.3.


M2.3 — **mock narration pipeline implemented; real voice and human approval pending**. Structured scripts/candidates, validated beat-to-scene references, provider abstraction, deterministic test audio, guarded OpenAI HTTP adapter, content-verified caching, FFprobe duration measurement, strict fixed-scene alignment, safe phrase captions and an optional compositor overlay are implemented. The final mock MP4 is H.264/AAC, 1080×1920 / 30 FPS / 450 frames / 15.000 seconds; render/encode/mux 43.80 seconds. Five cache hits, zero external speech requests, 180 tests, video verification and 15 lossless visual-only comparisons pass. Forty-two protected paths retain their hashes.

M2.2.1 visual quality remains unapproved and intentionally deferred; this milestone does not improve artwork or choreography. Real narration is ungenerated: an API key and explicit authorization are required, and current Speech API retirement on 2027-01-06 is documented. Phrase timing is estimated, not word-perfect. See [storytelling report](M2_3_STORYTELLING_REPORT.md) and [implementation plan](M2_3_IMPLEMENTATION_PLAN.md). No commit, push, tag, publishing, agent orchestration or M2.4 work.


M2.3.1 — **real narration rendered; human listening approval pending**. Native Node `.env` loading, persistent five-request/USD 0.05 estimated-budget guard, five cached marin/snapshot responses, explicit local complete-take/silence cleanup, bounded 1.09× pitch-preserving timing correction and local ASR phrase estimates are implemented. The 15-second H.264/AAC output rendered in 43.58 seconds. TypeScript, 190 tests, FFmpeg, fresh mock mode, 15 lossless visual-only samples and 43 protected hashes pass. The conservative reservation is USD 0.0458616; actual billing is unknown. No sixth request was made. Naturalness/joins and the closing “magma” pronunciation still require human listening. See [review](M2_3_1_NARRATION_REVIEW.md). No visual-quality refinement, commit, push, tag, closure or M2.4 work.

M2.3.2 — **Stage A prepared; access blocked / Stage B unauthorized**. Configurable ElevenLabs adapter, three new scripts, continuous-take plan (28 words / 169 characters), timestamp-aware captions and exact-request persistent limits are implemented and locally tested. Read-only voice/model/subscription checks returned HTTP 401; access to Bill L. Oxley remains unverified. Zero paid synthesis and no new video. Sound Effects disabled. Resolve account access and obtain bounded approval before any synthesis. See [Stage A report](M2_3_2_ELEVENLABS_REPORT.md). No commit, push, tag, closure or M2.4.

M2.3.3 — **approved narration integrated; final encoded video technically verified**. Reused the approved 13.1425-second Bill L. Oxley performance and provider character timing with zero paid calls. Five captions cover all 28 spoken words over the unchanged five-scene volcano storyboard. Final H.264/AAC: 1080×1920, 30 FPS, 450 frames, 15.000 seconds; render/encode/mux 40.78 seconds. TypeScript, 243 tests, 15 lossless compatibility samples and protected hashes pass. See [integration report](M2_3_3_INTEGRATION_REPORT.md). Source/configuration/assets/tests/documentation are published on a milestone branch under the user's M2.3.3 authorization. The historical no-commit/no-push checkpoint notes above are superseded only for this integration workflow; visual-quality limitations remain documented. No next milestone is started.

M2.3.4 — **rendered and technically validated; final human review pending**. Configurable production disclosure defaults off. Opt-in generic phrase cues schedule variable 66/84/93/75/132-frame scenes and preserve illustration clocks; original plans remain compatible. Transition-midpoint deviation max 8.67 ms / mean 4.50 ms, no minimum-duration exceptions. Approved narration/artwork reused unchanged; final 1080×1920 / 30 FPS / 450-frame / 15-second H.264/AAC render took 37.01 seconds. TypeScript, 256 tests, both production bundles, encoded frame/audio/banner checks and 20 lossless regression samples pass. Zero paid services, generated audio/art, music or effects. See [report](M2_3_4_REPORT.md) and [pre-change audit](M2_3_4_TIMING_AUDIT.md). Commit/push follows the explicit milestone workflow; no default-branch merge, tag or M2.4 work.

## M2.4.1 — Reusable motion primitives: controlled prototype

Implemented and technically verified; **human prototype review pending**. Generic validated path motion, seeded bounded analytic particles and keyframed camera controls integrate with existing layers and Camera2D. The separate volcano prototype preserves approved narration, captions, assets and boundaries 0/66/150/243/318/450. Non-volcano examples demonstrate circulation, snowfall and camera tracking. No topic-specific engine component, dependency upgrade or paid request was added.

Final local job: `jobs/volcano-m2-4-1-prototype/`. H.264/AAC, 1080×1920, 30 FPS, 450 frames, 15.000 seconds; render/encode/mux 44.15 seconds versus retained baseline 37.01 seconds (+19.3%). TypeScript, 280 tests, both production bundles, 20 legacy lossless comparisons, two repeated prototype frames, mask containment, audio/caption preservation and encoded-output checks pass. All 106 protected paths remain unchanged. See [report](M2_4_1_MOTION_PRIMITIVES_REPORT.md) and [verification receipt](M2_4_1_VERIFICATION.json).

Publication is authorized on `codex/m2-4-1-motion-primitives`; no default-branch merge or tag. Remaining review covers restrained particles, flow direction, camera continuity and playback. Flattened artwork and illustrative trajectories remain limitations; encoded MP4 byte identity is not guaranteed. M2.4.2 has not started.

## M2.5 — Style and staging spike (replaces proposed M2.4.2)

Implemented and technically verified; **human visual decision pending**. The same narrated 15-second video rendered three ways: A (M2.4.1 baseline), B (painted art, re-staged eruption) and C (flat vector art, all scenes). New generic primitives: seeded `puffs` smoke columns, `stroke-reveal` paths, effects-only layers, `outline` caption style; plus still previews, chunked rendering and browser-free contact sheets. Plume height at peak: A ≈0.10 of frame, B 0.31, C 0.27. Render (Linux VM): A 82.7 s, B 100.6 s, C 70.6 s. 305 tests, 23/23 legacy lossless frames identical, zero paid requests. Recommendation: adopt the vector direction. See [report](M2_5_STYLE_SPIKE_REPORT.md), [verification](M2_5_VERIFICATION.json) and [project status](PROJECT_STATUS.md).

## M2.6 — Vector style system and shape kit

Implemented and technically verified; **human visual review pending**. Theme tokens with `@role.path` colour references (dusk and day themes), a seeded procedural vector kit (sky, sun, ridges, ground, mountain with split/rim parts, strata cross-section, blob, cloud, water, glow), animated group backdrops, pill labels, arrowheads and grain. The volcano was rebuilt from the kit with zero image assets and a split-open cutaway; a water-cycle demo was built from the same kit with no engine changes. 323 tests, 33/33 legacy lossless frames identical, WCAG AA and phone label-size checks, zero paid requests. Visual gain over M2.5 C is moderate; pipeline reuse gain is large. See [report](M2_6_VECTOR_STYLE_KIT_REPORT.md) and [verification](M2_6_VERIFICATION.json).

## M2.7 — Watchability pass

Implemented and technically verified; **human viewing/listening review pending**. Word-by-word caption highlight from provider word timings; back easings (anticipation/overshoot) with per-key track easing and label pops; seven code-synthesised sound effects and a generated music bed; scene-level sound cues; a mix stage with side-chain ducking, linear loudness to −14 LUFS and a latency-compensated limiter; `--music` for licensed tracks; mixed-mode verification (loudness, true peak, ducking, speech-band narration clarity). Kit volcano: −14.6 LUFS, −2.3 dBTP, 18 dB ducking, clarity ≥ 0.967 per phrase. 343 tests, 36/36 legacy lossless frames identical, zero paid requests. See [report](M2_7_WATCHABILITY_REPORT.md) and [verification](M2_7_VERIFICATION.json).

## M3.0 — First complete episode: "How Lightning Forms"

Rendered and technically verified; **viewing/listening approval pending**. A 38 s episode built end to end: fact-checked script candidates, kit storyboard in a new storm theme, 23 sound cues, an animatic before spending, one approved ElevenLabs request run by the user (465 characters, 34.7 s), retiming to provider word timings, final render and mixed-mode verification (−14.8 LUFS, −2.2 dBTP, 16.4 dB ducking, clarity ≥ 0.950). New reusable tools: `narration:synthesize` (dry run / single ledgered request / planning placeholder), a calibrated timing estimator and estimated-timing previews; the verifier now handles any episode length. About 25 agent minutes; no engine code for the topic. See [report](M3_0_LIGHTNING_EPISODE_REPORT.md) and [verification](M3_0_VERIFICATION.json).

## M3.1 — Word-anchored timing and storyboard drafter

Complete; review pending. Frame fields can be word anchors (`{"at": "flashes", "offset": 2}`) that resolve after narration scheduling into the right clock, so a new take or script edit needs no retiming; a deterministic order guard handles compressed clocks. The lightning board now uses 140 anchors and re-renders from the approved take with every check passing; a re-narration proof at 155/170 wpm keeps the strike on "flashes" where hand timing drifts up to 1.0 s. New tools: `anchors:check` (sync QA) and `storyboard:draft` (script + theme → valid anchored skeleton with placeholder visuals, labels and sounds on emphasis words, matched camera handoffs). No paid requests. See [report](M3_1_WORD_ANCHORS_REPORT.md) and [verification](M3_1_VERIFICATION.json).

## M3 — LangGraph AI storyboard director

Research-to-plan orchestration, structured creative decisions, and plan evaluation. No M3 code is included.

## M4 — Narration, captions, and audio synchronization

Voice tracks, word timing, caption layouts, audio mixing, and timing-aware scene adaptation.

## M5 — Automated production and visual QA

Production scheduling, render farms, richer visual diagnostics, human approval gates, and publishing workflow integrations.
