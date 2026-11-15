"""Optional offline ASR inspection; not a paid transcription service or exact alignment."""
import json, sys, subprocess
import numpy as np
from pathlib import Path
from pywhispercpp.model import Model
job=Path(sys.argv[1]); model=Model('base.en',models_dir=str(Path('.cache/asr-models').resolve()),print_realtime=False,print_progress=False,print_timestamps=False,language='en',n_threads=4,context_params={'use_gpu':False},redirect_whispercpp_logs_to=str(job/'reports/local-asr.log'))
results=[]
subdir=sys.argv[2] if len(sys.argv)>2 else ''
for beat in json.loads((job/'story/selected-script.json').read_text())['beats']:
 name=beat['id']
 data=subprocess.check_output(['ffmpeg','-v','error','-i',str(job/'audio'/subdir/f'{name}.wav'),'-ar','16000','-ac','1','-f','f32le','pipe:1'])
 segments=model.transcribe(np.frombuffer(data,dtype=np.float32),token_timestamps=True,max_len=1,split_on_word=True,temperature=0,temperature_inc=0)
 results.append(dict(beatId=name,segments=[dict(startSeconds=s.t0/100,endSeconds=s.t1/100,text=s.text) for s in segments]))
 print(name, ' '.join(s.text.strip() for s in segments),flush=True)
(job/'reports'/('local-asr-edited.json' if subdir else 'local-asr-inspection.json')).write_text(json.dumps(dict(tool='pywhispercpp 1.5.1 / base.en',timing='local ASR estimates, not exact word timestamps or human listening',beats=results),indent=2))
