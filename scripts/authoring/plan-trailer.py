"""Channel trailer (16:9, about 35 s): "This is Gahanarka".

Single source for the story script (stories/trailer.json), from the script approved by Debabrata on 19 Nov 2026.
The question lines (t1-t4) are separate beats on purpose: when a newer or stronger episode comes out, replace one
line (about 50-60 characters of new narration) and its clip, and reuse everything else.

The storyboard section starts as a placeholder (one Earth per shot) so the free narration dry run can run;
the real shots are designed after narration, on real timing.

Usage:
  python3 scripts/authoring/plan-trailer.py --script-only     # writes stories/trailer.json
  python3 scripts/authoring/plan-trailer.py                   # writes stories/trailer.json + storyboards/trailer.json
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from recipes import *  # noqa: F401,F403
import recipes

ROOT = pathlib.Path(__file__).resolve().parents[2]
STORY = ROOT / 'stories/trailer.json'
N, K = 'narrator', 'arka'
SHOTS = []  # (beat id, intent, [(speaker, text)])


def line(bid, *parts, intent='explanation'):
    SHOTS.append((bid, intent, list(parts)))


# ------------------------------------------------------------------ script (approved 19 Nov 2026)
# Four episode questions: swap any one of these when a better episode comes out.
line('t1', (N, 'What if the Moon disappeared tonight?'), intent='hook')                          # Ep 4
line('t2', (N, 'Could you step outside on Titan without a spacesuit?'), intent='hook')           # Ep 1
line('t3', (N, 'What happens if you take your helmet off in space?'), intent='hook')             # Ep 2
line('t4', (N, 'And how would you die on every moon in the solar system?'), intent='hook')       # Ep 3
# Evergreen part: no counts or dates, so it stays true as the channel grows.
line('t5', (N, 'This is Gahanarka. Hand-drawn stories about space and science.'), intent='setup')
line('t6', (N, 'Big questions, real answers, every fact checked against real research.'), intent='setup')
line('t7', (K, "And me! I'm Arka. I ask the questions so you don't have to."), intent='explanation')
line('t8', (N, 'A new episode every week.'), intent='closing')
line('t9', (K, "Subscribe, and let's explore the unknown together!"), intent='closing')


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
    for bid, intent, parts in SHOTS:
        ph, sp = [], []
        for speaker, text in parts:
            p = phrases(text); ph += p; sp += [speaker] * len(p)
        beats.append({'id': bid, 'sceneId': f'tr-{bid}', 'intent': intent, 'narration': ' '.join(ph), 'phrases': ph, 'phraseSpeakers': sp})
    story = {'schemaVersion': '1.0', 'id': 'trailer', 'title': 'This is Gahanarka',
             'topic': 'Channel trailer: four episode questions (Moon gone, Titan, helmet off, every moon), what Gahanarka is, Arka, a new episode every week, subscribe',
             'language': 'en-US', 'targetAudience': 'English-speaking science-curious viewers aged 16-35', 'durationSeconds': duration,
             'storyboard': 'storyboards/trailer.json', 'beats': beats}
    STORY.write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')
    return story


if __name__ == '__main__' and '--script-only' in sys.argv:
    s = write_story(int(sys.argv[2]) if len(sys.argv) > 2 else 40)
    chars = {sp: 0 for sp in (N, K)}
    for _, _, parts in SHOTS:
        for sp, t in parts: chars[sp] += len(t)
    print('wrote', STORY.name, len(s['beats']), 'beats;', sum(len(b['narration']) for b in s['beats']), 'characters', chars)
    sys.exit(0)


# ------------------------------------------------------------------ storyboard (16:9, night sky): placeholder until narration exists
recipes.INK = '#eef1f8'
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 40
write_story(DURATION)
ep = Episode(str(STORY), 'wide'); F = ep.F; W, H = F['W'], F['H']
ep.theme = 'paint-night'
ep.backdrop(stars=26)


def earth(pid, x, y, r, **layer):
    return Prop(planet(pid, x, y, r, EARTH, (EARTH_LAND, EARTH, EARTH_LAND), shade=.2, seed=3, **layer), Box((x - r * H / W) * W, (y - r) * H, (x + r * H / W) * W, (y + r) * H, pid))


for bid, intent, parts in SHOTS:
    speakers = {sp for sp, _ in parts}
    chars = [Char('arka', 'arka', slot='center')] if K in speakers else []
    ep.scene(bid, explain(chars, [earth('earth', .72, .55, .16)], [Note(bid.upper(), 4, 'small')]))

if __name__ == '__main__':
    board = ep.build()
    path = ROOT / 'storyboards/trailer.json'
    path.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote', path.name, len(board['scenes']), 'shots,', sum(s['durationFrames'] for s in board['scenes']), 'frames')
