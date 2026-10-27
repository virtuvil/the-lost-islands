import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request, score } from '../src/model.ts';
test('vulnerable archive exposes another owner’s record with the same session', () => { assert.equal(request(104, 'operator-104', false).status, 200); const r = request(105, 'operator-104', false); assert.equal(r.status, 200); assert.equal(r.owner, 'pearl'); });
test('repair allows owner and rejects cross-owner reads without leaking contents', () => { assert.equal(request(104, 'operator-104', true).status, 200); const r = request(105, 'operator-104', true); assert.equal(r.status, 403); assert.equal(r.owner, undefined); assert.equal(r.title, undefined); assert.ok(!r.body.includes('waltz')); assert.equal(request(105, 'pearl', true).status, 200); assert.equal(request(104, 'pearl', true).status, 403); });
test('anonymous access is rejected before record lookup', () => {
    for (const fixed of [false, true])
        for (const id of [104, 105, 999])
            assert.equal(request(id, null, fixed).status, 401);
});
test('unknown and invalid identifiers do not return private records', () => {
    for (const id of [0, -1, 999, NaN, Infinity])
        assert.equal(request(id, 'operator-104', true).status, 404);
});
test('independent completion has the highest score', () => { assert.equal(score(0, false, false, 1, true), 125); assert.equal(score(2, false, false, 1, true), 95); assert.equal(score(9, false, false, 1, true), 75); });
test('pressure-free mode removes all hint penalties', () => assert.equal(score(9, true, false, 1, true), 125));
test('guided completion ignores hint deductions but retains exploration and recap bonuses', () => { assert.equal(score(9, false, true, 1, true), 45); assert.equal(score(0, true, true, 0, false), 20); });
