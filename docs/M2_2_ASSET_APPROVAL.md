# How a Volcano Erupts — required artwork approval

> Historical preproduction checkpoint. The later approved/fitted Batch A/B/C assets are now integrated into the rendered second-topic demonstration. See [current integration report](M2_2_INTEGRATION_REPORT.md). The final animation still awaits human visual approval; historical “missing asset” statements below describe the earlier checkpoint.


Status: **all volcano assets missing; none approved**. Existing Sun and rocky-planet artwork is style reference only and remains unchanged. This document requests original professional illustration files; it does not authorize or implement automatic image generation.

## Shared art direction and registration

Use the approved cinematic, hand-painted science-explainer quality: coherent rock strata and weathering, dimensional upper-left light, deep charcoal/plum shadows, restrained amber/rust/red heat, rich brush texture and legible silhouettes at phone size. Twilight landscape should support the warm magma without introducing a space setting. No stock art, copied compositions, cartoon volcano icons, geometric magma blobs, plastic gradients or excessive bloom. Ash is particulate rock and gas; do not draw a giant flame cloud. Show schematic cutaway geology with a connected storage region and conduit, not a giant empty mountain cavity.

Provide seven aligned original layers plus one derived presentation composite. Target **2048×2048 RGBA PNG** per export, with a shared canvas, camera angle, horizon, crater/vent anchor and light direction. Preserve transparent padding; do not auto-trim individual layers or bake checkerboards/text into images. The common registration allows the current registry to place every layer at the same normalized position and size. Proposed common placement is x=.5, y=.59, width=.9 of the vertical video width; confirm in a phone-size proof before approval. The draft targets are not a request to upscale lower-resolution files artificially.

The landscape layer includes painted sky/ground within its registered art area and may have transparent outer padding. Other layers need clean alpha edges. The eruption plume must fit inside the shared canvas, with enough space above the vent; subterranean layers must align to the same ground surface. Include an editable layered master or registration guide showing all layers together, and do not independently recenter the plume, chamber or conduit.

All paths below are proposed destinations relative to `assets/`; **no files currently exist at these paths**.

| ID / proposed path | Illustration needed | Animation-ready separation |
| --- | --- | --- |
| landscape — `illustrations/volcano/landscape.png` | Original volcanic terrain and restrained twilight sky, without mountain, ash or lava | Stationary base; optional distant haze stays separable in master |
| exterior — `illustrations/volcano/exterior.png` | One coherent rugged stratovolcano, crater and terrain-facing silhouette | Transparent surroundings; no baked plume or flowing lava |
| cutaway — `illustrations/volcano/cutaway-rock.png` | Registered mountain/ground cross-section, layered rock, reservoir and conduit boundaries | Transparent apertures for separately painted magma; include upper crust and connection to vent |
| chamber — `illustrations/volcano/magma-chamber.png` | Magma held in an irregular storage region, restrained bright interior and darker margins | Painted full-state fill confined to the cutaway aperture; suitable for a progressive reveal mask |
| conduit — `illustrations/volcano/conduit-magma.png` | Connected rising-magma path to the crater; restrained expanding-gas cues | Independent from chamber/rock, continuous fill suitable for bottom-to-top reveal; provide gas-detail separation in master |
| plume — `illustrations/volcano/eruption-plume.png` | Ash/gas column from the registered vent, turbulent dense base, billowing upper cloud and translucent edge detail | Independent plume; preserve room to translate/scale subtly; ash flecks separate in master where possible |
| lava — `illustrations/volcano/lava-flows.png` | Hot lava emerging from vent and following believable downhill channels | Independent, terrain-aligned full-state flow with cooling crust; reveal masks must not scale the mountain |
| exterior-plate — `illustrations/volcano/exterior-plate.png` | **Derived export**, compositing approved landscape and exterior for the existing one-subject hero template | No additional original illustration; same canvas and pixel registration as constituent layers |

Seven original illustrations, eight PNG deliveries. A professional layered master should also retain optional haze, gas/ash flecks, hot highlights and reveal masks for refinement; these are not represented as approved or renderable assets yet. If the artwork requires different geometry or dimensions, update the draft metadata only after inspecting real files.

## Approval proofs required

1. Exterior plus landscape at phone size and full resolution.
2. Rock cross-section with the chamber and conduit overlaid, demonstrating alignment and readable scientific relationships.
3. Exterior plus lava and plume at the vent, demonstrating coherent depth, lighting and uncropped plume bounds.
4. Final two-second summary composition with readable caption area.

Review quality, scientific plausibility, original ownership/provenance, alpha edges, color fidelity and registration before calling assets approved. Preserve prompts or artist provenance where applicable. No volcano video is ready for visual approval until these assets and subsequent motion previews are approved.
