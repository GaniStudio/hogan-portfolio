for(const nav of document.querySelectorAll('.words-scroll-stage .words-feature-steps,.service-scroll-stage .words-feature-steps')){
 const buttons=[...nav.querySelectorAll('button')];
 if(!buttons.length)continue;
 const host=nav.parentElement;
 host.classList.add('v138-enhanced');
 const label=document.createElement('label');
 label.className='v138-compact-steps';
 const select=document.createElement('select');
 select.setAttribute('aria-label',nav.getAttribute('aria-label')||'시연 단계');
 const progress=document.createElement('progress');
 progress.max=buttons.length;
 progress.setAttribute('aria-label','시연 진행');
 buttons.forEach((button,index)=>{
  const title=button.textContent.trim().replace(/^\d+\s*/,'');
  select.add(new Option(title+' '+String(index+1).padStart(2,'0')+' / '+String(buttons.length).padStart(2,'0'),String(index)));
 });
 const update=()=>{
  const active=Math.max(0,buttons.findIndex(button=>button.getAttribute('aria-current')==='step'));
  select.value=String(active);
  progress.value=active+1;
 };
 select.addEventListener('change',()=>buttons[Number(select.value)]?.click());
 new MutationObserver(update).observe(nav,{attributes:true,subtree:true,attributeFilter:['aria-current']});
 label.append(select,progress);
 nav.after(label);
 update();
}
const making=document.querySelector('#making');
if(making&&!making.classList.contains('v141-appendix')){
 const timeline=document.createElement('ol');
 timeline.className='v138-timeline';
 for(const [name,period] of [['단어 테스트','5/20–5/27'],['통합 DB','6/3–6/26'],['100일 챌린지 LMS','7/13–8/28']]){
  const entry=document.createElement('li');
  entry.textContent=name+' '+period;
  timeline.append(entry);
 }
 making.querySelector('h2')?.after(timeline);
 const details=[...making.querySelectorAll('details')];
 details.forEach(item=>{
  item.open=false;
  item.classList.add('v138-disclosures');
  item.addEventListener('toggle',()=>{if(item.open)details.forEach(other=>{if(other!==item)other.open=false;});});
 });
}
const title=document.querySelector('#vision h2');
if(title&&!document.querySelector('.v141-vision')){
 const stack=document.createElement('div');
 stack.className='v138-vision-stack';
 for(const preview of document.querySelectorAll('.hero-previews img')){
  const image=preview.cloneNode();
  image.loading='lazy';
  stack.append(image);
 }
 const headings=[...document.querySelectorAll('#vision article h3')].slice(0,3);
 headings.forEach(h=>{const text=document.createElement('span');text.textContent=h.textContent;stack.append(text);});
 title.after(stack);
}

const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const focusParagraphs=[...document.querySelectorAll('#motivation .editorial-body > p')];
const comparisonSections=[...document.querySelectorAll('#db-story,#db-decision,#lms-story')];
const quotes=[...document.querySelectorAll('.reader-quotes blockquote,.reader-quote-foot')];
let animationFrame=0;
function updateEditorial(){
 animationFrame=0;
 const center=innerHeight/2;
 if(!reduceMotion.matches){
  focusParagraphs.forEach(paragraph=>{
   const box=paragraph.getBoundingClientRect();
   const distance=Math.abs(center-(box.top+box.height/2));
   paragraph.style.setProperty('--v138-focus',String(Math.max(.72,1-distance/innerHeight*.6)));
  });
  comparisonSections.forEach(section=>{
   const box=section.getBoundingClientRect();
   const progress=Math.max(0,Math.min(1,(innerHeight*.8-box.top)/(box.height+innerHeight*.3)));
   section.style.setProperty('--v138-story-progress',String(progress));
  });
  quotes.forEach(quote=>{
   const box=quote.getBoundingClientRect();
   quote.style.setProperty('--v138-quote-progress',String(Math.max(.55,Math.min(1,(innerHeight-box.top)/Math.max(1,innerHeight*.5)))));
  });
 }
}
function scheduleEditorial(){
 if(!animationFrame)animationFrame=requestAnimationFrame(updateEditorial);
}
addEventListener('scroll',scheduleEditorial,{passive:true});
addEventListener('resize',scheduleEditorial,{passive:true});
reduceMotion.addEventListener('change',scheduleEditorial);
scheduleEditorial();
const metrics=document.querySelector('#words-story .v138-editorial-graphic');
if(metrics){
 [...metrics.querySelectorAll('.story-panel-row')].forEach((row,index)=>{
  const bar=document.createElement('progress');
  bar.max=4453;
  bar.value=[4453,2894,61][index]??0;
  bar.setAttribute('aria-label',row.textContent);
  row.after(bar);
 });
}
const exhibit=document.querySelector('.code-workbench');
if(exhibit){
 exhibit.classList.add('v138-code');
 exhibit.querySelector('nav')?.addEventListener('click',event=>{
  if(!event.target.closest('button')||reduceMotion.matches)return;
  requestAnimationFrame(()=>exhibit.querySelector('pre')?.animate([{clipPath:'inset(0 0 90% 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:400,easing:'steps(8,end)'}));
 });
}
const header=document.querySelector('.site-header');
const mainNav=header?.querySelector('nav');
if(mainNav){
 const toggle=document.createElement('button');
 toggle.type='button';
 toggle.className='v138-header-toggle';
 toggle.textContent='메뉴';
 toggle.setAttribute('aria-expanded','false');
 mainNav.id||='v138-main-nav';
 toggle.setAttribute('aria-controls',mainNav.id);
 const setOpen=open=>{
  toggle.setAttribute('aria-expanded',String(open));
  mainNav.classList.toggle('v138-nav-open',open);
 };
 toggle.addEventListener('click',()=>setOpen(toggle.getAttribute('aria-expanded')==='false'));
 mainNav.addEventListener('click',event=>{if(event.target.closest('a'))setOpen(false);});
 header.addEventListener('keydown',event=>{if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){setOpen(false);toggle.focus();}});
 mainNav.before(toggle);
}
