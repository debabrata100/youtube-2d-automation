#!/usr/bin/env bash
# Render a review sample: the first N seconds of a prepared job (render-cached-story --prepare-only), with the full sound mix
# (narration, music, sound effects), into <job>/output/sample-<N>s.mp4. Segments are shared with scripts/render-job.sh, so the
# full render later reuses everything rendered here. No network, no paid requests.
# Usage: scripts/render-sample.sh <prepared-job> <seconds> [workers=4] [scale=1]
set -euo pipefail
JOB=${1:?usage: scripts/render-sample.sh <prepared-job> <seconds> [workers] [scale]}; SECS=${2:?seconds}; WORKERS=${3:-4}; SCALE=${4:-1}
TOTAL=$(node -e "const b=require('./$JOB/storyboard.json');console.log(b.scenes.reduce((s,x)=>s+x.durationFrames,0))")
END=$(( (SECS * 30 + 119) / 120 * 120 - 1 )); [ $END -ge $TOTAL ] && END=$((TOTAL - 1))
echo "rendering frames 0-$END of $JOB with $WORKERS workers (scale $SCALE)"
seq 0 120 $END | xargs -P "$WORKERS" -I{} sh -c 'a={}; b=$((a + 119)); [ $b -gt '"$END"' ] && b='"$END"'; npx tsx scripts/render-job-frames.ts '"$JOB"' $a $b '"$SCALE"' >/dev/null && printf .'
echo
npx tsx scripts/render-sample-mux.ts "$JOB" "$END"
