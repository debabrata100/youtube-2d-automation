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
13. **Repetition (the old "repetitious content" rule).** It is now part of the inauthentic content policy (rule 1) and is judged across the whole channel, with no published threshold. A consistent style and a recognizable series are fine. What isn't fine: fill-in-the-blank videos, the same structure every time, trimmed clips posted as new Shorts, or a channel made mostly of compilations. Each video needs its own substance: a new topic, a new angle and new visuals.

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
- [ ] Title is **50 characters or less**, so it isn't cut off with "…" on phones.
- [ ] The first 5 seconds confirm the title and thumbnail's promise (no slow build-up).
- [ ] Thumbnail designed individually; it differs from the last 10 uploads.
- [ ] Description includes sources, image credits and "Narration voiced with AI (ElevenLabs)"; the channel footer is present.
- [ ] Tags relevant; none aimed at children.

### Repetition check (compare with the last 5 uploads)
- [ ] The topic is new; if it's part of a series ("every moon", "what if X disappeared"), this episode answers a genuinely different question with different facts, not a swapped noun.
- [ ] The structure differs from the last episode in at least one visible way: a different cold open, chapter shape, recurring device or ending.
- [ ] Arka's jokes are new lines, not a repeated catchphrase in the same spot (one signature sign-off is fine).
- [ ] The ending's "Arka's next question" uses new wording and a new picture, and teases an episode whose script is at least drafted (see `docs/CONTENT_PLAN.md`).
- [ ] At least one new drawing piece, scene type or animated idea that previous videos didn't have.
- [ ] Music isn't the identical track list in the identical order as the previous episode.
- [ ] Each Short has its own hook, its own 9:16 layout and its own ending; it is not a trimmed clip of the long episode.
- [ ] Compilations are at most 1 in 4 long uploads, only of our own content, with new connecting material.
- [ ] Title and thumbnail don't follow the same template as the previous 3 uploads.

### Studio settings at upload
- [ ] Audience: **No, it's not made for kids**. Age restriction: No.
- [ ] Altered or synthetic content: **No** (non-realistic animation plus a generic AI narrator). Switch to Yes if a video ever shows realistic AI footage or imitates a real person's voice.
- [ ] Paid promotion: No (unless sponsored).
- [ ] Category: Science & Technology; playlist set; captions (SRT) uploaded.
- [ ] YouTube's copyright check in Studio passed before scheduling.
- [ ] Related video (Shorts) or end screen (long) points to the right video.
- [ ] When this episode is the one the previous episode teased, switch the previous episode's end-screen video to this one once it's public.

### Quality over schedule
- [ ] If an episode isn't good enough by its slot, skip the week instead of publishing something weaker (one late episode costs less than a weak one).
- [ ] The episode's publishing file records **one thing we improved** compared with the previous episode.

### Channel health (monthly)
- [ ] Long-form watch hours tracked toward 8,000; long episodes of 8–15 min.
- [ ] Upload pace steady (about one long episode a week plus Shorts); no flooding.
- [ ] No Community Guidelines strikes; any yellow icons reviewed.
- [ ] Production records kept (script, fact-check, storyboard commit, narration IDs), which serve as evidence for an appeal.
