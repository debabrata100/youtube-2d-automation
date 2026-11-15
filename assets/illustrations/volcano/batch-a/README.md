# Volcano environment — Batch A

Original illustrated candidates generated on 2026-11-14 using the built-in image-generation tool. Awaiting human visual approval. These are separate PNG assets; no combined collage or Remotion integration is substituted for the artwork.

| File | Native dimensions | Format | Purpose |
| --- | --- | --- | --- |
| [landscape-v1.png](landscape-v1.png) | 941 × 1672 | Opaque RGB PNG | Near-9:16 portrait terrain/sky plate with a clear central basin for the separate volcano |
| [exterior-v1.png](exterior-v1.png) | 1254 × 1254 | RGBA PNG | Dormant isolated stratovolcano; no painted sky, plume or lava |
| [cutaway-rock-v1.png](cutaway-rock-v1.png) | 1254 × 1254 | RGBA PNG | Matching mountain with geological strata and empty alpha openings for future magma/conduit layers |

Native files are preserved without artificial upscaling. Generated dimensions are below the requested preferred 2K targets. The landscape ratio is approximately 9:16 (941/1672); a final 1080×1920 composition can fit it with negligible edge crop. It is a single painted background plate: the terrain has foreground/middle-ground/background depth, but its internal ranges are not separate parallax files. Exterior and cutaway remain independently compositable from the landscape.

## Registration and alpha checks

Use the full square canvas for both exterior and cutaway: identical scale, identical x/y origin, no individual alpha-bound trimming or independent recentering. The top of the visible rock is y=219 in both. Exterior rock bounds at alpha >128: x=20–1234, y=219–792. Cutaway bounds: x=13–1240, y=219–1203; the extra lower area is intentional underground rock. Align the ground reference near y=790 when matching the two illustrations.

Above-ground outer-edge comparison across rows y=240–739: mean deviation 1.64 pixels; 95th percentile 4 pixels; maximum 18 pixels at fine ridge detail on the 1254-pixel canvas. This is closely registered original painterly artwork, not a promise of identical silhouette pixels. Review crossfades at intended display size; retaining the shared transform avoids an introduced scale/position jump. The cutaway deliberately changes interior texture and adds underground strata.

Alpha-zero pixels: exterior 1,125,298; cutaway 770,758. The chamber interior and the narrow connected conduit are genuine alpha openings rather than a painted black fill; magmatic layers can be placed behind the cutaway. PNG edges include partial alpha. Exterior/cutaway visible margins are narrow, so retain the full canvas and avoid transformations that clip their rock edges.

The initial exterior's external atmospheric halo was removed with a targeted image-generation edit. No code-based repainting, background-removal shortcut or compositing alteration was applied to these delivered images. Approved Sun and rocky-planet reference hashes are unchanged.

## Source provenance

Style references: `assets/illustrations/star/sun-approved.png` and `assets/illustrations/planet/rocky-planet-approved.png`. The selected exterior is the geometry/lighting reference for the cutaway and the lighting reference for the landscape. Neither celestial subject appears in the new artwork. Exact prompts and edit invariants: [prompts.md](prompts.md).

SHA-256:

- Landscape: `c2a7e03b207aa71bafa8355b95bb95c08ffb0b2e18de8930356e10107b24781f`
- Exterior: `f659ab75f123a7b13d3f1e32abaf087dc1f4966162e2c583d4fe0f944c750ce8`
- Cutaway: `f0a1c5130e39b702bd461929c8ddb680bd9e9934367bece5daa31566ee7ed288`

The files are review candidates under `batch-a/`, not replacements for future approved canonical paths. No storyboard asset metadata, approved original assets or rendering behavior has been changed. Future magma, conduit, lava and ash illustrations must follow these canvas anchors; final scene framing still needs a compositing proof after approval. No commit, push, tag or final video render is part of this batch.
