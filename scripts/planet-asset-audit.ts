import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

export const auditPlanetAsset=()=>{
  const asset='assets/illustrations/planet/rocky-planet-approved.png';
  const png=readFileSync(asset);
  if(png.subarray(1,4).toString()!=='PNG'||png[24]!==8||png[25]!==6)throw new Error('Expected approved 8-bit RGBA PNG');
  const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  const rgba=execFileSync('ffmpeg',['-v','error','-i',asset,'-f','rawvideo','-pix_fmt','rgba','pipe:1'],{maxBuffer:width*height*4+1024});
  let left=width,top=height,right=-1,bottom=-1,transparentPixels=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const alpha=rgba[(y*width+x)*4+3];
    if(alpha===0)transparentPixels++;
    if(alpha>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  }
  return {asset,width,height,colorType:png[25],sha256:createHash('sha256').update(png).digest('hex'),visibleAlphaThreshold:8,bounds:{left,top,right,bottom},transparentPixels,corners:[rgba[3],rgba[(width-1)*4+3],rgba[((height-1)*width)*4+3],rgba[(width*height-1)*4+3]]};
};
