# Voice licensing (ElevenLabs)

Checked 17 Nov 2026 from Debabrata's ElevenLabs account screenshots.

- **Plan:** Starter (a paid plan, which includes a commercial licence). The first invoice was paid **15 Nov 2026, 8:37 AM**, and the plan renews on 15 Dec.
- **Published narration was generated after the plan started** (file creation times, IST):

| Narration | Used in | Generated |
|---|---|---|
| `jobs/m3-3-narration` | Titan pilot and Titan Short | 15 Nov, 22:57 |
| `jobs/m3-5-narration-b`, `m3-5-narration-short` | Ep 2 and Ep 2 Short | 16 Nov, 14:14 |
| `jobs/m3-7-narration` | Ep 3 (every moon) | 16 Nov, 23:10 |
| `jobs/vy-narration` | Voyager Short | 17 Nov, 19:53 |

- **Voices:**
  - Narrator from Ep 5 on (20 Nov 2026): **Gahanarka R1** (`q80kpsDmnu4IR4Zm7jWZ`), designed for the channel with ElevenLabs Voice Design (prompt: warm, calm male narrator, mid-30s, neutral international English accent, documentary storyteller). It is private to our account, so no other channel has it, and there is no Voice Library removal risk. Chosen by Debabrata in a blind test against R3, R4 and Bill (`jobs/vt-*`, key in `jobs/voice-test-key.json`). Cost of choosing it: Voice Design 4 rounds, 908 credits; blind test 4 requests, 788 credits. R3 and R4 were deleted from the account on 20 Nov (only R1 uses a custom voice slot).
  - Narrator for Eps 1-4 and their Shorts: Bill L. Oxley (`iiidtqDt9FBdT1vfBluA`), a Voice Library voice with a **2-year notice period**. If the owner stops sharing it, we can keep using it for 2 years; audio already generated stays usable.
  - Arka from M1 on (21 Nov 2026): **Arka D2** (`TL9f5lGrdeX5wHMushRC`), designed for the channel with ElevenLabs Voice Design (prompt: a woman around thirty, clear, bright but grounded; quick, dry, ironic humour, like a smart colleague asking the obvious question; never cute or childlike; neutral international English accent). Private to our account, so no Voice Library removal risk. Chosen by Debabrata in a blind test (`stories/arka-voice-test.json`, three M1 lines) against Arka D1 (`j85pThmkjJIalN7bd5Uf`, deleted from the account on 21 Nov after the test) and Jessica (`jobs/avt-*`, key in `jobs/arka-voice-test-key.json`). Cost: Voice Design 2 rounds, 472 credits; blind test 3 requests × 188 characters, about 564 credits. Reason: the grown-up positioning (21 Nov); Jessica sounded like a kid sidekick next to R1.
  - Arka for Eps 2-5 and their Shorts: Jessica (`cgSgspJ2msm6clMCkdW9`), an ElevenLabs default voice. Cached audio stays; re-synthesising an old episode would now use D2, so pass the old voice explicitly if that is ever needed.
- **Rule:** generate narration only while a paid plan is active, since the commercial licence covers audio made during the subscription. Keep invoices.

## Voice override trap (found 20 Nov 2026)

`ELEVENLABS_VOICE_ID` in `.env` overrides `config/narration.json` → `elevenlabs.voice`. Until 20 Nov the `.env` still held
Bill's ID, so an Ep 5 dry run planned Bill instead of Gahanarka R1. The line is now commented out, so
`config/narration.json` is the single source for the narrator voice. **Before every paid run, check that the dry run's
"voice" lines show `q80kpsDmnu4IR4Zm7jWZ` (R1).** To use another voice for one run, put the override before that
command only (for example `ELEVENLABS_VOICE_ID=<id> npm run narration:synthesize …`).

## Brand voice decision (20 Nov 2026)

**Gahanarka R1 (`q80kpsDmnu4IR4Zm7jWZ`) is the channel's brand narrator from Ep 5 on**, approved by Debabrata after hearing
the full Ep 5 narration (`jobs/gs-narration`, 699.4 s, requests WeffTfEY7PQQVPgCnp3o + HSRS9PzBAiZdUaVQRB4l, 9,595 credits).
Considered and rejected the same day: Bill for Ep 5 (shared by ~762K users, so no brand value) and a new design, R5
(`oQGDobpGClfCv5sPeYxY`, 285 credits, deleted unused). The "0d notice period" tooltip in My Voices refers to Voice Library
voices; R1 is our own designed voice and can only be removed by us. The real risk is the plan: on a downgrade, voices
beyond the plan's custom voice slots become inaccessible (not deleted), so keep a paid plan and stay within the slots.
