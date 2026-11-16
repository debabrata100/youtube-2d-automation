"""Episode 2 Short (9:16) as a recipe plan: storyboards/helmet-off-short.json. Real-time countdown in the backdrop.
Usage: python3 scripts/authoring/plan-helmet-off-short.py [duration_seconds] [output_storyboard]"""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from recipes import *  # noqa: F401,F403

ep = Episode('stories/helmet-off-short.json', 'tall'); F = ep.F
if len(sys.argv) > 1: ep.story['durationSeconds'] = int(sys.argv[1])
ep.backdrop(stars=22, earth={'r': .55}, counter={'show': A('fifteen', beat='hook'), 'hide': A('Get', 8, beat='rescue'), 'values': [
    {'frame': 0, 'value': 15}, {'frame': A('fifteen', beat='hook'), 'value': 15, 'ramp': True}, {'frame': A('zero', beat='blackout'), 'value': 0}]})

you = Char('you', slot='center', poses=[(0, 'float'), (A('helmet', -2), 'reach'), (A('off', 2), 'wave'), (A('fifteen'), 'shrug')],
           faces=[(0, 'happy'), (A('off', 2), 'grin'), (A('fifteen'), 'shocked')], helmet=[(A('off'), False)])
ep.scene('hook', explain([you], [helmet_toss(F, you, A('off'), dx=.26, dy=-.1, size=.14)], [Note('no helmet!', A('off', 4), arrow='you')],
                         sounds=[('whoosh', A('off', 2), -24), ('tick', A('fifteen', -2), -20)]))

you = Char('you', slot='right', poses=[(0, 'float'), (A('explode'), 'shrug'), (A('freeze'), 'hands-on-hips')], faces=[(0, 'neutral'), (A('explode'), 'happy'), (A('freeze'), 'smug')])
ep.scene('myths', explain([you], [], [Note('explode?', A('explode'), 'title', color=INK), Note('blood boils?', A('boil'), 'title', color=INK), Note('instant ice?', A('freeze'), 'title', color=INK)],
                          stamps=[(0, A('explode', 2)), (1, A('boil', 2)), (2, A('freeze', 2))], sounds=[('tick', 0, -20)]))

you = Char('you', slot='center', h=.34, poses=[(0, 'float'), (A('lungs'), 'scared')], faces=[(0, 'scared'), (A('pull'), 'pain'), (A('blood'), 'dizzy')], react=[A('pull')])
ep.scene('killer', countdown([you], [chest_arrows(F, you, A('pull'), color='#2f7fd0', size=.4)], [Note('O2 out!', A('oxygen'), color='#2f7fd0', near='you')],
                             heartbeats=[A('lungs'), A('blood')], focus_char='you', sounds=[('tick', 0, -20)]))

you = Char('you', slot='center', h=.34, idle=None, poses=[(0, 'float'), (A('black'), 'tumble')], faces=[(0, 'dizzy'), (A('black'), 'asleep')],
           layer={'rotate': track((0, 0), (A('black'), 0), (A('out', 10), -50, 'ease-out-cubic'))})
ep.scene('blackout', countdown([you], [], [], dim=vignette([(0, .15), (A('zero'), .2), (A('out', 6), .55)]), heartbeats=[A('black')], focus_char='you',
                               sounds=[('tick', A('zero', -2), -18)]))

st = station(F, 'left', open_from=0)
lift = dict(x=track((0, 0), (A('Get'), 0), (A('survive', 4), -210, 'smoothstep')), y=track((0, 0), (A('Get'), 0), (A('survive', 4), -280, 'smoothstep')))
you = Char('you', x=.62, fy=.74, h=.3, idle=None, poses=[(0, 'tumble')], faces=[(0, 'asleep'), (A('survive'), 'happy')], layer={'rotate': track((0, -50)), **lift})
arka = Char('arka', 'arka', x=.5, fy=.7, h=.28, idle=None, facing='left', poses=[(0, 'reach')], faces=[(0, 'angry'), (A('survive'), 'grin')], layer=dict(lift))
ep.scene('rescue', explain([you, arka], [st], [Note('~90 seconds', A('minute'), 'title', pos=(600, 1200)), Note('1966: it happened', A('NASA'), 'small', pos=(540, 1320))], None,
                           sounds=[('whoosh', A('Get'), -24)]))

arka = Char('arka', 'arka', x=.28, h=.3, poses=[(0, 'reach'), (A('On'), 'hands-on-hips')], faces=[(0, 'smug'), (A('On'), 'grin')])
you = Char('you', x=.64, poses=[(0, 'float'), (A('On'), 'cheer')], faces=[(0, 'neutral'), (A('On'), 'grin')], helmet=[(0, False), (A('On'), True)])
ep.scene('closing', explain([arka, you], [helmet_handover(F, arka, you, A('On'), size=.14)], [Note('helmet ON', A('On', 3), 'title')],
                            sounds=[('whoosh', A('Back', -2), -24)]))

if __name__ == '__main__':
    path, board = ep.write(sys.argv[2] if len(sys.argv) > 2 else None)
    for p in ep.placements: print(' ', p['beat'], [n[0] for n in p['notes']])
    print('wrote', path.name, sum(s['durationFrames'] for s in board['scenes']), 'frames;', sum(len(p['notes']) for p in ep.placements), 'notes placed')
