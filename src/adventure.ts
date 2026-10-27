export const ISLANDS = ['Whispering Cove', 'Echo Gardens', 'Parcelworks', 'Frostlight Observatory'] as const;
export type Completion = {
    mode: 'independent' | 'guided';
    points: number;
    hints: number;
};
export type Adventure = {
    version: 3;
    name: string;
    current: number;
    completed: Record<string, Completion>;
    crossed: number[];
    hints: Record<string, number>;
    finale: boolean;
    textSize: number;
    practice: {
        group: number;
        done: number[];
    } | null;
};
export const freshAdventure = (name = ''): Adventure => ({ version: 3, name, current: 0, completed: {}, crossed: [], hints: {}, finale: false, textSize: 1, practice: null });
export let recoveryNotice='';
export function validName(value: string) { const name = value.trim(); return Array.from(name).length >= 1 && Array.from(name).length <= 24 ? name : null; }
export function groupCount(a: Adventure, g: number) { return Object.keys(a.completed).filter(id => Math.floor(Number(id) / 5) === g).length; }
export function unlocked(a: Adventure, g: number) { return g === 0 || (groupCount(a, g - 1) === 5 && a.crossed.includes(g - 1)); }
export function completeChallenge(a: Adventure, id: number, guided: boolean, hints: number) { if (!Number.isInteger(id) || id < 0 || id > 19 || a.completed[id])
    return false; a.completed[id] = { mode: guided ? 'guided' : 'independent', points: guided ? 20 : 100, hints }; return true; }
export function totalPoints(a: Adventure) { return Object.values(a.completed).reduce((s, c) => s + c.points, 0); }
export function parseAdventure(raw: string | null): Adventure | null { try {
    const v = JSON.parse(raw || 'null');
    if (v?.version !== 3 || typeof v.name !== 'string' || (v.name !== '' && !validName(v.name)) || !Number.isInteger(v.current) || v.current < 0 || v.current > 19 || typeof v.completed !== 'object' || !v.completed || Array.isArray(v.completed) || !Array.isArray(v.crossed) || typeof v.hints !== 'object' || !v.hints || typeof v.finale !== 'boolean')
        return null;
    for (const [id, c] of Object.entries(v.completed) as [
        string,
        Completion
    ][]) {
        if (!/^(\d|1\d)$/.test(id) || !['independent', 'guided'].includes(c.mode) || c.points !== (c.mode === 'guided' ? 20 : 100) || !Number.isInteger(c.hints) || c.hints < 0 || c.hints > 3)
            return null;
    }
    if (v.crossed.some((g: unknown) => !Number.isInteger(g) || Number(g) < 0 || Number(g) > 3 || groupCount(v, Number(g)) !== 5))
        return null;
    if (v.finale && Object.keys(v.completed).length !== 20)
        return null;
    v.textSize = [1, 1.15, 1.3].includes(v.textSize) ? v.textSize : 1;
    if (v.practice && (!Number.isInteger(v.practice.group) || v.practice.group < 0 || v.practice.group > 3 || !Array.isArray(v.practice.done) || v.practice.done.some((id: number) => !Number.isInteger(id) || Math.floor(id / 5) !== v.practice.group)))
        return null;
    v.practice = v.practice || null;
    return v;
}
catch {
    return null;
} }
export function loadAdventure(): Adventure { try {
    recoveryNotice='';const raw=localStorage.getItem('lost-islands-adventure-v3');const existing = parseAdventure(raw);
    if (existing)
        return existing;
    if(raw){try{localStorage.setItem('lost-islands-recovery-v3',raw);recoveryNotice='The saved adventure could not be read. A recovery copy was retained in this browser; a fresh session is open. Reload will keep this new session.';}catch{recoveryNotice='The saved adventure could not be read and browser storage could not retain a recovery copy. Keep this tab open if you need to inspect the save.';}}
    const old = JSON.parse(localStorage.getItem('lost-islands-mission-v2') || 'null');
    const a = freshAdventure();
    if (old?.mission?.complete && old.mission.fixed && new Set(old.mission.tests).size === 3)
        completeChallenge(a, 0, old.mission.skipped, Math.min(3, old.mission.hintCount || 0));
    return a;
}
catch {
    return freshAdventure();
} }
export function saveAdventure(a: Adventure) { try {
    localStorage.setItem('lost-islands-adventure-v3', JSON.stringify(a));
    return true;
}
catch {
    return false;
} }
