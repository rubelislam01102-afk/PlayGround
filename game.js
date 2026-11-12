import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

const mount = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9e7ed);
scene.fog = new THREE.Fog(0xc9e7ed, 180, 680);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 1200);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6)); renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; mount.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe8f7ff, 0x7d8956, 2.05));
const sun = new THREE.DirectionalLight(0xfff0cf, 2.65); sun.position.set(-180, 260, 100); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -110; sun.shadow.camera.right = 110; sun.shadow.camera.top = 130; sun.shadow.camera.bottom = -130; scene.add(sun);
const fill = new THREE.DirectionalLight(0xc7e8ff, .55); fill.position.set(120, 80, -180); scene.add(fill);
const mat = (color, roughness=.82, metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
const M = {
  grass:mat(0x91aa65), asphalt:mat(0x41494a), shoulder:mat(0xaaa18b), lane:mat(0xe8dfc7), curb:mat(0xd5d0bb),
  concrete:mat(0xb9b7a9), green:mat(0x236e50,.45), red:mat(0xd54d3d,.48), cream:mat(0xe9d9b2,.5), black:mat(0x172b2d,.6),
  glass:new THREE.MeshStandardMaterial({color:0x9dcbd0,roughness:.2,metalness:.1,transparent:true,opacity:.83}), tire:mat(0x202323,.95), hub:mat(0xb9b8a9,.4,.4),
  tree:mat(0x416e49), leaf:mat(0x6e914e), trunk:mat(0x77583b), hut:mat(0xc79c65), roof:mat(0x9c5140), sign:mat(0xf4e8c1),
  lamp:new THREE.MeshStandardMaterial({color:0xffe6a3,emissive:0xffbd4d,emissiveIntensity:1.1}), white:mat(0xf3edda),
  water:mat(0x75b9bc), field:mat(0x9db66a), gold:mat(0xe2b342)
};
function box(parent,size,material,pos,cast=true){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.set(...pos);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m;}
function cyl(parent,rt,rb,h,material,pos,rot=[0,0,0],segments=10){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material);m.position.set(...pos);m.rotation.set(...rot);m.castShadow=true;parent.add(m);return m;}
function plane(parent,w,h,material,x,y,z,rotation=-Math.PI/2){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);m.rotation.x=rotation;m.position.set(x,y,z);parent.add(m);return m;}
const world = new THREE.Group(); scene.add(world);

// Bangladesh landscape: irrigated fields and a broad, navigable city street grid.
plane(world,1450,1450,M.grass,0,-.32,0);
for(let i=0;i<30;i++){
  const z=-650+i*45, x=(i%2?1:-1)*485;
  plane(world,390,19,M.field,x,-.27,z);
  for(let j=0;j<7;j++) box(world,[.12,.08,18],M.leaf,[x-165+j*52,-.17,z],false);
}
plane(world,55,1200,M.water,520,-.24,0);
// Long N-S and E-W roads, raised dusty shoulders, edge lines, dashed center lines.
const roadCoords=[];
for(let n=-6;n<=6;n++) roadCoords.push(n*100);
for(const p of roadCoords){
  plane(world,17,1320,M.shoulder,p,-.16,0);
  plane(world,13.8,1320,M.asphalt,p,-.12,0);
  plane(world,1320,17,M.shoulder,0,-.16,p);
  plane(world,1320,13.8,M.asphalt,0,-.12,p);
  for(let d=-640;d<640;d+=8){
    box(world,[.11,.025,3.2],M.lane,[p,-.09,d],false);
    box(world,[3.2,.025,.11],M.lane,[d,-.09,p],false);
  }
  for(const s of [-1,1]){
    box(world,[.13,.025,1320],M.white,[p+s*6.35,-.087,0],false);
    box(world,[1320,.025,.13],M.white,[0,-.087,p+s*6.35],false);
  }
}
// Crosswalks, corner curbs and local intersections.
for(const x of roadCoords) for(const z of roadCoords){
  for(let k=-3;k<=3;k++){
    box(world,[.42,.035,3.9],M.white,[x+k*1.1,-.075,z-9],false);
    box(world,[3.9,.035,.42],M.white,[x-9,-.075,z+k*1.1],false);
  }
}

