const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const click=element=>{if(!element||element.disabled)return false;element.click();return true;};
const named=(doc,label)=>[...(doc?.querySelectorAll('button')??[])].find(b=>b.textContent.trim()===label);
const to=(doc,selector)=>{
 const target=doc?.querySelector(selector);
 if(!target)return false;
 const win=doc.defaultView;
 win.scrollTo(0,win.scrollY+target.getBoundingClientRect().top-12);
 return true;
};
const docs={
 db:frame=>frame.contentDocument?.querySelector('#student-view')?.contentDocument,
 lms:frame=>frame.contentDocument
};
const lookup=doc=>doc?.querySelector('#studentDashboard:not([hidden])')||click(doc?.querySelector('#lookupForm button'));
const flows=[
 {id:'student-db',kind:'db',steps:[
  [0,(_frame,doc)=>!!doc?.querySelector('#lookupForm')],
  [1,(_frame,doc)=>lookup(doc)],
  [1,(_frame,doc)=>to(doc,'#studentResult .history, #studentHeading')],
  [2,(_frame,doc)=>to(doc,'[data-feedback-index]')],
  [2,(_frame,doc)=>click(doc?.querySelector('[data-feedback-index]'))]
 ]},
 {id:'lms',kind:'lms',steps:[
  [0,(_frame,doc)=>!!named(doc,'홈')],
  [1,(_frame,doc)=>click(named(doc,'오늘 학습'))],
  [2,(_frame,doc)=>to(doc,'#abc-video')],
  [3,(_frame,doc)=>click(named(doc,'과제'))],
  [3,(_frame,doc)=>click(named(doc,'샘플 3문장 채우기'))],
  [3,(_frame,doc)=>click(doc?.querySelector('#learn-check'))],
  [4,(_frame,doc)=>click(named(doc,'시연 제출'))]
 ]}
];

for(const flow of flows){
 const section=document.getElementById(flow.id);
 const nav=section?.querySelector('.words-feature-steps');
 if(!nav)continue;
 const status=document.createElement('p');
 status.className='tour-status';
 status.textContent='창이 보이면 자동 시연이 시작됩니다. 창을 조작하면 직접 체험으로 전환됩니다.';
 nav.after(status);
 const seen=new WeakSet();
 let active=false, stopped=false, index=0, timer;
 const getFrame=()=>section.querySelector('iframe.inline-service');
 const setAuto=(frame,value)=>{
  for(const doc of [frame?.contentDocument,frame&&docs[flow.kind](frame)])
   doc?.documentElement?.toggleAttribute('data-auto-tour',value);
 };
 const select=index=>{
  nav.querySelectorAll('button').forEach((button,i)=>{
   if(i===index)button.setAttribute('aria-current','step');
   else button.removeAttribute('aria-current');
  });
 };
 function stop(message='직접 체험 중'){
  stopped=true;
  clearTimeout(timer);
  setAuto(getFrame(),false);
  status.textContent=message;
 }
 function prepare(doc){
  if(!doc?.documentElement||seen.has(doc))return;
  seen.add(doc);
  for(const event of ['pointerdown','touchstart','keydown','wheel'])
   doc.addEventListener(event,e=>{if(e.isTrusted)stop();},{capture:true,passive:true});
 }
 function operatorControls(frame){
  const doc=frame?.contentDocument;
  return flow.kind==='db'?[doc?.getElementById('operator')]:
   [...(doc?.querySelectorAll('[data-operator-control]')??[])];
 }
 function tick(){
  if(!active||stopped||reduced.matches)return;
  const frame=getFrame();
  const doc=frame&&docs[flow.kind](frame);
  prepare(frame?.contentDocument);prepare(doc);
  if(frame){
   for(const control of operatorControls(frame))if(control)control.style.display='none';
   setAuto(frame,true);
  }
  const step=flow.steps[index];
  if(frame&&doc&&step?.[1](frame,doc)){
   select(step[0]);index++;
   status.textContent='자동 시연 중 · 창을 조작하면 직접 체험으로 바뀝니다.';
  }
  if(index>=flow.steps.length){stop('시연 완료 · 직접 체험할 수 있습니다.');return;}
  timer=setTimeout(tick, flow.kind==='lms'&&index===3?5200:1900);
 }
 const observer=new IntersectionObserver(([entry])=>{
  active=entry.intersectionRatio>=.4;
  clearTimeout(timer);
  if(active&&!stopped&&!reduced.matches)timer=setTimeout(tick,1000);
 },{threshold:.4});
 function bind(){
  const frame=getFrame();
  if(!frame)return;
  function bindDocuments(){
   prepare(frame.contentDocument);prepare(docs[flow.kind](frame));
   for(const control of operatorControls(frame))if(control)control.style.display='none';
  }
  frame.addEventListener('load',()=>{
   bindDocuments();
   frame.contentDocument?.querySelector('#student-view')?.addEventListener('load',bindDocuments);
  });
  bindDocuments();
  observer.observe(frame.closest('.demo-window')??frame);
 }
 if(getFrame())bind();
 else {
  const wait=new MutationObserver(()=>{if(getFrame()){wait.disconnect();bind();}});
  wait.observe(section,{childList:true,subtree:true});
 }
 reduced.addEventListener('change',()=>{if(reduced.matches)stop('직접 체험 · 움직임 줄이기');});
 if(reduced.matches)stop('직접 체험 · 움직임 줄이기');
 section.addEventListener('pointerdown',e=>{if(e.isTrusted)stop();});
 section.addEventListener('keydown',e=>{if(e.isTrusted)stop();});
 section.querySelector('[data-operator-view]')?.addEventListener('click',()=>{
  stop();
  const frame=getFrame();
  click(operatorControls(frame)[0]);
 });
 nav.addEventListener('click',e=>{
  const button=e.target.closest('[data-tour-step]');
  if(!button)return;
  stop();
  const frame=getFrame(),doc=frame&&docs[flow.kind](frame);
  if(!doc)return;
  const step=Number(button.dataset.tourStep);
  if(flow.kind==='db'){
   click(frame.contentDocument.getElementById('student'));
   if(step===0)click(doc.querySelector('#lookupAgainButton'));
   else{
    lookup(doc);
    if(step===2)to(doc,'[data-feedback-index]');
   }
  }else{
   const labels=['홈','오늘 학습','오늘 학습','과제','과제'];
   if(!click(named(doc,labels[step])))return;
   if(step===2)requestAnimationFrame(()=>to(doc,'#abc-video'));
  }
  select(step);
 });
}
