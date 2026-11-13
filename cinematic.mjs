(async function startTurfMateCinema(){
  if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
  const app=document.querySelector('#app');
  if(!app)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 700px)');
  const photoA=document.createElement('div');photoA.className='tm-photo-plate tm-photo-plate--aerial';photoA.setAttribute('aria-hidden','true');
  const photoB=document.createElement('div');photoB.className='tm-photo-plate tm-photo-plate--action';photoB.setAttribute('aria-hidden','true');
  document.body.prepend(photoA,photoB);
  const startFallback=(error)=>{
    document.body.classList.add('cinema-fallback');
    const old=document.querySelector('#turfmate-world-canvas');if(old)old.remove();
    const canvas=document.createElement('canvas');canvas.id='turfmate-world-canvas';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
    const ctx=canvas.getContext('2d');if(!ctx){console.warn('Canvas fallback unavailable.',error);return;}
    let w=innerWidth,h=innerHeight,dpr=1,p=0,active=false,paused=false,chapter=-1;
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
    const scenes=[[0,'SPORT INTRO · AERIAL VIEW'],[.12,'DESCEND INTO THE BOWL'],[.24,'PITCH-LEVEL ENTRY'],[.4,'THE BALL TAKES FLIGHT'],[.58,'TRACK THE SHOT'],[.74,'GOAL · SLOW MOTION'],[.86,'MATCHDAY COMMUNITY'],[.95,'THE FINAL WHISTLE']];
    const hud=document.createElement('div');hud.className='tm-cinema-hud';hud.hidden=true;hud.innerHTML='<span class="hud-index">01 / 08</span><span class="hud-scene">STADIUM APPROACH</span><span class="hud-track"><span></span></span><button type="button" aria-label="Pause ball motion">Ⅱ</button>';document.body.appendChild(hud);
    const idx=hud.querySelector('.hud-index'),label=hud.querySelector('.hud-scene'),bar=hud.querySelector('.hud-track span'),toggle=hud.querySelector('button');
    toggle.addEventListener('click',()=>{paused=!paused;toggle.textContent=paused?'▶':'Ⅱ';toggle.setAttribute('aria-label',paused?'Resume ball motion':'Pause ball motion');});
    const aerial=new Image(),action=new Image();aerial.src='assets/stadium-aerial.webp';action.src='assets/pitch-action.webp';
    function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,mobile.matches?1.25:1.6);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}
    function update(){
      const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);p=reduce.matches?0:clamp(scrollY/max,0,1);
      let c=0;for(let i=0;i<scenes.length;i++)if(p>=scenes[i][0])c=i;
      if(c!==chapter){chapter=c;idx.textContent=String(c+1).padStart(2,'0')+' / 08';label.textContent=scenes[c][1];}document.body.dataset.turfStage=String(c);
      bar.style.width=(p*100)+'%';
      photoA.style.opacity=String(clamp(1-smooth((p-.12)/.22)+smooth((p-.82)/.18),0,1));
      photoB.style.opacity=String(clamp(smooth((p-.12)/.2)*(1-smooth((p-.78)/.18)),0,1));
      const aerialDive=smooth(p/.24),pitchTravel=smooth((p-.2)/.7);
      photoA.style.transform='scale('+(1+aerialDive*2.45)+') translate3d('+(-aerialDive*4)+'%, '+(aerialDive*3)+'%, 0)';
      photoB.style.transform='scale('+(1+pitchTravel*.95)+') translate3d('+(-pitchTravel*3)+'%, '+(pitchTravel*2)+'%, 0)';
    }
    function routeSync(){active=!!app.querySelector('.cinema-section');document.body.classList.toggle('cinematic-active',active);hud.hidden=!active;photoA.style.display=active?'block':'none';photoB.style.display=active?'block':'none';canvas.style.display=active?'block':'none';if(active)update();}
    addEventListener('scroll',update,{passive:true});addEventListener('resize',()=>{resize();update();},{passive:true});addEventListener('turfmate:page-rendered',routeSync);new MutationObserver(routeSync).observe(app,{childList:true});routeSync();resize();
    function drawBall(x,y,r,angle){
      ctx.save();ctx.shadowColor='rgba(0,0,0,.65)';ctx.shadowBlur=r*.6;ctx.shadowOffsetY=r*.3;
      const g=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.05,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(.7,'#e8eee5');g.addColorStop(1,'#79877c');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.shadowColor='transparent';
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.arc(0,0,r*.92,0,Math.PI*2);ctx.clip();
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.beginPath();for(let k=0;k<5;k++){const t=a+k*Math.PI*2/5,px=Math.cos(t)*r*.29,py=Math.sin(t)*r*.29;k?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fillStyle='#101a13';ctx.fill();}
      ctx.restore();ctx.restore();
    }
    function draw(now){
      requestAnimationFrame(draw);if(!active||document.hidden)return;ctx.clearRect(0,0,w,h);
      const shade=ctx.createLinearGradient(0,0,0,h);shade.addColorStop(0,'rgba(2,10,6,.28)');shade.addColorStop(.5,'rgba(2,10,6,.02)');shade.addColorStop(1,'rgba(2,10,6,.55)');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
      const q=smooth((p-.22)/.62),x=w*(.12+.73*q),y=h*(.66-.31*Math.sin(q*Math.PI*.78)-.035*q),radius=clamp(Math.min(w,h)*(.022+q*.018),16,58);
      if(p>.60){const gx=w*.83,gy=h*.43,gw=w*.13,gh=h*.22,goalAlpha=smooth((p-.60)/.08);ctx.save();ctx.globalAlpha=goalAlpha;ctx.strokeStyle='rgba(232,246,231,.72)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx+gw,gy+gh*.12);ctx.lineTo(gx+gw,gy+gh);ctx.lineTo(gx,gy+gh*.88);ctx.stroke();for(let i=1;i<7;i++){const xx=gx+gw*i/7;ctx.beginPath();ctx.moveTo(xx,gy+gh*i/20);ctx.lineTo(xx,gy+gh*.88+gh*i/20);ctx.stroke();}for(let i=1;i<6;i++){const yy=gy+gh*i/6;ctx.beginPath();ctx.moveTo(gx,yy);ctx.lineTo(gx+gw,yy+gh*.12);ctx.stroke();}ctx.restore();}
      if(p>.22&&p<.91){const slow=q>.86&&q<.99?.28:1;ctx.strokeStyle='rgba(198,255,131,.4)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w*.12,h*.66);ctx.quadraticCurveTo(w*.42,h*.22,x-radius,y);ctx.stroke();drawBall(x,y,radius,paused||reduce.matches?0:q*16*slow+now*.00045);}
    }
    canvas.style.opacity='1';requestAnimationFrame(draw);console.warn('TurfMate is using the photo-and-football fallback because WebGL/Three.js could not initialise.',error);
  };
  let THREE;
  try{THREE=await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');}
  catch(error){startFallback(error);return;}
  const canvas=document.createElement('canvas');
  canvas.id='turfmate-world-canvas';
  canvas.setAttribute('aria-hidden','true');
  document.body.prepend(canvas);
  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!mobile.matches,powerPreference:'high-performance'});
  }catch(error){
    startFallback(error);
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile.matches?1.1:1.5));
  renderer.setSize(innerWidth,innerHeight,false);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.2;
  renderer.shadowMap.enabled=!mobile.matches;

  const scene=new THREE.Scene();
  scene.background=null;
  renderer.setClearColor(0x000000,0);
  scene.fog=new THREE.FogExp2(0x06100a,.0023);
  const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,700);
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

  const netBase=[],netPositions=[],netCols=12,netRows=8,netX=56.05;
  const netPoint=(col,row)=>[netX,row/netRows*2.42,(col/netCols-.5)*7.25];
  for(let row=0;row<=netRows;row++)for(let col=0;col<netCols;col++){netPositions.push(...netPoint(col,row),...netPoint(col+1,row));}
  for(let col=0;col<=netCols;col++)for(let row=0;row<netRows;row++){netPositions.push(...netPoint(col,row),...netPoint(col,row+1));}
  for(let i=0;i<netPositions.length;i+=3)netBase.push([netPositions[i],netPositions[i+1],netPositions[i+2]]);
  const netGeometry=new THREE.BufferGeometry();netGeometry.setAttribute('position',new THREE.Float32BufferAttribute(netPositions,3));netGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
  const goalNet=new THREE.LineSegments(netGeometry,new THREE.LineBasicMaterial({color:0xe4eee4,transparent:true,opacity:.7}));scene.add(goalNet);
  const goalFlash=new THREE.PointLight(0xbaff8c,0,32,2);goalFlash.position.set(54.5,2,0);scene.add(goalFlash);

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
  const ballPath=new THREE.CatmullRomCurve3([[-20,1.25,15],[-14,1.25,11],[-7,1.25,8],[1,1.25,5],[10,1.25,2],[18,1.45,-2],[26,2.4,-5],[34,4.6,-7],[42,7.2,-6],[49,6.2,-3],[53.5,3.4,-1],[57.5,1.9,0]].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.42);
  const entryCam=new THREE.CatmullRomCurve3([[0,158,68],[0,126,58],[-3,91,48],[-12,55,34],[-24.8,3.95,18.2]].map(p=>new THREE.Vector3(...p)));
  const entryLook=new THREE.CatmullRomCurve3([[0,0,0],[0,0,0],[-1,0,0],[-8,1,6],[-13.8,1.55,10.8]].map(p=>new THREE.Vector3(...p)));
  const exitCam=new THREE.CatmullRomCurve3([[39,5,19],[64,18,48],[26,48,106],[0,106,164]].map(p=>new THREE.Vector3(...p)));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
  let progress=0,active=false,paused=false,chapter=-1,last=performance.now();
  const hud=document.createElement('div');hud.className='tm-cinema-hud';hud.hidden=true;
  hud.innerHTML='<span class="hud-index">01 / 07</span><span class="hud-scene">STADIUM APPROACH</span><span class="hud-track"><span></span></span><button type="button" aria-label="Pause ambient motion" title="Pause ambient motion">Ⅱ</button>';
  document.body.appendChild(hud);
  const idx=hud.querySelector('.hud-index'),label=hud.querySelector('.hud-scene'),bar=hud.querySelector('.hud-track span'),toggle=hud.querySelector('button');
  toggle.addEventListener('click',()=>{paused=!paused;toggle.textContent=paused?'▶':'Ⅱ';toggle.setAttribute('aria-label',paused?'Resume ambient motion':'Pause ambient motion');});
  const chapters=[[0,'SPORT INTRO · AERIAL VIEW'],[.12,'DESCEND INTO THE BOWL'],[.24,'PITCH-LEVEL ENTRY'],[.4,'THE BALL TAKES FLIGHT'],[.58,'TRACK THE SHOT'],[.74,'GOAL · SLOW MOTION'],[.86,'MATCHDAY COMMUNITY'],[.95,'THE FINAL WHISTLE']];
  function updatePhotoPlates(){
    photoA.style.opacity=String(1-smooth((progress-.04)/.22));
    photoB.style.opacity=String(clamp(smooth((progress-.1)/.2)*(1-smooth((progress-.32)/.16)),0,1));
    const aerialDive=smooth(progress/.24),pitchTravel=smooth((progress-.2)/.7);
    photoA.style.transform='scale('+(1+aerialDive*2.45)+') translate3d('+(-aerialDive*4)+'%, '+(aerialDive*3)+'%, 0)';
    photoB.style.transform='scale('+(1+pitchTravel*.95)+') translate3d('+(-pitchTravel*3)+'%, '+(pitchTravel*2)+'%, 0)';
  }
  function readScroll(){
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);progress=reduce.matches?0:clamp(scrollY/max,0,1);bar.style.width=(progress*100)+'%';
    let c=0;for(let i=0;i<chapters.length;i++)if(progress>=chapters[i][0])c=i;
    if(c!==chapter){chapter=c;idx.textContent=String(c+1).padStart(2,'0')+' / 07';label.textContent=chapters[c][1];}
    updatePhotoPlates();
  }
  function routeSync(){
    active=!!app.querySelector('.cinema-section');
    document.body.classList.toggle('cinematic-active',active);hud.hidden=!active;
    photoA.style.display=active?'block':'none';photoB.style.display=active?'block':'none';
    const liveCanvas=document.querySelector('#turfmate-world-canvas');if(liveCanvas)liveCanvas.style.display=active?'block':'none';
    if(active)readScroll();
  }
  addEventListener('scroll',readScroll,{passive:true});
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile.matches?1.1:1.5));renderer.setSize(innerWidth,innerHeight,false);readScroll();},{passive:true});
  addEventListener('turfmate:page-rendered',routeSync);new MutationObserver(routeSync).observe(app,{childList:true});routeSync();
  function animate(now){
    requestAnimationFrame(animate);if(!active||document.hidden)return;
    const dt=Math.min(.05,(now-last)/1000);last=now;const p=progress,q=smooth((p-.22)/.62);
    const bp=ballPath.getPointAt(q),tan=ballPath.getTangentAt(q).normalize();ball.position.copy(bp);if(q<.55)ball.position.y+=Math.abs(Math.sin(q*22*Math.PI))*.2;ball.visible=p>.205&&p<.91;
    const goalSlow=smooth((q-.82)/.08)*(1-smooth((q-.985)/.015));
    if(!paused&&!reduce.matches){ball.rotation.x+=dt*(2.5-goalSlow*2.0);ball.rotation.z+=dt*(3.2-goalSlow*2.55);}
    const impact=smooth((q-.91)/.035)*(1-smooth((q-.995)/.02));
    if(netGeometry){const attr=netGeometry.attributes.position;for(let i=0;i<netBase.length;i++){const v=netBase[i],dx=(v[1]-1.22)/.92,dz=v[2]/2.6,falloff=Math.exp(-(dx*dx+dz*dz)*1.1);attr.array[i*3]=v[0]+impact*1.55*falloff;attr.array[i*3+1]=v[1];attr.array[i*3+2]=v[2];}attr.needsUpdate=true;netGeometry.computeBoundingSphere();}
    if(goalFlash)goalFlash.intensity=impact*5.5;
    let pos,target;
    if(reduce.matches){pos=new THREE.Vector3(0,48,108);target=new THREE.Vector3(0,0,0);}
    else if(p<.22){const t=smooth(p/.22);pos=entryCam.getPointAt(t);target=entryLook.getPointAt(t);}
    else if(p<.87){const close=smooth((q-.76)/.19),distance=5.8-close*1.7,height=2.7+close*.5,lookAhead=7.5+close*2.8;pos=bp.clone().addScaledVector(tan,-distance).add(new THREE.Vector3(0,height,0));target=bp.clone().addScaledVector(tan,lookAhead).add(new THREE.Vector3(0,.3,0));}
    else{const t=smooth((p-.87)/.13);pos=exitCam.getPointAt(t);target=new THREE.Vector3(0,0,0);}
    const targetFov=reduce.matches?52:(p<.22?58-12*smooth(p/.22):p<.87?46-3*smooth((q-.72)/.28):43+9*smooth((p-.87)/.13));
    camera.fov+=(targetFov-camera.fov)*.055;camera.updateProjectionMatrix();
    camera.position.lerp(pos,reduce.matches ? .08 : .075);look.lerp(target,reduce.matches ? .08 : .085);camera.lookAt(look);camera.rotation.z=reduce.matches?0:Math.sin(q*Math.PI*2)*.009;canvas.style.opacity=String(reduce.matches?1:smooth((p-.015)/.12));renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
  if(reduce.addEventListener)reduce.addEventListener('change',readScroll);
})();