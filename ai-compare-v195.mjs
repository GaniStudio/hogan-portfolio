import {timeline} from './ai-compare-v195-content.mjs';
import {initialState,applyOps,finalState,render} from './ai-compare-v195-render.mjs';
for(const root of document.querySelectorAll('.v195-compare')){
 const scene=root.querySelector('.v195-scene'),button=root.querySelector('.v195-replay');
 const media=matchMedia('(prefers-reduced-motion: reduce)'),reduced=()=>media.matches||new URLSearchParams(location.search).has('reducedmotion');
 let timers=[],started=false,observer;
 const stop=()=>{timers.forEach(clearTimeout);timers=[]};
 const finish=()=>{stop();scene.innerHTML=render(finalState());scene.dataset.state='complete'};
 const play=()=>{started=true;observer?.disconnect();stop();if(reduced()){finish();return}const state=initialState();scene.innerHTML=render(state);scene.dataset.state='playing';
  timers=timeline.map(([ms,ops],i)=>setTimeout(()=>{applyOps(state,ops);scene.innerHTML=render(state);if(i===timeline.length-1){scene.dataset.state='complete';timers=[]}},ms));
 };
 button.hidden=false;button.addEventListener('click',play);
 media.addEventListener('change',()=>{if(reduced()){started=true;observer?.disconnect();finish()}});
 if(!reduced()&&'IntersectionObserver'in window){observer=new IntersectionObserver(entries=>{if(!started&&entries.some(e=>e.isIntersecting))play()},{rootMargin:'-35% 0px -35% 0px',threshold:0});observer.observe(root.querySelector('.v195-wrap'));}
 addEventListener('pagehide',stop);
 addEventListener('pageshow',e=>{if(e.persisted&&scene.dataset.state==='playing')finish()});
}
