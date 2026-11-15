# M2.3 implementation plan

2026-11-14. Existing repository inspected: JSON schema/timeline, generic compositor, templates, layer/camera/motion controls, renderer/verifier, CLI conventions and package dependencies. Preserve all pre-existing uncommitted work. M2.2.1 is technically implemented but **not visually approved**; quality refinement is postponed.

1. Add an independent strict StoryScript schema, exact ordered scene-reference validation and three authored 15-second English candidates. Select a curiosity hook with short, causal science beats.
2. Add a provider interface, a deterministic PCM test-audio mock, and a replaceable OpenAI Speech API adapter using Node 22 fetch. No OpenAI SDK is installed, so verify the official HTTP and TypeScript request contract rather than introduce an unnecessary SDK dependency.
3. Cache normalized synthesis requests, measure actual WAV duration with FFprobe, align per-beat clips to the existing 90-frame scene slots and fail actionable strict timing errors. No automatic speed-up, scene retiming, truncation or API retry. Compare full-script versus per-beat synthesis in the report; select per-beat measured boundaries for this milestone.
4. Add validated phrase captions with bounded two-line layout and explicit estimated phrase timing within measured beat boundaries. Add an optional generic narration/caption overlay to the existing compositor; visual-only behavior remains unchanged.
5. Add validate/preview/render CLIs, job-local copied audio served through the existing Remotion bundle, exact 450-frame rendering, AAC embedding, decoded media checks, three short previews and numbered contact sheets.
6. Add tests for schema/order, timing/overflow/gaps, captions, cache keys and integrity, missing credentials, mocked provider requests, deterministic test audio and optional integration. Re-run baseline lossless compatibility and protected hashes.
7. Render mock mode, inspect actual encoded caption frames/audio metrics and write reports. The mock contains clearly disclosed synthetic test tones, not spoken words or a production narrator. Finish every no-cost task before stopping at the user's required authorization checkpoint for real speech.

No artwork, gradients, camera choreography, smoke/lava quality or approved PNG changes. Use `storyboards/volcano.json` as explicitly requested, not the separate M2.2.1 refinement storyboard. No LangGraph, agents, scriptwriting API, music, effects, publishing, commit, push, tag or M2.4.
