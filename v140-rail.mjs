// One original live app per service. Side panels are inert copies of stages
// actually visited in this session, never a guessed next-screen illustration.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width:1100px)');
const states = [];
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
    if (source.nodeType !== 1) return source.nodeType === 3 ? source.cloneNode(false) : null;
    const tag = source.localName;
    if (['head','script','link','style','meta','base','object','embed','audio','video','source','track','noscript'].includes(tag) || source.hidden) return null;
    const rect = source.getBoundingClientRect();
    // Prune whole hidden roles before walking their potentially large trees.
    // display:contents and SVG definitions can have no box yet paint children.
    if (!svg && tag !== 'svg' && !rect.width && !rect.height && doc.defaultView.getComputedStyle(source).display === 'none') return null;
    const node = source.cloneNode(false);
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

// Latest feedback requests the existing stage name for 1.5 seconds. The layer
// has no panel or hit area, so the original app remains readable/interactive.
function cancel(state) {
 clearTimeout(state.timer); clearTimeout(state.rowsTimer); clearTimeout(state.titleTimer);
 if(state.layer)state.layer.hidden=true;
 state.animations.forEach(animation=>animation.cancel());state.animations=[];
}

function announce(state) {
  if(reduced.matches || !state.layer)return;
  const box=state.shell.getBoundingClientRect();
  if(box.bottom<=0 || box.top>=innerHeight)return;
  clearTimeout(state.titleTimer);
  state.layer.textContent=(state.buttons[state.current]?.textContent||'').trim().replace(/^\d+\s*[—–.·-]?\s*/,'');
  if(!state.layer.textContent)return;
  state.layer.hidden=false;
  state.animations.push(state.layer.animate([{opacity:0,offset:0},{opacity:1,offset:.12},{opacity:1,offset:.78},{opacity:0,offset:1}],{duration:1500,easing:'linear'}));
  state.titleTimer=setTimeout(()=>{state.layer.hidden=true;},1500);
}

