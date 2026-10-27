export type FinalePhase='approach'|'wave'|'reunion'|'boarding'|'aboard';
export const FINALE_DURATION=20;
export const FINALE_LINES:Record<FinalePhase,{title:string;caption:string}>={
    approach:{title:'The right dock. At last.',caption:'Twenty investigations restored the way home.'},
    wave:{title:'“There you are!”',caption:'Luffy spots Zoro and waves him over.'},
    reunion:{title:'“Did you get lost again?”',caption:'Zoro: “The path needed fixing.”'},
    boarding:{title:'One last crossing.',caption:'A clear gangplank. A familiar friend. No more wrong turns.'},
    aboard:{title:'Together, aboard.',caption:'Luffy: “Next time, follow me.”  Zoro: “I was going this way.”'},
};
export function finalePhase(seconds:number):FinalePhase {return seconds<5?'approach':seconds<7?'wave':seconds<10?'reunion':seconds<18?'boarding':'aboard';}
const lerp=(a:number,b:number,t:number)=>a+(b-a)*Math.max(0,Math.min(1,t));
export function boardingPose(seconds:number){
    const t=Math.max(0,Math.min(1,(seconds-10)/5)),f=Math.max(0,Math.min(1,(seconds-13.5)/4.5));
    return {player:{x:lerp(-5,-2.8,(seconds-14)/1.6),z:lerp(5.9,8.8,t),y:lerp(.34,.55,Math.max(0,(t-.25)/.6))},friend:{x:f<.2?lerp(-4.1,-5,f/.2):f>.8?lerp(-5,-4.9,(f-.8)/.2):-5,z:lerp(6.6,8.9,(f-.2)/.8),y:lerp(.34,.55,Math.max(0,(f-.35)/.5))}};
}
export function alongPath(points:{x:number;z:number}[],fraction:number){
    if(!points.length)throw new Error('A route needs a start point');
    const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.z-points[i].z)),total=lengths.reduce((a,b)=>a+b,0);
    let distance=total*Math.max(0,Math.min(1,fraction));
    for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const a=points[i],b=points[i+1],t=lengths[i]?Math.min(1,distance/lengths[i]):1;return {x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t),angle:Math.atan2(b.x-a.x,b.z-a.z)};}distance-=lengths[i];}
    return {...points[0],angle:0};
}
