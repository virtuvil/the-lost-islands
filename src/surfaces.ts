/** Shared world-space surfaces. Rendering and every navigation mode use these dimensions. */
export type Point = {x:number;z:number};
export const PLAYER_RADIUS=.22;
export const RIVER=[{x:.52,z:-6.5},{x:.65,z:-3.5},{x:.8,z:-1.6},{x:1.05,z:.1},{x:1.05,z:1.5},{x:1.3,z:3.5},{x:2.05,z:6.5}];
export const RIVER_HALF_WIDTH=.43;
export const BRIDGE={x:1.05,z:1.5,halfLength:1.45,halfWidth:.65};
export type NavigationContext={routeOpen?:boolean;harbor?:boolean;ferryX?:number;arrival?:boolean;island?:number};
export type Surface='ground'|'water'|'bridge'|'dock'|'deck'|'obstacle'|'outside';
export function segmentDistance(p:Point,a:Point,b:Point){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);}
export function riverDistance(p:Point){return Math.min(...RIVER.slice(1).map((b,i)=>segmentDistance(p,RIVER[i],b)));}
export function onBridge(p:Point,inset=0){return Math.abs(p.x-BRIDGE.x)<=BRIDGE.halfLength-inset&&Math.abs(p.z-BRIDGE.z)<=BRIDGE.halfWidth-inset;}
export function inRect(p:Point,x:number,z:number,w:number,d:number,inset=0){return Math.abs(p.x-x)<=w-inset&&Math.abs(p.z-z)<=d-inset;}
export function rim(a:number){return 1+.05*Math.sin(a*3+.3)+.025*Math.cos(a*7);}
export function classifySurface(p:Point,ctx:NavigationContext={}):Surface{
 if(!Number.isFinite(p.x)||!Number.isFinite(p.z))return 'outside';
 if(ctx.ferryX!==undefined&&inRect(p,ctx.ferryX,1.4,1.1-PLAYER_RADIUS,.59-PLAYER_RADIUS))return 'deck';
 if(ctx.arrival&&inRect(p,19,1.4,1.3,.65-PLAYER_RADIUS))return 'dock';
 // Decks have priority over the water underneath. Side rails are excluded by the inset.
 if(ctx.harbor&&inRect(p,-5,7.95,.51-PLAYER_RADIUS,1.25))return 'bridge';
 if(ctx.harbor&&inRect(p,-3.7,9.2,3.25,.96,PLAYER_RADIUS)){
  if(inRect(p,-6.15,9.2,.78,.88,-PLAYER_RADIUS)||Math.hypot(p.x+3.55,p.z-9.2)<.32)return 'obstacle';
  return 'deck';
 }
 if(inRect(p,-5,5.65,.77-PLAYER_RADIUS,1.45))return 'dock';
 if(ctx.routeOpen&&inRect(p,8.05,1.4,2.0,.65,PLAYER_RADIUS))return 'dock';
 const a=Math.atan2(p.z/6.3,p.x/8.7),r=Math.hypot(p.x/8.7,p.z/6.3);
 if(r>rim(a)-PLAYER_RADIUS/6.3-.035)return 'outside';
 if([{x:-4.5,z:-2.6,w:1.7,d:1.4},{x:3.3,z:-2.2,w:1.9,d:1.65}].some(b=>inRect(p,b.x,b.z,b.w,b.d,-PLAYER_RADIUS)))return 'obstacle';
 const island=ctx.island??0;
 const trees=[[-6.7,-1.4],[-5.9,-3.8],[-2.7,-4.4],[5.6,-3.6],[6.5,-1.1],[-6,2.5],[4.6,3.7],[-.7,-4.6]].filter((_,i)=>island<2||(island===2&&i%2===0));
 const extra=island===0?[[-7,-2.7],[5.2,-4.1]]:island===1?[[-6.8,-.9],[6,-3.6]]:island===2?[[-6.3,-.65]]:[[-6,-3.7],[6,-3.5],[-6.2,1.2],[4.9,3.8]];
 if([...trees,...extra,[6.4,2.1],[6.1,2.9]].some(([x,z])=>Math.hypot(p.x-x,p.z-z)<.17+PLAYER_RADIUS))return 'obstacle';
 if(island===2&&inRect(p,6.1,-2.9,.58,.9,-PLAYER_RADIUS))return 'obstacle';
 if(onBridge(p,PLAYER_RADIUS))return 'bridge';
 // The parapets must not be stepped over from the side.
 if(onBridge(p,-.04)&&Math.abs(p.x-BRIDGE.x)<BRIDGE.halfLength-PLAYER_RADIUS)return 'obstacle';
 if(riverDistance(p)<RIVER_HALF_WIDTH+PLAYER_RADIUS)return 'water';
 return 'ground';
}
export function isWalkable(p:Point,ctx:NavigationContext={}){return ['ground','bridge','dock','deck'].includes(classifySurface(p,ctx));}