function animateRows(state) {
  if (reduced.matches) return;
  const documents = [];
  function visit(doc, depth = 0) {
    if (!doc?.body || depth > 2) return;
    documents.push(doc);
    for (const child of doc.querySelectorAll('iframe')) {
      if (!child.getBoundingClientRect().width || !child.getBoundingClientRect().height) continue;
      try { visit(child.contentDocument, depth + 1); } catch { /* Not our same-origin app. */ }
    }
  }
  try { visit(state.frame.contentDocument); } catch { return; }
  let count = 0;
  for (const doc of documents) {
    // Existing rows only; no mock status, progress timer or text is inserted.
    const candidates = [...doc.querySelectorAll('tbody > tr,[data-feedback-index],.feedback-card,.lesson-row,.assignment-card')];
    for (const row of candidates) {
      const rect = row.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > doc.defaultView.innerHeight) continue;
      const animation = row.animate([{opacity:0,transform:'translateY(8px)',filter:'blur(2px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}], {duration:360,delay:count * 70,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
      state.animations.push(animation);
      if (++count >= 10) return;
    }
  }
}

function renderNeighbors(state, index) {
  if (!state.rail || state.axis === 'vertical') return;
  for (const [side, offset] of [['previous',-1],['next',1]]) {
    const pane = state[side]; pane.replaceChildren();
    const snapshot = state.snapshots.get(index + offset);
    pane.hidden = !desktop.matches || !snapshot;
    if (!pane.hidden) { pane.append(snapshot); restoreScroll(snapshot); }
  }
  state.rail.dataset.previousReady = String(state.snapshots.has(index - 1));
  state.rail.dataset.nextReady = String(state.snapshots.has(index + 1));
}

function capture(state, index) {
  if (!desktop.matches || index < 0 || !state.rail || state.axis === 'vertical') return;
  try {
    const doc = state.frame.contentDocument;
    if (!doc?.documentElement?.dataset.demoMode) return;
    const snapshot = copyDocument(doc);
    if (snapshot) state.snapshots.set(index, snapshot);
  } catch { /* Failure leaves the side absent instead of showing another stage. */ }
}

function change(state, index, previous = state.current) {
  if (index === state.current || index < 0) return;
  capture(state, previous);
  cancel(state);
  const direction = index >= previous ? 1 : -1;
  state.current = index;
  renderNeighbors(state, index);
  announce(state);
  // A burst animates only its final selected screen.
  state.timer = setTimeout(() => {
    const bounds = state.shell.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top >= innerHeight) return;
    if (state.rail && !reduced.matches && previous >= 0) {
      const bounds=state.shell.getBoundingClientRect();
      const vertical=state.axis==='vertical';
      const distance=vertical?Math.min(96,bounds.height*.14):bounds.width+32;
      const axis=vertical?'Y':'X';
      const animation=state.rail.animate([{transform:'translate'+axis+'('+direction*distance+'px)'},{transform:'translate'+axis+'(0)'}], {duration:vertical?560:700,easing:vertical?'cubic-bezier(.22,1,.36,1)':'cubic-bezier(.32,.72,0,1)'});
      // Anchor DB motion to the active document clock instead of leaving its
      // start unresolved while a newly selected iframe view is being rendered.
      if(vertical && Number.isFinite(document.timeline?.currentTime)) animation.startTime=document.timeline.currentTime;
      state.animations.push(animation);
      state.rowsTimer = setTimeout(() => animateRows(state), 120);
    }
  }, state.axis==='vertical'?0:140);
}

function setup(track, words = false) {
  const frame = track.querySelector('iframe.inline-service');
  const shell = frame?.closest('.demo-window');
  if (!shell || shell.dataset.v140RailBound) return false;
  shell.dataset.v140RailBound = 'true';
  const buttons = [...track.querySelectorAll(words ? '[data-word-stage]' : '[data-step]')];
  const state = {track, frame, shell, buttons, current:-1, animations:[], snapshots:new Map(), axis:track.dataset.scrollService==='student-db'?'vertical':'horizontal'};
  const label=document.createElement('div');label.className='v140-stage-title';label.setAttribute('aria-hidden','true');label.inert=true;label.hidden=true;shell.append(label);state.layer=label;
  const entry=new IntersectionObserver(entries=>{for(const item of entries)if(item.isIntersecting&&!state.entered){state.entered=true;announce(state);}},{threshold:.25});entry.observe(shell);
  if (!words) {
    const rail = document.createElement('div'); rail.className = 'v140-stage-rail';
    shell.before(rail); rail.append(shell); state.rail = rail;
    for (const side of ['previous','next']) {
      const pane = document.createElement('div');
      pane.className = `v140-rail-neighbor v140-rail-${side}`;
      pane.setAttribute('aria-hidden','true'); pane.inert = true; pane.hidden = true;
      rail.append(pane); state[side] = pane;
    }
    track.addEventListener('v140:stagechange', event => change(state, event.detail.index, event.detail.previous));
  }
  const active = () => buttons.findIndex(button => button.getAttribute('aria-current') === 'step');
  // Also supports manual/reduced-motion buttons and late loading of the rail.
  const observer = new MutationObserver(() => change(state, active()));
  for (const button of buttons) observer.observe(button, {attributes:true, attributeFilter:['aria-current']});
  states.push(state);
  change(state, active());
  return true;
}

function initialize() {
  for (const track of document.querySelectorAll('[data-scroll-service]')) setup(track);
  const words = document.querySelector('.words-scroll-track');
  if (words) setup(words, true);
}
initialize();
// Word bootstrap creates its real frame later. Disconnect once all are bound.
const bootstrap = new MutationObserver(() => {
  initialize();
  if ([...document.querySelectorAll('[data-scroll-service],.words-scroll-track')].every(track => track.querySelector('[data-v140-rail-bound]'))) bootstrap.disconnect();
});
bootstrap.observe(document.body, {childList:true,subtree:true});
desktop.addEventListener('change', () => states.forEach(state => renderNeighbors(state,state.current)));
reduced.addEventListener('change', () => states.forEach(state => { cancel(state); }));
