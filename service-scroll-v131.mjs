import {mobileTourPolicy} from './mobile-tour-policy.mjs';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const pin=matchMedia('(min-height:480px)');
const plan={
 'student-db':{stages:[0,.10,.25,.43,.57,.71,.87]},
 lms:{stages:[0,.11,.264,.758,.89,.956],screens:['login','home','lesson','assignment','success','home']}
};
const bindings=[];
let raf=0;
const limit=x=>Math.max(0,Math.min(1,x));
// Leave a quarter-stage reading hold: a normal 100px wheel must not jump over
// the last line in the shorter stages before selecting the next screen.
const completePhase=x=>limit(x/.75);
const maxScroll=doc=>{const root=doc?.scrollingElement||doc?.documentElement;return root&&doc.defaultView?Math.max(0,root.scrollHeight-doc.defaultView.innerHeight):0;};
const elementTop=(doc,element)=>element.getBoundingClientRect().top+doc.defaultView.scrollY;
for(const track of document.querySelectorAll('[data-scroll-service]')){
 const id=track.dataset.scrollService;
 const config=plan[id];
 const stage=track.querySelector('.service-scroll-stage');
 const buttons=[...track.querySelectorAll('[data-step]')];
 const frame=track.querySelector('iframe');
 const outer=()=>frame.contentDocument;
 const student=()=>outer()?.querySelector('#student-view')?.contentDocument;
 const docs=new WeakSet();
 let manual=false,last='',current=-1,activeFeedback;let touchHeight=innerHeight,touchWidth=innerWidth;
 const compactPolicy=()=>mobileTourPolicy(id,innerWidth,touchHeight,matchMedia('(pointer:coarse)').matches);
 const stagePlan=()=>compactPolicy()?.steps??config.stages;
 function handoff(){
  if(manual)return;
  manual=true;
  if(id==='student-db')outer()?.defaultView?.postMessage({type:'db:tour-role',role:'student'},location.origin);
  outer()?.documentElement?.removeAttribute('data-auto-tour');
  student()?.documentElement?.removeAttribute('data-auto-tour');
 }
 function bind(doc){
  if(!doc?.documentElement||doc.URL==='about:blank'||docs.has(doc))return;
  docs.add(doc);
  if(!manual&&!reduced.matches)doc.documentElement.setAttribute('data-auto-tour','');
 }
 function select(index){
  if(current===index)return;
  // Capture the departing real DOM before the tour changes its role/screen.
  track.dispatchEvent?.(new CustomEvent('v140:stagechange',{detail:{index,previous:current}}));
  current=index;
  if(id==='lms')track.closest('section').toggleAttribute?.('data-v136-home',config.screens[index]==='home');
  buttons.forEach((button,i)=>i===index?button.setAttribute('aria-current','step'):button.removeAttribute('aria-current'));
  const address=frame.closest('.demo-window')?.querySelector('.demo-window-address');
  if(id==='student-db'&&address)address.textContent=['student-db.demo','teacher.student-db.demo','student.student-db.demo','student.student-db.demo','student.student-db.demo','student.student-db.demo','ops.student-db.demo'][index];
 }
 function showDb(index,fraction){
  const host=outer();
  if(!host?.querySelector('.views'))return false;
  host.defaultView.postMessage({type:'db:tour-role',role:['portal','teacher','student','student','student','student','operator'][index],fraction},location.origin);
  if(index===0){const portal=host.getElementById('portal-view')?.contentDocument;if(portal?.documentElement&&portal.URL!=='about:blank')portal.defaultView.scrollTo(0,maxScroll(portal)*fraction);}
  if(index<2||index===6)return true;
  index-=2;
  const doc=student();
  const name=doc?.getElementById('studentName'),key=doc?.getElementById('loginKey');
  const form=doc?.getElementById('lookupForm'),dashboard=doc?.getElementById('studentDashboard');
  if(!name||!key||!form||!dashboard)return false;
  if(index===0){
   if(!dashboard.hidden)doc.getElementById('lookupAgainButton')?.click();
   name.value='체험학습자 25'.slice(0,Math.ceil(8*fraction));
   key.value='portfolio-demo-25'.slice(0,Math.ceil(17*fraction));
   name.style.setProperty('--typing-offset',name.value.length+'em');
   key.style.setProperty('--typing-offset',key.value.length+'ch');
   return true;
  }
  if(dashboard.hidden){
   name.value='체험학습자 25';key.value='portfolio-demo-25';
   form.querySelector('button[type=submit],button')?.click();
  }
  const feedback=doc.querySelector('[data-feedback-index="1"]');
  const opened=doc.documentElement.classList.contains('feedback-modal-open');
  if(index<3&&opened)doc.dispatchEvent(new doc.defaultView.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  if(index===3&&(!opened||activeFeedback!==feedback)){feedback?.click();activeFeedback=feedback;}
  if(index===3){const pane=doc.querySelector('[data-feedback-body]');if(pane)pane.scrollTop=(pane.scrollHeight-pane.clientHeight)*fraction;}
  const coaching=[...doc.querySelectorAll('h2')].find(el=>el.textContent==='발음코칭');
  const target=index===2?coaching:index===3?feedback:null;
  const start=target?Math.max(0,elementTop(doc,target)-80):0;
  const scroll=index===3?start:start+(maxScroll(doc)-start)*fraction;
  doc.defaultView.scrollTo(0,Math.min(maxScroll(doc),Math.max(0,scroll)));
  doc.documentElement.dataset.v143LastLine=String(Math.round(doc.defaultView.scrollY+doc.defaultView.innerHeight));
  doc.documentElement.dataset.v143ContentHeight=String((doc.scrollingElement||doc.documentElement).scrollHeight);
  return true;
 }
 function apply(index,fraction,navigateOnly=false){
  const ready=outer()?.documentElement?.dataset.demoMode;
  if(!ready)return false;
  if(id==='lms')frame.contentWindow.postMessage({type:'lms:snapshot',stage:config.screens[index],fraction,navigateOnly,complete:index===5},location.origin);
  else if(!showDb(index,fraction))return false;
  select(index);
  return true;
 }
 function geometry(){
  if(innerWidth!==touchWidth){touchWidth=innerWidth;touchHeight=innerHeight;}
  const compact=compactPolicy();
  if(compact){track.style.setProperty('--v179-tour-range',compact.range+'px');track.style.setProperty('--v179-stage-height',stage.offsetHeight+'px');}
  const top=track.getBoundingClientRect().top;
  const pinned=pin.matches&&!reduced.matches;
  const inset=innerWidth<700?64:innerWidth<1100?72:84;
  return {top,anchor:pinned?inset:innerHeight*.75,range:Math.max(1,pinned?track.offsetHeight-stage.offsetHeight:track.offsetHeight+innerHeight*.35)};
 }
 function update(){
  if(id==='student-db'&&matchMedia('(max-width:1099px)').matches)return;
  const doc=outer();
  const bounds=frame.getBoundingClientRect();
  doc?.documentElement?.toggleAttribute('data-tour-outside',bounds.bottom<=73||bounds.top>=innerHeight);
  frame.tabIndex=manual||reduced.matches?0:-1;
  track.dataset.tourMode=manual?"manual":reduced.matches?"reduced":"scroll";
  if(manual||reduced.matches)return;
  const {top,anchor,range}=geometry();
  const p=limit((anchor-top)/range);
  track.dataset.tourProgress=p.toFixed(3);
  stage.style.setProperty('--stage-progress',p.toFixed(3));
  const stages=stagePlan();
  const index=stages.findLastIndex(value=>p>=value);
  const fraction=completePhase((p-stages[index])/((stages[index+1]??1)-stages[index]));
  track.dataset.stageFraction=fraction.toFixed(3);
  const stageBounds=stage.getBoundingClientRect();
  const visibility=Math.min(limit((innerHeight-stageBounds.top)/Math.min(220,innerHeight*.25)),limit((track.getBoundingClientRect().bottom-anchor)/Math.min(220,innerHeight*.25)));
  stage.style.setProperty('--v143-stage-visibility',String(.35+.65*visibility));
  stage.style.setProperty('--v143-stage-blur',((1-visibility)*2).toFixed(2)+'px');
  const key=index+':'+Math.round(fraction*100);
  select(index);
  if(key!==last){
   const applied=apply(index,fraction);
   if(id==='student-db')track.toggleAttribute?.('data-stage-loading',!applied);
   if(applied)last=key;
  }
 }
 track.closest('section').querySelector('[data-v133-practice]')?.addEventListener('click',()=>{
  handoff();
  if(id==='lms')frame.contentWindow.postMessage({type:'lms:handoff'},location.origin);
  frame.scrollIntoView({block:'center'});
  frame.focus({preventScroll:true});
 });
 const wire=()=>{
  const doc=outer();bind(doc);bind(student());
  doc?.querySelector('#student-view')?.addEventListener('load',()=>{bind(student());last='';schedule()},{once:true});
  const operator=doc?.getElementById('operator');
  if(operator)operator.hidden=true;
  last='';schedule();
 };
 frame.addEventListener('load',wire);
 if(frame.dataset?.src&&!frame.getAttribute('src')){frame.loading='eager';frame.src=frame.dataset.src;}
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame.contentWindow&&e.data?.type==='demo:ready')schedule()});
 buttons.forEach((button,index)=>button.addEventListener('click',()=>{
  if(manual||reduced.matches){
   if(id==='student-db')outer()?.getElementById('student')?.click();
   apply(index,index===0||config.screens?.[index]==="lesson"?0:1,manual);
   if(reduced.matches){const shell=frame.closest?.(".demo-window");if(shell){const inset=(document.querySelector(".site-header")?.getBoundingClientRect().bottom||72)+12;window.scrollTo({top:scrollY+shell.getBoundingClientRect().top-inset,behavior:"instant"});}}
   return;
  }
  const {top,anchor,range}=geometry();
  scrollTo({top:scrollY+top-anchor+range*(stagePlan()[index]+.005),behavior:compactPolicy()?'instant':'smooth'});
 }));
 const operatorTrigger=track.closest('section').querySelector('[data-operator-view]');
 operatorTrigger?.addEventListener('click',()=>{
  handoff();
  const operator=id==='lms'?outer()?.querySelector('[data-operator-control]'):outer()?.getElementById('operator');
  if(id==='student-db'&&operator)operator.hidden=false;
  function activateOperator(){
   if(id==='lms')frame.contentWindow.postMessage({type:'lms:operator'},location.origin);
   else {
    const button=outer()?.getElementById('operator');
    if(button){button.hidden=false;button.click();}
   }
  }
  if(operator)activateOperator();
  else {
   const onReady=event=>{
    if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.type!=='demo:ready')return;
    window.removeEventListener('message',onReady);
    if(shell.matches(':popover-open'))activateOperator();
   };
   window.addEventListener('message',onReady);
   setTimeout(()=>window.removeEventListener('message',onReady),5000);
  }
  const shell=frame.closest('.demo-window');
  if(!shell?.showPopover)return;
  shell.setAttribute('popover','auto');
  shell.classList.add('v133-operator-panel');
  shell.showPopover();
  function onClose(event){
   if(event.newState!=='closed')return;
   shell.removeEventListener('toggle',onClose);
   shell.removeAttribute('popover');
   shell.classList.remove('v133-operator-panel');
   operatorTrigger.focus({preventScroll:true});
  }
  shell.addEventListener('toggle',onClose);
  frame.focus({preventScroll:true});
 });
 select(0);wire();bindings.push(update);
}
function schedule(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;bindings.forEach(update=>update())})}
for(const type of ['scroll','resize','pageshow'])window.addEventListener(type,schedule,{passive:true});
reduced.addEventListener('change',schedule);
schedule();
