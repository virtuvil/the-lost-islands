import * as T from 'three';
import { box, mesh, ellipsoid, batchStatic } from './assets';
import { luffy } from './character-assets';
import { heightAt } from './navigation';
import {rim} from './surfaces';

function rope(p:T.Object3D,points:number[][],r=.018,c=0x786448){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v as [number,number,number]))),20,r,5,false),c,p);}
function spar(p:T.Object3D,a:number[],b:number[],radius:number,color:number){const start=new T.Vector3(...a as [number,number,number]),end=new T.Vector3(...b as [number,number,number]);const m=mesh(new T.CylinderGeometry(radius*.8,radius,start.distanceTo(end),12),color,p);m.position.copy(start.clone().add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return m;}

export function pirateHarbor(){
    const root=new T.Group();root.name='milestone-harbor';
    const dock=new T.Group();dock.position.set(-5,.25,5.4);
    for(let i=0;i<10;i++){
        box(dock,1.9,.15,.255,i%3===0?0x977448:0xa88456,0,0,i*.26-.7,.025);
        for(const x of [-.7,.7])for(const dz of [-.06,.06])mesh(new T.CylinderGeometry(.016,.016,.01,6),0x4e544b,dock,[x,.085,i*.26-.7+dz]);
    }
    for(const x of [-.89,.89])for(const z of [-.75,1.65]){
        mesh(new T.CylinderGeometry(.12,.145,1.15,10),0x6b5140,dock,[x,-.18,z]);
        for(let k=0;k<3;k++)mesh(new T.TorusGeometry(.126,.016,5,12),0xc1aa78,dock,[x,.22+k*.04,z]).rotation.x=Math.PI/2;
    }
    for(const x of [-.89,.89])rope(dock,[[x,.3,-.75],[x,.18,.4],[x,.3,1.65]],.025);
    root.add(batchStatic(dock));
    // Mooring: ship axis X, dock approach along Z; deck/gangplank elevations meet.
    const ship=new T.Group();ship.name='pirate-ship';ship.position.set(-3.7,-.2,9.2);
    const hull=new T.Group();
    const len=7.3, sections=24;
    function width(x:number){return 1.18*Math.pow(Math.max(0,Math.sin((x/len+.5)*Math.PI)),.45)+.035;}
    function rise(x:number){return .74+.32*Math.pow(Math.abs(x)/(len/2),4);}
    // Shaped hull planking: six separate strakes on each side, tapered bow and stern.
    for(const side of [-1,1])for(let band=0;band<6;band++){
        const verts:number[]=[],idx:number[]=[];
        for(let i=0;i<=sections;i++)for(let edge=0;edge<2;edge++){
            const x=(i/sections-.5)*len,t=(band+edge)/6,y=-.6+t*(rise(x)+.6),z=side*width(x)*(.28+.72*Math.sin(t*Math.PI/2));
            verts.push(x,y,z);
            if(i<sections&&edge===0){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}
        }
        const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(idx);geo.computeVertexNormals();
        const m=mesh(geo,[0x684435,0x7e5438,0x8c603f,0x9b7048,0x9e754a,0x704a34][band],hull);(m.material as T.MeshStandardMaterial).side=T.DoubleSide;
        const seam=[];for(let i=0;i<=12;i++){const x=(i/12-.5)*len,t=band/6;seam.push([x,-.6+t*(rise(x)+.6)+.007,side*(width(x)*(.28+.72*Math.sin(t*Math.PI/2))+.007)]);}rope(hull,seam,.009,0x513c31);
    }
    const deckShape=new T.Shape();for(let i=0;i<=24;i++){const x=(i/24-.5)*len,z=width(x);i===0?deckShape.moveTo(x,z):deckShape.lineTo(x,z);}for(let i=24;i>=0;i--){const x=(i/24-.5)*len;deckShape.lineTo(x,-width(x));}deckShape.closePath();
    const deck=mesh(new T.ShapeGeometry(deckShape),0xc39b65,hull,[0,.75,0]);deck.rotation.x=-Math.PI/2;
    for(let i=0;i<21;i++){const x=(i/20-.5)*(len-.15);rope(hull,[[x,.76,-width(x)*.96],[x,.76,width(x)*.96]],.008,0x84653f);}
    for(const side of [-1,1]){
        let rail:number[][]=[];for(let i=1;i<16;i++){const x=(i/16-.5)*len,z=side*width(x)*.98,y=rise(x);if(side===-1&&x> -1.95&&x<-.65){if(rail.length>1)rope(hull,rail,.052,0xd2af70);rail=[];continue;}spar(hull,[x,y,z],[x,y+.45,z],.035,0x66503b);rail.push([x,y+.46,z]);}if(rail.length>1)rope(hull,rail,.052,0xd2af70);
        for(let i=0;i<4;i++){const x=-2.1+i*1.35;const p=mesh(new T.TorusGeometry(.145,.032,6,18),0xc5a056,hull,[x,.27,side*(width(x)+.01)]);p.rotation.y=side*Math.PI/2;const glass=mesh(new T.CircleGeometry(.12,18),0x243f47,hull,[x,.27,side*(width(x)+.018)]);glass.rotation.y=side*Math.PI/2;}
    }
    // Raised aft cabin and aft stairs, wheel, bowsprit and small figurehead.
    box(hull,1.55,.6,1.75,0x825438,-2.45,1.02,0,.07);box(hull,1.7,.12,1.9,0xb78d57,-2.45,1.35,0,.04);
    for(let i=0;i<3;i++)box(hull,.27,.16*(i+1),.65,0xb58d59,-1.28-i*.23,.78+.08*i,0,.02);
    for(const z of [-.55,0,.55])box(hull,.075,.37,.31,0x27434b,-3.245,1.03,z,.025);
    spar(hull,[-2.5,1.4,0],[-2.5,1.95,0],.06,0x614637);
    const wheel=mesh(new T.TorusGeometry(.22,.026,6,20),0xb99356,hull,[-2.5,1.85,0]);wheel.rotation.y=Math.PI/2;
    for(let i=0;i<8;i++){const a=i*Math.PI/4;spar(hull,[-2.5,1.85,0],[-2.5,1.85+Math.sin(a)*.29,Math.cos(a)*.29],.016,0xceb078);}
    spar(hull,[2.8,.8,0],[4.25,1.4,0],.06,0x795637);ellipsoid(hull,3.55,.9,0,.24,.25,.22,0xd0b177);ellipsoid(hull,3.73,.91,0,.16,.16,.21,0xf1dfb0);
    const mastX=.15;
    spar(hull,[mastX,.7,0],[mastX,5.2,0],.09,0x6e4e35);spar(hull,[mastX,4.65,-1.65],[mastX,4.65,1.65],.055,0x7f5c3c);
    const sails:T.Mesh[]=[];
    function sail(x:number,y:number,w:number,h:number){const geo=new T.PlaneGeometry(w,h,20,16);geo.rotateY(Math.PI/2);const pos=geo.getAttribute('position');for(let i=0;i<pos.count;i++){const u=pos.getZ(i)/(w/2),v=pos.getY(i)/(h/2);pos.setX(i,.3*(1-u*u)*(1-v*v));}geo.computeVertexNormals();const m=mesh(geo,0xe8d9b5,ship,[x,y,0]);m.material=(m.material as T.MeshStandardMaterial).clone();(m.material as T.MeshStandardMaterial).side=T.DoubleSide;sails.push(m);return m;}
    sail(mastX,3.47,2.8,2.25);
    const jibShape=new T.Shape();jibShape.moveTo(.38,4.55);jibShape.quadraticCurveTo(1.8,2.7,3.75,1.55);jibShape.quadraticCurveTo(2.3,1.37,1.15,1.72);jibShape.closePath();
    const jib=mesh(new T.ShapeGeometry(jibShape,20),0xe8d9b5,ship,[0,0,.025]);jib.material=(jib.material as T.MeshStandardMaterial).clone();(jib.material as T.MeshStandardMaterial).side=T.DoubleSide;sails.push(jib);
    for(const z of [-1.4,1.4])rope(hull,[[mastX,4.6,z],[mastX+.03,3.4,z*.94],[mastX,2.34,z*.92]],.012,0xc1ab7a);
    for(const side of [-1,1]){rope(hull,[[mastX,5.05,0],[-2.7,1.45,side*.82]],.019);rope(hull,[[mastX,5.05,0],[3.6,1.05,side*.2]],.019);for(let i=0;i<5;i++)rope(hull,[[mastX,4.1-i*.47,-.16],[mastX-.15-i*.27,1.1,side*.95]],.011);}
    // Small pennant, sewn seams, restrained abstract compass emblem (no borrowed logo).
    const flag=new T.Shape();flag.moveTo(0,0);flag.lineTo(.9,-.15);flag.lineTo(0,-.4);flag.closePath();mesh(new T.ShapeGeometry(flag),0x31443f,hull,[mastX,5.17,.02]);
    for(const z of [-.7,0,.7])rope(ship,[[mastX+.01,2.37,z],[mastX+.28,3.47,z],[mastX+.01,4.57,z]],.006,0xc5b38d);
    for(const x of [-.7,1.5]){mesh(new T.CylinderGeometry(.19,.19,.4,12),0x79583b,hull,[x,.97,.7]);for(const y of [.83,1.12])mesh(new T.TorusGeometry(.19,.014,5,12),0x3b4941,hull,[x,y,.7]).rotation.x=Math.PI/2;}
    // Keep above-deck occluders separate so inspection can make a clean cutaway.
    const rigging=new T.Group();
    hull.updateMatrixWorld(true);
    for(const child of [...hull.children])if(child instanceof T.Mesh){
        const bounds=new T.Box3().setFromObject(child);
        if(bounds.max.y>1.8||(bounds.max.y>.88&&bounds.min.y>.7))rigging.attach(child);
    }
    const riggingBatch=batchStatic(rigging);ship.add(batchStatic(hull),riggingBatch);root.add(ship);
    const gangplank=new T.Group();gangplank.position.set(-5,.37,7.5);gangplank.rotation.x=-.1;
    for(let i=0;i<7;i++)box(gangplank,1.12,.10,.22,i%2?0xb18b58:0x9b794c,0,0,-.7+i*.23,.025);
    for(const x of [-.51,.51]){for(const z of [-.7,.7])spar(gangplank,[x,.02,z],[x,.55,z],.025,0x75563b);rope(gangplank,[[x,.55,-.7],[x,.48,0],[x,.55,.7]],.02);}
    root.add(batchStatic(gangplank));
    const friend=luffy();friend.root.position.set(-4.55,.34,6.6);friend.root.rotation.y=Math.PI*.88;root.add(friend.root);
    // Coastal water is genuine shaded geometry; quiet mode freezes wave phase.
    const water=mesh(new T.PlaneGeometry(200,160,100,90),0x247f89,root,[0,-.86,3]);water.rotation.x=-Math.PI/2;water.receiveShadow=false;water.castShadow=false;
    const colors=[];const wp=water.geometry.getAttribute('position');for(let i=0;i<wp.count;i++){const x=wp.getX(i),z=3-wp.getY(i),r=Math.hypot(x/8.7,z/6.3),c=new T.Color(0x617f88);c.lerp(new T.Color(0x9eb1a6),Math.max(0,1-Math.abs(r-1)*1.8)*.48);colors.push(c.r,c.g,c.b);}water.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));water.material=new T.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:0});
    const foam=new T.Group();for(let i=0;i<60;i++){const a=i/60*Math.PI*2,x=Math.cos(a)*8.9,z=Math.sin(a)*6.55;if(z>5.3&&x<0)continue;const f=mesh(new T.TorusGeometry(.17+(i%3)*.04,.012,4,12,Math.PI*.8),0x8cbeb7,foam,[x,-.83,z]);f.rotation.x=-Math.PI/2;f.rotation.z=a;f.castShadow=false;}const shoreline=batchStatic(foam);root.add(shoreline);
    const wavePositions=water.geometry.getAttribute('position'),base=wavePositions.array.slice();
    return {root,ship,friend,cutaway(active:boolean){sails.forEach(s=>s.visible=!active);riggingBatch.visible=!active;ship.children.filter(c=>c instanceof T.Mesh&&c.geometry instanceof T.TubeGeometry).forEach(c=>c.visible=!active);},setDestinationVisible(visible:boolean){root.children.forEach(c=>c.visible=visible||c===water||c===shoreline);},animate(time:number,quiet:boolean){
        const t=quiet?0:time;ship.position.y=-.2+Math.sin(t*.7)*.025;ship.rotation.x=Math.sin(t*.6)*.005;
        sails.forEach((s,i)=>{s.rotation.z=Math.sin(t*.7+i)*.008;});
        friend.body.position.y=quiet?0:Math.sin(t*1.6)*.009;friend.head.rotation.y=quiet?0:Math.sin(t*.38)*.16;
        friend.rightArm.rotation.z=quiet?-.08:-.1-Math.max(0,Math.sin(t*.44))*.7;friend.rightArm.rotation.x=quiet?0:Math.sin(t*1.8)*.06;
        for(let i=0;i<wavePositions.count;i++){const x=base[i*3],y=base[i*3+1];wavePositions.setZ(i,Math.sin(x*.8+t*.7)*.026+Math.cos(y*.9+t*.55)*.022);}wavePositions.needsUpdate=true;
    }};
}

