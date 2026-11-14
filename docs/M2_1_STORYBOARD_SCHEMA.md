# M2.1 storyboard schema and authoring

The version `2.1` generic schema is implemented in `src/engine/storyboard/schema.ts` with Zod-derived TypeScript types. It is separate from the approved planet-formation version `1.0` schema. This is an authoring interface for deterministic local rendering, not an AI scriptwriter.

## Author and render

Copy `storyboards/generic-demo.json`, change its project ID/title, register local assets, then arrange/configure the five available templates. No React changes are needed to create another storyboard using existing templates, formats and presets. Implementing a new kind of template still requires source code and validation changes.

```bash
npm run render:storyboard -- storyboards/generic-demo.json
npm run verify:storyboard -- jobs/<generic-job>
npm run typecheck
npm test
```

Render performs schema/reference validation and actual local-file preflight before bundling. It writes an immutable input snapshot, H.264 MP4, timing report, encoded-frame samples, numbered contact sheet and verification report under a unique ignored job directory. Verification uses the job snapshot rather than the current source demo. A new render always awaits human visual approval.

## Top-level data

| Field | Meaning |
| --- | --- |
| schemaVersion | Exactly `2.1` |
| projectId / title | Slug for job paths and a human-readable title |
| format | Even integer width/height, 320–3840; integer fps, 1–60 |
| styleId | Currently `cinematic-illustrated`; no external stylesheet execution |
| background / accent | Optional six-digit hex colors; defaults `#10152e` / `#ffd166` |
| assets | 1–100 uniquely named local asset declarations |
| scenes | 1–100 scene configurations, **array order is playback order** |

Total frame count is the sum of scene durations. Start/end frames are derived as contiguous half-open ranges `[start,end)` and are not independently editable. The composition metadata comes from the selected storyboard, including alternate formats and frame rates. Seconds are `frame / fps`; no wall clock controls visuals.

## Assets

```json
{"id":"subject-a","path":"illustrations/star/sun-approved.png","type":"png","width":1254,"height":1254,"transparent":true,"styleId":"cinematic-illustrated"}
```

Paths are relative to `assets/`; PNG, SVG and WebP are supported by the registry and Remotion Img. URLs, traversal, absolute paths, unknown extensions and mismatched type/extensions are rejected. IDs are unique; multiple scenes may reference the same ID. Dimensions are required and determine proportions; transparent/style metadata is optional. Preflight checks real paths, actual raster codecs/dimensions and alpha-capable raster formats when transparency is declared. SVG dimensions use explicit pixel dimensions or viewBox; percentage-only SVG without a viewBox is unsupported. SVG transparency is declarative, not pixel-audited. Alpha capability does not prove nonopaque pixels. Artwork itself remains trusted, human-reviewed local input.

Each subject has `asset`, normalized `x`, `y`, and `size` (image width / canvas width). Defaults: `.5`, `.56`, `.65`. Alpha padding is retained; size refers to the entire image, not opaque silhouette bounds. The image is never stretched, recolored or rotated. Normalized positioning supports different formats but does not automatically art-direct layouts or prevent clipping for every aspect ratio.

## Common scene fields

Every scene requires `id`, `template`, `durationFrames`, `caption` and `config`. Optional fields: `camera`, `motion`, `seed`, `transitionFrames`. Unknown keys are rejected so typos cannot silently disable configuration. Zod errors include field paths, duplicate IDs and missing reference names.

- `durationFrames`: integer 12–18000; transition envelopes must leave a hold.
- `caption`: text (1–180 characters), optional preset `headline` / `body` / `closing`, kicker (up to 60 characters), six-digit color. Line breaks are supported. Captions occupy the top safe area, scale with canvas width and use a local Arial/sans-serif stack. Authors must review line wrapping/readability for their chosen format.
- `seed`: integer 0–4294967295, default 1; controls deterministic particle variation.
- `transitionFrames`: 0–30, default 6; must be less than half the scene duration. Subjects and captions ease to/from zero opacity over a persistent background. Independent scenes do not overlap. Setting zero explicitly requests a cut. This simple envelope deliberately differs from the production prototype's bespoke matched choreography.

## Template payloads

| Template | Required config | Optional config / behavior |
| --- | --- | --- |
| hero-reveal | primary subject | One illustrated subject; configured camera/motion provide reveal |
| orbital-environment | primary subject | secondary subject, count (1–100), radiusX (.05–.4 canvas width), radiusY (.02–.2 canvas height), cycles (integer 1–4) |
| transformation | primary subject | fromScale (.1–1, default .35), toScale (.1–1, default 1), count (1–100, used by convergence) |
| comparison | left and right subjects | leftLabel/rightLabel; explicit normalized positions establish visual hierarchy |
| summary | subjects array (1–5) | Each subject has independent asset, position and size |

Orbital secondary x/y define its orbit center; use the primary x/y for an orbit about the central subject. Count controls seeded particles and cycles controls orbital phase; particle depth varies angular speed. Transformation interpolates size with smoothstep; it does not invent new geology or morph arbitrary image pixels. With `particle-convergence`, existing convergence utilities run on a normalized 120-frame internal phase stretched over the actual duration. Comparison labels sit below each configured subject.

## Camera and motion

| Camera preset | Parameters | Behavior |
| --- | --- | --- |
| static | none | Centered neutral camera |
| slow-push | amount (0–.3, default .1) | Ease toward a closer view, then settle back |
| pull-back | amount | Ease outward, then settle back |
| tracking | offsetX/offsetY (-.2–.2 normalized) | Track toward an offset, then settle back |

Camera reuses cameraPoseAt with a scene-local eased phase. All presets return to a common neutral pose with zero endpoint velocity; this avoids a camera jump under arbitrary scene arrangements. These initial presets are self-contained moves, not a general cross-scene camera solver. Offset fields apply to tracking, amount to push/pull.

| Motion preset | Behavior |
| --- | --- |
| still | Fixed subject |
| gentle-drift | Restrained translation returning to its origin |
| hero-reveal | Scale .92 → 1 during the early scene |
| orbit | Small elliptical subject translation, returning to neutral |
| particle-convergence | Transformation-only seeded particle convergence |

Motion amplitude (0–.15 normalized, default .025) and cycles (integer 1–4, default 1) apply to drift/orbit. Other presets have their documented behavior; camera motion is configured independently. No whole-image rotation moves baked lighting. Existing easing, orbit, particles and convergence functions supply the math; JSON never contains executable JavaScript.

## Legacy compatibility

`adaptPlanetFormation` parses the existing plan and returns a `planet-formation-v1` envelope. `LegacyStoryboard` delegates directly to the untouched PlanetFormation composition, preserving all approved subject poses, effects, scene timing and PNGs. It does not approximate the bespoke scenes with generic templates. The existing PlanetFormation composition and commands remain available.

```bash
# Capture the original before changing code:
node --import tsx scripts/render.ts
# After changes, render the adapter, compare, and verify:
npm run check:compatibility -- jobs/<pre-change-planet-job>
```

The compatibility command requires local approved M1.2 output identified by the closeout receipt; generated jobs are not committed. It records decoded frame comparisons, representative before/after stills and legacy video verification. See the compatibility report for measured results and rendering limitations.
