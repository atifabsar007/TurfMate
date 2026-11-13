import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

(async function startTurfMateCinema(){
  const app=document.querySelector('#app');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 700px)');
  const canvas=document.createElement('canvas');
  canvas.id='turfmate-world-canvas';
  canvas.setAttribute('aria-hidden','true');
  document.body.prepend(canvas);
  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:!mobile.matches,powerPreference:'high-performance'});
  }catch(error){
    canvas.remove();
    document.body.classList.add('cinema-fallback');
    console.warn('TurfMate 3D unavailable; using the visual fallback.',error);
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile.matches?1.1:1.5));
  renderer.setSize(innerWidth,innerHeight,false);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.2;
  renderer.shadowMap.enabled=!mobile.matches;

  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x030906);
  scene.fog=new THREE.FogExp2(0x06100a,.0023);
  const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,700);
  camera.position.set(0,112,160);
  const look=new THREE.Vector3();
  scene.add(new THREE.HemisphereLight(0xb8d8c0,0x07140c,1.6),new THREE.AmbientLight(0xc4e4cc,.38));
  const sun=new THREE.DirectionalLight(0xd8f0dd,1.8);
  sun.position.set(-55,90,35);sun.castShadow=!mobile.matches;sun.shadow.mapSize.set(1024,1024);
  sun.shadow.camera.left=-100;sun.shadow.camera.right=100;sun.shadow.camera.top=100;sun.shadow.camera.bottom=-100;scene.add(sun);

  const mat=(c,r=.85,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
  function box(w,h,d,material,x,y,z,shadow=false){
    const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    o.position.set(x,y,z);o.castShadow=shadow&&!mobile.matches;o.receiveShadow=true;scene.add(o);return o;
  }
  const lineMat=new THREE.LineBasicMaterial({color:0xeaf3e9,transparent:true,opacity:.9});
  function line(points,loop=false){
    const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
    scene.add(loop?new THREE.LineLoop(g,lineMat):new THREE.Line(g,lineMat));
  }
  function rect(x1,z1,x2,z2,y=.32){line([[x1,y,z1],[x2,y,z1],[x2,y,z2],[x1,y,z2]],true);}
  function circle(rad,cx=0,cz=0){
    const p=[];for(let i=0;i<96;i++){const a=i/96*Math.PI*2;p.push([cx+Math.cos(a)*rad,.33,cz+Math.sin(a)*rad]);}line(p,true);
  }

  const ground=new THREE.Mesh(new THREE.PlaneGeometry(520,520),mat(0x07110b,1));
  ground.rotation.x=-Math.PI/2;ground.position.y=-1;scene.add(ground);
  const turf=mat(0x176b37,.97),alt=mat(0x0d4927,.97);
  const field=new THREE.Mesh(new THREE.PlaneGeometry(105,68),turf);
  field.rotation.x=-Math.PI/2;field.position.y=.08;field.receiveShadow=true;scene.add(field);
  for(let i=0;i<10;i++){
    const s=new THREE.Mesh(new THREE.PlaneGeometry(10.5,68),i%2?alt:turf);
    s.rotation.x=-Math.PI/2;s.position.set(-47.25+i*10.5,.13,0);scene.add(s);
  }
  rect(-52.5,-34,52.5,34);line([[0,.33,-34],[0,.33,34]]);circle(9.15);
  rect(-52.5,-20.16,-36,20.16);rect(36,-20.16,52.5,20.16);
  rect(-52.5,-9.16,-47,9.16);rect(47,-9.16,52.5,9.16);

  const stand=mat(0x14231d,.92),concrete=mat(0x1a2921,.92),roof=mat(0x1b2922,.72,.45);
  for(let r=0;r<19;r++){
    const y=3+r*.72,z=36.6+r*1.16,x=54.8+r*1.16,m=r%3?stand:concrete;
    box(116+r*.9,.82,1.2,m,0,y,z,true);box(116+r*.9,.82,1.2,m,0,y,-z,true);
    box(1.2,.82,76+r*.9,m,x,y,0,true);box(1.2,.82,76+r*.9,m,-x,y,0,true);
  }
  let seed=417;
  const rand=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
  const crowdColors=[0x8eb79b,0xd7d8bd,0x527f68,0x9c6d4c,0x294d3b,0xb6c4b4,0x697eaf,0xb1a16d];
  const seats=new THREE.InstancedMesh(new THREE.BoxGeometry(.34,.34,.3),new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.7}),6600);
  const dummy=new THREE.Object3D();let si=0;
  function addSeat(x,y,z){
    if(si>=6600)return;dummy.position.set(x,y,z);dummy.rotation.y=rand()*.12-.06;dummy.updateMatrix();
    seats.setMatrixAt(si,dummy.matrix);seats.setColorAt(si,new THREE.Color(crowdColors[Math.floor(rand()*crowdColors.length)]));si++;
  }
  for(let r=0;r<19;r++){
    const y=3.9+r*.72,z=37.4+r*1.16,x=55.6+r*1.16;
    for(let n=0;n<95;n++){const px=-53+n*1.12+rand()*.2;addSeat(px,y,z);addSeat(px,y,-z);}
    for(let n=0;n<42;n++){const pz=-34+n*1.65;addSeat(x,y,pz);addSeat(-x,y,pz);}
  }
  seats.count=si;seats.instanceMatrix.needsUpdate=true;if(seats.instanceColor)seats.instanceColor.needsUpdate=true;scene.add(seats);

  box(124,1.3,10,roof,0,20.4,58.5,true);box(124,1.3,10,roof,0,20.4,-58.5,true);
  box(10,1.3,86,roof,65.5,20.4,0,true);box(10,1.3,86,roof,-65.5,20.4,0,true);
  for(let i=-2;i<=2;i++){
    box(.55,13,.55,roof,i*27,12.5,54,true);box(.55,13,.55,roof,i*27,12.5,-54,true);
    box(.55,13,.55,roof,62,12.5,i*17,true);box(.55,13,.55,roof,-62,12.5,i*17,true);
  }
  const led=new THREE.MeshStandardMaterial({color:0x8cff70,emissive:0x5dff6b,emissiveIntensity:2.1});
  box(111,.35,.28,led,0,18.3,52.2);box(111,.35,.28,led,0,18.3,-52.2);
  box(.28,.35,70,led,59.4,18.3,0);box(.28,.35,70,led,-59.4,18.3,0);

  function goal(x,dir){
    const pm=mat(0xf2f4e9,.3,.3),z1=-3.66,z2=3.66,b=x+dir*3.4;
    box(.22,2.44,.22,pm,x,1.22,z1,true);box(.22,2.44,.22,pm,x,1.22,z2,true);box(.22,.22,7.32,pm,x,2.44,0,true);
    line([[x,.15,z1],[b,.15,z1],[b,.15,z2],[x,.15,z2]]);
    line([[b,.15,z1],[b,2.44,z1],[b,2.44,z2],[b,.15,z2]]);
    for(let i=0;i<=7;i++){const z=z1+(z2-z1)*i/7;line([[x,.2,z],[b,.2,z]]);}
  }
  goal(-52.5,1);goal(52.5,-1);

  for(const sx of [-1,1])for(const sz of [-1,1]){
    const x=sx*72,z=sz*63,pole=new THREE.Mesh(new THREE.CylinderGeometry(.32,.62,34,8),mat(0x263a30,.6,.5));
    pole.position.set(x,19,z);scene.add(pole);
    box(7,2.4,1.2,new THREE.MeshStandardMaterial({color:0xd8f5db,emissive:0xc6ffcf,emissiveIntensity:2.5}),x,36.5,z);
    const light=new THREE.SpotLight(0xe5ffe8,820,190,Math.PI/4.2,.72,1.5);
    light.position.set(x,36,z);light.target.position.set(0,0,0);scene.add(light,light.target);
  }
  const cityMats=[0x101e17,0x14231c,0x0c1912,0x1b2a20].map(c=>mat(c,.98));
  for(let i=0;i<46;i++){
    const a=rand()*Math.PI*2,r=112+rand()*88,w=7+rand()*14,h=8+rand()*34,d=7+rand()*14;
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),cityMats[i%4]);b.position.set(Math.cos(a)*r,h/2-1,Math.sin(a)*r);scene.add(b);
  }

  function makeBallTexture(){
    const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');
    x.fillStyle='#f3f1e7';x.fillRect(0,0,1024,512);x.strokeStyle='#bfc5b8';x.lineWidth=5;
    for(let y=0;y<5;y++)for(let n=0;n<9;n++){
      const cx=n*118+(y%2)*58+30,cy=y*112+30;x.beginPath();
      for(let k=0;k<5;k++){const a=-Math.PI/2+k*Math.PI*2/5,px=cx+39*Math.cos(a),py=cy+39*Math.sin(a);k?x.lineTo(px,py):x.moveTo(px,py);}
      x.closePath();x.fillStyle='#161d18';x.fill();x.stroke();
    }
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  const ball=new THREE.Mesh(new THREE.SphereGeometry(1.08,48,32),new THREE.MeshPhysicalMaterial({map:makeBallTexture(),roughness:.43,clearcoat:.32}));
  ball.castShadow=true;scene.add(ball);
  const ballPath=new THREE.CatmullRomCurve3([[-46,1.25,25],[-34,1.25,12],[-16,1.25,1],[8,1.25,-13],[32,1.25,-20],[46,1.25,-4],[30,1.25,13],[5,1.25,24],[-23,1.25,15],[-43,1.25,-5],[-17,1.25,-24],[17,1.25,-17],[45,1.25,25]].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.45);
  const entryCam=new THREE.CatmullRomCurve3([[0,112,160],[64,78,126],[56,42,82],[-16,19,54],[-55,5.5,34]].map(p=>new THREE.Vector3(...p)));
  const entryLook=new THREE.CatmullRomCurve3([[0,0,0],[0,0,0],[-5,0,0],[-26,0,12],[-36,0,20]].map(p=>new THREE.Vector3(...p)));
  const exitCam=new THREE.CatmullRomCurve3([[39,5,19],[64,18,48],[26,48,106],[0,106,164]].map(p=>new THREE.Vector3(...p)));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
  let progress=0,active=false,paused=false,chapter=-1,last=performance.now();
  const hud=document.createElement('div');hud.className='tm-cinema-hud';hud.hidden=true;
  hud.innerHTML='<span class="hud-index">01 / 07</span><span class="hud-scene">STADIUM APPROACH</span><span class="hud-track"><span></span></span><button type="button" aria-label="Pause ambient motion" title="Pause ambient motion">Ⅱ</button>';
  document.body.appendChild(hud);
  const idx=hud.querySelector('.hud-index'),label=hud.querySelector('.hud-scene'),bar=hud.querySelector('.hud-track span'),toggle=hud.querySelector('button');
  toggle.addEventListener('click',()=>{paused=!paused;toggle.textContent=paused?'▶':'Ⅱ';toggle.setAttribute('aria-label',paused?'Resume ambient motion':'Pause ambient motion');});
  const chapters=[[0,'STADIUM APPROACH'],[.13,'ENTER THE BOWL'],[.25,'DROP TO THE TOUCHLINE'],[.4,'FOLLOW THE FOOTBALL'],[.6,'TRAVEL THE PITCH'],[.78,'MATCHDAY COMMUNITY'],[.91,'THE FINAL WHISTLE']];
  function readScroll(){
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);progress=reduce.matches?0:clamp(scrollY/max,0,1);bar.style.width=(progress*100)+'%';
    let c=0;for(let i=0;i<chapters.length;i++)if(progress>=chapters[i][0])c=i;
    if(c!==chapter){chapter=c;idx.textContent=String(c+1).padStart(2,'0')+' / 07';label.textContent=chapters[c][1];}
  }
  function routeSync(){active=!!app?.querySelector('.cinema-section');document.body.classList.toggle('cinematic-active',active);hud.hidden=!active;canvas.style.display=active?'block':'none';if(active)readScroll();}
  addEventListener('scroll',readScroll,{passive:true});
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile.matches?1.1:1.5));renderer.setSize(innerWidth,innerHeight,false);readScroll();},{passive:true});
  addEventListener('turfmate:page-rendered',routeSync);new MutationObserver(routeSync).observe(app,{childList:true});routeSync();
  function animate(now){
    requestAnimationFrame(animate);if(!active||document.hidden)return;
    const dt=Math.min(.05,(now-last)/1000);last=now;const p=progress,q=smooth((p-.23)/.64);
    const bp=ballPath.getPointAt(q),tan=ballPath.getTangentAt(q).normalize();ball.position.copy(bp);ball.visible=p>.12&&p<.96;
    if(!paused&&!reduce.matches){ball.rotation.x+=dt*2.5;ball.rotation.z+=dt*3.2;}
    let pos,target;
    if(reduce.matches){pos=new THREE.Vector3(0,48,108);target=new THREE.Vector3(0,0,0);}
    else if(p<.23){const t=smooth(p/.23);pos=entryCam.getPointAt(t);target=entryLook.getPointAt(t);}
    else if(p<.87){pos=bp.clone().addScaledVector(tan,-9).add(new THREE.Vector3(0,3.9,0));target=bp.clone().addScaledVector(tan,7).add(new THREE.Vector3(0,.25,0));}
    else{const t=smooth((p-.87)/.13);pos=exitCam.getPointAt(t);target=new THREE.Vector3(0,0,0);}
    camera.position.lerp(pos,reduce.matches?.08:.065);look.lerp(target,reduce.matches?.08:.075);camera.lookAt(look);renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
  if(reduce.addEventListener)reduce.addEventListener('change',readScroll);
})();