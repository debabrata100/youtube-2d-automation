# M2.3.2 Stage A — authentication investigation

2026-11-15. **Blocked by key permissions. No paid calls, synthesis or rendering.**

The single live check was `GET /v1/voices/iiidtqDt9FBdT1vfBluA` for Bill L. Oxley. Actual response: **HTTP 401**, allowlisted provider code **`missing_permissions`**. Sanitized diagnosis: “Access denied; check endpoint scopes, account restrictions and IP allowlisting.” The original response message/body was not logged or retained. No second live request, voice import, alternate voice or replacement credential was attempted after this result.

This is a permission-coded 401, not a reported `invalid_api_key` error. It does not verify voice availability, narration entitlement or all account permissions. Stage B remains blocked and unauthorized.

## Local checks

- Exactly one `ELEVENLABS_API_KEY` definition exists in project-root `.env` and its parsed value is nonempty.
- There is no inherited key overriding it in this execution environment.
- The value loaded by Node's native `--env-file-if-exists=.env` equals the parsed local value in memory. Only equality/configuration booleans were displayed; no value, prefix, suffix, length or hash was printed.
- No surrounding or embedded whitespace was detected in the parsed key.
- The configured voice matches the requested ID; the model is supported by the scoped adapter configuration.
- The adapter sends the key through the documented `xi-api-key` header over HTTPS. No bearer prefix or query-string credential is used. Redirects and automatic retries remain disabled.
- The environment-loading flow is correct; no `.env` changes were needed or made.

The previous adapter discarded the provider error body entirely, so its generic 401 output could not distinguish an invalid key from a restricted key. It now preserves the actual HTTP status and only an allowlisted machine code, with a locally authored explanation. Provider messages, unknown codes, headers and transport exception details are never echoed. Permission-coded 401, ordinary authentication 401, permission 403 and voice-access errors are tested separately; the actual HTTP status is never rewritten to fit the category.

## Manual correction

In the intended ElevenLabs workspace, open **Developers → API Keys**, review the existing key, and grant **Voices: Read** access for the read-only voice check. Check applicable workspace/IP restrictions if access still fails. No broad write permissions, replacement key, or Sound Effects permission is required for this diagnostic. Keep the key local; do not paste it into chat.

Then rerun only:

```bash
npm run story:auth -- --script stories/volcano-elevenlabs-a.json --voice iiidtqDt9FBdT1vfBluA
```

This command performs exactly one read-only voice metadata GET. It exits 2 on a failed check and never synthesizes or renders. A successful voice GET would verify metadata access only; the prior full Stage A model/account checks also remain unverified. Paid TTS still requires separate bounded human approval. No key/account permission changes were performed by the agent.

## Verification

TypeScript, **217 tests across 13 files**, and whitespace checks pass. Normal tests use mocked requests only. All 46 snapshotted paths (44 prior protected asset/video files plus original and selected scripts) retain their pre-investigation hashes. The selected script remains 28 words. No prior video was rendered or modified. Working tree remains uncommitted; no push or tag. Credential-value scans found zero occurrences in intended text files.

Changed for this investigation: provider HTTP diagnostics and the single-GET helper in `src/audio/tts/elevenlabs.ts`; `auth` CLI action in `scripts/story.ts`; `story:auth` npm command; provider/environment regression tests; this diagnostic and summary documentation. Paid render blocking remains intact.

Official references: [authentication header and restrictions](https://elevenlabs.io/docs/api-reference/authentication), [voice GET endpoint](https://elevenlabs.io/docs/api-reference/voices/get), [voice-read key permissions](https://elevenlabs.io/docs/help-center/product/voices/my-voices/why-cant-i-access-my-voices-via-third-party-services). The account's actual response above is the basis for the permission diagnosis.


## Recheck after Voices: Read was enabled

The next read-only voice GET returned **HTTP 200** for `iiidtqDt9FBdT1vfBluA`: the prior voice permission blocker is resolved. The model metadata GET returned **HTTP 401 / `missing_permissions`** for `/v1/models`. Enable **Models** access for that metadata check. Text to Speech permission is a separate scope; voice/model GETs do not prove it. No documented personal-key scope introspection operation was found in the reviewed official API-key/user references. Confirm **Text to Speech: Access** in the existing key dashboard; no synthesis probe was made. Stage B remains unverified and unauthorized. Two read-only GETs, zero paid requests, no effects, rendering or Git writes. TypeScript, 217 tests and whitespace checks pass; all 46 protected paths remain unchanged. See [recheck receipt](M2_3_2_ACCESS_RECHECK.json).
