# YouTube 2D Automation — Project Handoff Context

**Prepared:** 2026-11-15  
**Purpose:** Transfer project context from ChatGPT to Claude Code, and later resume work in ChatGPT.  
**Current milestone:** M2.4.1 completed; M2.4.2 proposed but **not started**.  
**Source of information:** Project conversation and user-provided Codex implementation summaries. This document is a handoff, **not an independently audited repository inventory**. Claude Code must inspect the actual repository and files before acting.

## 1. Mission and product goals

Build a reusable, scalable, largely automated pipeline for original YouTube educational/science explainer videos using 2D animation, recurring visual/character styles, storyboards, narration, captions, and automated rendering. The broader channel strategy has considered AI explainers and sci-fi mystery, with a hybrid 2D animated approach and a goal of reaching monetization within approximately six months. Monetization is an aspiration, not a guaranteed outcome.

The immediate engineering prototype is a **15-second vertical volcano explainer**, used to prove the pipeline end to end. Long-term videos may be longer, more narrative, and more visually sophisticated; do not mistake the volcano prototype for the full product specification.

The user is an experienced TypeScript/Node.js/React engineer, wants practical incremental milestones and detailed implementation prompts, is cost-conscious, and prioritizes reusability over one-off volcano effects.

## 2. Local repository and technology

- Repository (GitHub): `https://github.com/debabrata100/youtube-2d-automation`
- User's Mac project root: `/Users/deb/Documents/learn/ai-foundation/youtube-2d-automation`
- Main technologies reported: Node.js 22, TypeScript, React, Remotion, FFmpeg/FFprobe, Zod, Vitest.
- Pipeline is driven by structured JSON storyboards/scene plans, reusable scene templates, generic animation renderers, narration adapters, caching, and automated checks.
- Prototype target: **1080×1920, 30 FPS, 450 frames, 15 seconds, H.264/AAC**.

**Important:** Verify current folder layout, package scripts, schemas, source code, branches, remotes, tests, and actual asset locations in the repository. File paths below are historical references, not proof of current filesystem state.

## 3. Milestone history

### Early animation work (M1, M2.2, M2.2.1)

- Initial experiments with a 15-second educational animation, including an early “How Planets Form” concept.
- Volcano prototype adopted, with detailed cutaway volcano artwork and separately registered transparent PNG assets (magma chamber, conduit, plume, lava flow and optional ash effects).
- Generic storyboard/layer renderer with five scene templates, rather than volcano-specific React components.
- Motion and reveal polish was attempted, but visual quality was judged below professional YouTube explainer standards.
- The team intentionally prioritized narration/storytelling and pipeline automation before revisiting artwork limitations.

### M2.3 — Storytelling and narration pipeline

- Multiple short script candidates, selected volcano story, TTS adapter/cache, caption support and CLI.
- Mock audio initially used for testing.

### M2.3.1 — OpenAI narration

- OpenAI TTS integration generated a real narration; it was considered rushed/robotic and perceived as insufficiently male.
- User chose to switch to ElevenLabs.

### M2.3.2 — ElevenLabs narration and hardening

- Selected voice: **Bill L. Oxley**, voice ID `iiidtqDt9FBdT1vfBluA`.
- Model: `eleven_multilingual_v2`.
- Approved script: **28 words / 169 characters** (read actual script from repository; not reproduced here).
- ElevenLabs API key uses restricted permissions. Voice and model lookups required **Voices: Read** and **Models: Access**; subscription/credit preflight required **User: Access** (`user_read`); synthesis requires **Text to Speech: Access**.
- Initially a Free-tier synthesis returned HTTP 402. Error handling was improved to preserve sanitized provider codes/messages, redact secrets, and guarantee **zero automatic retries**.
- User upgraded to ElevenLabs **Starter**.
- Successful synthesis: **one paid request, HTTP 200, 68 reported credits**, duration **13.1425 seconds**, WAV **24 kHz mono 16-bit PCM**. Audio decoded cleanly, no detected clipping; local transcription matched all 28 words.
- Provider **character timing** is available for caption alignment.
- User listened and **approved the voice**.
- No new synthesis should be performed without fresh explicit user authorization.

Historical audio path:
`jobs/volcano-m2-3-2-2026-11-15T02-12-02-637Z/stage-b-starter-2026-11-15T03-15-52-372Z/audio/narration.wav`

Historical report:
`docs/M2_3_2_ERROR_HANDLING_REPORT.md` and relevant Stage B job reports.

### M2.3.3 — Narration integration and caption synchronization

