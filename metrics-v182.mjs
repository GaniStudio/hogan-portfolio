import {countValue} from './metric-value-v182.mjs';
const reduce=matchMedia('(prefers-reduced-motion:reduce)');
const nodes=[...document.querySelectorAll('[data-v182-count]')];
const played=new WeakSet(),frames=new Map();
const reduced=()=>reduce.matches||new URLSearchParams(location.search).has('reducedmotion');
function finish(node){cancelAnimationFrame(frames.get(node));frames.delete(node);node.textContent=Number(node.dataset.v182Count).toLocaleString('ko-KR')}
function play(node){
  if(played.has(node))return;played.add(node);
  if(reduced()){finish(node);return}
  const target=Number(node.dataset.v182Count),start=performance.now();
  node.textContent='1';
  function tick(now){if(!node.isConnected)return;if(reduced()){finish(node);return}const p=Math.min(1,(now-start)/1200);node.textContent=countValue(target,p).toLocaleString('ko-KR');if(p<1)frames.set(node,requestAnimationFrame(tick));else finish(node)}
  frames.set(node,requestAnimationFrame(tick));
}
const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){observer.unobserve(e.target);play(e.target)}},{threshold:.5});
for(const node of nodes){if(reduced()){played.add(node);finish(node)}else{node.textContent='1';observer.observe(node)}}
reduce.addEventListener('change',()=>{if(reduced())for(const node of nodes){played.add(node);observer.unobserve(node);finish(node)}});
