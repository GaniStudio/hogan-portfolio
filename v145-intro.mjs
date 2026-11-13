import {taskTiming,interpolate} from './agent-intro-layout.mjs';
import {localRect,overlaps,distanceToRect,cursorSize,safeTextPoint} from './v145-intro-geometry.mjs';

const intro=document.querySelector('#intro'),bridge=document.querySelector('#services-overview');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
if(intro&&bridge&&!motion.matches&&(location.hash===''||location.hash==='#intro')&&scrollY<40&&document.documentElement.classList.contains('intro-pending')){
 const speed=1/1.5,copyEnd=3360,lead=24;
 const cards=[...bridge.querySelector('.hero-previews').children];
 const text=[intro.querySelector('.intro-label'),intro.querySelector('#intro-title'),intro.querySelector('.intro-copy h2'),intro.querySelector('.intro-next'),intro.querySelector('.v134-career h2'),...intro.querySelectorAll('.v134-career dl>div'),intro.querySelector('.application-track'),intro.querySelector('.v144-operating-summary')].filter(Boolean);
 const heading=bridge.querySelector('h2');
 const layer=document.createElement('div');layer.className='agent-intro-layer';layer.ariaHidden='true';layer.inert=true;document.body.append(layer);
 const tasks=[],agents=[],wrappers=[],saved=[];let raf=0,t0=null,ended=false,dirty=true,size=cursorSize(innerWidth),blocked=[],observer;
 const qa=/[?&]introqa(?:=1)?(?:&|$)/.test(location.search)?{clock:'real RAF, no seek',frames:[],reveals:[],tasks:[],events:[]}:null;
 if(qa)window.__introLiveRecord=qa;
 const icon='<svg viewBox="0 0 360 370" aria-hidden="true"><path d="M66 43 Q53 37 42 47 Q31 56 36 72 L117 321 Q121 338 138 339 Q155 340 163 324 L205 227 L305 183 Q324 175 325 159 Q325 142 307 135 Z" fill="#000" stroke="#fff" stroke-width="38" stroke-linejoin="round"/><path d="M66 43 Q53 37 42 47 Q31 56 36 72 L117 321 Q121 338 138 339 Q155 340 163 324 L205 227 L305 183 Q324 175 325 159 Q325 142 307 135 Z" fill="#000" stroke="#c7c7c7" stroke-width="20" stroke-linejoin="round"/></svg>';
 function restore(el){const entry=saved.find(s=>s.el===el);if(entry&&!entry.restored){el.inert=entry.inert;el.style.pointerEvents=entry.pointer;entry.restored=true;}}
 function finish(reason='complete'){
  if(ended)return;ended=true;cancelAnimationFrame(raf);raf=0;
  for(const task of tasks)task.el.style.removeProperty('opacity');for(const span of wrappers)span.replaceWith(document.createTextNode(span.textContent||''));for(const s of saved)restore(s.el);
  layer.remove();observer?.disconnect();document.documentElement.classList.remove('intro-pending');document.documentElement.dataset.introPhase='done';
  window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onResize);window.removeEventListener('keydown',onKey,true);window.removeEventListener('pagehide',onLeave);visualViewport?.removeEventListener('resize',onResize);motion.removeEventListener('change',onMotion);
  if(qa){qa.finishedAt=performance.now();qa.reason=reason;}delete window.__introController;
 }
 function onKey(e){if(['Tab','PageDown','ArrowDown',' ','End','Escape'].includes(e.key))finish('keyboard');}
 function onLeave(){finish('pagehide');}function onMotion(){if(motion.matches)finish('reduced-motion');}
 function onResize(){dirty=true;wake();}
 function onScroll(){dirty=true;if(scrollY>layer.offsetHeight+100)finish('past-scene');else wake();}
 function wrap(el){const nodes=[],walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walker.nextNode())nodes.push(walker.currentNode);const glyphs=[];const fine=el.matches('h1,h2,.intro-copy h2');for(const node of nodes){const f=document.createDocumentFragment(),parts=fine?(typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('ko',{granularity:'grapheme'}).segment(node.nodeValue)].map(s=>s.segment):Array.from(node.nodeValue)):node.nodeValue.split(/(\s+)/u);for(const part of parts){if(!part)continue;if(/^\s+$/u.test(part)){f.append(document.createTextNode(part));continue;}const span=document.createElement('span');span.className='agent-typed-word';span.textContent=part;span.style.opacity='0';f.append(span);glyphs.push(span);wrappers.push(span);}node.replaceWith(f);}return glyphs;}
 function add(el,agent,kind,index){
  const glyphs=kind==='preview'?[]:wrap(el),time=taskTiming(index,glyphs.length,kind==='preview');
  const box=document.createElement('div');box.className='agent-build-box';box.style.opacity='0';layer.append(box);
  const task={id:tasks.length,el,agent,kind,glyphs,time,scheduled:kind!=='preview',points:[],rect:null,box,surface:kind==='preview'||el.matches('.intro-next')};
  if(kind==='preview'){task.time=null;el.style.opacity='0';}else if(task.surface)el.style.opacity='0';
  tasks.push(task);return task;
 }
 function measure(){
  size=cursorSize(innerWidth);const origin=layer.getBoundingClientRect();
  blocked=[];for(const el of [...intro.querySelectorAll('p,h1,h2,dt,dd,a'),heading,document.querySelector('.site-header')].filter(Boolean)){const range=document.createRange();range.selectNodeContents(el);for(const r of range.getClientRects())if(r.width&&r.height)blocked.push(localRect(r,origin));}
  for(const task of tasks){task.rect=localRect(task.el.getBoundingClientRect(),origin);task.glyphRects=task.glyphs.map(g=>localRect(g.getBoundingClientRect(),origin));for(const g of task.glyphRects){task.rect.left=Math.min(task.rect.left,g.left);task.rect.right=Math.max(task.rect.right,g.right);task.rect.top=Math.min(task.rect.top,g.top);task.rect.bottom=Math.max(task.rect.bottom,g.bottom);}task.rect.width=task.rect.right-task.rect.left;task.rect.height=task.rect.bottom-task.rect.top;task.points=task.glyphRects.map(g=>safeTextPoint(g,task.rect,size,blocked,layer.clientWidth));Object.assign(task.box.style,{left:task.rect.left+'px',top:task.rect.top+'px',width:task.rect.width+'px',height:task.rect.height+'px'});}
  layer.style.height=Math.max(intro.getBoundingClientRect().bottom-origin.top,...cards.map(c=>c.getBoundingClientRect().bottom-origin.top))+72+'px';
  if(qa)qa.tasks=tasks.map(t=>({id:t.id,selector:t.el.id?'#'+t.el.id:t.el.className,agent:t.agent,kind:t.kind,glyphs:t.glyphs.map(g=>g.textContent),points:t.points,rect:t.rect}));
  dirty=false;
 }
 function activate(ms){
  for(const task of tasks.filter(t=>!t.scheduled)){const r=task.el.getBoundingClientRect();if(r.bottom>72&&r.top<innerHeight){const index=cards.indexOf(task.el),box=Math.max(ms+180,1710+index*85);task.time={approach:box-180,box,typeStart:box+260,step:0,done:box+410};task.scheduled=true;if(qa)qa.events.push({type:'preview-visible',task:task.id,at:performance.now(),time:task.time});}}
 }
 function pointFor(task,ms){
  const {rect:r,time:t}=task;let target;
  if(task.kind==='preview')target={x:Math.max(2,r.right-size-3),y:r.top-size*1.03-.2};
  else{const index=t.step?Math.min(task.points.length-1,Math.max(0,Math.floor((ms-t.typeStart)/t.step))):0;target=task.points[index]||task.points.find(Boolean);}
  if(!target)return null;
  if(ms<t.box){const from={x:Math.max(2,Math.min(layer.clientWidth-size,target.x+(target.x>innerWidth/2?34:-34))),y:target.y+8};return interpolate(from,target,(ms-t.approach)/(t.box-t.approach));}
  return target;
 }
 function draw(ms){
  if(dirty)measure();activate(ms);let active=false;
  for(const task of tasks){if(!task.scheduled)continue;const {time:t}=task;
   const progress=Math.max(0,Math.min(1,(ms-t.box)/230));task.box.style.transform=`scale(${progress},${progress})`;task.box.style.opacity=ms>=t.box&&ms<t.typeStart?'.8':'0';
   if(task.surface)task.el.style.opacity=ms>=t.typeStart?'1':'0';
   task.glyphs.forEach((g,j)=>{const visible=ms>=t.typeStart+j*t.step+lead;if(qa&&visible&&g.style.opacity!=='1')qa.reveals.push({task:task.id,glyph:j,text:g.textContent,at:performance.now(),logical:ms});g.style.opacity=visible?'1':'0';});
   if(ms>=t.done)restore(task.el);
   if(ms>=t.approach&&ms<t.done+120)active=true;
  }
  for(const agent of agents){const task=agent.task;if(!task.scheduled||ms<task.time.approach||ms>task.time.done+120){agent.el.style.opacity='0';continue;}const p=pointFor(task,ms);if(!p){agent.el.style.opacity='0';continue;}
   const r={left:p.x,right:p.x+size,top:p.y,bottom:p.y+size*1.03};const safe=distanceToRect(p,task.rect)<=50&&!blocked.some(b=>overlaps(r,b));
   agent.el.style.transform=`translate(${p.x}px,${p.y}px)`;agent.el.style.opacity=safe?String(Math.min(1,(task.time.done+120-ms)/120)):'0';
   const label=agent.el.querySelector('span');label.style.visibility='visible';const origin=layer.getBoundingClientRect(),labelRect=localRect(label.getBoundingClientRect(),origin);if(labelRect.left<0||labelRect.right>layer.clientWidth||blocked.some(b=>overlaps(labelRect,b)))label.style.visibility='hidden';
   if(qa)qa.frames.push({task:task.id,agent:task.agent,at:performance.now(),logical:ms,x:p.x,y:p.y,visible:safe,phase:ms<task.time.done?'work':'exit'});
  }
  document.documentElement.dataset.introPhase=ms<copyEnd?'copy':active?'preview':'waiting';
  if(ms>=copyEnd&&tasks.every(t=>t.scheduled&&ms>=t.time.done+120)){finish();return false;}
  return ms<copyEnd||active;
 }
 function loop(now){raf=0;if(ended)return;if(t0==null){t0=now;if(qa)qa.startedAt=now;}if(draw((now-t0)*speed))raf=requestAnimationFrame(loop);}
 function wake(){if(!ended&&!raf)raf=requestAnimationFrame(loop);}
 try{
  for(const el of [intro.querySelector('.intro-next'),...cards]){saved.push({el,inert:el.inert,pointer:el.style.pointerEvents});el.inert=true;el.style.pointerEvents='none';}
  text.forEach((el,i)=>add(el,i,'text',i));cards.forEach((el,i)=>add(el,text.length+i,'preview',i));add(heading,text.length+cards.length,'heading',text.length);
  const colors=['#b9def2','#e6c6a4','#b7dfcb','#d6c7e9','#e8d3a6','#b4d6d8','#e4b9be','#c4d5a9','#b8c9ef','#ded0bb'];
  for(const task of tasks){const el=document.createElement('div');el.className='agent-intro-cursor';el.dataset.agent=String(task.agent+1);el.dataset.target=String(task.id);el.style.setProperty('--agent-color',colors[task.agent%colors.length]);el.innerHTML=icon+'<span>Agent '+String(task.agent+1).padStart(2,'0')+'</span>';el.style.opacity='0';layer.append(el);agents.push({el,task});}
  measure();document.documentElement.classList.remove('intro-pending');
  window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onResize);visualViewport?.addEventListener('resize',onResize);window.addEventListener('keydown',onKey,true);window.addEventListener('pagehide',onLeave,{once:true});motion.addEventListener('change',onMotion);
  observer=new ResizeObserver(onResize);observer.observe(intro);observer.observe(bridge);document.fonts.ready.then(()=>{if(!ended){dirty=true;wake();}});
  window.__introController={targets:tasks.map(t=>({id:t.id,agent:t.agent+1,kind:t.kind})),startedAt:()=>t0,finish:()=>finish('manual')};wake();
 }catch(error){finish('error');}
}else document.documentElement.classList.remove('intro-pending');
