# YouTube 2D Automation — M1.2 complete

A deterministic 2D animation engine and a 15-second vertical science explainer, **How Planets Form**. M1.2 received human visual approval on 2026-11-14 as the project's illustrated animation baseline. The sequence simplifies a process that takes millions of years.

## Setup

Use Node.js 22, npm, FFmpeg and ffprobe on PATH. The current macOS renderer configuration uses Google Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`; other environments need an appropriate Remotion browser configuration.

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run render
npm run review
```

`render` produces a unique `jobs/planet-formation-m1-2-5-<timestamp>/output/animation.mp4`. `review` also runs checks, extracts preview/chronological/transition sheets and writes verification and render reports. It works without historical job directories. A newly rendered artifact does not automatically inherit visual approval.

```bash
npm run verify -- jobs/<job-directory>
# Optional staged development review; requires the local M1.2.4 comparison job:
npm run review:polish -- A
npm run review:polish -- B jobs/<job-directory>
npm run review:polish -- C jobs/<job-directory>
npm run review:polish -- final jobs/<job-directory>
```

Earlier Sun and planet checkpoint workflows remain available as `review:sun` and `review:planet`; their comparisons require earlier local outputs. All render-time assets are local. Rendering makes no LLM or image-generation API calls.

## AI-assisted illustration workflow

1. Develop explicit art direction and original artwork with the built-in image-generation tool, outside the render pipeline.
2. Inspect and refine candidate images; obtain human visual approval.
3. Preserve the approved RGBA PNG pixels, proportions and fixed upper-left light direction. Check source hashes, alpha and bounds.
4. Integrate the asset into semantic illustration layers through Remotion `Img`, `staticFile` and the `assets/` public directory.
5. Add restrained deterministic compositing/motion, validate several sizes and adjacent encoded frames, then obtain approval for the finished video.

Approved assets and prompt provenance are committed. The canonical Sun is [sun-approved.png](assets/illustrations/star/sun-approved.png); an identical root-level approved copy is retained as the provenance/test fixture. The planet is [rocky-planet-approved.png](assets/illustrations/planet/rocky-planet-approved.png). Both are native 1254 × 1254 RGBA images. Superseded draft artwork stays local and is ignored.

## Reusable architecture

- `src/plans/planet-formation.json`: JSON scene configuration, checked by Zod for unique IDs and ordered, contiguous coverage of all 450 frames.
- `src/illustrations`: reusable semantic layers, registry, style tokens, approved raster illustrations and procedural space materials.
- `src/components`: compatible Star/Planet wrappers, seeded debris, particles, text, layered background and Camera2D.
- `src/composition`: establishing, explanatory, tracking, detail and hero shot presets, plus the final composition.
- `src/motion`: frame-based orbital motion, differential disk rotation, convergence, contact timing, absorption, continuous mass growth and restrained celestial motion.
- `src/timeline`: explicit chronological frame-to-scene mapping.
- `src/scenes`: five scene templates. Subjects are pose-matched at boundaries; foreground occlusion and environment entrances replace generic full-scene overlap. The reusable transition helper remains available, but production scene overlap is zero.
- `scripts`: unique-job rendering, source-asset audits, staged previews, numbered sheets decoded from actual MP4s and FFmpeg verification.
- `src/tests`: schema/timeline, determinism, illustration configuration, asset integrity, impact/growth, camera/subject continuity and final-caption checks.

The approved Sun uses gentle breathing, glow and a faint masked corona echo. The planet uses a stationary approved texture revealed inside an evolving irregular body; seeded contact events drive mass growth and localized effects. Whole-PNG rotation is avoided because shading is baked into the artwork. Camera movement, parallax, orbital motion and the final caption hold provide continuity.

To add a topic, create a validated JSON plan and extend the scene-template map/schema with components accepting `SceneProps`. Reuse illustration and motion primitives, and add relevant timing and continuity checks. Some current subject poses and effect constants remain specific to this five-scene example; the plan does not expose every art-direction decision.

## Final approved and verified output

Approved reference job: `jobs/planet-formation-m1-2-5-2026-11-14T05-41-24-380Z/`.

- [Final MP4](jobs/planet-formation-m1-2-5-2026-11-14T05-41-24-380Z/output/animation.mp4)
- [Comparison](jobs/planet-formation-m1-2-5-2026-11-14T05-41-24-380Z/before-after-contact-sheet.png), [chronological sheet](jobs/planet-formation-m1-2-5-2026-11-14T05-41-24-380Z/chronological-contact-sheet.png), [transition sheet](jobs/planet-formation-m1-2-5-2026-11-14T05-41-24-380Z/transition-contact-sheet.png)
- 1080 × 1920; 30 FPS; 450 frames; H.264; 15.000 seconds; no detected black frames or timeline gaps.
- TypeScript, 61 Vitest tests and whitespace checks passed at closeout.
- Measured full rendering/encoding: 38.44 seconds (11.71 effective frames/s); Node coordinator peak RSS 132.6 MB, excluding Chrome/FFmpeg.

Jobs, videos, generated preview sheets, logs and scratch outputs are intentionally ignored and are not distributed by Git. Those local links will be absent on a fresh clone until outputs are regenerated or copied separately. The committed [closeout record](docs/M1_2_CLOSEOUT.md) and [verification receipt](docs/M1_2_FINAL_VERIFICATION.json) identify the exact approved media and assets without checking in generated media.

## Current limitations

The approved artwork has flattened lighting and cannot provide real independent surface rotation or articulated plasma. Accretion and disk dynamics are stylized 2D approximations, not physical simulations. Procedural debris remains less detailed than painted assets, and tiny features may soften after platform compression. Camera interpolation is smooth but equal-spacing assumptions and scene-specific pose constants limit arbitrary retiming. Some schema fields and preset depth metadata are descriptive rather than universally applied controls.

The engine has main educational text, but no narration, audio, word-timed subtitles, publishing or automatic image generation. Automated checks validate technical structure; they do not infer scene identity from pixels or replace human visual review. Future exports could separate albedo, shading, corona, molten details and silhouettes into aligned layers.

Historical checkpoint documents retain their review-time pending statuses; the approved closeout record supersedes them. M2 has not started. See [ROADMAP](docs/ROADMAP.md) and the [visual style guide](docs/VISUAL_STYLE_GUIDE.md).
