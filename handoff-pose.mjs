import * as THREE from './vendor/three.module.js';
import {cameraPose} from './camera-path.mjs';
function cameraMatrix(pose,width,height){const camera=new THREE.PerspectiveCamera(38,width/height,1,10000);camera.position.set(...pose.camera);camera.lookAt(...pose.look);camera.updateMatrixWorld();return camera.matrixWorld;}
// Express the next chapter's first object in the current camera's coordinates.
// At p=1 its projected corners equal the next chapter at p=0, avoiding a cut.
export function handoffTransform(pose,width,height){
 const entry=cameraPose(0,width,height),nextObject=new THREE.Object3D();nextObject.position.set(...entry.object);nextObject.rotation.set(...entry.rotation);nextObject.updateMatrixWorld();
 const matrix=cameraMatrix(pose,width,height).clone().multiply(cameraMatrix(entry,width,height).clone().invert()).multiply(nextObject.matrixWorld);
 const position=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scale=new THREE.Vector3();matrix.decompose(position,quaternion,scale);return {position,quaternion,scale};
}

export const departureOpacity=p=>p<.908?1:0;
export const arrivalBlend=p=>layeredArrivalBlend(p);

// The incoming surface approaches behind the departing plane. Its entire
// surface stays deeper until the outgoing plane is outside the viewport.
export function layeredArrivalBlend(p){const t=Math.max(0,Math.min(1,(p-.88)/.08));return 1-(1-t)**3;}
export function layeredPreviewTransform(pose,width,height,p){
 const blend=layeredArrivalBlend(p),end=handoffTransform(pose,width,height);
 const position=new THREE.Vector3((width*.655-width/2)/pose.scale+1180,-30,-950).lerp(end.position,blend);
 // Give the incoming surface its own space at mid-transition, then meet the exact entry pose.
 position.x-=240*4*blend*(1-blend);
 const quaternion=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,-.50,0)).slerp(end.quaternion,blend);
 return {position,quaternion,scale:new THREE.Vector3(1,1,1).lerp(end.scale,blend)};
}
