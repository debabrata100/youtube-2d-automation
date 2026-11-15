/**
 * Bundled font files (OFL, see ./fonts/OFL.txt). Rendering components call ensureFont(family) before drawing
 * text; the first call registers a FontFace and holds the Remotion frame until it has loaded.
 */
import {continueRender, delayRender} from 'remotion';
import patrickHand from './fonts/PatrickHand-Regular.ttf';

const FILES: Record<string, string> = {'Patrick Hand': patrickHand};
const started = new Set<string>();

/** Accepts a CSS font-family list; loads the first bundled family it names. No-op for system fonts and outside a browser. */
export const ensureFont = (familyList: string | undefined) => {
  if (!familyList || typeof document === 'undefined' || typeof FontFace === 'undefined') return;
  const family = familyList.split(',').map(f => f.trim().replace(/^['"]|['"]$/g, '')).find(f => FILES[f]);
  if (!family || started.has(family)) return;
  started.add(family);
  const handle = delayRender(`Loading font ${family}`);
  new FontFace(family, `url(${FILES[family]})`).load()
    .then(face => { document.fonts.add(face); continueRender(handle); })
    .catch(error => { console.error(`Font ${family} failed to load`, error); continueRender(handle); });
};
