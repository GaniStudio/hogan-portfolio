const shell=document.querySelector('[data-case-shell]');
const canvas=document.querySelector('#galaxy-transit');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let busy=false, opened=false, savedY=0, savedFocus=null, owned=false;
const isCase=()=>location.hash==='#case/student-db';
const reduced=()=>motion.matches||new URLSearchParams(location.search).has('reducedmotion');
function show(value){
 opened=value; shell.hidden=!value; document.body.classList.toggle('case-open',value);
 if(value){window.__hoganEndIntro?.('case');scrollTo(0,0);shell.querySelector('h1').focus({preventScroll:true});}
 else{
 const anchorReturn=savedY===null,until=performance.now()+600;
 const restore=()=>{if(opened)return;if(anchorReturn)savedY=Math.max(0,(document.querySelector('#student-db')?.offsetTop||0)-96);scrollTo(0,savedY);(savedFocus||document.querySelector('#db-case-link'))?.focus({preventScroll:true});if(performance.now()<until)requestAnimationFrame(restore);};
 restore();
 }
}
async function travel(value){
 if(busy)return;busy=true;
 const anchorReturn=!value&&savedY===null;
 if(reduced()){show(value);busy=false;return;}
 document.body.classList.add('galaxy-moving');canvas.style.display='block';
 const ctx=canvas.getContext('2d');if(!ctx){show(value);canvas.style.display='none';document.body.classList.remove('galaxy-moving');busy=false;return;}
 const w=innerWidth,h=innerHeight,d=Math.min(devicePixelRatio,1.5);canvas.width=w*d;canvas.height=h*d;ctx.scale(d,d);
 let seed=157;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const stars=Array.from({length:w<600?130:300},()=>({x:(random()-.5)*w,y:(random()-.5)*h,z:.2+random()*.8,r:.4+random()}));
 let switched=false;const start=performance.now();
 await new Promise(resolve=>{function frame(now){
 const p=Math.min(1,(now-start)/1400),ease=p*p*(3-2*p);
 if(!switched&&(p>=.5||reduced())){show(isCase());switched=true;}
 else if(switched&&opened!==isCase()){show(isCase());}
 ctx.clearRect(0,0,w,h);const cover=Math.sin(Math.PI*p);ctx.fillStyle=`rgba(4,7,17,${Math.min(.97,cover*1.25)})`;ctx.fillRect(0,0,w,h);
 const glow=ctx.createRadialGradient(w*.65,h*.4,0,w*.5,h*.5,w*.7);glow.addColorStop(0,`rgba(28,110,125,${cover*.3})`);glow.addColorStop(1,'rgba(6,9,24,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 for(const s of stars){const amount=value?ease:1-ease,scale=1+amount*s.z*3;const x=w/2+s.x*scale,y=h/2+s.y*scale;ctx.strokeStyle=`rgba(190,221,240,${cover*(.3+s.z*.5)})`;ctx.lineWidth=s.r;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-s.x*cover*s.z*.14,y-s.y*cover*s.z*.14);ctx.stroke();}
 if(p<1&&!reduced())requestAnimationFrame(frame);else{if(!switched)show(isCase());resolve();}
 }requestAnimationFrame(frame);});
 canvas.style.display='none';document.body.classList.remove('galaxy-moving');busy=false;
 if(anchorReturn&&!opened){savedY=null;show(false);}
 window.dispatchEvent?.(new Event('scroll'));
 window.__caseJourney={open:opened,returnY:savedY,duration:performance.now()-start};
 if(isCase()!==opened)travel(isCase());
}
document.addEventListener('click',e=>{
 const link=e.target.closest('[data-case-open],[data-case-return],body.case-open .site-header a[href="#intro"]');if(!link)return;e.preventDefault();if(busy)return;
 if(link.getAttribute?.('href')==='#intro'){savedY=0;savedFocus=document.querySelector('#intro h1');history.pushState(null,'','#intro');owned=false;travel(false);return;}
 if(link.hasAttribute('data-case-open')){savedY=scrollY;savedFocus=link;history.replaceState({...history.state,caseReturnY:savedY},'',location.href);history.pushState({caseStudy:true},'','#case/student-db');owned=true;travel(true);}
 else if(owned){history.back();}else{history.replaceState(null,'','#student-db');savedY=null;travel(false);}
});
addEventListener('popstate',()=>{if(!isCase())savedY=history.state?.caseReturnY??savedY;travel(isCase());});
addEventListener('hashchange',()=>{if(isCase()!==opened)travel(isCase());});
if(isCase()){show(true);}
