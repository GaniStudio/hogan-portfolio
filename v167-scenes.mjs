import {watchScene} from './scroll-motion-v198.mjs';
const frames=[...document.querySelectorAll('.v167-scene iframe')];
const rearm=new Map();
for(const frame of frames){
 const finish=()=>{seen.add(frame);frame.dataset.finishOnLoad='true';if(!frame.hasAttribute('src'))frame.src=frame.dataset.v167Src+'?v198';else frame.contentWindow?.postMessage('v198-finish',location.origin)};
 rearm.set(frame,watchScene(frame,finish));
 frame.addEventListener('load',()=>{if(frame.dataset.finishOnLoad)frame.contentWindow?.postMessage('v198-finish',location.origin)});
}
addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='v198-replay')return;const f=frames.find(f=>f.contentWindow===e.source);if(f){delete f.dataset.finishOnLoad;rearm.get(f)?.()}});
document.addEventListener('click',e=>{const b=e.target.closest?.('.v179-mobile-replay');if(b){const f=b.previousElementSibling;delete f.dataset.finishOnLoad;rearm.get(f)?.()}});
const seen=new WeakSet();const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const start=frame=>{if(seen.has(frame))return;if(!frame.getAttribute('src')){frame.src=frame.dataset.v167Src+'?v184';return}try{const past=frame.contentDocument?.getElementById('past');if(!past)return;const f=frame.getBoundingClientRect(),p=past.getBoundingClientRect(),middle=f.top+p.top+Math.min(p.height,innerHeight)*.5;if(!reduce.matches&&(middle>innerHeight*.75||middle<innerHeight*.1))return}catch{return}seen.add(frame);frame.contentWindow?.postMessage('v167-play',location.origin)};
const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)start(e.target)},{rootMargin:'-20% 0px -20% 0px',threshold:0});frames.forEach(f=>{io.observe(f);f.addEventListener('load',()=>{const r=f.getBoundingClientRect();if(r.top<innerHeight*.8&&r.bottom>innerHeight*.2)start(f)})});
addEventListener('message',e=>{if(e.origin!==location.origin||!['v167-ready','v167-height'].includes(e.data?.type))return;const f=frames.find(x=>x.contentWindow===e.source);if(f&&Number.isFinite(e.data.height)&&e.data.height>0)f.style.height=Math.ceil(e.data.height)+'px';if(f&&e.data.type==='v167-ready'&&reduce.matches)start(f)});
let tick=0;function checkCurrent(){tick=0;for(const f of frames){if(!f.getAttribute('src'))continue;start(f);if(!seen.has(f)||!matchMedia('(max-width:700px)').matches)continue;try{const now=f.contentDocument?.getElementById('now');if(!now)continue;const a=f.getBoundingClientRect(),b=now.getBoundingClientRect(),top=a.top+b.top;if(top<innerHeight*.8&&top+b.height>innerHeight*.2)f.contentWindow.postMessage('v168-current',location.origin)}catch{}}}function schedule(){if(!tick)tick=requestAnimationFrame(checkCurrent)}addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});addEventListener('message',schedule);frames.forEach(f=>f.addEventListener('load',schedule));

import("/hogan-portfolio/v171-scenes.mjs");











import("/hogan-portfolio/v174.mjs?v184");









addEventListener('message',e=>{if(e.origin!==location.origin||!['v175-start','v175-done'].includes(e.data?.type))return;const f=[...document.querySelectorAll('.v175-scene iframe')].find(x=>x.contentWindow===e.source);if(!f)return;let n=f.closest('.v175-scene')?.nextElementSibling;if(n?.classList.contains('v171-sheet'))n=n.nextElementSibling;if(n?.classList.contains('v171-now'))n.style.opacity=e.data.type==='v175-start'?'.28':'1'});
