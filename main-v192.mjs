const sheet=document.querySelector('.v192-sheet-visual');
const frame=document.querySelector('.v175-scene iframe[data-v167-src$="/hogan-portfolio/v175-scenes/db.html"]');
const reduce=matchMedia('(prefers-reduced-motion:reduce)');
if(sheet&&frame){
 let timer=0,observer;
 const reduced=()=>matchMedia('(max-width:1099px), (pointer:coarse)').matches||reduce.matches||new URLSearchParams(location.search).has('reducedmotion');
 function reveal(reason){clearTimeout(timer);timer=0;sheet.classList.add('is-revealed');sheet.inert=false;sheet.removeAttribute('aria-hidden');sheet.dataset.revealReason=reason}
 function reset(){clearTimeout(timer);if(reduced()||!document.documentElement.classList.contains('v192-sheet-gated')){reveal('static');return}sheet.classList.remove('is-revealed');sheet.inert=true;sheet.setAttribute('aria-hidden','true');sheet.dataset.revealReason='waiting';timer=setTimeout(()=>reveal('timeout-fallback'),20000)}
 if(reduced()||!document.documentElement.classList.contains('v192-sheet-gated'))reveal('static');else{sheet.inert=true;sheet.setAttribute('aria-hidden','true');sheet.dataset.revealReason='waiting';observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();reset()}},{threshold:0});observer.observe(frame)}
 addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==frame.contentWindow)return;if(event.data?.type==='v175-start')reset();if(event.data?.type==='v175-done'&&event.data.kind==='db')reveal('chat-complete')});
 frame.addEventListener('load',()=>{try{if(frame.contentDocument?.documentElement.dataset.v192Playback==='done')reveal('chat-already-complete')}catch{reveal('frame-unavailable')}});
 matchMedia('(max-width:1099px), (pointer:coarse)').addEventListener('change',e=>{if(e.matches)reveal('compact-layout')});
 frame.addEventListener('error',()=>reveal('frame-error'));
 addEventListener('v192-sheet-fallback',()=>reveal('script-fallback'));
 reduce.addEventListener('change',()=>{if(reduced())reveal('reduced-motion')});
}
