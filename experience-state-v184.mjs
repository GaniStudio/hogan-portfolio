export const returnKey='hogan-db-experience-v184';
export function safeReturn(saved,base){
 const origin=new URL(base).origin,fallback=new URL('../../#student-db',base);
 try{const url=new URL(saved?.href,base);return url.origin===origin&&!url.pathname.includes('/hogan-portfolio/experience/')?url.href:fallback.href}catch{return fallback.href}
}
export function validStep(step){return ['lookup','overview','feedback'].includes(step)?step:'lookup'}
