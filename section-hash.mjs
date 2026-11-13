const managed=new Set(['','#intro','#motivation','#about','#words','#db-story','#student-db','#db-decision','#lms-story','#lms','#reading','#ai-workflow','#vision']);
export function visibleSectionHash(current,visible,dialogOpen=false){
 if(dialogOpen||!managed.has(current)||!managed.has(visible)||!visible)return current;
 return visible==='#about'?'#intro':visible;
}


