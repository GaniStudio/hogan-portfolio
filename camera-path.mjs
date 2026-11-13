// Pixel-aligned HTML/WebGL composition. The long middle interval stays frontal
// so the actual service UI can be read while its scroll demonstration changes.
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
export function cameraPose(progress,width,height,leave=true,panelWidth=1040){
 const p=clamp(progress),enter=1-ease(p/.23),exit=ease((p-.88)/.12);
 // The last service recedes only after its final submission scene has been
 // readable; the following section contains the detailed case narrative.
 const closing=leave?0:ease((p-.90)/.10);
 const displayHeight=Math.min(height*(panelWidth===920?.8:.76),width*.64*720/panelWidth);
 const scale=displayHeight/720;
 const distance=height/(2*Math.tan(38*Math.PI/360))/scale;
 return {scale,distance,enter,exit,
  camera:[-300*enter+820*exit,130*enter+60*exit,distance*(1+.23*enter+.20*exit)],
  look:[720*exit,0,-150*exit],
  object:[(width*.655-width/2)/scale+640*exit+(leave?2200*ease((p-.88)/.05):350*closing),-18*enter+30*exit+100*closing,-100*enter-260*exit-220*closing],
  rotation:[.018*enter-.035*exit,.30*enter-.36*exit-.12*closing,-.020*enter+.025*exit]};
}
// Translate camera, look target, and readable UI together: the service stays
// frontal while fixed background geometry gains a restrained parallax shift.
export function dbReadingParallax(pose, progress){
 const phase=clamp((progress-.23)/.57);
 const shift=110*Math.sin(Math.PI*phase);
 return {...pose,camera:[pose.camera[0]+shift,...pose.camera.slice(1)],
  look:[pose.look[0]+shift,...pose.look.slice(1)],
  object:[pose.object[0]+shift,...pose.object.slice(1)]};
}
// Give the DB screen a gentle retreat after its last readable stage.
export function dbDeparturePose(pose,progress){
 const departure=ease((progress-.90)/.10);
 // Pull the app back along the camera axis while easing it slightly toward
 // the copy column. This keeps the full screen in view until the next story
 // owns the viewport instead of letting the right edge drift off-canvas.
 return {...pose,object:[pose.object[0]+100*departure,pose.object[1]+22*departure,pose.object[2]-300*departure],rotation:[pose.rotation[0]-.01*departure,pose.rotation[1]-.075*departure,pose.rotation[2]+.008*departure]};
}
// Follow elapsed time even after a delayed frame. A long interruption should
// catch up to the current scroll position, not replay an old camera movement.
export function dampProgress(current,target,elapsedMs){
 // A blocked, already scheduled frame catches up rather than replaying stale travel.
 if(elapsedMs>=250)return target;
 if(Math.abs(target-current)<.00015)return target;
 // Reading stays responsive; only arrival/departure carries more weight.
 const timeConstant=target<.23||target>.88?180:72;
 const next=current+(target-current)*(1-Math.exp(-Math.max(0,elapsedMs)/timeConstant));
 // Match the render-loop stop tolerance so stage boundaries settle exactly.
 return Math.abs(target-next)<=.0002?target:next;
}

// Shift the fixed-width DB demonstration inside its cropped viewport.
export function dbCropOffset(progress){return -60*ease((progress-.32)/.12)-60*ease((progress-.52)/.12);}


