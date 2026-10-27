import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshMission } from '../src/save.ts';
import { completeGuidedRepair, nextHint, evaluateCompletion } from '../src/puzzle-engine.ts';
test('guided demonstration finishes a coherent tested authorization repair', () => { const m = freshMission(); completeGuidedRepair(m); assert.equal(m.fixed, true); assert.equal(m.skipped, true); assert.equal(m.step, 2); assert.deepEqual(m.tests, ['own', 'other', 'anon']); assert.equal(evaluateCompletion(m, false).points, 20); assert.match(evaluateCompletion(m, false).method, /Assisted/); });
test('replaying a completed demonstration never downgrades independent completion', () => { const m = { ...freshMission(), complete: true, points: 125 }; completeGuidedRepair(m); assert.equal(m.skipped, false); assert.equal(m.points, 125); });
test('contextual hints progress through three levels and review costs nothing more', () => { const m = freshMission(); const texts = [nextHint(m), nextHint(m), nextHint(m)]; assert.equal(new Set(texts).size, 3); assert.equal(m.hintCount, 3); nextHint(m); assert.equal(m.hintCount, 3); m.seenOwn = true; assert.match(nextHint(m), /105/); });
test('finished work does not trigger further hint penalties', () => { const m = { ...freshMission(), seenOwn: true, seenOther: true }; nextHint(m); assert.equal(m.hintCount, 0); m.step = 1; m.fixed = true; nextHint(m); assert.equal(m.hintCount, 0); m.step = 2; m.tests = ['own']; assert.match(nextHint(m), /other, anon/); });
test('all scoring tiers, pressure-free assistance and discovery cap are explicit', () => {
    for (const [hint, expected] of [[0, 100], [1, 85], [2, 70], [3, 50], [9, 50]]) {
        const m = { ...freshMission(), hintCount: hint };
        assert.equal(evaluateCompletion(m, false).points, expected);
        assert.equal(evaluateCompletion(m, true).points, 100);
    }
});
