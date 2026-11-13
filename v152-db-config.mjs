export const sheetDelayMs=280;export const previewPixelsPerMs=.20;
export function sheetBit(row,col){let x=Math.imul(row+17,374761393)^Math.imul(col+31,668265263);x=Math.imul(x^(x>>>13),1274126177);return ((x^(x>>>16))>>>0)%100<58?'1':'0';}
export function shuffleCells(cells){const a=[...cells];for(let i=a.length-1;i>0;i--){const j=(Math.imul(i+73,2654435761)>>>0)%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
