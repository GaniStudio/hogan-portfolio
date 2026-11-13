const motion=matchMedia('(prefers-reduced-motion: reduce)');
const stages=[...document.querySelectorAll('.service-scroll-stage,.words-scroll-stage')];
const shells=new Map();
let scheduled=0;
function draw(){
 scheduled=0;
 for(const stage of stages){
  const shell=shells.get(stage)||stage.querySelector('.demo-window');
  if(!shell)continue;
  shells.set(stage,shell);
  const y=stage.getBoundingClientRect().top;
  const angle=motion.matches?0:6*Math.max(0,Math.min(1,(y-innerHeight*.68)/(innerHeight*.24)));
  shell.style.setProperty('--tour-tilt',angle.toFixed(2)+'deg');
 }
}
function schedule(){if(!scheduled)scheduled=requestAnimationFrame(draw);}
addEventListener('scroll',schedule,{passive:true});
addEventListener('resize',schedule,{passive:true});
motion.addEventListener('change',schedule);
// v148: approved result numbers remain stable on first paint.
schedule();
