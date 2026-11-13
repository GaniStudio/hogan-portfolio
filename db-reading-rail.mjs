export function createDBReadingRail(section){
 const story=document.querySelector('#db-story');
 const copy=section.querySelector('.project-copy');
 const beats=[...story.querySelectorAll('.story-beat')];
 const origins=beats.map(node=>{const marker=document.createComment('DB manuscript position');node.before(marker);return marker});
 const rail=document.createElement('div');rail.className='db-reading-rail';
 copy.querySelector('.lead').after(rail);
 let mounted=false;
 return (progress,mode)=>{
  const active=mode==='3d';
  if(active!==mounted){mounted=active;section.dataset.readingRail=String(active);story.dataset.readingRail=String(active);beats.forEach((node,i)=>active?rail.append(node):origins[i].after(node));}
  if(!active){beats.forEach(node=>{node.style.removeProperty('opacity');node.style.removeProperty('transform');node.style.removeProperty('visibility');node.removeAttribute('aria-hidden')});return;}
  const mix=Math.max(0,Math.min(1,(progress-.32)/.10));const ease=x=>x*x*(3-2*x);const outgoing=1-ease(Math.min(1,mix*2));const incoming=ease(Math.max(0,(mix-.5)*2));
  beats.forEach((node,i)=>{const alpha=i?incoming:outgoing;node.style.opacity=String(alpha);node.style.transform=`translateY(${i?14*(1-incoming):-14*(1-outgoing)}px)`;node.style.visibility=alpha<.001?'hidden':'visible';node.setAttribute('aria-hidden',String(alpha<.5));});
 };
}
