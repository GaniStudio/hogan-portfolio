// This module has no 3D dependencies. Keep a readable route when a scene module fails to load.
export function showWordFallback(doc = document) {
  const scene = doc.querySelector('#words');
  const gallery = doc.querySelector('#static-gallery');
  const items = doc.querySelector('#static-items');
  if (!scene || !gallery || !items) return false;
  scene.hidden = true;
  gallery.hidden = false;
  const reason = doc.querySelector('#fallback-reason');
  if (reason) reason.textContent = '3D 작품 화면을 불러오지 못해 일반 목록으로 보여드립니다.';
  if (!items.hasChildNodes()) {
    for (const [title, description] of [
      ['단어를 맞추기', '베트남어와 한국어를 연결하는 화면입니다.'],
      ['결과 읽기', '맞힌 단어와 다음 학습 안내를 확인합니다.']
    ]) {
      const article = doc.createElement('article');
      const heading = doc.createElement('h2');
      const copy = doc.createElement('p');
      heading.textContent = title;
      copy.textContent = description;
      article.append(heading, copy);
      items.append(article);
    }
  }
  const button = doc.querySelector('#static-practice');
  if (button?.tagName === 'BUTTON') {
    const link = doc.createElement('a');
    link.className = button.className;
    link.href = '/hogan-portfolio/presentation/index.html?manual';
    link.textContent = '단어력 로컬 체험 열기 ↗';
    button.replaceWith(link);
  }
  for (const link of doc.querySelectorAll('a[href="#words"]')) link.href = '#static-gallery';
  doc.body.dataset.mode = 'static';
  return true;
}

export function showServiceFallback(doc = document) {
  let changed = false;
  for (const section of doc.querySelectorAll('.service-journey[data-app]')) {
    if (section.dataset.mode === 'static') continue;
    section.dataset.mode = 'static';
    changed = true;
    const staticView = section.querySelector('.service-static');
    if (!staticView) continue;
    const notice = doc.createElement('p');
    notice.className = 'preview-error';
    notice.textContent = '3D 시연을 불러오지 못했습니다. 아래 설명을 읽거나 로컬 체험을 열 수 있습니다.';
    staticView.prepend(notice);
    for (const frame of staticView.querySelectorAll('iframe[data-src]')) {
      // Preserve an already displayed local app/preview and its current state.
      if (frame.getAttribute?.('src')) continue;
      frame.loading = 'lazy';
      frame.src = frame.dataset.src;
    }
    for (const button of staticView.querySelectorAll('button[data-service-practice]')) {
      const link = doc.createElement('a');
      link.className = button.className;
      link.href = `${section.dataset.app}?manual`;
      link.textContent = '로컬 체험 열기 ↗';
      button.replaceWith(link);
    }
  }
  return changed;
}

export function installSceneFailureFallback(doc = document, win = window) {
  const reported = new Set();
  const fail = name => {
    if (reported.has(name)) return;
    reported.add(name);
    if (name === 'showcase.js') showWordFallback(doc);
    if (name === 'service-scenes.mjs') showServiceFallback(doc);
  };
  for (const script of doc.querySelectorAll('script[type="module"][src]')) {
    const name = script.getAttribute('src')?.split('/').at(-1);
    if (name === 'showcase.js' || name === 'service-scenes.mjs') {
      script.addEventListener('error', () => fail(name));
    }
  }
  win.addEventListener('error', event => {
    const source = String(event.filename || event.target?.src || '');
    if (source.endsWith('/hogan-portfolio/showcase.js')) fail('showcase.js');
    if (source.endsWith('/hogan-portfolio/service-scenes.mjs')) fail('service-scenes.mjs');
  }, true);
  win.HoGanSceneFailure = { fail };
}

if (typeof document !== 'undefined') installSceneFailureFallback();
