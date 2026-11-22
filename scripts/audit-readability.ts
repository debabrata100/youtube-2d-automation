/** Readability audit (contrast + time on screen of hand-written notes) on a prepared job or a storyboard file.
 * Exits 1 when any error is found, so it can block a render. Usage: audit-readability <job-dir | storyboard.json> */
import path from 'node:path';
import {readFile, stat} from 'node:fs/promises';
import {readabilityIssues} from '../src/engine/storyboard/readability';

const target = process.argv[2];
if (!target) throw Error('Usage: audit-readability <prepared-job-dir | storyboard.json>');
const file = (await stat(target)).isDirectory() ? path.join(target, 'storyboard.json') : target;
const issues = readabilityIssues(JSON.parse(await readFile(file, 'utf8')));
const errors = issues.filter(i => i.level === 'error'), warnings = issues.filter(i => i.level === 'warning');
for (const i of issues) console.log(`${i.level === 'error' ? 'ERROR' : 'warn '} ${i.check.padEnd(8)} ${String(i.startSeconds).padStart(6)} s  ${i.scene}  "${i.note}": ${i.detail}`);
console.log(JSON.stringify({file, errors: errors.length, warnings: warnings.length}));
process.exit(errors.length ? 1 : 0);
