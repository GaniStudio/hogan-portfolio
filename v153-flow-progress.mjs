export function flowProgress(top,laneTop,laneHeight,caseHeight){const travel=Math.max(1,laneHeight-caseHeight);return Math.max(0,Math.min(1,(top-laneTop-80)/Math.max(1,travel-320)));}
export function navExitShift(caseTop,stickyTop){return Math.min(0,caseTop-stickyTop);}
