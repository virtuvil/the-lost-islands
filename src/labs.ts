import { challenges } from './challenges.ts';
export type LabRequest = {
    path: string;
    user: string;
    value: string;
    sample: string;
    language: string;
    query: string;
    header: string;
};
export type Response = {
    status: number;
    body: string;
    headers: Record<string, string>;
    unsafe: boolean;
    trace: string[];
};
export type Lab = {
    request: LabRequest;
    fixes: string[];
    history: string[];
    seenGood: boolean;
    seenBad: boolean;
    reasoned: boolean;
    verified: boolean;
    guided: boolean;
    hint: number;
    stage: number;
    notices: string[];
    parcels: Record<string, string>;
    files: Record<string, string>;
    fileState: string;
    nextFile: number;
    now: number;
    cache: Record<string, {
        body: string;
        headers: Record<string, string>;
        unsafe: boolean;
        expires: number;
    }>;
    last: Response | null;
};
export const MARKER = `<img src="x" onerror="document.body.insertAdjacentText('beforeend',' LAB MARKER RAN')">`;
export const sampleInfo: Record<string, {
    name: string;
    mime: string;
    signature: boolean;
    decode: boolean;
    pixels: number;
    active: boolean;
}> = {
    'valid': { name: 'cove.png', mime: 'image/png', signature: true, decode: true, pixels: 40000, active: false },
    'text': { name: 'notes.txt', mime: 'text/plain', signature: false, decode: false, pixels: 0, active: false },
    'disguised': { name: 'portrait.png', mime: 'image/png', signature: true, decode: false, pixels: 0, active: false },
    'large': { name: 'wide.png', mime: 'image/png', signature: true, decode: true, pixels: 100000000, active: false },
    'active': { name: 'postcard.svg', mime: 'image/svg+xml', signature: false, decode: true, pixels: 200, active: true },
    'failed': { name: 'interrupted.png', mime: 'image/png', signature: true, decode: false, pixels: 0, active: false }
};
export function freshLab(id: number): Lab { return { request: { path: id === 1 ? 'p104' : id === 2 ? 'doc-mine-a7' : id === 3 ? 'guild=gull&project=p-gull&invoice=i-gull' : id === 4 ? '104,106' : '104', user: 'operator-104', value: id === 7 ? 'https://cove.example.invalid' : id === 9 ? '<b>Welcome</b>' : id >= 5 && id < 10 ? 'A quiet afternoon' : id === 1 ? 'Cove Lane' : id === 12 ? 'fresh-photo.png' : '', sample: 'valid', language: 'en', query: 'item=harbor', header: '' }, fixes: [], history: [], seenGood: false, seenBad: false, reasoned: false, verified: false, guided: false, hint: 0, stage: 0, notices: ['Welcome to the gardens'], parcels: { p104: 'Cove Lane', p105: 'Pearl Pier' }, files: { 'photo.png': 'previous resident image' }, fileState: 'none', nextFile: 1, now: 0, cache: {}, last: null }; }
export function preset(id: number, attack: boolean): LabRequest {
    const r = freshLab(id).request;
    if (!attack)
        return r;
    if (id === 0)
        r.path = '105';
    if (id === 1) {
        r.path = 'p105';
        r.value = 'Lantern Alley';
    }
    if (id === 2)
        r.path = 'doc-pearl-9f';
    if (id === 3)
        r.path = 'guild=heron&project=p-heron&invoice=i-heron';
    if (id === 4)
        r.path = '104,105';
    if (id === 5 || id === 6 || id === 8)
        r.value = MARKER;
    if (id === 7)
        r.value = "javascript:document.body.insertAdjacentText('beforeend',' LAB MARKER RAN')";
    if (id === 9)
        r.value = '<b>Welcome</b>' + MARKER;
    if (id === 10)
        r.sample = 'text';
    if (id === 11)
        r.sample = 'disguised';
    if (id === 12)
        r.value = '../public/photo.png';
    if (id === 13)
        r.sample = 'active';
    if (id === 14)
        r.sample = 'valid';
    if (id === 15)
        r.header = 'LAB OVERRIDE';
    if (id === 16)
        r.header = 'untrusted.example';
    if (id === 17)
        r.language = 'fr';
    if (id === 18)
        r.query = 'item=harbor&item=workshop';
    if (id === 19)
        r.header = '/lab/marker.js';
    return r;
}
const active = (s: string) => /<\s*script|on(?:error|load|click)\s*=|javascript\s*:/i.test(s);
function reply(status: number, body: string, unsafe = false, trace: string[] = [], headers: Record<string, string> = {}): Response { return { status, body, unsafe, trace, headers }; }
export function simulate(id: number, l: Lab, action = 'request'): Response {
    const r = l.request, has = (p: string) => l.fixes.includes(p), user = r.user, owner = (p: string) => ['104', '106', 'p104', 'doc-mine-a7'].includes(p) ? 'operator-104' : 'pearl';
    if (id < 5) {
        if (user === 'anonymous')
            return reply(401, 'Sign in before accessing protected objects.');
        if (id === 0) {
            if (!['104', '105'].includes(r.path))
                return reply(404, 'Record not found.');
            if (has('owner') && owner(r.path) !== user)
                return reply(403, 'Ownership denied. No private data returned.');
            return reply(200, r.path === '104' ? 'Your tide journal.' : 'Pearl’s private letter: the lighthouse takes dance lessons.', owner(r.path) !== user, ['session → record lookup → ' + (has('owner') ? 'ownership policy' : 'no object authorization')]);
        }
        if (id === 1) {
            if (!Object.hasOwn(l.parcels, r.path))
                return reply(404, 'Parcel not found.');
            if (has('write') && owner(r.path) !== user)
                return reply(403, 'Write denied. The stored destination is unchanged.');
            l.parcels[r.path] = r.value;
            return reply(200, `${r.path} destination is now ${l.parcels[r.path]}`, owner(r.path) !== user, ['PATCH → object authorization → stored mutation']);
        }
        if (id === 2) {
            if (!['doc-mine-a7', 'doc-pearl-9f'].includes(r.path))
                return reply(404, 'Document not found.');
            if (has('download') && owner(r.path) !== user)
                return reply(403, 'Direct-download ownership denied.');
            return reply(200, owner(r.path) === 'pearl' ? 'Private blueprint downloaded using the leaked reference.' : 'Your blueprint downloaded.', owner(r.path) !== user, ['activity entry reveals doc-pearl-9f', 'direct download handler']);
        }
        if (id === 3) {
            const p = new URLSearchParams(r.path), guild = p.get('guild'), project = p.get('project'), invoice = p.get('invoice');
            const invoiceProject = invoice === 'i-gull' ? 'p-gull' : invoice === 'i-heron' ? 'p-heron' : null;
            if (!invoiceProject)
                return reply(404, 'Unknown invoice.');
            const member = guild === 'gull' && user === 'operator-104', relationship = project === invoiceProject && (guild === 'gull' ? project === 'p-gull' : project === 'p-heron');
            if (has('membership') && !member)
                return reply(403, 'Requester is not a guild member with permission to read invoices.');
            if (has('relationship') && !relationship)
                return reply(403, 'Invoice/project/guild relationship mismatch.');
            return reply(200, `Invoice ${invoice} returned for ${project}.`, !member || !relationship, ['session → guild membership → project → invoice → read permission']);
        }
        const ids = r.path.split(',').map(x => x.trim()).filter(Boolean);
        if (!ids.length || ids.some(x => !['104', '105', '106'].includes(x)))
            return reply(404, 'Unknown export object.');
        const selected = has('every') ? ids : ids.slice(0, 1);
        if (selected.some(x => owner(x) !== user))
            return reply(403, 'Entire export rejected. No objects are included.');
        return reply(200, 'Export: ' + ids.map(x => `${x}: ${owner(x) === 'pearl' ? 'Pearl private letter' : 'your document'}`).join(' | '), ids.some(x => owner(x) !== user), ['atomic all-or-nothing export policy']);
    }
    if (id < 10) {
        let content = r.value;
        if (id === 6) {
            if (action === 'submit') {
                l.notices.push(content);
                return reply(201, 'Notice stored. Switch to the separate visitor to render it.');
            }
            content = l.notices.join('\n');
        }
        if (id === 7) {
            let allowed = false;
            try {
                allowed = ['http:', 'https:'].includes(new URL(content).protocol);
            }
            catch { }
            if (has('scheme') && !allowed)
                return reply(422, 'URL rejected: only HTTP/HTTPS destinations are allowed.');
            return reply(200, content, active(content), ['profile.website → href URL attribute → user activation']);
        }
        const safe = id === 5 ? has('text') : id === 6 ? has('stored') : id === 8 ? has('dom') : has('sanitize');
        if (id === 9 && has('decoy'))
            return reply(200, 'All formatting removed. Legitimate bold formatting no longer works.');
        return reply(200, content, !safe && active(content), [id === 8 ? 'location.hash (browser-only source)' : id === 6 ? 'stored notice → separate visitor' : 'untrusted input', safe ? (id === 9 ? 'DOMPurify restrictive HTML policy' : 'textContent / contextual text rendering') : 'unsafe HTML interpretation']);
    }
    if (id < 15) {
        const s = sampleInfo[r.sample] || sampleInfo.text;
        if (id === 10) {
            if (has('server') && r.sample !== 'valid')
                return reply(415, 'Server rejected unsupported content.');
            return reply(201, `Server accepted ${s.name}.`, r.sample !== 'valid');
        }
        if (id === 11) {
            if (has('decode') && (!s.decode || !s.signature || s.active))
                return reply(415, 'Full image decoding/type checks failed.');
            if (has('limits') && s.pixels > 1000000)
                return reply(413, 'Decoded pixel budget exceeded. No actual large allocation was attempted.');
            return reply(201, 'Image accepted after the configured checks.', !s.decode || s.pixels > 1000000);
        }
        if (id === 12) {
            const key = has('storage') ? `uploads/server-${l.nextFile++}` : r.value;
            const overwrite = key in l.files, escape = /\.\.|[\\/]/.test(key) && !has('storage');
            l.files[key] = s.name;
            return reply(201, `Stored as ${key}. Original name remains display metadata. ${overwrite ? 'Previous content overwritten.' : ''}`, overwrite || escape, ['original name → ' + (has('storage') ? 'metadata; server-generated key' : 'storage path')]);
        }
        if (id === 13) {
            if (has('delivery') && s.active)
                return reply(415, 'Active document rejected by this image-delivery policy.');
            return reply(200, has('delivery') ? 'Approved passive image served from isolated media origin.' : 'File served inline at application origin.', s.active && !has('delivery'), ['upload → storage → response context'], has('delivery') ? { 'Content-Type': 'image/png', 'Content-Disposition': 'attachment', 'X-Content-Type-Options': 'nosniff', 'Origin': 'https://media.example.invalid' } : { 'Content-Type': s.mime, 'Content-Disposition': 'inline', 'Origin': 'https://app.example.invalid' });
        }
        if (action === 'submit') {
            l.fileState = 'pending';
            return reply(202, 'Processing begins. State: pending. Test whether the retrieval policy really quarantines it.');
        }
        if (action === 'process') {
            if (l.fileState !== 'pending')
                return reply(409, 'Submit a sample before processing.');
            l.fileState = r.sample === 'failed' ? 'failed' : !s.decode || s.active ? 'rejected' : has('limits') && s.pixels > 1000000 ? 'rejected' : 'approved';
            return reply(200, `Processing finished. State: ${l.fileState}.`);
        }
        if (l.fileState === 'none')
            return reply(404, 'No uploaded file. Submit a sample first.');
        if (has('quarantine') && l.fileState !== 'approved')
            return reply(403, `Retrieval denied while ${l.fileState}.`);
        return reply(200, `Preview retrievable while ${l.fileState}.`, l.fileState !== 'approved' || s.pixels > 1000000);
    }
    const params = new URLSearchParams(r.query), values = params.getAll('item');
    if (id === 18 && has('duplicates') && values.length !== 1)
        return reply(400, 'Ambiguous duplicate parameters rejected before cache lookup.');
    const lang = ['en', 'fr'].includes(r.language) ? r.language : 'en';
    let key = id === 18 ? `/catalog?item=${values[0] || 'harbor'}` : `/island/${id}`;
    if (id === 17 && has('vary'))
        key += '|language=' + lang;
    const entry = l.cache[key];
    if (entry && entry.expires > l.now)
        return reply(200, entry.body, entry.unsafe, [`HIT · key ${key} · remaining TTL ${entry.expires - l.now}s`], { ...entry.headers, 'X-Lab-Cache': 'HIT' });
    let body = '', unsafe = false, headers: Record<string, string> = {};
    if (id === 15) {
        body = has('influence') ? 'Cove announcement: welcome aboard.' : r.header || 'Cove announcement: welcome aboard.';
        unsafe = !has('influence') && !!r.header;
    }
    if (id === 16) {
        body = 'Redirect to https://' + (has('canonical') ? 'cove.example.invalid' : r.header || 'cove.example.invalid') + '/home';
        headers.Location = body.slice(12);
        unsafe = !has('canonical') && !!r.header;
    }
    if (id === 17) {
        body = lang === 'fr' ? 'Bienvenue au jardin.' : 'Welcome to the garden.';
        unsafe = false;
    }
    if (id === 18) {
        body = 'Catalog item: ' + (values.at(-1) || 'harbor');
        unsafe = values.length > 1 && values[0] !== values.at(-1);
    }
    if (id === 19) {
        const resource = has('resource') ? '/lab/safe.js' : r.header || '/lab/safe.js';
        body = `Training page script-resource: ${resource}`;
        unsafe = resource !== '/lab/safe.js';
    }
    l.cache[key] = { body, headers, unsafe, expires: l.now + 60 };
    return reply(200, body, unsafe, [`MISS · key ${key} · TTL 60s · stored response`], { ...headers, 'X-Lab-Cache': 'MISS' });
}
export function runLab(id: number, l: Lab, action = 'request') {
    const res = simulate(id, l, action);
    l.last = res;
    l.history.push(`${l.request.user} · ${action} · ${res.status} · ${res.body}`);
    if (l.history.length > 24)
        l.history.shift();
    if (res.unsafe)
        l.seenBad = true;
    if (res.status < 400 && !res.unsafe && action !== 'submit' && action !== 'process')
        l.seenGood = true;
    // Cross-visitor language contamination is observable only against the visitor's request.
    if (id === 17 && res.headers['X-Lab-Cache'] === 'HIT' && l.request.language === 'en' && res.body.includes('Bienvenue')) {
        l.seenBad = true;
        res.unsafe = true;
    }
    return res;
}
export function applyFixes(l: Lab, fixes: string[]) { l.fixes = [...fixes]; if (fixes.includes('purge'))
    l.cache = {}; l.verified = false; }
