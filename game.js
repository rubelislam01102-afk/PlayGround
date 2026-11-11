import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const mount = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9e7ed);
scene.fog = new THREE.Fog(0xc9e7ed, 52, 205);
const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, .1, 350);
camera.position.set(0, 7.2, 13.5);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
mount.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe9f9ff, 0x7d8c55, 2.1));
const sun = new THREE.DirectionalLight(0xfff1d0, 2.8);
sun.position.set(-18, 30, 16); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -24; sun.shadow.camera.right = 24; sun.shadow.camera.top = 35; sun.shadow.camera.bottom = -35;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xc7e8ff, .65); fill.position.set(12, 9, -18); scene.add(fill);

const mat = (color, roughness = .82, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const mats = {
  grass: mat(0x91aa65), road: mat(0x424a48), shoulder: mat(0x777e70), line: mat(0xe9e5d1),
  busRed: mat(0xd94a3b, .45), busGreen: mat(0x347d50, .4), cream: mat(0xf1dfb2, .5), black: mat(0x172b2d, .7),
  glass: new THREE.MeshStandardMaterial({ color: 0x9dcbd0, roughness: .2, metalness: .1, transparent: true, opacity: .84 }), tire: mat(0x202323, .95), hub: mat(0xb9b8a9, .4, .45),
  tree: mat(0x416e49), leaf2: mat(0x6d914e), trunk: mat(0x77583b), hut: mat(0xc79c65), roof: mat(0x9c5140), sign: mat(0xf4e8c1),
  white: mat(0xf3edda), lamp: new THREE.MeshStandardMaterial({ color: 0xffe6a3, emissive: 0xffbd4d, emissiveIntensity: 1.25 }),
};
function box(parent, size, material, pos, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material); mesh.position.set(...pos); mesh.castShadow = cast; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function cylinder(parent, radiusTop, radiusBottom, height, material, pos, rotation = [0,0,0], segments = 10) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.position.set(...pos); mesh.rotation.set(...rotation); mesh.castShadow = true; parent.add(mesh); return mesh;
}

// Road and verges
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 1500), mats.grass); ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.18, -520); ground.receiveShadow = true; scene.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 1500), mats.road); road.rotation.x = -Math.PI / 2; road.position.set(0, -.11, -520); road.receiveShadow = true; scene.add(road);
for (const x of [-7.25, 7.25]) { const verge = new THREE.Mesh(new THREE.PlaneGeometry(.5, 1500), mats.shoulder); verge.rotation.x = -Math.PI / 2; verge.position.set(x, -.1, -520); scene.add(verge); }
const lineObjects = [];
for (const x of [-2.32, 2.32]) for (let i = 0; i < 38; i++) {
  const dash = new THREE.Mesh(new THREE.BoxGeometry(.105, .018, 2.3), mats.line); dash.position.set(x, -.085, -i * 4.2); scene.add(dash); lineObjects.push({ mesh: dash, offset: i * 4.2 });
}
for (const x of [-6.65, 6.65]) { const edge = new THREE.Mesh(new THREE.BoxGeometry(.1,.018,1500), mats.line); edge.position.set(x,-.084,-520); scene.add(edge); }

