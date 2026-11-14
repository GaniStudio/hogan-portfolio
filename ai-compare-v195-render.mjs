import {copy,timeline} from './ai-compare-v195-content.mjs';
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function initialState(){return {step:-1,tab:-1,chat:[],logs:[],lit:[],row:false,hot:false,status:['',copy.rows[0][2]],cells:copy.rows[0].slice(3)}}
export function applyOps(state,ops){for(const [kind,a,b] of ops){switch(kind){
 case 'step':state.step=a;break;case 'tab':state.tab=a;state.chat=[];break;
 case 'say':state.chat.push([a,b]);break;case 'log':state.logs.push([a,b]);state.logs=state.logs.slice(-5);break;
 case 'lit':if(!state.lit.includes(a))state.lit.push(a);break;
 case 'row':state.row=a;state.hot=b;break;case 'status':state.status=[a,b];break;case 'cell':state.cells[a]=b;break;
 }}return state}
export function finalState(){const s=initialState();for(const [,ops]of timeline)applyOps(s,ops);return s}
export function render(s){return `<div class="v195-steps">${copy.steps.map((x,i)=>`<span class="${s.step===i?'on':''}">${esc(x)}</span>`).join('')}</div>
 <div class="v195-wrap"><div><div class="v195-lab"><b>${esc(copy.labels[0][0])}</b><span>${esc(copy.labels[0][1])}</span></div><div class="v195-pn">
 <div class="v195-tabs">${copy.tabs.map((x,i)=>`<span class="${s.tab===i?'on':''}">${esc(x)}</span>`).join('')}</div>
 <div class="v195-chat">${s.chat.map(([c,t])=>`<div class="v195-m ${c}">${esc(t)}</div>`).join('')}</div><div class="v195-ip"><span>${esc(copy.input)}</span></div></div></div>
 <div><div class="v195-lab"><b>${esc(copy.labels[1][0])}</b><span>${esc(copy.labels[1][1])}</span></div><div class="v195-pn">
 <div class="v195-term"><div class="v195-th"><i></i><i></i><i></i><span>${esc(copy.terminal)}</span></div><div class="v195-log">${s.logs.map(([c,t])=>`<div class="${c}" title="${esc(t)}">${esc(t)}</div>`).join('')}</div></div>
 <div class="v195-bh"><b>${esc(copy.board)}</b><span>${esc(copy.count)}</span></div>
 <table><thead><tr>${copy.headers.map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${copy.rows.map((r,i)=>`<tr class="${i===0?'v195-current'+(s.row?' in':'')+(s.hot?' hot':''):''}"><td class="id">${esc(r[0])}<b>${esc(r[1])}</b></td><td><span class="v195-st ${i===0?s.status[0]:i===1?'go':'ok'}">${esc(i===0?s.status[1]:r[2])}</span></td>${(i===0?s.cells:r.slice(3)).map(x=>`<td class="${x===copy.rows[0][3]||x===copy.rows[1][5]?'dim':''}">${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div></div>
 <div class="v195-caps">${copy.captions.map((r,i)=>r.map((t,j)=>`<span data-caption="${j?'n':'o'}${i+1}" class="${j?'new':'old'} ${!t?'blank':s.lit.includes((j?'n':'o')+(i+1))?'on':''}">${esc(t)}</span>`).join('')).join('')}</div>`}
export function renderArticle(){return `<article class="ai-system-scene ai-system-compare v195-compare"><h3>${esc(copy.title)}</h3><div class="v195-scene" data-state="complete">${render(finalState())}</div><button type="button" class="v195-replay" hidden>${esc(copy.replay)}</button></article>`}
