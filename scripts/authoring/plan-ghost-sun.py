"""Ep 5 long episode (16:9): "If the Sun Disappeared, Even the Air Would Fall".

Single source for the story script (stories/ghost-sun.json), generated from the approved script draft 3 in
stories/ghost-sun-script.md (one shot per line; the markdown tables are parsed, so edit the script there).
The storyboard section is added after narration, once real timing exists.

Usage:
  python3 scripts/authoring/plan-ghost-sun.py --script-only [seconds]   # writes stories/ghost-sun.json
  python3 scripts/authoring/plan-ghost-sun.py [seconds]                 # also writes a placeholder storyboards/ghost-sun.json

The storyboard starts as a placeholder (one Earth per shot) so the free narration dry run and paid synthesis can
validate; the real shots are designed after narration, on real timing (as for Ep 4).
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCRIPT_MD = ROOT / 'stories/ghost-sun-script.md'
STORY = ROOT / 'stories/ghost-sun.json'
SPEAKERS = {'Narrator': 'narrator', 'Arka': 'arka'}


def read_shots():
    """(beat id, intent, [(speaker, text)]) for every script line, in order."""
    text = SCRIPT_MD.read_text().split('## Script', 1)[1].split('## Shorts', 1)[0]
    shots, chapter = [], ''
    for row in text.splitlines():
        h = re.match(r'^### (.*)', row)
        if h:
            chapter = h.group(1).lower(); continue
        m = re.match(r'^\| (s\d+) \| (\w+) \| (.*) \|$', row)
        if not m: continue
        bid, who, line = m.groups()
        n = int(bid[1:])
        if chapter.startswith('cold open'): intent = 'hook'
        elif chapter.startswith('ending'): intent = 'payoff' if n <= 66 else 'closing'
        else: intent = 'explanation'
        shots.append((bid, intent, [(SPEAKERS[who], line)]))
    ids = [int(b[1:]) for b, _, _ in shots]
    assert ids == list(range(1, len(ids) + 1)), 'script line ids must run s1..sN'
    return shots


def phrases(text, limit=34):
    """Caption phrases: break at sentence ends, otherwise before a word that would pass `limit` characters."""
    out, cur = [], ''
    for w in text.split():
        if cur and len(cur) + 1 + len(w) > limit: out.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
        if re.search(r'[.!?…]$', cur): out.append(cur); cur = ''
    return out + ([cur] if cur else [])


def write_story(duration):
    beats = []
    for bid, intent, parts in read_shots():
        ph, sp = [], []
        for speaker, text in parts:
            p = phrases(text); ph += p; sp += [speaker] * len(p)
        assert len(ph) <= 12, f'{bid}: {len(ph)} phrases (max 12); split the line'
        beats.append({'id': bid, 'sceneId': f'gs-{bid}', 'intent': intent, 'narration': ' '.join(ph), 'phrases': ph, 'phraseSpeakers': sp})
    story = {'schemaVersion': '1.0', 'id': 'ghost-sun', 'title': 'If the Sun Disappeared, Even the Air Would Fall',
             'topic': 'Thought experiment: the Sun vanishes for 8 min 20 s (blackout longer than any eclipse, silent bees, the Moon goes out, Earth 740 m off course, a 1 AU shell of darkness passing the planets and Voyager 1), then for good: Earth flies off, cooling to 0, -20, -70 and -240 C, oxygen lasts, trees last decades, oceans freeze from the top, the air freezes and falls, survivors (fungi, tardigrades, vent life), the Sun cannot really vanish',
             'language': 'en-US', 'targetAudience': 'English-speaking science-curious viewers aged 16-35', 'durationSeconds': duration,
             'storyboard': 'storyboards/ghost-sun.json', 'candidatesReport': 'stories/ghost-sun-script.md', 'beats': beats}
    STORY.write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')
    return story


if __name__ == '__main__' and '--script-only' in sys.argv:
    args = [a for a in sys.argv[1:] if a != '--script-only']
    s = write_story(int(args[0]) if args else 720)
    words = sum(len(b['narration'].split()) for b in s['beats'])
    print('wrote', STORY.name, len(s['beats']), 'beats,', words, 'words,', sum(len(b['narration']) for b in s['beats']), 'characters')
    sys.exit(0)


# ------------------------------------------------------------------ pass 0: placeholder storyboard (16:9, night sky)
from recipes import *  # noqa: E402,F401,F403
import recipes  # noqa: E402
recipes.INK = '#eef1f8'
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 720
write_story(DURATION)
ep = Episode(str(STORY), 'wide'); F = ep.F; W, H = F['W'], F['H']
ep.theme = 'paint-night'
ep.backdrop(stars=26)
for bid, intent, parts in read_shots():
    chars = [Char('arka', 'arka', slot='center')] if any(s == 'arka' for s, _ in parts) else []
    earth = Prop(planet('earth', .72, .55, .16, EARTH, (EARTH_LAND, EARTH, EARTH_LAND), shade=.2, seed=3), Box(.62 * W, .37 * H, .82 * W, .73 * H, 'earth'))
    ep.scene(bid, explain(chars, [earth], [Note(bid.upper(), 4, 'small')]))

if __name__ == '__main__':
    board = ep.build()
    path = ROOT / 'storyboards/ghost-sun.json'
    path.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote', path.name, len(board['scenes']), 'shots,', sum(s['durationFrames'] for s in board['scenes']), 'frames')
