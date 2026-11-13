import {phoneTour} from '../student-db/tour-fixture.mjs';
// All records below are fictional UI exercise data, not operating results.
export function createDbFixture(){
 const makeStudent=(id,name,course,normal,missing,late,teacher)=>({id,name,course,email:id,earlyBird:'N',isTest:false,totalTasks:20,submissionRate:normal/20*100,missingCount:missing,lateCount:late,unknownTaskCount:0,missingRate:missing/20,pronunciation:{option:'발음코칭',used:1,total:6,remaining:5,status:'진행 중'},writing:{used:1,total:3,pending:1,status:'진행 중'},phone:{teacher,attended:2,total:11,status:'진행 중',evaluationCount:3}});
 const students=Array.from({length:40},(_,index)=>{
  const number=index+1,tag=String(number).padStart(2,'0');
  const missing=Math.floor(number*.8),late=number-missing,normal=100-number;
  const student=makeStudent('portfolio-demo-'+tag,'체험학습자 '+tag,'중고급',normal,missing,late,'체험선생님 01');
  Object.assign(student,{totalTasks:100,submissionRate:normal,missingRate:missing/100});
  student.pronunciation={option:'발음코칭',used:1,total:6,remaining:5,status:'이용 중'};
  student.writing={used:1,total:3,pending:1,status:'진행 중'};
  student.phone={teacher:'체험선생님 01',attended:3,total:11,status:'수업 진행 중',evaluationCount:3};
  return student;
 });
 const makeEvaluation=(student,index,absent=false)=>({id:`demo-eval-${student.id}-${index}`,studentId:student.id,name:student.name,course:student.course,type:'전화수업',round:`${index}주차`,lessonDate:`2026-10-${String(5+(index-1)*7).padStart(2,'0')}`,teacher:student.phone.teacher,attendance:absent?'결석':'출석',scores:absent?{speaking:null,pronunciation:null,grammar:null,vocabulary:null,listening:null}:{speaking:7,pronunciation:8,grammar:6,vocabulary:8,listening:7},totalScore:absent?null:72,scoreScale:10,feedback:{good:absent?'':'학습한 표현을 문장으로 연결하는 흐름을 확인했습니다.',improve:absent?'':'다음 연습에서 문장을 한 번 더 나누어 확인합니다.',overall:'',expressions:'',corrections:[]},corrections:[],issue:absent?'':'',evidenceFile:'',evidenceStatus:'미첨부',recordStatus:'활성',version:1,changeType:'신규'});
 const evaluations=students.flatMap(s=>[makeEvaluation(s,1),makeEvaluation(s,2),makeEvaluation(s,3,true)]);
 const keys=['speaking','pronunciation','grammar','vocabulary','listening'];
 students[24].phone.attended=3;
 evaluations.filter(e=>e.studentId===students[24].id).forEach((evaluation,i)=>{
  const row=phoneTour[i];
  Object.assign(evaluation,{attendance:'출석',issue:'',scores:Object.fromEntries(keys.map((key,j)=>[key,row.scores[j]])),totalScore:row.total});
  Object.assign(evaluation.feedback,{good:row.good,improve:row.improve,corrections:row.corrections.map(([original,corrected])=>original+' → '+corrected).join('\n')});
 });
 const missingTasks=students.map(s=>({studentId:s.id,name:s.name,course:s.course,lesson:'학습 1회차',missing:s.missingCount,lateCount:s.lateCount,missingTaskNames:Array.from({length:s.missingCount},(_,i)=>`미제출 과제 ${i+1}`),lateTaskNames:Array.from({length:s.lateCount},(_,i)=>`지각 과제 ${i+1}`)}));
 const periodRows=students.flatMap(s=>Array.from({length:100},(_,i)=>({studentId:s.id,dueDate:new Date(Date.UTC(2026,6,1+i)).toISOString().slice(0,10),title:`과제 ${i+1}`,status:i<s.totalTasks-s.missingCount-s.lateCount?'on-time':i<s.totalTasks-s.missingCount?'late':'missing'})));
 const first=students[24];
 return {synthetic:true,asOf:'2026-10-20',students,evaluations,evaluationAudit:[],missingTasks,contactRecords:[],monthlyTests:students.map(s=>({studentId:s.id,name:s.name,course:s.course,round:'월간 테스트 1회',score:72,change:''})),phoneManagement:students.map(s=>({studentId:s.id,name:s.name,course:s.course,...s.phone})),periodRows,studentView:{name:first.name,course:first.course,homework:{total:100,submitted:75,missing:20,late:5,submissionRate:75},phone:first.phone,pronunciation:{available:true,...first.pronunciation},lateSubmissionAvailable:false}};
}

export function summarizePeriod(rows,{from,to,asOf}){
 const valid=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date+'T00:00:00Z'))&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date;
 if(!valid(from)||!valid(to)||!valid(asOf)||from>to)return {ok:false,message:'시작일과 종료일을 확인해 주세요.'};
 const due=rows.filter(r=>valid(r.dueDate)&&r.dueDate>=from&&r.dueDate<=to&&r.dueDate<=asOf);
 const unknown=due.filter(r=>!['on-time','late','missing'].includes(r.status)).length;
 const onTime=due.filter(r=>r.status==='on-time').length,late=due.filter(r=>r.status==='late').length,missing=due.filter(r=>r.status==='missing').length;
 return {ok:true,total:due.length,onTime,late,missing,unknown,rate:due.length&&!unknown?Math.round(onTime/due.length*1000)/10:null};
}