// Player coach: vivid local intercity livery, detailed in simple geometry.
const bus = new THREE.Group(); scene.add(bus);
bus.position.set(0, 0, 0);
box(bus, [2.55, 2.8, 5.25], mats.busGreen, [0, 1.62, 0]);
box(bus, [2.58, .48, 5.28], mats.busRed, [0, .55, 0]);
box(bus, [2.58, .2, 5.28], mats.cream, [0, .85, 0]);
box(bus, [2.32, .24, 4.88], mats.busRed, [0, 2.83, .02]);
// Front windscreen and route sign
box(bus, [2.2, .83, .065], mats.black, [0, 2.05, -2.665]);
box(bus, [2.04, .68, .035], mats.glass, [0, 2.07, -2.705]);
box(bus, [1.32, .23, .06], mats.cream, [0, 2.61, -2.7]);
const routeCanvas = document.createElement('canvas'); routeCanvas.width = 512; routeCanvas.height = 96;
const ctx = routeCanvas.getContext('2d'); ctx.fillStyle = '#f1dfb2'; ctx.fillRect(0,0,512,96); ctx.fillStyle = '#254c3d'; ctx.font = 'bold 52px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ঢাকা  •  চট্টগ্রাম',256,66);
const routeTexture = new THREE.CanvasTexture(routeCanvas); routeTexture.colorSpace = THREE.SRGBColorSpace;
const routeSign = new THREE.Mesh(new THREE.PlaneGeometry(1.22,.19), new THREE.MeshBasicMaterial({ map: routeTexture })); routeSign.position.set(0,2.61,-2.738); bus.add(routeSign);
// Side passenger windows and red livery stripe
for (const side of [-1,1]) {
  for (let i=0;i<5;i++) {
    const z = -1.78 + i*.72;
    box(bus,[.045,.72,.57],mats.black,[side*1.285,2.12,z]);
    box(bus,[.025,.6,.47],mats.glass,[side*1.312,2.12,z]);
  }
  box(bus,[.04,.12,3.95],mats.cream,[side*1.3,1.36,0]);
  box(bus,[.045,.19,4.55],mats.busRed,[side*1.31,.91,0]);
  for (const z of [-1.65,1.65]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.56,.56,.25,16), mats.tire); wheel.rotation.z = Math.PI/2; wheel.position.set(side*1.3,.52,z); wheel.castShadow=true; bus.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.27,12), mats.hub); hub.rotation.z=Math.PI/2; hub.position.set(side*1.31,.52,z); bus.add(hub);
  }
}
// Front grille, headlights, mirrors, bumper, roof vents
box(bus,[1.05,.34,.06],mats.black,[0,.77,-2.68]);
for(let i=0;i<5;i++) box(bus,[.07,.23,.025],mats.hub,[-.4+i*.2,.77,-2.72],false);
for(const x of [-.94,.94]) { box(bus,[.36,.24,.1],mats.lamp,[x,1.13,-2.69],false); box(bus,[.35,.11,.08],mats.white,[x,1.92,-2.69],false); }
box(bus,[2.68,.16,.15],mats.hub,[0,.34,-2.66]);
for(const side of [-1,1]) { box(bus,[.14,.11,.55],mats.black,[side*1.43,2.08,-1.92]); box(bus,[.18,.08,.32],mats.hub,[side*1.5,2.08,-2.15]); }
for(let i=0;i<3;i++) box(bus,[.42,.09,.38],mats.cream,[-.5+i*.5,2.99,.6],false);

// Handmade Bangladeshi roadside scenery.
const scenery = [];
function makeTree(x, offset, variant=0) {
  const g = new THREE.Group(); scene.add(g);
  const height = 2.8 + (variant%3)*.35;
  cylinder(g,.17,.28,height*.56,mats.trunk,[0,height*.28,0]);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.28 + (variant%2)*.22,1), variant%2?mats.leaf2:mats.tree);
  crown.position.set(0,height*.73,0); crown.scale.set(.92,1.1,.9); crown.castShadow=true; g.add(crown);
  scenery.push({group:g,x,offset,spacing:48}); return g;
}
function makeHut(x, offset) {
  const g=new THREE.Group(); scene.add(g);
  box(g,[2.3,1.25,1.7],mats.hut,[0,.72,0]);
  // pitched roof as two slanted panels
  const roofA=box(g,[1.4,.15,2.05],mats.roof,[-.52,1.52,0]); roofA.rotation.z=-.42;
  const roofB=box(g,[1.4,.15,2.05],mats.roof,[.52,1.52,0]); roofB.rotation.z=.42;
  box(g,[.52,.8,.06],mats.black,[0,.47,-.88],false);
  scenery.push({group:g,x,offset,spacing:144});
}
function makePalm(x, offset, idx) {
  const g=new THREE.Group(); scene.add(g);
  cylinder(g,.12,.19,3.2,mats.trunk,[0,1.6,0]);
  const crown=new THREE.Group(); crown.position.y=3.12; g.add(crown);
  for(let i=0;i<7;i++) { const leaf=new THREE.Mesh(new THREE.ConeGeometry(.22,2.15,5),mats.leaf2); leaf.position.y=-.35; leaf.rotation.z=Math.PI*.48; leaf.rotation.y=i*Math.PI*2/7; leaf.scale.set(.8,1,.48); leaf.castShadow=true; crown.add(leaf); }
  scenery.push({group:g,x,offset,spacing:78});
}
function makeSign(x, offset, text) {
  const g=new THREE.Group(); scene.add(g);
  cylinder(g,.055,.07,2.2,mats.trunk,[0,1.1,0]);
  box(g,[2.1,.7,.12],mats.sign,[0,2.1,0]);
  const c=document.createElement('canvas');c.width=512;c.height=160;const cctx=c.getContext('2d');cctx.fillStyle='#f4e8c1';cctx.fillRect(0,0,512,160);cctx.fillStyle='#245544';cctx.font='bold 58px sans-serif';cctx.textAlign='center';cctx.fillText(text,256,102);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.Mesh(new THREE.PlaneGeometry(1.9,.59),new THREE.MeshBasicMaterial({map:tex}));label.position.set(0,2.1,.067);g.add(label);
  scenery.push({group:g,x,offset,spacing:220});
}
for(let i=0;i<34;i++) {
  const x = i%2 ? 9.2 : -9.2;
  makeTree(x, (i*19+13)%1550, i);
  if(i%4===0) makePalm(x+(x>0?1:-1), (i*47+76)%1550, i);
}
makeHut(-10.2,120); makeHut(10.2,340); makeHut(-10.2,650); makeHut(10.2,940);
makeSign(9.1,190,'কুমিল্লা'); makeSign(-9.1,560,'WELCOME'); makeSign(9.1,1000,'চট্টগ্রাম');
for(const item of scenery) item.group.position.set(item.x,0,-item.offset*.24-9);

