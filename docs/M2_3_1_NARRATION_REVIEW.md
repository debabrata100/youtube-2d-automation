# M2.3.1 real narration — listening review checkpoint

2026-11-14. Real OpenAI speech was generated with the user's explicit five-request / USD 0.05 estimated-spend authorization. **M2.3 remains open pending human listening and approval.** M2.2.1 visual quality remains unapproved; no artwork, smoke/lava, camera or other visual-quality work was performed.

## Script and provider

`stories/volcano.json` is unchanged: 35 words across the existing five scenes. The opening asks what makes a quiet volcano erupt; the setup defines underground magma; the explanation names buoyancy and gas pressure with “can”; the eruption example uses “some”; the closing distinguishes magma from surface lava. The pre-generation review found no need to rewrite it. Scientific meaning and every authored word are retained in the final edited performance.

Provider: OpenAI. Model: **gpt-4o-mini-tts-2025-12-15**. Voice: **marin**. Language/direction: conversational American English, curious science narrator, no exaggerated acting. Requested generation speed: **1.0**. No model substitution occurred.

The exact model was listed in the [official model card](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts) and returned HTTP 200 from an authenticated, non-synthesis model lookup before generation. The [speech reference](https://developers.openai.com/api/reference/typescript/resources/audio/subresources/speech/methods/create) was rechecked for the snapshot/voice/parameter contract. Its documented shutdown remains 2027-01-06; future requests require another support check.

## Secure environment loading

No existing dotenv loader was present. All three story npm entry points now use Node 22's native `--env-file-if-exists=.env`. This loads the project-root file without shell sourcing and keeps mock development working when the file is absent. Node's normal inherited-environment precedence is preserved and tested.

The key was never printed, written to reports, committed or copied into public render assets. `.env` remains ignored. A non-disclosing scan of source/configuration/documentation and job-report text found no occurrence of the credential value. The final offline renderer does not load `.env`, read an API key or import a TTS provider.

## Request and budget accounting

**Five paid TTS requests were made; all five succeeded. No retries, alternate paid models or paid transcription calls were made.** The model-availability lookup was not a synthesis request. Initial generation: zero cache hits / five misses. Rendering reused the five cached responses as local derivatives, with zero new speech requests.

`reports/tts-usage-report.json` is the persistent ledger. Each request was reserved and written atomically before sending, under an exclusive job lock. Failed/uncertain attempts stay counted; subsequent instances cannot reset or raise the persisted policy. Limits are five requests and USD 0.05 estimated spend. Tests cover persistence, exhaustion, failed attempts, budget rejection and policy changes.

The conservative reservation is **USD 0.0458616**, using the published USD 0.60/M input-text and USD 12/M output-audio token rates. Input UTF-8 bytes serve as a conservative input-token allowance; each short beat reserves 750 assumed output audio tokens. This deliberately large output allowance is an estimate, **not a provider-enforced output-token cap or a guarantee of actual billing**. The binary speech responses supply no token usage to this adapter; **actual API cost is unavailable**, not zero. Request IDs are retained for billing reconciliation.

The earlier M2.3 illustrative USD 0.0039 figure was not used as the spending guard. The five-request ledger is exhausted; no sixth synthesis is allowed without new authorization. Free local CPU transcription was used for inspection; it called no transcription API.

## Actual timing and local editorial adjustments

Returned files measured **26.300 seconds** in total: 6.45 / 8.65 / 3.45 / 3.85 / 3.90 seconds. Local recognition found the setup sentence spoken twice. The first hook question is complete before a long gap and additional continuation. Raw responses and cache bytes are preserved.

A data-driven source-take selection keeps complete first takes, preserves quiet release after each sentence, removes the repeated setup performance/extra continuation, and reduces selected detected silent pauses while retaining 80 ms at those joins. Selection, removed ranges, original/derived paths and measurements are recorded in `source-take-selection.json` and `audio-edit-plan.json`. No authored words were removed or reordered.

The cleaned, unsped performance is **16.177834 seconds**. Fitting it at unchanged speed would exceed the fixed timeline. The explicit editorial plan applies a uniform, pitch-preserving **1.09× FFmpeg atempo** correction, within the existing 1.10 safety limit. This produces **14.875624 seconds** of selected narration, approximately 141 spoken words/minute. It is a documented timing tradeoff rather than silent acceleration. An unsped comparison is included so the reviewer can judge delivery. A repeated preparation produced identical PCM hashes for all five edited clips.

No scene or camera was retimed. Instead, explicitly bounded, continuous measured audio slots preserve the existing visual timeline:

| Beat | Narration start | Duration | Visual scene start | Offset |
| --- | --- | --- | --- | --- |
| Hook | 0.000000 s | 2.850208 s | 0.000 s | 0 frames |
| Setup | 2.866667 s | 3.362958 s | 3.000 s | −4 frames |
| Explanation | 6.233333 s | 2.835542 s | 6.000 s | +7 frames |
| Payoff | 9.100000 s | 3.145208 s | 9.000 s | +3 frames |
| Closing | 12.266667 s | 2.681708 s | 12.000 s | +8 frames |

Maximum permitted narration/visual boundary offset: **8 frames / 0.267 seconds**. Integer frame allocation leaves **0.124376 seconds** of total declared holds; the assembled PCM master is exactly **15.000 seconds**. No overlap or loss of the selected complete performance is introduced. The default mock/fixed-scene aligner still rejects overflow; this bounded continuous mode is explicit and used only by the prepared-audio path.

## Caption synchronization

The existing generic caption renderer and styling are reused. Local `pywhispercpp 1.5.1` with `base.en` estimated word/phrase locations in the edited recordings; those estimates move the ten authored caption phrases near their actual spoken positions. Data boundaries are rounded to the nearest 30-FPS frame. The three-frame visual fades remain restrained.

These are **local ASR phrase estimates, not provider word-level timestamps or word-perfect ground truth**. Matching a rounded estimate within a frame does not prove perceptual synchronization. Human review should assess timing within roughly 0.2 seconds, especially sentence starts, phrase breaks and the closing statement. Estimated timing provenance is recorded in each cue. Captions remain within the existing mobile-safe layout and do not cover the principal volcano region in inspected decoded frames.

## Three review passes

### Pass A — narration (automated support; human listening pending)

Local recognition recovers the expected complete text for the hook, setup, explanation and payoff after cleanup, with no duplicated setup sentence. It renders the closing word “magma” as **“madma.”** A second local recognition pass over the actual encoded MP4 recognizes “magma” as intended but spells “buoyancy” as “Boyancy.” This disagreement is **inconclusive**, not evidence of a confirmed pronunciation defect or a certificate of correctness. Please listen particularly to both scientific terms. The final encoded recognition recovers the complete intended sentence sequence without the repeated setup.

Edited clip mean levels range −22.2 to −21.1 dBFS, with peaks from −9.0 to −5.0 dBFS. This supports consistent level/headroom and no sample clipping; it does not establish identical vocal timbre or natural prosody. The current tool surface does not support audio input for independent listening, so naturalness, pronunciation, emphasis, join smoothness and narrator identity require the user's listening review. No human-like listening approval is claimed.

### Pass B — synchronization

FFmpeg/FFprobe checks pass exact video/container duration, expected audio onset, no overlapping clips, no excessive detected silence, and preserved selected sentence endings. The narration master and encoded video were decoded; the chronological contact sheet and caption progression were inspected. Speech/visual boundaries stay within the explicit eight-frame tolerance. Caption bounds and phrase order are valid; exact perceptual alignment remains approximate.

Internal phonetic/phrasing pauses are allowed up to the documented 0.35-second threshold plus 0.02-second analysis tolerance. Final quiet release may precede the measured file end; the verifier allows up to 0.15 seconds of release/tail difference instead of treating every unvoiced consonant or breath as truncation. Signal thresholds cannot prove that no phoneme was shortened, so original takes and the unsped comparison remain available for listening.

### Pass C — storytelling

The first words create a question immediately; its completion occurs at roughly 2.85 seconds. Each scene advances the cause/effect explanation and the final line provides the magma/lava payoff. The script remains scientifically qualified, and music is not needed to understand the sequence. This is an editorial/text-and-image assessment, not measured audience retention or a completed perceptual listening judgment. The 9% correction and per-beat intonation should be reviewed before approval.

## Final artifacts and performance

Job: `jobs/volcano-m2-3-1-2026-11-14T16-27-39-560Z/`.

- `output/narrated-animation.mp4`: 1080×1920, 30 FPS, 450 frames, H.264/AAC, exactly 15.000-second video/container timeline
- `audio/narration.mp3`, `narration.wav`, `narration-metadata.json`
- `audio/narration-unsped.wav`: 16.177834-second comparison
- Original five provider WAVs, generation metadata and edited/clean derivatives
- `story/selected-script.json`, `story/timing-plan.json`, `captions/captions.json`
- `reports/tts-usage-report.json`, `timing-report.json`, `verification-report.json`
- `reports/source-take-selection.json`, `audio-edit-plan.json`, raw/edited local recognition, level and repeatability reports
- `reports/storytelling-review.md`
- `previews/opening-hook.mp4`, `magma-explanation.mp4`, `eruption-payoff.mp4`
- `chronological-contact-sheet.png`, transition and motion sheets

Final render plus H.264/AAC encoding/mux: **43.58 seconds**, excluding synthesis, downloads, ASR, editorial preparation and verification. The render itself made **zero TTS requests**.

Automatic approval review rejected an earlier network-capable cached-provider render command after the request cap was exhausted. That command did not execute. The completed render used `render-prepared-story.ts`, an offline-only path importing no TTS provider and reading no API key. No network-capable workaround or additional paid request was used.

## Regression and reproducibility

TypeScript, the full **190-test / 12-file** Vitest suite, whitespace checks and video verification pass. A fresh mock-mode MP4 also rendered and verified without paid authorization or API access. Fifteen lossless visual-only baseline frames match; earlier approved artwork, videos and the previous M2.3 mock output remain unchanged. No visual-quality approval is implied for M2.2.1.

The request ledger prevents further synthesis for this job. Re-render safely from prepared local files:

```bash
node --import tsx scripts/render-prepared-story.ts jobs/volcano-m2-3-1-2026-11-14T16-27-39-560Z
```

Optional local-recognition preparation uses an ignored `.cache/asr-venv` with `pywhispercpp==1.5.1` and a downloaded `base.en` model, CPU mode and temperature zero. Its timestamps remain estimates. Frozen local estimates and PCM derivatives are used during rendering; no recognition or synthesis runs per frame. The raw TTS remains cached and unchanged. Byte-identical H.264 output is not guaranteed.

No commit, push, tag, music, sound effects, artwork changes, LangGraph, script-generation agents, publishing or M2.4 work occurred. Human listening and explicit approval remain the milestone closeout condition. Further paid synthesis would need new authorization because the five-request allowance is exhausted.
