import * as T from 'three';
import {box,mesh,batchStatic,ellipsoid,makeTerrain,building,tree,pathRibbon} from './assets';
import {heightAt} from './navigation';
import {islandKit} from './island-themes';
/** A working cable ferry: the passenger rides its deck, never walks over the sea. */
export function coastalPassage(){
 const root=new T.Group(),jetty=new T.Group(),repairs:T.Group[]=[];
 for(let i=0;i<5;i++){
  const section=new T.Group();const x=6.55+i*.68;
  for(let k=0;k<3;k++)box(section,.23,.12,1.3,0xb49b78,x+k*.22,.24,1.4,.015);
  for(const z of [.75,2.05]){mesh(new T.CylinderGeometry(.075,.095,1.25,8),0x706353,section,[x,.0,z]);box(section,.07,.45,.07,0xa08c6b,x,.55,z,.01);}
  repairs.push(section);jetty.add(section);
 }
 const rail=new T.Group();for(const z of [.75,2.05])box(rail,3.65,.07,.07,0x998a70,8.15,.78,z,.02);jetty.add(rail);root.add(jetty);
 // Five winch teeth are tangible progress, one repaired for each investigation.
 const winch=new T.Group();winch.position.set(6.15,heightAt(6.15,.3),.3);
 box(winch,.7,.48,.6,0x958368,0,.24,0,.06);const wheel=mesh(new T.TorusGeometry(.31,.045,7,24),0x635b48,winch,[0,.72,0]);wheel.rotation.y=Math.PI/2;root.add(winch);
 const ferry=new T.Group();ferry.name='inter-island-cable-ferry';ferry.position.set(10,.12,1.4);
 const shape=new T.Shape();shape.moveTo(-1.1,-.65);shape.quadraticCurveTo(-1.4,0,-1.1,.65);shape.lineTo(1.05,.65);shape.quadraticCurveTo(1.35,0,1.05,-.65);shape.closePath();
 const hull=mesh(new T.ExtrudeGeometry(shape,{depth:1.1,bevelEnabled:true,bevelSegments:2,bevelSize:.06,bevelThickness:.05}),0x4c665f,ferry);hull.rotation.x=Math.PI/2;hull.position.y=.12;
 for(let i=0;i<9;i++)box(ferry,.245,.08,1.18,i%2?0xb7a487:0xc4af8e,-1+i*.25,.16,0,.01);
 for(const z of [-.62,.62])for(const x of [-.9,.9]){box(ferry,.065,2.5,.065,0x74694f,x,1.4,z,.01);}
 const roof=box(ferry,2.4,.09,1.65,0xc8c3ab,0,2.7,0,.05);roof.rotation.z=.025;
 for(const z of [-.64,.64])box(ferry,1.8,.06,.06,0x7e735a,0,.77,z,.01);
 for(const x of [-.75,.75])ellipsoid(ferry,x,.05,.7,.12,.18,.12,0x4c5855);
 root.add(ferry);
 // Distinct arrival shore and pier remain visible during the crossing sequence.
 const arrival=new T.Group();arrival.position.set(24,-.15,1.4);
 const terrain=makeTerrain().root;terrain.scale.set(.63,.7,.7);arrival.add(terrain);
 const destinationKit=new T.Group();destinationKit.scale.setScalar(.63);arrival.add(destinationKit);
 for(let i=0;i<7;i++)box(arrival,.26,.1,1.3,0xb49b78,-6+i*.28,.24,0,.02);
 root.add(arrival);
 return {root,ferry,arrival,setTheme(index:number){destinationKit.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});destinationKit.clear();destinationKit.add(islandKit(Math.min(3,index+1)));},setProgress(mask:boolean[],open:boolean){repairs.forEach((s,i)=>{s.position.y=mask[i]?0:-.48;s.rotation.z=mask[i]?0:(i%2?-.08:.08);});rail.visible=open;ferry.visible=open;arrival.visible=true;},reset(){ferry.position.set(10,.12,1.4);},sail(t:number){ferry.position.x=10+8*Math.max(0,Math.min(1,t));}};
}
