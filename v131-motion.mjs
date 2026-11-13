const motion=matchMedia('(prefers-reduced-motion: reduce)');
const exhibit=document.querySelector('.code-workbench');
if(exhibit){
 const buttons=[...exhibit.querySelectorAll('button')];
 const panels=[...exhibit.querySelectorAll('[data-code-panel]')];
 let chosen=0;
 function select(i){
  if(chosen===i)return;
  chosen=i;
  buttons.forEach((node,j)=>node.setAttribute('aria-pressed',String(i===j)));
  panels.forEach((panel,j)=>panel.hidden=i!==j);
  if(!motion.matches)panels[i].animate([{opacity:.3,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:700,easing:'cubic-bezier(.32,.72,0,1)'});
 }
 buttons.forEach((button,i)=>button.addEventListener('click',()=>select(i)));
 let queued=false;
 window.addEventListener('scroll',()=>{
  if(queued||motion.matches)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;const box=exhibit.getBoundingClientRect();if(box.top>=innerHeight||box.bottom<=0)return;const phase=Math.floor((innerHeight*.72-box.top)/(box.height+innerHeight*.3)*panels.length);select(Math.min(panels.length-1,Math.max(0,phase)));});
 },{passive:true});
}
const words=document.querySelector('.words-step-copy');
if(words?.previousElementSibling){
 const nav=words.previousElementSibling;
 const update=()=>{
  const copy=nav.querySelector('[aria-current=step]')?.dataset.copy??'';
  if(words.textContent===copy)return;
  words.textContent=copy;
  if(!motion.matches)words.animate([{opacity:.35},{opacity:1}],{duration:420});
 };
 new MutationObserver(update).observe(nav,{subtree:true,attributes:true,attributeFilter:['aria-current']});update();
}
for(const id of ['words-story','db-story','db-decision','lms-story']){
 const section=document.getElementById(id);
 if(!section)continue;
 const list=section.querySelector('.editorial-body,.db-story-copy');
 if(!list)continue;
 const elements=[...list.children].filter(node=>node.matches('.story-beat,article')).filter(node=>!node.closest('.editorial-lessons'));
 if(!elements.length)continue;
 const details=document.createElement('details');
 details.className='v133-story-details';
 const summary=document.createElement('summary');
 summary.textContent='자세히 보기';
 details.append(summary);
 const labels={
  'words-story':['이전에는','지금은','운영하며 고친 점'],
  'db-story':['이전에는','지금은'],
  'db-decision':['결과','운영하며 고친 점'],
  'lms-story':['이전에는','지금은','결과']
 }[id];
 const outline=document.createElement('dl');outline.className='v133-story-outline';
 elements.slice(0,labels.length).forEach((node,i)=>{
  const copy=node.querySelector('.story-beat-text,p')?.textContent?.trim();
  if(!copy)return;
  const row=document.createElement('div');
  const label=document.createElement('dt');label.textContent=labels[i];
  const value=document.createElement('dd');
  value.textContent=copy.match(/^.*?다[.!?](?=\s|$)/)?.[0]??copy;
  row.append(label,value);outline.append(row);
 });
 elements[0].before(outline,details);
 details.append(...elements);
}
const observer=new IntersectionObserver(entries=>{
 for(const {target,isIntersecting} of entries){
  if(!isIntersecting)continue;
  observer.unobserve(target);
  if(motion.matches)continue;
  if(target.matches('h2')&&!target.children.length){
   const source=target.textContent;
   target.setAttribute('aria-label',source);
   target.replaceChildren(...source.split(/(\s+)/).filter(Boolean).map((token,i)=>{
    if(!token.trim())return document.createTextNode(token);
    const span=document.createElement('span');span.textContent=token;span.style.display='inline-block';
    span.animate([{opacity:0,filter:'blur(10px)',translate:'0 25px'},{opacity:1,filter:'none',translate:'0 0'}],{duration:900,delay:Math.floor(i/2)*25,easing:'cubic-bezier(.25,.46,.45,.94)',fill:'backwards'});
    return span;
   }));
  }else{
   target.animate([{opacity:0,translate:'0 8px',filter:target.matches('.words-feature-copy')?'blur(6px)':'none'},{opacity:1,translate:'0 0',filter:'none'}],{duration:target.matches('.words-feature-copy')?600:420,delay:target.matches('.words-feature-copy')?100:[...target.parentElement.children].indexOf(target)*60,easing:'cubic-bezier(.25,.46,.45,.94)',fill:'backwards'});
  }
 }
},{threshold:.16});
for(const target of document.querySelectorAll('.words-feature-heading h2,.words-feature-copy,.release-log h2,.release-log article,.reader-quotes blockquote,.closing-statement h2,.hero-declaration dl > div,.story-panel-row,.story-panel-metric,.v133-story-outline > div,.words-feature-steps button,#making tbody tr'))observer.observe(target);
document.querySelector('[data-teacher-view]')?.addEventListener('click',()=>{
 const dialog=document.querySelector('.teacher-preview');
 const frame=dialog.querySelector('iframe');
 if(!frame.hasAttribute('src'))frame.src=frame.dataset.teacherSrc;
 dialog.showModal();
});
