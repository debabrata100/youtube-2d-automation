# M2.2.1 cinematic motion refinement

Status: **awaiting human visual approval**. M2.2 is not closed. No commit, push, tag, AI agents, new artwork generation or M2.3 implementation was performed.

## Scope and storyboard

The pre-code [motion audit](M2_2_1_MOTION_AUDIT.md) identified the existing weak push, opacity-only cutaway, static molten material after its reveal, compact plume and exterior-only ending. Production refinement: `storyboards/volcano-m2-2-1.json`. The earlier `storyboards/volcano.json` and its encoded M2.2 video are preserved.

No timing redistribution was needed: five scenes remain exactly 90 frames each, with boundaries 0/90/180/270/360/450. Eight-frame overlaps remain intentional. Scheduled incoming scene labels may accompany outgoing imagery at the first overlap frame; this is not a chronology defect.

| Scene | Refinement |
| --- | --- |
| 0–3 s / hero-reveal | Camera zoom 0.94→1.09 using existing eased endpoints; slower backdrop scale/offset produces restrained differential parallax |
| 3–6 s / comparison | Registered downward spatial reveal replaces the exterior with the cross-section; full material backing prevents openings exposing the landscape |
| 6–9 s / transformation | Upward conduit reveal plus a soft upward traveling highlight, with a stationary base image; chamber illumination remains restrained |
| 9–12 s / orbital-environment | Short small-plume buildup, faster anchored burst, then slower growth; ash drifts independently; lava starts later and progresses along branches |
| 12–15 s / summary | A second registered cutaway reveals the complete reservoir→conduit→crater→surface relationship while plume, ash and flow continue; caption reads “Magma feeds the eruption” |

The final camera settles and holds for 40 frames. The closing caption remains visible through frame 449. Surface lava and the cross-section are an educational overlay, not a literal view through the mountain; the diagram preserves the original scientific meaning and compressed timescale.

## Reusable engine changes

All five existing template types remain in use. **Zero new template types, zero new React components, zero volcano-specific React components** were introduced in this refinement. The existing `LayeredSubject` and storyboard compositor were extended. The camera implementation, original preset behavior and seeded particle system are retained.

| New/modified control | Operational behavior |
| --- | --- |
| `reveal.invert` | Inverts the existing directional wipe; an exterior cover recedes as the registered interior is exposed |
| `flow.type: directional` | Validated direction, period, phase, band width, bounds and opacity drive a soft highlight clipped to source alpha; the base image never translates |
| `flow.type: path` | Validated timed mask keys and opacity interpolate independent highlight bands over a previously fitted path network; timing comes from mask keys, not unused directional parameters |
| `maskPadding` | Extends an animated layer's mask region so uniform pivot growth can use existing transparent headroom; fixed crater occlusion stays after transforms |
| `backdrop.motion` | Bounded frame-keyed scale/x/y tracks add parallax while maintaining full-screen coverage |

Flow types are a strict discriminated union: path flow does not accept inoperative direction/period controls. These capabilities contain no volcano asset IDs or special cases. Asset identity, timing, camera endpoints, masks and layering remain JSON data.

The cutaway uses a 12-source-pixel feather on the disappearing exterior. The opaque interior wipe advances with 24 pixels of additional extent and no fade, fully underlapping that feather. This prevents the opacity loss that occurs when two complementary semi-transparent images are composited over a landscape. Reservoir, dark cavity and rock use identical registered fronts. Magma is behind the foreground cutaway. There is no whole-conduit translation or whole-chamber scale.

Plume scale rises from 0.65 through 0.72 to 1.50 during the initial burst, then gradually reaches 1.82. Its source-coordinate pivot remains (640,334). Uniform growth preserves proportions, and a fixed inverse-alpha crater-rim mask preserves the vent attachment. The mask extent adds 320 pixels of computational headroom without changing PNG registration. The plume's visible bounds remain inside the vertical canvas and below captions. The ash wisp drifts separately; no duplicated main plume, rotation or rubber-like deformation is added.

## Derived masks and asset preservation

The 17 new `assets/illustrations/volcano/flow-masks-v1/path-band-*.png` masks are derived by `scripts/prepare-flow-masks.ts`. It reads first-arrival rank from the existing nested geodesic lava masks and builds Gaussian highlight bands along that path. Source alpha and the existing reveal mask clip every highlight during rendering. Revealed lava remains fixed to its fitted terrain; no new lava pixels are painted. Two low-opacity highlight traversals use explicit timing keys rather than a conspicuous looping image offset. Repeated preparation produced **17/17 identical PNGs**.

