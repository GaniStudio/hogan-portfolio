// A bounded response of the existing background light; the service camera and
// HTML UI never follow the pointer. No postprocessing or extra draw passes.
export function lightPose(x,y){
 x=Math.max(-1,Math.min(1,x));y=Math.max(-1,Math.min(1,y));
 return {position:[1600+x*850,1500+y*120,800],target:[500+x*900,-450+y*230,-1000+y*160],intensity:8500000*(1+.10*Math.abs(x))};
}
export function dampPointer(current,target,elapsedMs){
 const next=current+(target-current)*(1-Math.exp(-Math.max(0,elapsedMs)/150));
 return Math.abs(next-target)<.001?target:next;
}