- Integrated approved ElevenLabs audio into the 15-second video.
- Captions follow provider character timing; no extra paid requests.
- 243 tests passed; 15 visual regression samples passed; render time **40.78 s**.
- Found that equal 90-frame scenes could lag spoken beats by up to **1.27 s**.
- Git branch: `codex/m2-3-3-elevenlabs-captions`
- Commit: `1936889dfb60df8adfde5b9bc040f771b57875f1`
- Push reported successful.
- Report: `docs/M2_3_3_INTEGRATION_REPORT.md`

### M2.3.4 — Narration-driven scene timing and cleanup

- Replaced rigid equal-duration scenes with a **generic narration phrase-cue timing planner**.
- Scene schedule:

| Scene | Time (seconds) |
|---|---:|
| Exterior | 0–2.2 |
| Magma accumulation | 2.2–5.0 |
| Magma rise | 5.0–8.1 |
| Eruption | 8.1–10.6 |
| Summary | 10.6–15.0 |

- Reported transition midpoint deviation: **8.67 ms max / 4.50 ms average**; transition starts within 122 ms.
- Removed the permanent **“AI-GENERATED NARRATION”** production banner; retained optional debug display.
- Preserved the 28-word timed captions, labels, approved audio, artwork and output duration.
- 256 tests, both build checks and 20 lossless regressions passed; render time **37.01 s**.
- Git branch: `codex/m2-3-4-narration-driven-scenes`
- Commit: `f7f1bed7c34ea1454826318df1610558ba57ce68`
- Push reported successful.
- Report: `docs/M2_3_4_REPORT.md`

### M2.4.1 — Reusable motion primitives (most recent completed milestone)

Implemented **three generic, JSON-configurable motion capabilities**:

1. **Path-based motion** for objects/effects traveling along 2D paths (prototype: magma rising through the conduit).
2. **Deterministic particle system** with seeded behavior (prototype: eruption ash/sparks/debris).
3. **Camera keyframes** for zoom/pan/focus movement.

Reported validation:
- TypeScript, **280 tests**, both builds, 20 legacy frame comparisons and video verification passed.
- Approved narration, captions, artwork and scene boundaries unchanged.
- Render time **44.15 s**, compared with **37.01 s** baseline (**+19.3%**).
- Output: 1080×1920, 30 FPS, 450 frames, H.264/AAC.
- Zero paid API requests.
- Git branch: `codex/m2-4-1-motion-primitives`
- Commit: `d9c6f7a9ddf9ec9829465f6d3ff8d978e79c1bc3`
- Push reported successful; working tree clean at milestone completion.
- Report: `docs/M2_4_1_MOTION_PRIMITIVES_REPORT.md`
- Prototype: `jobs/volcano-m2-4-1-prototype/output/narrated-animation.mp4`
- Comparison: `jobs/volcano-m2-4-1-prototype/before-after-comparison.png`
- Contact sheet: `jobs/volcano-m2-4-1-prototype/chronological-contact-sheet.png`

**Visual review conclusion:** M2.4.1 is a successful **engineering** milestone, but the visible quality improvement is modest. Camera effects are subtle, magma upward flow is not obvious enough, and eruption particles are hard to perceive on a phone. Detailed smoke/plume and lava textures are mostly baked into flattened artwork; scaling/fading/moving the whole illustration cannot produce convincing internal smoke/lava movement. Captions are legible but their dark rectangular background is visually prominent. The video still looks more like an animated illustration than a fluid professional explainer. These are qualitative review observations, not failed automated tests.

## 4. Current quality and architecture constraints

**Working:**
- End-to-end automated 15-second Remotion render.
- Approved male ElevenLabs narration, reusable TTS provider/caching integration.
- Provider-timed captions and narration-driven scene scheduling.
- Generic scene templates, layer renderer and JSON plans.
- Reusable motion primitives: path movement, deterministic particles, camera keyframes.
- Test/regression checks and reproducible milestone Git workflow.

**Needs improvement:**
- Flattened artwork constrains physically expressive animation.
- Eruption plume needs independent animated components rather than a single static textured plume.
- Magma/lava flow needs stronger directionality and perceptible internal movement.
- Particle visibility needs validation at real mobile display size.
- Motion should serve story beats; avoid superficial effects that merely increase render time.
- Professional-quality Shorts readiness is **not yet achieved**.

## 5. Proposed next milestone — M2.4.2 (NOT STARTED)

**Working title:** Layered Asset Animation — Controlled Eruption Prototype.

