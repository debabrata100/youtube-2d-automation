# YouTube 2D Automation — M1.1

An original, deterministic 2D motion-graphics engine and a cinematic 15-second vertical explainer, **How Planets Form**. The demonstration is a visual simplification: planet formation takes millions of years, not seconds.

## Requirements and setup

- Node.js 22
- npm
- FFmpeg and ffprobe on `PATH`

```bash
npm install
npm run dev
```

## Architecture

`src/plans/planet-formation.json` is the source of truth. Zod validates video metadata, ordered scene coverage, unique IDs, supported templates, transitions, and visual/motion parameters before Remotion registers the composition. `PlanetFormation.tsx` converts each plan entry into a Remotion `Sequence` and dispatches the selected reusable scene template.

- `src/components`: topic-neutral SVG illustrations, text, particles, background, and virtual camera.
- `src/motion`: seeded particles, elliptical paths, easing, transforms, and transitions.
- `src/scenes`: five reusable templates configured by plan data.
- `scripts`: unique-job rendering, ffprobe verification, frame extraction, and contact-sheet generation.
- `src/tests`: schema, timeline, deterministic motion, boundary, camera, safe-area, and render configuration checks.

No network calls or external media are used while rendering.

## Commands

```bash
npm run dev        # Remotion Studio preview
npm run typecheck  # strict TypeScript validation
npm test           # Vitest suite
npm run render     # render final video into a unique jobs directory
npm run review     # typecheck, test, render, contact sheet, ffprobe verification, reports
```

## Scene-plan schema

Each scene declares `id`, `template`, `startFrame`, `durationFrames`, `title`, `transition`, `visual`, and `animation`. Scenes must be ordered, contiguous, within the video boundary, and collectively cover all 450 frames. Visual settings include accent, density, seed, and glow. Animation settings include camera zoom, orbit speed, and direction.

## Reusable animation pieces

- Orbit paths accept center, horizontal/vertical radii, speed, phase, and direction.
- Particle fields are created once from a numeric seed; frame number alone drives movement.
- Camera2D converts focus and zoom into a stable 2D transform.
- Multi-stage camera keyframes smoothly interpolate focus, zoom, tracking, and rotation.
- ConvergenceField provides reusable staggered spiral assembly with depth-aware shrinking and blending.
- AnimatedText provides eased entry, timed exit, hierarchy, and safe margins.
- Crossfade, directional wipe, and zoom transitions share boundary-safe progress logic and render with overlap for continuity.

## Adding a scene template

1. Add its name to `templateSchema`.
2. Build a component accepting `SceneProps` rather than hardcoded global timing.
3. Register it in the template map in `PlanetFormation.tsx`.
4. Add a contiguous entry to a scene plan and update the plan duration if needed.
5. Add tests for new parameters and boundary behavior.

To render another video, create another validated JSON plan, pass it through a composition registration, and reuse or extend the template map. Illustration content may change while motion primitives remain shared.

## Output and limitations

Every render uses `jobs/planet-formation-<ISO timestamp>/`. Generated jobs are Git-ignored. The review command writes the H.264 MP4, scene-plan snapshot, previews, contact sheet, render report, implementation report, and verification report.

Automated inspection checks technical correctness and unintended black frames but cannot certify taste or professional visual quality. M1.1 has no narration, audio, captions, generated assets, physics simulation, or automatic publishing. Human visual approval remains required.

See [docs/ROADMAP.md](docs/ROADMAP.md) for intentionally deferred work.