// Urban blocks with varied Dhaka shop houses, apartments, mosques and rural homesteads.
let seed=7831; function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const facadeMats=[0xd6c6a9,0xc3b69b,0xd3c9b8,0xb7c7bc,0xd6b9a2,0xc2c9c4,0xe2d6be].map(c=>mat(c));
const windowMat=new THREE.MeshStandardMaterial({color:0x87aeb3,roughness:.28,metalness:.08});
function makeBuilding(x,z,village=false){
  const g=new THREE.Group();world.add(g);g.position.set(x,0,z);
  const w=village?7+rand()*5:10+rand()*12, d=village?7+rand()*5:10+rand()*13;
  const floors=village?1:2+Math.floor(rand()*5), h=village?2.7: floors*(2.6+rand()*.45);
  const facade=village?M.hut:facadeMats[Math.floor(rand()*facadeMats.length)];
  box(g,[w,h,d],facade,[0,h/2,0]);
  if(village){
    const roof=box(g,[w+1,.32,d+1],M.roof,[0,h+.12,0]);roof.rotation.z=(rand()-.5)*.12;
    box(g,[1.15,1.9,.1],M.black,[0,.95,-d/2-.06],false);
    box(g,[w*.22,.8,.08],windowMat,[-w*.28,1.75,-d/2-.08],false);
  }else{
    box(g,[w+.3,.45,d+.3],mat(0x8e8d80),[0,h+.2,0]);
    for(let f=0;f<floors;f++) for(let c=-1;c<=1;c++){
      const wx=c*w*.25; box(g,[w*.17,1.15,.09],windowMat,[wx,1.35+f*2.7,-d/2-.055],false);
      box(g,[w*.17,1.15,.09],windowMat,[wx,1.35+f*2.7,d/2+.055],false);
    }
    box(g,[w*.18,2,.1],M.black,[w*.31,1,-d/2-.065],false);
    if(rand()>.74){const awning=box(g,[w+.3,.24,1.25],M.red,[0,2.4,-d/2-.5]);}
    if(rand()>.86){cyl(g,.28,.28,1.5,M.gold,[0,h+.9,0]);box(g,[.12,.12,3],M.gold,[0,h+1.6,0]);}
  }
  return g;
}
for(let ix=-6;ix<6;ix++) for(let iz=-6;iz<6;iz++){
  const cx=ix*100+50,cz=iz*100+50;
  if(Math.abs(cx)>620||Math.abs(cz)>620)continue;
  const village=Math.abs(cx)>330||Math.abs(cz)>330;
  const count=village?2:3+Math.floor(rand()*3);
  for(let b=0;b<count;b++){
    const x=cx+(rand()-.5)*(village?48:64),z=cz+(rand()-.5)*(village?48:64);
    makeBuilding(x,z,village);
  }
}
// Landmark terminal, mosques and local roadside life.
function makeTree(x,z,scale=1){const g=new THREE.Group();world.add(g);g.position.set(x,0,z);g.scale.setScalar(scale);cyl(g,.18,.28,3.4,M.trunk,[0,1.7,0]);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.25,1),rand()>.5?M.tree:M.leaf);crown.position.y=3.35;crown.scale.set(1,1.15,.95);crown.castShadow=true;g.add(crown);}
for(let i=0;i<100;i++){const x=(rand()-.5)*1260,z=(rand()-.5)*1260;if(Math.abs(x%100)<11||Math.abs(z%100)<11)continue;makeTree(x,z,.75+rand()*.55);}
function makeMosque(x,z){const g=new THREE.Group();world.add(g);g.position.set(x,0,z);box(g,[16,8,12],mat(0xe5dfc8),[0,4,0]);box(g,[17,.5,13],mat(0x3e806b),[0,8.2,0]);for(const sx of [-1,1]){cyl(g,.32,.5,12,mat(0xe5dfc8),[sx*7,6,0]);const dome=new THREE.Mesh(new THREE.SphereGeometry(3,14,9,0,Math.PI*2,0,Math.PI/2),mat(0x4c9576));dome.position.set(sx*4,8.4,0);g.add(dome);}cyl(g,.2,.34,18,mat(0xe5dfc8),[10,9,4]);const top=new THREE.Mesh(new THREE.ConeGeometry(.45,2,8),M.gold);top.position.set(10,19,4);g.add(top);}
makeMosque(-48,-142); makeMosque(244,158);
const terminal=new THREE.Group();world.add(terminal);terminal.position.set(0,0,28);
box(terminal,[28,.45,18],mat(0x6f7771),[0,.12,0]);
for(const x of [-10,0,10]){box(terminal,[.45,5,.45],M.red,[x,2.7,-4]);box(terminal,[.45,5,.45],M.red,[x,2.7,7]);}
box(terminal,[32,.7,14],M.cream,[0,5.3,1]);box(terminal,[32,.16,15],M.red,[0,5.75,1]);
const terminalSign=document.createElement('canvas');terminalSign.width=512;terminalSign.height=100;const tctx=terminalSign.getContext('2d');tctx.fillStyle='#175744';tctx.fillRect(0,0,512,100);tctx.fillStyle='#fff1cf';tctx.font='bold 48px sans-serif';tctx.textAlign='center';tctx.fillText('গুলিস্তান বাস টার্মিনাল',256,66);const ttex=new THREE.CanvasTexture(terminalSign);ttex.colorSpace=THREE.SRGBColorSpace;const tmesh=new THREE.Mesh(new THREE.PlaneGeometry(13,2.55),new THREE.MeshBasicMaterial({map:ttex}));tmesh.position.set(0,4.35,-6.2);terminal.add(tmesh);

