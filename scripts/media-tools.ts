import {spawn} from 'node:child_process';

/** REMOTION_BROWSER_EXECUTABLE overrides the default (e.g. a local headless Chromium on Linux CI). */
export const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : null);
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
