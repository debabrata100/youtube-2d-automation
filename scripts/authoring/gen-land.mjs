// Regenerates src/engine/kit/land.ts (land outlines for the globe and map props) from Natural Earth 1:50m land (public domain)
// via the world-atlas package (ISC). Run outside the repo so the packages stay out of package.json:
//   mkdir /tmp/geo && cd /tmp/geo && npm init -y && npm i world-atlas@2 topojson-client@3
//   node <repo>/scripts/authoring/gen-land.mjs 0.2 land-50m   (writes land.json; then wrap it as land.ts)
// Douglas-Peucker tolerance in degrees; islands under 1.5 square degrees are dropped. No political borders, by design.
import fs from 'fs'; import {feature} from 'topojson-client';
const tol = +process.argv[2]||0.2, src=process.argv[3]||'land-50m';
const topo = JSON.parse(fs.readFileSync(`node_modules/world-atlas/${src}.json`));
const land = feature(topo, topo.objects.land);
const dp=(pts,eps)=>{ if(pts.length<3) return pts; let dmax=0,idx=0; const [a,b]=[pts[0],pts.at(-1)];
 for(let i=1;i<pts.length-1;i++){const p=pts[i];const dx=b[0]-a[0],dy=b[1]-a[1];const L=Math.hypot(dx,dy);const d=L<1e-9?Math.hypot(p[0]-a[0],p[1]-a[1]):Math.abs(dy*p[0]-dx*p[1]+b[0]*a[1]-b[1]*a[0])/L; if(d>dmax){dmax=d;idx=i}}
 if(dmax>eps){return [...dp(pts.slice(0,idx+1),eps).slice(0,-1),...dp(pts.slice(idx),eps)]} return [a,b]};
const rings=[]; for(const f of (land.features||[land])){const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates; for(const poly of polys){const r=dp(poly[0],tol); 
 // area filter
 let A=0; for(let i=0;i<r.length;i++){const [x1,y1]=r[i],[x2,y2]=r[(i+1)%r.length];A+=x1*y2-x2*y1} if(Math.abs(A)/2<1.5){continue} if(r.length<4) continue; rings.push(r.map(([x,y])=>[Math.round(x*10)/10,Math.round(y*10)/10]));}}
const n=rings.reduce((s,r)=>s+r.length,0); console.error(rings.length,'rings',n,'points');
fs.writeFileSync('land.json', JSON.stringify(rings));
