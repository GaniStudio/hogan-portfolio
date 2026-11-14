import {returnKey} from './experience-state-v184.mjs';
const link=document.querySelector('[data-v184-open-db]'),card=document.querySelector('.v184-db-launch');
link?.addEventListener('click',()=>{try{sessionStorage.setItem(returnKey,JSON.stringify({href:location.href,top:card.getBoundingClientRect().top,y:scrollY}))}catch{}});
function restore(){
 let saved;try{saved=JSON.parse(sessionStorage.getItem(returnKey));if(saved?.href!==location.href)return;sessionStorage.removeItem(returnKey)}catch{return}
 if(!card)return;
 let stopped=false;const end=()=>{stopped=true;resize.disconnect();removeEventListener('wheel',end);removeEventListener('touchstart',end);removeEventListener('keydown',end);};
 const align=()=>{if(!stopped){scrollTo({top:scrollY+card.getBoundingClientRect().top-saved.top,behavior:'instant'});link?.focus({preventScroll:true})}};
 const resize=new ResizeObserver(align);resize.observe(document.body);addEventListener('wheel',end,{passive:true});addEventListener('touchstart',end,{passive:true});addEventListener('keydown',end);requestAnimationFrame(align);setTimeout(end,2000);
}
restore();addEventListener('pageshow',restore);
