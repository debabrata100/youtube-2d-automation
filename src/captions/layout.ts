/** Fit explicit lines using measured font advances; never silently create a third line. */
export const fitCaptionFontSize=(lines:string[],preferred:number,availableWidth:number,measure:(line:string)=>number,minimum:number)=>{
 const widest=Math.max(...lines.map(measure));const size=preferred*Math.min(1,availableWidth/Math.max(1,widest));
 if(size<minimum)throw Error('Caption would be too small for safe mobile layout; split the authored phrase into shorter lines.');
 return size;
};
