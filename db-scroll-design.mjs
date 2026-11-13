import * as THREE from 'three';
export {dbShowcasePose} from './db-scroll-pose.mjs';
export function createDBAtmosphere(scene){
 const group=new THREE.Group();scene.background=null;
 const geometry=new THREE.PlaneGeometry(14000,9000);
 const material=new THREE.ShaderMaterial({depthWrite:false,uniforms:{progress:{value:0},pointer:{value:new THREE.Vector2()}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float progress;uniform vec2 pointer;
 void main(){vec2 uv=vUv;vec2 center=vec2(.60+pointer.x*.014,.52+pointer.y*.012);float glow=exp(-length((uv-center)*vec2(1.4,1.))*7.);float band=exp(-abs(uv.y-.42-sin(uv.x*5.+progress*1.8)*.045)*48.);vec3 color=mix(vec3(.018,.033,.045),vec3(.055,.14,.17),glow);color+=vec3(.025,.05,.055)*band;gl_FragColor=vec4(color,1.);}`});
 const plane=new THREE.Mesh(geometry,material);plane.position.z=-1600;plane.visible=false;group.add(plane);
 const light=new THREE.SpotLight('#aaccca',2,5000,1.1,.8);light.position.set(0,600,1200);group.add(light,light.target);
 group.userData.cursorLight=light;
 group.userData.update=(p,x,y)=>{material.uniforms.progress.value=p;material.uniforms.pointer.value.set(x,y)};
 scene.add(group);return group;
}
