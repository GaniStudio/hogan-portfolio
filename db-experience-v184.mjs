import {returnKey,safeReturn,validStep} from './experience-state-v184.mjs';
const frame=document.getElementById('app'),buttons=[...document.querySelectorAll('[data-step]')],back=document.getElementById('return'),status=document.getElementById('status');
let saved;try{saved=JSON.parse(sessionStorage.getItem(returnKey))}catch{}
back.href=safeReturn(saved,location.href);
back.addEventListener('click',e=>{
 try{if(saved?.href&&document.referrer&&new URL(document.referrer).origin===location.origin&&new URL(document.referrer).pathname===new URL(saved.href).pathname&&history.length>1){e.preventDefault();history.back()}}catch{}
});
function mark(step){step=validStep(step);buttons.forEach(b=>{if(b.dataset.step===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});history.replaceState(null,'','#'+step)}
function select(step){
 const doc=frame.contentDocument;if(!doc?.querySelector('#lookupForm'))return;
 status.textContent='';
 if(step==='lookup'){doc.querySelector('#lookupAgainButton')?.click();doc.defaultView.scrollTo(0,0);mark('lookup');return}
 doc.querySelector('[data-feedback-close]')?.click();
 if(!doc.querySelector('#lookupSection').hidden)doc.querySelector('#lookupForm button[type=submit]').click();
 if(!doc.querySelector('#lookupSection').hidden){status.textContent='이름과 아이디를 확인해 주세요.';return}
 if(step==='feedback'){doc.querySelector('[data-feedback-index]')?.click()}else doc.defaultView.scrollTo(0,0);
 mark(step);
}
buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.step)));
let observer,initializedDocument;
function initialize(){
 const doc=frame.contentDocument;doc?.documentElement?.removeAttribute('data-auto-tour');
 if(!doc?.querySelector('#lookupForm')||doc.documentElement.dataset.demoMode!=='manual'||initializedDocument===doc)return;initializedDocument=doc;
 observer?.disconnect();buttons.forEach(button=>button.disabled=false);
 if(doc?.querySelector('#lookupSection')){
  observer=new MutationObserver(()=>{const modal=doc.querySelector('#feedbackModal');mark(!modal.hidden?'feedback':doc.querySelector('#lookupSection').hidden?'overview':'lookup')});
  for(const id of ['lookupSection','feedbackModal'])observer.observe(doc.getElementById(id),{attributes:true,attributeFilter:['hidden']});
  select(validStep(location.hash.slice(1)));
 }
}
frame.addEventListener('load',initialize);initialize();
addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame.contentWindow&&e.data?.type==='demo:exit')back.click()});
addEventListener('keydown',e=>{if(e.key!=='Escape')return;e.preventDefault();const doc=frame.contentDocument;if(doc?.querySelector('#feedbackModal')?.hidden===false)doc.querySelector('[data-feedback-close]')?.click();else back.click()});
