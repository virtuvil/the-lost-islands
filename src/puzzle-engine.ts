import { hints, score } from './model.ts';
import type { MissionSave } from './save.ts';
/** Shared by the manual puzzle and the demonstrator. No network or real data. */
export function completeGuidedRepair(m: MissionSave) {
    if (m.complete)
        return;
    m.skipped = true;
    m.seenOwn = true;
    m.seenOther = true;
    m.fixed = true;
    m.step = 2;
    m.tests = ['own', 'other', 'anon'];
}
/** Hints advance only unfinished work, never charge again when reviewing level three. */
export function nextHint(m: MissionSave) {
    const stage = m.step;
    if (stage === 0 && m.seenOwn && m.seenOther)
        return 'You found the missing boundary. Choose “That shouldn’t be allowed” to inspect the server.';
    if (stage === 1 && m.fixed)
        return 'Your ownership check is in place. Test the repair next.';
    if (stage === 2 && m.tests.length === 3)
        return 'All three checks passed. You can restore the island.';
    if (m.stageHints[stage] < 3) {
        m.stageHints[stage]++;
        m.hintCount++;
    }
    const level = m.stageHints[stage] - 1;
    if (stage === 0 && m.seenOwn)
        return ['Your own letter opens. What about Pearl’s?', 'Keep your session and request Pearl’s drawer number.', 'Change only the number to 105 and send.'][level];
    let text = hints[stage][level];
    if (stage === 2 && m.tests.length)
        text += ` Remaining: ${['own', 'other', 'anon'].filter(x => !m.tests.includes(x)).join(', ')}.`;
    return text;
}
export function evaluateCompletion(m: MissionSave, pressureFree: boolean) {
    return { points: score(m.hintCount, pressureFree, m.skipped, m.clue ? 1 : 0, m.quizCorrect === 3), method: m.skipped ? 'Assisted · guided demonstration' : m.hintCount ? 'Solved with hints' : 'Solved independently' };
}