// Full-size coach with local intercity livery, rotating wheels and working steering.
const busRoot=new THREE.Group();scene.add(busRoot);
const busVisual=new THREE.Group();busRoot.add(busVisual);
let busBodyMaterial=M.green;
const wheels=[];const frontWheels=[];
function makeCoach(){
  busVisual.clear();wheels.length=0;frontWheels.length=0;
  box(busVisual,[2.55,2.85,5.6],busBodyMaterial,[0,1.66,0]);
  box(busVisual,[2.58,.48,5.62],M.red,[0,.57,0]);box(busVisual,[2.6,.18,5.6],M.cream,[0,.87,0]);
  box(busVisual,[2.3,.24,5.2],M.red,[0,2.98,.02]);
  box(busVisual,[2.18,.92,.07],M.black,[0,2.03,-2.84]);box(busVisual,[2.01,.76,.035],M.glass,[0,2.04,-2.89]);
  box(busVisual,[1.36,.27,.08],M.cream,[0,2.67,-2.86]);
  const routeCanvas=document.createElement('canvas');routeCanvas.width=512;routeCanvas.height=96;const ctx=routeCanvas.getContext('2d');ctx.fillStyle='#f1dfb2';ctx.fillRect(0,0,512,96);ctx.fillStyle='#254c3d';ctx.font='bold 48px sans-serif';ctx.textAlign='center';ctx.fillText('ঢাকা  •  বাংলাদেশ',256,65);const tex=new THREE.CanvasTexture(routeCanvas);tex.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.25,.23),new THREE.MeshBasicMaterial({map:tex}));sign.position.set(0,2.67,-2.91);busVisual.add(sign);
  for(const side of [-1,1]){
    for(let i=0;i<6;i++){const z=-2.12+i*.76;box(busVisual,[.045,.76,.6],M.black,[side*1.29,2.13,z]);box(busVisual,[.025,.63,.49],M.glass,[side*1.318,2.14,z]);}
    box(busVisual,[.04,.13,4.4],M.cream,[side*1.31,1.37,0]);box(busVisual,[.045,.2,4.9],M.red,[side*1.32,.93,0]);
    for(const z of [-1.85,1.72]){const pivot=new THREE.Group();pivot.position.set(side*1.3,.55,z);busVisual.add(pivot);const tire=new THREE.Mesh(new THREE.CylinderGeometry(.56,.56,.27,18),M.tire);tire.rotation.z=Math.PI/2;pivot.add(tire);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.29,14),M.hub);hub.rotation.z=Math.PI/2;pivot.add(hub);wheels.push(tire);if(z<-1)pivot.userData.steer=true; if(z<-1)frontWheels.push(pivot);}
  }
  box(busVisual,[1.05,.34,.07],M.black,[0,.77,-2.87]);for(let i=0;i<5;i++)box(busVisual,[.07,.23,.03],M.hub,[-.4+i*.2,.77,-2.91],false);
  for(const x of [-.95,.95]){box(busVisual,[.36,.24,.1],M.lamp,[x,1.12,-2.9],false);box(busVisual,[.34,.12,.08],M.white,[x,1.93,-2.9],false);}
  box(busVisual,[2.68,.16,.15],M.hub,[0,.34,-2.84]);
  for(const side of [-1,1]){box(busVisual,[.14,.11,.58],M.black,[side*1.43,2.13,-2.15]);box(busVisual,[.18,.08,.32],M.hub,[side*1.5,2.13,-2.36]);}
  for(let i=0;i<4;i++)box(busVisual,[.4,.09,.38],M.cream,[-.6+i*.4,3.14,.5],false);
}
makeCoach();
busRoot.position.set(0,0,7);busRoot.rotation.y=0;

