import {z} from 'zod';

const localPath = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_./-]*\.(png|svg|webp)$/i, 'Expected a local PNG, SVG or WebP path relative to assets/').refine(value => !value.split('/').some(part => part === '..' || part === '.' || part === ''), 'Asset paths cannot traverse directories');
export const assetSchema = z.object({
  id: z.string().min(1), path: localPath, type: z.enum(['png', 'svg', 'webp']),
  width: z.number().int().positive(), height: z.number().int().positive(),
  transparent: z.boolean().optional(), styleId: z.string().min(1).optional(),
}).strict().refine(asset => asset.path.split('.').at(-1)?.toLowerCase() === asset.type, 'Asset type must match file extension');
export type AssetDefinition = z.infer<typeof assetSchema>;

/** Per-storyboard registry: no mutable process-global registrations. */
export const createAssetRegistry = (assets: readonly AssetDefinition[]) => {
  const map = new Map<string, AssetDefinition>();
  for (const value of assets) {
    const asset = assetSchema.parse(value);
    if (map.has(asset.id)) throw new Error(`Duplicate asset ID: ${asset.id}`);
    map.set(asset.id, Object.freeze(asset));
  }
  return {
    resolve(id: string): Readonly<AssetDefinition> {
      const asset = map.get(id);
      if (!asset) throw new Error(`Missing asset: ${id}`);
      return asset;
    },
    list: () => [...map.values()],
  };
};
export type AssetRegistry = ReturnType<typeof createAssetRegistry>;
