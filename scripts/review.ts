import path from 'node:path';
import {writeFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {getCompositions,renderMedia} from '@remotion/renderer';
import {browserExecutable,makeJob,plan,run,probe} from './lib';

await run('npm',['run','typecheck']);
await run('npm',['test']);
const job=await makeJob();
const output=path.join(job,'output','animation.mp4');
const started=Date.now();
const serveUrl=await bundle({entryPoint:path.join(process.cwd(),'src/index.ts')});
const composition=(await getCompositions(serveUrl,{inputProps:{plan},browserExecutable})).find(c=>c.id==='PlanetFormation');
if(!composition)throw new Error('Composition missing');
await renderMedia({composition,serveUrl,codec:'h264',pixelFormat:'yuv420p',outputLocation:output,inputProps:{plan},crf:18,browserExecutable});
const elapsedSeconds=Number(((Date.now()-started)/1000).toFixed(2));
await run('npx',['tsx','scripts/contact-sheet.ts',job]);
await run('npx',['tsx','scripts/verify.ts',job]);
const inspection=await probe(output);
await writeFile(path.join(job,'render-report.json'),JSON.stringify({status:'complete',elapsedSeconds,output,inspection,humanVisualApproval:'pending'},null,2));
await writeFile(path.join(job,'implementation-report.md'),`# Implementation report\n\n- Composition: How Planets Form\n- Frames: 450 at 30 FPS\n- Resolution: 1080 × 1920\n- Templates: space reveal, particle orbit, accretion, planet reveal, summary\n- Render time: ${elapsedSeconds} seconds\n- Automated verification: passed\n- Human visual approval: pending\n`);
await writeFile(path.join(job,'visual-review-report.md'),`# M1.1 visual review report

## M1 weaknesses

The baseline used shallow star fields, centered infographic-like compositions, repetitive debris, limited surface detail, small final subjects, linear camera behavior, and scene boundaries that could briefly expose the base background.

## M1.1 improvements

- Three deterministic parallax star layers, structured nebula color, restrained grain, and vignette.
- Multi-stage eased camera focus, zoom, tracking, and rotation in all five scenes.
- Layered star corona, animated energy wisps, surface variation, and broader bloom.
- Dimensional rocky planet with rotating terrain, craters, terminator shading, highlight, and rim illumination.
- Three irregular asteroid silhouettes with facets, craters, depth scaling, and varied rotation.
- Reusable staggered spiral convergence with shrinking particles and progressive planet-detail emergence.
- Overlapped scene rendering for motion-matched crossfades without dark boundary frames.
- Larger final star and planet with a stronger wide-shot relationship.

## Reusable techniques

Camera keyframe interpolation, deterministic convergence state, depth-aware debris, layered celestial illustration, overlapping scene transitions, and richer procedural space environments are topic-neutral.

## Performance trade-offs

Render time was ${elapsedSeconds} seconds versus approximately 81 seconds for M1. Additional SVG layers and procedural detail improve depth at the cost of more DOM and filter work.

## Remaining weaknesses

The sequence has no audio, narration, or caption timing. SVG lighting remains illustrative rather than physically based. Automated checks cannot judge taste, perceived pacing, or mobile-display readability.

## Human approval

Human visual approval remains pending. Review the MP4 at full vertical size, especially the accretion-to-planet transition and final two-second hold.
`);
console.log(`REVIEW_JOB=${job}`);