// Route service points and free-roam city navigation.
const routes={
  gulistan:{title:'Gulistan → Sadarghat',pickup:new THREE.Vector3(0,0,7),drop:new THREE.Vector3(100,0,-200),pickupName:'Gulistan Terminal',dropName:'Sadarghat Launch Terminal',fare:160},
  village:{title:'Gulistan → Savar village',pickup:new THREE.Vector3(0,0,7),drop:new THREE.Vector3(-400,0,300),pickupName:'Gulistan Terminal',dropName:'Savar Village',fare:420},
  airport:{title:'Gulistan → Airport Road',pickup:new THREE.Vector3(0,0,7),drop:new THREE.Vector3(300,0,-400),pickupName:'Gulistan Terminal',dropName:'Hazrat Shahjalal Airport',fare:280}
};
let activeRoute=routes.gulistan, passengers=0, tripPhase='pickup', totalFare=0, routeStart=0;
function makeMarker(color){const g=new THREE.Group();scene.add(g);const ring=new THREE.Mesh(new THREE.TorusGeometry(4,.25,8,36),mat(color,.45,.2));ring.rotation.x=Math.PI/2;ring.position.y=.35;g.add(ring);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.13,.5,8,10,1,true),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.22,side:THREE.DoubleSide}));beam.position.y=4;g.add(beam);const cap=new THREE.Mesh(new THREE.ConeGeometry(.45,.9,8),mat(color));cap.position.y=8.5;g.add(cap);return g;}
const pickupMarker=makeMarker(0x71bf67), destinationMarker=makeMarker(0xe4aa37);

