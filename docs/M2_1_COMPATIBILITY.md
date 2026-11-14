# M2.1 planet-formation compatibility

Baseline source commit: `a56e228ebe1f3dde6e8daf03c5057e1f06c34572`. All approved illustration bytes, five scene implementations, original plan/schema, motion, composition, `src/Root.tsx` and `src/index.ts` are unchanged. Generic code uses a separate `src/storyboard-index.ts` entry point. The only shared-script change extracts process/probe helpers to `scripts/media-tools.ts`; `scripts/lib.ts` re-exports them for existing callers.

The compatibility adapter validates the original version 1.0 plan and delegates directly to PlanetFormation. It never reconstructs the approved scenes using approximate generic equivalents.

## Measured comparisons

| Artifact | Local job |
| --- | --- |
| Approved M1.2.5 output | `jobs/planet-formation-m1-2-5-2026-11-14T05-41-24-380Z/` |
| Original rendered before implementation | `jobs/planet-formation-m1-2-5-2026-11-14T07-50-14-787Z/` |
| Final post-change adapter render | `jobs/m2-1-compatibility-2026-11-14T08-02-27-913Z/` |

Pre-change rendering took 41.08 seconds including bundling. Final adapter rendering/encoding took 36.21 seconds excluding bundling, still comparisons and verification; these timings have different scopes and should not be used as a speedup claim.

The final legacy MP4 passes all existing technical checks: H.264, 1080×1920, 30 FPS, 450 frames, 15.000 seconds, contiguous chronological timeline, no detected black frames, 15 decoded whole-second samples and 12 decoded boundary samples. All three approved asset hashes match the M1.2 receipt.

**24/24 full-resolution lossless PNG comparisons are byte-identical between the original composition and adapter.** Samples include every whole second from 0–14, before/at/after all four boundaries, and frame 449. A same-frame accretion diagnostic also matched exactly. This establishes sampled adapter equivalence and preserves the approved source behavior.

## Encoded-output limitation requiring human review

Full 450-frame decoded MP4 comparison is **not pixel-identical**, either against the pre-change render or approved MP4. The pre-change original render already differs from the approved output (aggregate PSNR 47.88 dB), before M2.1 source changes. Final adapter vs pre-change: 47.69 dB; vs approved: 47.25 dB. Representative encoded comparisons show differences in small debris visibility/detail, alongside raster/compression differences. These are recorded, not silently accepted by a similarity threshold.

The exact cause inside the existing browser/video capture path has not been established. The lossless comparisons isolate the adapter from that run-to-run video variation; they do not prove every rendered MP4 is identical. No unrequested visual redesign or change to approved choreography was made to mask the discrepancy. Human review should check the encoded accretion contacts and fine detail. The approved original MP4 remains the production reference.

Final job artifacts: `compatibility-report.json`, `verification-report.json`, `before-after.png` (top before/bottom after; columns frames 0,120,240,330,420), `original-<frame>.png`, `adapter-<frame>.png`, chronological and transition contact sheets. These generated files are ignored. The user approved M2.1 as an architectural demonstration on 2026-11-14; this does not resolve or certify encoded-output reproducibility.

At closeout, the approved original MP4 still matches SHA-256 `23738d08124498a8fe02cd792d0eb1450280bd68183a36fd92c0eb837b1d31df`, and all three approved PNG hashes still match the M1.2 receipt. Its original entry point, composition, scenes, plan/schema and motion files have no diff against the M1.2 closeout commit. The preserved original output is therefore unchanged, rather than a replacement render claimed to be identical. Final technical verification was rerun on that original MP4.

## Reproduce

```bash
node --import tsx scripts/render.ts
npm run check:compatibility -- jobs/<pre-change-job>
```

The comparison requires the approved local MP4 referenced by `docs/M1_2_FINAL_VERIFICATION.json`. It fails on changed approved assets, failed technical verification or a nonidentical sampled lossless adapter frame. Encoded identity is reported independently; a successful command is not a grant of human visual approval. Pixel-identical video reproducibility remains an explicit limitation, not an M2.1 guarantee.
