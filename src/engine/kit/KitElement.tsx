import React from 'react';
import {seededRandom} from '../../motion/particles';
import type {Theme} from '../style/theme';
import type {KitConfig} from './schema';
import {blobPath, cloudLobes, gullyPaths, mountainSilhouette, ridgeLayer, wavePath} from './geometry';
import {Figure, type FigureConfig} from './FigureElement';
import {Planet, Terrain} from './Paint';

type Props = {config: KitConfig; theme: Theme; width: number; height: number; frame: number; id: string};
const pick = (ramp: readonly string[], i: number, n: number) => ramp[Math.round((n <= 1 ? 1 : i / (n - 1)) * (ramp.length - 1))];

const Mountain: React.FC<Props & {config: Extract<KitConfig, {type: 'mountain'}>}> = ({config: c, theme, width, height, id}) => {
  const {rock, snow} = theme.palette, s = mountainSilhouette(c, width, height);
  const mirror = theme.light.from === 'right' ? `translate(${2 * s.cx} 0) scale(-1 1)` : undefined;
  const crater = c.crater > .001, rx = s.cw / 2, ry = Math.max(4, s.cw * .11);
  const halfClip = c.part === 'left' ? {x: -width, width: width + s.cx} : c.part === 'right' ? {x: s.cx, width: width * 2} : null;
  const body = <g clipPath={`url(#${id}-sil)`}>
    <rect x={-width} y={-height} width={width * 3} height={height * 3} fill={`url(#${id}-lit)`}/>
    <g transform={mirror}>
      <path d={`M ${s.cx - s.cw * .1} ${s.topY - 4} C ${s.cx + s.bw * .01} ${s.topY + s.h * .35} ${s.cx - s.bw * .02} ${s.topY + s.h * .7} ${s.cx + s.bw * .03} ${s.baseY + 30} L ${s.cx + s.bw} ${s.baseY + 30} L ${s.cx + s.bw} ${s.topY - 30} Z`} fill={rock.mid}/>
      <path d={`M ${s.cx + s.cw * .3} ${s.topY - 4} C ${s.cx + s.bw * .09} ${s.topY + s.h * .35} ${s.cx + s.bw * .17} ${s.topY + s.h * .7} ${s.cx + s.bw * .27} ${s.baseY + 30} L ${s.cx + s.bw} ${s.baseY + 30} L ${s.cx + s.bw} ${s.topY - 30} Z`} fill={rock.dark}/>
      {gullyPaths(c, width, height, c.gullies, c.seed).map((g, i) => <path key={i} d={g.d} fill="none" stroke={g.side < 0 ? rock.rim : rock.outline} strokeOpacity={g.side < 0 ? .35 : .3} strokeWidth={g.side < 0 ? 3 : 4} strokeLinecap="round"/>)}
      {[.34, .58, .8].map(t => <rect key={t} x={s.cx - s.bw} y={s.topY + s.h * t} width={s.bw * 2} height={s.h * .025} fill="#ffffff" opacity=".05"/>)}
    </g>
    {c.snow > 0 && <path d={wavePath(s.cx - s.bw, s.topY + s.h * c.snow, s.bw * 2, s.h * .025, s.bw * .12, c.seed) + ` L ${s.cx + s.bw} ${s.topY - 40} L ${s.cx - s.bw} ${s.topY - 40} Z`} fill={snow}/>}
    <path d={s.leftEdge} transform={mirror} fill="none" stroke={rock.rim} strokeWidth={7} strokeOpacity=".75"/>
  </g>;
  return <>
    <defs>
      <clipPath id={`${id}-sil`}><path d={s.d}/></clipPath>
      {halfClip && <clipPath id={`${id}-half`}><rect x={halfClip.x} y={-height} width={halfClip.width} height={height * 3}/></clipPath>}
      <linearGradient id={`${id}-lit`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={rock.light}/><stop offset="1" stopColor={rock.mid}/></linearGradient>
    </defs>
    {c.part === 'rim-front' ? <g clipPath={`url(#${id}-sil)`}>
      <path d={`M ${s.cx - rx - 3} ${s.topY + 2} A ${rx + 3} ${ry + 2} 0 0 0 ${s.cx + rx + 3} ${s.topY + 2} L ${s.cx + rx + s.bw * .02} ${s.topY + s.h * .08} Q ${s.cx} ${s.topY + s.h * .11} ${s.cx - rx - s.bw * .02} ${s.topY + s.h * .08} Z`} fill={rock.light}/>
      <path d={`M ${s.cx + rx * .2} ${s.topY + ry} L ${s.cx + rx + s.bw * .02} ${s.topY + s.h * .08} L ${s.cx + rx + 3} ${s.topY + 2} Z`} fill={rock.dark} transform={mirror}/>
      <path d={`M ${s.cx - rx} ${s.topY + 3} A ${rx} ${ry} 0 0 0 ${s.cx + rx} ${s.topY + 3}`} fill="none" stroke={rock.rim} strokeWidth={5} strokeLinecap="round"/>
    </g> : <g clipPath={halfClip ? `url(#${id}-half)` : undefined}>
      {c.shadow && <ellipse cx={s.cx} cy={s.baseY + s.bw * .02} rx={s.bw * .54} ry={s.bw * .035} fill={rock.outline} opacity=".35"/>}
      {body}
      {crater && <>
        <ellipse cx={s.cx} cy={s.topY + 2} rx={rx} ry={ry} fill={rock.crater}/>
        <path d={`M ${s.cx - rx} ${s.topY + 2} A ${rx} ${ry} 0 0 1 ${s.cx + rx} ${s.topY + 2}`} fill="none" stroke={rock.dark} strokeWidth={4}/>
        <path d={`M ${s.cx - rx} ${s.topY + 3} A ${rx} ${ry} 0 0 0 ${s.cx + rx} ${s.topY + 3}`} fill="none" stroke={rock.rim} strokeWidth={5} strokeLinecap="round"/>
      </>}
      <path d={s.d} fill="none" stroke={theme.line.color} strokeWidth={theme.line.width} strokeLinejoin="round"/>
      {halfClip && <line x1={s.cx} y1={s.topY} x2={s.cx} y2={s.baseY + s.bw * .025} stroke={theme.line.color} strokeWidth={theme.line.width}/>}
    </g>}
  </>;
};

const Strata: React.FC<Props & {config: Extract<KitConfig, {type: 'strata'}>}> = ({config: c, theme, width, height, id}) => {
  const {strata, underground, rock} = theme.palette, random = seededRandom(c.seed);
  const L = c.left * width, R = c.right * width, G = c.groundY * height, B = c.bottom * height, bowl = c.bowl * height, cx = (L + R) / 2;
  const top = c.mountain ? mountainSilhouette(c.mountain, width, height) : null;
  const sil = `M ${L} ${G} ${top ? top.topEdge : ''} L ${R} ${G} L ${R} ${B - bowl} Q ${cx} ${B + bowl} ${L} ${B - bowl} Z`;
  const topY = top ? top.topY : G, w = c.wave * height;
  const band = (y0: number, y1: number, color: string, k: number) => <path key={k} d={`${wavePath(L - 20, y0, R - L + 40, w, (R - L) / 2.2, k * 1.7)} L ${R + 20} ${y1} L ${L - 20} ${y1} Z`} fill={color}/>;
  const above = Array.from({length: c.layers}, (_, i) => band(topY + (G - topY) * i / c.layers, G + 4, strata[i % strata.length], i));
  const below = Array.from({length: 3}, (_, i) => band(G + (B + bowl - G) * i / 3, B + bowl + 10, underground[i % underground.length], i + 20));
  const pebbles = Array.from({length: 14}, () => ({x: L + random() * (R - L), y: G + random() * (B - G), r: 4 + random() * 7}));
  return <>
    <defs><clipPath id={`${id}-slab`}><path d={sil}/></clipPath></defs>
    <g clipPath={`url(#${id}-slab)`}>
      <rect x={L - 20} y={topY - 20} width={R - L + 40} height={B + bowl - topY + 40} fill={strata[0]}/>
      {above}{below}
      {pebbles.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={rock.outline} opacity=".25"/>)}
      {c.cavities.map((e, i) => <ellipse key={i} cx={e.cx * width} cy={e.cy * height} rx={e.rx * width} ry={e.ry * height} fill={rock.crater}/>)}
      {c.channels.map((ch, i) => {
        const p = (q: {x: number; y: number}) => `${q.x * width} ${q.y * height}`;
        const d = `M ${p(ch.path.start)} ` + ch.path.segments.map(s => (s.type === 'line' ? `L ${p(s.to)}` : `C ${p(s.control1)} ${p(s.control2)} ${p(s.to)}`)).join(' ');
        return <path key={i} d={d} fill="none" stroke={rock.crater} strokeWidth={ch.width * width} strokeLinecap="round"/>;
      })}
    </g>
    <path d={sil} fill="none" stroke={theme.line.color} strokeWidth={theme.line.width} strokeLinejoin="round"/>
    <path d={`M ${L} ${G} L ${top ? top.L.x : L} ${G} M ${top ? top.R.x : R} ${G} L ${R} ${G}`} stroke={rock.rim} strokeWidth={6} strokeLinecap="round"/>
  </>;
};