// AI minibuses, cars, CNG auto-rickshaws and trucks use actual streets.
const traffic=[];
function createTraffic(index){
  const g=new THREE.Group();scene.add(g);const type=index%5===0?'cng':index%4===0?'bus':'car';
  const bodymat=mat([0xf0d6a1,0x557c9a,0xd66a48,0xe6e1d1,0x3e735d,0xc3a344][index%6],.55);
  const w=type==='bus'?2.4:type==='cng'?1.5:1.9,l=type==='bus'?5.2:type==='cng'?2.5:3.6,h=type==='bus'?2.6:1.2;
  box(g,[w,h,l],bodymat,[0,h/2+.24,0]);box(g,[w*.84,.65,.06],M.glass,[0,h*.72,-l/2-.035]);box(g,[w*.8,.5,.06],M.glass,[0,h*.7,l/2+.035]);
  if(type==='cng'){const canopy=box(g,[w*1.03,.22,l*.72],M.green,[0,h+.25,0]);box(g,[w*.77,.44,.06],M.black,[0,h+.2,-l*.18]);}
  for(const side of [-1,1])for(const z of [-l*.31,l*.31]){const wh=new THREE.Mesh(new THREE.CylinderGeometry(type==='bus'?.38:.29,type==='bus'?.38:.29,.17,10),M.tire);wh.rotation.z=Math.PI/2;wh.position.set(side*w*.51,.32,z);g.add(wh);}
  for(const x of [-w*.32,w*.32])box(g,[.3,.14,.07],M.lamp,[x,.55,-l/2-.06],false);
  return {group:g,type,w,l,heading:0,progress:rand()*1};
}
const loop=[new THREE.Vector3(-200,0,200),new THREE.Vector3(200,0,200),new THREE.Vector3(200,0,-200),new THREE.Vector3(-200,0,-200)];
for(let i=0;i<12;i++){const v=createTraffic(i);v.progress=(i/12)*loop.length;v.speed=5+rand()*5;v.lane=i%2?2.9:-2.9;traffic.push(v);}
function pathPoint(progress){const n=loop.length,seg=Math.floor(progress)%n,t=progress-Math.floor(progress),a=loop[seg],b=loop[(seg+1)%n];return new THREE.Vector3().lerpVectors(a,b,t);}

const ui={speed:document.querySelector('#speed-value'),gear:document.querySelector('#drive-mode'),speedBar:document.querySelector('#speed-bar'),passengers:document.querySelector('#passenger-value'),fare:document.querySelector('#fare-value'),routeTitle:document.querySelector('#route-title'),routeSub:document.querySelector('#route-sub'),progress:document.querySelector('#progress-bar'),toast:document.querySelector('#toast'),location:document.querySelector('#location-name')};
const keys={left:false,right:false,gas:false,brake:false,reverse:false};
let running=false,paused=false,speed=0,heading=0,steer=0,totalDistance=0,toastTimer=0,boardTimer=0,cameraMode=0,lastTime=performance.now();
const wheelbase=3.25, routeNames=['gulistan','village','airport'];
function showToast(text){ui.toast.textContent=text;ui.toast.classList.add('show');toastTimer=2.2;}
function selectRoute(id){activeRoute=routes[id]||routes.gulistan;tripPhase='pickup';passengers=0;totalFare=0;boardTimer=0;routeStart=busRoot.position.distanceTo(activeRoute.drop);updateRouteUI();}
function updateRouteUI(){ui.routeTitle.textContent=activeRoute.title;ui.passengers.textContent=String(passengers);ui.fare.textContent=`FARE ৳${totalFare}`;ui.routeSub.textContent=tripPhase==='pickup'?`Pick up passengers at ${activeRoute.pickupName}`:`Drop passengers at ${activeRoute.dropName}`;}
function startGame(){
  document.querySelector('#welcome').classList.add('hidden');document.querySelector('#garage').classList.add('hidden');
  running=true;paused=false;speed=0;heading=0;steer=0;totalDistance=0;busRoot.position.set(0,0,7);busRoot.rotation.set(0,0,0);
  selectRoute(document.querySelector('#route-select').value);document.querySelector('#pause-btn').textContent='Ⅱ';showToast('ENGINE STARTED · KEEP LEFT');
}
function togglePause(){if(!running)return;paused=!paused;document.querySelector('#pause-btn').textContent=paused?'▶':'Ⅱ';if(paused)showToast('PAUSED');}
function setKey(code,on){if(code==='ArrowLeft'||code==='KeyA')keys.left=on;if(code==='ArrowRight'||code==='KeyD')keys.right=on;if(code==='ArrowUp'||code==='KeyW')keys.gas=on;if(code==='ArrowDown'||code==='Space'||code==='KeyS')keys.brake=on;if(code==='KeyR')keys.reverse=on;}
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();if(e.code==='Escape'||e.code==='KeyP'){togglePause();return;}setKey(e.code,true);});
window.addEventListener('keyup',e=>setKey(e.code,false));window.addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
document.querySelector('#start-btn').addEventListener('click',startGame);
document.querySelector('#pause-btn').addEventListener('click',togglePause);
document.querySelector('#route-select').addEventListener('change',e=>selectRoute(e.target.value));
document.querySelector('#garage-btn').addEventListener('click',()=>document.querySelector('#garage').classList.remove('hidden'));
document.querySelector('#garage-close').addEventListener('click',()=>document.querySelector('#garage').classList.add('hidden'));
document.querySelector('#camera-btn').addEventListener('click',()=>{cameraMode=(cameraMode+1)%2;document.querySelector('#camera-btn').textContent=cameraMode?'CAM · CLOSE':'CAM · FOLLOW';});
for(const button of document.querySelectorAll('[data-control]')){
  const name=button.dataset.control;
  const assign=on=>{button.classList.toggle('active',on);keys[name]=on;};
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);assign(true);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>{e.preventDefault();assign(false);});
}
for(const swatch of document.querySelectorAll('.paint-swatch'))swatch.addEventListener('click',()=>{
  document.querySelector('.paint-swatch.active')?.classList.remove('active');swatch.classList.add('active');
  busBodyMaterial=mat(new THREE.Color(swatch.dataset.paint),.45);makeCoach();showToast('BUS PAINT UPDATED');
});
document.querySelector('#model-file').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  const status=document.querySelector('#model-status');status.textContent=`Loading ${file.name}…`;
  try{
    const url=URL.createObjectURL(file),gltf=await new GLTFLoader().loadAsync(url);URL.revokeObjectURL(url);
    const model=gltf.scene;model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
    const scale=5.5/Math.max(size.z,size.x);model.scale.setScalar(scale);model.updateMatrixWorld(true);
    const scaledBounds=new THREE.Box3().setFromObject(model),center=scaledBounds.getCenter(new THREE.Vector3());model.position.x-=center.x;model.position.z-=center.z;model.position.y-=scaledBounds.min.y;
    busVisual.clear();busVisual.add(model);
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    status.textContent=`Loaded ${file.name} · use the Garage to change bus`;showToast('CUSTOM BUS LOADED');
  }catch(err){console.error(err);status.textContent='Could not load this GLB. Check the file and try again.';}
  e.target.value='';
});

