import {concurrentSchedule,WORK_STRETCH} from './v153-intro-schedule.mjs';
import {ringPoint,cursorHotspot} from './agent-intro-path.mjs';
import {taskTiming,interpolate} from './agent-intro-layout.mjs';
import {localRect,overlaps,distanceToRect,cursorSize,safeTextPoint} from './v145-intro-geometry.mjs';
import {introProfile,sequentialTimes} from './v146-intro-profile.mjs';

await document.fonts.ready;
await import('./v153-v140-desktop-intro.mjs');
const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('ko',{granularity:'grapheme'}):null;
const intro=document.querySelector('#intro'),bridge=document.querySelector('#services-overview');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
if(false&&intro&&bridge&&!motion.matches&&(location.hash===''||location.hash==='#intro')&&scrollY<40&&document.documentElement.classList.contains('intro-pending')&&!window.__hoganIntroFinished){
 const speed=1/1.5,copyEnd=3360,lead=24*WORK_STRETCH;
 const cards=[...bridge.querySelector('.hero-previews').children];
 const text=[intro.querySelector('.intro-label'),intro.querySelector('#intro-title'),intro.querySelector('.intro-copy h2'),intro.querySelector('.intro-next'),intro.querySelector('.v134-career h2'),...intro.querySelectorAll('.v134-career dl>div'),intro.querySelector('.application-track'),intro.querySelector('.v144-operating-summary')].filter(Boolean);
 const heading=bridge.querySelector('h2');
 const layer=document.createElement('div');layer.className='agent-intro-layer';layer.ariaHidden='true';layer.inert=true;document.body.append(layer);
 const tasks=[],agents=[],wrappers=[],saved=[];let raf=0,t0=null,ended=false,dirty=true,size=cursorSize(innerWidth),blocked=[],observer,poolName=''; const pointer={x:null,y:null};let concurrentPlan=null;let scheduledEnd=0,scheduleVersion=0,scheduledVersion=-1;let orbitEnd=3360,sceneBottom=0,closingY=400,layoutWidth=innerWidth;const reads={measures:0,frameLayoutReads:0};window.__introGeometryReads=reads;function desktop(){return poolName==='desktop';}function onPointer(e){pointer.x=e.clientX;pointer.y=e.clientY;}
 const perf=/[?&]introperf(?:=1)?(?:&|$)/.test(location.search)?{frames:[],draw:[],setupStart:performance.now()}:null;if(perf)window.__introPerf=perf;
 const qa=/[?&]introqa(?:=1)?(?:&|$)/.test(location.search)?{clock:'real RAF, no seek',frames:[],reveals:[],tasks:[],events:[]}:null;
 if(qa)window.__introLiveRecord=qa;
 const colors=['#b9def2','#e6c6a4','#b7dfcb','#d6c7e9','#e8d3a6','#b4d6d8','#e4b9be','#c4d5a9','#b8c9ef','#ded0bb'];
 const icon='<svg viewBox="0 0 360 370" aria-hidden="true"><path d="M66 43 Q53 37 42 47 Q31 56 36 72 L117 321 Q121 338 138 339 Q155 340 163 324 L205 227 L305 183 Q324 175 325 159 Q325 142 307 135 Z" fill="#000" stroke="#fff" stroke-width="38" stroke-linejoin="round"/><path d="M66 43 Q53 37 42 47 Q31 56 36 72 L117 321 Q121 338 138 339 Q155 340 163 324 L205 227 L305 183 Q324 175 325 159 Q325 142 307 135 Z" fill="#000" stroke="#c7c7c7" stroke-width="20" stroke-linejoin="round"/></svg>';
 const styles=new WeakMap();function setStyle(el,key,value){let cache=styles.get(el);if(!cache){cache={};styles.set(el,cache);}if(cache[key]!==value){el.style[key]=value;cache[key]=value;}}
 function restore(el){const entry=saved.find(s=>s.el===el);if(entry&&!entry.restored){el.inert=entry.inert;el.style.pointerEvents=entry.pointer;entry.restored=true;}}
 function finish(reason='complete'){
  if(ended)return;ended=true;cancelAnimationFrame(raf);raf=0;
  for(const task of tasks)task.el.style.removeProperty('opacity');for(const span of wrappers)span.replaceWith(document.createTextNode(span.textContent||''));for(const s of saved)restore(s.el);
  layer.remove();observer?.disconnect();document.documentElement.classList.remove('intro-pending','intro-running');document.documentElement.dataset.introPhase='done';window.__hoganEndIntro?.(reason);
  window.removeEventListener('pointermove',onPointer);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onResize);window.removeEventListener('keydown',onKey,true);window.removeEventListener('pagehide',onLeave);visualViewport?.removeEventListener('resize',onResize);motion.removeEventListener('change',onMotion);
  if(perf){perf.finishedAt=performance.now();perf.reason=reason;}if(qa){qa.finishedAt=performance.now();qa.reason=reason;}delete window.__introController;
 }
 function onKey(e){if(['Tab','PageDown','ArrowDown',' ','End','Escape'].includes(e.key))finish('keyboard');}
 function onLeave(){finish('pagehide');}function onMotion(){if(motion.matches)finish('reduced-motion');}
 function onResize(){finish('resize');}
 function onScroll(){if(scrollY>sceneBottom+100)finish('past-scene');else wake();}
 function wrap(el){const nodes=[],walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walker.nextNode())nodes.push(walker.currentNode);const glyphs=[];const fine=el.matches('h1,h2,.intro-copy h2');for(const node of nodes){const f=document.createDocumentFragment(),parts=fine?(segmenter?[...segmenter.segment(node.nodeValue)].map(s=>s.segment):Array.from(node.nodeValue)):node.nodeValue.split(/(\s+)/u);for(const part of parts){if(!part)continue;if(/^\s+$/u.test(part)){f.append(document.createTextNode(part));continue;}const span=document.createElement('span');span.className='agent-typed-word';span.textContent=part;span.style.opacity='0';f.append(span);glyphs.push(span);wrappers.push(span);}node.replaceWith(f);}return glyphs;}
 function add(el,agent,kind,index){
  const glyphs=kind==='preview'?[]:wrap(el),time=taskTiming(index,glyphs.length,kind==='preview');
  const box=document.createElement('div');box.className='agent-build-box';box.style.opacity='0';layer.append(box);
  const task={id:tasks.length,el,agent,kind,glyphs,time,painted:0,scheduled:kind!=='preview',originalTime:{...time},completed:false,revealed:false,points:[],rect:null,box,surface:kind==='preview'||el.matches('.intro-next')};
  if(kind==='preview'){task.time=null;el.style.opacity='0';}else if(task.surface)el.style.opacity='0';
  // v153: restore the original top-left to bottom-right selection drag.
  task.trace=false;
  tasks.push(task);return task;
 }
 function assignPool(){
  const profile=introProfile(innerWidth);if(profile.name===poolName)return;
  const reflow=t0!==null;poolName=profile.name;
  for(const task of tasks){task.agent=profile.owners[task.id];if(task.kind!=='preview'){
   if(reflow&&task.glyphs.every(g=>g.style.opacity==='1'))task.completed=true;
   task.time={...task.originalTime};if(profile.name==='desktop'){const box=300+task.id*80,typeStart=box+380,step=task.glyphs.length>1?Math.min(65,900/(task.glyphs.length-1)):0;task.time={approach:Math.max(0,box-420),box,typeStart,step,done:typeStart+Math.max(0,task.glyphs.length-1)*step+24+140};}
  }}
  for(let owner=0;owner<profile.count;owner++){
   const jobs=tasks.filter(t=>t.agent===owner&&t.kind!=='preview');
   if(jobs.length>1){const offset=Math.min(160,jobs[0].originalTime.approach);jobs.forEach((t,i)=>t.time=sequentialTimes(t.originalTime,i,jobs.length,offset,copyEnd));}
  }
  for(const a of agents)a.el.remove();agents.length=0;
  for(let owner=0;owner<profile.count;owner++){
   const owned=tasks.filter(t=>t.agent===owner),el=document.createElement('div');el.className='agent-intro-cursor';el.dataset.agent=String(owner+1);el.dataset.target=String(owned[0].id);el.style.setProperty('--agent-color',colors[owner%colors.length]);el.innerHTML=icon+'<span>Agent '+String(owner+1).padStart(2,'0')+'</span>';el.style.opacity='0';layer.append(el);agents.push({el,tasks:owned,last:null,index:owner,done:-Infinity,doneVersion:-1});
  }
  layer.dataset.pool=profile.name;layer.dataset.agentCount=String(profile.count);
  if(window.__introController){window.__introController.targets=tasks.map(t=>({id:t.id,agent:t.agent+1,kind:t.kind}));window.__introController.count=profile.count;}
  if(qa)qa.events.push({type:'pool',pool:profile.name,count:profile.count,at:performance.now()});
 }
 function measure(){
  reads.measures++;layoutWidth=innerWidth;assignPool();
  size=cursorSize(innerWidth);const origin=layer.getBoundingClientRect();
  blocked=[];for(const el of [...intro.querySelectorAll('p,h1,h2,dt,dd,a'),heading,document.querySelector('.site-header')].filter(Boolean)){const range=document.createRange();range.selectNodeContents(el);for(const r of range.getClientRects())if(r.width&&r.height)blocked.push(localRect(r,origin));}
  for(const task of tasks){task.rect=localRect(task.el.getBoundingClientRect(),origin);task.glyphRects=task.glyphs.map(g=>localRect(g.getBoundingClientRect(),origin));if((task.kind==='heading'||(task.kind==='text'&&!task.surface))&&task.glyphRects.length){task.rect={left:Math.min(...task.glyphRects.map(g=>g.left)),right:Math.max(...task.glyphRects.map(g=>g.right)),top:Math.min(...task.glyphRects.map(g=>g.top)),bottom:Math.max(...task.glyphRects.map(g=>g.bottom))};}for(const g of task.glyphRects){task.rect.left=Math.min(task.rect.left,g.left);task.rect.right=Math.max(task.rect.right,g.right);task.rect.top=Math.min(task.rect.top,g.top);task.rect.bottom=Math.max(task.rect.bottom,g.bottom);}task.rect.width=task.rect.right-task.rect.left;task.rect.height=task.rect.bottom-task.rect.top;task.points=task.glyphRects.map(g=>safeTextPoint(g,task.rect,size,blocked,layoutWidth));}
  sceneBottom=Math.max(intro.getBoundingClientRect().bottom-origin.top,...cards.map(c=>c.getBoundingClientRect().bottom-origin.top))+72;closingY=Math.max(...text.map(e=>e.getBoundingClientRect().bottom-origin.top))+70;
  for(const a of agents){a.label=a.el.querySelector('span');const lr=a.label.getBoundingClientRect(),cs=getComputedStyle(a.label);a.labelBox={width:lr.width,height:lr.height,left:parseFloat(cs.left)||0,top:parseFloat(cs.top)||0};}
  if(!concurrentPlan){
   const reference=tasks.map(t=>{let time=t.time;if(t.kind==='preview'){const i=cards.indexOf(t.el),r=t.rect,inView=r.bottom-scrollY>72&&r.top-scrollY<innerHeight,box=desktop()||inView?1710+i*85:copyEnd+180;time={approach:box-180,box,typeStart:box+260,step:0,done:box+410};}return {id:t.id,agent:t.agent,time:{...time}};});
   concurrentPlan=concurrentSchedule(reference,{desktop:desktop(),minimumWorkEnd:desktop()?0:copyEnd});
   for(const plan of concurrentPlan.tasks){const task=tasks[plan.id];task.time=plan.time;task.scheduled=true;if(qa&&task.kind==='preview')qa.events.push({type:'preview-visible',task:task.id,at:performance.now(),time:task.time});}
   window.__introConcurrentSchedule=concurrentPlan;
  }
  // No layout reads after box and scene writes.
  for(const task of tasks)Object.assign(task.box.style,{left:task.rect.left+'px',top:task.rect.top+'px',width:task.rect.width+'px',height:task.rect.height+'px'});
  layer.style.height=sceneBottom+'px';scheduleVersion++;
  if(qa)qa.tasks=tasks.map(t=>({id:t.id,selector:t.el.id?'#'+t.el.id:t.el.className,agent:t.agent,kind:t.kind,time:{...t.time},glyphs:t.glyphs.map(g=>g.textContent),points:t.points,rect:t.rect}));
  dirty=false;
 }
 function activate(ms){
  for(const task of tasks){if(task.scheduled)continue;const r=task.rect;if(desktop()||ms>=copyEnd||(r.bottom-scrollY>72&&r.top-scrollY<innerHeight)){const index=cards.indexOf(task.el),box=Math.max(ms+180,1710+index*85);task.time={approach:box-180,box,typeStart:box+260,step:0,done:box+410};task.scheduled=true;scheduleVersion++;if(qa)qa.events.push({type:'preview-visible',task:task.id,at:performance.now(),time:task.time});}}
 }
 function traceMs(t){return t.boxDuration||Math.max(230,t.typeStart-t.box-40);}
 function pointFor(task,ms){
  const {rect:r,time:t}=task;let target;
  const start={x:r.left-3,y:r.top-3},end={x:r.right-3,y:r.bottom-3};
  if(ms>=t.box&&ms<t.typeStart)return interpolate(start,end,Math.max(0,Math.min(1,(ms-t.box)/traceMs(t))));
  if(ms<t.box)target=start;
  else if(task.kind==='preview')target={x:Math.max(2,r.right-size-3),y:r.top-size*1.03-.2};
  else{const index=t.step?Math.min(task.points.length-1,Math.max(0,Math.floor((ms-t.typeStart)/t.step))):0;target=task.points[index]||task.points.find(Boolean);}
  if(!target)return null;
  if(ms<t.box){const from={x:Math.max(2,Math.min(layoutWidth-size,target.x+(target.x>innerWidth/2?34:-34))),y:target.y+8};return interpolate(from,target,(ms-t.approach)/(t.box-t.approach));}
  return target;
 }
 function closing(agent,index,ms){
 // v151: each cursor waits beside its finished box; when every box is done they gather on one centre ring together and close into the centre.
 if(agent.doneVersion!==scheduleVersion){agent.done=-Infinity;for(const t of agent.tasks)if(t.scheduled)agent.done=Math.max(agent.done,t.time.done);agent.doneVersion=scheduleVersion;}const done=agent.done;if(!Number.isFinite(done)||ms<done+120*WORK_STRETCH||!agent.last)return false;
 const hs=cursorHotspot(20),gather=orbitEnd-1600-520+120;
 if(ms<gather){setStyle(agent.el,'transform','translate('+agent.last.x+'px,'+agent.last.y+'px)');setStyle(agent.el,'opacity','1');if(agent.phase!=='hold'){agent.el.dataset.phase='hold';agent.phase='hold';}if(qa)qa.frames.push({agent:index,at:performance.now(),logical:ms,x:agent.last.x,y:agent.last.y,visible:true,phase:'hold'});return true;}
 const center={x:layoutWidth/2,y:Math.min(scrollY+innerHeight-100,closingY)};
 const slot=ringPoint(center,index,agents.length,ms-concurrentPlan.workShift,46,1600);let p=interpolate(agent.last,{x:slot.x-hs.x,y:slot.y-hs.y},(ms-gather)/520);
 const fade=ms>orbitEnd?Math.min(1,(ms-orbitEnd)/360):0;p.x-=(slot.x-center.x)*fade;p.y-=(slot.y-center.y)*fade;
 setStyle(agent.el,'transform','translate('+p.x+'px,'+p.y+'px)');setStyle(agent.el,'opacity',String(1-fade));const phase=fade?'group-exit':'orbit';if(agent.phase!==phase){agent.el.dataset.phase=phase;agent.phase=phase;}setStyle(agent.label,'visibility','hidden');
 if(qa)qa.frames.push({agent:index,at:performance.now(),logical:ms,x:p.x,y:p.y,visible:fade<1,phase});return true;
 }
 function draw(ms){
  if(dirty)measure();activate(ms);let active=false;if(scheduledVersion!==scheduleVersion){scheduledEnd=0;for(const task of tasks)if(task.scheduled)scheduledEnd=Math.max(scheduledEnd,task.time.done);scheduledVersion=scheduleVersion;}if(desktop())orbitEnd=concurrentPlan.workEnd+2000;
  for(const task of tasks){if(!task.scheduled||task.retired)continue;const {time:t}=task;
   if(task.completed){task.box.style.opacity='0';if(task.surface)task.el.style.opacity='1';restore(task.el);task.retired=true;continue;}
   if(!task.arrived&&ms>=t.typeStart){task.arrived=true;if(qa)qa.events.push({type:'arrival',task:task.id,at:performance.now(),logical:ms,late:true});}
   if(task.arrived&&ms>=t.typeStart){if(!task.revealMarked){task.el.dataset.introVisible='true';task.revealMarked=true;}}
   const progress=interpolate({x:0,y:0},{x:1,y:1},Math.max(0,Math.min(1,(ms-t.box)/traceMs(t)))).x;
   setStyle(task.box,'transform','scale('+progress+','+progress+')');
   setStyle(task.box,'opacity',ms>=t.box&&ms<t.typeStart?'.8':'0');
   if(task.surface){task.revealed=task.revealed||(task.arrived&&ms>=t.typeStart);setStyle(task.el,'opacity',task.revealed?'1':'0');}
   if(task.arrived){const upto=t.step?Math.min(task.glyphs.length,Math.max(0,Math.floor((ms-t.typeStart-lead)/t.step)+1)):ms>=t.typeStart+lead?task.glyphs.length:0;for(;task.painted<upto;task.painted++){const j=task.painted,g=task.glyphs[j];g.style.opacity='1';if(qa)qa.reveals.push({task:task.id,glyph:j,text:g.textContent,at:performance.now(),logical:ms});}}

   if(ms>=t.done)restore(task.el);if(task.arrived&&ms>=t.done+120*WORK_STRETCH)task.completed=true;
   if(ms>=t.approach&&ms<t.done+120*WORK_STRETCH)active=true;
  }
  for(const [agentIndex,agent] of agents.entries()){if(desktop()&&closing(agent,agentIndex,ms)){active=true;continue;}let task;for(const t of agent.tasks)if(t.scheduled&&!t.completed&&ms>=t.time.approach&&ms<=t.time.done+120*WORK_STRETCH)task=t;if(!task){setStyle(agent.el,'opacity','0');continue;}if(agent.target!==task.id){agent.el.dataset.target=String(task.id);agent.target=task.id;}const p=pointFor(task,ms);if(!p){setStyle(agent.el,'opacity','0');continue;}
   const r={left:p.x,right:p.x+size,top:p.y,bottom:p.y+size*1.03};const tracing=ms>=task.time.box&&ms<task.time.typeStart;
   const hitKey=task.id+','+p.x+','+p.y+','+tracing+','+(ms>=task.time.box)+','+scheduleVersion;let safe;if(agent.hitKey===hitKey)safe=agent.hitSafe;else{safe=(tracing&&ms>=task.time.box)||distanceToRect(p,task.rect)<=50&&!blocked.some(b=>overlaps(r,b)&&!(tracing&&b.left>=task.rect.left-1&&b.right<=task.rect.right+1&&b.top>=task.rect.top-1&&b.bottom<=task.rect.bottom+1));agent.hitKey=hitKey;agent.hitSafe=safe;}
   setStyle(agent.el,'transform',`translate(${p.x}px,${p.y}px)`);agent.last=p;if(safe&&ms>=task.time.box){if(!task.arrived&&qa)qa.events.push({type:'arrival',task:task.id,at:performance.now(),logical:ms});task.arrived=true;}if(agent.phase!=='work'){agent.el.dataset.phase='work';agent.phase='work';}setStyle(agent.el,'opacity',safe?(desktop()?'1':String(Math.min(1,(task.time.done+120*WORK_STRETCH-ms)/(120*WORK_STRETCH)))):'0');
   const label=agent.label,lb=agent.labelBox,labelRect={left:p.x+lb.left,right:p.x+lb.left+lb.width,top:p.y+lb.top,bottom:p.y+lb.top+lb.height};if(agent.labelX!==p.x||agent.labelY!==p.y||agent.labelVersion!==scheduleVersion){setStyle(label,'visibility',labelRect.left<0||labelRect.right>layoutWidth||blocked.some(b=>overlaps(labelRect,b))?'hidden':'visible');agent.labelX=p.x;agent.labelY=p.y;agent.labelVersion=scheduleVersion;}
   if(qa)qa.frames.push({task:task.id,agent:task.agent,at:performance.now(),logical:ms,x:p.x,y:p.y,visible:safe,phase:ms<task.time.done?'work':'exit'});
  }
  if(desktop()&&ms>=orbitEnd+360){finish('group-exit');return false;}const phase=desktop()&&ms>=concurrentPlan.workEnd?'orbit':ms<concurrentPlan.workEnd?'copy':active?'preview':'waiting';if(document.documentElement.dataset.introPhase!==phase)document.documentElement.dataset.introPhase=phase;
  if(!desktop()&&ms>=concurrentPlan.workEnd&&tasks.every(t=>t.scheduled&&(t.completed||ms>=t.time.done+120*WORK_STRETCH))){finish();return false;}
  return desktop()||ms<copyEnd||active;
 }
 // v151: the first frame after the layer appears can stall; the clock does not count that one stall, so the first boxes are not skipped. Later frames run in real time.
 let lastNow=null,clock=0,frameNo=0;
 function loop(now){raf=0;if(ended)return;if(t0==null){t0=now;if(qa)qa.startedAt=now;}else clock+=frameNo<2?Math.min(now-lastNow,50):now-lastNow;if(perf&&lastNow!==null)perf.frames.push(now-lastNow);lastNow=now;frameNo++;const drawStart=perf?performance.now():0,again=draw(clock*speed);if(perf)perf.draw.push(performance.now()-drawStart);if(again)raf=requestAnimationFrame(loop);}
 function wake(){if(!ended&&!raf)raf=requestAnimationFrame(loop);}
 try{
  for(const el of [intro.querySelector('.intro-next'),...cards]){saved.push({el,inert:el.inert,pointer:el.style.pointerEvents});el.inert=true;el.style.pointerEvents='none';}
  text.forEach((el,i)=>add(el,i,'text',i));cards.forEach((el,i)=>add(el,text.length+i,'preview',i));add(heading,text.length+cards.length,'heading',text.length);
  measure();document.documentElement.classList.add('intro-running');document.documentElement.classList.remove('intro-pending');
  window.addEventListener('pointermove',onPointer,{passive:true});window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onResize);visualViewport?.addEventListener('resize',onResize);window.addEventListener('keydown',onKey,true);window.addEventListener('pagehide',onLeave,{once:true});motion.addEventListener('change',onMotion);
  // Geometry is measured once after fonts. No per-frame reads or resize feedback.

  window.__introController={count:agents.length,targets:tasks.map(t=>({id:t.id,agent:t.agent+1,kind:t.kind})),schedule:concurrentPlan,startedAt:()=>t0,finish:()=>finish('manual')};if(perf)perf.setupEnd=performance.now();wake();
 }catch(error){finish('error');}
}else {document.documentElement.classList.remove('intro-pending','intro-running');window.__hoganEndIntro?.('skipped');}
