// Original HTML/CSS drawings; driven by motion-chrome's existing RAF.
export const POINTER_STRENGTH=1;
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
let px=0,py=0;window.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){px=e.clientX/innerWidth-.5;py=e.clientY/innerHeight-.5}},{passive:true});
function panel(section,selector,contents){
 // v140 owns the comparison/result DOM. Do not append the retired v138
 // drawings after the build-time cleanup; that recreated the duplicate metric.
 if(document.querySelector('link[href="/hogan-portfolio/v140-layout.css"]')||section==='#db-decision')return;
 const host=document.querySelector(section+' '+selector);
 if(!host)return;
 const figure=document.createElement('div');
 figure.className='story-graphic story-panel v138-editorial-graphic';
 figure.innerHTML=contents;
 host.append(figure);
}
const row=(label,value='')=>'<div class="story-panel-row"><span>'+label+'</span>'+(value?'<strong>'+value+'</strong>':'')+'</div>';
const metric=(value,label)=>'<div class="story-panel-metric"><strong>'+value+'</strong><span>'+label+'</span></div>';
const date=value=>'<small>'+value+'</small>';
const preview=(src,title)=>'<iframe tabindex="-1" inert loading="lazy" sandbox="allow-scripts allow-same-origin" src="'+src+'" title="'+title+'"></iframe>';
panel('#words-story','.editorial-heading',
 row('누적 방문','4,453회')+row('테스트 완료','2,894건')+row('무료 상담 버튼 클릭','61건')+date('2026년 11월 9일 기준'));
panel('#db-story','.db-story-visual',
 row('이전 방식','피드백 파일')+row('','화면 캡처')+row('','매달 평가')+row('내가 바꾼 것','대시보드에서 한눈에')+
 preview('/hogan-portfolio/operator-db/index.html?manual','통합 DB 운영자 화면'));
panel('#db-decision','.editorial-heading',
 metric('50% 이상','체감하는 업무 효율')+row('파일을 열어 확인')+row('옮겨 적기')+row('대조')+row('','대시보드에서 바로 확인'));
panel('#lms-story','.db-story-visual',
 row('이전 방식','카카오톡으로 학습자료')+row('','카카오톡으로 과제')+row('','시트에 기록')+row('내가 새로 만든 것','학습과 과제를 한곳에서')+
 preview('/hogan-portfolio/lms/index.html?stage=lesson','LMS 오늘 학습'));
panel('#lms-story','.db-story-visual',
 metric('85명','참여 학생')+metric('2,666건','누적 과제와 복습 제출')+date('2026년 11월 9일, 48일차 기준'));
export function updateEditorial(){
 const backdrop=document.getElementById('continuous-backdrop');const staticMode=reduced.matches||new URLSearchParams(location.search).has('reducedmotion')||new URLSearchParams(location.search).has('fallback')||new URLSearchParams(location.search).has('failwebgl');
 const words=document.getElementById('words-story');
 const glow=words?smooth((scrollY-words.offsetTop+520)/1100):0;
 for(const window of document.querySelectorAll('.demo-window')){
  const top=window.parentElement.getBoundingClientRect().top;
  const tilt=staticMode?0:smooth((top-innerHeight*.48)/(innerHeight*.42));
  window.style.setProperty('--arrival-tilt',String(tilt));
 }
 if(backdrop&&!backdrop.classList.contains('v135-sky')){const db=document.getElementById('db-story'),lms=document.getElementById('lms-story');const d=db?smooth((scrollY-db.offsetTop+900)/1200):0,l=lms?smooth((scrollY-lms.offsetTop+900)/1200):0;backdrop.style.setProperty('--words-glow',staticMode?'0':String(glow*(1-d)*(1-l)));backdrop.querySelector('.ambient-db').style.opacity=staticMode?'0':String(d*(1-l));backdrop.querySelector('.ambient-lms').style.opacity=staticMode?'0':String(l);const pointer=backdrop.querySelector('.ambient-pointer');pointer.style.transform=`translate(${staticMode?0:px*20*POINTER_STRENGTH}px,${staticMode?0:py*16*POINTER_STRENGTH}px)`;}
}

