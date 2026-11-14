const nav=document.querySelector('.v186-db-inline .v186-steps');
if(nav){
 const buttons=[...nav.querySelectorAll('button')],compact=matchMedia('(max-width:1099px)'),motion=matchMedia('(prefers-reduced-motion:reduce)'),testReduced=new URLSearchParams(location.search).has('reducedmotion');
 let seen=false,visible=false,timer;
 function finish(event){nav.dataset.cueStop=event?.type||'complete';seen=true;clearTimeout(timer);nav.dataset.touchCue='done';view.disconnect();ready.disconnect()}
 function start(){
  if(seen||!visible||!compact.matches||document.visibilityState!=='visible'||buttons.some(b=>b.disabled))return;
  seen=true;view.disconnect();ready.disconnect();
  nav.dataset.touchCue=motion.matches||testReduced?'static':'playing';
  if(nav.dataset.touchCue==='playing')timer=setTimeout(finish,2600);
 }
 const view=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.65);start()},{threshold:[0,.65]});
 const ready=new MutationObserver(start);for(const b of buttons)ready.observe(b,{attributes:true,attributeFilter:['disabled']});
 view.observe(nav);
 nav.addEventListener('animationstart',e=>{if(e.animationName==='v187-touch-outline')nav.dataset.cueAnimated='true'});
 nav.addEventListener('animationiteration',e=>{if(e.animationName==='v187-touch-outline')nav.dataset.cueIterations=String(Number(nav.dataset.cueIterations||0)+1)});
 for(const name of ['pointerdown','keydown','focusin'])nav.addEventListener(name,finish,{once:true});
 motion.addEventListener('change',()=>{if(motion.matches&&seen)finish()});
 compact.addEventListener('change',()=>{if(!compact.matches&&seen)finish();else start()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&seen)finish();else start()});
}
