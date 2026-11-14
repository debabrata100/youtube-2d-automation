# M1.2.3 approved Sun integration

## Asset and reusable component

`assets/illustrations/star/sun-approved.png` is an unchanged copy of the user-approved 1254 × 1254 RGBA PNG. SHA-256: `d7fbf21f09cf0e55283ffc25b9e2c737f6b7a05c406746da0b8bcd8f617c7511`.

Remotion serves `assets/` as its public directory in both CLI configuration and programmatic bundling. `IllustratedStar` loads the canonical asset with `staticFile` and `Img`, so rendering waits for image decoding. The existing `Star` wrapper and radius/scale/opacity/intensity API remain compatible. The legacy `rotation` prop supplies an animation frame; it never rotates the PNG.

The transparent image is contained in a square viewport without clipping, stretching, color grading, or an opaque backdrop. Its padded canvas is sized to keep the photosphere near the old procedural disk radius. The painted upper-left illumination stays fixed. All scenes that display the Sun use the same component and asset; accretion and planet reveal retain their original Sun-free composition.

## Animation and semantic layers

- `atmosphere`: soft, low-opacity warm glow with smooth exposure and blur variation.
- `corona-drift`: a faint copy of the approved outer pixels, masked away from the disk and animated by subpixel translation and 0.8% peak-to-peak scale drift. No new shapes are drawn.
- `approved-artwork`: untouched photosphere, original alpha edges, baked lighting and corona.

`starMotionAt(frame)` is pure and independent of evaluation order. Breathing ranges from 0.992 to 1.008 over 210 frames. The main image has no brightness or saturation filter; the low-amplitude glow and corona modulation provide apparent luminosity variation without exposure flicker. The finale now passes its global frame instead of freezing the old procedural star phase.

The registry accurately records these three layers. It does not pretend the PNG contains separately editable surface or shadow layers. Camera/parallax systems, shot presets, JSON plan, five-scene chronology, durations, planet, disk and accretion are unchanged.

## Validation and reproduction

Run `npm run review:sun` to typecheck, test, render opening/disk/finale stills, render a 60-frame half-resolution motion preview, render the 450-frame full-resolution H.264 MP4, decode chronological and transition sheets, run video verification, and compare matching encoded frames against the latest M1.2.2 job. Actual render timing uses a monotonic clock and covers full MP4 rendering/encoding only.

Tests preserve all existing coverage and add asset byte/alpha checks, deterministic evaluation-order checks, bounded breathing/exposure checks, and registry accuracy. The prior semantic-layer test now accepts the Sun's three real layers while retaining the five-layer minimum for procedural assets.

## Limitations and future assets

The flattened PNG cannot support true convection advection, separate limb illumination, or articulated prominences. The restrained masked echo only suggests corona movement. Rotation would move baked light unnaturally and is intentionally disabled. Native detail is limited to the original 1254-pixel square canvas; no upscaling was applied.

A future layered artwork export should include aligned photosphere base, surface currents/highlights, near/far corona and individual prominence layers, all using a common pivot and light direction. Review the more detailed Sun beside the unchanged vector planet and the small finale Sun on a phone.

Human visual approval is pending. M1.2 remains open.
