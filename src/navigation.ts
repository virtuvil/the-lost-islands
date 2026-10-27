import {isWalkable,classifySurface,riverDistance,onBridge,RIVER_HALF_WIDTH,type NavigationContext} from './surfaces.ts';
export {rim,classifySurface,PLAYER_RADIUS,RIVER} from './surfaces.ts';
export type Point = {
    x: number;
    z: number;
};
export const START: Point = { x: -4.8, z: 4.25 };
export const landmarks = {
    pip: { x: -2.4, z: .8, label: 'Talk to Pip', name: 'Pip’s cottage' },
    clue: { x: -4.8, z: 1.9, label: 'Read the delivery board', name: 'Delivery board' },
    archive: { x: 3.3, z: .25, label: 'Open the archive', name: 'Tide-mail archive' },
    dock: { x: -5, z: 4.6, label: 'Read the arrival log', name: 'Arrival dock' },
    lookout: { x: 6, z: 2.5, label: 'Visit the observation point', name: 'Observation point' },
    beacon: { x: -.25, z: -3.4, label: 'Inspect the tide beacon', name: 'Restoration beacon' }
} as const;
export type Landmark = keyof typeof landmarks;
export function heightAt(x:number,z:number){const base=.26+.38*Math.exp(-((x+3)**2+(z+3.5)**2)/10)+.23*Math.exp(-((x-4)**2+(z+2)**2)/6)+.035*Math.sin(x*.7)*Math.cos(z*.8);const d=riverDistance({x,z});return base-(Math.max(0,1-d/(RIVER_HALF_WIDTH+.18)))*.65;}
export function walkingHeight(x:number,z:number,ctx:NavigationContext={}){if(onBridge({x,z}))return .30+.375*(1-((x-1.05)/1.45)**2);if(ctx.harbor&&z>6.7&&Math.abs(x+5)<.51)return .34+Math.min(1,(z-6.7)/1.4)*.21;if(ctx.harbor&&classifySurface({x,z},ctx)==='deck')return .55;if(z>4.65&&Math.abs(x+5)<.77)return .34;if(ctx.routeOpen&&x>6.3&&Math.abs(z-1.4)<.65)return .32;return heightAt(x,z);}
export function walkable(p:Point,ctx:NavigationContext={}){return isWalkable(p,ctx);}
/** Swept disc movement, sampled at less than half the character radius. */
export function moveSafely(from: Point, to: Point, ctx:NavigationContext={}): Point {
    const d = Math.hypot(to.x - from.x, to.z - from.z), n = Math.max(1, Math.ceil(d / .12));
    let p = walkable(from,ctx)?{...from}:{...START};
    for (let i = 1; i <= n; i++) {
        const q = { x: p.x + (to.x - from.x) / n, z: p.z + (to.z - from.z) / n };
        if (walkable(q,ctx))
            p = q;
        else if (walkable({ x: q.x, z: p.z },ctx))
            p.x = q.x;
        else if (walkable({ x: p.x, z: q.z },ctx))
            p.z = q.z;
        else break;
    }
    return p;
}
const CELL = .2, W = 105, H = 69;
function point(i: number): Point { return { x: (i % W - 42) * CELL, z: (Math.floor(i / W) - 32) * CELL }; }
function nearest(p: Point,ctx:NavigationContext) {
    let best = -1, dist = Infinity;
    for (let i = 0; i < W * H; i++) {
        const q = point(i), d = Math.hypot(p.x - q.x, p.z - q.z);
        if (d < dist && walkable(q,ctx)) {
            dist = d;
            best = i;
        }
    }
    return best;
}
/** Deterministic 8-neighbour A*, with corner-cut prevention. */
export function findPath(from: Point, to: Point,ctx:NavigationContext={}): Point[] {
    if(!walkable(to,ctx))return [];
    const start = nearest(from,ctx), end = nearest(to,ctx);
    if (start < 0 || end < 0)
        return [];
    const open = new Set([start]), came = new Map<number, number>(), g = new Map([[start, 0]]), f = new Map([[start, 0]]);
    while (open.size) {
        let current = -1, best = Infinity;
        for (const i of open) {
            if ((f.get(i) ?? Infinity) < best) {
                best = f.get(i)!;
                current = i;
            }
        }
        if (current === end) {
            const path = [point(end)];
            while (came.has(current)) {
                current = came.get(current)!;
                path.unshift(point(current));
            }
            return path;
        }
        open.delete(current);
        const x = current % W, y = Math.floor(current / W);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= W || ny < 0 || ny >= H)
                continue;
            const next = ny * W + nx;
            if (!walkable(point(next),ctx))
                continue;
            if (dx && dy && (!walkable(point(y * W + nx),ctx) || !walkable(point(ny * W + x),ctx)))
                continue;
            if(!segmentWalkable(point(current),point(next),ctx))continue;
            const cost = g.get(current)! + Math.hypot(dx, dy);
            if (cost < (g.get(next) ?? Infinity)) {
                came.set(next, current);
                g.set(next, cost);
                f.set(next, cost + Math.hypot(point(next).x - point(end).x, point(next).z - point(end).z) / CELL);
                open.add(next);
            }
        }
    }
    return [];
}

export function segmentWalkable(a:Point,b:Point,ctx:NavigationContext={}){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.08));for(let i=0;i<=n;i++){const t=i/n;if(!walkable({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t},ctx))return false;}return true;}
