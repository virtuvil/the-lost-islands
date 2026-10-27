import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshMission, parseSave } from '../src/save.ts';
const encode = (mission: unknown) => JSON.stringify({ version: 2, mission });
test('save round-trip preserves active puzzle state', () => { const m = { ...freshMission(), clue: true, met: true, step: 1, seenOwn: true, seenOther: true, stageHints: [2, 0, 0], hintCount: 2 }; assert.deepEqual(parseSave(encode(m)), m); });
test('restored mission survives reload with exact score and classification', () => { const m = { ...freshMission(), complete: true, fixed: true, tests: ['own', 'other', 'anon'], points: 125, method: 'Solved independently' }; assert.deepEqual(parseSave(encode(m)), m); });
test('corrupt, unsupported and inconsistent saves are rejected', () => {
    for (const value of [null, '{', '{}', encode({ ...freshMission(), points: 900 }), encode({ ...freshMission(), hintCount: 2 }), encode({ ...freshMission(), complete: true })])
        assert.equal(parseSave(value), null);
});
test('new attempt cannot inherit completed progress or farm previous points', () => { const a = freshMission(), b = freshMission(); a.stageHints[0] = 3; a.tests.push('own'); assert.deepEqual(b.stageHints, [0, 0, 0]); assert.deepEqual(b.tests, []); assert.equal(b.complete, false); assert.equal(b.points, 0); });