function createTraffic(index) {
  const group=new THREE.Group(); scene.add(group);
  const isVan=index%3===0, bodyMat=mat([0xf0d6a1,0x557c9a,0xd66a48,0xe6e1d1,0x3e735d][index%5],.56);
  const width=isVan?1.95:1.75, length=isVan?3.5:3.1;
  box(group,[width,1.1,length],bodyMat,[0,.85,0]);
  box(group,[width*.84,.55,.06],mats.glass,[0,1.04,-length*.5-.035]);
  box(group,[width*.82,.42,.055],mats.glass,[0,1.02,length*.5+.035]);
  for(const side of [-1,1]) for(const z of [-.75,.75]) {
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.29,.29,.15,10),mats.tire);wheel.rotation.z=Math.PI/2;wheel.position.set(side*width*.51,.32,z);group.add(wheel);
  }
  for(const x of [-.58,.58]) box(group,[.25,.13,.06],mats.lamp,[x,.61,-length*.5-.05],false);
  group.userData={index,bodyMat}; return group;
}
const traffic=[];
for(let i=0;i<7;i++){const car={group:createTraffic(i),distance:68+i*36,lane:[-3.85,0,3.85][(i*7+1)%3],passed:false};car.group.position.set(car.lane,0,-car.distance*.24-1.6);traffic.push(car);}