const tones = (theme: Theme, fill: 'hot' | 'water' | 'rock' | 'cloud' | 'sun' | 'sky') => {
  const p = theme.palette;
  return {hot: [p.hot.core, p.hot.mid, p.hot.edge], water: [p.water.light, p.water.mid, p.water.deep], rock: [p.rock.light, p.rock.mid, p.rock.dark],
    cloud: [p.cloud.light, p.cloud.light, p.cloud.shadow], sun: [p.sun.core, p.sun.glow, p.sun.glow], sky: [p.sky.glow, p.sky.horizon, p.sky.horizon]}[fill];
};

export const KitElement: React.FC<Props> = props => {
  const {config: c, theme, width, height, frame, id} = props, p = theme.palette;
  switch (c.type) {
    case 'sky': {
      const random = seededRandom(c.seed);
      return <>
        <defs><linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky.top}/><stop offset={c.horizon * .55} stopColor={p.sky.mid}/>
          <stop offset={c.horizon * .92} stopColor={p.sky.horizon}/><stop offset={c.horizon} stopColor={p.sky.glow}/>
        </linearGradient></defs>
        <rect x={-width * .5} y={-height * .5} width={width * 2} height={height * 2} fill={`url(#${id}-sky)`}/>
        {Array.from({length: c.stars}, (_, i) => <circle key={i} cx={random() * width} cy={random() * height * c.horizon * .5} r={1.2 + random() * 1.8} fill="#ffffff" opacity={.3 + random() * .5}/>)}
      </>;
    }
    case 'sun': {
      const r = c.radius * Math.min(width, height);
      return <>
        <defs><radialGradient id={`${id}-glow`}><stop offset="0" stopColor={p.sun.glow} stopOpacity=".75"/><stop offset="1" stopColor={p.sun.glow} stopOpacity="0"/></radialGradient></defs>
        <circle cx={c.x * width} cy={c.y * height} r={r * c.glow} fill={`url(#${id}-glow)`}/>
        <circle cx={c.x * width} cy={c.y * height} r={r} fill={p.sun.core}/>
      </>;
    }
    case 'ridges': return <>{Array.from({length: c.layers}, (_, i) => {
      const dx = c.drift * frame * width * (i + 1) / c.layers;
      return <path key={i} transform={`translate(${dx} 0)`} d={ridgeLayer({top: c.top, bottom: c.bottom, index: i, layers: c.layers, peaks: c.peaks, roughness: c.roughness, seed: c.seed}, width, height)} fill={pick(p.ridges, i, c.layers)}/>;
    })}</>;
    case 'ground': {
      const random = seededRandom(c.seed), y = c.top * height;
      return <>
        <defs><linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.ground.top}/><stop offset="1" stopColor={p.ground.bottom}/></linearGradient></defs>
        <rect x={-width * .5} y={y} width={width * 2} height={height * 1.5} fill={`url(#${id}-g)`}/>
        {Array.from({length: 7}, (_, i) => <ellipse key={`p${i}`} cx={random() * width} cy={y + (height - y) * (.08 + random() * .5)} rx={width * (.06 + random() * .12)} ry={height * .006} fill={p.ground.detail} opacity=".45"/>)}
        {Array.from({length: c.rocks}, (_, i) => {
          const t = random(), rx = random() * width, ry = y + (height - y) * (.2 + t * .8), s = width * (.008 + t * t * .04);
          return <g key={i} transform={`translate(${rx} ${ry})`}>
            <path d={`M ${-s} 0 L ${-s * .6} ${-s * .8} L ${s * .2} ${-s} L ${s} ${-s * .3} L ${s * .9} 0 Z`} fill={p.ground.bottom}/>
            <path d={`M ${-s * .6} ${-s * .8} L ${s * .2} ${-s} L ${0} ${-s * .55} Z`} fill={p.ground.detail}/>
          </g>;
        })}
      </>;
    }
    case 'mountain': return <Mountain {...props} config={c}/>;
    case 'strata': return <Strata {...props} config={c}/>;
    case 'blob': {
      const random = seededRandom(c.seed + 1), [core, mid, edge] = tones(theme, c.fill), cx = c.cx * width, cy = c.cy * height, rx = c.rx * width, ry = c.ry * height;
      return <>
        <defs><radialGradient id={`${id}-b`} cx=".5" cy=".42" r=".62"><stop offset="0" stopColor={core}/><stop offset=".5" stopColor={mid}/><stop offset="1" stopColor={edge}/></radialGradient></defs>
        <path d={blobPath(cx, cy, rx, ry, c.irregularity, c.seed)} fill={`url(#${id}-b)`}/>
        {Array.from({length: c.bubbles}, (_, i) => <circle key={i} cx={cx + (random() - .5) * rx * 1.2} cy={cy + (random() - .5) * ry * 1.1} r={Math.min(rx, ry) * (.05 + random() * .06)} fill={core} opacity=".75"/>)}
      </>;
    }
    case 'cloud': {
      const w = c.width * width, span = width + w * 2, x0 = c.x * width + c.drift * frame * width;
      const x = ((x0 + w) % span + span) % span - w, y = c.y * height, lobes = cloudLobes(w, c.lobes, c.seed);
      return <g transform={`translate(${x} ${y})`}>
        <defs><clipPath id={`${id}-c`}>{lobes.map((l, i) => <circle key={i} cx={l.x} cy={-l.lift} r={l.r}/>)}<rect x={-w * .42} y={-w * .02} width={w * .84} height={w * .07} rx={w * .035}/></clipPath></defs>
        <g clipPath={`url(#${id}-c)`}>
          <rect x={-w} y={-w} width={w * 2} height={w * 2} fill={p.cloud.light}/>
          <ellipse cx={0} cy={w * .07} rx={w * .62} ry={w * .09} fill={p.cloud.shadow}/>
        </g>
      </g>;
    }
    case 'water': {
      const x = c.x * width, y = c.y * height, w = c.width * width, h = c.height * height, phase = frame / c.periodFrames * Math.PI * 2;
      return <>
        <defs><linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.water.light}/><stop offset=".35" stopColor={p.water.mid}/><stop offset="1" stopColor={p.water.deep}/></linearGradient></defs>
        <path d={`${wavePath(x, y, w, h * .02, w / 5, phase)} L ${x + w} ${y + h} L ${x} ${y + h} Z`} fill={`url(#${id}-w)`}/>
        <path d={wavePath(x, y, w, h * .02, w / 5, phase)} fill="none" stroke={p.water.foam} strokeWidth={5} strokeLinecap="round"/>
        {Array.from({length: c.waves}, (_, i) => {
          const yy = y + h * (.18 + i * .16), dir = i % 2 ? -1 : 1;
          return <path key={i} d={wavePath(x + w * .06, yy, w * .88, h * .012, w / 7, phase * dir + i)} fill="none" stroke={p.water.foam} strokeOpacity={.45 - i * .08} strokeWidth={4} strokeDasharray={`${w * .08} ${w * .06}`} strokeLinecap="round"/>;
        })}
      </>;
    }
    case 'figure': return <Figure config={c as FigureConfig} theme={theme} width={width} height={height} frame={frame}/>;
    case 'planet': return <Planet config={c} theme={theme} width={width} height={height} frame={frame} id={id}/>;
    case 'terrain': return <Terrain config={c} theme={theme} width={width} height={height} id={id}/>;
    case 'glow': {
      const [core, mid] = tones(theme, c.tone);
      return <>
        <defs><radialGradient id={`${id}-glow`}><stop offset="0" stopColor={core}/><stop offset=".45" stopColor={mid} stopOpacity=".85"/><stop offset="1" stopColor={mid} stopOpacity="0"/></radialGradient></defs>
        <ellipse cx={c.x * width} cy={c.y * height} rx={c.rx * width} ry={c.ry * height} fill={`url(#${id}-glow)`}/>
      </>;
    }
  }
};

/** Static seeded film grain over the whole frame; adds a printed texture without per-frame noise or encoding cost. */
export const GrainOverlay: React.FC<{theme: Theme; width: number; height: number}> = ({theme, width, height}) => {
  const {opacity, density, seed} = theme.grain;
  const dots = React.useMemo(() => {
    const random = seededRandom(seed);
    return Array.from({length: density}, () => ({x: random() * width, y: random() * height, r: .8 + random() * 1.4, light: random() > .5}));
  }, [seed, density, width, height]);
  if (!opacity || !density) return null;
  return <svg width={width} height={height} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}} opacity={opacity * 4}>
    {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.light ? '#ffffff' : '#000000'} opacity=".25"/>)}
  </svg>;
};
