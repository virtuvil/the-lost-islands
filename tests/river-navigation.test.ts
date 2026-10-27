import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findPath,moveSafely,segmentWalkable,walkable,START,landmarks} from '../src/navigation.ts';
import {RIVER,riverDistance,RIVER_HALF_WIDTH,PLAYER_RADIUS,classifySurface} from '../src/surfaces.ts';

test('reported upstream river click is rejected rather than projected onto underwater ground',()=>{
 for(const p of [{x:.8,z:-1.6},{x:.65,z:-3.5},{x:1.3,z:3.5}]){
  assert.equal(classifySurface(p),'water');assert.deepEqual(findPath(START,p),[]);
 }
});
test('entire rendered river is blocked with a character radius on each bank',()=>{
 for(let i=1;i<RIVER.length;i++)for(let k=0;k<=30;k++){
  const t=k/30,p={x:RIVER[i-1].x+(RIVER[i].x-RIVER[i-1].x)*t,z:RIVER[i-1].z+(RIVER[i].z-RIVER[i-1].z)*t};
  if(Math.abs(p.z-1.5)<.9)continue;
  assert.equal(walkable(p),false,JSON.stringify(p));
 }
 assert.equal(walkable({x:1.3+RIVER_HALF_WIDTH+.1,z:3.5}),false);
});
test('cross-bank A-star paths in both directions traverse the bridge and every edge is safe',()=>{
 const a={x:-.5,z:-.1},b={x:2.1,z:-.1};
 for(const [from,to] of [[a,b],[b,a]]){const path=findPath(from,to);assert.ok(path.length);assert.ok(path.some(p=>Math.abs(p.z-1.5)<.3));for(let i=1;i<path.length;i++)assert.ok(segmentWalkable(path[i-1],path[i]));}
});
test('long frames and repeated diagonal inputs cannot tunnel across upstream water',()=>{
 const begin={x:-.2,z:-.3};const end=moveSafely(begin,{x:4,z:-.3});assert.ok(end.x<.5);assert.ok(walkable(end));
 let p={x:-.2,z:-.3};for(let i=0;i<500;i++)p=moveSafely(p,{x:p.x+.11,z:p.z-.025});assert.ok(walkable(p));assert.ok(p.x<.7);
});
test('a single long frame cannot emerge on the far bank of the previously blocked river strip',()=>{
 const east=moveSafely({x:-1,z:2.7},{x:3,z:2.7});assert.ok(east.x<.6);assert.ok(walkable(east));
 const west=moveSafely({x:3,z:2.7},{x:-1,z:2.7});assert.ok(west.x>1.7);assert.ok(walkable(west));
});
test('bridge entrances have connected swept paths in both directions',()=>{
 for(const [a,b] of [[{x:-.5,z:1.5},{x:2.6,z:1.5}],[{x:2.6,z:1.5},{x:-.5,z:1.5}]]){assert.ok(segmentWalkable(a,b));const end=moveSafely(a,b);assert.ok(Math.hypot(end.x-b.x,end.z-b.z)<.01);}
});
test('bridge parapet prevents diagonal side entry through the rail',()=>{
 assert.equal(walkable({x:1.05,z:2.08}),false);assert.equal(segmentWalkable({x:2.2,z:2.4},{x:1.05,z:1.5}),false);
});
test('repairable departure deck requires restored route; ferry approach is reachable',()=>{
 assert.equal(walkable({x:9.6,z:1.4}),false);assert.equal(classifySurface({x:9.6,z:1.4},{routeOpen:true}),'dock');
 const path=findPath(START,{x:9.8,z:1.4},{routeOpen:true});assert.ok(path.length);for(let i=1;i<path.length;i++)assert.ok(segmentWalkable(path[i-1],path[i],{routeOpen:true}));
});
test('dock, gangplank and ship deck form a continuous protected surface over water',()=>{
 const ctx={harbor:true};assert.ok(segmentWalkable({x:-5,z:4.6},{x:-5,z:8.8},ctx));assert.ok(segmentWalkable({x:-5,z:8.8},{x:-2.8,z:8.8},ctx));assert.equal(walkable({x:-3,z:7},ctx),false);
});
test('invalid origins recover onto valid arrival ground and spawn stays dry',()=>{
 assert.ok(walkable(START));assert.ok(riverDistance(START)>RIVER_HALF_WIDTH+PLAYER_RADIUS);assert.ok(walkable(moveSafely({x:NaN,z:0},{x:0,z:0})));
 for(const p of Object.values(landmarks))assert.ok(walkable(p),p.name);
});
test('every island uses its visible vegetation and props as navigation obstacles',()=>{
 for(let island=0;island<4;island++)for(const [name,p] of Object.entries(landmarks)){const path=findPath(START,p,{island,harbor:island===3});assert.ok(path.length,`${island}: ${name}`);for(let i=1;i<path.length;i++)assert.ok(segmentWalkable(path[i-1],path[i],{island,harbor:island===3}));}
 assert.equal(walkable({x:6.1,z:-2.9},{island:2}),false);
 assert.equal(walkable({x:-6.2,z:1.2},{island:3}),false);
});
test('moving ferry passenger and arrival pier are explicit deck surfaces',()=>{
 for(let x=10;x<=18;x+=.2)assert.equal(classifySurface({x:x-.2,z:1.4},{ferryX:x}),'deck');
 assert.equal(classifySurface({x:19.3,z:1.4},{arrival:true}),'dock');
 assert.equal(classifySurface({x:14,z:2.5},{ferryX:14}),'outside');
});
