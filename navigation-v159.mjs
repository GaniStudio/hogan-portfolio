const pages={about:document.getElementById('about-page'),db:document.getElementById('db-case'),words:document.getElementById('words-case'),lms:document.getElementById('lms-case')};
const routes={about:'/hogan-portfolio/about/',db:'/hogan-portfolio/projects/student-db/',words:'/hogan-portfolio/projects/words/',lms:'/hogan-portfolio/projects/lms/'};
const baseTitle=document.title;
const reducedQuery=new URLSearchParams(location.search).has('reducedmotion');
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||reducedQuery;
const key=()=>location.pathname.startsWith('/hogan-portfolio/about')?'about':location.pathname.startsWith('/hogan-portfolio/projects/words')?'words':location.pathname.startsWith('/hogan-portfolio/projects/lms')?'lms':location.pathname.startsWith('/hogan-portfolio/projects/student-db')||location.hash==='#case/student-db'?'db':null;
let current=null,serial=0,animations=[],clone=null,savedFocus=null,transitionDestination=null;
history.scrollRestoration='manual';
function cancel(){if(transitionDestination){transitionDestination.style.removeProperty('visibility');transitionDestination=null;}animations.forEach(a=>a.cancel());animations=[];clone?.remove();clone=null;document.body.classList.remove('route-transition');for(const p of Object.values(pages))p.style.removeProperty('opacity');}
function show(next){
 delete document.documentElement.dataset.v159Route;
 window.__hoganEndIntro?.('detail-navigation');
 for(const [id,p] of Object.entries(pages))p.hidden=id!==next;
 document.body.classList.toggle('detail-open',!!next);document.body.classList.toggle('case-open',!!next);
 current=next;document.title=next==='about'?'허간 소개 · Ho Gan':next==='db'?'통합 DB · Ho Gan':next==='words'?'단어력 테스트 · Ho Gan':next==='lms'?'100일 챌린지 LMS · Ho Gan':baseTitle;
 document.querySelector('.site-header nav')?.setAttribute('aria-hidden',String(!!next));
}
const frame=()=>new Promise(r=>requestAnimationFrame(r));
async function navigate(next,origin,restore){
 const token=++serial;cancel();
 const image=origin?.querySelector('img');const from=image?.getBoundingClientRect();
 show(next);scrollTo(0,0);await frame();if(token!==serial)return;
 const destination=next&&next!=='about'?pages[next].querySelector('.case-screen img'):null;
 const duration=reduced()?0:matchMedia('(max-width:600px)').matches?220:560;
 const target=next?pages[next]:document.querySelector('main');
 if(duration&&image?.src===destination?.src&&!matchMedia('(max-width:600px)').matches&&from&&from.width&&destination){
  const to=destination.getBoundingClientRect();clone=image.cloneNode();clone.removeAttribute('id');clone.alt='';clone.setAttribute('aria-hidden','true');clone.className='transition-image-v159';
  Object.assign(clone.style,{left:`${to.left}px`,top:`${to.top}px`,width:`${to.width}px`,height:`${to.height}px`});document.body.append(clone);transitionDestination=destination;destination.style.visibility='hidden';
  animations.push(clone.animate([{transform:`translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width},${from.height/to.height})`},{transform:'none'}],{duration,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}));
 }
 if(duration&&target){document.body.classList.add('route-transition');animations.push(target.animate([{opacity:0},{opacity:1}],{duration:clone?560:220,easing:'ease-out'}));await Promise.all(animations.map(a=>a.finished.catch(()=>{})));}
 if(token!==serial)return;cancel();
 if(next){pages[next].querySelector('h1')?.focus({preventScroll:true});}
 else{
  const y=restore?.y??0;const id=restore?.focus;
  scrollTo(0,y);(id?document.getElementById(id):savedFocus)?.focus({preventScroll:true});
  // Deferred service loading can change main height after direct entry.
  if(restore?.anchor){const anchor=document.querySelector(restore.anchor);const header=document.querySelector('.site-header')?.getBoundingClientRect().height||72;if(anchor)scrollTo(0,Math.max(0,anchor.getBoundingClientRect().top+scrollY-header-24));document.querySelector(restore.focusSelector||'#services-overview a')?.focus({preventScroll:true});}
 }
}
function remember(origin){if(current)return; if(origin&&!origin.id)origin.id='v159-origin-'+Math.random().toString(36).slice(2,9);savedFocus=origin;history.replaceState({...history.state,v159:{y:scrollY,focus:origin?.id}},'',location.href);}
function open(next,origin){remember(origin);history.pushState({v159Detail:true},'',routes[next]);navigate(next,origin);}
document.addEventListener('click',e=>{
 const a=e.target.closest('a');if(!a||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 if(a.dataset.pageLink){e.preventDefault();open(a.dataset.pageLink,a);return;}
 if(a.hasAttribute('data-page-return')||(current&&a.closest('.site-header'))){e.preventDefault();if(history.state?.v159Detail){history.back();}else{const was=current;history.replaceState({},'','/hogan-portfolio/');navigate(null,null,{anchor:was!=='about'?'#services-overview':'#intro',focusSelector:was!=='about'?'#services-overview a[data-page-link="'+was+'"]':'#intro a[data-page-link="about"]'});}return;}
});
addEventListener('popstate',()=>{const next=key();if(next===current)return; // Native section hashes keep their own scroll position.
 navigate(next,null,history.state?.v159);});
// Native path entries show content immediately, without replaying the intro.
if(key()){show(key());scrollTo(0,0);}
