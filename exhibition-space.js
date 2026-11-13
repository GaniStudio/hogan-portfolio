import * as THREE from './vendor/three.module.js';

// Authored geometry only: continuous folded surfaces, not stock imagery,
// a screenshot backdrop, a surrounding frame, or an achievement chart.
const themes={words:['#8d9d9a','#d3a68f'], 'student-db':['#749caa','#a2c9c0'],lms:['#798ca9','#b5b9d8']};
function ribbon(index){
 const positions=[],colors=[],indices=[],edge=[],n=180,m=10;
 const a=new THREE.Color('#516b71'),b=new THREE.Color('#b8b6a4');
 for(let i=0;i<=n;i++){
  const t=i/n,angle=t*Math.PI*1.76-.78+index*.48;
  const x=-2800+t*6400,cy=-420+Math.sin(angle)*880+index*650;
  const z=-1650+Math.cos(angle)*650-index*480;
  const twist=angle*1.35+index*.7,band=(100+Math.sin(t*Math.PI)*190)*(index? .72:1);
  for(let j=0;j<=m;j++){
   const v=(j/m-.5)*2,fold=22*Math.sin(v*Math.PI);
   const y=cy+v*band*Math.cos(twist)+fold,depth=z+v*band*Math.sin(twist);
   positions.push(x,y,depth);
   const c=a.clone().lerp(b,(v+1)*.22+Math.sin(t*Math.PI)*.18);colors.push(c.r,c.g,c.b);
   if(j===m)edge.push(new THREE.Vector3(x,y,depth));
   if(i<n&&j<m){const q=i*(m+1)+j;indices.push(q,q+1,q+m+1,q+1,q+m+2,q+m+1)}
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#a7b8b5',vertexColors:true,roughness:.68,metalness:.42,side:THREE.DoubleSide}));mesh.name='folded-learning-stream-'+index;
 const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(edge),new THREE.LineBasicMaterial({color:'#aabcb7',transparent:true,opacity:index?.14:.32}));return {mesh,line};
}
export function createExhibitionSpace(scene,renderer,theme='words'){
 const group=new THREE.Group();group.name='learning-current';
 const profile=[[-570,2600],[-570,-1700]];
 for(let i=1;i<=24;i++){const a=i/24*Math.PI/2;profile.push([-570+850*(1-Math.cos(a)),-1700-850*Math.sin(a)])}profile.push([3000,-2550]);
 const positions=[],indices=[];for(const[y,z]of profile)positions.push(-6500,y,z,6500,y,z);
 for(let i=0;i<profile.length-1;i++){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2)}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const floor=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#111c22',roughness:.95,metalness:.08,side:THREE.DoubleSide}));floor.receiveShadow=true;floor.visible=false;group.add(floor);
 const streams=new THREE.Group();streams.name='depth-streams';streams.visible=false;const bands=[ribbon(0),ribbon(1)];for(const band of bands)streams.add(band.mesh,band.line);group.add(streams);
 const wash=new THREE.SpotLight('#a6c4ca',12500000,8000,.80,.95,1.8);wash.position.set(1800,1700,900);wash.target.position.set(400,-360,-1200);group.add(wash,wash.target);
 const rim=new THREE.PointLight('#d6baa1',5500000,6500,1.8);rim.position.set(-1900,400,-900);group.add(rim);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;scene.fog=new THREE.FogExp2('#0d151b',.00011);
 const palette=themes[theme]||themes.words,colorA=new THREE.Color(palette[0]),colorB=new THREE.Color(palette[1]);const nextTheme=themes[theme==='words'?'student-db':'lms'],nextA=new THREE.Color(nextTheme[0]),nextB=new THREE.Color(nextTheme[1]);
 group.userData.cursorLight=wash;
 group.userData.update=(progress,x,y)=>{
  const exit=Math.max(0,Math.min(1,(progress-.84)/.16));
  streams.rotation.set(y*.018,x*.045+(progress-.5)*.09,-.035+x*.009);streams.position.set(x*46,y*25,progress*150);
  wash.color.copy(colorA).lerp(nextA,exit);rim.color.copy(colorB).lerp(nextB,exit);
  for(const band of bands){band.mesh.material.color.copy(wash.color);band.line.material.color.copy(rim.color)}
 };
 group.userData.update(0,0,0);scene.add(group);return group;
}

