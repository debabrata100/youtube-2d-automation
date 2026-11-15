# Volcano magma — Batch B

Two original, separately animatable illustration candidates created with the built-in image-generation tool. The user identified `../batch-a/cutaway-rock-v1.png` as the approved reference. That file, its rock geometry, crater and perspective were not changed. New magma artwork awaits human review.

| Asset | Canvas | Alpha / contents |
| --- | --- | --- |
| [magma-chamber-v1.png](magma-chamber-v1.png) | 1254 × 1254 | RGBA PNG; original molten reservoir, cooling crust and convection texture; no surrounding geology |
| [conduit-magma-v1.png](conduit-magma-v1.png) | 1254 × 1254 | RGBA PNG; continuous narrow upward-flowing molten column and wider connecting root; no reservoir or rock |

The full canvases retain their transparent padding. Do not trim alpha bounds or independently recenter either layer. Use identical origins and scale for an initial compositing proof. The chamber and conduit have matching amber/yellow/orange/deep-red material. Their surface flow is painted detail, not baked motion blur or an implemented convection animation. Glow and reveal effects can be added independently later.

## Explicit alignment limitation

**These are clean standalone illustrations, not guaranteed pixel-perfect aperture fills.** Generation followed the reference canvas and measured opening coordinates, and a targeted chamber placement edit improved coverage, but did not produce exact geometry. The artwork is not ready to be presented as fully fitted to every rock opening.

At identical origin/scale, alpha measurements show:

- Lower opening region coverage: **86.50%** using the union of both magma layers.
- Narrow conduit opening region coverage: **85.26%** using the same union.
- Chamber/conduit overlap: **12,120 pixels** above alpha 128, so the material layers overlap rather than having a disconnected junction.
- Both PNG canvases are exactly **1254 × 1254**, with fully transparent pixels outside the material. Chamber alpha-zero pixels: 1,447,307; conduit: 1,531,546.

Coverage is a geometric diagnostic, not a measure of artistic quality or visual approval. Some aperture pixels remain uncovered; overlap alone does not prove a gap-free fill of the approved rock. Local fitting or extending the molten material is still needed. Masking alone cannot fill missing areas. The material also has intentional under-rock excess; after fitting, place it behind the cutaway and use rock occlusion or aperture masks to control its boundary. Inspect the narrow conduit, chamber shoulders and their junction at the intended mobile display size.

The selected chamber visible bounds at alpha >128 are x249–977/y895–1160; conduit bounds are x571–673/y351–1099. The generator only approximately followed the requested centerline/placement, and no subsequent programmatic warping, relocation, masking or repainting was applied. No combined flattened magma asset is delivered.

Full diagnostic thresholds and regions: [alignment-report.json](alignment-report.json). Exact generation/refinement prompts: [prompts.md](prompts.md). No CLI fallback, rendering integration, storyboard changes, commit, push or tag was performed for this batch.

SHA-256:

- Chamber: `54f4fcc8f41a30b394cd9ef9d6965e918c5321e01ce452330b7556ba83eec5d9`
- Conduit: `c2e05a469c55bd74ae19cebd943b3debe6cdc0a46d51332fc73040e3c345c53a`
- Unchanged approved cutaway reference: `f0a1c5130e39b702bd461929c8ddb680bd9e9934367bece5daa31566ee7ed288`
