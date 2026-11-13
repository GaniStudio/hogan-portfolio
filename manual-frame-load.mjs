// HTML existing is not proof that the app script ran. Only the app's ready
// handshake cancels this deadline; stale/closed frames may not affect a new one.
export function watchManualFrameLoad({frame,isCurrent,hasRoot,onFailure,timeoutMs=10000,timers=globalThis}){
 if(!frame||typeof isCurrent!=='function'||typeof hasRoot!=='function'||typeof onFailure!=='function'||!Number.isFinite(timeoutMs)||timeoutMs<=0)throw new TypeError('Invalid manual frame load contract');
 let state='pending',timer;
 const current=()=>frame.isConnected&&isCurrent();
 const clean=()=>{timers.clearTimeout(timer);frame.removeEventListener('load',loaded)};
 const fail=()=>{
  if(state!=='pending')return;
  if(!current()){state='disposed';clean();return;}
  state='failed';clean();
  const wasFocused=frame.ownerDocument?.activeElement===frame;
  frame.remove();
  onFailure({frame,wasFocused});
 };
 const loaded=()=>{
  if(state!=='pending'||!current())return;
  let found=false;try{found=hasRoot(frame)}catch{}
  if(!found)fail();
 };
 frame.addEventListener('load',loaded);
 timer=timers.setTimeout(fail,timeoutMs);
 return {
  ready(){if(!current()||state==='failed'||state==='disposed')return false;if(state==='pending'){state='ready';clean()}return true},
  dispose(){if(state==='disposed')return;state='disposed';clean()},
  get state(){return state}
 };
}
