// v147: freeze the outer chrome; crossfade only a departing local app DOM.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const localURL = (value, base) => {
  try { const url = new URL(value, base); return url.origin === location.origin || url.protocol === 'data:' ? url.href : ''; }
  catch { return ''; }
};
const parsedSnapshotStyles = new WeakMap();

function cssFor(doc) {
  const sheets = [...doc.styleSheets];
  const cache = cssFor.cache ||= new WeakMap();
  const previous = cache.get(doc);
  const versions = sheets.map(sheet => {
    try { return [sheet, sheet.cssRules.length, sheet.ownerNode?.textContent || '']; }
    catch { return [sheet, -1, '']; }
  });
  if (previous && previous.versions.length === versions.length && versions.every((entry, i) => entry.every((value, j) => value === previous.versions[i][j]))) return previous.css;
  const css = sheets.map(sheet => {
    try {
      return [...sheet.cssRules].map(rule => rule.cssText).join('\n')
        .replace(/:root\b/g, ':host')
        .replace(/url\(\s*(['"]?)(.*?)\1\s*\)/g, (_, quote, value) => `url("${localURL(value, sheet.href || doc.baseURI).replaceAll('"', '%22')}")`);
    } catch { return ''; }
  }).join('\n');
  cache.set(doc, {versions, css});
  return css;
}

// All copies are owned by the portfolio document before insertion. Importing
// iframe-owned cloneNode trees adopted nested hosts across documents and erased
// their constructed stylesheets, exposing the brand image at 1024px.
// Shadow boundaries preserve the source app's selectors and prevent duplicate
// IDs/styles from leaking into the portfolio. No document is navigated to build
// a snapshot; scripts, frame elements, media, event handlers and actions go away.
function copyDocument(doc, depth = 0) {
  if (!doc?.body || depth > 2) return null;
  const host = document.createElement('div');
  host.className = 'v140-snapshot-document';
  host.style.cssText = `width:${doc.defaultView.innerWidth}px;height:${doc.defaultView.innerHeight}px;overflow:hidden;position:relative;pointer-events:none;`;
  const shadow = host.attachShadow({mode:'open'});
  const style = document.createElement('style');
  style.textContent = cssFor(doc) + '\n:host{display:block}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';
  let sharedStyle = null;
  // Reuse parsed rules too, not only their serialized text. Re-parsing a large
  // app stylesheet in every neighboring shadow tree delays the first paint.
  if ('adoptedStyleSheets' in shadow && typeof CSSStyleSheet !== 'undefined' && CSSStyleSheet.prototype.replaceSync) {
    try {
      const cached = parsedSnapshotStyles.get(doc);
      if (cached?.css === style.textContent) sharedStyle = cached.sheet;
      else { sharedStyle = new CSSStyleSheet(); sharedStyle.replaceSync(style.textContent); parsedSnapshotStyles.set(doc,{css:style.textContent,sheet:sharedStyle}); }
      shadow.adoptedStyleSheets = [sharedStyle];
    } catch { sharedStyle = null; }
  }
  const viewport = {width:doc.defaultView.innerWidth, height:doc.defaultView.innerHeight};
  let visited = 0;
  function copy(source, svg = false) {
    if (source.nodeType !== 1) return source.nodeType === 3 ? document.importNode(source, false) : null;
    const tag = source.localName;
    if (['head','script','link','style','meta','base','object','embed','audio','video','source','track','noscript'].includes(tag) || source.hidden) return null;
    const rect = source.getBoundingClientRect();
    // Prune whole hidden roles before walking their potentially large trees.
    // display:contents and SVG definitions can have no box yet paint children.
    if (!svg && tag !== 'svg' && !rect.width && !rect.height && doc.defaultView.getComputedStyle(source).display === 'none') return null;
    const node = document.importNode(source, false);
    for (const attr of [...node.attributes]) {
      if (/^on/i.test(attr.name) || ['href','xlink:href','action','formaction','srcdoc','autofocus','autoplay','srcset'].includes(attr.name)) node.removeAttribute(attr.name);
    }
    svg ||= tag === 'svg';
    if (svg && tag === 'use') {
      const reference = source.getAttribute('href') || source.getAttribute('xlink:href');
      if (reference?.startsWith('#')) node.setAttribute('href', reference);
    }
    // Keep each offscreen box as an empty, source-sized spacer so later visible
    // rows keep their scroll position without cloning every offscreen cell.
    // Large unexpected trees are bounded; these are decorative side snapshots.
    if (!svg && !['html','body'].includes(tag) && (rect.bottom < -32 || rect.top > viewport.height + 32 || rect.right < -32 || rect.left > viewport.width + 32 || ++visited > 900)) {
      if (rect.width || rect.height) {
        const computed = doc.defaultView.getComputedStyle(source);
        const vertical = parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom) + parseFloat(computed.borderTopWidth) + parseFloat(computed.borderBottomWidth);
        const height = computed.boxSizing === 'border-box' ? rect.height : Math.max(0, rect.height - (vertical || 0));
        node.style.setProperty('height', `${height}px`, 'important');
        node.style.setProperty('min-height', '0', 'important');
        node.style.setProperty('visibility', 'hidden', 'important');
        node.style.setProperty('overflow', 'hidden', 'important');
      }
      node.removeAttribute('src');
      if (tag === 'iframe') {
        const spacer = document.createElement('div');
        spacer.style.cssText = node.style.cssText;
        spacer.style.width = `${rect.width}px`;
        return spacer;
      }
      return node;
    }
    if (tag === 'iframe') {
      // Hidden roles are not part of the visible stage. Do not recursively
      // clone their trees/styles into every decorative side snapshot.
      if (!rect.width || !rect.height) return null;
      const pane = document.createElement('div');
      pane.style.cssText = source.style.cssText;
      pane.style.width = `${source.clientWidth || rect.width}px`;
      pane.style.height = `${source.clientHeight || rect.height}px`;
      pane.style.overflow = 'hidden';
      pane.hidden = source.hidden;
      try { const nested = copyDocument(source.contentDocument, depth + 1); if (nested) pane.append(nested); } catch { /* Same-origin snapshots only. */ }
      return pane;
    } else if (tag === 'img') {
      const url = localURL(source.currentSrc || source.src, doc.baseURI);
      if (url) node.setAttribute('src', url); else node.removeAttribute('src');
    } else if (tag === 'input') {
      // The live demo contains only synthetic values; preserve what was visible.
      node.setAttribute('value', source.value); node.checked = source.checked;
    } else if (tag === 'textarea') node.textContent = source.value;
    else if (tag === 'option') node.selected = source.selected;
    if (source.scrollTop || source.scrollLeft) {
      node.dataset.v140ScrollTop = source.scrollTop;
      node.dataset.v140ScrollLeft = source.scrollLeft;
    }
    for (const child of tag === 'textarea' ? [] : source.childNodes) {
      const copied = copy(child, svg);
      if (copied) node.append(copied);
    }
    return node;
  }
  const clone = copy(doc.documentElement);
  clone.style.setProperty('width', `${doc.defaultView.innerWidth}px`);
  clone.style.setProperty('min-height', `${doc.defaultView.innerHeight}px`);
  clone.style.setProperty('transform', `translate(${-doc.defaultView.scrollX}px,${-doc.defaultView.scrollY}px)`);
  clone.style.setProperty('transform-origin', 'top left');
  if (!sharedStyle) shadow.append(style);
  shadow.append(clone);
  return host;
}

function restoreScroll(host) {
  for (const node of host.shadowRoot?.querySelectorAll('[data-v140-scroll-top],[data-v140-scroll-left]') || []) {
    node.scrollTop = Number(node.dataset.v140ScrollTop || 0);
    node.scrollLeft = Number(node.dataset.v140ScrollLeft || 0);
  }
  for (const nested of host.shadowRoot?.querySelectorAll('.v140-snapshot-document') || []) restoreScroll(nested);
}


function setup(track){
 const frame=track.querySelector('iframe.inline-service'),shell=frame?.closest('.demo-window');if(!shell||shell.dataset.v147Transition)return false;shell.dataset.v147Transition='true';
 const buttons=[...track.querySelectorAll('[data-step],[data-word-stage]')];let current=-1,overlay=null,animation=null;
 function clear(){animation?.cancel();animation=null;overlay?.remove();overlay=null;}
 function change(index){if(index<0||index===current)return;const previous=current;current=index;clear();if(previous<0||reduced.matches)return;
 const rect=shell.getBoundingClientRect();if(rect.bottom<=0||rect.top>=innerHeight)return;
 try{const doc=frame.contentDocument;if(!doc?.body)return;const snapshot=copyDocument(doc);if(!snapshot)return;
 overlay=document.createElement('div');overlay.className='v147-departing-screen';overlay.inert=true;overlay.setAttribute('aria-hidden','true');overlay.append(snapshot);shell.append(overlay);restoreScroll(snapshot);
 // Incoming real iframe remains opaque throughout: even a cancelled burst has content.
 animation=overlay.animate([{opacity:1},{opacity:0}],{duration:300,easing:'cubic-bezier(.2,.65,.3,1)'});const owned=overlay;animation.finished.catch(()=>{}).finally(()=>{owned.remove();if(overlay===owned){overlay=null;animation=null;}});
 }catch{clear();}}
 track.addEventListener('v140:stagechange',e=>change(e.detail.index));
 const active=()=>buttons.findIndex(b=>b.getAttribute('aria-current')==='step');
 const obs=new MutationObserver(()=>change(active()));buttons.forEach(b=>obs.observe(b,{attributes:true,attributeFilter:['aria-current']}));
 reduced.addEventListener('change',clear);change(active());return true;
}
function init(){for(const t of document.querySelectorAll('[data-scroll-service],.words-scroll-track'))setup(t);}
init();const bootstrap=new MutationObserver(init);bootstrap.observe(document.body,{childList:true,subtree:true});
