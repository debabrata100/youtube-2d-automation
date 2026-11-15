# M2.3.2 — ElevenLabs Stage A

2026-11-15. **Free preparation complete; live access validation failed (HTTP 401). No paid synthesis authorized or performed.** M2.3 remains open. Sound Effects are disabled and no effects endpoint/integration was added. No visual redesign, commit, push, tag or M2.4 work.

## Inspection and implementation

Reviewed the M2.3/M2.3.1 implementation/review documents, original script, strict storyboard validator, provider interfaces, OpenAI budget ledger, native environment loading, cache, PCM assembly, caption layout/alignment and rendering/verifier CLIs. Existing work is preserved.

Added `src/audio/tts/elevenlabs.ts` behind the existing provider interface, using injectable native fetch. The scoped supported model is `eleven_multilingual_v2`, selected for consistent narrated delivery rather than latency. New models require explicit capability review; model/voice overrides never silently substitute another voice. Voice ID is configuration/environment data, never a rendering-engine constant.

Prepared settings: stability 0.5, similarity boost 0.75, style 0, speaker boost true, speed 1.0; seed 232; automatic text normalization. Multilingual v2 does not support language enforcement, so `language_code` is omitted. These are initial settings, not proof of suitable male character or performance. Provider audio is requested as `pcm_24000` and wrapped losslessly as 24 kHz mono 16-bit WAV for the existing pipeline. This avoids assuming eligibility for premium 44.1 kHz PCM/WAV formats.

The synthesis adapter uses the documented `/v1/text-to-speech/{voice_id}/with-timestamps` endpoint. It preserves available character alignment in cache metadata. A returned take without timestamps remains cached for explicit local/forced-alignment review; missing timing never silently triggers another paid request. Malformed responses fail. Error messages exclude credentials, arbitrary provider bodies and transport exception details. Redirects and automatic retries are disabled, including HTTP 429. Separate exact-request authorization and a persistent exclusive-lock ledger reserve request/character limits before network synthesis; failed or uncertain calls remain counted. No dollar cap is inferred from a character count.

The CLI exposes `story:prepare` and `story:render --dry-run` through the existing pipeline. Both prepare only. Actual `story:render --tts elevenlabs` is hard-blocked at Stage A, including when the old OpenAI authorization flag is supplied. Enabling the later continuous-take rendering path is deferred until separate approval and successful access checks; no operational paid render command is being offered now. Existing mock/OpenAI paths are preserved.

## Free voice/model/account validation

Configured selection: **Bill L. Oxley**, ID `iiidtqDt9FBdT1vfBluA`; model `eleven_multilingual_v2`.

The root `.env` is loaded through Node 22 `--env-file-if-exists=.env`; the user's file was not overwritten. An empty `.env.example` documents required names and public voice/model defaults. The key was never printed or included in arguments, reports or public media. A scan of intended source/config/documentation and Stage A JSON found zero credential-value occurrences. `.env`, caches and generated jobs remain ignored.

Three sandboxed metadata operations first failed at transport. Two subsequent sets of read-only GETs reached the service: `/v1/voices/{id}`, `/v1/models`, `/v1/user/subscription`; **all six returned HTTP 401**. The artifact-producing set is retained in `voice-validation.json`; its result was reused for the unchanged voice/model configuration when finalizing the script, without another network check. There were **zero paid requests**, no voice import, no fallback voice and no effects requests.

The key is configured, but authentication/account permissions were rejected. This does not establish which credential or account setting is wrong. **The selected voice, model entitlement, account tier, remaining allowance, male voice metadata, and voice-specific charges remain unverified.** Check the local credential/account and metadata permissions, then rerun the free command below. Do not paste the key into chat. GET success would still not guarantee later paid synthesis entitlement.

## Script review and plan

The original `stories/volcano.json` remains unchanged. Before:

> What really makes a quiet volcano erupt? Molten rock, called magma, collects deep underground. Buoyancy and gas pressure can lift magma. Some eruptions release gas, ash, and lava. At the surface, that magma becomes lava.

Three new candidates are in `stories/volcano-elevenlabs-{a,b,c}.json`; criteria and scientific caveats are in `stories/volcano-elevenlabs-candidates.md`. All validate against the unchanged five-scene storyboard and caption wrapping constraints.

Selected A, **28 words / 169 Unicode characters including spaces and punctuation**:

> What makes a volcano erupt? Molten rock called magma gathers below. Expanding gas helps push magma upward. Gas and ash burst into daylight. Erupted magma is called lava.

It explicitly defines magma, uses five-to-six-word clauses, avoids difficult “buoyancy,” and retains a clear causal sequence plus the magma/lava payoff. This is an explosive-eruption example, not a claim that every eruption releases ash. It omits many controls on eruption behavior in a 15-second explanation.

