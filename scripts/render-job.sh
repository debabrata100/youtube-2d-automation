#!/usr/bin/env bash
# Render a prepared job (render-cached-story --prepare-only) in parallel 120-frame segments, then assemble and verify.
# Resumable: finished segments are skipped, so re-running after an interruption continues where it stopped.
# Usage: scripts/render-job.sh <prepared-job> [workers=4] [scale=1]
set -euo pipefail
JOB=${1:?usage: scripts/render-job.sh <prepared-job> [workers] [scale]}; WORKERS=${2:-4}; SCALE=${3:-1}
TOTAL=$(node -e "const b=require('./$JOB/storyboard.json');console.log(b.scenes.reduce((s,x)=>s+x.durationFrames,0))")
echo "rendering $TOTAL frames of $JOB with $WORKERS workers (scale $SCALE)"
START=$(date +%s)
seq 0 120 $((TOTAL - 1)) | xargs -P "$WORKERS" -I{} sh -c 'a={}; b=$((a + 119)); [ $b -ge '"$TOTAL"' ] && b='"$((TOTAL - 1))"'; npx tsx scripts/render-job-frames.ts '"$JOB"' $a $b '"$SCALE"' >/dev/null && printf .'
echo; echo "frames done in $(( $(date +%s) - START )) s; assembling"
npx tsx scripts/assemble-job.ts "$JOB"
