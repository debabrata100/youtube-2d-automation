# Batch C — fitted production candidates and compositing validation

The Batch C artwork is approved. These **derived fits and still compositions await human visual approval**. No artwork was regenerated. All original Batch A/B/C PNGs, the Sun/planet assets, and the completed M1.2/M2.1 videos remain unchanged. No full volcano video, storyboard integration, M2.3 work, commit, push or tag is included.

## Fitted assets

All registered layers/masks below are **1254 × 1254 RGBA PNGs** with transparent padding. Preserve their common origin and scale.

| File | Use |
| --- | --- |
| [eruption-plume-fitted.png](eruption-plume-fitted.png) | Uniformly placed plume with fixed crater-rim occlusion already applied; suitable for the reviewed still pose |
| [eruption-plume-placed-unoccluded.png](eruption-plume-placed-unoccluded.png) | Same placed plume before rim masking; use this version when later motion requires a fixed foreground rim mask applied after animation |
| [lava-flows-fitted.png](lava-flows-fitted.png) | Locally fitted surface streams; soft terrain-support mask already applied |
| [ash-wisp-fitted.png](ash-wisp-fitted.png) | Optional small downwind wisp, independently positionable/animatable; 55% opacity in this candidate |
| [crater-rim-mask.png](crater-rim-mask.png) | White alpha identifies foreground rock that must occlude the plume; subtract this alpha from plume alpha, not from lava |
| [lava-terrain-mask.png](lava-terrain-mask.png) | Soft interior support mask derived from approved mountain alpha |
| [ground-contact-shadow.png](ground-contact-shadow.png) | Optional subtle compositing shadow under the volcano; shown in the portrait preview |

Do not apply the same mask twice to already masked layers. The approved exterior itself is not cropped, relit, warped or repainted.

## All required visual previews

| Preview | Dimensions | Inspection purpose |
| --- | --- | --- |
| [Fitted plume over volcano](plume-over-volcano.png) | 1254 × 1254 | Crater contact, uniform plume shape and foreground rim |
| [Fitted lava over volcano](lava-over-volcano.png) | 1254 × 1254 | Gully placement and supported lower-flow endings |
| [Combined eruption](combined-eruption.png) | 1254 × 1254 | Fitted lava, rim-occluded plume and optional ash over unchanged exterior |
| [Original versus fitted](original-vs-fitted.png) | 2508 × 1254 | **Left native/unfitted originals; right fitted**, on identical charcoal matte |
| [Enlarged crater junction](crater-junction-3x.png) | 1080 × 630 | Actual pixels at 3× nearest-neighbor; no smoothing that could conceal seams |
| [Enlarged lava endpoints](lava-endpoints-2x.png) | 2420 × 440 | Lower slopes/base at 2× nearest-neighbor |
| [Final 9:16 scene composition](scene-9x16.png) | **1080 × 1920** | Volcano against the approved landscape, with contact shadow and ample upper caption/camera space; still preview only |

The portrait uses a uniform cover fit of the approved 941×1672 landscape and a shared 0.78 scene scale for the registered eruption group. Ground contact is placed at scene y1250. The original landscape PNG is not modified. The preview is a single composition proof, not a rendered educational Short.

## How the fitting works

**Plume:** uniform scale **0.3**, with source base (567,966) anchored beneath the front-inner rim at (640,334). No nonuniform stretching, cloud reshaping or repainting. A hand-reviewed rim profile follows the original crater geometry, sampled with a three-pixel soft transition and the actual rock alpha. The plume enters behind that foreground edge. The provided unoccluded version keeps the full placed cloud available for later motion.

**Lava:** a smooth monotone vertical remap relocates the original overhanging lower tongues onto the lower slopes. A tapered root correction aligns supply to the summit/front overflow area; a localized left-branch correction follows the visible flank. The original molten cores, cooling margins and branching network are bilinearly resampled with premultiplied alpha. Only after deformation is a three-pixel soft interior terrain mask applied. Unsupported pools are relocated onto the mountain rather than kept floating or indiscriminately chopped off. No separate supporting foreground pool is invented.

**Ash:** the independent wisp uses uniform scale 0.18 and a separate downwind anchor, not a duplicate of the entire main plume. It can later use modest independent drift, opacity, scale and depth variation. The reviewed still has no visible overlap with the main plume. Later animation must recheck overlap and frame bounds.