// Controls and game state
const ui={speed:document.querySelector('#speed-value'),speedBar:document.querySelector('#speed-bar'),distance:document.querySelector('#distance-value'),progress:document.querySelector('#progress-bar'),remaining:document.querySelector('#remaining-value'),score:document.querySelector('#score-value'),gear:document.querySelector('#gear-value'),toast:document.querySelector('#toast')};
const keys={left:false,right:false,gas:false,brake:false};
let running=false,paused=false,crashed=false,muted=true;
let speed=0, distance=0, score=0, targetX=0, currentX=0, lastTime=performance.now(), toastTimer=0;
const routeLength=280;
function showToast(text){ui.toast.textContent=text;ui.toast.classList.add('show');toastTimer=1.5;}
function startGame(){
  document.querySelector('#welcome').classList.add('hidden');document.querySelector('#crash').classList.add('hidden');
  running=true;paused=false;crashed=false;speed=0;distance=0;score=0;targetX=0;currentX=0;bus.position.x=0;
  traffic.forEach((car,i)=>{car.distance=64+i*37;car.lane=[-3.85,0,3.85][(i*7+1)%3];car.passed=false;});
  document.querySelector('#pause-btn').textContent='Ⅱ'; updateUI();
}
function finishGame(){running=false;crashed=true;speed=0;document.querySelector('#final-distance').textContent=distance.toFixed(1)+' km';document.querySelector('#final-score').textContent=Math.floor(score)+' pts';document.querySelector('#crash').classList.remove('hidden');}
function steer(dir){targetX=Math.max(-4.05,Math.min(4.05,targetX+dir*1.9));}
function setKey(code,on){if(code==='ArrowLeft'||code==='KeyA')keys.left=on;if(code==='ArrowRight'||code==='KeyD')keys.right=on;if(code==='ArrowUp'||code==='KeyW')keys.gas=on;if(code==='ArrowDown'||code==='KeyS'||code==='Space')keys.brake=on;}
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();if(e.code==='Escape'||e.code==='KeyP'){togglePause();return;}setKey(e.code,true);});
window.addEventListener('keyup',e=>setKey(e.code,false));
window.addEventListener('blur',()=>{keys.left=keys.right=keys.gas=keys.brake=false;});
function togglePause(){if(!running)return;paused=!paused;document.querySelector('#pause-btn').textContent=paused?'▶':'Ⅱ';if(paused)showToast('PAUSED');}
document.querySelector('#pause-btn').addEventListener('click',togglePause);
document.querySelector('#start-btn').addEventListener('click',startGame);
document.querySelector('#retry-btn').addEventListener('click',startGame);
document.querySelector('#sound-btn').addEventListener('click',()=>{muted=!muted;document.querySelector('#sound-icon').textContent=muted?'♫':'♪';showToast(muted?'SOUND OFF':'SOUND ON');});
for(const button of document.querySelectorAll('[data-control]')){
  const name=button.dataset.control;
  const press=e=>{e.preventDefault();button.classList.add('active');if(name==='left')keys.left=true;else if(name==='right')keys.right=true;else if(name==='gas')keys.gas=true;else keys.brake=true;};
  const release=e=>{e.preventDefault();button.classList.remove('active');if(name==='left')keys.left=false;else if(name==='right')keys.right=false;else if(name==='gas')keys.gas=false;else keys.brake=false;};
  button.addEventListener('pointerdown',press);button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('pointerleave',release);
}
function updateUI(){
  const kmh=Math.round(speed);ui.speed.textContent=String(kmh).padStart(3,'0');ui.speedBar.style.width=Math.min(100,kmh/120*100)+'%';
  ui.distance.textContent=distance.toFixed(1);const progress=Math.min(100,distance/routeLength*100);ui.progress.style.width=progress+'%';ui.remaining.textContent=Math.max(0,Math.ceil(routeLength-distance))+' KM';ui.score.textContent=String(Math.floor(score)).padStart(5,'0');ui.gear.textContent=speed<1?'N':speed<25?'1':speed<50?'2':speed<78?'3':'4';
}
function updateWorld(dt){
  if(running&&!paused){
    if(keys.left)steer(-dt*1.6);if(keys.right)steer(dt*1.6);
    const desired=keys.gas?112:keys.brake?0:Math.max(28,speed);
    const acceleration=keys.brake?85:keys.gas?24:7;
    if(speed<desired)speed=Math.min(desired,speed+acceleration*dt);else if(speed>desired)speed=Math.max(desired,speed-(keys.brake?85:9)*dt);
    currentX=THREE.MathUtils.damp(currentX,targetX,4.8,dt);bus.position.x=currentX;
    const meters=speed/3.6*dt;distance+=meters/1000;score+=meters*.48;
    const travel=meters*.24;
    for(const item of lineObjects){const loop=159.6;const dz=((item.offset-distance*1000*.24)%loop+loop)%loop;item.mesh.position.z=-dz;}
    for(const item of scenery){const dz=((item.offset-distance*1000)%1550+1550)%1550;item.group.position.set(item.x,0,-dz*.24-9);}
    for(const car of traffic){
      const gap=car.distance-distance*1000;
      car.group.position.set(car.lane,0,-gap*.24-1.6);
      if(gap < -7){if(!car.passed&&Math.abs(currentX-car.lane)<2.35){score+=240;showToast('CLOSE CALL +240');}car.passed=true;car.distance=distance*1000+230+Math.random()*180;car.lane=[-3.85,0,3.85][Math.floor(Math.random()*3)];car.passed=false;}
      if(gap>0&&gap<8&&Math.abs(currentX-car.lane)<2.05){finishGame();break;}
    }
    if(distance>=routeLength){distance=0;score+=2500;traffic.forEach((car,i)=>car.distance=distance*1000+75+i*39);showToast('ROUTE COMPLETE +2500');}
    if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)ui.toast.classList.remove('show');}
    updateUI();
  }
  const cameraTargetX=running?currentX*.34:0;
  camera.position.x=THREE.MathUtils.damp(camera.position.x,cameraTargetX,2.4,dt);
  camera.position.y=THREE.MathUtils.damp(camera.position.y,running?6.6:7.2,2,dt);
  camera.position.z=THREE.MathUtils.damp(camera.position.z,running?13:14,2,dt);
  camera.lookAt(cameraTargetX*.3,1.25,-8.7);
  // Gentle idle sway makes the menu feel alive.
  if(!running) bus.rotation.z=Math.sin(performance.now()*.0006)*.003;
  else bus.rotation.z=THREE.MathUtils.damp(bus.rotation.z,-(targetX-currentX)*.035,5,dt);
  renderer.render(scene,camera);
}
function frame(now){const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;updateWorld(dt);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));});
