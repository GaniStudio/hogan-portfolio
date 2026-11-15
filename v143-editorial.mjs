import {watchScene} from './scroll-motion-v198.mjs';
import {sheetDelayMs,previewPixelsPerMs,shuffleCells} from './v152-db-config.mjs';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
// The original table geometry and fixture values stay intact. Only the reveal
// state changes. Yellow is read from the original workbook's equal-to-1 rule.
const sheet=document.querySelector('[data-comparison="db"] .v139-sheet');
if(sheet){
 const all=[...sheet.querySelectorAll('tbody tr')].flatMap(row=>[...row.querySelectorAll('td')].slice(2));
 let visible=[];
 const pointer=sheet.querySelector('.v140-sheet-cursor');let timer=0,step=0,started=false;
 all.forEach(cell=>cell.dataset.sheetValue=cell.textContent);
 const finish=()=>{clearTimeout(timer);all.forEach(cell=>{cell.textContent=cell.dataset.sheetValue;cell.dataset.filled='true';});if(pointer)pointer.hidden=true;};
 watchScene(sheet,()=>{started=true;finish()});
 const paint=()=>{if(reduced.matches||document.hidden){finish();return;}const cell=visible[step++];if(!cell){finish();return;}cell.textContent=cell.dataset.sheetValue;cell.dataset.filled='true';if(pointer){pointer.hidden=false;const r=cell.getBoundingClientRect(),s=sheet.getBoundingClientRect();pointer.style.left=`${Math.max(4,Math.min(s.width-20,r.right-s.left-9))}px`;pointer.style.top=`${Math.max(38,Math.min(s.height-24,r.top-s.top+8))}px`;}sheet.dataset.filledCells=String(step);timer=setTimeout(paint,sheetDelayMs);};
 const start=()=>{if(started)return;started=true;if(reduced.matches){finish();return;}const viewport=sheet.querySelector('.v139-sheet-scroll').getBoundingClientRect();visible=all.filter(cell=>{const r=cell.getBoundingClientRect();return r.width>0&&r.left>=viewport.left&&r.right<=viewport.right&&r.top>=viewport.top&&r.bottom<=viewport.bottom;});visible=shuffleCells(visible);all.forEach(cell=>{cell.textContent='';cell.dataset.filled='false';});paint();};
 new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)start();},{threshold:.2}).observe(sheet);
 reduced.addEventListener('change',()=>{if(reduced.matches)finish();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&started)finish();});
}
// These are read-only, same-origin original-app previews, not live accounts.
for(const host of document.querySelectorAll('[data-comparison="db"] .v140-source-preview')){
 const iframe=host.querySelector('iframe');if(!iframe)continue;
 host.tabIndex=0;host.setAttribute('role','group');host.setAttribute('aria-label',iframe.title);
 let active=false,raf=0,previous=0;const getScroller=()=>iframe.contentDocument?.scrollingElement;
 const tick=t=>{raf=0;if(!active||reduced.matches||document.hidden)return;const s=getScroller();if(s){const dt=previous?Math.min(64,t-previous):0;s.scrollTop=Math.min(s.scrollHeight-s.clientHeight,s.scrollTop+dt*previewPixelsPerMs);host.dataset.previewScroll=String(Math.round(s.scrollTop));}previous=t;raf=requestAnimationFrame(tick);};
 const start=()=>{if(reduced.matches)return;active=true;previous=0;if(!raf)raf=requestAnimationFrame(tick);};
 const stop=()=>{active=false;cancelAnimationFrame(raf);raf=0;previous=0;const s=getScroller();if(s&&!reduced.matches)s.scrollTop=0;};
 host.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')start();});host.addEventListener('pointerleave',stop);
 host.addEventListener('focus',start);host.addEventListener('blur',stop);
 host.addEventListener('pointerup',e=>{if(e.pointerType==='touch')active?stop():start();});
 host.addEventListener('keydown',e=>{if(['Escape'].includes(e.key))stop();if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.key)){e.preventDefault();const s=getScroller();if(!s)return;const d=e.key==='ArrowDown'?80:e.key==='ArrowUp'?-80:e.key==='PageDown'?s.clientHeight*.8:e.key==='PageUp'?-s.clientHeight*.8:e.key==='Home'?-s.scrollHeight:s.scrollHeight;s.scrollTop+=d;}});
 host.addEventListener('wheel',e=>{if(!reduced.matches)return;const s=getScroller();if(s){const before=s.scrollTop;s.scrollTop+=e.deltaY;if(s.scrollTop!==before)e.preventDefault();}},{passive:false});
 iframe.addEventListener('load',()=>{iframe.inert=true;iframe.tabIndex=-1;if(active)start();});
 reduced.addEventListener('change',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
}
// v148: Editorial text is readable on first paint and never rewound by an observer.
document.querySelectorAll('.editorial-heading h2,.words-feature-heading h2,.vision-heading h2,#services-overview h2,#making>header h2,.words-feature-copy,.editorial-heading+.editorial-body').forEach(el=>el.dataset.entrance='static');
