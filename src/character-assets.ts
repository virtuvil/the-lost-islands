import * as T from 'three';
import { box, mesh, ellipsoid, mat } from './assets';

// Original articulated fan-art meshes. Front is +Z; pivots are anatomical joints.
const skin = 0xdca67b, ink = 0x263633, green = 0x225d45, hair = 0x448d49;
function stroke(p:T.Object3D, points:number[][], color:number, radius=.012) {
    return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v as [number,number,number]))),12,radius,6,false),color,p);
}
function limb(p:T.Object3D,a:number[],b:number[],r:number,c:number,r2=r) {
    const from=new T.Vector3(...a as [number,number,number]),to=new T.Vector3(...b as [number,number,number]);
    const m=mesh(new T.CylinderGeometry(r2,r,from.distanceTo(to),12),c,p);
    m.position.copy(from.clone().add(to).multiplyScalar(.5));
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),to.sub(from).normalize()); return m;
}
function taperedTuft(p:T.Object3D, points:number[][],radius:number,c:number) {
    const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v as [number,number,number])));
    const g=new T.TubeGeometry(curve,6,radius,5,false), pos=g.getAttribute('position');
    for(let i=0;i<pos.count;i++){const t=Math.floor(i/6)/6,center=curve.getPointAt(Math.min(1,t)); const v=new T.Vector3().fromBufferAttribute(pos,i).sub(center).multiplyScalar(Math.max(.015,1-t)).add(center);pos.setXYZ(i,v.x,v.y,v.z);}
    g.computeVertexNormals(); return mesh(g,c,p);
}
function rig(name:string) {
    const root=new T.Group(),body=new T.Group(),head=new T.Group(),leftLeg=new T.Group(),rightLeg=new T.Group(),leftArm=new T.Group(),rightArm=new T.Group();
    root.name=name; root.add(body); body.add(head,leftLeg,rightLeg,leftArm,rightArm);
    head.position.y=1.64; leftLeg.position.set(-.16,.77,0);rightLeg.position.set(.16,.77,0);
    leftArm.position.set(-.36,1.32,0);rightArm.position.set(.36,1.32,0);
    return {root,body,head,leftLeg,rightLeg,leftArm,rightArm};
}
function face(p:T.Group,zoro:boolean) {
    // Shaped jaw, brow and nose rather than a sphere with painted dots.
    const g=new T.SphereGeometry(1,28,20),a=g.getAttribute('position');
    for(let i=0;i<a.count;i++){const y=a.getY(i),s=y<-.2?.81+.18*(y+1):1;a.setXYZ(i,a.getX(i)*.275*s,y*.31,a.getZ(i)*.235);}
    g.computeVertexNormals();mesh(g,skin,p);
    ellipsoid(p,0,-.035,.222,.045,.065,.06,0xd29a72);
    for(const side of [-1,1]) ellipsoid(p,side*.272,-.01,0,.045,.08,.045,skin);
    if(zoro){
        ellipsoid(p,-.105,.025,.219,.053,.019,.015,0xefe7d7);
        ellipsoid(p,-.105,.024,.233,.017,.019,.01,ink);
        stroke(p,[[-.17,.094,.211],[-.11,.101,.231],[-.05,.086,.238]],ink,.013);
        stroke(p,[[.054,.019,.234],[.10,.006,.243],[.16,.023,.223]],ink,.013);
        stroke(p,[[.12,.16,.216],[.103,.075,.245],[.10,-.015,.245],[.09,-.12,.224]],0x945d4e,.009);
        stroke(p,[[-.074,-.15,.207],[.015,-.158,.224],[.083,-.144,.208]],ink,.009);
        for(let i=0;i<3;i++){const e=mesh(new T.TorusGeometry(.034,.009,6,12),0xdab45d,p,[.292,-.05-i*.048,.025]);e.rotation.y=.6;}
    }else{
        for(const x of [-.105,.105]){ellipsoid(p,x,.015,.22,.032,.048,.015,ink);stroke(p,[[x-.045,.10,.211],[x,.12,.222],[x+.04,.105,.211]],ink,.01);}
        const smile=new T.Shape();smile.moveTo(-.13,-.09);smile.quadraticCurveTo(0,-.26,.13,-.09);smile.quadraticCurveTo(0,-.13,-.13,-.09);
        mesh(new T.ShapeGeometry(smile),0xffefcf,p,[0,0,.226]);
        stroke(p,[[-.16,-.067,.20],[-.08,-.08,.232]],0x8e594b,.008);
        for(const x of [-.145,-.1])stroke(p,[[x,-.046,.225],[x,-.09,.225]],0x8e594b,.007);
    }
}
export function zoro() {
    const r=rig('Zoro'),{body,head,leftLeg,rightLeg,leftArm,rightArm}=r;
    for(const leg of [leftLeg,rightLeg]){
        limb(leg,[0,0,0],[0,-.42,.015],.115,0x244c3b,.14);
        mesh(new T.CylinderGeometry(.12,.105,.29,14),0x283b34,leg,[0,-.53,.015]);
        ellipsoid(leg,0,-.69,.07,.135,.085,.215,0x202e2b);
        box(leg,.25,.045,.36,0x172522,0,-.75,.065,.018);
        for(let i=0;i<2;i++)mesh(new T.TorusGeometry(.116,.014,5,16),0x4f6250,leg,[0,-.42-i*.11,.015]).rotation.x=Math.PI/2;
    }
    const torso=new T.LatheGeometry([new T.Vector2(.23,.83),new T.Vector2(.26,1.08),new T.Vector2(.31,1.3),new T.Vector2(.26,1.4),new T.Vector2(.13,1.45)],24);
    mesh(torso,green,body);
    // Open lapels expose a narrow chest, with purposeful garment folds and sash.
    const chest=new T.Shape();chest.moveTo(-.18,1.41);chest.lineTo(.18,1.41);chest.lineTo(.06,.99);chest.lineTo(-.045,.99);chest.closePath();
    mesh(new T.ShapeGeometry(chest),skin,body,[0,0,.315]);
    stroke(body,[[-.2,1.42,.25],[-.11,1.19,.33],[-.06,1.02,.32]],0x477a54,.027);
    stroke(body,[[.2,1.42,.25],[.14,1.2,.33],[.08,1.02,.32]],0x477a54,.027);
    const skirt=new T.LatheGeometry([new T.Vector2(.24,.91),new T.Vector2(.32,.71),new T.Vector2(.34,.53)],24,0,Math.PI*1.78);skirt.rotateY(.34);mesh(skirt,green,body);
    for(let i=0;i<5;i++)mesh(new T.TorusGeometry(.255+i*.001,.027,7,24),i%2?0x48704b:0x5b8051,body,[0,.82+i*.04,0]).rotation.x=Math.PI/2;
    const sashTail=box(body,.16,.3,.07,0x486f46,-.23,.67,.14,.025);sashTail.rotation.z=-.16;
    for(const [arm,side] of [[leftArm,-1],[rightArm,1]] as const){
        ellipsoid(arm,side*.025,-.06,0,.13,.15,.13,green);
        limb(arm,[side*.025,-.08,0],[side*.06,-.35,.015],.098,skin,.116);
        limb(arm,[side*.06,-.35,.015],[side*.065,-.57,.065],.08,skin,.10);
        ellipsoid(arm,side*.06,-.59,.07,.085,.11,.075,skin);
        stroke(arm,[[side*.11,-.32,.04],[side*.13,-.4,.07]],0xb88262,.006);
    }
    face(head,true);
    mesh(new T.SphereGeometry(.279,24,12,0,Math.PI*2,0,Math.PI*.51),hair,head,[0,.075,0]);
    for(let i=0;i<29;i++){
        const a=i*2.399,radius=.06+.16*Math.sqrt((i%9)/9),x=Math.cos(a)*radius,z=Math.sin(a)*radius;
        taperedTuft(head,[[x,.22,z],[x*1.22,.34+(i%3)*.016,z*1.25],[x*1.45+.025,.39+(i%4)*.018,z*1.5-.02]],.075,i%3?hair:0x61a14c);
    }
    for(const side of [-1,1])for(let i=0;i<4;i++)taperedTuft(head,[[side*.22,.13,-.12+i*.07],[side*.29,.16,-.14+i*.07],[side*.30,.21,-.17+i*.07]],.047,0x377b43);
    // Exactly three independently modeled sheaths: Wado / Sandai / Enma color cues.
    const swordBelt=new T.Group();swordBelt.name='three-sheathed-swords';swordBelt.position.set(.46,1.0,-.09);body.add(swordBelt);
    const sheathColors=[0xe5dfc6,0x402931,0x583f67],wraps=[0xf3ead2,0x943c38,0x342a46];
    for(let i=0;i<3;i++){
        const s=new T.Group();s.name=`sheathed-sword-${i+1}`;s.position.set(i*.075,(i-1)*.12,(i-1)*.10);s.rotation.x=.95+i*.15;s.rotation.z=-.10-i*.035;swordBelt.add(s);
        limb(s,[0,-.86,0],[0,-.04,0],.037,sheathColors[i],.043);
        ellipsoid(s,0,-.87,0,.039,.07,.04,sheathColors[i]);
        for(const y of [-.8,-.1])mesh(new T.TorusGeometry(.04,.009,5,12),0xc8a451,s,[0,y,0]).rotation.x=Math.PI/2;
        const guard=mesh(new T.CylinderGeometry(.1,.1,.028, i===2?8:16),0xd2b06a,s,[0,.015,0]);guard.scale.z=.65;
        limb(s,[0,.04,0],[0,.29,0],.035,wraps[i]);
        for(let k=0;k<5;k++){const wrap=box(s,.055,.027,.054,i===0?0xb6b7a7:0xcdba89,0,.07+k*.044,0,.006);wrap.rotation.y=k%2?.6:-.6;}
        box(s,.065,.03,.06,0xd2b06a,0,.31,0,.009);
    }
    r.root.scale.setScalar(1.06);
    return {...r,sashTail,swordBelt};
}
export function luffy() {
    const r=rig('Luffy'),{body,head,leftLeg,rightLeg,leftArm,rightArm}=r;
    for(const leg of [leftLeg,rightLeg]){
        mesh(new T.CylinderGeometry(.14,.15,.34,14),0x397593,leg,[0,-.13,0]);
        mesh(new T.CylinderGeometry(.15,.15,.07,14),0xa8bac0,leg,[0,-.29,0]);
        limb(leg,[0,-.34,0],[0,-.66,0],.085,skin,.1);
        ellipsoid(leg,0,-.7,.07,.11,.07,.19,skin);
        box(leg,.24,.055,.36,0x7c593b,0,-.755,.06,.035);
        stroke(leg,[[-.08,-.67,.08],[0,-.64,.1],[.08,-.68,.08]],0x6f4935,.027);
    }
    mesh(new T.LatheGeometry([new T.Vector2(.20,.85),new T.Vector2(.23,1.18),new T.Vector2(.26,1.36),new T.Vector2(.13,1.43)],20),skin,body);
    mesh(new T.LatheGeometry([new T.Vector2(.22,.85),new T.Vector2(.25,1.18),new T.Vector2(.28,1.36),new T.Vector2(.14,1.43)],20,Math.PI/2,Math.PI),0xaf3c35,body);
    for(const side of [-1,1]){
        const shape=new T.Shape();shape.moveTo(side*.12,1.42);shape.lineTo(side*.29,1.33);shape.lineTo(side*.23,.88);shape.quadraticCurveTo(side*.15,.8,side*.06,.88);shape.lineTo(side*.07,1.24);shape.closePath();
        const vest=mesh(new T.ExtrudeGeometry(shape,{depth:.11,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2}),0xaf3c35,body,[0,0,.15]);
        for(let i=0;i<3;i++)ellipsoid(body,side*.1,1.21-i*.11,.278,.014,.014,.012,0xdab667);
    }
    for(const [arm,side] of [[leftArm,-1],[rightArm,1]] as const){
        ellipsoid(arm,side*.015,-.06,0,.11,.14,.11,skin);
        limb(arm,[side*.02,-.08,0],[side*.055,-.33,.01],.085,skin,.1);
        limb(arm,[side*.055,-.33,.01],[side*.07,-.56,.05],.075,skin,.085);
        ellipsoid(arm,side*.07,-.58,.05,.08,.10,.07,skin);
    }
    face(head,false);
    mesh(new T.SphereGeometry(.282,24,12,0,Math.PI*2,0,Math.PI*.49),0x222d2b,head,[0,.08,0]);
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2,front=Math.sin(a)>.2; taperedTuft(head,[[Math.cos(a)*.22,.18,Math.sin(a)*.19],[Math.cos(a)*.29,front?.13:.06,Math.sin(a)*.24],[Math.cos(a)*.27,front?.08:-.07,Math.sin(a)*.24]],.065,0x222d2b);}
    const hat=new T.Group();hat.name='straw-hat';hat.position.set(0,.24,-.015);hat.rotation.x=-.1;head.add(hat);
    const crown=mesh(new T.LatheGeometry([new T.Vector2(0,.16),new T.Vector2(.18,.16),new T.Vector2(.25,.09),new T.Vector2(.27,-.07),new T.Vector2(.45,-.075),new T.Vector2(.47,-.11),new T.Vector2(.32,-.13),new T.Vector2(0,-.13)],32),0xd7b56d,hat);
    crown.material=(crown.material as T.MeshStandardMaterial).clone();(crown.material as T.MeshStandardMaterial).side=T.DoubleSide;
    for(let i=0;i<5;i++)mesh(new T.TorusGeometry(.29+i*.039,.007,4,32),0xb59152,hat,[0,-.107-i*.001,0]).rotation.x=Math.PI/2;
    mesh(new T.CylinderGeometry(.261,.272,.065,28),0xa94337,hat,[0,-.017,0]);
    r.root.scale.setScalar(1.04);return r;
}
