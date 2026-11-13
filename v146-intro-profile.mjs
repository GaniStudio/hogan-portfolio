export function introProfile(width){
 if(width<700)return {name:'mobile',count:6,owners:[1,0,0,0,1,1,1,1,1,1,3,4,5,2],previewOwners:[3,4,5]};
 if(width<1100)return {name:'tablet',count:10,owners:[0,1,0,2,3,3,4,4,5,5,7,8,9,6],previewOwners:[7,8,9]};
 return {name:'desktop',count:14,owners:Array.from({length:14},(_,i)=>i),previewOwners:[10,11,12]};
}
export function sequentialTimes(original,index,count,offset=0,copyEnd=3360){
 const slot=Math.min(900,(copyEnd-240-offset)/count);
 const scale=(slot-160)/(original.done-original.approach),start=offset+index*slot;
 return {approach:start,box:start+(original.box-original.approach)*scale,typeStart:start+(original.typeStart-original.approach)*scale,step:original.step*scale,done:start+slot-160,boxDuration:230*scale};
}
