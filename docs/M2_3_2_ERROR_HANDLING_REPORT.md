# M2.3.2 — Sanitized ElevenLabs error handling

2026-11-15. Implementation and free validation complete. Zero new synthesis requests. Waiting for separate explicit authorization before any further paid attempt.

The adapter now preserves sanitized provider codes and messages instead of reducing all unknown codes to a generic failure. It supports legacy `detail.status/message`, newer `detail.code/type/message`, top-level error envelopes and string details. HTTP 402 is classified as billing while the actual HTTP status remains unchanged. Unknown safe descriptive codes are retained. Non-JSON/invalid responses receive a bounded fallback without dumping bodies.

`ElevenLabsHTTPError` exposes HTTP status, category, provider code, optional status/type and sanitized provider message through `toJSON()`. The same fields reach read-only validation results and the persistent paid-request ledger on failures. Known credential values, encoded forms, credential fields, bearer tokens, key-like tokens and URLs are redacted; control characters are removed and messages bounded. Request headers/options, raw response bodies, nested debug fields and transport exception details are not logged or persisted.

No ElevenLabs SDK is installed; native fetch is used directly. There is no application retry loop, SDK retry layer, fallback voice or automatic model substitution. Redirects are disabled. Retry-After does not trigger a retry. Failed/uncertain paid requests remain counted, and a resumed instance cannot bypass the persistent limit. The previous one-request allowance remains exhausted; its old ledger was not modified or reset.

Regression coverage includes HTTP 401, legacy and modern 402, 403, 429, 500, 502 and 503. Tests verify exact sanitized code/message retention in thrown errors and saved ledgers, single transport invocation, persistent budget enforcement, credential removal, unknown future codes, malformed bodies, bounded messages and transport failures. All network responses in the test suite are mocked.

Live validation used exactly two read-only GETs: the selected voice and model both returned HTTP 200. Local `.env` loading, the approved voice/model selection and supported settings were verified. The original 28-word / 169-character script remains unchanged. Text to Speech permission is dashboard-confirmed from the previous user statement; synthesis entitlement and resolution of the old HTTP 402 were not tested.

TypeScript: passed. Vitest: 237 tests across 14 files passed. Whitespace: passed using a direct edited-file check; no Git commands used. Source changes: `src/audio/tts/elevenlabs.ts`, `src/tests/elevenlabs.test.ts`, and new `src/tests/elevenlabs-errors.test.ts`.

Live receipt: `jobs/volcano-m2-3-2-error-handling-2026-11-15T03-12-24-176Z/access-validation.json`.

The old provider-specific HTTP 402 message was discarded at the time of that request and cannot be reconstructed by this update. Billing examples in the tests are fixtures, not newly observed provider errors. No narration, audio generation, video rendering, effects or Git operations occurred.
