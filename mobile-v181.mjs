// Mobile presentation only: same nodes, copy, code payload and desktop controls.
const compact=matchMedia('(max-width:1099px)');
const map=document.querySelector('.ai-system-map.v165-map');
const original=map?[...map.children]:[];
function orderMap(){
  if(!map)return;
  if(compact.matches){
    const top=map.querySelector('[data-side="top"]'),hub=map.querySelector('.v165-hub');
    if(top&&hub)map.append(top,hub,...original.filter(n=>n.classList?.contains('v165-node')&&n!==top));
  }else map.append(...original);
  for(const node of map.querySelectorAll('.v165-node'))node.tabIndex=compact.matches?-1:0;
}
orderMap();compact.addEventListener('change',orderMap);

const host=document.querySelector('.v149-code-workspace');
if(host){
  const tabs=[...host.querySelectorAll('[data-code-tab]')];
  const files=[...host.querySelectorAll('[data-code-file]')];
  const window=host.querySelector('.v149-code-window');
  if(window&&tabs.length&&files.length){
    const controls=document.createElement('div');controls.className='v181-code-controls';
    const label=document.createElement('label');label.htmlFor='v181-code-file';label.textContent='코드 파일';
    const select=document.createElement('select');select.id='v181-code-file';
    tabs.forEach((tab,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=tab.textContent.trim();select.append(option)});
    const path=document.createElement('p');path.className='v181-code-path';
    controls.append(label,select,path);
    const chrome=window.querySelector('.v149-code-chrome');if(chrome)chrome.after(controls);else window.prepend(controls);
    const sync=()=>{
      const index=Math.max(0,tabs.findIndex(t=>t.getAttribute('aria-selected')==='true'));
      select.value=String(index);path.replaceChildren();
      const parts=files[index].textContent.trim().split('/');
      parts.forEach((part,i)=>{path.append(document.createTextNode(part+(i<parts.length-1?'/':'')));if(i<parts.length-1)path.append(document.createElement('wbr'))});
    };
    select.addEventListener('change',()=>{tabs[Number(select.value)]?.click();sync()});
    new MutationObserver(sync).observe(host.querySelector('[role="tablist"]'),{subtree:true,attributes:true,attributeFilter:['aria-selected']});
    sync();
  }
}
const codeRegions=[...document.querySelectorAll('.v149-code-window pre,.v162-code-stage pre')].map(pre=>({pre,tabindex:pre.getAttribute('tabindex'),label:pre.getAttribute('aria-label')}));
function codeAccess(){for(const {pre,tabindex,label} of codeRegions){
  if(compact.matches){pre.tabIndex=0;if(!pre.hasAttribute('aria-label')&&!pre.hasAttribute('aria-labelledby'))pre.setAttribute('aria-label','코드')}
  else{if(tabindex===null)pre.removeAttribute('tabindex');else pre.setAttribute('tabindex',tabindex);if(label===null)pre.removeAttribute('aria-label');else pre.setAttribute('aria-label',label)}
}}
codeAccess();compact.addEventListener('change',codeAccess);
