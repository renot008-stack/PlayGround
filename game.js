import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ui = {pfill:$('playerFill'),efill:$('enemyFill'),pnum:$('playerNum'),enum:$('enemyNum'),round:$('roundLabel'),name:$('enemyName'),veil:$('veil'),title:$('cardTitle'),eyebrow:$('cardEyebrow'),text:$('cardText'),start:$('startBtn'),guard:$('guardBtn'),toast:$('toast'),meter:$('meterFill'),cue:$('combatCue'),leftZone:$('dodgeLeft'),rightZone:$('dodgeRight')};
  const canvas = $('scene');
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const V = (x,y,z) => new THREE.Vector3(x,y,z);

  // ── World ────────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x091011);
  scene.fog = new THREE.Fog(0x101a1b, 11, 32);
  const camera = new THREE.PerspectiveCamera(52, 1, .1, 90);
  camera.position.set(-2.55, 4.05, -8.35);
  const renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const clock = new THREE.Clock();

  const mat = (color,roughness=.8,metalness=.1,emissive=0) => new THREE.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity:emissive?1.25:0});
  const glowMat = (color,opacity=1) => new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity>=1});

  scene.add(new THREE.HemisphereLight(0x9dc4c1,0x241a14,1.55));
  const keyLight = new THREE.DirectionalLight(0xffd7a0,3.0);
  keyLight.position.set(-5.5,9.5,-2.5);keyLight.castShadow=true;keyLight.shadow.mapSize.set(1024,1024);
  keyLight.shadow.camera.left=-12;keyLight.shadow.camera.right=12;keyLight.shadow.camera.top=14;keyLight.shadow.camera.bottom=-11;scene.add(keyLight);
  const rim = new THREE.DirectionalLight(0x6fa8a1,2.1);rim.position.set(6,5.5,8);scene.add(rim);

  function box(parent,x,y,z,sx,sy,sz,material,rx=0,ry=0,rz=0){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function cylinder(parent,x,y,z,rt,rb,h,material,segments=10){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function sphere(parent,x,y,z,r,material,segments=10){const m=new THREE.Mesh(new THREE.SphereGeometry(r,segments,Math.max(6,segments-2)),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function torus(parent,x,y,z,r,tube,material,rx=0,ry=0,rz=0,arc=Math.PI*2){const m=new THREE.Mesh(new THREE.TorusGeometry(r,tube,6,32,arc),material);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;parent.add(m);return m;}

  function buildArena(){
    const stone=mat(0x2a312f,.94,.02);
    const stoneDark=mat(0x181e1d,.96,.02);
    const floorMat=mat(0x222a28,.95,.02);
    const brass=mat(0xa78345,.4,.82);
    const iron=mat(0x202727,.7,.55);
    const tealGlass=new THREE.MeshBasicMaterial({color:0x3c7d78});
    const paleGlass=new THREE.MeshBasicMaterial({color:0x709c93});

    const floor=new THREE.Mesh(new THREE.CircleGeometry(12,64),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-.12;floor.receiveShadow=true;scene.add(floor);
    const inner=new THREE.Mesh(new THREE.CircleGeometry(7.5,56),mat(0x2b3532,.92,.03));inner.rotation.x=-Math.PI/2;inner.position.y=-.105;inner.receiveShadow=true;scene.add(inner);
    torus(scene,0,-.02,0,7.58,.09,brass,Math.PI/2);
    torus(scene,0,-.075,0,3.45,.035,brass,Math.PI/2);
    torus(scene,0,-.075,0,1.4,.03,brass,Math.PI/2);
    for(let i=0;i<12;i++){
      const a=i/12*Math.PI*2,r=5.45;
      box(scene,Math.cos(a)*r,-.09,Math.sin(a)*r,.05,.012,3.5,brass,0,Math.PI/2-a,0);
    }

    // Half-circle of pillars and stained glass behind the duel.
    for(let i=0;i<7;i++){
      const a=(18+i*24)*Math.PI/180,r=8.75,x=Math.cos(a)*r,z=Math.sin(a)*r;
      box(scene,x,-.02,z,1.55,.55,1.55,stoneDark,0,a,0);
      cylinder(scene,x,2.55,z,.4,.52,5.1,stone,10);
      box(scene,x,5.18,z,1.4,.34,1.4,brass,0,a,0);
      torus(scene,x,4.86,z,.53,.055,brass,Math.PI/2);
      cylinder(scene,x,5.05,z,.42,.42,.18,brass,10);
    }
    for(let i=0;i<6;i++){
      const a=(30+i*24)*Math.PI/180,r=9.85,x=Math.cos(a)*r,z=Math.sin(a)*r,ry=Math.PI*1.5-a;
      box(scene,x,3.05,z,1.25,4.35,.16,i%2?tealGlass:paleGlass,0,ry,0);
      box(scene,x,3.05,z,3.05,.1,.18,stoneDark,0,ry,0);
      box(scene,x,2.05,z,3.05,.09,.18,stoneDark,0,ry,0);
      box(scene,x,4.1,z,3.05,.09,.18,stoneDark,0,ry,0);
      box(scene,x,3.05,z,4.45,.12,.18,stoneDark,0,ry,0);
      const cap=new THREE.Mesh(new THREE.CylinderGeometry(0,.8,.95,4),tealGlass);cap.position.set(x,5.7,z);cap.rotation.y=ry+Math.PI/4;scene.add(cap);
      box(scene,x,.92,z,1.5,.24,.42,stone,0,ry,0);
    }

    // The silent bell hanging over the choir.
    const bellMat=mat(0x9c7a3d,.34,.88);
    box(scene,0,8.25,9.3,7.4,.32,.42,iron);
    cylinder(scene,-1.7,7.4,9.3,.05,.05,1.7,iron,6);
    cylinder(scene,1.7,7.4,9.3,.05,.05,1.7,iron,6);
    const bell=new THREE.Mesh(new THREE.CylinderGeometry(.55,1.16,1.8,16,1,true),bellMat);bell.position.set(0,6.1,9.3);bell.castShadow=true;scene.add(bell);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.57,14,8,0,Math.PI*2,0,Math.PI/2),bellMat);cap.position.set(0,6.99,9.3);cap.castShadow=true;scene.add(cap);
    torus(scene,0,5.21,9.3,1.15,.075,bellMat,Math.PI/2);
    sphere(scene,0,5.08,9.3,.17,bellMat,10);
    const bellLight=new THREE.PointLight(0xe3ad63,5.5,14,2);bellLight.position.set(0,4.6,9.1);scene.add(bellLight);

    // Broken side arches and rubble.
    for(const side of [-1,1]){
      torus(scene,side*6.1,2.4,8.6,2.15,.26,stone,0,0,0,Math.PI);
      box(scene,side*6.1,2.2,8.6,.6,3.2,.7,stoneDark);
    }
    for(let i=0;i<9;i++){
      const a=i/9*Math.PI*2+.3,r=7.9+(i%3)*.55;
      const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.16+(i%3)*.09,0),i%2?stone:stoneDark);
      rock.position.set(Math.cos(a)*r,.08,Math.sin(a)*r);rock.rotation.set(i,.7*i,.3*i);rock.castShadow=true;scene.add(rock);
    }

    // Candles and two warm pools of light.
    const wax=mat(0xd2c6a9,.7,.02), flame=glowMat(0xffc37a);
    for(let i=0;i<6;i++){
      const a=(28+i*52)*Math.PI/180,r=6.6,x=Math.cos(a)*r,z=Math.sin(a)*r;
      cylinder(scene,x,.2,z,.045,.05,.42,wax,7);
      sphere(scene,x,.46,z,.055,flame,8);
    }
    const fireA=new THREE.PointLight(0xffab66,1.5,6,2);fireA.position.set(-5.7,1.7,2.6);scene.add(fireA);
    const fireB=new THREE.PointLight(0xffab66,1.5,6,2);fireB.position.set(5.7,1.7,2.6);scene.add(fireB);

    // Dust suspended in the nave.
    const dustGeo=new THREE.BufferGeometry();
    const positions=new Float32Array(240);
    for(let i=0;i<240;i+=3){const a=Math.random()*Math.PI*2,r=2+Math.random()*7;positions[i]=Math.cos(a)*r;positions[i+1]=.3+Math.random()*6.2;positions[i+2]=Math.sin(a)*r;}
    dustGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    scene.add(new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xd9c9a0,size:.035,transparent:true,opacity:.4,depthWrite:false})));
  }
  buildArena();

  // ── Fighters ─────────────────────────────────────────────────────────────
  function buildFighter(isPlayer){
    const root=new THREE.Group();scene.add(root);
    const body=new THREE.Group();root.add(body);
    const armor=mat(isPlayer?0x2b3839:0x555c58,.55,.5);
    const armorDark=mat(isPlayer?0x151d1e:0x232a28,.68,.45);
    const trim=mat(isPlayer?0xb08a45:0xb08a45,.42,.8);
    const cloth=mat(isPlayer?0x204346:0x344c46,.9,.04);
    const clothDark=mat(isPlayer?0x142c2e:0x1c2b27,.94,.03);
    const steel=mat(isPlayer?0xbcc6c0:0x969c96,.3,.85);
    const bone=mat(0xd9cfb6,.62,.04);

    // Boots and articulated legs.
    const legs=[];
    for(const side of [-1,1]){
      const leg=new THREE.Group();leg.position.set(side*.21,.9,0);body.add(leg);
      box(leg,0,-.3,0,.31,.68,.37,armorDark,side*.03);
      box(leg,0,-.66,.06,.35,.19,.54,armor);
      box(leg,0,-.53,.02,.36,.09,.4,trim);
      legs.push(leg);
    }

    // Torso, waist and layered cloth.
    let cape=null,special=null;
    box(body,0,1.42,0,.78,.8,.46,armor,-.04,0,0);
    box(body,0,1.04,.01,.82,.24,.5,armorDark);
    box(body,0,1.1,.25,.2,.16,.08,trim);
    if(isPlayer){
      box(body,0,.68,-.02,.82,.82,.16,cloth,.04,0,0);
      box(body,0,.86,.27,.24,.7,.08,clothDark);
      for(let i=0;i<3;i++)box(body,0,1.28+i*.14,.24,.5,.035,.03,trim);
      sphere(body,0,2.06,-.02,.28,armorDark,12);
      box(body,0,2.04,.24,.3,.27,.06,bone);
      box(body,0,2.08,.275,.21,.028,.015,clothDark);
      const hood=new THREE.Mesh(new THREE.ConeGeometry(.38,.58,8),clothDark);hood.position.set(0,2.24,-.03);hood.castShadow=true;body.add(hood);
      torus(body,0,2.16,-.02,.36,.035,trim,Math.PI/2);
      cape=new THREE.Group();cape.position.set(-.08,1.68,-.28);body.add(cape);
      for(let i=0;i<3;i++)box(cape,0,-i*.23,-i*.025,.34,.24,.06,i?clothDark:cloth,.16,0,.05);
      box(body,-.52,1.72,0,.28,.16,.36,trim,0,0,.14);
    }else{
      box(body,0,.66,.26,.52,.98,.08,cloth);
      box(body,0,.66,-.26,.58,.98,.08,cloth);
      box(body,0,1.2,.3,.16,.2,.06,trim,0,0,Math.PI/4);
      box(body,-.5,1.74,0,.42,.26,.44,armorDark,0,0,.16);
      box(body,.5,1.74,0,.42,.26,.44,armorDark,0,0,-.16);
      // Bell-shaped helmet with a narrow sight slit.
      const bell=cylinder(body,0,2.17,0,.23,.42,.5,trim,12);
      sphere(body,0,2.44,0,.15,trim,10);
      box(body,0,2.44,.16,.06,.13,.05,trim);
      torus(body,0,1.93,0,.42,.035,armorDark,Math.PI/2);
      box(body,0,2.09,.4,.34,.05,.03,clothDark);
      sphere(body,0,1.87,.06,.065,brassDark(),8);
      const halo=torus(body,0,2.25,-.3,.5,.02,glowMat(0xd1a85d,.9));
      halo.castShadow=false;
      const crown=new THREE.Group();crown.position.set(0,2.52,0);body.add(crown);
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const spike=new THREE.Mesh(new THREE.ConeGeometry(.045,.24,4),trim);spike.position.set(Math.cos(a)*.2,.1,Math.sin(a)*.2);spike.castShadow=true;crown.add(spike);}
      crown.visible=false;
      special={bell,halo,crown};
    }

    // Big sword arm and blade.
    const swordArm=new THREE.Group();swordArm.position.set(.56,1.69,0);body.add(swordArm);
    box(swordArm,0,-.22,0,.34,.58,.38,isPlayer?clothDark:armorDark,.15,0,-.16);
    box(swordArm,0,-.5,.02,.3,.18,.34,trim,.1,0,0);
    const hand=cylinder(swordArm,0,-.58,.04,.13,.13,.24,mat(0x3a2c22,.9,.02),7);hand.rotation.x=Math.PI/2;
    const sword=new THREE.Group();sword.position.set(0,-.62,.1);swordArm.add(sword);
    cylinder(sword,0,-.12,0,.055,.065,.28,clothDark,7);
    box(sword,0,.05,0,.48,.075,.14,trim,0,0,-.05);
    box(sword,0,.62,0,.155,1.16,.075,steel,0,0,-.04);
    box(sword,0,.62,.042,.035,1.02,.015,trim,0,0,-.04);
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.078,.2,4),steel);tip.position.set(0,1.3,0);tip.rotation.y=Math.PI/4;tip.scale.z=.5;tip.castShadow=true;sword.add(tip);
    box(sword,0,-.27,0,.07,.2,.07,clothDark,0,0,0);

    // Buckler / processional shield.
    const shieldArm=new THREE.Group();shieldArm.position.set(-.55,1.62,0);body.add(shieldArm);
    box(shieldArm,0,-.16,.02,.32,.6,.38,isPlayer?clothDark:armorDark,-.12,0,.14);
    box(shieldArm,0,-.48,.02,.28,.16,.34,trim,-.1,0,0);
    const shield=new THREE.Mesh(new THREE.CylinderGeometry(isPlayer?.42:.5,isPlayer?.38:.46,.13,10),isPlayer?mat(0x2f4643,.55,.4):armor);
    shield.rotation.x=Math.PI/2;shield.position.set(-.02,-.3,.31);shield.castShadow=true;shieldArm.add(shield);
    torus(shieldArm,-.02,-.3,.38,isPlayer?.42:.5,.035,trim);
    const boss=new THREE.Mesh(new THREE.ConeGeometry(isPlayer?.13:.16,.13,6),trim);boss.position.set(-.02,-.3,.43);boss.rotation.x=Math.PI/2;boss.castShadow=true;shieldArm.add(boss);

    const impact=new THREE.Mesh(new THREE.SphereGeometry(.5,12,8),new THREE.MeshBasicMaterial({color:0xffd489,transparent:true,opacity:0,depthWrite:false}));impact.position.set(0,1.3,.6);body.add(impact);

    return {root,body,swordArm,sword,shieldArm,shield,legs,impact,isPlayer,materials:{armor,armorDark,trim,cloth,clothDark},special,cape};
  }
  function brassDark(){return mat(0x6f5426,.5,.8);}

  const hero=buildFighter(true), foe=buildFighter(false);
  hero.root.position.set(0,0,0);hero.root.rotation.y=0;
  foe.root.position.set(0,0,4.7);foe.root.rotation.y=Math.PI;foe.root.scale.setScalar(1.04);

  const heroRing=new THREE.Mesh(new THREE.RingGeometry(.55,.64,36),new THREE.MeshBasicMaterial({color:0x78b0a8,transparent:true,opacity:.32,side:THREE.DoubleSide,depthWrite:false}));
  heroRing.rotation.x=-Math.PI/2;heroRing.position.y=.03;hero.root.add(heroRing);

  // Telegraph ring and blade glow: the enemy's intent must be readable.
  const dangerRing=new THREE.Mesh(new THREE.RingGeometry(1.12,1.34,48),new THREE.MeshBasicMaterial({color:0xd8b26a,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
  dangerRing.rotation.x=-Math.PI/2;dangerRing.position.y=.06;foe.root.add(dangerRing);
  const bladeGlow=new THREE.Mesh(new THREE.BoxGeometry(.2,1.16,.12),new THREE.MeshBasicMaterial({color:0xffc37a,transparent:true,opacity:0,depthWrite:false}));
  bladeGlow.position.set(0,.62,0);foe.sword.add(bladeGlow);

  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<.72?60:52;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(canvas);resize();

  // ── State ────────────────────────────────────────────────────────────────
  let mode='menu', round=1, combo=0, riposte=0, guarding=false, guardStarted=0, swipe=null, enemyTimer=1.6, flash=0, transition=false, opening=0, moveIndex=0, enemyPattern=[];
  const player={hp:100,max:100,attack:0,dodge:0,dodgeSide:0,hit:0,attackDir:{x:1,y:0},attackName:'slash'};
  const enemy={hp:100,max:100,attack:0,wind:0,hit:0,stun:0,move:null};

  const enemyMoves={
    sweep:{name:'Рубящий размах',guard:'any',dir:{x:1,y:0},cue:'ЛЮБАЯ ЗАЩИТА · РУБЯЩИЙ РАЗМАХ'},
    hook:{name:'Косой удар',guard:'any',dir:{x:-1,y:0},cue:'ЛЮБАЯ ЗАЩИТА · КОСОЙ УДАР'},
    overhead:{name:'Удар сверху',guard:'any',dir:{x:0,y:1},cue:'ЛЮБАЯ ЗАЩИТА · УДАР СВЕРХУ'},
    crush:{name:'Дробящий удар',guard:'block',dir:{x:1,y:.55},cue:'ТОЛЬКО ЩИТ · ДРОБЯЩИЙ УДАР'},
    lowSweep:{name:'Низкий размах',guard:'dodge',dir:{x:-1,y:-.5},cue:'ТОЛЬКО УКЛОН · НИЗКИЙ РАЗМАХ'},
    thrust:{name:'Укол',guard:'parry',dir:{x:1,y:0},cue:'ТОЛЬКО ПАРИРОВАНИЕ · УКОЛ ↔'},
    reverse:{name:'Обратный укол',guard:'parry',dir:{x:0,y:1},cue:'ТОЛЬКО ПАРИРОВАНИЕ · ОБРАТНЫЙ УКОЛ ↕'}
  };
  const patterns=[
    [['sweep','hook','thrust','overhead'],['sweep','overhead','hook','sweep'],['overhead','sweep','thrust','hook','sweep']],
    [['sweep','hook','crush','overhead','sweep'],['overhead','sweep','reverse','hook'],['hook','sweep','overhead','thrust','hook']],
    [['sweep','overhead','lowSweep','hook','sweep'],['crush','sweep','overhead','hook'],['sweep','reverse','hook','overhead','sweep']]
  ];
  const effects=[];

  function toast(msg){ui.toast.textContent=msg;ui.toast.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>ui.toast.classList.remove('show'),1050);}
  function updateHUD(){
    ui.pfill.style.width=`${clamp(player.hp,0,100)}%`;ui.efill.style.width=`${clamp(enemy.hp/enemy.max*100,0,100)}%`;
    ui.pnum.textContent=Math.ceil(player.hp);ui.enum.textContent=Math.ceil(enemy.hp);
    ui.round.textContent=`Глас ${['I','II','III'][round-1]||'III'} / III`;
    ui.meter.style.width=`${opening>0?opening/3*100:riposte}%`;
    ui.guard.classList.toggle('primary',guarding);ui.guard.disabled=mode!=='play';
  }
  function showCard(type){
    mode=type;ui.veil.classList.remove('hidden');
    if(type==='menu'){
      ui.eyebrow.textContent='Тишина перед нотой';
      ui.title.textContent='Железный хор';
      ui.text.textContent='Обитель пела одну ноту, пока камень не стал железом. Ты — последний слушатель, пришедший оборвать песню. Пройди три гласа: большинство ударов отбиваются щитом, уклоном или встречным клинком, и лишь редкие требуют одного ответа — подсказка назовёт его. Когда хор смолкает, бей свайпом.';
      ui.start.textContent='Войти в обитель';
    }else if(type==='victory'){
      ui.eyebrow.textContent='Последняя нота';
      ui.title.textContent='Тишина';
      ui.text.textContent='Колокол умолк. Железо осыпается солью, и твоё имя остаётся неспетым.';
      ui.start.textContent='Пройти пробу снова';
    }else{
      ui.eyebrow.textContent='Хор перепел';
      ui.title.textContent='Диссонанс';
      ui.text.textContent='Твой голос стал ещё одной нотой в железе. Собери дыхание и оборви песню.';
      ui.start.textContent='Снова к колоколу';
    }
  }
  const voices=[
    {name:'Слепой послушник',armor:0x4e5654,trim:0x8f7a4a,cloth:0x2f4b46},
    {name:'Медный звонарь',armor:0x7a5330,trim:0xd0a457,cloth:0x244c4c},
    {name:'Железный хормейстер',armor:0x2b2f33,trim:0xc8a25a,cloth:0x5a2a26}
  ];
  function newEnemy(){
    transition=false;enemy.max=100+(round-1)*14;enemy.hp=enemy.max;enemy.wind=0;enemy.attack=0;enemy.hit=0;enemy.stun=0;enemy.move=null;enemyTimer=1.5;opening=0;moveIndex=0;enemyPattern=[];
    const look=voices[round-1]||voices[2];
    foe.materials.armor.color.setHex(look.armor);foe.materials.trim.color.setHex(look.trim);foe.materials.cloth.color.setHex(look.cloth);
    if(foe.special){foe.special.halo.visible=round>=2;foe.special.crown.visible=round>=3;foe.special.bell.scale.setScalar(1+(round-1)*.06);}
    ui.cue.textContent='СЛУШАЙ ЗАМАХ · БОЛЬШИНСТВО УДАРОВ — ЛЮБАЯ ЗАЩИТА';ui.cue.classList.remove('open','specific');
    ui.name.textContent=look.name;foe.root.visible=true;updateHUD();
  }
  function begin(){round=1;player.hp=100;player.attack=0;player.dodge=0;player.hit=0;combo=0;riposte=0;opening=0;guarding=false;ui.guard.classList.remove('primary');newEnemy();ui.veil.classList.add('hidden');mode='play';}
  function burst(position,color=0xd8b26a,count=13){for(let i=0;i<count;i++){const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.035+Math.random()*.045,0),new THREE.MeshBasicMaterial({color,transparent:true}));mesh.position.copy(position);scene.add(mesh);effects.push({mesh,life:.35+Math.random()*.35,velocity:V((Math.random()-.5)*3,Math.random()*2,(Math.random()-.5)*2)});}}
  function slashArc(dir){const group=new THREE.Group();group.position.set(dir.x*.4,1.5+dir.y*.26,1.18);hero.root.add(group);const arc=new THREE.Mesh(new THREE.TorusGeometry(.82,.026,5,32,Math.PI*1.12),new THREE.MeshBasicMaterial({color:0xffd79a,transparent:true,opacity:.9}));arc.rotation.set(dir.y*.45,0,Math.atan2(dir.y,dir.x)-.5);group.add(arc);effects.push({mesh:group,life:.32,velocity:V(0,0,0),arc:true});}
  function damageEnemy(dir,bonus=0){
    combo++;const base=Math.abs(dir.y)>.68?18:14;const damage=base+Math.min(combo,5)*1.4+bonus;
    enemy.hp=Math.max(0,enemy.hp-damage);enemy.hit=.3;foe.impact.material.opacity=.85;
    slashArc(dir);burst(V(dir.x*.35,1.35+dir.y*.22,4.1),0xf0cd88,14);updateHUD();
    if(enemy.hp<=0){transition=true;opening=0;setTimeout(()=>{if(mode!=='play')return;if(round<3){round++;player.hp=Math.min(100,player.hp+22);newEnemy();toast('Следующий глас');}else showCard('victory');},700);}
  }

  // ── Combat rules ─────────────────────────────────────────────────────────
  function parryStrike(dir){
    player.attack=.48;player.attackDir=dir;player.attackName='parry';
    enemy.wind=0;enemy.stun=1.05;enemy.hit=.3;enemy.attack=.42;
    riposte=clamp(riposte+25,0,100);toast('Встречный звон!');
    burst(V(0,1.4,2.4),0xffd79a,24);damageEnemy(dir,10);completeEnemyMove();
  }
  function doAttack(dir={x:1,y:0}){
    if(mode!=='play'||transition||enemy.hp<=0||player.attack>0||player.dodge>0)return;
    const len=Math.hypot(dir.x,dir.y)||1;dir={x:dir.x/len,y:dir.y/len};
    if(opening>0){
      player.attack=.48;player.attackDir=dir;player.attackName=Math.abs(dir.y)>.68?(dir.y>0?'overhead':'rising'):(dir.x<0?'left cut':'right cut');
      damageEnemy(dir,enemy.stun>0?7:0);
      return;
    }
    const move=enemy.move;
    if(enemy.wind>0&&move){
      if(move.guard==='parry'){
        if(enemy.wind>.36){toast('Жди столкновения клинков');return;}
        const sameAxis=Math.abs(dir.x*move.dir.x+dir.y*move.dir.y)>=.72;
        if(!sameAxis){toast('Удар в ту же или обратную сторону');return;}
        parryStrike(dir);return;
      }
      if(move.guard==='any'){
        if(enemy.wind>.36){toast('Жди столкновения клинков');return;}
        parryStrike(dir);return;
      }
      toast(move.guard==='block'?'Этот удар держит только щит':'Этот удар переживает только уклон');
      return;
    }
    toast(enemy.stun>0?'Хор оглушён — бей':'Атакуй после серии ударов');
  }
  function flashDodge(side){const zone=side<0?ui.leftZone:side>0?ui.rightZone:null;if(!zone)return;zone.classList.add('active');clearTimeout(zone.timer);zone.timer=setTimeout(()=>zone.classList.remove('active'),260);}
  function doDodge(side=0){if(mode!=='play'||player.dodge>0)return;player.dodge=.62;player.dodgeSide=side;player.attack=0;guarding=false;ui.guard.classList.remove('primary');flashDodge(side);toast(side<0?'Уклонение влево':side>0?'Уклонение вправо':'Уклонение');}
  function setGuard(on){if(mode!=='play')return;if(on&&!guarding)guardStarted=performance.now();guarding=on;ui.guard.classList.toggle('primary',on);}
  function completeEnemyMove(){
    enemy.move=null;moveIndex++;enemyTimer=.62;
    if(moveIndex>=enemyPattern.length){
      opening=3;enemyTimer=3;
      ui.cue.textContent='ТИШИНА · 3 СЕКУНДЫ ДЛЯ УДАРА';ui.cue.classList.add('open');ui.cue.classList.remove('specific');
      toast('Хор замолк — бей!');
    }else{
      ui.cue.textContent=`ГЛАС ПРОДОЛЖАЕТСЯ · ${enemyPattern.length-moveIndex} УДАРА`;
      ui.cue.classList.remove('open','specific');
    }
  }
  function startEnemyMove(){
    if(!enemyPattern.length||moveIndex>=enemyPattern.length){
      const pool=patterns[round-1]||patterns[2];
      enemyPattern=pool[Math.floor(Math.random()*pool.length)].map(key=>enemyMoves[key]);moveIndex=0;
    }
    enemy.move=enemyPattern[moveIndex];enemy.wind=.95;
    ui.cue.textContent=enemy.move.cue;ui.cue.classList.remove('open');
    ui.cue.classList.toggle('specific',enemy.move.guard!=='any');
  }
  function enemyStrike(){
    if(mode!=='play'||!enemy.move)return;
    const move=enemy.move,held=guarding,clean=player.dodge>0;
    const blocked=move.guard==='any'?held:move.guard==='block'?held:false;
    if(clean){toast('Чистое уклонение');riposte=clamp(riposte+20,0,100);burst(V(0,1.1,.3),0x9ed0c6,12);}
    else if(blocked){
      const precise=performance.now()-guardStarted<430;
      toast(precise?'Точный блок':'Щит принял удар');
      player.hp=Math.max(0,player.hp-(precise?1:3));
      riposte=clamp(riposte+(precise?18:8),0,100);
      burst(V(0,1.35,.45),precise?0xffd79a:0xb5a47d,precise?18:10);
    }else{
      player.hp=Math.max(0,player.hp-(15+round*2));player.hit=.42;combo=0;
      burst(V(0,1.3,.35),0xc25b42,16);
      toast(move.guard==='parry'?'Укол нужно парировать ударом':move.guard==='block'?'Этот удар держит только щит':move.guard==='dodge'?'Нужно уклонение':'Получен удар');
    }
    enemy.attack=.42;completeEnemyMove();updateHUD();
    if(player.hp<=0)setTimeout(()=>{if(mode==='play')showCard('defeat');},450);
  }

  // ── Frame ────────────────────────────────────────────────────────────────
  function update(dt,t){
    player.attack=Math.max(0,player.attack-dt);player.dodge=Math.max(0,player.dodge-dt);player.hit=Math.max(0,player.hit-dt);
    enemy.hit=Math.max(0,enemy.hit-dt);enemy.attack=Math.max(0,enemy.attack-dt);enemy.stun=Math.max(0,enemy.stun-dt);
    const wasWinding=enemy.wind>0;enemy.wind=Math.max(0,enemy.wind-dt);flash=Math.max(0,flash-dt);

    if(mode==='play'&&opening>0){
      opening=Math.max(0,opening-dt);
      if(opening===0){enemyPattern=[];moveIndex=0;enemyTimer=.42;ui.cue.textContent='ХОР ГОТОВИТ НОВЫЙ ГЛАС';ui.cue.classList.remove('open','specific');}
    }
    if(mode==='play'&&enemy.hp>0&&opening<=0&&enemy.stun<=0&&enemy.wind<=0&&enemy.attack<=0&&!enemy.move){enemyTimer-=dt;if(enemyTimer<=0)startEnemyMove();}
    if(wasWinding&&enemy.wind===0)enemyStrike();
    if(foe.impact.material.opacity>0)foe.impact.material.opacity=Math.max(0,foe.impact.material.opacity-dt*3.4);

    const dodgeSwing=player.dodge>0?Math.sin((1-player.dodge/.62)*Math.PI):0;
    hero.body.position.x=dodgeSwing*player.dodgeSide*.46;
    hero.body.position.y=player.dodge>0?-.18:Math.sin(t*3)*.025;
    hero.body.rotation.z=player.hit>0?-.12:player.dodge>0?-player.dodgeSide*.26:0;
    hero.body.rotation.x=player.dodge>0?.16:0;
    hero.legs[0].rotation.x=Math.sin(t*2)*.025;hero.legs[1].rotation.x=-Math.sin(t*2)*.025;
    if(hero.cape)hero.cape.rotation.x=Math.sin(t*3.1)*.08;
    hero.shieldArm.rotation.x=guarding?-.46:player.dodge>0?.28:Math.sin(t*2)*.02;
    hero.shieldArm.rotation.z=guarding?-.16:0;
    if(player.attack>0){
      const progress=1-player.attack/.48,d=player.attackDir;
      hero.swordArm.rotation.z=Math.abs(d.x)>.68?THREE.MathUtils.lerp(d.x>0?-.95:.95,d.x>0?.95:-.95,progress):THREE.MathUtils.lerp(d.x<0?.65:-.65,d.x<0?-.85:.85,progress);
      hero.swordArm.rotation.x=Math.abs(d.y)>.68?THREE.MathUtils.lerp(d.y>0?-.9:.9,d.y>0?.9:-.9,progress):-.12;
      hero.swordArm.rotation.y=-.15+Math.sin(progress*Math.PI)*.34;
    }else{hero.swordArm.rotation.set(-.12+Math.sin(t*2.1)*.018,0,-.12);}

    foe.body.position.y=enemy.wind>0?.025:Math.sin(t*2.2+1)*.022;
    const move=enemy.move;
    foe.swordArm.rotation.z=enemy.wind>0?(move?.guard==='dodge'?-1.22:move?.dir.y?-.8:-1.04):enemy.attack>0?.8:enemy.stun>0?.5:Math.sin(t*2)*.02;
    foe.swordArm.rotation.x=enemy.wind>0?(move?.dir.y?-.92:-.42):enemy.attack>0?.75:0;
    foe.shieldArm.rotation.x=enemy.wind>0?(move?.guard==='block'?.56:.18):0;
    if(foe.special){foe.special.halo.rotation.z=t*.55;foe.special.crown.rotation.y=t*.2;}

    const tele=enemy.wind>0&&!!move;
    const teleColor=!move||move.guard==='any'?0xd8b26a:move.guard==='block'?0x7fb2d9:move.guard==='dodge'?0x8fd0a8:0xe0563f;
    dangerRing.material.color.setHex(teleColor);
    dangerRing.scale.setScalar(tele?1+(1-enemy.wind/.95)*.5:1);
    dangerRing.material.opacity=tele?.24+.3*(.5+.5*Math.sin(t*15)):0;
    bladeGlow.material.color.setHex(teleColor);
    bladeGlow.material.opacity=tele?.4+.34*(.5+.5*Math.sin(t*20)):0;
    foe.root.position.z=4.7+(enemy.attack>0?-.35:enemy.stun>0?.12:0);
    foe.body.rotation.z=enemy.hit>0?Math.sin(t*50)*.12:0;
    heroRing.material.opacity=.26+.08*Math.sin(t*2.4);

    for(let i=effects.length-1;i>=0;i--){
      const e=effects[i];e.life-=dt;
      if(!e.arc){e.mesh.position.addScaledVector(e.velocity,dt);e.velocity.y-=3*dt;e.mesh.scale.setScalar(Math.max(.05,e.life));}
      else{e.mesh.scale.setScalar(.7+Math.max(0,e.life)*1.5);e.mesh.children[0].material.opacity=Math.max(0,e.life/.32);}
      if(e.life<=0){e.mesh.parent?.remove(e.mesh);if(!e.arc)e.mesh.geometry.dispose();effects.splice(i,1);}
    }

    const cameraTarget=V(hero.root.position.x+.15,1.5,2.2);
    const cameraPos=V(hero.root.position.x-2.55,4.05,-8.35);
    if(window.innerWidth/window.innerHeight<.72){cameraPos.x=hero.root.position.x-2.2;cameraPos.y=4.2;cameraPos.z=-9.4;cameraTarget.x=hero.root.position.x+.1;cameraTarget.z=2.0;}
    camera.position.lerp(cameraPos,1-Math.exp(-dt*4));camera.lookAt(cameraTarget);
    updateHUD();renderer.render(scene,camera);
  }

  // ── Input: swipe is the only attack/parry; side taps dodge. ──────────────
  function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top,w:r.width,h:r.height};}
  canvas.addEventListener('pointerdown',e=>{swipe={...canvasPoint(e),time:performance.now()};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointerup',e=>{
    if(!swipe)return;
    const p=canvasPoint(e),dx=p.x-swipe.x,dy=p.y-swipe.y,d=Math.hypot(dx,dy);
    if(d>Math.max(24,swipe.h*.045)) doAttack({x:dx,y:-dy});
    else if(p.x<p.w*.28) doDodge(-1);
    else if(p.x>p.w*.72) doDodge(1);
    swipe=null;
  });
  canvas.addEventListener('pointercancel',()=>swipe=null);

  ui.guard.addEventListener('pointerdown',e=>{e.preventDefault();ui.guard.setPointerCapture(e.pointerId);setGuard(true);});
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>ui.guard.addEventListener(ev,()=>setGuard(false)));
  ui.start.addEventListener('click',begin);
  window.addEventListener('keydown',e=>{
    if(e.repeat)return;
    if(e.code==='Space'){e.preventDefault();setGuard(true);}
    if(e.code==='ShiftLeft'||e.code==='ShiftRight')doDodge(0);
    if(e.code==='KeyQ')doDodge(-1);
    if(e.code==='KeyE')doDodge(1);
    if(e.code==='Enter'&&mode!=='play')begin();
    if(['KeyA','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){
      const d={KeyA:{x:-1,y:0},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},ArrowUp:{x:0,y:1},ArrowDown:{x:0,y:-1}}[e.code];
      doAttack(d);
    }
  });
  window.addEventListener('keyup',e=>{if(e.code==='Space')setGuard(false);});

  function frame(){const dt=Math.min(.05,clock.getDelta());update(dt,clock.elapsedTime);requestAnimationFrame(frame);}
  showCard('menu');updateHUD();requestAnimationFrame(frame);
})();
