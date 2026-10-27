import * as T from 'three';
import {box,mesh,ellipsoid,batchStatic,arch,flower,mat} from './assets';
import {heightAt} from './navigation';
function curve(p:T.Object3D,v:number[][],r:number,c:number){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(v.map(q=>new T.Vector3(...q as [number,number,number]))),16,r,6,false),c,p);}
function at(root:T.Group,x:number,z:number){const g=new T.Group();g.position.set(x,heightAt(x,z),z);root.add(g);return g;}
function masonry(p:T.Group,w:number,d:number,h:number,color:number){
    box(p,w,.22,d,color,0,.1,0,.08);
    for(let row=0;row<Math.ceil(h/.38);row++)for(const side of [-1,1])for(let col=0;col<5;col++)box(p,w/5-.025,.32,.15,row%2?0xb0ad95:color,-w*.4+col*w/5+(row%2?.05:0),.38+row*.37,side*d/2,.025);
}
function timber(p:T.Group,w:number,d:number,h:number){
    box(p,w,h,d,0xbfa581,0,h/2,0,.08);box(p,w+.15,.23,d+.12,0x8e8d77,0,.12,0,.04);
    for(const x of [-w/2+.05,w/2-.05])for(const z of [-d/2-.03,d/2+.03])box(p,.13,h,.12,0x665745,x,h/2,z,.02);
    for(const y of [.3,h-.14])box(p,w+.03,.11,d+.08,0x755c43,0,y,0,.02);
    for(let i=0;i<8;i++)box(p,.012,h-.4,.018,0xa58b67,-w*.43+i*w/8,h/2,d/2+.005,.004);
}
function roof(p:T.Group,w:number,d:number,h:number){
    const shape=new T.Shape();shape.moveTo(-w/2,0);shape.quadraticCurveTo(0,h,w/2,0);shape.lineTo(w/2,-.13);shape.quadraticCurveTo(0,h-.2,-w/2,-.13);shape.closePath();
    mesh(new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,curveSegments:16}),0x9e6650,p,[0,0,-d/2]);
    for(let i=0;i<10;i++){const x=(i/9-.5)*w,y=h*.5*(1-(x/(w/2))**2);box(p,.03,.035,d,0xc28b62,x,y+.025,0,.012);}
}
function cypress(root:T.Group,x:number,z:number,s=1){const p=at(root,x,z);mesh(new T.CylinderGeometry(.09,.16,1.7,9),0x6f6650,p,[0,.8,0]);for(let i=0;i<5;i++)ellipsoid(p,Math.sin(i)*.06,1.3+i*.32,0,.48-i*.055,.71-i*.05,.44-i*.05,i%2?0x456e60:0x5c8270);p.scale.setScalar(s);}
export function islandKit(index:number){
    const root=new T.Group();root.name=['coast','message-conservatory','parcel-workshops','observatory'][index];
    if(index===1){
        const pavilion=at(root,3.3,-2.2);masonry(pavilion,3.45,2.85,.4,0xc9bea0);
        for(const x of [-1.5,1.5])for(const z of [-1.2,1.2])box(pavilion,.18,2.5,.18,0xb9b99a,x,1.4,z,.025);
        const canopy=new T.Shape();canopy.moveTo(-1.7,0);canopy.quadraticCurveTo(0,1.35,1.7,0);canopy.lineTo(1.7,-.10);canopy.quadraticCurveTo(0,1.2,-1.7,-.1);canopy.closePath();
        mesh(new T.ExtrudeGeometry(canopy,{depth:2.9,bevelEnabled:false,curveSegments:20}),0x6d9587,pavilion,[0,2.65,-1.45]);
        for(let i=0;i<7;i++){const z=-1.4+i*.46;curve(pavilion,[[-1.72,2.65,z],[0,3.29,z],[1.72,2.65,z]],.035,0xe2c99b);}
        box(pavilion,1.9,1.2,.16,0x315858,0,1.2,-1.15,.06);for(let i=0;i<4;i++)box(pavilion,.8,.055,.02,0xa2c5ab,-.13,1.48-i*.19,-1.05,.012);
        for(const x of [-1.9,1.9]){mesh(new T.CylinderGeometry(.3,.23,.45,12),0xac7058,pavilion,[x,.23,.6]);for(let j=0;j<4;j++)ellipsoid(pavilion,x+Math.sin(j*2)*.15,.65+j*.10,.6,.23,.20,.2,0x5a8261);}
        const pergola=at(root,-4.5,-2.6);masonry(pergola,2.8,2.45,.25,0xb7b79b);
        for(const x of [-1.15,1.15])for(const z of [-1,1])box(pergola,.16,2.3,.16,0x7b7155,x,1.2,z,.025);
        for(let i=0;i<9;i++)box(pergola,2.95,.14,.14,0x6c7958,0,2.4,-1.2+i*.3,.025);
        for(const x of [-1.1,1.1]){curve(pergola,[[x,.2,1],[x+.1,1.1,1],[x-.1,2.2,1],[0,2.5,.8]],.025,0x41694b);for(let k=0;k<6;k++)ellipsoid(pergola,x+Math.sin(k)*.18,.7+k*.29,1.08,.15,.10,.09,0x62825c);}
        for(let i=0;i<20;i++){const x=-6.5+i*.63,z=i%2?-4.1:3.75;if(Math.abs(x-1)<1.5)continue;flower(root,x,z,i%3?0xc8898d:0xe5cc98);}
        cypress(root,-6.8,-.9,.8);cypress(root,6,-3.6,1.1);
    }
    if(index===2){
        const workshop=at(root,3.3,-2.2);timber(workshop,3.3,2.8,2.1);const r=new T.Group();r.position.y=2.1;roof(r,3.7,3.1,1.7);workshop.add(r);
        arch(workshop,1.45,1.75,.09,0x405a58,0,.12,1.46);for(let i=0;i<3;i++)box(workshop,1.2,.035,.04,0x81958a,0,.5+i*.4,1.57,.01);
        box(workshop,2.15,.46,.12,0xd8bc91,0,2.08,1.55,.045);for(let i=0;i<3;i++)box(workshop,.3,.23,.04,0x8f7653,-.52+i*.52,2.08,1.65,.025);
        const shed=at(root,-4.5,-2.6);timber(shed,2.7,2.25,1.8);const sr=new T.Group();sr.position.y=1.8;roof(sr,3,2.6,1.3);shed.add(sr);arch(shed,.85,1.45,.08,0x3f5c55,0,.12,1.2);
        const crane=at(root,-6.3,-.65);box(crane,.25,3.5,.25,0x536e6d,0,1.7,0,.04);box(crane,3,.22,.22,0x876c49,1,3.4,0,.035);curve(crane,[[0,2.4,0],[.6,3,0],[2.4,3.4,0]],.035,0xc0b293);curve(crane,[[2.4,3.4,0],[2.4,2.1,0]],.018,0x445850);mesh(new T.TorusGeometry(.12,.028,6,14,Math.PI*1.5),0xc6ac74,crane,[2.4,2,0]);
        for(let i=0;i<7;i++){const p=at(root,5.8+(i%2)*.55,-3.5+Math.floor(i/2)*.4);box(p,.52,.55,.5,i%2?0x9f784e:0xb18a5b,0,.28,0,.035);for(const z of [-.26,.26]){box(p,.5,.055,.025,0x665d49,0,.12,z,.008);box(p,.5,.055,.025,0x665d49,0,.43,z,.008);}box(p,.17,.12,.01,0xe1cfac,0,.3,.27,.012);}
    }
    if(index===3){
        const observatory=at(root,3.3,-2.2);mesh(new T.CylinderGeometry(1.6,1.7,.28,24),0x7a918f,observatory,[0,.14,0]);mesh(new T.CylinderGeometry(1.45,1.55,2.2,24),0xb2b9ad,observatory,[0,1.3,0]);
        for(let i=0;i<16;i++){const a=i/16*Math.PI*2;box(observatory,.045,2.1,.045,0x869e98,Math.cos(a)*1.5,1.3,Math.sin(a)*1.5,.015);}
        const dome=mesh(new T.SphereGeometry(1.6,28,16,0,Math.PI*2,0,Math.PI/2),0x426b7c,observatory,[0,2.4,0]);
        for(let i=0;i<8;i++){const a=i/8*Math.PI*2;curve(observatory,[[Math.cos(a)*1.62,2.4,Math.sin(a)*1.62],[Math.cos(a)*1.15,3.55,Math.sin(a)*1.15],[0,4.02,0]],.024,0x9da99a);}
        mesh(new T.TorusGeometry(1.61,.055,6,32),0xd0b986,observatory,[0,2.4,0]).rotation.x=Math.PI/2;
        const scope=new T.Group();scope.position.set(.15,3.2,.95);scope.rotation.x=.92;mesh(new T.CylinderGeometry(.19,.25,1.65,16),0x58767b,scope);for(const y of [-.8,.8])mesh(new T.TorusGeometry(.235,.04,6,20),0xd0b986,scope,[0,y,0]).rotation.x=Math.PI/2;observatory.add(scope);arch(observatory,.72,1.35,.10,0x2c4d5b,0,.18,1.56);
        const tower=at(root,-4.5,-2.6);mesh(new T.CylinderGeometry(.57,.95,3.6,16),0xc3c5ad,tower,[0,1.8,0]);for(let i=0;i<5;i++)mesh(new T.TorusGeometry(.93-i*.075,.035,6,20),0x8b9e94,tower,[0,.35+i*.65,0]).rotation.x=Math.PI/2;
        mesh(new T.CylinderGeometry(.9,.83,.12,16),0x506f75,tower,[0,3.62,0]);mesh(new T.CylinderGeometry(.65,.65,.68,12),0xcdbe8a,tower,[0,4,0]);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;box(tower,.045,.75,.045,0x466576,Math.cos(a)*.66,4,Math.sin(a)*.66,.01);}mesh(new T.ConeGeometry(1,.65,16),0x426777,tower,[0,4.68,0]);
        for(const [x,z] of [[-6,-3.7],[6,-3.5],[-6.2,1.2],[4.9,3.8]])cypress(root,x,z,.9);
        for(let i=0;i<3;i++){const p=at(root,-1.6+i*.75,-3.8);mesh(new T.CylinderGeometry(.18,.24,1.1,8),0x6a8a90,p,[0,.55,0]);mesh(new T.TorusGeometry(.28,.035,6,20),0xbdb98e,p,[0,1.25,0]);}
    }
    return batchStatic(root);
}
