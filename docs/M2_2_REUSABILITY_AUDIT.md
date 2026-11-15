# M2.2 reusability audit

## Implemented integration — 2026-11-14, pending human approval

The original pre-coding audit below is retained as history. Approved Batch A/B/C illustrations are now available and registered with observed dimensions: landscape 941×1672, all foreground layers and masks 1254×1254. The draft is superseded for production by `storyboards/volcano.json`.

| Scene / frames | Existing template | Role |
| --- | --- | --- |
| Exterior / 0–89 | hero-reveal | Grounded exterior and slow push |
| Interior / 90–179 | comparison | Registered surface-to-interior overlay comparison; chamber collection |
| Ascent / 180–269 | transformation | Layer mask reveals magma upward without scaling the mountain |
| Eruption / 270–359 | orbital-environment | Existing environment template with optional rising ash; progressive plume/lava |
| Summary / 360–449 | summary | Continued active layers, stable camera, final caption hold |

Measured template reuse: **5/5 scenes (100%)**, **5/5 existing template types**. This is template reuse, not a claim that all requested motion existed before this change. New reusable top-level component: **1 (`LayeredSubject`)**, with one internal `Layer` helper. New topic-specific React components: **0**. New scene-template types: **0**. New runtime artwork APIs: **0**. The existing asset registry needs no file-type or resolution changes. Production assets: **11 illustration/support files plus 21 reveal-mask PNGs**; four registered illustration groups. No React source edits are needed to author this storyboard or adjust its layer timing.

The genuine missing capabilities were implemented as generic opt-in schema/renderer extensions: layer tracks; deterministic pulse and bounded texture drift; feathered directional wipes; nested path-mask sequences; fixed inverse-alpha occlusion after layer motion; registered groups and annotations; terrestrial backdrop/decorations switch; matched absolute camera endpoints and terminal hold; rising rather than orbital particles; overlap scheduling and final caption hold. Existing camera interpolation, seeded particles, template registry, asset preflight and legacy renderer are reused. Defaults preserve old storyboard behavior. See [integration report](M2_2_INTEGRATION_REPORT.md) for authoring contracts, measured performance, limitations and compatibility evidence.

Offline topic preparation is confined to mask fitting (`prepare-volcano-masks.ts`), review orchestration and JSON. It derives path-distance masks from the approved lava alpha and a cavity underlay from the cutaway opening; it neither redraws approved illustrations nor adds topic logic to generic templates.

## M2.2.1 targeted refinement

The refinement keeps 5/5 scenes and all five template types, adds no new React component or scene-template type, and uses zero topic-specific React components. It extends the existing layered renderer with inverse spatial wipes, typed directional/path flow highlights and mask padding, plus optional backdrop motion. All controls are validated JSON; approved PNGs and fitting remain unchanged. The final group connects the existing underground and eruption layers. See [refinement audit](M2_2_1_MOTION_AUDIT.md) and [implementation report](M2_2_1_IMPLEMENTATION_REPORT.md).

## Original pre-coding audit (historical)


Audited before implementation against `a1e84941967e5bd7ef875d91e2cb68fa540afe6c` on 2026-11-14. Status at that earlier checkpoint: preproduction only. No volcano illustrations were then present or approved. Do not treat the draft storyboard as a completed animation or release-ready render.

## Existing capabilities inspected

`src/engine/storyboard/schema.ts` validates explicit array order, durations, captions, asset references, seed, camera and motion configuration. `timeline.ts` derives contiguous half-open ranges. `templates/registry.tsx` supplies hero reveal, orbital environment, transformation, comparison and summary. The asset registry and file preflight support local PNG/SVG/WebP and dimensions/alpha metadata. Existing render/verify commands accept another storyboard JSON without React edits.

The generic engine is topic-independent at the level of subject loading, composition, timing, captions and camera math. Its current scene content is mostly static imagery with group motion. Summary can stack up to five registered subject layers in draw order, but has no per-layer temporal controls. Transformation scales an entire image and optionally converges particles; that is not a scientifically convincing chamber fill or conduit flow. Orbital particles would depict the wrong process. No volcano-specific logic should be added to these templates.

`StoryboardComposition.tsx` also always renders a fixed field of small white speckles. A painted terrestrial background should not inherit an unwanted space-like field or speckles beneath exposed cutaway rock. After artwork approval, a small generic background-decoration switch may be justified; it must preserve the existing demo default. The current square art registration also leaves margins on a vertical canvas, so phone-size proofs must assess whether framing needs adjustment before animation implementation.

## Scene mapping and honest reuse metrics

