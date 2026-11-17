/** Reuse rendered segments after a plan change: copies each segment of <old-job> whose frames are provably identical
 * in <new-job> (same scenes at the same frames, same scene and group content apart from sound cues, same backdrop,
 * theme and captions setting). Changed segments are left out, so render-job.sh re-renders only those.
 * Usage: copy-unchanged-segments <old-prepared-job> <new-prepared-job> */
import path from 'node:path';
import {copyFile, mkdir, readdir, readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';

const [oldJob, newJob] = process.argv.slice(2);
if (!oldJob || !newJob) throw Error('Usage: copy-unchanged-segments <old-prepared-job> <new-prepared-job>');
const load = async (job: string) => ({board: JSON.parse(await readFile(path.join(job, 'storyboard.json'), 'utf8')), props: JSON.parse(await readFile(path.join(job, 'narration-props.json'), 'utf8'))});
const a = await load(oldJob), b = await load(newJob);
type Scene = {id: string; durationFrames: number; sounds?: unknown; config?: {primary?: {asset?: string}}};
const timeline = (board: {scenes: Scene[]}) => { let t = 0; return board.scenes.map(s => { const r = {scene: s, start: t, end: t + s.durationFrames}; t += s.durationFrames; return r; }); };
const ta = timeline(a.board), tb = timeline(b.board);
const groupsA = new Map((a.board.groups ?? []).map((g: {id: string}) => [g.id, JSON.stringify(g)]));
const groupsB = new Map((b.board.groups ?? []).map((g: {id: string}) => [g.id, JSON.stringify(g)]));
const sceneKey = (s: Scene, groups: Map<unknown, unknown>) => { const {sounds, ...rest} = s; void sounds; return JSON.stringify(rest) + (groups.get(s.config?.primary?.asset) ?? ''); };
const global = (x: {board: Record<string, unknown>; props: Record<string, unknown>}) => JSON.stringify([x.board.themeId, x.board.backdrop, x.board.format, x.board.background, x.board.accent, x.board.crossfadeFrames,
  (x.board.groups as {id: string}[] | undefined)?.find(g => g.id === (x.board.backdrop as {group?: string} | undefined)?.group), x.props.captionsEnabled, x.props.showAiDisclosureBanner]);
const sameGlobal = global(a) === global(b);
const segments = (await readdir(path.join(oldJob, 'segments'))).filter(f => /^seg-\d+-\d+\.mp4$/.test(f)).sort();
await mkdir(path.join(newJob, 'segments'), {recursive: true});
let copied = 0; const redo: string[] = [];
for (const f of segments) {
  const [s, e] = f.match(/seg-(\d+)-(\d+)/)!.slice(1).map(Number);
  // A transition can blend neighbouring scenes, so compare one scene beyond each edge of the segment.
  const span = (t: typeof ta) => t.filter(x => x.end > s - 30 && x.start <= e + 30);
  const sa = span(ta), sb = span(tb);
  const same = sameGlobal && sa.length === sb.length && sa.every((x, i) => x.start === sb[i].start && x.end === sb[i].end && sceneKey(x.scene, groupsA) === sceneKey(sb[i].scene, groupsB));
  const dest = path.join(newJob, 'segments', f);
  if (same && !existsSync(dest)) { await copyFile(path.join(oldJob, 'segments', f), dest); const meta = path.join(oldJob, 'segments', f.replace(/\.mp4$/, '.json')); if (existsSync(meta)) await copyFile(meta, dest.replace(/\.mp4$/, '.json')); copied++; }
  else if (!same) redo.push(f.replace(/\.mp4$/, ''));
}
const total = tb.at(-1)!.end, oldTotal = ta.at(-1)!.end;
console.log(JSON.stringify({copied, toRender: redo.length, changed: redo, note: total !== oldTotal ? `length changed ${oldTotal} -> ${total} frames: segments past the old end are new` : undefined}, null, 1));
