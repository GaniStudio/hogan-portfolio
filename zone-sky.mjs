// 구간별 우주 분위기 (시안 v07). 지금 배포된 우주 배경(#continuous-backdrop: 남색 바탕과 별)은 그대로 두고,
// 구간마다 옅은 색 기운을 얹어 스크롤에 맞춰 천천히 바꾼다. 사이트 CSS가 배경 안 <i>를 숨기므로 <span>을 쓴다. 사진은 쓰지 않는다.
const sky=document.querySelector('#continuous-backdrop');
if(sky){
 const ZONES=[
  {k:'words',from:'#static-gallery',to:'#student-db',max:.8,wash:'linear-gradient(165deg,rgba(150,78,34,.34),rgba(84,34,46,.22) 55%,rgba(40,18,30,.10))',neb:[[80,18,1100,'240,150,84',.30],[14,78,900,'220,92,120',.20]]},
  {k:'db',from:'#student-db',to:'#lms',max:.8,wash:'linear-gradient(165deg,rgba(18,78,112,.36),rgba(16,48,96,.22) 55%,rgba(10,26,56,.10))',neb:[[16,20,1100,'46,156,204',.32],[84,78,950,'64,128,214',.22]]},
  {k:'lms',from:'#lms',to:'#reading',max:.8,lead:1,wash:'linear-gradient(165deg,rgba(124,26,52,.34),rgba(70,24,80,.22) 55%,rgba(36,14,40,.10))',neb:[[82,22,1100,'236,74,104',.30],[18,80,950,'160,90,226',.20]]},
  {k:'ch2',from:'#ai-workflow',to:null,late:1,dense:1,dim:.4,wash:'radial-gradient(120% 90% at 50% 0%,rgba(96,52,190,.42),rgba(46,22,100,.26) 45%,rgba(10,6,24,0) 80%)',neb:[[50,6,1500,'140,92,240',.36],[10,64,1000,'214,86,188',.22],[88,92,1100,'72,76,220',.26]]}
 ];
 const css=['.zs{position:absolute;inset:0;opacity:0;pointer-events:none;will-change:opacity}',
  '.zs span{position:absolute;display:block;border-radius:50%;transform:translate(-50%,-50%)}',
  '.zs-dim{position:absolute;inset:0;background:#03030a;opacity:0;pointer-events:none}',
  '.zs-stars{position:absolute;inset:0;width:100%;height:100%;opacity:0;pointer-events:none}'].join('');
 const st=document.createElement('style');st.textContent=css;document.head.append(st);
 const stars=sky.querySelector('.v135-stars');
 const dim=document.createElement('div');dim.className='zs-dim';sky.insertBefore(dim,stars);
 const layers=ZONES.map(z=>{const d=document.createElement('div');d.className='zs';
  d.innerHTML=`<span style="left:50%;top:50%;width:100%;height:100%;border-radius:0;background:${z.wash}"></span>`+z.neb.map(([x,y,s,c,a])=>`<span style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;background:radial-gradient(circle,rgba(${c},${a}),transparent 68%)"></span>`).join('');
  sky.insertBefore(d,stars);return d;});
 // 챕터 2에서만 작은 별을 조금 더 촘촘하게
 const cv=document.createElement('canvas');cv.className='zs-stars';sky.insertBefore(cv,stars.nextSibling);
 function drawDense(){const w=innerWidth,h=innerHeight,dp=Math.min(2,devicePixelRatio||1);cv.width=w*dp;cv.height=h*dp;const c=cv.getContext('2d');c.setTransform(dp,0,0,dp,0,0);let s=207;const r=()=>((s=(Math.imul(1664525,s)+1013904223)>>>0)/4294967296);
  for(let i=0;i<Math.min(1400,w*h/1000);i++){c.fillStyle=`rgba(${r()>.85?'235,220,255':'220,226,255'},${.15+r()*.4})`;const z=r()<.8?.9:1.4;c.fillRect(r()*w,r()*h,z,z);}}
 const cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),ss=(a,b,x)=>{const t=cl((x-a)/(b-a));return t*t*(3-2*t);};
 const top=s=>{const e=s&&document.querySelector(s);return e?e.getBoundingClientRect().top+scrollY:null;};
 let R=[];
 function measure(){const end=document.documentElement.scrollHeight;R=ZONES.map(z=>[top(z.from),z.to?top(z.to):end]);}
 function update(){
  const vh=innerHeight,c=scrollY+vh*.5,hw=vh*.6;let d=0,dn=0;
  ZONES.forEach((z,i)=>{const [a,b]=R[i];if(a==null||b==null)return;
   const inW=z.late?ss(a,a+vh*.8,c):ss(a-hw,a+hw,c),outW=!z.to?1:z.lead?1-ss(b-hw*1.2,b+hw*.4,c):1-ss(b-hw,b+hw,c);const w=Math.min(inW,outW)*(z.max||1);
   layers[i].style.opacity=w.toFixed(3);if(z.dim)d=Math.max(d,w*z.dim);if(z.dense)dn=Math.max(dn,w);});
  dim.style.opacity=d.toFixed(3);cv.style.opacity=dn.toFixed(3);
 }
 let q=0;const tick=()=>{if(!q)q=requestAnimationFrame(()=>{q=0;update();});};
 addEventListener('scroll',tick,{passive:true});
 addEventListener('resize',()=>{drawDense();measure();tick();});
 new ResizeObserver(()=>{measure();tick();}).observe(document.body);
 drawDense();measure();update();
 window.__zoneSky={measure,update,R:()=>R};
}
