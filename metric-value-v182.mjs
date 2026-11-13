export function countValue(target,progress){
  const p=Math.max(0,Math.min(1,progress));
  return Math.min(target,Math.max(1,Math.round(1+(target-1)*(1-Math.pow(1-p,3)))));
}
