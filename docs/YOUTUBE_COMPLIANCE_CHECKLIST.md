# Gahanarka: YouTube compliance checklist

Check **every video** (long episode and Short) against this list before it is scheduled. Facts were researched 17–18 Nov 2026. YouTube policies change, so re-check the linked policy pages every few months and update this file.

Supporting records: `docs/MUSIC_SOURCES.md`, `docs/VOICE_LICENSING.md`, `docs/brand/ARKA.md`, `publishing/README.md`, and the project docs "second-channel-niche-analysis" and "silent-comedy-channel-monetization-plan".

## The rules behind the checklist (what we learned)

1. **Inauthentic content policy.** It replaced "repetitious content" in July 2025 and was clarified in July 2026. Content that is mass-produced, repetitive or template-based can't be monetized, and YouTube judges the **whole channel**. Using AI tools is allowed. Obviously fictional animation is outside the policy's scope. The risks are identical formats, recycled title templates and full automation without human oversight.
2. **AI personas on sensitive topics** (health, finance) can't be monetized. Science explainers aren't a sensitive topic. Never give medical or money advice in Arka's or the narrator's voice.
3. **AI voice.** YouTube does not ban AI narration. A generic synthetic voice needs **no** "altered or synthetic content" label; that label is for realistic impersonation of a real person. We still say "Narration voiced with AI (ElevenLabs)" in every description.
4. **ElevenLabs licence.** Commercial use needs a **paid plan active at the moment the audio is generated**. The free plan has no commercial rights. We have been on Starter since 15 Nov 2026 (see `VOICE_LICENSING.md`).
5. **Music.** Use only YouTube Audio Library tracks marked "YouTube Audio Library License" (no attribution), or a documented paid licence. Avoid "Creative Commons Attribution" tracks unless the credit line goes in the description. All 15 tracks in `assets/music/` were verified (see `MUSIC_SOURCES.md`).
6. **Images.** NASA images are generally free to use, but credit them ("NASA/JPL-Caltech", with the PIA number) in the description. Never use other channels' frames, film or TV stills, or branded characters.
7. **Characters.** Arka is our original character, drawn by our own code (`docs/brand/ARKA.md`). AI-generated images can't be copyrighted in the US, and India requires human authorship. So draw Arka with our renderer and use AI only for backgrounds and effects.
8. **No copying competitors.** Don't remake a video another channel is known for in a similar style. Example: The Paint Explainer's "dying on every planet", which is why we skipped that topic. Our angle must add something, such as myth-busting with sources.
9. **Made for Kids.** Cartoons are **not** automatically for kids. Keep "No, it's not made for kids" and adult-facing titles, descriptions and tags. Never tag for kids.
10. **Advertiser-friendly topics.** Death and danger are fine when educational and non-graphic. No gore, no self-harm, no real-person tragedies, no politics. A yellow icon means limited ads, not a ban; ask for a human review if it seems wrong.
11. **Partner Program bar.** From 1 Feb 2027 new applicants need 1,000 subscribers plus **8,000 long-form watch hours in 12 months** (or 20M Shorts views in 90 days). Shorts don't count toward watch hours, so long episodes of **8–15 min** carry the channel.
12. **Fact accuracy.** Every claim is sourced in the episode's fact-check table. Uncertain science is hedged ("in their simulations", "could"). Myths are named as myths.

## Checklist (copy into each episode's publishing file and tick)

### Content and originality
- [ ] Script written and approved by Debabrata (a human); every claim has a source in `stories/<id>-script.md`.
- [ ] Topic and angle are not a remake of a well-known competitor video in the same style.
- [ ] No medical, financial or legal advice; no AI persona speaking on health or finance.
- [ ] No graphic violence, gore, self-harm or politics; any death or danger is educational and non-graphic.
- [ ] Visuals are made for this video (unique shots, not reused scenes); at least one new animated idea.

### Assets and licences
- [ ] Narration generated while a **paid** ElevenLabs plan was active; request IDs recorded.
- [ ] Every music track is listed in `docs/MUSIC_SOURCES.md` with the "YouTube Audio Library License" (or a documented licence).
- [ ] Photos are NASA/ESA or otherwise public domain or licensed; credits are in the description.
- [ ] Arka is drawn from our own renderer; no AI-generated Arka in the video.
- [ ] No third-party characters, logos, brand names or film or TV material.

### Packaging (title, thumbnail, description)
- [ ] Title written by hand for this video (not a recycled template); a promise the video keeps.
- [ ] Thumbnail designed individually; it differs from the last 10 uploads.
- [ ] Description includes sources, image credits and "Narration voiced with AI (ElevenLabs)"; the channel footer is present.
- [ ] Tags relevant; none aimed at children.

### Studio settings at upload
- [ ] Audience: **No, it's not made for kids**. Age restriction: No.
- [ ] Altered or synthetic content: **No** (non-realistic animation plus a generic AI narrator). Switch to Yes if a video ever shows realistic AI footage or imitates a real person's voice.
- [ ] Paid promotion: No (unless sponsored).
- [ ] Category: Science & Technology; playlist set; captions (SRT) uploaded.
- [ ] YouTube's copyright check in Studio passed before scheduling.
- [ ] Related video (Shorts) or end screen (long) points to the right video.

### Channel health (monthly)
- [ ] Long-form watch hours tracked toward 8,000; long episodes of 8–15 min.
- [ ] Upload pace steady (about one long episode a week plus Shorts); no flooding.
- [ ] No Community Guidelines strikes; any yellow icons reviewed.
- [ ] Production records kept (script, fact-check, storyboard commit, narration IDs), which serve as evidence for an appeal.
