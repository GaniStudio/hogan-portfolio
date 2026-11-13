const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
// One progress domain owns arrival, readable hold and departure.
export function dbShowcasePose(p,w,h){
 const enter=1-smooth(p/.19),exit=smooth((p-.91)/.09);
 const scale=Math.min(h*.76/720,w*.64/920);
 const z=h/(2*Math.tan(38*Math.PI/360))/scale;
 return {camera:[-100*enter,70*enter,z*(1+.12*enter+.035*exit)],look:[0,0,0],object:[w*.165/scale+100*enter,-25*enter+45*exit,-100*enter-90*exit],rotation:[.20*enter,-.18*enter-.035*exit,-.025*enter],scale};
}
