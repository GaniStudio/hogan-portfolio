import {minJerk} from './agent-intro-path.mjs';
export const ARRIVAL_LEAD_MS=24;
export function glyphPoint(rect,hotspot){return {x:rect.left-hotspot.x,y:rect.top-hotspot.y};}
export function taskTiming(index,count,isPreview=false){
 const box= isPreview ? 1710+index*85 : 260+index*80;
 const typeStart=box+380;
 const step=count>1?Math.min(52,520/(count-1)):0;
 return {approach:Math.max(0,box-270),box,typeStart,step,done:typeStart+Math.max(0,count-1)*step+ARRIVAL_LEAD_MS+110};
}
export function safeOrbit(bounds,viewport,radius=18){
 // Place the entire orbit below the copy, not in its narrow column gap.
 const bottom=Math.max(...bounds.map(r=>r.bottom),160);
 return {x:viewport.width/2,y:Math.min(viewport.height-140,bottom+65),radius};
}
export function interpolate(a,b,u){const s=minJerk(u);return {x:a.x+(b.x-a.x)*s,y:a.y+(b.y-a.y)*s};}