**Goal:** Demonstrate a **materially better-looking eruption sequence** by animating independent visual layers, not by adding more effects to a flattened PNG. Maintain generic, reusable animation capabilities that can be used for smoke, steam, clouds, fluid and other explainer subjects.

**Suggested bounded scope:**
- Inspect existing assets, masks, motion primitives, composition, asset registration and storyboard schema first.
- Prototype only the eruption segment (roughly 8.1–10.6 s) and any minimal continuity required around it; do not redesign all five scenes.
- Introduce a reusable **layer-aware animation approach** (e.g., separate smoke puffs/depth layers, independent transforms, opacity, expansion, slight deformation/masking, compositing). Choose the simplest maintainable architecture consistent with the existing repository.
- Enhance perceived lava/magma flow with moving highlights or masks along paths; do not attempt unrealistic motion on a single flattened texture.
- Reuse existing deterministic particle and camera primitives where effective; make effects visible at phone size without clutter.
- Keep original approved assets immutable. If derivative layer assets are needed, clearly distinguish generated/derived assets, validate alpha/registration, and ask permission before any paid image-generation calls. Avoid assuming high-quality layer separation is possible from a flattened image.
- Produce a short A/B **eruption-sequence prototype** before deciding whether to integrate into the full 15-second video.
- Include comparison at realistic mobile size, timing/caption preservation, render-performance measurements and reproducible tests.
- Preserve existing 15-second output contract if a full-video render is made.

**Not yet approved:** No implementation has begun, no new paid generation is authorized, and no Git merge/tag is authorized. Claude Code should propose a concise plan and verify asset feasibility before extensive coding.

**Acceptance focus:** A visible, perceptually meaningful improvement over M2.4.1, not merely more passing tests. Explicitly assess buildup, burst, plume expansion and dissipation; whether the effect is understandable at mobile scale; and whether render-time cost is justified.

## 6. Mandatory workflow and safety rules

1. **Milestone by milestone.** Inspect current code and user instructions; scope work tightly; stop at milestone boundary.
2. **Commit and push every completed milestone.** Use a dedicated milestone branch, meaningful conventional commit message, run checks first, review diff and secrets, push to existing remote, report branch/commit/push. Do not force-push, rewrite history, merge into default branch or create release tags without explicit approval.
3. **Never commit secrets or generated paid assets by default.** Keep `.env`, API keys, tokens, narration WAV caches, rendered MP4s and temporary job directories out of Git unless explicitly approved. Preserve original approved artwork.
4. **No paid requests without explicit fresh authorization.** No ElevenLabs synthesis, paid alignment, image generation, sound effects or other paid services by default. Do not assume previous one-request authorizations carry forward; the approved 68-credit synthesis already occurred.
5. **No automatic retries of paid synthesis.** Preserve sanitized error code/message/status; never expose API credentials.
6. **No unrequested changes to approved narration/script, provider timing, captions, five-scene schedule or source artwork.** Clearly distinguish technical regressions from aesthetic review.
7. **Maintain deterministic animation**, bounded particles and reproducible frame output. No unseeded randomness during rendering.
8. **Test and document** TypeScript, Vitest, builds, visual regressions, video/FFprobe checks, protected assets, cost and render-time impact.
9. **No unrequested dependency upgrades or major rewrites.** Prefer incremental generic primitives over volcano-specific hacks.
10. **Request user visual approval** after prototype rendering. Do not equate test pass with production-ready animation.

## 7. Suggested first Claude Code session

Paste this file into the repository (suggested: `docs/PROJECT_HANDOFF_2026-11-15.md`) and ask Claude Code:

> Read `docs/PROJECT_HANDOFF_2026-11-15.md` as historical context. Verify its claims against the current repository, Git branch, tests, relevant docs and existing assets. Do not change code yet. Summarize the actual architecture and current status, identify any discrepancies, and propose a **small M2.4.2 layered-eruption prototype plan** with files to touch, asset feasibility, zero-cost implementation options, measurable visual acceptance criteria, test plan, expected render-time impact and Git branch strategy. Stop and wait for approval before implementation or paid API calls.

## 8. Context to bring back to ChatGPT later

When returning to ChatGPT, share:
- This handoff file (or an updated copy).
- Claude Code's actual implemented changes, new milestone reports, and relevant commit hashes/branches.
- Any changed architectural decisions, approved new assets, paid-service usage and tests.
- A **rendered MP4 and before/after image** for visual review, because local Mac paths cannot be opened from a chat by themselves.
- What you want to do next (review, debugging, new milestone prompt, channel strategy, etc.).

This lets a future session distinguish **what was planned**, **what Claude Code implemented**, and **what the user visually approved**.
