const compact=matchMedia('(max-width:1099px), (pointer:coarse)');
const frames=[...document.querySelectorAll('.v175-scene iframe[data-v167-src]')];
const buttons=new Map();
for(const frame of frames){
  const replay=document.createElement('button');
  replay.type='button';replay.className='v179-mobile-replay';replay.textContent='다시 재생 ↻';
  const service=frame.title.startsWith('db')?'통합 DB':frame.title.startsWith('lms')?'100일 챌린지 LMS':'단어력 테스트';
  replay.setAttribute('aria-label',service+' 과거 작업 과정 다시 재생');
  frame.after(replay);buttons.set(frame,replay);
  let lastReplay=-Infinity;
  replay.addEventListener('click',()=>{const now=performance.now();if(now-lastReplay<300)return;lastReplay=now;frame.contentWindow?.postMessage('v167-play',location.origin);});
  frame.addEventListener('load',()=>configure(frame));
}
function configure(frame){
  const doc=frame.contentDocument;if(!doc?.body||doc.URL==='about:blank')return;
  let style=doc.getElementById('v179-touch-layout');
  if(!style){style=doc.createElement('style');style.id='v179-touch-layout';doc.head.append(style);}
  style.textContent=compact.matches?'#r{display:none!important}body{padding-bottom:0!important}':'';
  frame.tabIndex=compact.matches?-1:0;
  frame.setAttribute('scrolling','no');
}
function sync(){
  frames.forEach(frame=>{
    // Tiny local scene documents are loaded after the intro, before a long
    // default iframe placeholder can become part of the swipe path.
    if(compact.matches&&!frame.hasAttribute('src')){frame.loading='eager';frame.src=frame.dataset.v167Src+'?v184';}
    configure(frame);
  });
  for(const frame of document.querySelectorAll('iframe.inline-service')){
    const body=frame.closest('.demo-window-body');if(!body)continue;
    let pan=body.querySelector('.v179-pan-surface');
    if(compact.matches){if(!pan){pan=document.createElement('div');pan.className='v179-pan-surface';pan.setAttribute('aria-hidden','true');body.append(pan);}}
    else pan?.remove();
  }
}
compact.addEventListener('change',sync);
sync();
