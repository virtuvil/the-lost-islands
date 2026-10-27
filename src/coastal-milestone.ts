import * as T from 'three';
import { mesh, box, ellipsoid, batchStatic, pathRibbon } from './assets';
import { heightAt, rim } from './navigation';

/** Deliberate cliff strata and coastal planting; no collision/progression changes. */
export function coastalMilestone(){
    const root=new T.Group();
    for(let i=0;i<49;i++){
        const a=i/49*Math.PI*2,edge=rim(a),x=Math.cos(a)*8.57*edge,z=Math.sin(a)*6.2*edge;
        if(z>4.3&&x<-2.5)continue;
        const rock=mesh(new T.DodecahedronGeometry(.52+(i%4)*.12,1),[0x8e8d7c,0xaaa083,0xb8a381,0x7b837b][i%4],root,[x,-.55-(i%3)*.18,z]);
        rock.scale.set(.65,1.3,.75);rock.rotation.set(.1,i*.7,.07);
        for(let j=0;j<2;j++){const seam=box(root,.42+(i%3)*.1,.024,.025,0x6b796f,x,-.42-j*.38,z+.28,.007);seam.rotation.y=-a;}
    }
    // Hand-laid path edging is sparse enough to preserve landmarks and navigation.
    for(let i=0;i<28;i++){const x=-4.2+i*.28,z=.7+.6*Math.sin(i*.19);if(Math.abs(x-1.05)<1.4)continue;const stone=mesh(new T.DodecahedronGeometry(.11,0),i%2?0xcab590:0x9c9f87,root,[x,heightAt(x,z)+.045,z]);stone.scale.set(1.4,.5,.9);}
    // Two distinct narrow cypress silhouettes complement the broad existing crowns.
    for(const [x,z,s] of [[-7,-2.7,.8],[5.2,-4.1,.9]] as const){
        mesh(new T.CylinderGeometry(.10,.16,1.6,9),0x6a6550,root,[x,heightAt(x,z)+.8,z]);
        for(let i=0;i<5;i++){const crown=mesh(new T.SphereGeometry(1,12,9),i%2?0x3e6c58:0x4a7960,root,[x+Math.sin(i)*.08,heightAt(x,z)+1.3+i*.35,z]);crown.scale.set(.55-i*.075,.8-i*.07,.48-i*.06);}
    }
    for(const [x,z] of [[-6.8,.4],[5.3,3.4],[-2.8,-4.1]]){
        const b=new T.Group();b.position.set(x,heightAt(x,z),z);
        for(let i=0;i<7;i++){const a=i*2.399;ellipsoid(b,Math.cos(a)*.28,.22+(i%3)*.1,Math.sin(a)*.25,.24,.22,.2,i%2?0x4b7e62:0x668c65);}
        root.add(b);
    }
    return batchStatic(root);
}
