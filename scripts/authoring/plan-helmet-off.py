"""Episode 2 (16:9) as a recipe plan: storyboards/helmet-off.json. Layout, camera, idle motion and sounds are derived.
Usage: python3 scripts/authoring/plan-helmet-off.py [duration_seconds] [output_storyboard]"""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from recipes import *  # noqa: F401,F403

ep = Episode('stories/helmet-off.json', 'wide'); F = ep.F
if len(sys.argv) > 1: ep.story['durationSeconds'] = int(sys.argv[1])
b = lambda w, beat, k=0: A(w, k, beat=beat)
ep.backdrop(stars=26, earth={'hidden': [(b('We', 'history'), b('So', 'closing'))]}, counter={
    'show': b('fifteen', 'hook'), 'hide': b('Four', 'blackout'),
    'values': [{'frame': 0, 'value': 15}] + [{'frame': b(w, beat), 'value': v} for w, beat, v in [('Twelve', 'explode', 12), ('Ten', 'boil', 10), ('Seven', 'cold', 7)]]})

you = Char('you', slot='right', poses=[(0, 'float'), (A('helmet', -2), 'reach'), (A('off', 2), 'wave'), (A('fifteen'), 'shrug')],
           faces=[(0, 'happy'), (A('off', 2), 'grin'), (A('fifteen'), 'shocked'), (A('Wait'), 'scared')], helmet=[(A('off'), False)])
st = station(F, open_at=A('Wait', -2))
arka = Char('arka', 'arka', x=st.points['hatch'][0] + .02, fy=.6, h=.32, idle=None, poses=[(0, 'panic')], faces=[(0, 'shocked')], enter=('pop', A('Wait', -2)))
ep.scene('hook', explain([you, arka], [st, helmet_toss(F, you, A('off'))],
                         [Note('no helmet!', A('off', 4), arrow='you'), Note('Arka', A('Wait', 6), 'label', near='arka')], focus='you'))

you = Char('you', slot='center', poses=[(0, 'float'), (A('out'), 'stand'), (A('hold'), 'hands-on-hips'), (A('expands'), 'scared')],
           faces=[(0, 'neutral'), (A('out'), 'happy'), (A('hold'), 'puffed'), (A('expands'), 'pain')], react=[A('expands')])
ep.scene('breath', explain([you], [chest_arrows(F, you, A('expands'))],
                           [Note('BREATHE OUT', A('out'), 'title'), Note("don't hold it!", A('hold'), 'small'), Note('lungs tear', A('tears'))], 'push'))

you = Char('you', slot='center', idle=None, poses=[(0, 'float'), (A('explode'), 'panic'), (A("wouldn't"), 'float'), (A('pop'), 'cheer')],
           faces=[(0, 'neutral'), (A('explode'), 'scared'), (A("wouldn't"), 'happy'), (A('swell'), 'puffed'), (A('pop'), 'grin')],
           layer={'scale': track((0, 1), (A('swell'), 1), (A('swell', 10), 1.16, 'ease-out-back'))})
ep.scene('explode', myth_bust('BOOM?', A('explode'), A("wouldn't"), [you],
                              [Note('skin holds you together', A('skin'), 'small'), Note('swell, not pop', A('swell'))]))

you = Char('you', slot='center-left', h=.6, poses=[(0, 'float'), (A('blood'), 'shrug'), (A('tongue'), 'stand')],
           faces=[(0, 'neutral'), (A('blood'), 'shocked'), (A('No'), 'happy'), (A('tongue'), 'tongue')])
arka = Char('arka', 'arka', x=.9, h=.4, facing='left', poses=[(0, 'float'), (A('Gross'), 'shrug')], faces=[(0, 'shocked'), (A('Gross'), 'pain')], enter=('pop', A('Gross', -4)))
ep.scene('boil', myth_bust('blood boils?', A('blood'), A('No'), [you, arka],
                           [Note('blood: safe', A('pressure'), 'small'), Note('spit: bubbles!', A('bubble'))],
                           [spit(F, you, A('bubble', -2), eid='spit-a'), spit(F, you, A('bubble', 26), eid='spit-b')], 'punch' if False else 'settle',
                           sounds=[('bubble', A('bubble'), -22)]))

you = Char('you', slot='center', poses=[(0, 'float'), (A('freeze'), 'hands-on-hips'), (A('sunburn'), 'cower')],
           faces=[(0, 'neutral'), (A('freeze'), 'smug'), (A('sunburn'), 'pain')], flush=[(A('sunlight'), 0), (A('sunburn', 10), .85)])
ep.scene('cold', myth_bust('instant ice?', A('freeze'), A('freeze', 2), [you],
                           [Note('heat leaves slowly', A('slowly'), 'small'), Note('sunburn!', A('sunburn'), near='sun')],
                           [Prop({'id': 'sun', 'kit': {'type': 'sun', 'x': .12, 'y': .2, 'radius': .07}}, Box(110, 110, 350, 330, 'sun')),
                            kit(F, 'thermo', 'thermometer', .88, .66, .34, w=.35, h=1.2, level=[{'frame': 0, 'value': .62}, {'frame': A('cold'), 'value': .62}, {'frame': A('slowly', 12), 'value': .52}])]))

