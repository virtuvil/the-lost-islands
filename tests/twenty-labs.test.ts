import { test } from 'node:test';
import assert from 'node:assert/strict';
import { challenges } from '../src/challenges.ts';
import { freshLab, preset, runLab, applyFixes, verifyLab, simulate } from '../src/labs.ts';
import { freshAdventure, validName, parseAdventure, completeChallenge, groupCount, unlocked, totalPoints } from '../src/adventure.ts';
test('normal URL and rich-text presets preserve legitimate behavior after repair',()=>{for(const [id,value] of [[7,'https://cove.example.invalid'],[9,'<b>Welcome</b>']] as const){const l=freshLab(id);assert.equal(preset(id,false).value,value);l.request=preset(id,false);applyFixes(l,challenges[id].required);runLab(id,l);assert.equal(l.last?.status,200);assert.equal(l.last?.unsafe,false);}});
test('exactly twenty distinct definitions with five per family and complete lesson content', () => { assert.equal(challenges.length, 20); assert.equal(new Set(challenges.map(c => c.title)).size, 20); for (const family of ['idor', 'xss', 'upload', 'cache'])
    assert.equal(challenges.filter(c => c.family === family).length, 5); for (const c of challenges) {
    assert.equal(c.hints.length, 3);
    assert.ok(c.expected && c.cause && c.boundary && c.impact && c.alternatives && c.transfer.q);
} });
for (const c of challenges) {
    test(`${c.id + 1}: ${c.title} reproduces a boundary failure and verifies its actual repair`, () => { const l = freshLab(c.id); l.request = preset(c.id, false); if (c.id === 14) {
        runLab(c.id, l, 'submit');
        runLab(c.id, l, 'process');
    } runLab(c.id, l, c.id === 14 ? 'retrieve' : 'request'); assert.equal(l.seenGood, true, 'normal-use evidence'); l.request = preset(c.id, true); if (c.family === 'cache')
        l.cache = {}; if (c.id === 6)
        runLab(c.id, l, 'submit'); if (c.id === 14)
        runLab(c.id, l, 'submit'); runLab(c.id, l, c.id === 14 ? 'retrieve' : 'request'); if (c.family === 'cache') {
        l.request = { ...preset(c.id, false), user: 'visitor' };
        runLab(c.id, l);
    } assert.equal(l.seenBad, true, 'vulnerability evidence'); const broken = verifyLab(c.id, l); assert.ok(broken.some(x => !x.pass), 'unrepaired lab must fail checks'); applyFixes(l, c.required); const repaired = verifyLab(c.id, l); assert.ok(repaired.every(x => x.pass), JSON.stringify(repaired)); assert.equal(l.verified, true); });
}
test('authorization denial does not mutate another resident’s parcel', () => { const l = freshLab(1); l.request = preset(1, true); applyFixes(l, ['write']); assert.equal(simulate(1, l).status, 403); assert.equal(l.parcels.p105, 'Pearl Pier'); });
test('nested object authorization denies wrong parent even inside the same guild', () => { const l = freshLab(3); l.request.path = 'guild=gull&project=p-other&invoice=i-gull'; applyFixes(l, ['membership', 'relationship']); assert.equal(simulate(3, l).status, 403); });
test('every missing required control is exposed by behavior checks', () => { for (const c of challenges) {
    for (const missing of c.required) {
        const l = freshLab(c.id);
        if (c.family === 'cache') {
            l.request = preset(c.id, true);
            runLab(c.id, l);
            l.request = { ...preset(c.id, false), user: 'visitor' };
            runLab(c.id, l);
        }
        applyFixes(l, c.required.filter(x => x !== missing));
        assert.ok(verifyLab(c.id, l).some(x => !x.pass), `${c.title}: ${missing}`);
    }
} });
test('route requires all five permanent completions and travel; replay cannot farm', () => { const a = freshAdventure('Mara'); for (let i = 0; i < 4; i++)
    completeChallenge(a, i, false, 0); assert.equal(groupCount(a, 0), 4); assert.equal(unlocked(a, 1), false); completeChallenge(a, 4, true, 1); assert.equal(groupCount(a, 0), 5); assert.equal(unlocked(a, 1), false); a.crossed.push(0); assert.equal(unlocked(a, 1), true); const points = totalPoints(a); assert.equal(completeChallenge(a, 4, false, 0), false); assert.equal(totalPoints(a), points); });
test('name rules and versioned persistence preserve identity and reject corruption', () => { assert.equal(validName('   Mara  '), 'Mara'); assert.equal(validName('   '), null); assert.equal(validName('x'.repeat(25)), null); const a = freshAdventure('<b>Mara</b>'); assert.deepEqual(parseAdventure(JSON.stringify(a)), a); assert.equal(parseAdventure('{'), null); a.finale = true; assert.equal(parseAdventure(JSON.stringify(a)), null); });
