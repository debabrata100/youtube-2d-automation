/** Pure frame-based motion, independent of render order, time, or random state. */
export const starMotionAt=(frame:number)=>({
  scale:1+.008*Math.sin(frame*Math.PI*2/210),
  glowOpacity:.13+.015*Math.sin(frame*Math.PI*2/173),
  glowBlur:24+2*Math.sin(frame*Math.PI*2/197),
  coronaOpacity:.055+.012*Math.sin(frame*Math.PI*2/151),
  coronaX:.65*Math.sin(frame*Math.PI*2/193),
  coronaY:.5*Math.sin(frame*Math.PI*2/227),
  coronaScale:1.012+.004*Math.sin(frame*Math.PI*2/181),
});
