document.documentElement.dataset.demoMode='presentation';
for(const el of document.querySelectorAll('a'))el.addEventListener('click',event=>event.preventDefault());
for(const id of ['cloudHealth','backendHealth','singleCourseHealth','mobileHealth']){
 const el=document.getElementById(id);
 if(el){el.dataset.state='ok';el.textContent='정상';}
}
document.getElementById('headerRelease')?.remove();
parent.postMessage({type:'demo:ready',id:'student-db'},location.origin);
