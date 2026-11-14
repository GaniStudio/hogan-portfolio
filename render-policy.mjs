// Shared guard for all three WebGL/CSS3D scenes. No idle render loop.
export function canRender(section,doc=document,view=window){
 if(doc.hidden||doc.querySelector('dialog[open]'))return false;
 const top=section.offsetTop;let bottom=top+section.offsetHeight;
 const next=section.id==='words'?doc.getElementById?.('student-db'):section.dataset?.next?doc.querySelector(section.dataset.next):null;
 if(next&&next.offsetTop>top)bottom=Math.min(bottom,next.offsetTop);
 return view.scrollY+view.innerHeight>top&&view.scrollY<bottom;
}
if(typeof document!=='undefined'){
 const notify=()=>document.dispatchEvent(new Event('hogan:motion'));
 document.addEventListener('visibilitychange',notify);
 new MutationObserver(records=>{if(records.some(r=>r.attributeName==='open'))notify()}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
}

let entryVersion=0;
export function enterSection(selector){
 const section=document.querySelector(selector);if(!section)return;
 if(location.hash!==selector){
  const active=document.activeElement;
  const focus=active?.matches?.('#student-db .service-next')?'#student-db .service-next':null;
  history.replaceState({...history.state,hoganReturnY:window.scrollY,hoganReturnFocus:focus},'',location.href);
  history.pushState(null,'',selector);
 }
 const version=++entryVersion;section.scrollIntoView({block:'start',behavior:'instant'});section.dataset.front='true';
 requestAnimationFrame(()=>{
  if(version!==entryVersion||!canRender(section))return;
  let target=[...section.querySelectorAll('[data-service-practice]')].find(b=>b.getClientRects().length&&getComputedStyle(b).visibility==='visible');
  if(!target){target=section.querySelector('h2');if(target)target.tabIndex=-1;}
  target?.focus({preventScroll:true});
 });
}


// Restore an explicit story jump to its previous reading position on Back.
if(typeof window!=='undefined')window.addEventListener('popstate',event=>{
 if(window.__v192CaseRestoring||event.state?.v159?.focus)return;if(window.__v192CaseRestoring||event.state?.v159?.focus)return;if(window.__v192CaseRestoring||event.state?.v159?.focus)return;const y=event.state?.hoganReturnY;
 if(!Number.isFinite(y)||document.querySelector('dialog[open]'))return;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(window.__v192CaseRestoring)return;if(window.__v192CaseRestoring)return;if(window.__v192CaseRestoring)return;window.scrollTo({top:y,behavior:'instant'});
  const selector=event.state?.hoganReturnFocus;
  if(selector)document.querySelector(selector)?.focus({preventScroll:true});
 }));
});
