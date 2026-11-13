import {phoneTour} from './tour-fixture.mjs';
const scoreDefinitions=[
 {key:'speaking',vi:'Nói',ko:'말하기',hint:'Tự tin, lưu loát, hoàn thành câu'},
 {key:'pronunciation',vi:'Phát âm',ko:'발음',hint:'Phụ âm, nguyên âm, thanh điệu, ngữ điệu'},
 {key:'grammar',vi:'Ngữ pháp',ko:'문법',hint:'Cấu trúc câu, liên từ, độ chính xác'},
 {key:'vocabulary',vi:'Từ vựng',ko:'어휘',hint:'Từ phù hợp, mức độ đa dạng'},
 {key:'listening',vi:'Nghe hiểu',ko:'듣기',hint:'Nắm được câu hỏi và phản ứng trong lớp'}
];
// Display template from canonical assets/teacher.js initializeScores.
document.getElementById('scoreList').innerHTML=scoreDefinitions.map(definition=>`
 <div class="score-row">
  <div class="score-row__title">${definition.vi} <span>${definition.ko} · ${definition.hint}</span></div>
  <input class="score-range" id="${definition.key}Range" type="range" min="0" max="10" step="1" value="0" aria-label="${definition.vi}">
  <input class="score-number" id="${definition.key}Score" name="${definition.key}" type="number" min="0" max="10" step="1" value="0" inputmode="numeric" aria-label="${definition.vi} 10점 만점">
 </div>`).join('');
const teacher=document.getElementById('teacherName'),student=document.getElementById('studentName'),week=document.getElementById('lessonWeek');
teacher.insertAdjacentHTML('beforeend','<option value="teacher-01">체험선생님 01</option>');
student.insertAdjacentHTML('beforeend','<option value="portfolio-demo-25">체험학습자 25</option>');
week.insertAdjacentHTML('beforeend',Array.from({length:24},(_,i)=>`<option value="${i+1}">Tuần ${i+1} · ${i+1}주차</option>`).join(''));
document.getElementById('lessonDate').value='2026-10-12';
for(const anchor of document.querySelectorAll('a'))anchor.addEventListener('click',event=>event.preventDefault());
document.getElementById('teacherForm').addEventListener('submit',event=>event.preventDefault());
const clamp=value=>Math.max(0,Math.min(1,value));
const row=phoneTour[1];
function progress(fraction){
 const f=clamp(fraction);
 teacher.value=f>.06?'teacher-01':'';
 student.value=f>.13?'portfolio-demo-25':'';
 week.value=f>.20?'2':'';
 let total=0;
 scoreDefinitions.forEach(({key},i)=>{
  const score=f>.28+i*.065?row.scores[i]:0;
  document.getElementById(key+'Range').value=String(score);
  document.getElementById(key+'Score').value=String(score);
  total+=score*2;
 });
 document.getElementById('goodFeedback').value=row.good.slice(0,Math.ceil(row.good.length*clamp((f-.58)/.14)));
 document.getElementById('improveFeedback').value=row.improve.slice(0,Math.ceil(row.improve.length*clamp((f-.72)/.13)));
 const corrections=document.getElementById('correctionList');
 corrections.replaceChildren();
 if(f>.85)for(const [wrong,right] of row.corrections){
  const line=document.createElement('div');line.className='correction-row';
  for(const [value,className] of [[wrong,'correction-wrong'],[right,'correction-right']]){
   const input=document.createElement('input');input.className='input '+className;input.value=value;line.append(input);
  }
  const button=document.createElement('button');button.type='button';button.className='remove-correction';button.textContent='×';line.append(button);corrections.append(line);
 }
 document.getElementById('summaryTotal').textContent=String(total);
 document.getElementById('summaryStudent').textContent=student.value?'체험학습자 25':'Chưa chọn';
 document.getElementById('summaryWeek').textContent=week.value?'Tuần 2':'Chưa chọn';
 document.getElementById('summaryLevel').textContent=total>=70?'안정':total?'성장 중':'Chưa đánh giá';
 document.getElementById('summaryCopy').textContent=[student.value?'체험학습자 25 · 중고급':'Chưa chọn học viên.',`Tổng điểm: ${total}/100`,document.getElementById('goodFeedback').value||'Chưa nhập điểm học viên làm tốt.',document.getElementById('improveFeedback').value||'Chưa nhập điểm cần cải thiện.'].join('\n\n');
 const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
 scrollTo(0,max*clamp((f-.26)/.74));
 document.documentElement.dataset.tourFraction=String(f);
 document.documentElement.dataset.score=String(total);
}
window.addEventListener('message',event=>{
 if(event.source===parent&&event.origin===location.origin&&event.data?.type==='db:teacher-tour')progress(event.data.fraction);
});
document.documentElement.dataset.demoMode='presentation';
progress(0);
parent.postMessage({type:'demo:ready',id:'student-db'},location.origin);