you = Char('you', slot='center', poses=[(0, 'float'), (A('killer'), 'scared'), (A('Three'), 'float'), (A('One'), 'tumble')],
           faces=[(0, 'neutral'), (A('killer'), 'scared'), (A('pull'), 'pain'), (A('Three'), 'dizzy'), (A('One'), 'asleep')])
arka = Char('arka', 'arka', x=.82, fy=.92, h=.42, idle=None, facing='left', top=True, poses=[(0, 'reach')], faces=[(0, 'angry')], enter=('right', A('Hang', -6)))
ep.scene('blackout', countdown([you, arka], [chest_arrows(F, you, A('pull'), until=A('Two'), color='#2f7fd0')],
                               [Note('the real killer', A('killer'), 'title'), Note('lungs work in reverse', A('reverse'), 'small'), Note('O2 out', A('pull', 2), color='#2f7fd0', near='you', until=A('Two'))],
                               counter=scene_counter(F, [{'frame': 0, 'value': 4}] + [{'frame': A(w), 'value': v} for w, v in [('Three', 3), ('Two', 2), ('One', 1)]]),
                               dim=vignette([(0, 0), (A('Three'), 0), (A('Two'), .35), (A('One', 8), .72)]), heartbeats=[A('Three'), A('Two'), A('One')], focus_char='you',
                               sounds=[('tick', A(w, -3), -20) for w in ('Four', 'Three', 'Two', 'One')] + [('whoosh', A('Hang', -6), -22)]))

st = station(F, open_from=0)
tow = track((0, 0), (A('Get'), 0), (A('survive', 6), -720, 'smoothstep'))
you = Char('you', x=.8, fy=.82, h=.48, idle=None, poses=[(0, 'tumble')], faces=[(0, 'asleep')], layer={'rotate': track((0, -60)), 'x': tow})
arka = Char('arka', 'arka', x=.66, fy=.78, h=.42, idle=None, facing='left', top=True, poses=[(0, 'reach')], faces=[(0, 'angry'), (A('survive'), 'grin')], layer={'x': tow})
ep.scene('rescue', explain([you, arka], [st, vignette([(0, .85), (A('But'), .85), (A('dead', 8), .2)]), scene_counter(F, [{'frame': 0, 'value': 0}])],
                           [Note('not dead yet!', A('dead'), 'title'), Note('~90 seconds to get air', A('minute'), 'small')], None,
                           sounds=[('tick', A('Zero', -3), -18), ('pop', A('survive', 2), -21)]))

eng = Char('engineer', x=.52, fy=.82, h=.42, idle=None, helmet=[], poses=[(0, 'stand'), (A('lost'), 'panic'), (A('remembered'), 'scared'), (A('back'), 'stand'), (A('fine'), 'cheer')],
           faces=[(0, 'neutral'), (A('lost'), 'shocked'), (A('saliva'), 'tongue'), (A('boil', 6), 'asleep'), (A('back', 4), 'happy'), (A('fine'), 'grin')], enter=('pop', A('NASA', -1)))
ep.scene('history', flashback('1966', A('1966'), 'NASA vacuum test', A('NASA'), [eng],
                              [kit(F, 'chamber', 'chamber', .52, .55, .62, w=1.35, h=1.0, **pop_in(A('NASA', -2), (.52 * F['W'], .55 * F['H']))),
                               effect('spit', bubbles('spit', .53, .82 - .42 * .75, A('saliva', 2), 20))],
                              [Note('suit leak!', A('lost')), Note('he was fine', A('fine'), color=INK)],
                              sounds=[('bubble', A('saliva', 2), -22)]))

st = station(F, open_from=0)
arka = Char('arka', 'arka', slot='center', h=.5, poses=[(0, 'float'), (A('So'), 'reach'), (A('Helmet', 0, n=2), 'hands-on-hips')], faces=[(0, 'smug'), (A('Helmet', 0, n=2), 'grin')])
you = Char('you', slot='right', poses=[(0, 'float'), (A('Helmet', 0, n=2), 'cheer')], faces=[(0, 'neutral'), (A('So'), 'smug'), (A('Helmet', 0, n=2), 'grin')],
           helmet=[(0, False), (A('Helmet', 2, n=2), True)])
ep.scene('closing', explain([arka, you], [st, helmet_handover(F, arka, you, A('Helmet', 2, n=2))], [Note('helmet ON', A('on', 2, n=2), 'title')],
                            sounds=[('riser', A('So', 4), -28)]))

if __name__ == '__main__':
    path, board = ep.write(sys.argv[2] if len(sys.argv) > 2 else None)
    for p in ep.placements: print(' ', p['beat'], [n[0] for n in p['notes']])
    print('wrote', path.name, sum(s['durationFrames'] for s in board['scenes']), 'frames;', sum(len(p['notes']) for p in ep.placements), 'notes placed')