Estimated speech is **11.59 seconds at 145 WPM**, or **13.82 seconds at 130 WPM with a 0.9-second pause allowance**. These are estimates, not voice measurements or a promise of fit. Punctuation guides natural delivery; no SSML, fixed pause durations or audio tags are assumed. One continuous take is proposed to preserve prosody. The plan is **at most one paid request / 169 input characters / zero automatic retries**, only after new bounded approval. Estimated credits and dollar cost are unavailable because account/model metadata validation failed; actual usage and cost are null. Voice-specific fees and plan terms require review before authorization.

Speed remains 1.0; no previous 1.09× processing, aggressive silence removal, scene retiming or narration chopping is applied. Actual audio must fit within 14.8 seconds, leaving at least 0.2 seconds at the end. Measured sentence/scene alignment must also be reviewed against unchanged 0/3/6/9/12-second visual starts. Overall duration fit alone cannot prove synchronization. If unsuitable, stop and propose a shorter/rebalanced script rather than accelerate or silently regenerate.

## Caption and audio policy

A new reusable helper maps provider character timings to the authored caption phrases, verifies exact normalized word order, ordered non-overlapping intervals and measured duration, and rounds starts upward to prevent leading the supplied timestamps. It preserves pauses between phrases. Existing two-line styling, mobile-safe layout and fallback utilities are unchanged. Provider timestamps remain estimates requiring listening review. Missing/unreliable timing needs an explicitly reviewed local or forced-alignment step; no paid alignment API is called in Stage A.

No audio was generated, so actual narration duration, male vocal character, pronunciation, speed, natural pauses, sentence joins, clipping and caption synchronization remain **unverified**. No caption timing report for real speech, MP4, previews, contact sheet or render time is claimed. The pure timing helper is tested with synthetic timestamp fixtures, not presented as real speech evidence.

## Artifacts and free checks

Final Stage A job: `jobs/volcano-m2-3-2-2026-11-15T02-12-02-637Z/`:

- `script-candidates.json`, `selected-script.json`, `voice-configuration.json`, `synthesis-plan.json`
- `voice-validation.json`, `cache-validation.json`, `credential-handling-report.json`
- `preservation-report.json`, `verification-report.json`

Cache: selected continuous ElevenLabs request **one miss / zero hits**, no regeneration. All **10 existing cache entries** have matching audio hashes and valid measured WAV durations. Existing OpenAI request allowance remains exhausted; it is not reused as ElevenLabs permission.

TypeScript, **208 Vitest tests across 13 files**, and `git diff --check` pass. Eighteen new tests cover missing credentials, invalid settings/natural speed, inaccessible voice, capabilities/account limits, sanitized errors, no-cost GET boundary, hard CLI paid blocking, persistent budget exhaustion/failed attempts, no retries, response validation, exact-text/config cache keys, reusable cached audio/timestamps, duration and caption timing. Existing mock/OpenAI and deterministic visual regression tests pass; normal tests use mocked network and never call a paid API.

**44 protected asset/media hashes** match prior references, including M1.2, M2.1, M2.2, M2.2.1, M2.3 and M2.3.1 videos. The original script matches its preserved M2.3.1 reference structurally. The prior M2.3.1 MP4 was decoded again without errors and retains 1080×1920, H.264/AAC, 30 FPS, 450 frames and 15.000-second container duration. This is preservation verification of the old output, not a new ElevenLabs result. No byte-identical regenerated MP4 guarantee is made. Seeded provider synthesis is best effort, not deterministic audio; cached bytes are reused.

## Next checkpoint

First resolve the HTTP 401 and repeat only free validation:

```bash
npm run story:prepare -- --script stories/volcano-elevenlabs-a.json --tts elevenlabs --validate-remote
```

For offline planning omit `--validate-remote`; it never synthesizes. Outputs use a new unique directory and refuse overwriting existing jobs. Stage B additionally requires explicit human approval for the exact text/settings, at most one request and the proposed 169 characters after account/voice usage costs are understood. No paid approval is assumed from this report. Later human review must listen for natural male character, magma/lava pronunciation, comfortable pacing, pause placement, clean ending, and captions/scene alignment, then inspect the encoded video. M2.3 remains open.

Official references reviewed 2026-11-15: [speech with timestamps](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps), [model capabilities](https://elevenlabs.io/docs/api-reference/models/list), [model overview](https://elevenlabs.io/docs/overview/models), [voice metadata](https://elevenlabs.io/docs/api-reference/voices/get), [subscription metadata](https://elevenlabs.io/docs/api-reference/user/subscription/get). Local account validation failed as documented above; published documentation is not account entitlement evidence.


## Authentication follow-up

A subsequent single voice GET returned actual HTTP 401 with provider code `missing_permissions`. Native environment loading and the `xi-api-key` header are correct; manual Voices: Read permission correction is needed. The new `story:auth` command preserves sanitized status/code distinctions. See [authentication investigation](M2_3_2_AUTH_DIAGNOSTIC.md). No paid requests; Stage B remains blocked and unauthorized.
