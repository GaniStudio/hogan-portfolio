const panel=document.querySelector('.v186-db-inline');
if(panel){
 const compact=matchMedia('(max-width:1099px)'),frame=panel.querySelector('iframe'),buttons=[...panel.querySelectorAll('[data-db-step]')],status=panel.querySelector('[role=status]');
 let doc,ready=false,heightTask=0,observer,resize,alignAfter=false,alignTimer;
 const header=document.querySelector('.site-header');
 function headerSize(){panel.style.setProperty('--v186-header',Math.ceil(header?.getBoundingClientRect().height||72)+'px')}
 const headerObserver=new ResizeObserver(headerSize);if(header)headerObserver.observe(header);headerSize();
 function align(){if(!compact.matches)return;const top=scrollY+panel.getBoundingClientRect().top-(header?.getBoundingClientRect().height||72);scrollTo({top,behavior:'instant'})}
 function measure(){heightTask=0;if(!ready||!compact.matches)return;const h=Math.ceil(doc.body.getBoundingClientRect().height)+2;if(Math.abs(frame.getBoundingClientRect().height-h)>1)frame.style.height=h+'px';if(alignAfter){clearTimeout(alignTimer);alignTimer=setTimeout(()=>{if(alignAfter){alignAfter=false;align()}},150)}}
 function schedule(){if(!heightTask)heightTask=requestAnimationFrame(measure)}
 function sync(){
  const feedback=!doc.getElementById('feedbackModal').hidden,late=!doc.getElementById('lateSubmitModal').hidden;
  const step=feedback?'feedback':doc.getElementById('lookupSection').hidden?'overview':'lookup';
  doc.documentElement.dataset.v186View=feedback?'feedback':late?'late':step;
  buttons.forEach(b=>{if(b.dataset.dbStep===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});schedule();
 }
 function initialize(){
  const next=frame.contentDocument;if(next?.documentElement.dataset.demoMode!=='manual'||!next.getElementById('lookupForm')||doc===next)return;
  observer?.disconnect();resize?.disconnect();doc=next;ready=true;
  // Keep the real DOM/render functions. Adapt only the frame viewport to the parent page.
  doc.documentElement.setAttribute('data-auto-tour','');
  const style=doc.createElement('style');style.id='v186-inline-viewport';style.textContent=`
   html,body{height:auto!important;min-height:0!important;min-width:0!important;overflow:visible!important;scroll-behavior:auto!important}
   .app-header{position:relative!important}
   input,select,textarea{font-size:16px!important}
   html[data-v186-view=feedback] body>.app-header,html[data-v186-view=feedback] body>.page-shell,
   html[data-v186-view=late] body>.app-header,html[data-v186-view=late] body>.page-shell{display:none!important}
   html[data-v186-view=feedback] .feedback-modal,html[data-v186-view=late] .late-submit-modal{position:static!important;inset:auto!important;display:block!important;padding:0!important;background:#fff!important}
   .feedback-dialog,.late-submit-dialog{width:100%!important;height:auto!important;max-height:none!important;overflow:visible!important;border:0!important}
   .feedback-dialog__body,.late-submit-dialog__body{max-height:none!important;overflow:visible!important}
   .feedback-close{min-height:44px;min-width:44px}
  `;doc.head.append(style);
  // Feedback is in the page in this proposal, so Tab may leave it normally.
  doc.defaultView.addEventListener('keydown',e=>{if(e.key==='Tab'&&!doc.getElementById('feedbackModal').hidden)e.stopImmediatePropagation()},true);
  doc.addEventListener('submit',()=>{alignAfter=true;schedule()},true);
  doc.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest('#lookupForm')){alignAfter=true;schedule()}},true);
  function parentFocus(){const dashboard=doc.getElementById('studentDashboard'),wasInert=dashboard.inert;dashboard.inert=true;queueMicrotask(()=>{dashboard.inert=wasInert;buttons.find(b=>b.dataset.dbStep==='overview').focus({preventScroll:true})})}
  doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&!doc.getElementById('feedbackModal').hidden){parentFocus();alignAfter=true;schedule()}},true);
  doc.addEventListener('click',e=>{if(e.target.closest('[data-feedback-close]')&&!doc.getElementById('feedbackModal').hidden)parentFocus();if(e.target.closest('[data-feedback-index],[data-feedback-close],[data-feedback-prev],[data-feedback-next],#lookupAgainButton,.brand,#lookupForm button[type=submit]')){alignAfter=true;schedule()}},true);
  observer=new MutationObserver(sync);for(const id of ['lookupSection','feedbackModal','lateSubmitModal'])observer.observe(doc.getElementById(id),{attributes:true,attributeFilter:['hidden']});
  observer.observe(doc.getElementById('studentResult'),{childList:true,subtree:true});
  resize=new ResizeObserver(schedule);resize.observe(doc.body);doc.fonts.ready.then(schedule);
  buttons.forEach(b=>b.disabled=false);status.textContent='';sync();
 }
 function select(step){
  if(!ready)return;status.textContent='';alignAfter=true;
  doc.querySelector('[data-feedback-close]')?.click();doc.querySelector('[data-late-submit-close]')?.click();
  if(step==='lookup')doc.getElementById('lookupAgainButton').click();
  else{
   if(!doc.getElementById('lookupSection').hidden)doc.querySelector('#lookupForm button[type=submit]').click();
   if(!doc.getElementById('lookupSection').hidden){status.textContent='이름과 아이디를 확인해 주세요.';sync();return}
   if(step==='feedback')doc.querySelector('[data-feedback-index]')?.click();
  }sync();
 }
 for(const b of buttons)b.addEventListener('click',()=>select(b.dataset.dbStep));
 frame.addEventListener('load',initialize);
 addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame.contentWindow&&e.data?.type==='demo:ready')initialize()});
 function activate(){document.documentElement.classList.toggle('v186-db-scroll',compact.matches);if(compact.matches&&!frame.hasAttribute('src'))frame.src=frame.dataset.inlineSrc;if(compact.matches)schedule()}
 compact.addEventListener('change',activate);
 for(const event of ['wheel','touchstart'])addEventListener(event,()=>{alignAfter=false;clearTimeout(alignTimer)},{passive:true});
 const inView=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){activate();inView.disconnect()}},{rootMargin:'400px'});inView.observe(panel);
}
