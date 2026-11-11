import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ui = {pfill:$('playerFill'),efill:$('enemyFill'),pnum:$('playerNum'),enum:$('enemyNum'),round:$('roundLabel'),name:$('enemyName'),veil:$('veil'),title:$('cardTitle'),eyebrow:$('cardEyebrow'),text:$('cardText'),start:$('startBtn'),guard:$('guardBtn'),dodge:$('dodgeBtn'),attack:$('attackBtn'),toast:$('toast'),meter:$('meterFill')};
  const canvas = $('scene');
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x171b21);
  scene.fog = new THREE.Fog(0x252326, 9, 29);
  const camera = new THREE.PerspectiveCamera(54, 1, .1, 80);
  const renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const clock = new THREE.Clock();
  let mode='menu', round=1, combo=0, riposte=0, guarding=false, guardStarted=0, swipe=null, enemyTimer=1.6, flash=0, transition=false;
  const player={hp:100,max:100,attack:0,dodge:0,hit:0,attackDir:{x:1,y:0},attackName:'slash'};
  const enemy={hp:100,max:100,attack:0,wind:0,hit:0,stun:0};
  const effects=[];
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const mat=(color,roughness=.8,metalness=.1,emissive=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity:emissive?1.2:0});
  const mats={stone:mat(0x56514b),darkStone:mat(0x302f30),gold:mat(0x927342,.48,.65),steel:mat(0x858c8c,.3,.78),darkSteel:mat(0x343b40,.55,.65),leather:mat(0x49382d),cape:mat(0x463129),red:mat(0x672e2c),glow:mat(0xd99e51,.35,.1,0x9d3e1b)};
  scene.add(new THREE.HemisphereLight(0xb8c3d1,0x382a22,2.1));
  const keyLight=new THREE.DirectionalLight(0xffdfb1,3.3);keyLight.position.set(-5,9,-2);keyLight.castShadow=true;keyLight.shadow.mapSize.set(1024,1024);keyLight.shadow.camera.left=-11;keyLight.shadow.camera.right=11;keyLight.shadow.camera.top=13;keyLight.shadow.camera.bottom=-10;scene.add(keyLight);
  const rim=new THREE.DirectionalLight(0x91a8c2,2.2);rim.position.set(5,5,8);scene.add(rim);
  function box(parent,x,y,z,sx,sy,sz,material,rx=0,ry=0,rz=0){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function cylinder(parent,x,y,z,rt,rb,h,material,segments=8){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function buildArena(){
    const floor=new THREE.Mesh(new THREE.CircleGeometry(12,48),mat(0x393330));floor.rotation.x=-Math.PI/2;floor.position.y=-.12;floor.receiveShadow=true;scene.add(floor);
    const inner=new THREE.Mesh(new THREE.CircleGeometry(7.5,40),mat(0x4a4038));inner.rotation.x=-Math.PI/2;inner.position.y=-.105;inner.receiveShadow=true;scene.add(inner);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(7.6,.12,5,64),mats.gold);ring.rotation.x=Math.PI/2;ring.position.y=-.03;scene.add(ring);
    for(let i=0;i<32;i++){const a=i/32*Math.PI*2,r=8.5;const stone=box(scene,Math.cos(a)*r,-.02,Math.sin(a)*r,.95,.38,.72,i%3?mats.stone:mats.darkStone,0,a,0);stone.rotation.y=-a;}
    for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=10.4;const h=1.1+(i%4)*.36;cylinder(scene,Math.cos(a)*r,h/2-.05,Math.sin(a)*r,.45,.58,h,i%3?mats.darkStone:mats.stone,6);}
    for(let i=0;i<10;i++){const x=-9+i*2;const h=2.3+(i%3)*.65;box(scene,x,h/2,8,.95,h,.8,i%2?mats.darkStone:mats.stone,0,0,(i%3-1)*.07);}
    // Broken keep and arch in the far distance.
    box(scene,0,2.1,11,8,4.2,1.2,mats.darkStone);box(scene,-4.7,2.8,10.7,1.2,5.6,1.4,mats.stone);box(scene,4.6,2.4,10.8,1.2,4.8,1.4,mats.stone);
    for(let x=-3.6;x<=3.7;x+=1.2)box(scene,x,4.6,10.8,.72,.7,1.6,mats.stone,0,0,(x%2)*.08);
    const arch=cylinder(scene,0,1.3,10.3,1.65,1.65,3,mats.darkStone,12);arch.rotation.z=Math.PI/2;arch.scale.set(1,1.15,.42);
    const fire=new THREE.PointLight(0xe17b3d,7,9,2);fire.position.set(0,1.6,9);scene.add(fire);
    for(let i=0;i<7;i++){const p=new THREE.Mesh(new THREE.IcosahedronGeometry(.12+(i%2)*.09,0),i%2?mats.glow:mat(0x7b4a31));p.position.set(-7+i*2.2,.25,2.7+(i%3)*1.3);p.rotation.set(i,.4*i,0);scene.add(p);}
  }
  buildArena();

  function buildFighter(isPlayer){
    const root=new THREE.Group();scene.add(root);
    const body=new THREE.Group();root.add(body);
    const armor=isPlayer?mat(0x89816d,.55,.55):mat(0x696d70,.48,.68);
    const trim=isPlayer?mats.gold:mat(0x9a4936,.5,.5);
    const cloth=isPlayer?mats.cape:mats.red;
    // Layered cape, torso and waist.
    const cape=box(body,0,1.03,-.25,.78,1.35,.2,cloth,.12,0,.03);
    box(body,0,1.42,0,.72,.78,.42,armor,-.05,0,0);
    box(body,0,1.02,.01,.77,.24,.47,mats.leather);
    box(body,0,1.01,.26,.16,.17,.08,trim);
    for(let i=0;i<3;i++)box(body,0,1.22+i*.15,.22,.59,.045,.04,trim);
    // Legs with articulated sway.
    const legs=[];
    for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.2,.88,0);body.add(leg);box(leg,0,-.31,0,.29,.62,.34,armor,side*.04);box(leg,0,-.65,.08,.34,.18,.52,mats.darkSteel);box(leg,0,-.08,.04,.35,.16,.39,trim);legs.push(leg);}
    // Helmet and dark visor.
    cylinder(body,0,2.05,0,.28,.3,.47,armor,8);
    const helmet= new THREE.Mesh(new THREE.SphereGeometry(.31,10,8),armor);helmet.position.set(0,2.28,0);helmet.scale.set(1,1.05,.9);helmet.castShadow=true;body.add(helmet);
    box(body,0,2.2,.28,.36,.09,.08,mats.darkSteel);
    box(body,0,2.22,.326,.2,.025,.02,isPlayer?mats.gold:mat(0xb74427,.35,.2,0x8c1f0c));
    const crest=box(body,0,2.56,-.01,.1,.42,.13,trim,-.1,0,0);
    // Arms and articulated weapon/shield pivots.
    const swordArm=new THREE.Group();swordArm.position.set(.47,1.68,0);body.add(swordArm);
    box(swordArm,0,-.19,0,.23,.47,.29,armor,.15,0,-.16);
    const hand=cylinder(swordArm,0,-.45,.02,.1,.1,.19,mats.leather,7);hand.rotation.x=Math.PI/2;
    const sword=new THREE.Group();sword.position.set(0,-.48,.08);swordArm.add(sword);
    box(sword,0,.42,0,.095,.8,.075,mats.steel,0,0,-.08);
    box(sword,0,.79,0,.14,.12,.1,mat(0xd5d1c5,.28,.8));
    box(sword,0,.01,0,.36,.075,.12,trim,0,0,-.08);
    const shieldArm=new THREE.Group();shieldArm.position.set(-.46,1.58,0);body.add(shieldArm);
    box(shieldArm,0,-.12,.06,.22,.5,.29,armor,-.15,0,.15);
    const shield=new THREE.Mesh(new THREE.CylinderGeometry(.42,.34,.16,6),isPlayer?mat(0x604634,.55,.5):mat(0x4d4d4c,.55,.55));shield.rotation.z=Math.PI/2;shield.position.set(-.05,-.3,.28);shield.scale.set(.78,1.15,1);shield.castShadow=true;shieldArm.add(shield);
    const emblem=box(shieldArm,-.05,-.3,.38,.12,.34,.04,trim,0,0,-.15);
    const impact=new THREE.Mesh(new THREE.SphereGeometry(.5,12,8),new THREE.MeshBasicMaterial({color:0xffd184,transparent:true,opacity:0,depthWrite:false}));impact.position.set(0,1.25,.55);body.add(impact);
    return {root,body,swordArm,sword,shieldArm,shield,legs,impact,cape,isPlayer};
  }
  const hero=buildFighter(true),foe=buildFighter(false);
  hero.root.position.set(0,0,0);hero.root.rotation.y=0;
  foe.root.position.set(0,0,4.7);foe.root.rotation.y=Math.PI;
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<.72?61:54;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(canvas);resize();
  function toast(msg){ui.toast.textContent=msg;ui.toast.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>ui.toast.classList.remove('show'),1050);}
  function updateHUD(){ui.pfill.style.width=`${clamp(player.hp,0,100)}%`;ui.efill.style.width=`${clamp(enemy.hp/enemy.max*100,0,100)}%`;ui.pnum.textContent=Math.ceil(player.hp);ui.enum.textContent=Math.ceil(enemy.hp);ui.round.textContent=`Испытание ${['I','II','III'][round-1]||'III'} / 3`;ui.meter.style.width=`${riposte}%`;ui.guard.classList.toggle('primary',guarding);ui.attack.disabled=mode!=='play';ui.dodge.disabled=mode!=='play';}
  function showCard(type){mode=type;ui.veil.classList.remove('hidden');if(type==='menu'){ui.eyebrow.textContent='Сталь помнит';ui.title.textContent='Ashen Oath';ui.text.textContent='Встань лицом к лицу с рыцарем в руинах крепости. Свайпай в нужную сторону, чтобы задать направление удара; удерживай щит и поймай момент для парирования.';ui.start.textContent='Войти на арену';}else if(type==='victory'){ui.eyebrow.textContent='Клятва нерушима';ui.title.textContent='Победа';ui.text.textContent='Тишина снова воцарилась в Разрушенной крепости. Твоя сталь заслужила имя.';ui.start.textContent='Сразиться снова';}else{ui.eyebrow.textContent='Испытание окончено';ui.title.textContent='Поражение';ui.text.textContent='Полый рыцарь завладел ареной. Соберись и вернись в бой.';ui.start.textContent='Подняться снова';}}
  function newEnemy(){transition=false;enemy.max=100+(round-1)*14;enemy.hp=enemy.max;enemy.wind=0;enemy.attack=0;enemy.hit=0;enemy.stun=0;enemyTimer=1.5;ui.name.textContent=['Полый рыцарь','Алый жнец','Пепельный король'][round-1]||'Пепельный король';foe.root.visible=true;updateHUD();}
  function begin(){round=1;player.hp=100;player.attack=0;player.dodge=0;player.hit=0;combo=0;riposte=0;guarding=false;ui.guard.classList.remove('primary');newEnemy();ui.veil.classList.add('hidden');mode='play';}
  function burst(position,color=0xe6c47b,count=13){for(let i=0;i<count;i++){const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.035+Math.random()*.045,0),new THREE.MeshBasicMaterial({color,transparent:true}));mesh.position.copy(position);scene.add(mesh);effects.push({mesh,life:.35+Math.random()*.35,velocity:V((Math.random()-.5)*3,Math.random()*2,(Math.random()-.5)*2)});}}
  function slashArc(dir){const group=new THREE.Group();group.position.set(dir.x*.38,1.5+dir.y*.24,1.15);hero.root.add(group);const arc=new THREE.Mesh(new THREE.TorusGeometry(.78,.026,5,32,Math.PI*1.12),new THREE.MeshBasicMaterial({color:0xffd889,transparent:true,opacity:.88}));arc.rotation.set(dir.y*.45,0,Math.atan2(dir.y,dir.x)-.5);group.add(arc);effects.push({mesh:group,life:.32,velocity:V(0,0,0),arc:true});}
  function doAttack(dir={x:1,y:0}){
    if(mode!=='play'||transition||enemy.hp<=0||player.attack>0||player.dodge>0)return;
    const len=Math.hypot(dir.x,dir.y)||1;dir={x:dir.x/len,y:dir.y/len};player.attack=.48;player.attackDir=dir;player.attackName=Math.abs(dir.y)>.68?(dir.y>0?'overhead':'rising'):(dir.x<0?'left cut':'right cut');combo++;
    let damage=Math.abs(dir.y)>.68?18:14;damage+=Math.min(combo,5)*1.4;
    if(enemy.wind>0){damage+=9;enemy.wind=0;enemy.stun=.95;riposte=clamp(riposte+30,0,100);toast('Срыв атаки!');burst(V(0,1.3,4.15),0xf0cd7a,21);}else if(enemy.stun>0){damage+=7;riposte=clamp(riposte+12,0,100);}
    enemy.hp=Math.max(0,enemy.hp-damage);enemy.hit=.3;foe.impact.material.opacity=.85;slashArc(dir);burst(V(dir.x*.35,1.35+dir.y*.22,4.1),0xe8c879,14);updateHUD();
    if(enemy.hp<=0){transition=true;setTimeout(()=>{if(mode!=='play')return;if(round<3){round++;player.hp=Math.min(100,player.hp+22);newEnemy();toast('Новый противник');}else showCard('victory');},700);}
  }
  function doDodge(){if(mode!=='play'||player.dodge>0)return;player.dodge=.62;player.attack=0;guarding=false;ui.guard.classList.remove('primary');toast('Уклонение');}
  function setGuard(on){if(mode!=='play')return;if(on&&!guarding)guardStarted=performance.now();guarding=on;ui.guard.classList.toggle('primary',on);}
  function enemyStrike(){if(mode!=='play')return;if(player.dodge>0){toast('Чистое уклонение');riposte=clamp(riposte+20,0,100);burst(V(0,1.1,.3),0xc7d6d1,9);}else if(guarding){const perfect=performance.now()-guardStarted<430;if(perfect){toast('Идеальное парирование');riposte=clamp(riposte+40,0,100);enemy.stun=1.1;burst(V(0,1.35,1.2),0xf4d18a,24);}else{toast('Блок щитом');player.hp=Math.max(0,player.hp-5);riposte=clamp(riposte+8,0,100);burst(V(0,1.35,.45),0xaa9b78,10);}}else{player.hp=Math.max(0,player.hp-15-round*2);player.hit=.42;combo=0;burst(V(0,1.3,.35),0xa64c3c,16);toast('Получен удар');}enemy.attack=.42;updateHUD();if(player.hp<=0)setTimeout(()=>{if(mode==='play')showCard('defeat');},450);}
  function update(dt,t){
    player.attack=Math.max(0,player.attack-dt);player.dodge=Math.max(0,player.dodge-dt);player.hit=Math.max(0,player.hit-dt);enemy.hit=Math.max(0,enemy.hit-dt);enemy.attack=Math.max(0,enemy.attack-dt);enemy.stun=Math.max(0,enemy.stun-dt);const wasWinding=enemy.wind>0;enemy.wind=Math.max(0,enemy.wind-dt);flash=Math.max(0,flash-dt);
    if(mode==='play'&&enemy.hp>0&&enemy.stun<=0&&enemy.wind<=0&&enemy.attack<=0){enemyTimer-=dt;if(enemyTimer<=0){enemy.wind=.88;enemyTimer=2.15+Math.random()*1.1;}}
    if(wasWinding&&enemy.wind===0)enemyStrike();
    if(foe.impact.material.opacity>0)foe.impact.material.opacity=Math.max(0,foe.impact.material.opacity-dt*3.4);
    const idle=Math.sin(t*2.1);
    hero.body.position.y=player.dodge>0?-.2:Math.sin(t*3)*.025;
    hero.body.rotation.z=player.hit>0?-.12:player.dodge>0?-.34:0;
    hero.body.rotation.x=player.dodge>0?.2:0;
    hero.legs[0].rotation.x=Math.sin(t*2)*.025;hero.legs[1].rotation.x=-Math.sin(t*2)*.025;
    hero.cape.rotation.x=Math.sin(t*3.1)*.07;
    hero.shieldArm.rotation.x=guarding?-.46:player.dodge>0?.28:Math.sin(t*2)*.02;
    hero.shieldArm.rotation.z=guarding?-.16:0;
    if(player.attack>0){const progress=1-player.attack/.48,d=player.attackDir;hero.swordArm.rotation.z=Math.abs(d.x)>.68?THREE.MathUtils.lerp(d.x>0?-.95:.95,d.x>0?.95:-.95,progress):THREE.MathUtils.lerp(d.x<0?.65:-.65,d.x<0?-.85:.85,progress);hero.swordArm.rotation.x=Math.abs(d.y)>.68?THREE.MathUtils.lerp(d.y>0?-.9:.9,d.y>0?.9:-.9,progress):-.12;hero.swordArm.rotation.y=-.15+Math.sin(progress*Math.PI)*.34;}
    else{hero.swordArm.rotation.set(-.12+Math.sin(t*2.1)*.018,0,-.12);}
    foe.body.position.y=enemy.wind>0?.025:Math.sin(t*2.2+1)*.022;
    foe.swordArm.rotation.z=enemy.wind>0?-.95:enemy.attack>0?.8:enemy.stun>0?.5:Math.sin(t*2)*.02;
    foe.swordArm.rotation.x=enemy.wind>0?-.4:enemy.attack>0?.75:0;
    foe.shieldArm.rotation.x=enemy.wind>0?.18:0;
    foe.root.position.z=4.7+(enemy.attack>0?-.35:enemy.stun>0?.12:0);
    foe.body.rotation.z=enemy.hit>0?Math.sin(t*50)*.12:0;
    for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;if(!e.arc){e.mesh.position.addScaledVector(e.velocity,dt);e.velocity.y-=3*dt;e.mesh.scale.setScalar(Math.max(.05,e.life));}else{e.mesh.scale.setScalar(.7+Math.max(0,e.life)*1.5);e.mesh.children[0].material.opacity=Math.max(0,e.life/.32);}if(e.life<=0){e.mesh.parent?.remove(e.mesh);if(!e.arc)e.mesh.geometry.dispose();effects.splice(i,1);}}
    const cameraTarget=V(hero.root.position.x,1.38,1.8);const cameraPos=V(hero.root.position.x*.5,4.05,-8.25);if(window.innerWidth/window.innerHeight<.72){cameraPos.y=4.2;cameraPos.z=-9.2;cameraTarget.z=1.6;}
    camera.position.lerp(cameraPos,1-Math.exp(-dt*4));camera.lookAt(cameraTarget);
    updateHUD();renderer.render(scene,camera);
  }
  function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top,w:r.width,h:r.height};}
  canvas.addEventListener('pointerdown',e=>{swipe={...canvasPoint(e),time:performance.now()};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointerup',e=>{if(!swipe)return;const p=canvasPoint(e),dx=p.x-swipe.x,dy=p.y-swipe.y,d=Math.hypot(dx,dy);if(d>Math.max(26,swipe.h*.045)){doAttack({x:dx,y:-dy});}swipe=null;});
  canvas.addEventListener('pointercancel',()=>swipe=null);
  ui.attack.addEventListener('click',()=>doAttack({x:1,y:0}));ui.dodge.addEventListener('click',doDodge);
  ui.guard.addEventListener('pointerdown',e=>{e.preventDefault();ui.guard.setPointerCapture(e.pointerId);setGuard(true);});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>ui.guard.addEventListener(ev,()=>setGuard(false)));
  ui.start.addEventListener('click',begin);
  window.addEventListener('keydown',e=>{if(e.repeat)return;if(e.code==='Space'){e.preventDefault();setGuard(true);}if(e.code==='ShiftLeft'||e.code==='ShiftRight')doDodge();if(e.code==='Enter'&&mode!=='play')begin();if(['KeyA','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){const d={KeyA:{x:-1,y:0},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},ArrowUp:{x:0,y:1},ArrowDown:{x:0,y:-1}}[e.code];doAttack(d);}});
  window.addEventListener('keyup',e=>{if(e.code==='Space')setGuard(false);});
  function frame(){const dt=Math.min(.05,clock.getDelta());update(dt,clock.elapsedTime);requestAnimationFrame(frame);}
  showCard('menu');updateHUD();requestAnimationFrame(frame);
})();
