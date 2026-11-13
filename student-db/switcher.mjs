const views=document.querySelector('.views');
const frames=Object.fromEntries(['portal','teacher','student','operator'].map(role=>[role,document.getElementById(role+'-view')]));
let role='portal',fraction=0;
function send(){
 const type=role==='teacher'?'db:teacher-tour':role==='operator'?'db:operator-tour':null;
 if(type)frames[role].contentWindow.postMessage({type,fraction},location.origin);
}
function select(next,value=0){
 if(!frames[next])return;
 role=next;fraction=Math.max(0,Math.min(1,Number(value)||0));views.dataset.role=role;
 for(const [name,frame] of Object.entries(frames)){
  frame.hidden=name!==role;
  frame.setAttribute('aria-hidden',String(name!==role));
  frame.tabIndex=-1;
  try{frame.contentDocument.documentElement.setAttribute('data-auto-tour','')}catch{}
 }
 send();
}
for(const [name,frame] of Object.entries(frames))frame.addEventListener('load',()=>{
 try{frame.contentDocument.documentElement.setAttribute('data-auto-tour','')}catch{}
 if(name===role)send();
 parent.postMessage({type:'demo:ready',id:'student-db'},location.origin);
});
for(const name of ['student','operator','teacher'])document.getElementById(name).onclick=()=>select(name,fraction);
window.addEventListener('message',event=>{
 if(event.origin!==location.origin)return;
 if(event.source===parent&&event.data?.type==='db:tour-role')select(event.data.role,event.data.fraction);
 else if(Object.values(frames).some(frame=>frame.contentWindow===event.source)&&event.data?.type==='demo:ready'){
  send();parent.postMessage({type:'demo:ready',id:'student-db'},location.origin);
 }
});
Object.assign(document.documentElement.dataset,{demoMode:'manual',syntheticName:'체험학습자 25',syntheticKey:'portfolio-demo-25'});
select('portal');
parent.postMessage({type:'demo:ready',id:'student-db'},location.origin);
