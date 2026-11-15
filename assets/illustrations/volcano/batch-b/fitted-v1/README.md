# Batch B — derived geometric fitting and compositing

Status: technical validation passed; **human visual approval pending**. These are derived raster assets, not replacements for the approved source images. No full video, Batch C, commit, push or tag was produced.

## Independently animatable fitted layers

- [magma-chamber-fitted.png](magma-chamber-fitted.png)
- [conduit-magma-fitted.png](conduit-magma-fitted.png)

Both remain RGBA PNGs on the original **1254 × 1254** canvas. Keep their full-canvas origin and scale identical to `../../batch-a/cutaway-rock-v1.png`; do not independently crop or recenter them. Render conduit, chamber, then the **unchanged cutaway rock as foreground occlusion**. The material layers overlap and share matching colors through the junction. Use material/glow/reveal animation within these registered masks; arbitrary independent translation/scaling can reopen gaps and requires renewed coverage checks.

## Requested previews and measurements

- [Magma-only composite](magma-only-composite.png): transparent, fitted material only.
- [Magma behind cutaway](magma-behind-cutaway.png): transparent composite with original rock in front.
- [Before/after alignment](before-after-alignment.png): **left original / right fitted**, with the same rock foreground and charcoal review background.
- [Before/after magma only](before-after-magma-only.png): left original / right fitted, showing the changed footprints.
- [Enlarged junction inspection](junction-before-after-3x.png): **left original / right fitted**, 3× nearest-neighbor enlargement of x440–829/y810–1099. Nearest-neighbor exposes the actual pixels rather than smoothing away defects.
- [Opening mask](opening-mask.png) and [region diagnostic](opening-regions.png): cyan conduit / orange chamber; unrelated canvas/background does not enter the denominator.
- [Alpha-coverage report](alpha-coverage-report.json) and [repeatability report](repeatability-report.json).

## Alpha segmentation and coverage

The actual rock alpha is examined first. A four-connected flood starts at the transparent reservoir point (630,1000), constrained to the rock's scanline enclosure. It selects the connected internal opening, excluding exterior sky/background and disconnected pores. The intended opening contains **107,032 pixels** at rock alpha <128: **92,776 chamber** pixels (y≥880) and **14,256 conduit** pixels (y<880). The extracted mask is saved for human inspection; this is not a rectangular region filled to inflate coverage.

Coverage requires composite magma alpha ≥250/255 at each intended-opening pixel. Before values are recomputed using exactly the same mask/threshold as after, rather than copied from Batch B's earlier rectangular-ROI report, which used different thresholds.

| Region | Before coverage | Fitted coverage | Fitted missing pixels | Largest fitted uncovered region |
| --- | --- | --- | --- | --- |
| Chamber | 84.054066% | **100%** | **0** | **0** |
| Conduit | 76.943042% | **100%** | **0** | **0** |

The junction y850–950 has **zero missing pixels**. The layers overlap at 14,750 pixels above 10% alpha, with zero RGB difference in that overlap. Their alpha ramps are staggered so at least one layer is fully opaque across the intended opening; complementary fades that would create a partly transparent junction are avoided.

## Spill is measured, not hidden

The fitting has a deliberate **one-pixel soft feather underneath the rock**. Thus total raw spill outside the strict alpha-threshold opening is not claimed to be zero.

| Spill measurement | Before | Fitted |
| --- | --- | --- |
| Pixels with any magma alpha outside intended opening | 56,871 | 2,468 |
| Alpha-equivalent pixels outside intended opening | 48,410.7059 | 1,310.8275 |
| Visible alpha-equivalent pixels after rock occlusion | 918.1928 | 300.9527 |
| Pixels outside opening with residual visibility >5% | 1,582 | 1,982 |
| Spill into unrelated exterior/background | 105 pixels | **0 pixels** |

Visible residual is computed as `magmaAlpha × (1 − rockAlpha)`. The fitted residual is confined to the thin opening-edge feather and is approximately **0.281% of the opening area in alpha-equivalent terms**. The count of faint visible edge pixels increases while total visible spill opacity decreases; both are reported so improvement is not overstated. Inspect these edges at native size and phone size before approval. This thin feather avoids a hard cut and does not fill unrelated transparent background.

## Deterministic fitting process

Run from the repository root with Node.js 22, tsx and FFmpeg:

```bash
node --import tsx scripts/fit-magma.ts
# Or pass a fitting configuration explicitly:
node --import tsx scripts/fit-magma.ts assets/illustrations/volcano/batch-b/fitted-v1/fitting-config.json
```

The reusable raster functions live in `scripts/lib/image-fitting.ts`; job-specific source paths, seed, monotonic coordinate knots and blend intervals live in [fitting-config.json](fitting-config.json). No engine template or topic-specific React component is changed.

The process uses smoothed local row contours, monotone cubic coordinate remapping and bilinear premultiplied sampling of the **original painted material**. It extends material from actual painted samples rather than inserting flat-color/black fills. Conduit and chamber textures blend smoothly across a shared junction field. No new AI artwork is generated, no global uniform scale is applied to the original illustrations, and the rock is not deformed or repainted.

Some local compression/expansion and bilinear resampling are inherent in fitting an irregular aperture. The retained currents/crust remain illustrated texture, not a physical fluid simulation. The source painting's lighting is retained; the rock has not been relit. Human review should assess the chamber shoulders, narrow conduit bends, warm edge feather and brightest currents, especially at phone scale. Still-image approval does not validate later motion automatically.

## Verification and source preservation

- TypeScript passed; Vitest **106/106 tests passed across 7 files**, including segmentation, local-map monotonicity/smoothness, alpha interpolation, junction continuity, honest spill counting, region boundaries, repeatability and input-buffer preservation.
- Whitespace checks passed for tracked changes and new text files.
- Two fitting runs produced identical SHA-256 hashes for all **nine PNG outputs**. The saved fitted PNGs were decoded again and independently remeasured; their coverage matches the report.
- All three input file hashes are recorded in the report and checked unchanged after processing. The landscape, volcano exterior and approved Sun/planet sources also remain unchanged. No source image is overwritten.
- The repeatability result applies to this local raster/PNG fitting workflow. It does **not** resolve or guarantee byte-identical future MP4 output.

The original artwork and earlier batch notes remain available beside this derived folder. Await human visual approval before integration or further batches.
