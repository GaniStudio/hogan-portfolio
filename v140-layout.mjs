const reduced=matchMedia('(prefers-reduced-motion: reduce)');
// Keep useful old hooks without the former outline/prose cloning side effects.
const words=document.querySelector('.words-step-copy');
if(words?.previousElementSibling){const nav=words.previousElementSibling;const update=()=>{words.textContent=nav.querySelector('[aria-current=step]')?.dataset.copy??'';};new MutationObserver(update).observe(nav,{subtree:true,attributes:true,attributeFilter:['aria-current']});update();}
document.querySelector('[data-teacher-view]')?.addEventListener('click',()=>{const dialog=document.querySelector('.teacher-preview'),frame=dialog?.querySelector('iframe');if(!dialog||!frame)return;if(!frame.src)frame.src=frame.dataset.teacherSrc;dialog.showModal();});
// Lazy original app previews, only while near the viewport. The DB preview is
// set through the same synthetic source adapter as the main stage.
const observer=new IntersectionObserver(entries=>{for(const {target,isIntersecting} of entries){if(!isIntersecting||target.hasAttribute('src'))continue;target.addEventListener('load',()=>{if(target.dataset.v140Preview!=='db')return;const doc=target.contentDocument;if(!doc)return;doc.documentElement.setAttribute('data-auto-tour','');const name=doc.getElementById('studentName'),key=doc.getElementById('loginKey');if(name&&key){name.value='체험학습자 25';key.value='portfolio-demo-25';doc.getElementById('lookupForm')?.querySelector('button[type=submit],button')?.click();}},{once:true});target.src=target.dataset.v140Preview==='db'?'/hogan-portfolio/student-db/student.html?manual&preview=overview':target.dataset.src;}},{rootMargin:'200px'});
document.querySelectorAll('[data-v140-preview]').forEach(frame=>{frame.tabIndex=-1;frame.inert=true;observer.observe(frame);});

const sheet=document.querySelector('[data-comparison=db] .v139-sheet');const pointer=document.createElement('span');pointer.className='v140-sheet-cursor';pointer.setAttribute('aria-hidden','true');pointer.innerHTML='<svg width="16" height="20" viewBox="0 0 16 20"><path d="M2 1L14 12L8 13L5 18Z" fill="#111" stroke="white" stroke-width="1.5" stroke-linejoin="round"/></svg>';sheet?.append(pointer);
