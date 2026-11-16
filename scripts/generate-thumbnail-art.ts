/** Thumbnail art from OpenAI's image API, under the same paid-request rules as narration.
 *
 *   --spec thumbnails/<id>.json       prompts + model/size/quality (style text comes from config/thumbnail-style.json)
 *   --dry-run                         plan, prompts and estimated cost; no network, no cost
 *   --authorize-paid-images --max-images <n> --max-usd <x>   required for paid requests (refused if the plan exceeds either cap)
 *   --variants a,b                    optional subset of variants
 *   --output jobs/<new-dir>           every image's raw response is saved before decoding; existing images are skipped
 *
 * One request per variant, no automatic retries; a failure stops the run and is recorded in the ledger.
 * The API key is read from OPENAI_API_KEY (.env via --env-file-if-exists) and never written or printed. */
import path from 'node:path';
import {parseArgs} from 'node:util';
import {existsSync} from 'node:fs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {z} from 'zod';

/** USD per image, from OpenAI's published per-image prices (checked 2026-11-16). Used for estimates and the cap. */
export const PRICE: Record<string, Record<string, Record<string, number>>> = {
  'gpt-image-1.5': {low: {'1024x1024': .009, '1536x1024': .013, '1024x1536': .013}, medium: {'1024x1024': .034, '1536x1024': .05, '1024x1536': .05}, high: {'1024x1024': .133, '1536x1024': .2, '1024x1536': .2}},
  'gpt-image-1-mini': {low: {'1024x1024': .005, '1536x1024': .006, '1024x1536': .006}, medium: {'1024x1024': .011, '1536x1024': .015, '1024x1536': .015}, high: {'1024x1024': .036, '1536x1024': .052, '1024x1536': .052}},
};
const specSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/), model: z.enum(['gpt-image-1.5', 'gpt-image-1-mini']).default('gpt-image-1.5'),
  size: z.enum(['1024x1024', '1536x1024', '1024x1536']).default('1536x1024'), quality: z.enum(['low', 'medium', 'high']).default('medium'),
  subject: z.string().min(1), variants: z.array(z.object({id: z.string().regex(/^[a-z0-9-]+$/), prompt: z.string().min(10).max(2400)}).strict()).min(1).max(8),
  overlay: z.unknown().optional(),
}).strict();
const styleSchema = z.object({style: z.string().min(10), characters: z.record(z.string(), z.string()).default({})}).strict();
export const fullPrompt = (style: z.infer<typeof styleSchema>, subject: string, prompt: string) =>
  [style.style, ...Object.entries(style.characters).filter(([k]) => (prompt + ' ' + subject).toLowerCase().includes(k.toLowerCase())).map(([k, v]) => `${k}: ${v}`), `Scene: ${subject} ${prompt}`].join('\n\n');

