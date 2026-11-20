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
  - Arka: Jessica (`cgSgspJ2msm6clMCkdW9`), an ElevenLabs default voice, so there is no removal risk.
- **Rule:** generate narration only while a paid plan is active, since the commercial licence covers audio made during the subscription. Keep invoices.

## Voice override trap (found 20 Nov 2026)

`ELEVENLABS_VOICE_ID` in `.env` overrides `config/narration.json` → `elevenlabs.voice`. Until 20 Nov the `.env` still held
Bill's ID, so an Ep 5 dry run planned Bill instead of Gahanarka R1. The line is now commented out, so
`config/narration.json` is the single source for the narrator voice. **Before every paid run, check that the dry run's
"voice" lines show `q80kpsDmnu4IR4Zm7jWZ` (R1).** To use another voice for one run, put the override before that
command only (for example `ELEVENLABS_VOICE_ID=<id> npm run narration:synthesize …`).
