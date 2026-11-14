const compact=matchMedia('(max-width:1099px)');
for(const panel of document.querySelectorAll('.v194-inline')){
 const kind=panel.dataset.service,frame=panel.querySelector('iframe'),buttons=[...panel.querySelectorAll('[data-inline-step]')],status=panel.querySelector('[role=status]'),retry=panel.querySelector('[data-retry]');
 let doc,ready=false,watch,timeout,resize,mutation,raf=0,lastScreen='',alignNext=false;
 const header=()=>document.querySelector('.site-header')?.getBoundingClientRect().height||72;
 function align(){if(compact.matches)scrollTo({top:Math.max(0,scrollY+panel.getBoundingClientRect().top-header()),behavior:'instant'})}
 function measure(){raf=0;if(!ready||!compact.matches)return;const height=Math.ceil(doc.body.getBoundingClientRect().height)+2;if(Math.abs(parseFloat(frame.style.height)-height)>1)frame.style.height=height+'px';if(alignNext){alignNext=false;align()}}
 function schedule(){if(!raf)raf=requestAnimationFrame(measure)}
 function sync(){const screen=doc.documentElement.dataset.screen;const selected=kind==='words'?screen:screen==='login'?'home':['lesson','video'].includes(screen)?'lesson':['assignment','success'].includes(screen)?'assignment':'home';
  buttons.forEach(b=>b.toggleAttribute('data-active',b.dataset.inlineStep===selected));for(const b of buttons){if(b.dataset.inlineStep===selected)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')}
  if(lastScreen&&lastScreen!==screen){alignNext=true;status.textContent=''}lastScreen=screen;schedule();
 }
 function failed(){if(ready)return;clearInterval(watch);clearTimeout(timeout);panel.dataset.state='error';frame.hidden=true;retry.hidden=false;status.textContent='서비스 화면을 불러오지 못했습니다. 다시 불러오거나 전체 화면으로 확인해 주세요.'}
 function initialize(){let next;try{next=frame.contentDocument}catch{return failed()}
  const ok=kind==='words'?next?.documentElement.dataset.mode==='manual':next?.documentElement.dataset.demoMode==='manual';if(!ok||ready&&doc===next)return;
  doc=next;resize?.disconnect();mutation?.disconnect();
  const style=doc.createElement('style');style.textContent=`html,body,#root,.app,.mobile-shell,.lms-login-selected,.student-shell,.student-app-shell,.v139-course-page{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;scroll-behavior:auto!important}html,body{min-width:0!important}input,select,textarea{font-size:16px!important}.mobile-shell{width:100%!important;max-width:none!important}.app-header,.lms-login-header,.student-header{position:relative!important}.lms-login-main{min-height:0!important}`;doc.head.append(style);
  style.textContent+=`.screen,.lms-login-body,.home-main,.app-shell,.home-dashboard,.story-lms,.student-shell,.student-shell-main{min-height:0!important;height:auto!important;max-height:none!important}.shell-sidebar,.shell-sidebar-inner{height:auto!important;max-height:none!important}.mobile-shell{box-shadow:none!important}`;
  doc.documentElement.dataset.v194Inline='true';
  style.textContent+=`html[data-v194-inline] body #root :is(.mobile-shell,.screen,.official-report){height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important}html[data-v194-inline] body #root .test-screen{grid-template-rows:auto auto auto auto auto auto!important}html[data-v194-inline] body #root .test-screen .card-grid{height:auto!important;grid-template-rows:repeat(4,minmax(60px,auto))!important}`;
  style.textContent+=`html[data-v194-inline] #root .student-history-scroll{max-height:none!important;height:auto!important;overflow:visible!important}`;
  doc.documentElement.removeAttribute('data-auto-tour');doc.getElementById('root').inert=false;
  ready=true;clearTimeout(timeout);clearInterval(watch);retry.hidden=true;frame.hidden=false;panel.dataset.state='ready';status.textContent='';buttons.forEach(b=>b.disabled=false);
  resize=new ResizeObserver(schedule);resize.observe(doc.body);mutation=new MutationObserver(sync);mutation.observe(doc.documentElement,{attributes:true,attributeFilter:['data-screen','data-submitted']});doc.fonts.ready.then(schedule);sync();
 }
 function load(){if(panel.dataset.state==='loading')return;ready=false;lastScreen='';panel.dataset.state='loading';frame.hidden=false;retry.hidden=true;buttons.forEach(b=>b.disabled=true);status.textContent='서비스 화면을 불러오는 중입니다.';frame.style.height='500px';frame.src=frame.dataset.inlineSrc;watch=setInterval(initialize,250);timeout=setTimeout(failed,12000)}
 frame.addEventListener('load',initialize);frame.addEventListener('error',failed);retry.addEventListener('click',load);
 for(const b of buttons)b.addEventListener('click',()=>{if(!ready)return;const step=b.dataset.inlineStep;
  if(kind==='lms'&&doc.documentElement.dataset.screen==='login'){status.textContent='먼저 체험 화면에서 로그인해 주세요.';align();return}
  alignNext=true;
  frame.contentWindow.postMessage(kind==='words'?{type:'words:stage',stage:step}:{type:'lms:snapshot',stage:step==='assignment'&&doc.documentElement.dataset.submitted==='true'?'success':step,navigateOnly:true},location.origin);
  schedule();
 });
 function activate(){panel.style.setProperty('--v186-header',header()+'px');if(compact.matches&&!frame.hasAttribute('src'))load();if(compact.matches)schedule()}
 compact.addEventListener('change',activate);addEventListener('resize',activate);for(const event of ['wheel','touchstart'])addEventListener(event,()=>{alignNext=false},{passive:true});activate();
}
