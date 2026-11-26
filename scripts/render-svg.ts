/** Render a hand-drawn SVG (thumbnail, poster, still) to PNG with the same browser the video renders use. Free, offline.
 *   node --import tsx scripts/render-svg.ts --input <scene.svg> --output <scene.png> [--width 1280 --height 720]
 * The SVG may use @font-face with paths relative to its own folder (fonts are loaded before the screenshot). */
import path from 'node:path';
import {parseArgs} from 'node:util';
import {mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {browserExecutable, capture} from './media-tools';

const {values: o} = parseArgs({options: {input: {type: 'string'}, output: {type: 'string'}, width: {type: 'string', default: '1280'}, height: {type: 'string', default: '720'}}});
if (!o.input || !o.output) throw Error('Usage: render-svg --input <scene.svg> --output <scene.png> [--width 1280 --height 720]');
if (!browserExecutable) throw Error('No browser found: set REMOTION_BROWSER_EXECUTABLE to a Chrome or headless-shell binary');
const svgPath = path.resolve(o.input), w = Number(o.width), h = Number(o.height);
const svg = await readFile(svgPath, 'utf8');
// Wrap in HTML with <base> at the SVG's folder, so relative font and image URLs resolve; no margins, exact size.
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><base href="${pathToFileURL(path.dirname(svgPath) + '/').href}">
<style>html,body{margin:0;padding:0;width:${w}px;height:${h}px;overflow:hidden;background:#000}svg{display:block}</style></head><body>${svg}</body></html>`;
const dir = await mkdtemp(path.join(tmpdir(), 'svg-')), page = path.join(dir, 'page.html');
await writeFile(page, html);
// Containers run as root, where Chrome refuses to start without --no-sandbox (we only load our own local file).
const sandbox = process.platform === 'linux' && process.getuid?.() === 0 ? ['--no-sandbox'] : [];
await capture(browserExecutable, [...sandbox, '--headless', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--virtual-time-budget=3000',
  `--window-size=${w},${h}`, `--screenshot=${path.resolve(o.output)}`, pathToFileURL(page).href]);
console.log(JSON.stringify({output: path.resolve(o.output), size: `${w}x${h}`, paidRequests: 0}));
