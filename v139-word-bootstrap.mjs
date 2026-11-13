import {frameWindow} from './frame-window.mjs';

const gallery = document.querySelector('#static-gallery');
const items = document.querySelector('#static-items');
const legacy = document.querySelector('#words');
legacy.hidden = true;
gallery.hidden = false;
document.body.dataset.mode = 'static';
const article = document.createElement('article');
const frame = document.createElement('iframe');
frame.title = '단어력 테스트';
frame.className = 'inline-service';
frame.dataset.ready = 'false';
frame.tabIndex = -1;
frame.loading = 'eager';
frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
const error = document.createElement('p');
error.className = 'preview-error';
error.hidden = true;
error.setAttribute('role', 'status');
error.textContent = '화면을 불러오지 못했습니다. 새로고침해 주세요.';
frame.src = new URLSearchParams(location.search).has('failapp') ? '/hogan-portfolio/presentation/missing.html' : '/hogan-portfolio/presentation/index.html?manual&inline';
article.append(frameWindow(frame, 'words.demo', error));
items.replaceChildren(article);
document.querySelector('#fallback-reason').textContent = '';
const timeout = setTimeout(() => { if (frame.dataset.ready !== 'true') error.hidden = false; }, 15000);
addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.type !== 'words:ready') return;
  clearTimeout(timeout);
  frame.dataset.ready = 'true';
  error.hidden = true;
});
for (const link of document.querySelectorAll('a[href="#words"]')) link.addEventListener('click', event => {
  event.preventDefault();
  history.pushState(null, '', '#words');
  gallery.scrollIntoView({block: 'start', behavior: 'smooth'});
});