| Scene / frames | Existing template in draft | Reusable now | Missing before a final animation |
| --- | --- | --- | --- |
| Exterior / 0–75 | hero-reveal | Approved exterior presentation plate, caption, gentle camera push | Independent environmental drift would require layer tracks |
| Magma accumulation / 75–165 | summary | Registered landscape, cutaway and magma-chamber layers | Chamber fill/reveal over time without scaling the rock |
| Rise and pressure / 165–270 | summary | Registered chamber/conduit layers, caption and tracking camera | Upward conduit reveal, gas expansion accents and independent layer timing |
| Eruption / 270–375 | summary | Registered exterior, lava, plume and landscape layers | Plume expansion/advection, restrained ash motion and terrain-aligned lava reveal |
| Final summary / 375–450 | summary | Multiple subjects, final caption and wide framing | A terminal pull-back hold; current pull-back returns to neutral |

- Layout/template reuse in the draft: **5/5 scenes (100%)**, using two of the five existing template types. This measures static layout support, not completed production animation.
- Full required motion supported without extension: **0/5 scenes** if every requested independent environmental move and terminal pull-back is required. Existing hero staging is usable, but group motion alone does not satisfy the full motion brief.
- New reusable components implemented: **0**. New topic-specific React components: **0**. React/engine source edits at this checkpoint: **0**.
- Projected addition after artwork approval: **one reusable per-layer motion renderer**, validated data fields for reveal/opacity/translation/scale tracks, an optional terminal camera hold, and a background-decoration switch if needed. Rough engineering estimate: 150–250 lines of reusable renderer/schema support, 15–30 lines for a camera hold option, 5–15 lines for optional background decoration, plus 80–150 lines of meaningful tests. This is an estimate, not measured delivered code.
- Topic-specific executable logic projected: **0** if registered artwork and generic layer tracks suffice. Geology, captions, layer selection and timing should remain topic data. Reassess after examining approved alpha edges and registration.
- Storyboard authoring itself requires no React edits. Fulfilling all requested layer animation currently requires a small reusable engine extension, not a new volcano scene implementation or architecture rewrite.
- The existing asset registry is sufficient for proposed files; no new file type or asset service is needed. Declared dimensions in the draft are export targets, not observed file metadata.
- Existing camera/motion presets are partially sufficient: use push/tracking and still/group motion; extend only layer timing and terminal pull-back semantics after asset approval. Do not move the entire mountain to imitate magma flow.

## Scientific narrative and timing

The Short depicts one simplified gas-rich explosive eruption, not every eruption type. Show a reservoir in rock, a connected conduit and gas expansion as magma rises; avoid suggesting all volcanoes are hollow cones or that pressure increases simply because magma approaches the surface. Magma is called lava after it reaches the surface. USGS explains that eruption styles vary with magma properties and gas escape, and rising magma can release expanding gas as pressure decreases. Sources: [How do volcanoes erupt?](https://www.usgs.gov/faqs/how-do-volcanoes-erupt), [USGS teaching material](https://pubs.usgs.gov/gip/70043848/lesson-1.pdf), [About volcanoes](https://www.usgs.gov/programs/VHP/about-volcanoes).

Draft: `storyboards/volcano.draft.json`, exactly 450 frames at 30 FPS, 1080×1920. Caption sequence: exterior; magma collects; gas bubbles expand as magma rises; ash/gas/lava escape; recap. Reservoir size/depth and the timescale are schematic and compressed; do not imply a literal 15-second geologic sequence. Explain pressure buildup through trapped gas/rock confinement, then expansion during ascent, rather than a misleading universal pressure gauge.

## Stop condition and next action

Professional-quality volcano art is unavailable locally. Stop here under the user's explicit asset-approval instruction. No image-generation workflow is added or invoked. No placeholder images, stock art, simple vector volcano, final volcano MP4, or claimed final render time is provided. See [asset brief](M2_2_ASSET_APPROVAL.md) for the exact seven original illustrations and one derived composite needed.

After approved assets are supplied, verify their real dimensions, alpha, lighting and registration, adjust declared metadata, confirm phone-size composition, then implement only the justified reusable layer controls. Render short motion previews before the full Short. The generic verifier currently provides a combined chronological/boundary sheet; M2.2 also needs a separately named transition sheet derived from the volcano timeline. Do not reuse the legacy planet sheet script's hardcoded boundary frames.

M2.2 remains incomplete at this checkpoint. No commit, push, tag, M2.3, narration, scriptwriting API, automated image generation or publishing work is authorized here.