## Measured technical validation

[alignment-report.json](alignment-report.json) records exact configuration, dimensions, hashes, statistics and limitations. [repeatability-report.json](repeatability-report.json) records two actual reruns and independent decoding of the saved PNGs.

| Measurement | Result |
| --- | --- |
| Native original lava silhouette support | 76.518207% under this pass's alpha≥128 terrain definition |
| Support after geometric remap, **before masking** | **100% of visible pixels** |
| Unsupported fitted lava pixels, including any alpha | **0** |
| Remapped material opacity retained by the final terrain mask | **99.996434%** |
| Final visible lava bounds | x64–1109 / y320–762 |
| Visible lower endpoints above the mountain's maximum base y792 | **30 pixels** |
| Plume pixels passing through fully opaque foreground rim mask | **0** at visibility threshold >5% |
| Smoke pixels on lower mountain at y≥365 | **0** at visibility threshold >5% |
| Native visible plume top headroom | **61 pixels** |
| Visible plume pixels at the rim connection band | **161** |
| Optional ash pixels overlapping visible main plume | **0** under reported >10% alpha masks |
| Portrait background | Opaque to all frame edges; no transparent border |
| Rerun output hashes | **14/14 PNGs identical** in this environment |
| TypeScript / Vitest | Passed; **114 tests across 8 files** |

The terrain mask removes only approximately 0.0036% of the remapped opacity, consisting of faint boundary residue. The unsupported original pools were handled by geometry first, not hidden by deleting a large part of the artwork. The slight difference from the earlier Batch C silhouette percentage comes from consistently counting terrain alpha≥128 here rather than >128.

All 26 protected files in the local validation snapshot remained hash-identical: approved/source PNGs and prior derived PNGs outside this folder, plus the two completed videos. The original M1.2 and M2.1 video hashes also match their approval receipts. Source hashes and availability of historical video files are explicit in the report; a fresh clone without ignored job outputs cannot recheck absent historical MP4s.

## Layering contract for later integration

1. Approved landscape background, fitted uniformly to the portrait canvas.
2. Optional derived contact shadow for this framing.
3. Approved volcano exterior with its original registration.
4. Fitted lava with its terrain mask fixed relative to the volcano. If later geometric motion changes the streams, apply terrain support **after** that motion.
5. Plume with crater-rim occlusion. For static use, the fitted plume has the mask baked into derived alpha. For drift/breathing, animate the unoccluded placed plume first, then apply `plumeAlpha × (1 − rimMaskAlpha)` with the rim fixed to the volcano. Do not place the rim mask over lava: surface overflow must remain in front of the exterior.
6. Optional foreground ash and particles, with restrained independent motion and parallax.

This landscape is a flattened painted plate, so its internal foreground rocks are not separate parallax layers. The reviewed framing avoids placing unsupported lava into those rocks. Any new camera framing or foreground occlusion requires another composition check.

## Reproduce without touching originals

```bash
node --import tsx scripts/fit-eruption.ts
node --import tsx scripts/verify-eruption-fit.ts
npm run typecheck
npm test
git diff --check
```

`fitting-config.json` holds the reviewed anchors, local deformation knots, rim profile, ash placement and scene framing. Reusable offline raster math lives in `scripts/lib/raster-compositing.ts` and reuses `scripts/lib/image-fitting.ts`. No topic-specific engine component is added. Rerunning replaces only the derived files in this folder.

## Remaining artistic review

- Gully placement is fitted against a hand-painted **2D** image, not a terrain height field or fluid simulation. Confirm the bright branches and rounded terminal lobes at phone size.
- Some local compression/resampling of lava texture is inherent in the fit. Source detail is retained through material sampling; the source PNGs are untouched.
- The plume's modest scale preserves headroom and the whole cloud shape. A substantially larger eruption would require a new framing choice. Confirm plume scale, vent contact and brightest lava against the landscape.
- Rock lighting remains the approved baked painting; no dynamic relighting is added. Inspect the contact shadow and volcano foot in the portrait composition.
- Still validation does not approve later animated reveals, drifting clouds or changed camera poses. Revalidate masks/occlusion after motion is implemented.

Stop for human visual approval before integrating Batch C into the full volcano storyboard. No full 15-second volcano render has been started. Raster/PNG repeatability does not guarantee byte-identical future MP4 output.
