// QA-only recorder: not loaded by the production page.
let running=false,raf=0,seen=new WeakSet(),last=new WeakMap(),drops=[],samples=0,nodes=[],ids=new WeakMap();
const excluded=el=>el.closest('#intro,#services-overview,.service-scroll-track,.words-scroll-track,[aria-hidden="true"],dialog,.agent-layer,[data-agent]');
export function start(){stop();seen=new WeakSet();last=new WeakMap();drops=[];samples=0;nodes=[...document.querySelectorAll('h1,h2,h3,p,blockquote,li,dd,dt,strong')].filter(el=>el.textContent.trim()&&!excluded(el));nodes.forEach((el,i)=>ids.set(el,i));running=true;tick();return {elements:nodes.length};}
function tick(){if(!running)return;samples++;for(const el of nodes){const r=el.getBoundingClientRect();if(!r.width||!r.height||r.bottom<=84||r.top>=innerHeight||r.right<=0||r.left>=innerWidth)continue;let opacity=1,visible=true;for(let a=el;a&&a!==document.documentElement;a=a.parentElement){const c=getComputedStyle(a);opacity*=Number(c.opacity);if(c.display==='none'||c.visibility==='hidden'){visible=false;break;}}if(!visible)continue;if(opacity>=.8)seen.add(el);if(seen.has(el)&&opacity<=.25&&last.get(el)!=='low'){drops.push({id:ids.get(el),tag:el.tagName,text:el.textContent.trim().slice(0,90),opacity,y:r.top,scrollY,time:performance.now()});last.set(el,'low');}else if(opacity>.25)last.set(el,'high');}raf=requestAnimationFrame(tick);}
export function snapshot(){return {elements:nodes.length,samples,drops:[...drops],running};}
export function stop(){running=false;cancelAnimationFrame(raf);return snapshot();}
window.hoganTextAudit={start,snapshot,stop};
