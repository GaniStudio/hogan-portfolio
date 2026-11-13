const gallery=document.querySelector('[data-scroll-words]');
const track=gallery.querySelector('.words-scroll-track');
const stage=track.querySelector('.words-scroll-stage');
const nav=stage.querySelector('.words-feature-steps');
const status=stage.querySelector('.words-scroll-status');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const pinned=matchMedia('(min-height:480px)');
const distances={landing:0,test:500,result:1100,next:3600};
const tourLength=4100;
const pinTop=()=>innerWidth<700?64:innerWidth<1100?72:84;
let frame, manual=false, last='', raf=0;
const bound=new WeakSet();
let start=0, end=null, timer;

function sync(){
 raf=0;
 if(manual||motion.matches||gallery.hidden||frame?.dataset.ready!=='true')return;
 const {position, range}=geometry();
 const distance=Math.max(0,Math.min(tourLength,position/range*tourLength));
 const screen=distance>=distances.next?'next':distance>=distances.result?'result':distance>=distances.test?'test':'landing';
 for(const button of nav.querySelectorAll('[data-word-stage]')){
  button.disabled=false;
  if(button.dataset.wordStage===screen)button.setAttribute('aria-current','step');
  else button.removeAttribute('aria-current');
 }
 clearTimeout(timer);
 stage.style.setProperty('--stage-progress',(distance/tourLength).toFixed(3));
 const now=performance.now();
 if(screen==='landing'){start=0;end=null;}
 else { start ||= now; if(screen!=='test')end??=now; }
 const matched=screen==='landing'?0:screen==='test'?Math.floor((distance-distances.test)/100):6;
 const beat=screen==='test'?Math.min(2,Math.floor(((distance-distances.test)%100)/33)):0;
 if(start&&end===null&&now-start<60000)timer=setTimeout(schedule,1000-(now-start)%1000);
 const time=start?Math.max(0,60-Math.floor(((end??now)-start)/1000)):60;
 const fraction=screen==='result'?Math.max(0,Math.min(1,(distance-distances.result)/((distances.next-distances.result)*.90))):screen==='next'?1:0;
 const rect=stage.getBoundingClientRect(),tail=track.getBoundingClientRect().bottom-pinTop();
 const visibility=Math.min(Math.max(0,Math.min(1,(innerHeight-rect.top)/180)),Math.max(0,Math.min(1,tail/180)));
 stage.style.setProperty('--v143-stage-visibility',String(.35+.65*visibility));
 stage.style.setProperty('--v143-stage-blur',((1-visibility)*2).toFixed(2)+'px');
 const key=[screen,matched,beat,time,Math.round(fraction*1000)].join(':');
 if(key!==last){last=key;frame.contentWindow.postMessage({type:'words:snapshot',stage:screen,count:matched,time,beat,fraction},location.origin);}
}
function geometry(){
 if(pinned.matches)track.style.setProperty('--v136-words-stage-height',stage.offsetHeight+'px');
 const rect=track.getBoundingClientRect();
 return {position:(pinned.matches?pinTop():innerHeight*.75)-rect.top,range:Math.max(1,pinned.matches?track.offsetHeight-stage.offsetHeight:rect.height+innerHeight*.35)};
}
function schedule(){if(!raf)raf=requestAnimationFrame(sync);}
function handoff(){
 if(manual)return;
 manual=true;
 stage.dataset.tourMode="manual";
 if(frame)frame.tabIndex=0;
 last='';
 frame?.contentDocument?.documentElement?.removeAttribute('data-auto-tour');
 frame?.contentWindow.postMessage({type:'words:handoff'},location.origin);
 clearTimeout(timer);
 if(status)status.textContent='';
}
function bind(){
 frame=stage.querySelector('iframe.inline-service');
 if(frame&&!manual)frame.tabIndex=-1;
 const doc=frame?.contentDocument;
 if(frame?.dataset.ready==='true')for(const button of nav.querySelectorAll('[data-word-stage]'))button.disabled=false;
 if(!doc||doc.URL==='about:blank'||bound.has(doc))return;
 bound.add(doc);
 doc.addEventListener('keydown',scrollParentFromFrame);
 if(!manual&&!motion.matches){doc.documentElement.setAttribute('data-auto-tour','');frame.tabIndex=-1;}

}
function scrollParentFromFrame(event){
 if(manual||event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey) return;
 const key=event.key;
 const line=key==='ArrowDown'?40:key==='ArrowUp'?-40:0;
 const page=key==='PageDown'||(key===' '&&!event.shiftKey)?1:key==='PageUp'||(key===' '&&event.shiftKey)?-1:0;
 if(!line&&!page)return;
 event.preventDefault();
 window.scrollBy({top:line||page*Math.round(innerHeight*.9),behavior:'instant'});
}
new MutationObserver(bind).observe(stage,{childList:true,subtree:true});
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==frame?.contentWindow)return;
 if(event.data?.type==='words:ready'){bind();schedule();}
});
for(const type of ['scroll','resize','pageshow'])window.addEventListener(type,schedule,{passive:true});
motion.addEventListener('change',()=>{
 if(motion.matches)frame?.contentDocument?.documentElement?.removeAttribute('data-auto-tour');
 else if(!manual){frame?.contentDocument?.documentElement?.setAttribute('data-auto-tour','');schedule();}
});
gallery.querySelector('#static-practice')?.addEventListener('click',handoff);
gallery.querySelector('[data-v133-practice]')?.addEventListener('click',handoff);
nav.addEventListener('click',event=>{
 const button=event.target.closest('[data-word-stage]');
 if(!button||frame?.dataset.ready!=='true')return;
 const screen=button.dataset.wordStage;
 if(manual||motion.matches){
  frame.contentWindow.postMessage({type:'words:stage',stage:screen==='next'?'result':screen},location.origin);
  for(const item of nav.querySelectorAll('[data-word-stage]')){if(item===button)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');}
  if(motion.matches){const shell=frame.closest?.(".demo-window");if(shell){const inset=(document.querySelector(".site-header")?.getBoundingClientRect().bottom||72)+12;window.scrollTo({top:scrollY+shell.getBoundingClientRect().top-inset,behavior:"instant"});}}
  return;
 }
 const {position,range}=geometry();
 window.scrollTo({top:scrollY-position+range*(distances[screen]+1)/tourLength,behavior:'smooth'});
});
// v148: do not rewind already-painted text or navigation.
if(motion.matches){if(status)status.textContent='';}
bind();
schedule();
