import {describe, it, expect} from 'vitest';
import {mkdtemp, readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import configs from '../../config/narration.json';
import {ttsConfigSchema} from '../audio/tts/provider';
import {ElevenLabsTTSProvider, decodeTimestampedResponse, elevenRequestHash, repairAlignment} from '../audio/tts/elevenlabs';

const config = ttsConfigSchema.parse(configs.elevenlabs);
const text = 'In 1966 NASA. So...';
const pcmBase64 = (seconds: number) => Buffer.alloc(Math.round(seconds * 48000)).toString('base64');
const overlapping = () => {
  const characters = Array.from(text), starts = characters.map((_, i) => i * .05), ends = characters.map((_, i) => i * .05 + .06); // each ends after the next starts
  return {characters, character_start_times_seconds: starts, character_end_times_seconds: ends};
};
const provider = async (body: unknown) => {
  const dir = await mkdtemp(path.join(tmpdir(), 'el-')), ledgerPath = path.join(dir, 'paid-request-ledger-narrator.json');
  const request = {text, config};
  const p = new ElevenLabsTTSProvider({apiKey: 'test-only', ledgerPath, authorization: {maxRequests: 1, maxCharacters: text.length, requestHash: elevenRequestHash(request)},
    fetchImpl: (async () => new Response(JSON.stringify(body), {status: 200, headers: {'request-id': 'req-1'}})) as typeof fetch});
  return {p, request, ledgerPath};
};

describe('ElevenLabs paid-response safety', () => {
  it('repairs slightly overlapping provider timings instead of rejecting them', () => {
    const a = repairAlignment(overlapping());
    for (let i = 1; i < a.characters.length; i++) expect(a.character_start_times_seconds[i]).toBeGreaterThanOrEqual(a.character_end_times_seconds[i - 1]);
    expect(() => repairAlignment({characters: ['a'], character_start_times_seconds: [], character_end_times_seconds: []})).toThrow();
  });
  it('accepts a take with overlapping timings and saves the raw response first', async () => {
    const {p, request, ledgerPath} = await provider({audio_base64: pcmBase64(1.2), alignment: overlapping()});
    const result = await p.synthesize(request);
    expect(result.alignment!.characters.join('')).toBe(text);
    expect(existsSync(ledgerPath.replace(/\.json$/, '.response.json'))).toBe(true);
    expect(JSON.parse(await readFile(ledgerPath, 'utf8')).attempts[0].status).toBe('succeeded');
  });
  it('keeps the paid response and records why when validation fails, so it can be recovered offline', async () => {
    const {p, request, ledgerPath} = await provider({audio_base64: '###not-base64###', alignment: overlapping()});
    await expect(p.synthesize(request)).rejects.toThrow(/no automatic retry/);
    const attempt = JSON.parse(await readFile(ledgerPath, 'utf8')).attempts[0];
    expect(attempt.status).toBe('response-received-but-invalid');
    expect(attempt.detail).toMatch(/Invalid audio encoding/);
    expect(attempt.detail).not.toContain('test-only');
    const saved = await readFile(ledgerPath.replace(/\.json$/, '.response.json'), 'utf8');
    expect(() => decodeTimestampedResponse(saved)).toThrow(/Invalid audio encoding/);
    // A valid saved body decodes without any network access.
    const ok = decodeTimestampedResponse(JSON.stringify({audio_base64: pcmBase64(1.2), alignment: overlapping()}));
    expect(ok.alignment!.characters.length).toBe(Array.from(text).length);
  });
});
