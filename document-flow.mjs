import {frameWindow} from './frame-window.mjs';
for (const [id, address] of [['student-db','student-db.demo'],['lms','lms.demo']]) {
  const app = document.querySelector('#'+id+' iframe.inline-service');
  if (app) frameWindow(app, address);
}
