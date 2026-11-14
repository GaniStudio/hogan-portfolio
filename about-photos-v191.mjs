// Local photographs only. Original files and approved biography stay unchanged.
const root=document.querySelector('#about-page');
const viewer=root?.querySelector('#about-photo-viewer');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const active=new Set();let trigger=null;
if(root&&viewer){
 const image=viewer.querySelector('img'),title=viewer.querySelector('#about-photo-viewer-title');
 root.querySelectorAll('[data-about-photo]').forEach(link=>link.addEventListener('click',event=>{
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||typeof viewer.showModal!=='function')return;
  event.preventDefault();trigger=link;title.textContent=link.dataset.photoTitle;
  image.alt=link.querySelector('img').alt;image.src=link.href;
  if(!viewer.open)viewer.showModal();
 }));
 viewer.querySelector('[data-photo-close]').addEventListener('click',()=>viewer.close());
 viewer.addEventListener('click',event=>{if(event.target!==viewer)return;const r=viewer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)viewer.close()});
 viewer.addEventListener('close',()=>{trigger?.focus({preventScroll:true});image.removeAttribute('src')});
 const seen=new WeakSet();
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting||seen.has(entry.target))return;
  seen.add(entry.target);observer.unobserve(entry.target);
  if(motion.matches||document.hidden)return;
  const animation=entry.target.animate([{opacity:.75,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});
  active.add(animation);animation.finished.catch(()=>{}).finally(()=>active.delete(animation));
 }),{threshold:.12});
 root.querySelectorAll('.v191-photo').forEach(photo=>observer.observe(photo));
 motion.addEventListener('change',()=>{if(motion.matches)active.forEach(animation=>animation.cancel())});
}
