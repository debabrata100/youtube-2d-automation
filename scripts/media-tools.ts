import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';

/** REMOTION_BROWSER_EXECUTABLE overrides the default (e.g. a local headless Chromium on Linux CI). */
// Render browser (22 Nov 2026): prefer Remotion's own headless Chrome in node_modules, which never auto-updates. The everyday
// Chrome app updates itself in the background, and new render workers then crash on launch ("Library not loaded").
// Order: REMOTION_BROWSER_EXECUTABLE, the headless shell if present, then the Chrome app (macOS) or Remotion's default.
const headlessShell = path.resolve('node_modules/.remotion/chrome-headless-shell', `${process.platform === 'darwin' ? 'mac' : 'linux'}-${process.arch === 'arm64' ? 'arm64' : 'x64'}`,
  `chrome-headless-shell-${process.platform === 'darwin' ? 'mac' : 'linux'}-${process.arch === 'arm64' ? 'arm64' : 'x64'}`, 'chrome-headless-shell');
// The headless shell crashed on this Mac when loading a page ("browser has disconnected", 22 Nov), so it is opt-in until fixed:
// RENDER_WITH_HEADLESS_SHELL=1 uses it. Default stays the Chrome app (keep it relaunched after updates).
export const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || (process.env.RENDER_WITH_HEADLESS_SHELL === '1' && existsSync(headlessShell) ? headlessShell
  : process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : null);
export const run = (command: string, args: string[], cwd = process.cwd()) => new Promise<void>((resolve, reject) => {
  const child = spawn(command, args, {cwd, stdio: 'inherit'});
  child.on('error', reject);
  child.on('close', code => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)));
});
export const capture = (command: string, args: string[], cwd = process.cwd()) => new Promise<string>((resolve, reject) => {
  const chunks: string[] = [];
  const child = spawn(command, args, {cwd});
  child.stdout.on('data', data => chunks.push(String(data)));
  child.stderr.on('data', data => chunks.push(String(data)));
  child.on('error', reject);
  child.on('close', code => code === 0 ? resolve(chunks.join('')) : reject(new Error(`${command} exited ${code}: ${chunks.join('')}`)));
});
export const probe = async (file: string) => JSON.parse(await capture('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,width,height,r_frame_rate,nb_frames:format=duration', '-of', 'json', file]));
