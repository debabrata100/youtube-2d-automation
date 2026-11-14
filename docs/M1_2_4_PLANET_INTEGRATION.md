# M1.2.4 approved rocky planet integration

## Source audit

The approved source is `assets/illustrations/planet/rocky-planet-approved.png`, a 1254 × 1254 8-bit RGBA PNG. SHA-256: `9ca412dbfbf32c8dfbdd83552e9d64e7983fa47fece5ba899bd670890efa11b6`.

Decoded alpha above 8/255 occupies x=140–1110 and y=129–1124. All four corner pixels are transparent; over 700,000 pixels are fully transparent. Very faint pixels exist outside the visible body, including close to the canvas edges. The source is not edited, cropped, resampled on disk, recolored, or replaced. Its natural slight vertical ellipticity and upper-left illumination are retained.

## Reusable component and hybrid formation

`IllustratedRockyPlanet` keeps its public position, radius, scale, opacity, formation, detail and frame API. `Planet` remains the scene-facing wrapper. A new optional glow multiplier controls only added atmospheric/rim layers. The legacy rotation prop remains an animation clock, not a rotation of baked lighting.

The semantic registry records five actual layers: atmosphere, growing-body silhouette, approved-surface material, formation-fractures highlights and rim-light. Remotion `Img` waits for image loading and uses the existing assets public directory. A square contained image preserves the original aspect ratio and full transparent extent. Unique React IDs prevent animated radius changes from invalidating gradient/clip references.

During accretion, the original irregular-mass approach is retained as a warm, directionally lit substrate. A single approved image stays locked to that mass's center and material coordinates. A soft radial mask introduces its geography while the shared silhouette grows from irregular to smooth. The substrate fades before completion; the clip expands beyond the visible body and is then removed. This avoids separately positioned crossfading planets or a sudden texture swap at 10 seconds.

Existing seeded impacts, flashes, scars, ejecta and particle convergence remain active. Contact radius now follows the silhouette envelope so impacts do not float outside the smaller early mass. The large accretion glow fades over its last 20 frames to avoid a hard exposure/halo change at the hero cut.

## Continuity and restrained motion

Whole-image rotation is disabled. Pure frame-based functions add 0.3% peak-to-peak breathing, very weak warm rim variation and soft glow. The geography and source light direction remain fixed. Existing camera motion, parallax and environmental particles provide most perceived motion.

At frame 300, the incoming hero scale is derived from outgoing radius 156, camera zoom 1.28, incoming radius 240 and camera zoom 1.24. It then eases to full size over 34 frames. Existing shot presets, focus tracks, scene durations, plan architecture, Sun component/artwork, disk and final scene staging are preserved.

## Reproduction and validation

1. `npm run review:planet -- preview`: typecheck and test; audit source; render stills at 7, 8, 9, 10, 11, 12 and 14 seconds; render encoded 6–13 second preview; decode consecutive frames 296–304.
2. Inspect the preview and contact sheets.
3. `npm run review:planet -- final <preview-job-directory>`: full 1080 × 1920 H.264 render, chronological and transition extraction, existing video verification, matching-frame M1.2.3 comparison, source hashes, render time and visual review report.

Tests cover approved source SHA/metadata/alpha bounds, unchanged Sun bytes, deterministic evaluation order, bounded motion, monotonic formation, silhouette convergence, screen pose at the 10-second handoff, scene-plan timing and rendered final composition containing both approved assets. Encoded-frame inspection is required because unit tests cannot certify visual continuity.

## Limitations

The PNG flattens geology, shading, silhouette and rim. The hybrid reveal approximates formation and cannot simulate crustal evolution or true surface rotation. Native detail is limited to a roughly 970 × 996 visible body within the 1254-pixel canvas. Existing vector debris remains simpler than the newly illustrated planet.

A future layered source should separate albedo/geology, directional shading, silhouette, molten features and rim, all sharing a pivot and UV/material alignment. Human visual approval remains pending; M1.2 stays open.
