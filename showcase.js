import {frameWindow} from './frame-window.mjs';
const departureOpacity=p=>p<.88?1:Math.max(0,1-(p-.88)/.12);
const wordHandoffActive=p=>false;
const wordCopyOpacity=p=>departureOpacity(p);
import {watchManualFrameLoad} from './manual-frame-load.mjs';

import {canRender,enterSection} from './render-policy.mjs';

import {lightPose,dampPointer} from './ambient-light.mjs';
import * as THREE from 'three';
import {createExhibitionSpace} from './exhibition-space.js';
import {cameraPose,dampProgress} from './camera-path.mjs';
import {CSS3DRenderer,CSS3DObject} from './vendor/CSS3DRenderer.js';
const $=s=>document.querySelector(s),params=new URLSearchParams(location.search);
const pointerFine=matchMedia('(hover:hover) and (pointer:fine)');let exhibition;const ambient={x:0,y:0,tx:0,ty:0};
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),small=matchMedia('(max-width:900px), (max-height:700px)');
let fallback=false,renderer,cssRenderer,camera,scene,cssScene,object,frameMesh,iframe,ready=false,target=0,shown=0,raf=0,manual=false,returnFocus=null,returnScroll=0,frameReadyTimer,hardFailure=false,resumeProgress=0,manualLoad,contextLossHandler;
// A new viewport visit starts at its current position, not an offscreen pose.
let wordWasRenderable=false;
let nextWork; let lastSentFrame,lastSentProgress,sentMessageCount=0;
function sendWords(p){if(!ready||!iframe||lastSentFrame===iframe&&lastSentProgress===p)return;iframe.contentWindow.postMessage({type:'words:progress',value:p},location.origin);lastSentFrame=iframe;lastSentProgress=p;document.body.dataset.presentationMessages=String(++sentMessageCount);}
const metrics={frames:0,maxFrameMs:0,mode:'loading',contextLosses:0};
const intervals=[];let previousFrame=0,longTasks=0;
try{new PerformanceObserver(list=>{longTasks+=list.getEntries().length}).observe({type:'longtask',buffered:true})}catch{}
const clamp=v=>Math.max(0,Math.min(1,v));const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const anchors=[0,.31,.76,.99];
const wordCopy=$('#words .project-copy'),dbCopy=$('#student-db .project-copy');
const nextWordCopy={title:dbCopy?.querySelector('h2')?.innerHTML??'통합 DB',lead:dbCopy?.querySelector('.lead')?.innerHTML??'',disclosure:dbCopy?.querySelector('.disclosure')?.innerHTML??''};
const wordPeriodOriginal=wordCopy.querySelector('.service-period').innerHTML,wordPeriodNext=$('#db-story .service-period').innerHTML;
const wordOriginal={title:wordCopy.querySelector('h2').innerHTML,lead:wordCopy.querySelector('.lead').innerHTML,eyebrow:wordCopy.querySelector('.eyebrow').textContent,button:$('#practice').innerHTML,disclosure:wordCopy.querySelector('.disclosure').innerHTML};
let wordHandoffFade=null,wordOpacityTarget=1,wordHandoffReady=false;
function wordHandoff(p){const active=wordHandoffActive(p),initial=!wordHandoffReady;wordHandoffReady=true;if(initial&&!active){document.body.dataset.handoff='false';return false}if(document.body.dataset.handoff===String(active))return false;wordHandoffFade?.cancel();wordHandoffFade=null;wordCopy.style.opacity='0';document.body.dataset.handoff=String(active);if(active&&$('#words .steps').contains(document.activeElement))$('#practice').focus({preventScroll:true});wordCopy.querySelector('.service-period').innerHTML=active?wordPeriodNext:wordPeriodOriginal;wordCopy.querySelector('h2').innerHTML=active?nextWordCopy.title:wordOriginal.title;wordCopy.querySelector('.lead').innerHTML=active?nextWordCopy.lead:wordOriginal.lead;wordCopy.querySelector('.eyebrow').textContent=active?'다음 서비스':wordOriginal.eyebrow;$('#practice').innerHTML=active?'통합 DB로 이동 <span>↗</span>':wordOriginal.button;wordCopy.querySelector('.disclosure').innerHTML=active?nextWordCopy.disclosure:wordOriginal.disclosure;document.dispatchEvent(new Event('hogan:section'));return !initial;}
function settleWordHandoff(p){wordOpacityTarget=wordCopyOpacity(p);if(wordHandoffFade){if(wordOpacityTarget<=0){wordHandoffFade.cancel();wordHandoffFade=null;wordCopy.style.opacity='0'}return;}wordCopy.style.opacity=String(wordOpacityTarget)}
function revealWordHandoff(){if(fallback||reduced.matches||typeof wordCopy.animate!=='function'){wordCopy.style.opacity=String(wordOpacityTarget);return}if(wordOpacityTarget<=0)return;const animation=wordCopy.animate([{opacity:0},{opacity:wordOpacityTarget}],{duration:180,easing:'ease-out',fill:'forwards'});wordHandoffFade=animation;animation.finished.then(()=>{if(wordHandoffFade!==animation)return;wordHandoffFade=null;wordCopy.style.opacity=String(wordOpacityTarget);animation.cancel()}).catch(()=>{});}

