import * as THREE from './vendor/three.module.js';
import {layeredPreviewTransform,arrivalBlend} from './handoff-pose.mjs';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
export function createNextWork(cssScene,scene,src,title){
 let object,mesh,loaded=false;
 return {update(p,pose){
  const intro=p<.18,exit=p>.78;
  if((!intro&&!exit)||!src){if(object)object.visible=false;if(mesh)mesh.visible=false;return}
  if(!object){
   const shell=document.createElement('div');shell.className='app-object next-work';shell.style.cssText='width:1040px;height:720px';shell.inert=true;
   const f=document.createElement('iframe');f.title=title+' 다음 작품 미리보기';f.tabIndex=-1;f.setAttribute('sandbox','allow-scripts allow-same-origin');
   f.onload=()=>{try{loaded=!!f.contentDocument?.querySelector('[data-demo-root]');shell.style.opacity='0';mesh.visible=loaded;document.dispatchEvent(new Event('hogan:motion'))}catch{loaded=false;shell.style.opacity='0';mesh.visible=false}};
   f.src=src;shell.append(f);object=new CSS3DObjectLocal(shell);cssScene.add(object);mesh=new THREE.Mesh(new THREE.BoxGeometry(1046,726,14),new THREE.MeshStandardMaterial({color:'#293839',roughness:.8,metalness:.2}));scene.add(mesh);
  }
  object.visible=true;mesh.visible=loaded;
  const blend=exit?arrivalBlend(p):0,opacity=intro?.24*(1-smooth(p/.18)):smooth((p-.78)/.12);
  mesh.material.transparent=true;mesh.material.opacity=opacity;mesh.visible=loaded&&opacity>.001;object.element.style.opacity=loaded?String(opacity):'0';object.element.style.filter=`saturate(${.55+.45*blend})`;
  const transform=layeredPreviewTransform(pose,innerWidth,innerHeight,p);
  object.position.copy(transform.position);object.quaternion.copy(transform.quaternion);object.scale.copy(transform.scale);mesh.position.copy(object.position);mesh.quaternion.copy(object.quaternion);mesh.scale.copy(transform.scale);
  // Offset along the object's local normal, so the matte back never covers UI.
  mesh.position.add(new THREE.Vector3(0,0,-10).applyQuaternion(object.quaternion));
 }};
}
import {CSS3DObject as CSS3DObjectLocal} from './vendor/CSS3DRenderer.js';