export type Check = {
    name: string;
    pass: boolean;
    actual: string;
};
export function verifyLab(id: number, l: Lab): Check[] {
    const work = freshLab(id);
    work.fixes = [...l.fixes];
    if (id >= 15)
        work.cache = structuredClone(l.cache);
    if (l.fixes.includes('purge'))
        work.cache = {};
    const checks: Check[] = [];
    const check = (name: string, request: Partial<LabRequest>, expected: number, action = 'request', extra?: (r: Response) => boolean) => { work.request = { ...preset(id, false), ...request }; const res = simulate(id, work, action); checks.push({ name, pass: res.status === expected && !res.unsafe && (!extra || extra(res)), actual: `${res.status} · ${res.body}` }); return res; };
    if (id < 5) {
        check('Legitimate access still works', {}, 200);
        check('Another resident’s object is denied', preset(id, true), 403);
        check('Anonymous request is denied', { user: 'anonymous' }, 401);
        if (id === 1) {
            const before = work.parcels.p105;
            work.request = { ...preset(id, true) };
            simulate(id, work);
            checks.push({ name: 'Denied write leaves stored data unchanged', pass: work.parcels.p105 === before, actual: work.parcels.p105 });
        }
        if (id === 3)
            check('Mismatched parent-child relationship is denied', { path: 'guild=gull&project=p-other&invoice=i-gull' }, 403);
        if (id === 4)
            check('First object authorized does not authorize the batch', { path: '104,106,105' }, 403);
    }
    else if (id < 10) {
        const safeValue = id === 7 ? 'https://cove.example.invalid' : id === 9 ? '<b>Welcome</b>' : 'A quiet afternoon';
        check('Normal content remains useful', { value: safeValue }, 200, 'request', r => id !== 9 || !l.fixes.includes('decoy'));
        if (id === 6) {
            work.notices = [MARKER];
            check('Previously stored notice is safe for another visitor', { user: 'visitor' }, 200);
            work.request = { ...preset(id, true) };
            simulate(id, work, 'submit');
            check('New stored notice is also safe', { user: 'visitor' }, 200);
        }
        else
            check('Active content is not executable', preset(id, true), id === 7 ? 422 : 200);
        if (id === 9)
            checks.push({ name: 'Restrictive established sanitizer preserves allowed formatting', pass: l.fixes.includes('sanitize') && !l.fixes.includes('decoy'), actual: l.fixes.join(', ') || 'No policy' });
    }
    else if (id < 15) {
        if (id === 14) {
            work.request = preset(id, false);
            simulate(id, work, 'submit');
            check('Pending file cannot publish', {}, 403, 'retrieve');
            for (const sample of ['text', 'failed']) {
                work.request = { ...preset(id, false), sample };
                simulate(id, work, 'submit');
                simulate(id, work, 'process');
                check(sample === 'text' ? 'Rejected file stays unavailable' : 'Processing failure stays unavailable', { sample }, 403, 'retrieve');
            }
            work.request = preset(id, false);
            simulate(id, work, 'submit');
            simulate(id, work, 'process');
            check('Approved valid image remains available', {}, 200, 'retrieve');
            work.request = { ...preset(id, false), sample: 'large' };
            simulate(id, work, 'submit');
            simulate(id, work, 'process');
            check('Resource budget rejects oversized image', { sample: 'large' }, 403, 'retrieve');
        }
        else {
            check('Valid image remains usable', id === 12 ? { value: 'photo.png' } : {}, id === 13 ? 200 : 201);
            check('Unsafe prepared case is blocked', preset(id, true), id === 10 || id === 11 || id === 13 ? 415 : 201);
            if (id === 11)
                check('Valid signature does not bypass resource limits', { sample: 'large' }, 413);
            if (id === 12) {
                const count = Object.keys(work.files).length;
                check('Duplicate original name receives a new storage ID', { value: 'photo.png' }, 201);
                checks.push({ name: 'Stored files did not overwrite each other', pass: Object.keys(work.files).length === count + 1, actual: `${Object.keys(work.files).length} keys` });
            }
        }
    }
    else {
        if (id === 17) {
            check('French request receives French', { language: 'fr' }, 200, 'request', r => r.body.includes('Bienvenue'));
            check('Separate English visitor receives English', { user: 'visitor', language: 'en' }, 200, 'request', r => r.body.includes('Welcome'));
            check('Unsupported language is normalized to English', { language: 'unbounded-value' }, 200, 'request', r => r.body.includes('Welcome'));
        }
        else if (id === 18) {
            check('Duplicate parameter ambiguity is rejected', preset(id, true), 400);
            check('Ordinary query still returns its matching response', { query: 'item=harbor' }, 200, 'request', r => r.body.includes('harbor'));
        }
        else {
            check('Untrusted priming input no longer influences response', preset(id, true), 200);
            check('Independent clean visitor gets canonical content', { user: 'visitor' }, 200);
        }
        if ([15, 16, 17, 18, 19].includes(id))
            checks.push({ name: 'Old poisoned entries invalidated', pass: l.fixes.includes('purge') || Object.keys(l.cache).length === 0, actual: l.fixes.includes('purge') || Object.keys(l.cache).length === 0 ? 'Affected entries were invalidated' : 'Old shared entries may survive repair' });
    }
    l.verified = checks.every(c => c.pass);
    return checks;
}
