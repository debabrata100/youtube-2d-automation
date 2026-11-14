import {readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {createAssetRegistry, type AssetDefinition} from '../src/engine/assets/registry';
import {capture} from './media-tools';

/** Node-only preflight. Browser registry validates references; this verifies local files. */
export const validateAssetFiles = async (assets: readonly AssetDefinition[], directory = path.resolve('assets')) => {
  const base = await realpath(directory);
  const registry = createAssetRegistry(assets);
  return Promise.all(registry.list().map(async asset => {
    let source: string;
    try { source = await realpath(path.join(base, asset.path)); }
    catch { throw new Error(`Missing asset file for ${asset.id}: ${asset.path}`); }
    if (!source.startsWith(base + path.sep)) throw new Error(`Asset escapes public directory: ${asset.id}`);
    let width: number, height: number;
    if (asset.type === 'svg') {
      const svg = await readFile(source, 'utf8');
      const root = svg.match(/<svg\b[^>]*>/i)?.[0] ?? '';
      const box = root.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1].trim().split(/[\s,]+/).map(Number);
      const dimension = (name: string) => Number(root.match(new RegExp(`\\b${name}\\s*=\\s*["']([0-9.]+)(?:px)?["']`, 'i'))?.[1]);
      width = dimension('width') || box?.[2] || 0; height = dimension('height') || box?.[3] || 0;
    } else {
      const data = JSON.parse(await capture('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,pix_fmt,codec_name', '-of', 'json', source])).streams[0];
      if (data.codec_name !== (asset.type === 'png' ? 'png' : 'webp')) throw new Error(`Asset file type mismatch: ${asset.id}`);
      width = data.width; height = data.height;
      if (asset.transparent === true && !/rgba|bgra|argb|abgr|yuva|gbrap|ya|pal8/.test(data.pix_fmt)) throw new Error(`Asset has no alpha-capable format: ${asset.id}`);
    }
    if (width !== asset.width || height !== asset.height) throw new Error(`Asset dimensions mismatch for ${asset.id}: declared ${asset.width}×${asset.height}, actual ${width}×${height}`);
    return {id: asset.id, path: asset.path, width, height};
  }));
};
