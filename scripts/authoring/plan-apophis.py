"""E7 long episode (16:9): "What If Apophis Hit? Most Videos Get It Wrong".

Single source for the story script (stories/apophis.json), generated from the approved script in
stories/apophis-script.md (one shot per line; the markdown tables are parsed, so edit the script there).
Arka's 15 lines are already recorded (E3 take in jobs/e7-avt-e3/audio/takes/arka.*); they must stay word for word
so the take is reused with --resume and only the narrator is paid.

Usage:
  python3 scripts/authoring/plan-apophis.py --script-only [seconds]   # writes stories/apophis.json
  python3 scripts/authoring/plan-apophis.py [seconds]                 # also writes a placeholder storyboards/apophis.json

The storyboard starts as a placeholder (one Earth per shot) so the free narration dry run and paid synthesis can
validate; the real shots are designed after narration, on real timing (as for Ep 4 and Ep 5).
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCRIPT_MD = ROOT / 'stories/apophis-script.md'
STORY = ROOT / 'stories/apophis.json'
SPEAKERS = {'Narrator': 'narrator', 'Arka': 'arka'}


def clean(line):
    """Spoken text: drop markdown emphasis (*for*) so the voice gets plain words."""
    return re.sub(r'\*([^*]+)\*', r'\1', line).strip()


def read_shots():
    """(beat id, intent, [(speaker, text)]) for every script line, in order."""
    text = SCRIPT_MD.read_text().split('## Script', 1)[1].split('## On-screen', 1)[0]
    shots, chapter = [], ''
    for row in text.splitlines():
        h = re.match(r'^### (.*)', row)
        if h:
            chapter = h.group(1).lower(); continue
        m = re.match(r'^\| (a\d+[a-z]?) \| (Narrator|Arka) \| (.*) \|$', row)
        if not m: continue
        bid, who, line = m.groups()
        if chapter.startswith('cold open'): intent = 'hook'
        elif chapter.startswith('ending'): intent = 'closing' if bid in ('a52', 'a53') else 'payoff'
        else: intent = 'explanation'
        shots.append((bid, intent, [(SPEAKERS[who], clean(line))]))
    ids = [b for b, _, _ in shots]
    assert len(ids) == len(set(ids)), 'duplicate line id'
    nums = [int(re.match(r'a(\d+)', b).group(1)) for b in ids]
    assert nums == sorted(nums), 'script line ids must run in order'
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
        beats.append({'id': bid, 'sceneId': f'ap-{bid}', 'intent': intent, 'narration': ' '.join(ph), 'phrases': ph, 'phraseSpeakers': sp})
    story = {'schemaVersion': '1.0', 'id': 'apophis', 'title': 'What If Apophis Hit? Most Videos Get It Wrong',
             'topic': 'Myth-busting ride on asteroid 99942 Apophis during its 13 April 2029 flyby: the scary claims, low gravity, '
                      'the 2004 scare and its discoverers, passing inside the geostationary ring, tidal shivers, what a hit would really do '
                      '(regional, not global), the honest unknown about tsunamis, OSIRIS-APEX and RAMSES, two billion people watching',
             'language': 'en-US', 'targetAudience': 'English-speaking science-curious viewers aged 16-35', 'durationSeconds': duration,
             'storyboard': 'storyboards/apophis.json', 'candidatesReport': 'stories/apophis-script.md', 'beats': beats}
    STORY.write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')
    return story


if __name__ == '__main__' and '--script-only' in sys.argv:
    args = [a for a in sys.argv[1:] if a != '--script-only']
    s = write_story(int(args[0]) if args else 660)
    words = sum(len(b['narration'].split()) for b in s['beats'])
    per = {}
    for b in s['beats']:
        for sp, ph in zip(b['phraseSpeakers'], b['phrases']): per[sp] = per.get(sp, 0) + len(ph) + 1
    print('wrote', STORY.name, len(s['beats']), 'beats,', words, 'words,', sum(len(b['narration']) for b in s['beats']), 'characters', per)
    sys.exit(0)


# ------------------------------------------------------------------ pass 0: placeholder storyboard (16:9, night sky)
from recipes import *  # noqa: E402,F401,F403
import recipes  # noqa: E402
recipes.INK = '#eef1f8'
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 660
write_story(DURATION)
ep = Episode(str(STORY), 'wide'); F = ep.F; W, H = F['W'], F['H']
ep.theme = 'paint-night-gold'
ep.backdrop(stars=26)
for bid, intent, parts in read_shots():
    chars = [Char('arka', 'arka', slot='center')] if any(s == 'arka' for s, _ in parts) else []
    earth = Prop(planet('earth', .72, .55, .16, EARTH, (EARTH_LAND, EARTH, EARTH_LAND), shade=.2, seed=3), Box(.62 * W, .37 * H, .82 * W, .73 * H, 'earth'))
    ep.scene(bid, explain(chars, [earth], [Note(bid.upper(), 4, 'small')]))

if __name__ == '__main__':
    board = ep.build()
    path = ROOT / 'storyboards/apophis.json'
    path.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote', path.name, len(board['scenes']), 'shots,', sum(s['durationFrames'] for s in board['scenes']), 'frames')
