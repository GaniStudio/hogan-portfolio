const layer=document.querySelector('#continuous-backdrop'),canvas=layer?.querySelector('canvas');
const ctx=canvas?.getContext('2d');
if(ctx){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer:fine)');
 const clouds=[...layer.querySelectorAll('.v135-nebula')];const ripples=[];const shots=[];
 const mod=(x,n)=>((x%n)+n)%n;
 let w,h,stars=[],texts=[],x=0,y=0,tx=0,ty=0,sy=scrollY,docHeight=1,frame=0,resizeId,slow=false,meteor=null,nextShot=0,last=0,n=0,elapsed=0,draw=0,count=0;
 let seed=135;const rng=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
 const total=()=>Math.min(800,Math.round(w*h/2900))*((w<=600||slow)?.5:1);
 const telemetry={};window.v135Background=telemetry;
 const areas=[...document.querySelectorAll('main h1,main h2,main h3,main p,main dl,main blockquote,main a,main figcaption,.site-header,.service-step-copy')];
 function measure(){docHeight=Math.max(1,document.documentElement.scrollHeight-h);texts=areas.map(el=>{const r=el.getBoundingClientRect();return [r.left-16,r.right+16,r.top+scrollY-16,r.bottom+scrollY+16];});}
 function setup(){
  w=innerWidth;h=innerHeight;const d=Math.min(2,devicePixelRatio||1);
  canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);
  seed=135;let glows=0;
  stars=Array.from({length:Math.round(total())},(_,i)=>{
   const rank=rng(),j=rank<.5?0:rank<.82?1:2,c=rng(),radius=[.4,.6,.9][j]+rng()*[.4,.5,.7][j];
   return {x:rng()*w,y:rng()*h,depth:[.3,.62,1][j],radius,alpha:.25+rng()*[.29,.44,.6][j],period:2500+rng()*4500,phase:rng()*6.28,color:c<.7?'#fff':c<.88?'#c7d2fe':'#ffe1c4',glow:j===2&&radius>1.25&&glows++<12};
  });
  Object.assign(telemetry,{stars:stars.length,dpr:d,slow});measure();request();
 }
 function request(){if(!frame&&!document.hidden)frame=requestAnimationFrame(paint);}
 function paint(t){
  frame=0;const begin=performance.now(),still=reduced.matches;
  if(!still&&last&&n<60){elapsed+=t-last;n++;if(n===60&&elapsed/n>24){slow=true;setup();}}
  last=t;
  x+=(tx-x)*.06;y+=(ty-y)*.06;
  ctx.clearRect(0,0,w,h);
  const visible=texts.filter(r=>r[2]<sy+h&&r[3]>sy);
  for(const s of stars){
   let px=mod(s.x-(still?0:x*46*s.depth),w),py=mod(s.y-(still?0:(y*30+sy*.32)*s.depth),h);
   let pulse=0;
   for(const ripple of ripples){
    const progress=(t-ripple.t)/1000,dx=px-ripple.x,dy=py-ripple.y,dist=Math.hypot(dx,dy);
    if(dist>300||progress<0||progress>1)continue;
    const force=Math.sin(progress*Math.PI)*Math.sin(dist/35-progress*8)*(1-dist/300)*12;
    px+=dist?dx/dist*force:0;py+=dist?dy/dist*force:0;pulse=Math.max(pulse,Math.sin(progress*Math.PI)*.25);
   }
   const dim=visible.some(r=>px>=r[0]&&px<=r[1]&&py+sy>=r[2]&&py+sy<=r[3])?.6:1;
   ctx.fillStyle=s.color;ctx.globalAlpha=dim*s.alpha*Math.min(1, (still||slow?1:.85+.15*Math.sin(t/s.period*6.283+s.phase))+pulse);
   ctx.beginPath();ctx.arc(px,py,s.radius,0,6.283);ctx.fill();
   if(s.glow){ctx.globalAlpha*=.15;ctx.beginPath();ctx.arc(px,py,s.radius*3,0,6.283);ctx.fill();}
  }
  if(!still&&t>nextShot&&!meteor&&!document.querySelector('.agent-intro-layer,[data-agent-intro-active]')&&t>6000){meteor={t,x:w*(.3+Math.random()*.7),y:h*.45*Math.random(),dur:750+Math.random()*400};nextShot=t+3500+4000*Math.random();}
  if(meteor&&!still){
   const p=(t-meteor.t)/meteor.dur;
   if(p>=1)meteor=null;else{
    const mx=meteor.x-p*460,my=meteor.y+p*215,g=ctx.createLinearGradient(mx,my,mx+154,my-72);
    g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');
    const overText=visible.some(r=>mx<=r[1]&&mx+154>=r[0]&&my+sy>=r[2]&&my-72+sy<=r[3]);ctx.globalAlpha=Math.min(1,(1-p)/.3)*(overText?0:1);ctx.strokeStyle=g;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(mx+154,my-72);ctx.stroke();
   }
  }
  for(let i=shots.length-1;i>=0;i--){
   const shot=shots[i],p=(t-shot.t)/900;
   if(p>=1){shots.splice(i,1);continue}
   const mx=shot.x-p*460,my=shot.y+p*215;
   const overText=visible.some(r=>mx<=r[1]&&mx+154>=r[0]&&my+sy>=r[2]&&my-72+sy<=r[3]);
   const glow=ctx.createLinearGradient(mx,my,mx+154,my-72);glow.addColorStop(0,'#ffffff');glow.addColorStop(1,'#ffffff00');
   ctx.globalAlpha=Math.sin(p*Math.PI)*(overText?0:.9);ctx.strokeStyle=glow;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(mx+154,my-72);ctx.stroke();
  }
  for(let i=ripples.length-1;i>=0;i--)if(t-ripples[i].t>1100)ripples.splice(i,1);
  telemetry.ripples=ripples.length;telemetry.clickMeteors=shots.length;
  ctx.globalAlpha=1;
  const sky=still?'':document.elementFromPoint(w*.5,h*.55)?.closest('#words,#words-story,#student-db,#db-story,#db-decision,#lms,#lms-story')?.id||'';
  layer.dataset.sky=sky;
  clouds.forEach((el,i)=>{const drift=still?0:Math.sin(t/(95000+i*18000)*6.283)*15;el.style.translate=still?'none':(-x*13.8+drift)+'px '+(-y*9-(mod(sy*.04+30,60)-30)+drift)+'px';});
  document.documentElement.style.setProperty('--v135-progress',still?'0':String(Math.max(0,Math.min(1,sy/docHeight))));
  draw+=performance.now()-begin;count++;telemetry.meanDrawMs=draw/count;
  if(!still)request();
 }
 addEventListener('pointerup',e=>{
  if(reduced.matches||e.button&&e.button!==0||document.querySelector('.agent-intro-layer'))return;
  if(e.target.closest('a,button,input,select,textarea,iframe,figure,dialog,pre,code,summary,p,h1,h2,h3,dl,blockquote,.demo-window,.code-workbench'))return;
  const t=performance.now();ripples.push({x:e.clientX,y:e.clientY,t});shots.push({x:e.clientX,y:e.clientY,t});
  if(ripples.length>3)ripples.shift();if(shots.length>3)shots.shift();measure();request();
 },{passive:true});
 let measureTimer=0;addEventListener('scroll',()=>{sy=scrollY;if(!measureTimer)measureTimer=setTimeout(()=>{measureTimer=0;measure();},160);},{passive:true});
 addEventListener('resize',()=>{clearTimeout(resizeId);resizeId=setTimeout(setup,150)},{passive:true});
 addEventListener('pointermove',e=>{if(!fine.matches||e.pointerType==='touch')return;tx=e.clientX/w-.5;ty=e.clientY/h-.5},{passive:true});
 document.documentElement.addEventListener('pointerleave',()=>{tx=ty=0});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;meteor=null;last=0;}else {nextShot=performance.now()+3500;request();}});
 reduced.addEventListener('change',()=>{meteor=null;request();});
 document.fonts.ready.then(()=>{measure();request();});
 setup();
}

