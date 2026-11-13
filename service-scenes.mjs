import {createDBReadingRail} from './db-reading-rail.mjs';
import {dbShowcasePose,createDBAtmosphere} from './db-scroll-design.mjs';
import {watchManualFrameLoad} from './manual-frame-load.mjs';
import {departureOpacity} from './handoff-pose.mjs';
import {canRender,enterSection} from './render-policy.mjs';
import {createNextWork} from './next-work.mjs';
import * as THREE from 'three';
import {CSS3DRenderer,CSS3DObject} from './vendor/CSS3DRenderer.js';
import {cameraPose,dampProgress,dbReadingParallax,dbDeparturePose,dbCropOffset} from './camera-path.mjs';
import {createExhibitionSpace} from './exhibition-space.js';
import {lightPose,dampPointer} from './ambient-light.mjs';
import {handoffFor,handoffIsActive,resolveHandoffCopy,serviceButtonAction} from './story-handoff.mjs';
const q=new URLSearchParams(location.search),staticMedia=matchMedia('(max-width:900px), (max-height:700px), (prefers-reduced-motion:reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
const clamp=n=>Math.max(0,Math.min(1,n));
class ServiceScene{
 constructor(section){
  this.el=section;this.id=section.id;this.src=section.dataset.app;this.active=false;this.mode='pending';this.wasRenderable=false;this.p=0;this.shown=0;this.last=0;this.raf=0;this.ready=false;this.pointer={x:0,y:0,tx:0,ty:0};this.hardFailure=false;this.metrics={frames:0,maxRenderMs:0};
  if(this.wantsStatic())section.dataset.mode='static';
  (window.HoGanScenes??=[]).push({id:this.id,getDiagnostics:()=>({...this.metrics,mode:this.mode,ready:this.ready,progress:this.p,drawCalls:this.gl?.info.render.calls??0,triangles:this.gl?.info.render.triangles??0,geometries:this.gl?.info.memory.geometries??0,paused:!canRender(this.el)})});
  this.copy=section.querySelector('.project-copy');this.originalCopy={title:this.copy.querySelector('h2').innerHTML,lead:this.copy.querySelector('.lead').innerHTML,eyebrow:this.copy.querySelector('.eyebrow').textContent,button:this.copy.querySelector('[data-service-practice]').innerHTML,disclosure:this.copy.querySelector('.disclosure').innerHTML};this.originalCopy.label=this.copy.querySelector('.scene-note>span').innerHTML;this.copyHandoff=false;this.copyHandoffTarget=false;
  if(this.id==='student-db'){this.readingRail=createDBReadingRail(section);this.readingRail(0,this.wantsStatic()?'static':'3d');}
  this.stage=section.querySelector('.service-stage');this.canvasHost=section.querySelector('.service-webgl');this.domHost=section.querySelector('.service-space');this.status=section.querySelector('.service-load');
  this.buttons=[...section.querySelectorAll('[data-service-progress]')];this.buttons.forEach(b=>b.onclick=()=>this.jump(Number(b.dataset.serviceProgress)));
  this.points=this.buttons.map(b=>Number(b.dataset.serviceProgress));section.querySelector('.service-prev').onclick=()=>this.jump([...this.points].reverse().find(p=>p<this.p-.02)??0);
  section.querySelector('.service-next').onclick=()=>{if(this.shown>=this.points.at(-1)+.05)enterSection(this.id==='student-db'?'#db-decision':section.dataset.next);else this.jump(this.points.find(p=>p>this.p+.02)??.99)};
  const stagePractice=section.querySelector('.service-stage .project-copy [data-service-practice]');if(stagePractice)stagePractice.onclick=()=>{const action=serviceButtonAction(this.id,this.copyHandoff);if(action.type==='story'){enterSection(action.target);return;}this.open(true,this.id==='lms'?'video':'home')};
  section.querySelectorAll('.service-static [data-service-practice]').forEach(b=>b.onclick=()=>this.open(true,this.id==='lms'?'video':'home'));
  window.addEventListener('scroll',()=>{if(this.mode!=='3d')return;this.p=this.progress();if(!canRender(this.el))this.wasRenderable=false;this.sendVisibility();if(this.active)this.request()},{passive:true});
  window.addEventListener('resize',()=>{if(this.mode==='3d'){this.gl.setSize(innerWidth,innerHeight);this.css.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.request()}});
  staticMedia.addEventListener('change',()=>this.onMediaChange());
  window.addEventListener('keydown',e=>{if(e.defaultPrevented||!canRender(this.el))return;if(!this.active||this.mode!=='3d'||this.progress()<=0&&scrollY<section.offsetTop||scrollY>section.offsetTop+section.offsetHeight-innerHeight||document.querySelector('dialog[open]')||e.altKey||e.ctrlKey||e.metaKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();section.querySelector('.service-next').click();if(canRender(this.el))section.querySelector('.service-next').focus({preventScroll:true})}if(e.key==='ArrowLeft'){e.preventDefault();section.querySelector('.service-prev').click();if(canRender(this.el))(section.querySelector('.service-prev').disabled?section.querySelector('.service-next'):section.querySelector('.service-prev')).focus({preventScroll:true})}});
  window.addEventListener('pointermove',e=>{if(!this.active||this.mode!=='3d'||!fine.matches||staticMedia.matches||document.querySelector('dialog[open]'))return;if(e.target instanceof Element && e.target.closest('button,a,input,select,textarea,iframe,[role=button]')){this.pointer.tx=this.pointer.ty=0;this.request();return;}this.pointer.tx=e.clientX/innerWidth*2-1;this.pointer.ty=1-e.clientY/innerHeight*2;this.request()},{passive:true});
  window.addEventListener('blur',()=>{this.pointer.tx=this.pointer.ty=0;this.request()});
  section.querySelectorAll('[data-service-video]').forEach(b=>b.onclick=()=>this.open(true,'video'));
  window.addEventListener('message',e=>this.receive(e));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&this.mode==='3d'){this.shown=this.p=this.progress();this.request()}});
  document.addEventListener('hogan:motion',()=>{this.sendVisibility();if(!canRender(this.el)){this.wasRenderable=false;cancelAnimationFrame(this.raf);this.raf=0;this.last=0}else this.request()});
  window.addEventListener('popstate',()=>{if(location.hash===`#${this.id}/practice`)this.open(false,history.state?.view||'home');else this.close()});
  this.observer=new IntersectionObserver(entries=>{for(const entry of entries){this.active=entry.isIntersecting;this.sendVisibility();if(this.active){this.reconcile();this.p=this.progress();this.send();this.request()}else{cancelAnimationFrame(this.raf);this.raf=0;this.last=0}}},{rootMargin:'1000px 0px'});this.observer.observe(section);
  if(location.hash===`#${this.id}/practice`)this.open(false,history.state?.view||'home');
 }
 progress(){const p=clamp((scrollY-this.el.offsetTop)/Math.max(1,this.el.offsetHeight-innerHeight));return this.id==='lms'?Math.round(p*1000)/1000:p}
 jump(p){scrollTo({top:this.el.offsetTop+p*(this.el.offsetHeight-innerHeight),behavior:'instant'});this.p=this.progress();this.request()}
 updateCopy(p){const active=handoffIsActive(p);if(active===this.copyHandoffTarget)return;this.copyHandoffTarget=active;if(active===this.copyHandoff){this.copyTransitionVersion=(this.copyTransitionVersion||0)+1;this.copyAnimation?.cancel();this.copyAnimation=null;this.copy.style.removeProperty('opacity');return}const incoming=active?resolveHandoffCopy(this.id,document):null;if(active&&!incoming){this.copyHandoffTarget=this.copyHandoff;return}const apply=()=>{this.copy.querySelector('.scene-note>span').innerHTML=active?incoming.label:this.originalCopy.label;this.copy.querySelector('h2').innerHTML=active?incoming.title:this.originalCopy.title;this.copy.querySelector('.lead').innerHTML=active?incoming.lead:this.originalCopy.lead;this.copy.querySelector('.eyebrow').textContent=active?incoming.eyebrow:this.originalCopy.eyebrow;this.copy.querySelector('[data-service-practice]').innerHTML=active?incoming.button:this.originalCopy.button;this.copy.querySelector('.disclosure').innerHTML=this.originalCopy.disclosure;this.copyHandoff=active;this.el.dataset.handoff=String(active);document.dispatchEvent(new Event('hogan:section'));};this.transitionCopy(apply);}
 transitionCopy(apply){
  const current=Number.parseFloat(getComputedStyle(this.copy).opacity),from=Number.isFinite(current)?current:1;
  this.copyTransitionVersion=(this.copyTransitionVersion||0)+1;
  const version=this.copyTransitionVersion;
  this.copyAnimation?.cancel();
  this.copy.style.opacity=String(from);
  if(staticMedia.matches||typeof this.copy.animate!=='function'){
   apply();this.copy.style.removeProperty('opacity');this.copyAnimation=null;return;
  }
  const reveal=()=>{
   if(version!==this.copyTransitionVersion)return;
   apply();
   const incoming=this.copy.animate([{opacity:0},{opacity:1}],{duration:240,easing:'ease-out',fill:'forwards'});
   this.copyAnimation=incoming;
   incoming.finished.then(()=>{
    if(version===this.copyTransitionVersion){this.copy.style.removeProperty('opacity');this.copyAnimation=null;}
   }).catch(()=>{});
  };
  if(from<=.05){reveal();return;}
  const out=this.copy.animate([{opacity:from},{opacity:0}],{duration:Math.max(35,Math.round(180*from)),easing:'ease-in-out',fill:'forwards'});
  this.copyAnimation=out;
  out.finished.then(reveal).catch(()=>{});
 }
 ui(){const p=this.p;this.readingRail?.(p,this.mode);this.updateCopy(p);this.el.dataset.front=String(scrollY>=this.el.offsetTop-.5);const stage=Math.max(0,this.points.findLastIndex(point=>p>=point-.001));this.el.dataset.progress=p.toFixed(3);this.buttons.forEach((b,i)=>{if(i===stage)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});this.el.querySelector('.service-prev').disabled=p<.005;this.el.querySelector('.service-next').textContent=p>=this.points.at(-1)+.05?'↓':'→';const note=this.el.querySelector('.service-note'),nextNote=this.el.dataset['note'+stage]||this.el.dataset.note0;if(note.textContent!==nextNote){const hadText=!!note.textContent;this.noteAnimation?.cancel();note.textContent=nextNote;if(hadText&&this.mode==='3d'&&!staticMedia.matches&&typeof note.animate==='function')this.noteAnimation=note.animate([{opacity:.35},{opacity:1}],{duration:180,easing:'ease-out'});}const advance=p>=this.points.at(-1)+.05;this.el.querySelector('.service-next').setAttribute('aria-label',advance?(this.id==='student-db'?'통합 DB 검증 사례로 이동':'서비스 설명으로 이동'):this.el.dataset.title+' 다음 시연 단계');}
 wantsStatic(){return !!this.el.querySelector('.service-static')||staticMedia.matches||q.has('reducedmotion')||q.has('failwebgl')||q.has('fallback')||this.hardFailure;}
 onMediaChange(){
  if(this.dialog?.open)return;
  if(this.wantsStatic()){
   if(this.mode==='3d'){this.dispose();this.mode='pending';}
   this.el.dataset.mode='static';if(this.active)this.reconcile();
  }else{
   if(this.mode!=='3d'){this.mode='pending';this.el.dataset.mode='pending';this.el.querySelectorAll('.service-static iframe[data-src]').forEach(f=>f.removeAttribute('src'));}
   if(this.active)this.reconcile();
  }
 }
 showPreviewError(f){f.hidden=true;let notice=f.parentElement.querySelector('[data-preview-error]');if(!notice){notice=document.createElement('p');notice.dataset.previewError='true';notice.setAttribute('role','status');notice.textContent='화면을 불러오지 못했습니다. 설명은 계속 읽을 수 있습니다.';f.after(notice);}}
 reconcile(){
  if(this.wantsStatic()){
   if(this.mode==='3d')this.dispose();
   if(this.mode!=='static'){
    this.mode='static';this.el.dataset.mode='static';this.readingRail?.(this.p,'static');
    this.el.querySelectorAll('.service-static iframe[data-src]').forEach(f=>{
     f.hidden=false;f.dataset.ready='false';f.onload=()=>{try{if(f.contentDocument?.URL==='about:blank')return;if(!f.contentDocument?.querySelector('[data-demo-root]'))this.showPreviewError(f);}catch{this.showPreviewError(f)}};
     f.src=q.has('failapp')?'/missing-service.html':f.dataset.src;
     setTimeout(()=>{if(f.isConnected&&f.getAttribute('src')&&f.dataset.ready!=='true')this.showPreviewError(f)},10000);
    });
   }
   return;
  }
  if(this.mode!=='3d')this.init();
 }
 init(){
  try{
   this.mode='3d';this.el.dataset.mode='3d';this.ready=false;this.status.textContent='체험 화면을 불러오고 있습니다.';
   this.gl=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});this.gl.setPixelRatio(Math.min(devicePixelRatio,1.5));this.gl.setSize(innerWidth,innerHeight);this.gl.outputColorSpace=THREE.SRGBColorSpace;this.gl.toneMapping=THREE.ACESFilmicToneMapping;this.gl.toneMappingExposure=1.1;this.canvasHost.append(this.gl.domElement);
   this.lost=e=>{e.preventDefault();const before=this.el.getBoundingClientRect();const visible=before.bottom>0&&before.top<innerHeight;this.hardFailure=true;this.reconcile();if(visible&&!this.dialog?.open){const after=this.el.getBoundingClientRect();const wantedTop=Math.max(before.top,Math.min(0,innerHeight-after.height));const shift=after.top-wantedTop;if(Math.abs(shift)>1)scrollTo({top:Math.max(0,scrollY+shift),behavior:'instant'})}};this.gl.domElement.addEventListener('webglcontextlost',this.lost);
   this.scene=new THREE.Scene();this.scene.background=null;this.scene.add(new THREE.HemisphereLight('#efe2cb','#0a1315',2));const key=new THREE.DirectionalLight('#edeaf0',3);key.position.set(-800,800,1200);key.castShadow=true;key.shadow.mapSize.set(512,512);Object.assign(key.shadow.camera,{left:-1700,right:2000,top:1800,bottom:-1200,near:1,far:5000});key.shadow.bias=-.0003;key.shadow.normalBias=2;key.shadow.intensity=.38;this.scene.add(key);const fill=new THREE.DirectionalLight('#91a4ad',1.6);fill.position.set(700,-400,200);this.scene.add(fill);this.exhibition=this.id==='student-db'?createDBAtmosphere(this.scene):createExhibitionSpace(this.scene,this.gl,this.id);
   this.camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,1,10000);this.css=new CSS3DRenderer();this.css.setSize(innerWidth,innerHeight);this.domHost.append(this.css.domElement);this.cssScene=new THREE.Scene();
   const shell=document.createElement('div');shell.className='app-object';shell.dataset.loaded='false';shell.style.width=this.id==='student-db'?'920px':'1040px';shell.style.height='720px';this.frame=document.createElement('iframe');this.frame.title=this.el.dataset.title+' 자동 시연';this.frame.tabIndex=-1;this.frame.allow='autoplay; fullscreen';this.frame.allowFullscreen=true;this.frame.style.opacity='0';if(this.id==='student-db'){this.frame.style.width='920px';this.frame.style.maxWidth='100%';}this.frame.setAttribute('sandbox','allow-scripts allow-same-origin');this.frame.src=q.has('failapp')?'/missing-service.html':this.src;shell.append(this.frame);this.object=new CSS3DObject(shell);this.cssScene.add(this.object);this.frameMesh=new THREE.Mesh(new THREE.BoxGeometry(this.id==='student-db'?926:1046,726,12),new THREE.MeshStandardMaterial({color:'#262925',roughness:.86,metalness:.25}));this.frameMesh.castShadow=true;this.scene.add(this.frameMesh);this.shown=this.p=this.progress();
   // IO can initialize a scene before it is visible; mount its HTML once.
   const entry=this.id==='student-db'?dbShowcasePose(this.p,innerWidth,innerHeight):cameraPose(this.p,innerWidth,innerHeight,this.id!=='lms',1040);this.camera.position.set(...entry.camera);this.camera.lookAt(...entry.look);this.object.position.set(...entry.object);this.object.rotation.set(...entry.rotation);this.css.render(this.cssScene,this.camera);this.el.dataset.initialUiMounted=String(this.object.element.isConnected);
   this.timeout=setTimeout(()=>{if(!this.ready||this.frame?.style.opacity==='0'){this.hardFailure=true;this.reconcile()}},10000);this.ui();this.request();
  }catch(error){this.hardFailure=true;this.reconcile()}
 }
 request(){if(this.mode==='3d'&&this.active&&!this.raf&&canRender(this.el))this.raf=requestAnimationFrame(t=>this.render(t))}
 render(t){const renderStart=performance.now();this.raf=0;if(this.mode!=='3d'||!this.active||!canRender(this.el)){this.wasRenderable=false;this.last=0;return;}const dt=this.last?t-this.last:16.67;this.last=t;this.p=this.progress();if(!this.wasRenderable)this.shown=this.p;this.wasRenderable=true;this.shown=dampProgress(this.shown,this.p,dt);const basePose=cameraPose(this.id==='student-db'?Math.min(this.shown,.8):this.shown,innerWidth,innerHeight,this.id!=='lms',this.id==='student-db'?920:1040);const pose=this.id==='student-db'?dbShowcasePose(this.shown,innerWidth,innerHeight):basePose;this.camera.position.set(...pose.camera);this.camera.lookAt(...pose.look);this.object.position.set(...pose.object);this.object.rotation.set(...pose.rotation);this.frameMesh.position.copy(this.object.position);this.frameMesh.position.z-=8;this.frameMesh.quaternion.copy(this.object.quaternion);const opacity=1;this.object.element.style.opacity=String(opacity);this.frameMesh.material.transparent=true;this.frameMesh.material.opacity=opacity;this.frameMesh.visible=opacity>.001;this.frameMesh.castShadow=opacity>.3;this.pointer.x=dampPointer(this.pointer.x,this.pointer.tx,dt);this.pointer.y=dampPointer(this.pointer.y,this.pointer.ty,dt);const light=this.exhibition.userData.cursorLight,lp=lightPose(this.pointer.x,this.pointer.y);light.position.set(...lp.position);light.target.position.set(...lp.target);light.intensity=lp.intensity;this.exhibition.userData.update?.(this.shown,this.pointer.x,this.pointer.y);this.gl.render(this.scene,this.camera);this.css.render(this.cssScene,this.camera);this.metrics.frames++;this.metrics.maxRenderMs=Math.max(this.metrics.maxRenderMs,performance.now()-renderStart);this.el.dataset.cameraProgress=this.shown.toFixed(3);this.ui();this.send();if(Math.abs(this.p-this.shown)>.0002||this.pointer.x!==this.pointer.tx||this.pointer.y!==this.pointer.ty)this.request();else this.last=0;}
 sendVisibility(){if(this.id!=='lms'||!this.ready||!this.frame)return;const paused=!canRender(this.el);if(this.pauseFrame===this.frame&&this.pauseValue===paused)return;this.pauseFrame=this.frame;this.pauseValue=paused;this.frame.contentWindow.postMessage({type:'demo:suspend',value:paused},location.origin)}
 send(){const p=this.mode==='3d'?this.shown:this.p;this.sendVisibility();if(this.ready&&this.frame&&(this.sentFrame!==this.frame||this.sentProgress!==p)){this.frame.contentWindow.postMessage({type:'demo:progress',value:p},location.origin);this.sentFrame=this.frame;this.sentProgress=p;this.el.dataset.presentationMessages=String((Number(this.el.dataset.presentationMessages)||0)+1)}}
 receive(e){if(e.origin!==location.origin)return;if(e.data?.id===this.id&&e.data?.type==='demo:ready')this.el.querySelectorAll('.service-static iframe[data-src]').forEach(f=>{if(e.source===f.contentWindow){f.dataset.ready='true';f.hidden=false;f.parentElement.querySelector('[data-preview-error]')?.remove()}});if(e.source===this.frame?.contentWindow&&e.data?.id===this.id){if(e.data.type==='demo:ready'){this.ready=true;this.p=this.progress();this.send();this.request()}if(e.data.type==='demo:presented'){this.frame.style.opacity='1';this.frame.parentElement.dataset.loaded='true';clearTimeout(this.timeout);this.status.textContent=''}}if(e.source===this.manualFrame?.contentWindow&&e.data?.id===this.id){if(e.data.type==='demo:ready'&&this.manualLoad?.ready()){this.dialog.querySelector('[role=status]').textContent=''}if(e.data.type==='demo:exit')this.exit()}}
 dispose(){this.wasRenderable=false;this.el.dataset.initialUiMounted='false';this.nextWork=null;cancelAnimationFrame(this.raf);this.raf=0;clearTimeout(this.timeout);this.gl?.domElement.removeEventListener('webglcontextlost',this.lost);this.scene?.traverse(n=>{n.geometry?.dispose();if(n.material)for(const m of Array.isArray(n.material)?n.material:[n.material])m.dispose();n.shadow?.dispose()});this.gl?.dispose();this.gl?.forceContextLoss();this.canvasHost.replaceChildren();this.domHost.replaceChildren();this.frame=null;this.last=0;this.cssScene=null;this.scene=null;this.object=null;this.frameMesh=null;this.exhibition=null;this.css=null;this.gl=null;}
 open(push=true,startView='home'){
  if(this.dialog?.open||document.querySelector('dialog[open]'))return;this.exitPending=false;this.restoreVersion=(this.restoreVersion||0)+1;this.returnFocus=document.activeElement?.matches?.('[data-service-practice],[data-service-video]')?document.activeElement:null;this.returnLayout=push?(staticMedia.matches?'static':'3d'):(history.state?.layout||(staticMedia.matches?'static':'3d'));this.returnY=push?scrollY:history.state?.returnY??Math.max(0,this.el.offsetTop-(staticMedia.matches?80:0));document.documentElement.style.overflow='hidden';
  if(!this.dialog){this.dialog=document.createElement('dialog');this.dialog.className='service-dialog';this.dialog.setAttribute('aria-labelledby',this.id+'-dialog-title');this.dialog.innerHTML=`<div class="practice-bar"><div><strong id="${this.id}-dialog-title">${this.el.dataset.title} · 직접 체험</strong><span>체험용 가상 데이터</span></div><button type="button" aria-label="체험을 닫고 원래 작품으로">체험 종료 ×</button></div><div class="service-manual"></div><p class="service-manual-status" role="status"></p>`;document.body.append(this.dialog);this.dialog.querySelector('button').onclick=()=>this.exit();this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.exit()})}
  this.manualLoad?.dispose();
  const f=document.createElement('iframe');this.manualFrame=f;f.title=this.el.dataset.title+' 직접 체험';
  f.allow='autoplay; fullscreen';f.allowFullscreen=true;f.setAttribute('sandbox','allow-scripts allow-same-origin');
  f.src=q.has('failapp')?'/missing-service.html':this.src+'?manual'+(this.id==='lms'&&startView==='video'?'&view=video':'');
  this.dialog.querySelector('.service-manual').replaceChildren(f);
  this.dialog.querySelector('[role=status]').textContent='체험 화면을 불러오고 있습니다.';
  this.dialog.showModal();this.dialog.querySelector('button').focus();
  if(push){history.replaceState(history.state,'','#'+this.id);history.pushState({service:this.id,returnY:this.returnY,layout:this.returnLayout,view:startView},'','#'+this.id+'/practice');}
  this.manualLoad=watchManualFrameLoad({
   frame:f,isCurrent:()=>this.dialog?.open&&this.manualFrame===f,hasRoot:frame=>!!frame.contentDocument?.querySelector('[data-demo-root]'),
   onFailure:({wasFocused})=>{this.manualFrame=null;this.dialog.querySelector('[role=status]').textContent='체험 화면을 불러오지 못했습니다. 닫은 뒤 다시 시도해 주세요.';if(wasFocused)this.dialog.querySelector('.practice-bar button').focus({preventScroll:true})}
  });
 }
 exit(){if(!this.dialog?.open||this.exitPending)return;this.exitPending=true;if(history.state?.service===this.id)history.back();else{history.replaceState(history.state,'',`#${this.id}`);this.close()}}
 close(){if(!this.dialog?.open)return;this.exitPending=false;this.manualLoad?.dispose();this.manualLoad=null;this.dialog.close();this.dialog.querySelector('.service-manual').replaceChildren();this.manualFrame=null;document.documentElement.style.overflow='';this.reconcile();const layout=staticMedia.matches?'static':'3d',restoreY=layout!==this.returnLayout?Math.max(0,this.el.offsetTop-(layout==='static'?80:0)):this.returnY;const visible=b=>b?.isConnected&&this.el.contains(b)&&b.getClientRects().length&&(!b.checkVisibility||b.checkVisibility({checkVisibilityCSS:true}));const version=++this.restoreVersion,restore=()=>{if(version!==this.restoreVersion||document.querySelector('dialog[open]'))return;scrollTo({top:restoreY,behavior:'instant'});if(layout==='3d')this.el.dataset.front=String(scrollY>=this.el.offsetTop-.5);const focus=visible(this.returnFocus)?this.returnFocus:[...this.el.querySelectorAll('[data-service-practice]')].find(visible);focus?.focus({preventScroll:true});this.el.dataset.restoreY=String(restoreY)};restore();requestAnimationFrame(restore);}
}
document.querySelectorAll('.service-journey[data-app]:not([data-v139-chapter])').forEach(section=>new ServiceScene(section));