const main = async () => {
  const {values: o} = parseArgs({options: {spec: {type: 'string'}, style: {type: 'string', default: 'config/thumbnail-style.json'}, output: {type: 'string'}, variants: {type: 'string'},
    'dry-run': {type: 'boolean', default: false}, 'authorize-paid-images': {type: 'boolean', default: false}, 'max-images': {type: 'string'}, 'max-usd': {type: 'string'}}});
  if (!o.spec) throw Error('Usage: thumbnails:generate -- --spec thumbnails/<id>.json (--dry-run | --authorize-paid-images --max-images <n> --max-usd <x>) --output jobs/<dir>');
  const spec = specSchema.parse(JSON.parse(await readFile(o.spec, 'utf8'))), style = styleSchema.parse(JSON.parse(await readFile(o.style!, 'utf8')));
  const wanted = o.variants ? new Set(o.variants.split(',')) : null, variants = spec.variants.filter(v => !wanted || wanted.has(v.id));
  const job = path.resolve(o.output ?? `jobs/thumbs-${spec.id}`), unit = PRICE[spec.model][spec.quality][spec.size];
  const plan = variants.map(v => { const prompt = fullPrompt(style, spec.subject, v.prompt); return {variant: v.id, done: existsSync(path.join(job, `${v.id}.png`)), requestHash: createHash('sha256').update(JSON.stringify({model: spec.model, size: spec.size, quality: spec.quality, prompt})).digest('hex'), prompt}; });
  const pending = plan.filter(p => !p.done), usd = +(pending.length * unit).toFixed(3);
  const summary = {spec: spec.id, model: spec.model, size: spec.size, quality: spec.quality, usdPerImage: unit, pendingImages: pending.length, estimatedUsd: usd, automaticRetries: 0};
  if (o['dry-run']) { console.log(JSON.stringify({...summary, prompts: plan.map(p => ({variant: p.variant, done: p.done, prompt: p.prompt})), paidRequestsMade: 0}, null, 2)); return; }
  if (!pending.length) { console.log(JSON.stringify({...summary, note: 'All variants already exist; nothing to do.', paidRequestsMade: 0})); return; }
  if (!o['authorize-paid-images']) throw Error(`Authorization required: ${pending.length} image(s), about $${usd}. Pass --authorize-paid-images --max-images ${pending.length} --max-usd ${usd}. No request was made.`);
  const maxImages = Number(o['max-images']), maxUsd = Number(o['max-usd']);
  if (!Number.isInteger(maxImages) || maxImages < pending.length) throw Error(`--max-images must be >= ${pending.length}. No request was made.`);
  if (!(maxUsd >= usd)) throw Error(`--max-usd must be >= ${usd}. No request was made.`);
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw Error('OPENAI_API_KEY is not set (use .env). No request was made.');
  await mkdir(job, {recursive: true});
  const ledgerPath = path.join(job, 'paid-image-ledger.json');
  const ledger: {attempts: Array<Record<string, unknown>>} = existsSync(ledgerPath) ? JSON.parse(await readFile(ledgerPath, 'utf8')) : {attempts: []};
  const save = () => writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
  let made = 0;
  for (const p of pending) {
    const attempt: Record<string, unknown> = {variant: p.variant, requestHash: p.requestHash, usdEstimate: unit, status: 'reserved-before-request', at: new Date().toISOString()};
    ledger.attempts.push(attempt); await save();
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {method: 'POST', redirect: 'error', signal: AbortSignal.timeout(300000),
        headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({model: spec.model, prompt: p.prompt, size: spec.size, quality: spec.quality, n: 1, output_format: 'png'})});
      made++;
      const body = await response.text();
      attempt.httpStatus = response.status; attempt.requestId = response.headers.get('x-request-id') ?? undefined;
      if (!response.ok) { attempt.status = 'http-error'; attempt.detail = body.replaceAll(key, '[redacted]').slice(0, 400); await save(); throw Error(`OpenAI returned HTTP ${response.status}`); }
      await writeFile(path.join(job, `${p.variant}.response.json`), body); // saved before decoding
      attempt.status = 'response-received'; await save();
      const b64 = z.object({data: z.array(z.object({b64_json: z.string().min(100)}).passthrough()).min(1)}).passthrough().parse(JSON.parse(body)).data[0].b64_json;
      const png = Buffer.from(b64, 'base64');
      if (png.subarray(1, 4).toString('ascii') !== 'PNG') throw Error('Response is not a PNG');
      await writeFile(path.join(job, `${p.variant}.png`), png);
      await writeFile(path.join(job, `${p.variant}.json`), JSON.stringify({variant: p.variant, model: spec.model, size: spec.size, quality: spec.quality, prompt: p.prompt, requestHash: p.requestHash}, null, 2) + '\n');
      attempt.status = 'succeeded'; await save();
    } catch (e) {
      if (attempt.status === 'reserved-before-request' || attempt.status === 'response-received') { attempt.status = attempt.status === 'response-received' ? 'response-received-but-invalid' : 'failed-or-uncertain'; attempt.detail ??= String((e as Error).message).replaceAll(key, '[redacted]').slice(0, 300); await save(); }
      console.error(JSON.stringify({variant: p.variant, failed: (e as Error).message, paidRequestsMade: made, note: 'Stopped; no automatic retry. Finished images are kept; rerun the same command to continue after review.'}));
      process.exit(1);
    }
  }
  console.log(JSON.stringify({...summary, job, paidRequestsMade: made, next: 'Run thumbnails:compose on the variants you like.'}, null, 2));
};
if (process.argv[1]?.endsWith('generate-thumbnail-art.ts')) await main();
