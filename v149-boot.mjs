// Heavy apps and media start only after the intro has released the gate.
await window.__hoganIntroReady;
await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
const modules=[...document.querySelectorAll('script[data-v149-module]')].map(s=>s.dataset.v149Module);
const first=['document-flow.mjs','/hogan-portfolio/v139-word-bootstrap.mjs','v139-word-bootstrap.mjs'];
for(const key of first){const found=modules.find(m=>m===key);if(found){await import(new URL(found,location.href).href);modules.splice(modules.indexOf(found),1);}}
for(const src of modules)await import(new URL(src,location.href).href);
const observer=new IntersectionObserver(entries=>{for(const {target,isIntersecting} of entries){if(!isIntersecting)continue;const src=target.dataset.v149Src;if(src&&!target.hasAttribute('src'))target.src=src;observer.unobserve(target);}},{rootMargin:'900px'});
for(const el of document.querySelectorAll('[data-v149-src]'))observer.observe(el);
document.documentElement.dataset.appsReleased='true';

await import('./mobile-v179.mjs?v184');

await import('./mobile-v181.mjs');

await import('./metrics-v182.mjs');

await import('./inline-db-v186.mjs');

await import('./touch-cue-v187.mjs');