Approved Batch A/B/C sources and fitted images are unchanged. Existing source registration remains 1254×1254; landscape remains 941×1672. The new storyboard has 49 registered files (32 existing plus 17 derived masks) and five reusable illustration groups. No source PNGs, prior masks, approved Sun/planet assets or earlier videos were overwritten. Before/after hashes and the prior baseline receipts are checked in the job's preservation and compatibility reports.

## Review and technical verification

Full encoded output, whole-second chronology, boundaries and focused motion samples are reviewed in three passes documented in `visual-review-report.md`:

1. Story/composition: narrative order, readable captions, spatial cutaway and final relationship.
2. Motion: opening/parallax, rising magma highlight, pivot growth, ash drift, progressive downhill flow and overlaps.
3. Polish: full-resolution decoded frames and enlarged crater, chamber/conduit and lava-edge crops; registration, source edges, occlusion and final hold.

Short encoded previews are supplied for the cutaway, magma ascent, eruption and downhill lava. The before/after image compares encoded M2.2 (top) with M2.2.1 (bottom) at frames 0,125,225,330,420.

TypeScript, the complete Vitest suite (**146 tests / 10 files**) and `git diff --check` pass. The 19 added cases cover generic flow directions and determinism, validation, opt-in defaults, storyboard timing, registrations, camera continuity, safe parallax, opaque wipe underlap, stationary conduit flow, ordered path bands, plume pivot/mask headroom, visible bounds, final hold/drift and previous-video preservation. Earlier tests continue checking approved source/fitted hashes and actual nested reveal PNG alpha.

Existing compatibility methodology: **10/10 lossless sampled frames match** commit `a1e84941967e5bd7ef875d91e2cb68fa540afe6c`: GenericStoryboard frames 29,89,149,209,239,240,269 and PlanetFormation frames 0,225,420. This preserves the generic demo's approved intentional backdrop dip. Both old approved videos and the previous M2.2 video retain their recorded hashes. This is sampled renderer compatibility evidence, not an exhaustive new render of the old videos.

The full encoded video passed FFprobe dimensions/FPS/frame count/duration/codec checks, a full FFmpeg decode, individual-frame black detection, contiguous timeline checks and ordered decoded sample extraction. The exact results and measured performance are recorded below and in the job reports. Frame-driven calculations and derived masks are deterministic; byte-identical H.264 files are not guaranteed.

## Output and measured performance

Job: `jobs/volcano-m2-2-1-2026-11-14T14-31-45-728Z/`.

- `output/animation.mp4`
- `storyboard.json`
- `chronological-contact-sheet.png`, `transition-contact-sheet.png`, `motion-audit-contact-sheet.png`
- `before-after-comparison.png`
- `previews/cutaway-motion.mp4`, `magma-motion.mp4`, `eruption-motion.mp4`, `lava-motion.mp4`
- `decoded-review/` full-resolution frames, frame manifest and enlarged polish crops
- `verification-report.json`, `render-report.json`, `compatibility-report.json`
- `asset-preservation-report.json`, `flow-mask-repeatability.json`, `visual-review-report.md`

Final measured render/encoding: **56.46 seconds**, compared with 40.86 seconds for M2.2 (**+15.60 seconds, +38.18%**, 1.38×). This excludes bundling, previews, compatibility comparisons and verification. The extra masked flow passes, larger plume and complete-process final group add compositing work; practical runtime remains under one minute for the 15-second video on this run. Node coordinator sampled peak RSS: **146.0 MB**, excluding Chrome/FFmpeg; this is not total renderer peak memory. All technical video checks passed. The refinement preservation audit checked **41 unchanged protected paths**.

## Remaining limitations

The approved flattened plume supports anchored uniform growth, reveal and independent ash, not internal smoke simulation or independently billowing main-cloud lobes. Scaling the supplied fitted plume modestly softens its finest detail. Molten motion uses restrained clipped lighting cues over fixed painted material, not physical advection. Surface channels and reservoir geometry are illustrative; lava overlays the cutaway as an explanatory diagram. The underground rock remains a schematic block over the landscape. Human review should assess mobile label clarity, plume texture softness, the cutaway-front presentation, flow-highlight visibility, eruption pacing and the final composite's density.

Three decoded-image review passes do not constitute human visual approval or an independently observed normal-speed playback review. The MP4 and four motion clips are provided for that final playback judgment. No audio was requested or added.
