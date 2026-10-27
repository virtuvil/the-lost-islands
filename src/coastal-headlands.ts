import * as T from 'three';
import {mesh,box,ellipsoid,batchStatic} from './assets';
import {heightAt,rim} from './navigation';
/** Island-one kit: fissured sandstone headlands, coastal cypress and planted terraces. */
export function coastalMilestone(index=0){
 const root=new T.Group();
 for(const [angle,count,scale] of [[.15,4,1.1],[.85,3,.8],[1.5,4,.9],[2.45,3,1.2],[3.5,4,.85],[4.3,3,1.1],[5.3,3,1.15]]){
  for(let j=0;j<count;j++){
   const a=angle+j*.06,x=Math.cos(a)*8.65*rim(a),z=Math.sin(a)*6.25*rim(a),y=-.43-(j%2)*.12;
   const rock=mesh(new T.DodecahedronGeometry(.65*scale,1),[0xa79d87,0xb1a38a,0x8f9588][j%3],root,[x,y,z]);rock.scale.set(.8,1.45+(j%2)*.3,.85);rock.rotation.set(.06,j*.8,.12);
   for(let k=0;k<3;k++){const ledge=box(root,.65*scale,.028,.12,0x898a7b,x,y-.28+k*.27,z+.2,.01);ledge.rotation.y=-a;}
  }
 }
 for(const [x,z,s] of (index===0?[[-7,-2.7,.8],[5.2,-4.1,.9]]:[]) as number[][]){
  mesh(new T.CylinderGeometry(.10,.16,1.6,9),0x6a6550,root,[x,heightAt(x,z)+.8,z]);
  for(let i=0;i<5;i++){const crown=mesh(new T.SphereGeometry(1,14,10),i%2?0x526f59:0x637e61,root,[x+Math.sin(i)*.08,heightAt(x,z)+1.3+i*.35,z]);crown.scale.set(.55-i*.075,.8-i*.07,.48-i*.06);}
 }
 for(const [x,z,w] of [[-3,-3.9,1.3],[4.9,-3.7,1.1],[-6.9,.0,.8]]){
  box(root,w,.18,.52,0xb3a288,x,heightAt(x,z)+.06,z,.06);
  for(let i=0;i<5;i++){const px=x-w*.4+i*w*.2;ellipsoid(root,px,heightAt(x,z)+.27,z,.21,.27,.20,i%2?0x6b876c:0x819477);if(i%2===0)for(let k=0;k<3;k++)ellipsoid(root,px+(k-1)*.08,heightAt(x,z)+.49,z,.035,.055,.035,0xd6ba92);}
 }
 if(index===0){const tower=new T.Group();tower.position.set(4.1,heightAt(3.3,-2.2),-2.8);
 mesh(new T.CylinderGeometry(.56,.62,1.65,12),0xc9b898,tower,[0,3.2,0]);
 for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const pane=box(tower,.33,.65,.07,0x59746e,Math.sin(a)*.56,3.28,Math.cos(a)*.56,.06);pane.rotation.y=a;}
 const cap=mesh(new T.ConeGeometry(.79,.7,12),0x95694e,tower,[0,4.37,0]);cap.rotation.y=.16;mesh(new T.SphereGeometry(.07,10,8),0xbda778,tower,[0,4.77,0]);root.add(tower);}
 return batchStatic(root);
}
