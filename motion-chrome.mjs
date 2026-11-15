import {updateEditorial} from './continuous-editorial.mjs';
import {visibleSectionHash} from './section-hash.mjs';
const links=[...document.querySelectorAll('.site-header nav a[href^="#"]')];let pending=false;updateEditorial();
// The static layout shifts while the browser restores an explicit anchor.
let restoringReading=location.hash==='#reading';
const initialAnchor=location.hash;
let restoringAnchor=!!initialAnchor&&initialAnchor!=='#intro'&&!!document.getElementById(initialAnchor.slice(1));
const sectionFor=id=>id==="words"&&document.getElementById("words").hidden?document.getElementById("static-gallery"):document.getElementById(id);
function update(){ if(location.hash.startsWith("#case/")||document.body.classList?.contains("galaxy-moving")||document.body.classList?.contains("case-open")){pending=false;return;} if(location.hash.startsWith("#case/")||document.body.classList?.contains("galaxy-moving")||document.body.classList?.contains("case-open")){pending=false;return;}
 updateEditorial();
 pending=false;
 const entries=links.map(link=>({link,section:link.hash==='#words'&&document.querySelector('#words').hidden?document.querySelector('#static-gallery'):document.querySelector(link.hash)})).filter(x=>x.section?.getClientRects().length);
 entries.sort((a,b)=>a.section.getBoundingClientRect().top-b.section.getBoundingClientRect().top);
 let current=entries.filter(x=>x.section.getBoundingClientRect().top<=(document.body.dataset.mode==='3d-dom'&&['#words','#student-db','#lms'].includes(x.link.hash) ? .5 : innerHeight*.38)).at(-1)||entries[0];
 if(document.body.dataset.mode==='3d-dom'){if(current?.link.hash==='#words'&&document.body.dataset.handoff==='true')current=entries.find(x=>x.link.hash==='#student-db')||current;else if(current?.link.hash==='#student-db'&&current.section.dataset.handoff==='true')current=entries.find(x=>x.link.hash==='#lms')||current;}
 const storyRect=document.querySelector('#db-story')?.getBoundingClientRect();
 const storyVisible=storyRect&&storyRect.top<=innerHeight*.38&&storyRect.bottom>innerHeight*.38;
 const decisionRect=document.querySelector('#db-decision')?.getBoundingClientRect();
 const decisionVisible=decisionRect&&decisionRect.top<=innerHeight*.38&&decisionRect.bottom>innerHeight*.38;
 const lmsStoryRect=document.querySelector('#lms-story')?.getBoundingClientRect();
 const lmsStoryVisible=lmsStoryRect&&lmsStoryRect.top<=innerHeight*.38&&lmsStoryRect.bottom>innerHeight*.38;
 if(storyVisible||decisionVisible)current=entries.find(x=>x.link.hash==='#student-db')||current;
 else if(lmsStoryVisible)current=entries.find(x=>x.link.hash==='#lms')||current;
 else {const incoming=entries.find(x=>['#student-db','#lms'].includes(x.link.hash)&&x.section.getBoundingClientRect().top>0&&x.section.getBoundingClientRect().top<=innerHeight*.38);if(incoming)current=incoming;}
 const activeService=entries.find(({link})=>{
  const id={'#db-story':'student-db','#student-db':'student-db','#lms-story':'lms','#lms':'lms','#words':'static-gallery'}[link.hash];
  const track=id&&document.getElementById(id)?.querySelector('.service-scroll-track,.words-scroll-track');
  const stage=track?.firstElementChild;
  if(!stage||getComputedStyle(stage).position!=='sticky')return false;
  const rect=track.getBoundingClientRect(), top=parseFloat(getComputedStyle(stage).top);
  return rect.top<=top+1&&rect.bottom>=top+stage.offsetHeight-1;
 });
 if(activeService)current=activeService;
 // Unlinked appendix / evidence sections do not inherit a misleading menu item.
 const unlinkedMarker=Math.max(0,document.querySelector(".site-header")?.getBoundingClientRect().bottom||0)+24;
 if([...document.querySelectorAll("#implementation-exhibit,.release-log,.reader-quotes,#making,footer")].some(el=>{const r=el.getBoundingClientRect();return r.top<=unlinkedMarker&&r.bottom>unlinkedMarker;}))current=null;
 for(const link of links){if(link===current?.link)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')}
 // Reading has no separate header link; keep LMS highlighted while tracking
 // the actual case section so scrolling back resumes the ordinary hash spy.
 const reading=document.querySelector('#reading');
 const rect=reading?.getBoundingClientRect();
 const readingVisible=rect&&rect.top<=innerHeight*.38&&rect.bottom>innerHeight*.38;
 // The header links point to each story introduction. Track the service
 // scenes separately so direct links and refreshes keep their own anchor.
 const sceneAtMarker=id=>{const rect=document.querySelector(id)?.getBoundingClientRect();return rect&&rect.top<=innerHeight*.38&&rect.bottom>innerHeight*.38};
 const hash=visibleSectionHash(location.hash,activeService?.link.hash==='#db-story'?'#student-db':activeService?.link.hash==='#lms-story'?'#lms':readingVisible?'#reading':storyVisible?'#db-story':decisionVisible?'#db-decision':lmsStoryVisible?'#lms-story':sceneAtMarker('#student-db')?'#student-db':sceneAtMarker('#lms')?'#lms':current?.link.hash,!!document.querySelector('dialog[open]'));
 // v198: passive scrolling does not persist an accidental reload anchor.
}
function request(){if(!pending){pending=true;requestAnimationFrame(update)}}
window.addEventListener('scroll',request,{passive:true});window.addEventListener('resize',request);document.addEventListener('hogan:motion',request);document.addEventListener('hogan:section',request);update();
window.addEventListener('pageshow',()=>{
 if(restoringAnchor){
  const anchor=sectionFor(initialAnchor.slice(1));
  anchor?.scrollIntoView({block:'start',behavior:'instant'});
  restoringAnchor=false;
 }
 const reading=restoringReading&&location.hash==='#reading'&&document.querySelector('#reading');
 if(reading){const rect=reading.getBoundingClientRect();if(rect.bottom<=0||rect.top>=innerHeight)reading.scrollIntoView({block:'start',behavior:'instant'});}
 restoringReading=false;request();
},{once:true});

// Native anchors keep their history and scrolling behavior. Move focus only
// after an explicit link action, never simply because the visitor scrolls.
let focusVersion=0;
function focusSection(hash,preserve=false){
 let section;try{section=sectionFor(decodeURIComponent(hash.slice(1)))}catch{return}
 if(!section)return;
 const active=document.activeElement;
 if(preserve&&section.contains(active)&&active.getClientRects().length&&active.getBoundingClientRect().bottom>=0&&active.getBoundingClientRect().top<innerHeight)return;
 const candidates=[...section.querySelectorAll('#practice,[data-service-practice],h1,h2')];
 const target=candidates.find(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden'&&n.getBoundingClientRect().bottom>=0&&n.getBoundingClientRect().top<innerHeight);
 if(!target)return;
 if(!target.matches('button,a')){target.tabIndex=-1;target.dataset.anchorFocus='true'}
 target.focus({preventScroll:true});
}
document.addEventListener('click',event=>{
 const link=event.target.closest?.('a[href^="#"]');
 if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
 const version=++focusVersion,hash=link.hash;
 requestAnimationFrame(()=>{
  if(version!==focusVersion||document.querySelector('dialog[open]'))return;
  focusSection(hash);
 });
});
window.addEventListener('popstate',()=>{
 if(window.__v192CaseRestoring||history.state?.v159?.focus)return;if(window.__v192CaseRestoring||history.state?.v159?.focus)return;if(window.__v192CaseRestoring||history.state?.v159?.focus)return;const hash=location.hash;if(!['#intro','#motivation','#words','#db-story','#student-db','#db-decision','#lms-story','#lms','#reading','#ai-workflow','#vision'].includes(hash))return;
 const version=++focusVersion;
 requestAnimationFrame(()=>{if(!window.__v192CaseRestoring&&version===focusVersion&&location.hash===hash&&!document.querySelector('dialog[open]'))focusSection(hash,true)});
});






window.addEventListener('pointermove',request,{passive:true});
