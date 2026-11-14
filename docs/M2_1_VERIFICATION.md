# M2.1 implementation and verification

Status: complete as an architectural demonstration, approved by the user on 2026-11-14 subject to the final checks documented below. Closeout commit authorized; no push, tag or M2.2 work. The original M1.2 approved media and artwork remain preserved.

## Architecture delivered

- Strict Zod version 2.1 storyboard schema with inferred TypeScript types, ordered scenes, derived half-open frame ranges, reusable asset references, template-specific payloads and contextual validation errors.
- Immutable per-storyboard asset lookup and local-file preflight for PNG, SVG and WebP; no mutable global asset state or external asset fetches.
- Hero reveal, orbital environment, transformation, comparison and summary templates; normalized subject layout, proportions retained, configurable captions and deterministic seeds.
- Static, slow-push, pull-back and tracking cameras. Still, gentle-drift, hero-reveal, orbit and particle-convergence motion. Existing interpolation, easing, paths, seeded particles and convergence math are reused.
- A separate Remotion entry point with data-driven format/duration metadata, render/verify commands and a minimal legacy adapter. No legacy animation files were migrated.

## Final generic demonstration

Job: `jobs/generic-template-demo-m2-1-2026-11-14T08-03-11-052Z/`.

- MP4: `output/animation.mp4`; H.264, 1080×1920, 30 FPS, 300 frames, 10 seconds.
- Preserved approved demonstration SHA-256: `aceb0eb779e74114273a4815904386ec933fa0518f1da8b3930cf6d30544e7a7`.
- Full rendering/encoding: **23.14 seconds**; excludes bundling, preflight, sheet generation and verification.
- Source: `storyboards/generic-demo.json`, using the two approved existing assets without editing React scene code.
- Order: hero 0–60, environment 60–120, transformation 120–180, comparison 180–240, summary 240–300 (end frames exclusive).
- Verification passed: schema, actual asset files/dimensions, encoded format/frame count/duration, chronology/coverage, no detected black frames and 20 decoded midpoint/boundary samples. Numbered sheet: `chronological-contact-sheet.png`.
- The encoded sheet was inspected: all five template subjects/captions appear in expected order, proportions and baked lighting are retained, and the intentional fades expose the continuous backdrop at boundaries. This is an architecture demonstration with simpler staging than the production prototype, not a replacement for it.

An additional JSON-only smoke test rearranged summary/comparison, used unequal durations (36 and 48 frames), and changed format to 640×640 at 24 FPS. Job `jobs/generic-alternate-format-check-m2-1-2026-11-14T08-05-18-300Z/` verified all 84 frames / 3.5 seconds and passed all technical checks; render/encoding 5.97 seconds. No React changes were required.

## Tests

`npm run typecheck`: passed. `npm test`: **96 tests passed across 5 files**, including all 61 existing tests and 35 new cases. New coverage: schema/unknown fields and templates, references and file checks, duplicate IDs, invalid durations/envelopes/formats, registry resolution, actual PNG/SVG/WebP metadata, declared ordering, nonuniform durations, boundaries, frame-order-independent presets, viewport/duration normalization, neutral camera endpoints, exact legacy delegation and bounded intentional backdrop dips/cuts. `git diff --check` and a staged diff check including new files passed at closeout.

## Final 8-second transition check

Actual encoded frames 234, 238, 239, 240, 241 and 246 were extracted and visually inspected. The comparison fades down to the backdrop at frames 239–240 (7.967–8.000 seconds), then the summary fades up and is fully visible at frame 246 (8.200 seconds). This is the previously documented six-frame envelope on either side of independent scenes, not an unscheduled timeline gap or a missing illustration. The background remains visible throughout. The approved demonstration was retained without a visual change or replacement render.

Regression tests now assert the exact two zero-opacity frames, correct compare/closing scene selection, adjacent fade opacity, full visibility recovery and the same bounded behavior at every demo boundary. Explicit zero-transition cuts keep opacity at one. Final verification was rerun against the existing approved demonstration and original M1.2 encoded output; the original MP4 and all three approved PNG hashes still match the M1.2 receipt. See [compatibility findings](M2_1_COMPATIBILITY.md).

This closeout records the user's approval for the exact demonstration identified above. Automated reports retain their generic pending-approval field; that default does not override explicit approval recorded here. Future renders require their own review. Generated MP4s, job outputs, logs and scratch files remain ignored and excluded from the commit.

Legacy technical verification and 24/24 lossless original/adapter samples passed. Full encoded pixel identity did not; see [compatibility report](M2_1_COMPATIBILITY.md) for the measured pre-existing run-to-run variation and human review requirements. Frame calculations are deterministic; neither the legacy nor generic encoded video path is certified pixel-identical across renders/environments. Two generic demo runs also contained some decoded differences, so configuration determinism must not be confused with codec/raster reproducibility.

## Files

Modified: `README.md`, `docs/ROADMAP.md`, `package.json`, `scripts/lib.ts`.

Added:

- `src/engine/assets/registry.ts`, `camera/presets.ts`, `motion/presets.ts`, `storyboard/schema.ts`, `storyboard/timeline.ts`, `storyboard/legacy.tsx`, `templates/registry.tsx`.
- `src/StoryboardRoot.tsx`, `src/storyboard-index.ts`, `src/compositions/StoryboardComposition.tsx`, `src/tests/storyboard.test.ts`.
- `scripts/media-tools.ts`, `storyboard-assets.ts`, `render-storyboard.ts`, `verify-storyboard.ts`, `check-compatibility.ts`.
- `storyboards/generic-demo.json` and the four M2.1 audit/schema/compatibility/verification documents.

Generated jobs, media, stills, sheets, logs and the alternate-format test input remain ignored or in temporary storage. Approved Sun/planet files are unchanged.

## Limits and next review

Only five templates and one style are provided. Transformations scale/reveal a subject; they do not morph arbitrary artwork. Camera moves return to neutral rather than solving cross-scene staging; generic fades are independent of the legacy matched choreography. PNG lighting is flattened, and layered corona/surface motion is not generalized. Authors must art-direct subject placement, padded-image size, caption wrapping and aspect-ratio changes; no automatic layout solver is included.

The demo exercises PNG rendering. SVG and WebP metadata/file support have tests and share Img loading, but their visual rendering across all browser variants still needs asset-specific review. Declared alpha/style metadata is not a guarantee of suitable artwork. Browser configuration remains macOS Chrome-specific; FFmpeg/ffprobe are required. Some preset parameters apply only to their documented preset. There is no audio, AI generation, publishing or dashboard.

Pixel-reproducibility investigation in the existing browser/capture path is recommended before a strict encoded-output determinism gate. M2.1 approval covers the architectural demonstration and documented limitations; it does not certify byte-identical MP4 output. Further milestones require a new explicit instruction.
