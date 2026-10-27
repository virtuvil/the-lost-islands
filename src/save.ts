export type MissionSave = {
    met: boolean;
    clue: boolean;
    step: number;
    hintCount: number;
    stageHints: number[];
    skipped: boolean;
    fixed: boolean;
    seenOwn: boolean;
    seenOther: boolean;
    tests: string[];
    complete: boolean;
    points: number;
    method: string;
    quizCorrect: number;
    quizIndex: number;
    quizAnswered: boolean;
    recapIndex: number;
};
export type Comfort = {
    quiet: boolean;
    sound: boolean;
    accessible: boolean;
    quality: 'high' | 'low';
};
export const freshMission = (): MissionSave => ({ met: false, clue: false, step: 0, hintCount: 0, stageHints: [0, 0, 0], skipped: false, fixed: false, seenOwn: false, seenOther: false, tests: [], complete: false, points: 0, method: '', quizCorrect: 0, quizIndex: 0, quizAnswered: false, recapIndex: 0 });
export function parseSave(raw: string | null): MissionSave | null {
    try {
        const v = JSON.parse(raw || 'null');
        if (v?.version !== 2)
            return null;
        const s = v.mission;
        if (!s || typeof s !== 'object')
            return null;
        for (const k of ['met', 'clue', 'skipped', 'fixed', 'seenOwn', 'seenOther', 'complete'])
            if (typeof s[k] !== 'boolean')
                return null;
        for (const [k, max] of [['step', 2], ['hintCount', 9], ['points', 125], ['quizCorrect', 3], ['quizIndex', 3], ['recapIndex', 4]] as const)
            if (!Number.isInteger(s[k]) || s[k] < 0 || s[k] > max)
                return null;
        if (!Array.isArray(s.stageHints) || s.stageHints.length !== 3 || s.stageHints.some((n: unknown) => !Number.isInteger(n) || Number(n) < 0 || Number(n) > 3))
            return null;
        if (s.hintCount !== s.stageHints.reduce((a: number, b: number) => a + b, 0))
            return null;
        if (!Array.isArray(s.tests) || s.tests.some((x: unknown) => !['own', 'other', 'anon'].includes(String(x))))
            return null;
        if (typeof s.method !== 'string')
            return null;
        if (s.complete && (!s.fixed || new Set(s.tests).size !== 3))
            return null;
        return { ...s, tests: [...new Set<string>(s.tests)], quizAnswered: s.quizAnswered === true };
    }
    catch {
        return null;
    }
}
export function readMission(): MissionSave {
    try {
        return parseSave(localStorage.getItem('lost-islands-mission-v2')) ?? freshMission();
    }
    catch {
        return freshMission();
    }
}
export function writeMission(mission: MissionSave) {
    try {
        localStorage.setItem('lost-islands-mission-v2', JSON.stringify({ version: 2, mission }));
    }
    catch { /* Browser storage can be disabled; the live game still works. */ }
}
export function readComfort(): Comfort {
    const defaults: Comfort = { quiet: matchMedia('(prefers-reduced-motion: reduce)').matches, sound: false, accessible: false, quality: 'high' };
    try {
        const s = JSON.parse(localStorage.getItem('lost-islands-comfort-v2') || 'null');
        if (!s)
            return defaults;
        return { quiet: typeof s.quiet === 'boolean' ? s.quiet : defaults.quiet, sound: s.sound === true, accessible: s.accessible === true, quality: s.quality === 'low' ? 'low' : 'high' };
    }
    catch {
        return defaults;
    }
}
export function writeComfort(s: Comfort) {
    try {
        localStorage.setItem('lost-islands-comfort-v2', JSON.stringify(s));
    }
    catch { }
}
