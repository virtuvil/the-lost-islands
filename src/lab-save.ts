import { freshLab, type Lab } from './labs.ts';
export function parseLabs(raw: string | null): Record<string, Lab> { try {
    const data = JSON.parse(raw || '{}');
    if (!data || typeof data !== 'object' || Array.isArray(data))
        return {};
    const out: Record<string, Lab> = {};
    for (const [key, v] of Object.entries(data) as [
        string,
        Lab
    ][]) {
        const id = Number(key);
        if (!Number.isInteger(id) || id < 0 || id > 19 || !v || !v.request || !Object.values(v.request).every(x => typeof x === 'string' && x.length <= 12000) || !Array.isArray(v.fixes) || !v.fixes.every(x => typeof x === 'string') || !Array.isArray(v.history) || !v.history.every(x => typeof x === 'string') || !Array.isArray(v.notices) || !v.notices.every(x => typeof x === 'string') || !v.cache || typeof v.cache !== 'object' || Array.isArray(v.cache) || !v.files || !v.parcels || !Number.isFinite(v.now) || !Number.isInteger(v.stage) || v.stage < 0 || v.stage > 5 || !Number.isInteger(v.hint) || v.hint < 0 || v.hint > 3)
            continue;
        let valid = true;
        for (const e of Object.values(v.cache))
            if (!e || typeof e.body !== 'string' || !Number.isFinite(e.expires) || !e.headers)
                valid = false;
        if (v.last && (!Array.isArray(v.last.trace) || typeof v.last.body !== 'string' || !v.last.headers))
            valid = false;
        if (!valid)
            continue;
        out[key] = { ...freshLab(id), ...v, history: v.history.slice(-24) };
    }
    return out;
}
catch {
    return {};
} }
