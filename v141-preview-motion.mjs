const previews=document.querySelector('#services-overview .hero-previews');
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
if(previews&&!reduced.matches){
 const observer=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;observer.disconnect();
  [...previews.children].forEach((card,index)=>{const cursor=document.createElement('i');cursor.className='v141-preview-cursor';cursor.setAttribute('aria-hidden','true');cursor.innerHTML='<svg viewBox="0 0 20 26"><path d="M2 2L17 13L10 15L7 22Z" fill="#08090a" stroke="white" stroke-width="1.5" stroke-linejoin="round"/></svg>';card.append(cursor);const box=card.getBoundingClientRect();const animation=cursor.animate([{transform:'translate(-24px,20px)',opacity:0},{transform:'translate(12px,12px)',opacity:1,offset:.12},{transform:`translate(${box.width-24}px,${box.height-32}px)`,opacity:1,offset:.72},{transform:`translate(${box.width+12}px,${box.height-12}px)`,opacity:0}],{duration:1300,delay:index*140,easing:'cubic-bezier(.2,.6,.3,1)'});animation.finished.catch(()=>{}).finally(()=>cursor.remove());});
 },{threshold:.25});observer.observe(previews);
}