const minimap=document.querySelector('#minimap'),mapCtx=minimap.getContext('2d');
function updateMap(){
  const w=minimap.width,h=minimap.height,cx=w/2,cy=h/2,scale=w/520;mapCtx.clearRect(0,0,w,h);mapCtx.fillStyle='#e6e9d8';mapCtx.fillRect(0,0,w,h);
  mapCtx.save();mapCtx.translate(cx-busRoot.position.x*scale,cy-busRoot.position.z*scale);
  mapCtx.fillStyle='#c9d6a5';for(let x=-700;x<=700;x+=100)for(let z=-700;z<=700;z+=100)mapCtx.fillRect(x*scale-45*scale,z*scale-45*scale,90*scale,90*scale);
  mapCtx.strokeStyle='#7d8580';mapCtx.lineWidth=13.8*scale;for(let p=-600;p<=600;p+=100){mapCtx.beginPath();mapCtx.moveTo(p*scale,-700*scale);mapCtx.lineTo(p*scale,700*scale);mapCtx.stroke();mapCtx.beginPath();mapCtx.moveTo(-700*scale,p*scale);mapCtx.lineTo(700*scale,p*scale);mapCtx.stroke();}
  mapCtx.fillStyle='#e0c47a';mapCtx.beginPath();mapCtx.arc(0,0,5,0,Math.PI*2);mapCtx.fill();
  const target=tripPhase==='pickup'?activeRoute.pickup:activeRoute.drop;mapCtx.fillStyle=tripPhase==='pickup'?'#45ad63':'#e2a53c';mapCtx.beginPath();mapCtx.arc(target.x*scale,target.z*scale,4,0,Math.PI*2);mapCtx.fill();
  for(const v of traffic){const p=v.group.position;mapCtx.fillStyle='#365f80';mapCtx.fillRect(p.x*scale-1.6,p.z*scale-1.6,3.2,3.2);}
  mapCtx.restore();mapCtx.save();mapCtx.translate(cx,cy);mapCtx.rotate(-heading);mapCtx.fillStyle='#d94a3b';mapCtx.beginPath();mapCtx.moveTo(0,-7);mapCtx.lineTo(5,5);mapCtx.lineTo(0,3);mapCtx.lineTo(-5,5);mapCtx.closePath();mapCtx.fill();mapCtx.restore();
}
function onRoad(x,z){const dx=Math.abs(x-Math.round(x/100)*100),dz=Math.abs(z-Math.round(z/100)*100);return Math.min(dx,dz)<8.6;}
function updateTraffic(dt){
  for(const v of traffic){
    v.progress+=v.speed*dt/400;
    const p=pathPoint(v.progress),q=pathPoint(v.progress+.01),dx=q.x-p.x,dz=q.z-p.z,len=Math.hypot(dx,dz)||1;
    p.x+=(-dz/len)*v.lane;p.z+=(dx/len)*v.lane;
    v.group.position.set(p.x,0,p.z);v.heading=Math.atan2(-dx,-dz);v.group.rotation.y=v.heading;
    const d=Math.hypot(busRoot.position.x-p.x,busRoot.position.z-p.z);
    if(d<3.4&&Math.abs(speed)>1.5){speed*=.82;showToast('TRAFFIC CONTACT · SLOW DOWN');}
  }
}
function updatePhysics(dt){
  const throttle=keys.gas?1:0,brake=keys.brake?1:0,reverse=keys.reverse;
  const maxForward=21.5,maxReverse=5.2;
  if(reverse){if(speed>0)speed=Math.max(0,speed-8.5*dt);else speed=Math.max(-maxReverse,speed-2.7*dt*(throttle||reverse?1:0));}
  else if(throttle){if(speed<0)speed=Math.min(0,speed+8.5*dt);else speed=Math.min(maxForward,speed+2.35*dt);}
  if(brake)speed=speed>0?Math.max(0,speed-7.8*dt):Math.min(0,speed+7.8*dt);
  if(!throttle&&!brake&&!reverse)speed*=Math.max(0,1-(onRoad(busRoot.position.x,busRoot.position.z)?.12:.85)*dt);
  const steerInput=(keys.left?1:0)-(keys.right?1:0),speedFactor=Math.min(1,Math.max(.15,Math.abs(speed)/4));
  steer=THREE.MathUtils.damp(steer,steerInput,.0,dt); // direct controls are intentionally immediate
  heading+=steerInput*(speed/ wheelbase)*Math.tan(.48)*dt;
  busRoot.rotation.y=heading;frontWheels.forEach(w=>w.rotation.y=-steerInput*.42);
  for(const wh of wheels)wh.rotation.x-=speed*dt/.56;
  const forward=new THREE.Vector3(-Math.sin(heading),0,-Math.cos(heading));
  const old=busRoot.position.clone();busRoot.position.addScaledVector(forward,speed*dt);
  busRoot.position.y=0;
  // Building blocks are solid; buses can leave the road, but not drive through buildings.
  const p=busRoot.position,blockX=Math.round((p.x-50)/100)*100+50,blockZ=Math.round((p.z-50)/100)*100+50;
  if(Math.abs(p.x-blockX)<12&&Math.abs(p.z-blockZ)<12){busRoot.position.copy(old);speed=0;showToast('BLOCKED · FIND A ROAD');}
  if(Math.abs(p.x)>670||Math.abs(p.z)>670){busRoot.position.copy(old);speed=0;}
  if(!onRoad(p.x,p.z))speed*=Math.max(0,1-1.15*dt);
  totalDistance+=Math.abs(speed)*dt;
}

