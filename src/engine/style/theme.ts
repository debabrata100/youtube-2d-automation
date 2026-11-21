import {z} from 'zod';
import dusk from './themes/explainer-dusk.json';
import day from './themes/explainer-day.json';
import storm from './themes/explainer-storm.json';
import paint from './themes/paint-notebook.json';
import paintNight from './themes/paint-night.json';
import paintNightGold from './themes/paint-night-gold.json';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a six-digit hex color');
const ramp = z.array(hex).min(2).max(8);

/** One file defines a channel look. Storyboards reference colours as "@role.path" (e.g. "@hot.core", "@ridges.2"). */
export const themeSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().min(1),
  palette: z.object({
    sky: z.object({top: hex, mid: hex, horizon: hex, glow: hex}).strict(),
    sun: z.object({core: hex, glow: hex}).strict(),
    ridges: ramp,
    ground: z.object({top: hex, bottom: hex, detail: hex}).strict(),
    rock: z.object({light: hex, mid: hex, dark: hex, outline: hex, rim: hex, crater: hex}).strict(),
    strata: ramp,
    underground: ramp,
    hot: z.object({core: hex, mid: hex, edge: hex, glow: hex}).strict(),
    smoke: z.object({light: hex, mid: hex, shadow: hex}).strict(),
    cloud: z.object({light: hex, shadow: hex}).strict(),
    water: z.object({light: hex, mid: hex, deep: hex, foam: hex}).strict(),
    snow: hex,
    text: z.object({fill: hex, outline: hex, accent: hex}).strict(),
    label: z.object({bg: hex, fg: hex, line: hex}).strict(),
  }).strict(),
  line: z.object({width: z.number().min(0).max(12), color: hex}).strict(),
  light: z.object({from: z.enum(['left', 'right'])}).strict(),
  grain: z.object({opacity: z.number().min(0).max(.2), density: z.number().int().min(0).max(4000), seed: z.number().int().min(0)}).strict(),
  label: z.object({fontFamily: z.string().min(1), fontWeight: z.number().int().min(400).max(900), radius: z.number().min(0).max(40)}).strict(),
  caption: z.object({variant: z.enum(['box', 'outline']), fontSize: z.number().min(36).max(72), top: z.number().min(.08).max(.2), textColor: hex, outlineColor: hex, highlight: z.enum(['none', 'word']).optional(), highlightColor: hex.optional(),
    /** false: no burned-in captions (long-form; upload captions to YouTube instead). */
    enabled: z.boolean().optional(), fontFamily: z.string().min(1).optional()}).strict(),
  /** Hand-drawn line boil: every group is displaced by seeded noise that changes `fps` times per second. */
  ink: z.object({amplitude: z.number().min(0).max(8), frequency: z.number().min(.002).max(.08), fps: z.number().min(1).max(30), seed: z.number().int().min(0)}).strict().optional(),
}).strict();
export type Theme = z.infer<typeof themeSchema>;

const registry = new Map<string, Theme>([dusk, day, storm, paint, paintNight, paintNightGold].map(raw => {
  const theme = themeSchema.parse(raw);
  return [theme.id, Object.freeze(theme)] as const;
}));
export const themeIds = () => [...registry.keys()];
export const getTheme = (id: string): Theme => {
  const theme = registry.get(id);
  if (!theme) throw Error(`Unknown theme: ${id}`);
  return theme;
};

/** Look up "@role.path" in a theme palette; throws on unknown roles so typos fail validation. */
export const themeColor = (theme: Theme, ref: string): string => {
  if (!ref.startsWith('@')) return ref;
  let value: unknown = theme.palette;
  for (const key of ref.slice(1).split('.')) value = (value as Record<string, unknown> | undefined)?.[key];
  if (typeof value !== 'string') throw Error(`Unknown theme colour ${ref} in theme ${theme.id}`);
  return value;
};

/** Replace every "@role.path" string in a storyboard with the theme's hex value. Idempotent. */
export const resolveThemeRefs = <T>(value: T, theme: Theme): T => {
  if (typeof value === 'string') return (value.startsWith('@') ? themeColor(theme, value) : value) as T;
  if (Array.isArray(value)) return value.map(item => resolveThemeRefs(item, theme)) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveThemeRefs(v, theme)])) as T;
  return value;
};

/** WCAG 2.x relative-luminance contrast ratio between two hex colours. */
export const contrastRatio = (a: string, b: string) => {
  const lum = (h: string) => {
    const [r, g, bl] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(c => (c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4));
    return .2126 * r + .7152 * g + .0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + .05) / (lo + .05);
};
