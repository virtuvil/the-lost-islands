import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ActionScope } from '../src/action-scope.ts';
import { parseLabs } from '../src/lab-save.ts';
import { freshLab } from '../src/labs.ts';
test('reset invalidates a pending route continuation before it resolves', async () => { const scope = new ActionScope(), token = scope.token; let progress = 0; let release!: () => void; const pending = new Promise<void>(r => release = r).then(() => { if (scope.isCurrent(token))
    progress = 5; }); scope.cancel(); progress = 0; release(); await pending; assert.equal(progress, 0); assert.equal(scope.isCurrent(token), false); });
test('invalid lab state recovers visibly with a fresh lab rather than crashing', () => { assert.deepEqual(parseLabs('{'), {}); assert.deepEqual(parseLabs(JSON.stringify({ 0: { stage: 3 } })), {}); const l = freshLab(0); assert.deepEqual(parseLabs(JSON.stringify({ 0: l }))[0], l); l.last = { status: 200, body: 'x', headers: {}, unsafe: false, trace: null as never }; assert.deepEqual(parseLabs(JSON.stringify({ 0: l })), {}); });