function updateService(dt){
  const target=tripPhase==='pickup'?activeRoute.pickup:activeRoute.drop;
  const distance=busRoot.position.distanceTo(target);
  const near=distance<11;
  if(near&&Math.abs(speed)<.65){
    boardTimer+=dt;
    if(boardTimer>1.8){
      boardTimer=0;
      if(tripPhase==='pickup'){
        passengers=12+Math.floor(rand()*13);tripPhase='drop';
        showToast(`${passengers} PASSENGERS ON BOARD · SERVICE DEPARTED`);
      }else{
        totalFare+=activeRoute.fare;passengers=0;tripPhase='pickup';
        showToast(`ARRIVED · FARE ৳${activeRoute.fare} COLLECTED`);
      }
      updateRouteUI();
    }else if(boardTimer<.3){showToast(tripPhase==='pickup'?'STOP TO BOARD PASSENGERS':'STOP TO DROP PASSENGERS');}
  }else boardTimer=0;
  pickupMarker.position.copy(activeRoute.pickup);pickupMarker.visible=tripPhase==='pickup';pickupMarker.rotation.y+=dt*.35;
  destinationMarker.position.copy(activeRoute.drop);destinationMarker.visible=tripPhase==='drop';destinationMarker.rotation.y-=dt*.35;
  const whole=activeRoute.pickup.distanceTo(activeRoute.drop)||1;
  const progress=tripPhase==='pickup'?Math.max(0,1-distance/whole)*.12:.12+Math.max(0,1-distance/whole)*.88;
  ui.progress.style.width=`${THREE.MathUtils.clamp(progress,0,1)*100}%`;
  updateRouteUI();
}
function updateDashboard(dt){
  const kmh=Math.round(Math.abs(speed)*3.6);
  ui.speed.textContent=String(kmh).padStart(3,'0');
  const gear=keys.reverse||speed<-.2?'R':speed>.2?'D':'N';
  document.querySelector('#gear-value').textContent=gear;
  ui.gear.textContent=keys.reverse?'REVERSE':Math.abs(speed)<.2?'PARK':'DRIVE';
  document.querySelector('#speed-bar').style.width=`${Math.min(100,kmh/90*100)}%`;
  const blockX=Math.round(busRoot.position.x/100),blockZ=Math.round(busRoot.position.z/100);
  const places=[['GULISTAN',0,0],['SADARGHAT',1,-2],['MOTIJHEEL',0,1],['OLD DHAKA',-1,-1],['SAVAR',-4,3],['AIRPORT ROAD',3,-4]];
  let nearest=places[0],best=Infinity;
  for(const [name,x,z] of places){const d=(blockX-x)**2+(blockZ-z)**2;if(d<best){best=d;nearest=[name,x,z];}}
  ui.location.textContent=`DHAKA · ${nearest[0]}`;
  document.querySelector('#world-coords').textContent=`${(23.72-busRoot.position.z*.00012).toFixed(2)}° N · ${(90.41+busRoot.position.x*.00012).toFixed(2)}° E`;
}
function updateCamera(dt){
  const forward=new THREE.Vector3(-Math.sin(heading),0,-Math.cos(heading));
  const back=cameraMode?7.2:13.5, height=cameraMode?4.1:7.3;
  const desired=busRoot.position.clone().addScaledVector(forward,-back);desired.y+=height;
  camera.position.lerp(desired,1-Math.exp(-dt*3.2));
  const look=busRoot.position.clone().addScaledVector(forward,cameraMode?5:3);look.y+=cameraMode?1.2:1.75;
  camera.lookAt(look);
}
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(now-lastTime)/1000||0);lastTime=now;
  if(running&&!paused){
    updatePhysics(dt);updateTraffic(dt);updateService(dt);updateDashboard(dt);
    if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)ui.toast.classList.remove('show');}
  }
  updateCamera(dt);updateMap();renderer.render(scene,camera);
}
window.addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
});
selectRoute('gulistan');
updateCamera(1);updateMap();requestAnimationFrame(frame);
