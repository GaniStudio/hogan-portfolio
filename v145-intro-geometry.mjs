export function localRect(rect,origin){
 return {left:rect.left-origin.left,right:rect.right-origin.left,top:rect.top-origin.top,bottom:rect.bottom-origin.top,width:rect.width,height:rect.height};
}
export function overlaps(a,b,padding=1){return a.left<b.right+padding&&a.right>b.left-padding&&a.top<b.bottom+padding&&a.bottom>b.top-padding;}
export function distanceToRect(p,r){return Math.hypot(Math.max(r.left-p.x,0,p.x-r.right),Math.max(r.top-p.y,0,p.y-r.bottom));}
export function cursorSize(width){return width<700?14:width<1100?17:20;}
// Keep the icon outside the whole text block; its x follows the measured glyph.
export function safeTextPoint(glyph,box,size,blocked,width){
 const x=Math.max(2,Math.min(width-size-2,glyph.left));
 const candidates=[{x,y:box.top-size-5},{x,y:box.bottom+5},{x:box.left-size-6,y:glyph.top},{x:box.right+6,y:glyph.top}];
 for(const p of candidates){const r={left:p.x,right:p.x+size,top:p.y,bottom:p.y+size*1.03};if(r.left>=0&&r.right<=width&&!blocked.some(b=>overlaps(r,b)))return p;}
 return null;
}
