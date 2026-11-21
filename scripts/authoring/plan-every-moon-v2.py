"""Every Moon rework (16:9): "How You'd Die on Every Moon in the Solar System", script draft 5.

Single source for the story script (stories/every-moon-v2.json), generated from stories/every-moon-v2-script.md
(one shot per line; the markdown tables are parsed, so edit the script there). The storyboard is designed after
narration, on real timing (as for Eps 4 and 5).

Usage: python3 scripts/authoring/plan-every-moon-v2.py --script-only [seconds]
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCRIPT_MD = ROOT / 'stories/every-moon-v2-script.md'
STORY = ROOT / 'stories/every-moon-v2.json'
SPEAKERS = {'Narrator': 'narrator', 'Arka': 'arka'}


def read_shots():
    text = SCRIPT_MD.read_text().split('## Script', 1)[1].split('## Fact check', 1)[0]
    shots, chapter = [], ''
    for row in text.splitlines():
        h = re.match(r'^### (.*)', row)
        if h:
            chapter = h.group(1).lower(); continue
        m = re.match(r'^\| (e\d+) \| (\w+) \| (.*) \|$', row)
        if not m: continue
        bid, who, line = m.groups()
        intent = 'hook' if chapter.startswith('cold open') else ('closing' if chapter.startswith('ending') else 'explanation')
        shots.append((bid, intent, [(SPEAKERS[who], line)]))
    ids = [int(b[1:]) for b, _, _ in shots]
    assert ids == list(range(1, len(ids) + 1)), 'script line ids must run e1..eN'
    return shots


def phrases(text, limit=34):
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
        beats.append({'id': bid, 'sceneId': f'em2-{bid}', 'intent': intent, 'narration': ' '.join(ph), 'phrases': ph, 'phraseSpeakers': sp})
    story = {'schemaVersion': '1.0', 'id': 'every-moon-v2', 'title': "How You'd Die on Every Moon in the Solar System",
             'topic': 'Anthology: what kills a suited visitor first on twelve moons (our Moon, Callisto, Phobos, Deimos, Miranda, Enceladus, Triton, Charon, Ganymede, Europa, Io, Titan), with two locked cards (deadliest, you can fly), survival times and a radiation countdown',
             'language': 'en-US', 'targetAudience': 'English-speaking science-curious viewers aged 16-35', 'durationSeconds': duration,
             'storyboard': 'storyboards/every-moon-v2.json', 'candidatesReport': 'stories/every-moon-v2-script.md', 'beats': beats}
    STORY.write_text(json.dumps(story, indent=1, ensure_ascii=False) + '\n')
    return story


if __name__ == '__main__' and '--script-only' in sys.argv:
    args = [a for a in sys.argv[1:] if a != '--script-only']
    s = write_story(int(args[0]) if args else 680)
    print('wrote', STORY.name, len(s['beats']), 'beats,', sum(len(b['narration'].split()) for b in s['beats']), 'words,', sum(len(b['narration']) for b in s['beats']), 'characters')
    sys.exit(0)


# ------------------------------------------------------------------ pass 0: placeholder storyboard (one Moon per shot), so the free dry run and paid synthesis validate
from recipes import *  # noqa: E402,F401,F403
import recipes  # noqa: E402
recipes.INK = '#eef1f8'
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 680
write_story(DURATION)
ep = Episode(str(STORY), 'wide'); F = ep.F; W, H = F['W'], F['H']
ep.theme = 'paint-night'
ep.backdrop(stars=26)
for bid, intent, parts in read_shots():
    chars = [Char('arka', 'arka', slot='center')] if any(s == 'arka' for s, _ in parts) else []
    moon = Prop(planet('moon', .72, .55, .16, '#b5b5b0', (), shade=.25, seed=3), Box(.62 * W, .37 * H, .82 * W, .73 * H, 'moon'))
    ep.scene(bid, explain(chars, [moon], [Note(bid.upper(), 4, 'small')]))

if __name__ == '__main__':
    board = ep.build()
    path = ROOT / 'storyboards/every-moon-v2.json'
    path.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    print('wrote', path.name, len(board['scenes']), 'shots,', sum(s['durationFrames'] for s in board['scenes']), 'frames')
