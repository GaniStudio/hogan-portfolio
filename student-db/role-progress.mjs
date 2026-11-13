const clamp=n=>Math.max(0,Math.min(1,n));

// The feedback modal is finished before the operator view begins its reveal.
export function studentPresentationProgress(progress){
 const p=clamp(progress);
 if(p<=.48)return Math.min(.9,p*1.8);
 if(p<.50)return .864+(.43-.864)*((p-.48)/.02);
 return .43;
}

export function operatorReveal(progress,{manual=false,role='student',ready=false}={}){
 if(!ready)return 0;
 return manual?(role==='operator'?1:0):clamp((progress-.50)/.14);
}
