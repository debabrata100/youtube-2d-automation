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


# ------------------------------------------------------------------ storyboard (16:9, night sky)
# t1-t4 leave an empty "screen" (SCREEN box) in the middle: scripts/trailer-clips.sh drops the real episode clip
# into it after the render (free, local ffmpeg), so the trailer shows actual footage from each episode.
recipes.INK = '#eef1f8'
YELLOW = '#ffd25e'
recipes.RED = YELLOW
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 37
TAIL = 2  # seconds held after the last word
write_story(DURATION)
ep = Episode(str(STORY), 'wide'); F = ep.F; W, H = F['W'], F['H']
ep.story['durationSeconds'] = DURATION - TAIL
ep.theme = 'paint-night'
ep.backdrop(stars=30)
SCREEN = (384, 300, 1536, 948)  # x0, y0, x1, y1 in output pixels: 1152 x 648 (16:9)


def arka(x=.3, fy=.8, h=.5, poses=((0, 'float'),), faces=((0, 'happy'),), **k):
    return Char('arka', 'arka', x=x, fy=fy, h=h, poses=list(poses), faces=list(faces), **k)


def lv(*pairs):
    return [{'frame': f, 'value': v} for f, v in pairs]


def question(bid, text, arka_pose='point-right'):
    """A question shot: the line as a big title, the clip screen in the middle, Arka pointing at it from the side."""
    ep.scene(bid, explain([arka(x=.1, fy=.86, h=.34, poses=[(0, arka_pose)], faces=[(0, 'grin')])], [],
                          [Note(text, 2, 'title', size=76, pos=(W / 2, 170))], camera_preset='settle'))


question('t1', 'What if the Moon disappeared tonight?')
question('t2', 'Could you go outside on Titan without a spacesuit?')
question('t3', 'What if you took your helmet off in space?')
question('t4', 'How would you die on every moon?')

ep.scene('t5', explain([], [kit(F, 'moon', 'crescent', .5, .5, .5, level=lv((0, 1)), opacity=track((0, 0), (6, 0), (30, .35, 'smoothstep')))],
                       [Note('GAHANARKA', A('Gahanarka'), 'title', size=100, pos=(W / 2, .44 * H), color=GOLD),
                        Note('light in the unfathomable', plus(A('Gahanarka'), 12), 'small', pos=(W / 2, .56 * H)),
                        Note('hand-drawn space & science stories', A('Hand-drawn'), 'note', pos=(W / 2, .7 * H))], camera_preset='push'))

ep.scene('t6', explain([], [kit(F, 'q', 'question', .22, .48, .22, **pop_in(A('questions'), (.22 * W, .48 * H))),
                            kit(F, 'ecl', 'eclipse', .5, .48, .22, text='solar', level=lv((0, .4), (50, 1)), **pop_in(A('answers'), (.5 * W, .48 * H))),
                            kit(F, 'ok', 'check', .78, .48, .22, **pop_in(A('checked'), (.78 * W, .48 * H)))],
                       [Note('big questions', A('questions'), 'note', pos=(.22 * W, .72 * H)), Note('real answers', A('answers'), 'note', pos=(.5 * W, .72 * H)),
                        Note('fact-checked', A('checked'), 'note', pos=(.78 * W, .72 * H))]))

ep.scene('t7', explain([arka(x=.36, fy=.84, h=.62, poses=[(0, 'wave')], faces=[(0, 'grin')])], [],
                       [Note("hi! I'm Arka", A('Arka'), 'title', pos=(.68 * W, .38 * H)), Note('I ask the questions', A('ask'), 'note', pos=(.68 * W, .5 * H))]))

ep.scene('t8', explain([], [kit(F, 'cal', 'calendar', .5, .5, .34, text='NEW', **pop_in(2, (.5 * W, .5 * H)))],
                       [Note('a new episode every week', A('week'), 'title', pos=(W / 2, .8 * H))], camera_preset='push'))

ep.scene('t9', explain([arka(x=.3, fy=.84, h=.56, poses=[(0, 'wave')], faces=[(0, 'grin')])],
                       [kit(F, 'moon', 'crescent', .74, .26, .16, level=lv((0, 1))),
                        kit(F, 'sub', 'sign', .68, .58, .32, w=1.8, h=1.0, text='SUBSCRIBE', **pop_in(A('Subscribe'), (.68 * W, .58 * H)))],
                       [Note('GAHANARKA', A('explore'), 'title', size=96, pos=(W / 2, .13 * H), color=GOLD)]))

LIGHT_INK = {'question', 'crescent', 'eclipse', 'check'}
for layer in [pr.layer for pl in ep.plans.values() for pr in pl['props']] + ep._backdrop['layers']:
    k = layer.get('kit', {})
    if k.get('type') == 'prop' and k.get('item') in LIGHT_INK: k.setdefault('ink', '#c9d3ea')

ep.music([('t1', 'assets/music/6-space-event-horizon.mp3', 0)], target_lufs=-16)

if __name__ == '__main__':
    board = ep.build()
    board['scenes'][-1]['durationFrames'] += TAIL * FPS
    path = ROOT / 'storyboards/trailer.json'
    path.write_text(json.dumps(board, indent=2, ensure_ascii=False) + '\n')
    t = 0
    for sc in board['scenes']:
        print(sc['id'], 'frames', t, '-', t + sc['durationFrames']); t += sc['durationFrames']
