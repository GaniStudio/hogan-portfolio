// Work intervals stretch by 1.1. First job for every cursor starts at zero.
export const WORK_STRETCH=1.1;
export const WORK_MODE='task'; // User confirmed: each job 1.1x, no artificial full-phase wait.
export function concurrentSchedule(input,{settle=120,minimumWorkEnd=0,desktop=true}={}){
 const referenceWorkEnd=Math.max(minimumWorkEnd,0,...input.map(t=>t.time.done+settle));
 const first=new Map();for(const t of input){const old=first.get(t.agent);if(!old||t.time.approach<old.time.approach)first.set(t.agent,t);}
 const tasks=input.map(t=>{const old=t.time,isFirst=first.get(t.agent)===t,offset=first.get(t.agent).time.box;
 return {id:t.id,agent:t.agent,before:{...old},first:isFirst,time:{approach:isFirst?0:Math.max(0,(old.approach-offset)*WORK_STRETCH),box:(old.box-offset)*WORK_STRETCH,typeStart:(old.typeStart-offset)*WORK_STRETCH,step:old.step*WORK_STRETCH,done:(old.done-offset)*WORK_STRETCH,boxDuration:(old.boxDuration||Math.max(230,old.typeStart-old.box-40))*WORK_STRETCH}};});
 const parallelWorkEnd=Math.max(0,...tasks.map(t=>t.time.done+settle*WORK_STRETCH));
 const workEnd=parallelWorkEnd;
 const orbitLength=desktop?2000:0,exitLength=desktop?360:0;
 return {mode:WORK_MODE,workStretch:WORK_STRETCH,referenceWorkEnd,parallelWorkEnd,workEnd,workShift:workEnd-referenceWorkEnd,settle:settle*WORK_STRETCH,orbitLength,exitLength,beforeTotal:referenceWorkEnd+orbitLength+exitLength,afterTotal:workEnd+orbitLength+exitLength,tasks};
}