const stageText=[['시작','화면에 가까이 다가가면\n단어 테스트가 시작됩니다.'],['매칭','베트남어와 한국어를\n한 쌍씩 연결합니다.'],['결과','맞힌 단어와 영역을\n다음 학습 방향으로 연결합니다.'],['결과','맞힌 단어와 영역을\n다음 학습 방향으로 연결합니다.']];
let activeStage=-1,stageAnimation=null,stageVersion=0;
function setStageCopy(n){
 if(n===activeStage)return;
 const wasChanging=!!stageAnimation,first=activeStage<0;
 activeStage=n;
 const version=++stageVersion,note=$('#words .scene-note');
 const current=Number.parseFloat(getComputedStyle(note).opacity);
 stageAnimation?.cancel();stageAnimation=null;
 const apply=()=>{$('#stage-label').textContent=stageText[n][0];$('#stage-copy').innerText=stageText[n][1]};
 if(first||fallback||reduced.matches||typeof note.animate!=='function'){apply();note.style.removeProperty('opacity');return}
 // Rapid reverse input shows the newest stage immediately; an old fade cannot finish later.
 if(wasChanging){apply();stageAnimation=note.animate([{opacity:Math.max(.35,Number.isFinite(current)?current:.35)},{opacity:1}],{duration:170,easing:'ease-out'});stageAnimation.finished.then(()=>{if(version===stageVersion){stageAnimation.cancel();stageAnimation=null}}).catch(()=>{});return}
 const out=note.animate([{opacity:Number.isFinite(current)?current:1},{opacity:0}],{duration:85,easing:'ease-in',fill:'forwards'});stageAnimation=out;
 out.finished.then(()=>{if(version!==stageVersion)return;apply();out.cancel();const incoming=note.animate([{opacity:0},{opacity:1}],{duration:165,easing:'ease-out'});stageAnimation=incoming;return incoming.finished}).then(()=>{if(version===stageVersion){stageAnimation.cancel();stageAnimation=null}}).catch(()=>{});
}
function stateUI(p){const changed=wordHandoff(p);wordOpacityTarget=wordCopyOpacity(p);if(changed)revealWordHandoff();else settleWordHandoff(p);const n=p<.23?0:p<.72?1:wordHandoffActive(p)?3:2;setStageCopy(n);document.querySelectorAll('[data-p]').forEach((b,i)=>{if(i===n)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});$('#progress-fill').style.width=`${p*100}%`;$('#prev').disabled=p<.005;$('#next').disabled=false;$('#next').textContent=wordHandoffActive(p)?'↓':'→';$('#next').setAttribute('aria-label',wordHandoffActive(p)?'통합 DB로 이동':'다음 시연 단계');document.body.dataset.progress=p.toFixed(3);document.body.dataset.stage=String(n);}
function jump(p){const y=$('#words').offsetTop+p*($('#words').offsetHeight-innerHeight);scrollTo({top:y,behavior:'instant'});syncState();}
function syncState(){if(fallback)return;if(!canRender($('#words')))wordWasRenderable=false;if(scrollY>$('#words').offsetTop+$('#words').offsetHeight)return;target=scrollProgress();requestFrame();}
function scrollProgress(){return clamp((scrollY-$('#words').offsetTop)/Math.max(1,$('#words').offsetHeight-innerHeight));}
function requestFrame(){if(!raf&&!fallback&&canRender($('#words')))raf=requestAnimationFrame(render);}
function pose(p){
 const path=cameraPose(Math.min(p,.85),innerWidth,innerHeight);
 camera.position.set(...path.camera);camera.lookAt(...path.look);
 object.position.set(...path.object);object.rotation.set(...path.rotation);
 frameMesh.position.copy(object.position);frameMesh.position.z-=8;frameMesh.quaternion.copy(object.quaternion);
 const opacity=1;object.element.style.opacity=String(opacity);frameMesh.material.transparent=true;frameMesh.material.opacity=opacity;frameMesh.visible=opacity>.001;frameMesh.castShadow=opacity>.3;
 $('#webgl').style.opacity=String(opacity);$('#words .atmosphere').style.opacity=String(opacity);
 scene.background=null;
}
function render(){raf=0;if(fallback||!canRender($('#words'))){wordWasRenderable=false;previousFrame=0;return;}const t=performance.now();if(previousFrame&&t-previousFrame<150){intervals.push(t-previousFrame);if(intervals.length>600)intervals.shift();}const elapsed=previousFrame?t-previousFrame:16.67;previousFrame=t;target=scrollProgress();if(!wordWasRenderable)shown=target;wordWasRenderable=true;shown=dampProgress(shown,target,elapsed);document.body.dataset.cameraProgress=shown.toFixed(3);pose(shown);ambient.x=dampPointer(ambient.x,ambient.tx,elapsed);ambient.y=dampPointer(ambient.y,ambient.ty,elapsed);const light=exhibition?.userData.cursorLight;if(light){const lp=lightPose(ambient.x,ambient.y);light.position.set(...lp.position);light.target.position.set(...lp.target);light.intensity=lp.intensity;}document.body.dataset.ambient=ambient.x.toFixed(2)+','+ambient.y.toFixed(2);exhibition?.userData.update?.(shown,ambient.x,ambient.y);renderer.render(scene,camera);cssRenderer.render(cssScene,camera);stateUI(shown);sendWords(shown);metrics.frames++;metrics.maxFrameMs=Math.max(metrics.maxFrameMs,performance.now()-t);if(params.has('inspect')||params.has('capture')){document.body.dataset.metrics=JSON.stringify({...metrics,medianIntervalMs:[...intervals].sort((a,b)=>a-b)[Math.floor(intervals.length/2)]??null,longTasks,drawCalls:renderer.info.render.calls,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio});}if(Math.abs(target-shown)>.0002||ambient.x!==ambient.tx||ambient.y!==ambient.ty)requestFrame();else previousFrame=0;}
function resize(){if(fallback)return;renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);cssRenderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();requestFrame();}
function disposeScene(){
 wordWasRenderable=false;document.body.dataset.wordUiMounted='false';
 cancelAnimationFrame(raf);raf=0;clearTimeout(frameReadyTimer);ready=false;previousFrame=0;
 scene?.traverse(node=>{node.geometry?.dispose();if(node.material){for(const m of Array.isArray(node.material)?node.material:[node.material])m.dispose()}node.shadow?.dispose()});if(renderer){renderer.domElement.removeEventListener('webglcontextlost',contextLossHandler);renderer.dispose();renderer.forceContextLoss();}
 $('#webgl').replaceChildren();$('#space').replaceChildren();iframe=null;renderer=null;scene=null;cssScene=null;object=null;frameMesh=null;exhibition=null;nextWork=null;cssRenderer=null;
}
function reconcileMode(){
 if(manual)return;
 const keepReading=location.hash==='#reading';let changed=false;
 const staticRequired=true;
 if(staticRequired&&!fallback){useFallback('화면 크기 또는 움직임 설정에 맞춰 세로 목록으로 보여드립니다.');changed=true;}
 else if(!staticRequired&&fallback&&!hardFailure){
  fallback=false;$('#static-items').replaceChildren();$('#static-gallery').hidden=true;$('#words').hidden=false;
  target=shown=resumeProgress;init();if(!fallback&&!keepReading)jump(resumeProgress);changed=true;
 }
 // The reading section changes document position when layouts switch. Keep
 // the same content in view instead of jumping back to the words chapter.
 if(changed&&keepReading)$('#reading').scrollIntoView({block:'start',behavior:'instant'});
}
function hasAppRoot(frame){try{return !!frame.contentDocument?.getElementById('root')}catch{return false}}
function useFallback(reason){
 if(fallback)return;resumeProgress=scrollProgress();fallback=true;metrics.mode='static';disposeScene();$('#words').hidden=true;$('#space').replaceChildren();$('#static-gallery').hidden=false;$('#fallback-reason').textContent=reason;
 const labels=[['manual','단어를 연결하기','dậy — 일어나다, tiếng Việt — 베트남어, đâu — 어디. 서로 다른 언어의 카드를 연결합니다.']];
 for(const [stage,title,description]of labels){const article=document.createElement('article');const n=labels.findIndex(x=>x[0]===stage)+1;article.innerHTML=`<div><span>0${n}</span><h2>${title}</h2><p>${description}</p></div>`;const f=document.createElement('iframe');f.title=`단어력 ${title} — 직접 체험`;f.className="inline-service";f.loading='eager';f.dataset.ready='false';f.setAttribute('sandbox','allow-scripts allow-same-origin');const notice=document.createElement('p');notice.className='preview-error';notice.hidden=true;notice.textContent='미리보기를 불러오지 못했습니다. 설명은 계속 읽을 수 있습니다. 새로고침하거나 직접 체험을 다시 열어 주세요.';f.addEventListener('load',()=>{if(f.isConnected&&!hasAppRoot(f)){f.hidden=true;notice.hidden=false;}});f.src=params.has('failapp')?'/hogan-portfolio/presentation/missing.html':`/hogan-portfolio/presentation/index.html?${stage}&inline`;article.append(frameWindow(f,"words.demo",notice));$('#static-items').append(article);setTimeout(()=>{if(f.isConnected&&f.dataset.ready!=='true'){f.hidden=true;notice.hidden=false;}},10000);}
 document.body.dataset.mode='static';
}
function init(){nextWork=null;
 if(document.getElementById('static-gallery')){useFallback('');return;}
 try{
  if(params.has('failwebgl'))throw Error('Forced WebGL initialization failure');
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});renderer.setClearColor('#101214',0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;$('#webgl').append(renderer.domElement);
  contextLossHandler=e=>{e.preventDefault();metrics.contextLosses++;hardFailure=true;useFallback('3D 화면 연결이 끊겨 일반 목록으로 전환했습니다.');};renderer.domElement.addEventListener('webglcontextlost',contextLossHandler);
  scene=new THREE.Scene();scene.background=null;scene.add(new THREE.HemisphereLight('#efe2cb','#0a1315',2));const key=new THREE.DirectionalLight('#edeaf0',3);key.position.set(-800,800,1200);key.castShadow=true;key.shadow.mapSize.set(512,512);Object.assign(key.shadow.camera,{left:-1700,right:2000,top:1800,bottom:-1200,near:1,far:5000});key.shadow.bias=-.0003;key.shadow.normalBias=2;key.shadow.intensity=.38;key.shadow.radius=2;scene.add(key);const fill=new THREE.DirectionalLight('#68838a',1.2);fill.position.set(700,-400,200);scene.add(fill);
  frameMesh=new THREE.Mesh(new THREE.BoxGeometry(1046,726,12),new THREE.MeshStandardMaterial({color:'#262925',roughness:.86,metalness:.25}));frameMesh.castShadow=true;scene.add(frameMesh);if(!params.has('flatspace'))exhibition=createExhibitionSpace(scene,renderer);
  camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,1,10000);cssScene=new THREE.Scene();cssRenderer=new CSS3DRenderer();$('#space').append(cssRenderer.domElement);
  const el=document.createElement('div');el.className='app-object';el.dataset.loaded='false';document.body.dataset.appLoad='awaiting-ready';el.style.width='1040px';el.style.height='720px';iframe=document.createElement('iframe');iframe.src=params.has('failapp')?'/hogan-portfolio/presentation/missing.html':'/hogan-portfolio/presentation/index.html';iframe.title='단어력 원본 UI 자동 시연';iframe.style.opacity='0';iframe.tabIndex=-1;iframe.setAttribute('sandbox','allow-scripts allow-same-origin');const currentFrame=iframe;currentFrame.addEventListener('load',()=>{if(currentFrame===iframe&&!hasAppRoot(currentFrame)){hardFailure=true;useFallback('서비스 화면을 불러오지 못해 설명 목록으로 전환했습니다.');}});el.append(iframe);object=new CSS3DObject(el);cssScene.add(object);metrics.mode='3d-dom';document.body.dataset.mode='3d-dom';
  frameReadyTimer=setTimeout(()=>{if(!ready||iframe?.style.opacity==='0'){hardFailure=true;$('#load-state').textContent='원본 화면을 불러오지 못했습니다. 아래 설명과 직접 체험을 이용해 주세요.';useFallback('원본 화면 로딩이 지연되어 목록으로 전환했습니다.');}},10000);
  shown=target=scrollProgress();resize();
  // Commit the DOM plane once even while the introduction keeps WebGL offscreen.
  // CSS3DRenderer attaches iframe elements during render(), so skipping this
  // mount would expire the ready timer before the iframe can ever load.
  pose(shown);cssRenderer.render(cssScene,camera);document.body.dataset.wordUiMounted=String(object.element.isConnected);
 }catch(error){metrics.error=error.message;hardFailure=true;useFallback('3D를 사용할 수 없어 원본 화면을 일반 목록으로 보여드립니다.');}
}
window.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(manual&&e.source===$('#manual-container iframe')?.contentWindow&&e.data?.type==='words:exit'){exitPractice();return;}if(e.source===iframe?.contentWindow&&e.data?.type==='words:presented'){iframe.style.opacity='1';iframe.parentElement.dataset.loaded='true';document.body.dataset.appLoad='presented';clearTimeout(frameReadyTimer);$('#load-state').textContent='';}if(e.source===iframe?.contentWindow&&e.data?.type==='words:ready'){ready=true;document.body.dataset.appLoad='ready';sendWords(shown);requestFrame();}if(e.data?.type==='words:ready'&&e.source===$('#manual-container iframe')?.contentWindow){if(manualLoad?.ready())$('#manual-status').textContent='';}if(e.data?.type==='words:ready')document.querySelectorAll('#static-items iframe').forEach(f=>{if(e.source===f.contentWindow){f.dataset.ready='true';f.hidden=false;f.nextElementSibling.hidden=true;}});});
window.addEventListener('scroll',syncState,{passive:true});window.addEventListener('resize',resize);
for(const media of [small,reduced])media.addEventListener('change',reconcileMode);
document.querySelectorAll('[data-p]').forEach(b=>b.addEventListener('click',()=>jump(Number(b.dataset.p))));
function sectionIndex(){const p=scrollProgress();return p<.23?0:p<.72?1:wordHandoffActive(p)?3:2;}
$('#prev').onclick=()=>jump(anchors[Math.max(0,sectionIndex()-1)]);$('#next').onclick=()=>{if(wordHandoffActive(shown))enterSection('#db-story');else jump(anchors[Math.min(3,sectionIndex()+1)]);};
document.addEventListener('keydown',e=>{if(e.defaultPrevented||!canRender($('#words')))return;if(scrollY>$('#words').offsetTop+$('#words').offsetHeight-innerHeight+1)return;if(manual||fallback||e.altKey||e.metaKey||e.ctrlKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();$('#next').click();if(canRender($('#words')))$('#next').focus({preventScroll:true})}if(e.key==='ArrowLeft'){e.preventDefault();$('#prev').click();if(canRender($('#words')))($('#prev').disabled?$('#next'):$('#prev')).focus({preventScroll:true})}});
let wordReturnLayout='3d',wordRestoreVersion=0,wordExitPending=false;
const dialog=$('#practice-dialog');
function openPractice(push=true){
 if(manual)return;manual=true;wordExitPending=false;wordRestoreVersion++;
 wordReturnLayout=push?(fallback?'static':'3d'):(history.state?.layout||(fallback?'static':'3d'));
 returnFocus=document.activeElement;
 returnScroll=push?scrollY:(history.state?.returnY??Math.max(0,(fallback?$('#static-gallery'):$('#words')).offsetTop-(fallback?80:0)));
 document.body.dataset.returnScroll=String(returnScroll);document.documentElement.style.overflow='hidden';
 manualLoad?.dispose();
 const f=document.createElement('iframe');f.title='단어력 6쌍 직접 연습';f.setAttribute('sandbox','allow-scripts allow-same-origin');
 f.src=params.has('failapp')?'/hogan-portfolio/presentation/missing.html':'/hogan-portfolio/presentation/index.html?manual';
 manualLoad=watchManualFrameLoad({
  frame:f,isCurrent:()=>manual&&dialog.open&&$('#manual-container iframe')===f,hasRoot:hasAppRoot,
  onFailure:({wasFocused})=>{$('#manual-status').textContent='체험 화면을 불러오지 못했습니다. 체험을 닫고 다시 시도해 주세요.';if(wasFocused)$('#close-practice').focus({preventScroll:true})}
 });
 $('#manual-container').replaceChildren(f);$('#manual-status').textContent='연습 화면을 불러오고 있습니다.';
 dialog.showModal();$('#close-practice').focus({preventScroll:true});
 if(push){history.replaceState(history.state,'','#words');history.pushState({wordPractice:true,returnY:returnScroll,layout:wordReturnLayout},'','#words/practice');}
}
function closePractice(){
 if(!manual)return;manual=false;wordExitPending=false;manualLoad?.dispose();manualLoad=null;dialog.close();document.documentElement.style.overflow='';$('#manual-container').replaceChildren();$('#manual-status').textContent='';reconcileMode();
 const layout=fallback?'static':'3d',restoreY=layout===wordReturnLayout?returnScroll:Math.max(0,(fallback?$('#static-gallery'):$('#words')).offsetTop-(fallback?80:0));
 const opener=returnFocus?.isConnected&&['practice','static-practice'].includes(returnFocus.id)&&returnFocus.getClientRects().length?returnFocus:(fallback?$('#static-practice'):$('#practice'));
 const version=++wordRestoreVersion,restore=()=>{if(version!==wordRestoreVersion||manual||document.querySelector('dialog[open]'))return;scrollTo({top:restoreY,behavior:'instant'});opener.focus({preventScroll:true});document.body.dataset.restoredY=String(restoreY);syncState()};restore();requestAnimationFrame(restore);
}
function exitPractice(){if(!manual||wordExitPending)return;wordExitPending=true;if(history.state?.wordPractice)history.back();else{history.replaceState(null,'','#words');closePractice()}}
$('#practice').onclick=()=>{if(!fallback&&wordHandoffActive(shown))enterSection('#db-story');else openPractice()};const flowSteps=[...document.querySelectorAll('[data-word-stage]')];
const inlineWords=()=>document.querySelector('#static-items iframe');
function requestWordStage(stage){
 const frame=inlineWords();
 if(frame?.dataset.ready==='true')frame.contentWindow.postMessage({type:'words:stage',stage},location.origin);
}
if(!$('#static-gallery').hasAttribute('data-scroll-words'))for(const step of flowSteps)step.addEventListener('click',()=>requestWordStage(step.dataset.wordStage));
window.addEventListener('message',e=>{
 const frame=inlineWords();
 if(!frame||e.origin!==location.origin||e.source!==frame.contentWindow)return;
 if(e.data?.type==='words:ready')for(const step of flowSteps)step.disabled=false;
 if(e.data?.type==='words:stage')for(const step of flowSteps){
  if(step.dataset.wordStage===e.data.stage)step.setAttribute('aria-current','step');
  else step.removeAttribute('aria-current');
 }
});
$('#static-practice').onclick=()=>{
 const frame=inlineWords();
 if(frame?.dataset.ready!=='true'){openPractice();return;}
 frame.closest('.demo-window').scrollIntoView({block:'nearest'});
 frame.focus({preventScroll:true});
};$('#close-practice').onclick=exitPractice;dialog.addEventListener('cancel',e=>{e.preventDefault();exitPractice()});window.addEventListener('popstate',()=>{if(location.hash==='#words/practice')openPractice(false);else closePractice()});
document.addEventListener('hogan:motion',()=>{if(!canRender($('#words'))){wordWasRenderable=false;cancelAnimationFrame(raf);raf=0;previousFrame=0;}else requestFrame()});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);renderer?.dispose()});
window.HoGanPreview={getDiagnostics:()=>({...metrics,progress:target,manual,ready,drawCalls:renderer?.info.render.calls,triangles:renderer?.info.render.triangles,geometries:renderer?.info.memory.geometries,paused:!canRender($('#words'))}),jump};
function resetAmbient(){ambient.tx=ambient.ty=0;if(!fallback)requestFrame();}
window.addEventListener('pointermove',e=>{if(manual||document.querySelector('dialog[open]')||fallback||reduced.matches||!pointerFine.matches||scrollY>$('#words').offsetTop+$('#words').offsetHeight-innerHeight)return;ambient.tx=e.clientX/innerWidth*2-1;ambient.ty=1-e.clientY/innerHeight*2;requestFrame();},{passive:true});
window.addEventListener('pointerout',e=>{if(!e.relatedTarget)resetAmbient()});
window.addEventListener('blur',resetAmbient);
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetAmbient();else if(!fallback){shown=target=scrollProgress();requestFrame()}});
document.querySelectorAll('a[href="#words"]').forEach(a=>a.addEventListener('click',e=>{if(!fallback)return;e.preventDefault();if(location.hash!=='#words')history.pushState(null,'','#words');scrollTo({top:Math.max(0,$('#static-gallery').offsetTop-80),behavior:'instant'});}));
init();if(location.hash==='#words/practice')openPractice(false);











