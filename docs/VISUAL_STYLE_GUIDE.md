# Visual Style Guide

This guide defines a reusable illustration and motion language for educational shorts. It is intentionally topic-neutral: space is the first application, not the boundary of the system.

## Illustration language

- Use original stylized 2D forms with organic, asymmetric silhouettes.
- Build subjects from independently controllable silhouette, material, shadow, highlight, texture, rim-light, atmosphere, and foreground-detail layers.
- Favor a few legible large shapes over many disconnected decorative marks.
- Give materials distinct behavior: rock has faceted color breaks and occluded craters; plasma has soft internal flow and irregular emissive edges; dust has depth-dependent scale and opacity.
- Keep the primary key light consistent from the upper left unless the story explicitly motivates a change.
- Establish foreground, middle-ground, and background separation through scale, contrast, sharpness, and motion—not blur alone.
- Preserve recognizable visual identity when an object changes scale or moves between scenes.

## Color system

| Role | Tokens | Use |
| --- | --- | --- |
| Deep background | `#020416`, `#070A27`, `#11113E` | Space, negative space, vignette |
| Atmospheric violet | `#2C1C66`, `#55347F` | Nebula structure, transitions |
| Cool atmosphere | `#177B95`, `#69E7F2` | Depth, rim light, labels |
| Stellar core | `#FFFBE1`, `#FFE37B`, `#FFAF38` | Emissive focal points |
| Stellar edge | `#F26A2E`, `#C94437` | Corona depth and hot shadows |
| Rock light | `#F2B078`, `#D97A62` | Lit terrain and debris |
| Rock shadow | `#633A50`, `#241B3C` | Facets, craters, terminator |
| Educational text | `#F7F5FF`, `#7DE2E8` | Headline and kicker |

Limit each shot to one dominant warm accent and one cool supporting accent. Reserve near-white for text and the hottest highlights.

## Lighting

- Key light arrives from the upper-left quadrant.
- Shadows are colored, not pure black; use deep violet or navy.
- Terminators should be broad, soft graphic shapes rather than photorealistic gradients.
- Rim light belongs on the edge opposite the darkest mass and should occupy less than one quarter of the silhouette.
- Glow communicates emission or atmosphere. Do not apply it uniformly to non-emissive objects.
- Reduce contrast, saturation, and scale with depth.

## Motion language

- Camera movement uses eased multi-stage poses with zero-feeling velocity at intentional holds.
- Objects follow curved paths and preserve momentum across scene transitions.
- Secondary motion should lag the primary action: corona wisps, debris rotation, dust drift, and surface parallax.
- The approved baseline uses zero full-scene overlap, with subject pose matching and motivated foreground/environment entrances. Optional overlay blends must not create double subject silhouettes. Typography leads or follows the visual focal event; it should not compete with it.
- Reveals emerge through assembly, occlusion, lighting, or camera discovery rather than arbitrary bouncing.
- Use deterministic frame-driven motion only.

## Composition rules

- **Establishing wide:** subject group uses 45–65% of width; environment explains spatial relationships.
- **Medium explanatory:** primary subject uses 45–60% of width with visible supporting motion.
- **Close-up detail:** subject may exceed the frame edge; preserve the important illuminated contour.
- **Tracking shot:** reserve travel space ahead of motion and use foreground parallax.
- **Hero reveal:** subject uses 55–75% of width, with asymmetrical negative space supporting text.
- Keep essential text within 84 px horizontal margins and approximately 132–1680 px vertically at 1080×1920.
- Do not center every subject. Use thirds, diagonals, and depth crossings to guide attention.
- A final hold should retain subtle living motion while allowing at least 20 readable frames.

## Layer contract

Every registered illustration declares stable layer identifiers and semantic roles. Layers may animate independently and remain addressable by future storyboard tooling. External SVG assets can later implement the same layer contract without changing scene choreography.

Approved raster artwork exposes only its real compositing layers: the Sun has glow, masked corona drift and approved artwork; the planet adds a growing substrate, approved-surface reveal and restrained lighting overlays. Flattened texture, shading and silhouette inside a PNG are not independently editable. See the M1.2 closeout record for the approved AI-assisted asset workflow and limitations.
