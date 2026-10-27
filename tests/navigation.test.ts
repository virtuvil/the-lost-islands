import { test } from 'node:test';
import assert from 'node:assert/strict';
import { walkable, moveSafely, findPath, START, landmarks } from '../src/navigation.ts';
test('terrain rejects edges and building interiors', () => { assert.equal(walkable({ x: 30, z: 0 }), false); assert.equal(walkable({ x: 3.3, z: -2.2 }), false); assert.equal(walkable({ x: -4.5, z: -2.6 }), false); assert.equal(walkable({ x: 0, z: 0 }), true); });
test('every landmark can be reached from the arrival area without crossing blocked cells', () => {
    for (const [name, p] of Object.entries(landmarks)) {
        const path = findPath(START, p);
        assert.ok(path.length > 0, name);
        assert.ok(path.every(walkable), name);
        const end = path.at(-1)!;
        assert.ok(Math.hypot(end.x - p.x, end.z - p.z) < 1.8, name);
    }
});
test('large movement cannot tunnel through archive building or off an edge', () => { const end = moveSafely({ x: 3.3, z: .2 }, { x: 3.3, z: -4 }); assert.ok(walkable(end)); assert.ok(end.z > -.4); const edge = moveSafely({ x: 0, z: 0 }, { x: 40, z: 0 }); assert.ok(walkable(edge)); assert.ok(edge.x < 9); });
test('stream is blocked except at the bridge', () => { assert.equal(walkable({ x: 1.05, z: 2.7 }), false); assert.equal(walkable({ x: 1.05, z: 1.5 }), true); });
