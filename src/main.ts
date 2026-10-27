import './style.css';
import {journeyMap,islandIllustration} from './journey-map';
import {FINALE_LINES} from './voyage';
import DOMPurify from 'dompurify';
import { securePolicies } from './policy-examples';
import { ActionScope } from './action-scope';
import { parseLabs } from './lab-save';
import { challenges, type Challenge } from './challenges';
import { freshLab, preset, runLab, simulate, verifyLab, applyFixes, sampleInfo, MARKER, type Lab, type LabRequest } from './labs';
import { ISLANDS, loadAdventure, saveAdventure, freshAdventure, validName, groupCount, unlocked, completeChallenge, totalPoints,recoveryNotice } from './adventure';
import { readComfort, writeComfort } from './save';
import { landmarks, type Landmark } from './navigation';
import type { GameWorld } from './game-world';
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const esc = (s: unknown) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
let adventure = loadAdventure(), comfort = readComfort(), world: GameWorld | undefined, started = false, kind = '', theme = '', pending = false, guidedStep = 0;
const actionScope = new ActionScope();
let labs: Record<string, Lab> = {};
try {
    labs = parseLabs(localStorage.getItem('lost-islands-labs-v3'));
}
catch { }
const lab = () => labs[adventure.current] ?? (labs[adventure.current] = freshLab(adventure.current));
const stations: Landmark[] = ['archive', 'clue', 'beacon', 'pip', 'lookout'];
$('#app').innerHTML = `<div class="game-shell"><header><button id="home" class="brand" aria-label="Main menu"><span class="brand-mark">✧</span><span>THE LOST ISLANDS<small>FIND YOUR WAY. KEEP IT SAFE.</small></span></button><nav><button id="map">◈ <span>World map</span></button><button id="tutorial">? <span>Field guide</span></button><button id="resets">↺ <span>Reset controls</span></button><span class="points">✦ <b id="total">0</b></span><button id="settings" aria-label="Settings">☷</button></nav></header>
<main id="scene" tabindex="-1"><div id="world-container"><div class="loading">Gathering the islands…</div></div><div class="island-label"><span class="eyebrow" id="island-topic"></span><h1 id="island-name"></h1><p id="identity"></p></div><div class="chapter-mark"><span id="group-count"></span><small id="overall"></small></div><button id="interact" class="interact-prompt" hidden><kbd>E</kbd><span></span></button><div class="objective"><span class="objective-icon">⌁</span><div><span class="eyebrow">A LITTLE DIRECTION</span><p id="objective-text"></p></div><button id="go" aria-label="Walk to current objective">↗</button></div><div id="toast" role="status"></div><div id="cinematic" hidden><span class="eyebrow">A PATH REMEMBERED</span><h2 id="travel-title"></h2><p id="travel-caption"></p><button id="skip-route">Skip scene →</button><button id="route-reset">Reset controls</button></div><div id="save-warning" role="alert" hidden></div></main><footer><div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows to walk <kbd>E</kbd> to interact</div><span>Click a path or tap the direction arrow · No timer</span></footer></div><div id="overlay"></div>`;
$('#scene').insertAdjacentHTML('beforeend',`<div class="camera-tools"><label for="camera-view">SCENIC VIEWS</label><select id="camera-view" aria-label="Scenic camera views"><option value="explore">Explore the coast</option><option value="front">Zoro · front</option><option value="side">Zoro · three swords</option><option value="back">Zoro · back</option><option value="harbor">Luffy & the ship</option><option value="luffy">Luffy · waiting</option></select><p id="view-note" role="status">Explore, or take a closer look at the crew.</p></div>`);
function view(mode:'explore'|'front'|'side'|'back'|'harbor'|'luffy') { world?.inspect(mode); document.body.dataset.view=mode; $<HTMLSelectElement>('#camera-view').value=mode; $('#view-note').textContent=mode==='explore'?'WASD / arrows to walk · inspect the characters with this camera.':mode==='harbor'?'Destination view · Luffy waits at the final dock. This view does not unlock travel.':mode==='luffy'?'Luffy at the dock · live waiting animation.':'Live player model · return to Explore the coast to walk.'; }
$('#camera-view').onchange=()=>view($<HTMLSelectElement>('#camera-view').value as Parameters<typeof view>[0]);
if(recoveryNotice){$('#save-warning').hidden=false;$('#save-warning').textContent=recoveryNotice;}
function bind(id: string, fn: () => void) { document.getElementById(id)?.addEventListener('click', fn); }
function store() { const ok = saveAdventure(adventure); writeComfort(comfort); try {
    localStorage.setItem('lost-islands-labs-v3', JSON.stringify(labs));
}
catch {
    $('#save-warning').hidden = false;
    $('#save-warning').textContent = 'Browser storage is unavailable. This session works, but progress cannot survive reload.';
} if (!ok) {
    $('#save-warning').hidden = false;
    $('#save-warning').textContent = 'Progress could not be saved. Enable browser storage before leaving.';
} document.body.classList.toggle('reduced', comfort.quiet); document.documentElement.style.setProperty('--text-scale', String(adventure.textSize)); }
function hud() { store(); for(const id of ['home','map','tutorial','settings'])$<HTMLButtonElement>('#'+id).disabled=pending; const g = Math.floor(adventure.current / 5), count = groupCount(adventure, g); $('#island-name').textContent = ISLANDS[g]; $('#island-topic').textContent = ['OBJECT-LEVEL AUTHORIZATION', 'CROSS-SITE SCRIPTING', 'FILE-UPLOAD SECURITY', 'WEB CACHE POISONING'][g]; $('#identity').textContent = adventure.name ? `${adventure.name} · Zoro’s adventure nickname` : ''; $('#group-count').textContent = `${count} / 5`; $('#overall').textContent = `${Object.keys(adventure.completed).length} / 20 COMPLETED`; $('#total').textContent = String(totalPoints(adventure)); $('#objective-text').textContent = adventure.finale && !adventure.practice ? `${adventure.name} found the boat. Every challenge remains open for practice.` : count === 5 && !adventure.crossed.includes(g) ? `Follow the restored ${g === 3 ? 'route to the boat' : 'crossing'}` : `${adventure.practice ? 'Practice ' + Math.min(5, adventure.practice.done.length + 1) + ' / 5 · ' : ''}Help ${adventure.name} find the boat · ${challenges[adventure.current].title}`; const key = `${g}:${count}`; if (world && theme !== key) {
    world.setIsland(g, count,Array.from({length:5},(_,i)=>!!adventure.completed[g*5+i]));
    theme = key;
} world?.setVoyageComplete(adventure.finale); }
function show(content: string, label: string, wide = false) { kind = label; hud(); world?.setMode(started, label === 'Challenge' ? 'Archive puzzle' : label); $('#interact').hidden = true; $('#overlay').innerHTML = `<div class="scrim ${wide ? 'learning-scrim' : ''}"><section class="panel ${wide ? 'workspace' : ''}" role="dialog" aria-modal="true" aria-label="${label}" tabindex="-1"><button id="close" class="close" aria-label="Return to exploration">×</button>${content}</section></div>`; bind('close', close); $('.panel').focus(); }
function close() { if (!adventure.name) {
    naming();
    return;
} kind = ''; $('#overlay').innerHTML = ''; started = true; world?.setMode(true, ''); $('#scene').focus(); hud(); }
let toastTimeout: number;
function toast(text: string) { $('#toast').textContent = text; $('#toast').classList.add('show'); clearTimeout(toastTimeout); toastTimeout = window.setTimeout(() => $('#toast').classList.remove('show'), 5000); }
function naming(rename = false) { show(`<span class="eyebrow">${rename ? 'SAME ADVENTURE. A NEW NAME.' : 'A SWORDSMAN WITH A SMALL DIRECTION PROBLEM'}</span><h2>${rename ? 'What shall we call you?' : 'One boat.<br>Four islands.<br>A few wrong turns.'}</h2><label class="name-label" for="adventurer-name">Choose Zoro’s adventure nickname</label><input id="adventurer-name" autocomplete="off" value="${esc(adventure.name)}" placeholder="1–24 characters"><p id="name-error" role="alert"></p><p>You are choosing a nickname for Zoro’s adventure. His appearance stays Zoro’s; renaming keeps your progress. Luffy is waiting at the boat. Zoro has lost his way again. Help him restore the route by solving the islands’ security challenges.</p><button class="primary" id="save-name">${rename ? 'Save name' : 'Begin the adventure'} →</button>`, 'Name your adventurer'); bind('save-name', () => { const name = validName($<HTMLInputElement>('#adventurer-name').value); if (!name) {
    $('#name-error').textContent = 'Enter a name with 1–24 characters after trimming spaces.';
    return;
} adventure.name = name; store(); rename ? settings() : intro(); }); $('#adventurer-name').addEventListener('keydown', e => { if (e.key === 'Enter')
    $('#save-name').click(); }); }
function intro() { if(adventure.finale){show(`<span class="eyebrow">VOYAGE COMPLETE · PROGRESS SAVED</span><h2>Welcome back,<br>${esc(adventure.name)}.</h2><p>Zoro and Luffy made it aboard. All twenty lessons and restored routes remain available.</p><p>${totalPoints(adventure)} points · ${adventure.practice?'Your island practice is still in progress.':'Your completed adventure is saved.'}</p><button class="primary" id="explore">${adventure.practice?'Resume island practice':'Continue exploring'} →</button><button class="text-button" id="completed-lessons">Review lessons</button><button class="text-button" id="new-voyage">Replay adventure</button>`,'Welcome aboard');bind('explore',close);bind('completed-lessons',map);bind('new-voyage',()=>{resets();$('#reset-all').click();});return;} show(`<span class="eyebrow">TWENTY LITTLE MYSTERIES. ONE WAY HOME.</span><h2>${esc(adventure.name)},<br>the boat is this way.<br>Probably.</h2><p>Luffy is waiting at the boat. Zoro has lost his way again. Help him restore the route by solving the islands’ security challenges.</p><p>Each island has five distinct investigations. Restore all five local landmarks to reconnect its main crossing.</p><div class="notice">Zoro’s adventure nickname: ${esc(adventure.name)}. Four islands, five investigations each. Luffy has promised not to leave without you.</div><button class="primary" id="explore">Set foot on the island →</button><button class="text-button" id="intro-guide">First, explain requests and sessions</button>`, 'Welcome'); bind('explore', close); bind('intro-guide', tutorial); }
function tutorial() { show(`<span class="eyebrow">OPTIONAL FIELD GUIDE</span><h2>A few useful ideas.</h2><details open><summary>Requests, responses and HTTP</summary><p>A browser sends a request: a method, path, headers and sometimes a body. GET reads information; PATCH changes it. The server returns a status, headers and a body. A 200 means success, 401 means sign in, and 403 means permission denied.</p></details><details><summary>Sessions and trust boundaries</summary><p>A session identifies the authenticated user. The server must still decide whether that user may act on each object. Your adventurer’s name is separate from the fictional Operator 104 training account.</p></details><details><summary>Browser code and XSS</summary><p>Text is data. HTML and JavaScript can be instructions. An unsafe sink interprets untrusted data. All executable demonstrations here run in an opaque-origin sandbox, isolated from this app’s storage and document.</p></details><details open><summary>Cache keys, hits, misses and TTL</summary><p>A shared cache stores a response under a key. A MISS asks the origin and stores the result; a HIT reuses it. TTL is how long an entry remains reusable. If response-changing input is absent from the key, one request can contaminate another visitor’s result. Repair the policy and deal with old entries.</p></details><p class="micro">All server operations, uploads, resources and cache entries are local fictional simulations. No request is sent to a real target.</p><button class="primary" id="guide-back">Back to the adventure →</button>`, 'Field guide'); bind('guide-back', () => adventure.name ? close() : naming()); }
function settings() { show(`<span class="eyebrow">MAKE YOURSELF COMFORTABLE</span><h2>${esc(adventure.name || 'Your')}’s adventure.</h2><button class="text-button" id="rename">Change Zoro’s adventure nickname →</button><label class="setting"><span>Reduced motion<small>Stable framing, no ambient sway; skip route animations.</small></span><input id="quiet" type="checkbox" ${comfort.quiet ? 'checked' : ''}></label><label class="setting"><span>Graphics quality</span><select id="quality"><option value="high" ${comfort.quality === 'high' ? 'selected' : ''}>High</option><option value="low" ${comfort.quality === 'low' ? 'selected' : ''}>Low</option></select></label><label class="setting"><span>Reading size</span><select id="text-size"><option value="1">Standard</option><option value="1.15">Larger</option><option value="1.3">Largest</option></select></label><p>Hints carry no score penalty. First completion earns 100 for independent work or 20 for a guided solution. Practice never adds duplicate points.</p><button class="primary" id="settings-done">Back to the adventure →</button>`, 'Settings'); $<HTMLSelectElement>('#text-size').value = String(adventure.textSize); bind('rename', () => naming(true)); bind('quiet', () => { comfort.quiet = $<HTMLInputElement>('#quiet').checked; world?.setComfort(comfort); store(); }); $('#quality').onchange = () => { comfort.quality = $<HTMLSelectElement>('#quality').value as 'high' | 'low'; world?.setComfort(comfort); store(); }; $('#text-size').onchange = () => { adventure.textSize = Number($<HTMLSelectElement>('#text-size').value); store(); }; bind('settings-done', close); }
function stopPending() { view('explore'); clearTimeout(toastTimeout); $('#toast').classList.remove('show'); actionScope.cancel(); world?.cancelRoute(); world?.skipRestoration(); pending = false; $('#cinematic').hidden = true; }
function resets() { stopPending(); show(`<span class="eyebrow">CLEAR CONTROLS. NO SURPRISES.</span><h2>Choose a fresh start.</h2><div class="choices"><button id="reset-lab">Reset this challenge <small>Clear local requests, evidence, files, notices and cache. Keep earned completion.</small></button><button id="replay-island">Replay this island <small>Clear its five labs for practice. Keep permanent routes, completions and points.</small></button><button id="reset-all">Reset all adventure progress <small>Remove completions, route unlocks, points, hint history and location.</small></button></div><button class="text-button" id="reset-back">Keep my adventure</button>`, 'Reset controls'); bind('reset-back', close); bind('reset-lab', confirmLabReset); bind('replay-island',confirmIslandReplay); bind('reset-all', () => { show(`<span class="eyebrow">RESET ALL ADVENTURE PROGRESS</span><h2>Start the whole voyage again?</h2><p>This removes all twenty completions, routes, points, hints, local labs, pending actions, visitor state and current location. Comfort settings stay.</p><label class="setting"><span>Also clear the adventurer’s name</span><input id="clear-name" type="checkbox"></label><button class="primary" id="confirm-reset">Reset all adventure progress</button><button class="text-button" id="cancel-reset">Keep my progress</button>`, 'Confirm full reset'); bind('cancel-reset', close); bind('confirm-reset', () => { const name = $<HTMLInputElement>('#clear-name').checked ? '' : adventure.name; stopPending(); const size = adventure.textSize; adventure = freshAdventure(name); adventure.textSize = size; labs = {}; try {
    localStorage.removeItem('lost-islands-mission-v2');
    localStorage.removeItem('lost-islands-v1');
}
catch { } world?.reset(); theme = ''; store(); name ? intro() : naming(); }); }); }
function confirmLabReset(){stopPending();show('<span class="eyebrow">RESET LOCAL EVIDENCE</span><h2>Reset this investigation?</h2><p>This clears requests, evidence, files, notices and cached responses for this challenge. Earned points, completion and permanent routes stay.</p><button class="primary" id="confirm-lab-reset">Reset this challenge</button><button class="text-button" id="cancel-lab-reset">Keep investigating</button>','Confirm challenge reset');bind('confirm-lab-reset',()=>{labs[adventure.current]=freshLab(adventure.current);store();workspace('Local lab reset. Earned progress is unchanged.');});bind('cancel-lab-reset',()=>workspace());}
function confirmIslandReplay(){stopPending();show('<span class="eyebrow">FIVE FRESH INVESTIGATIONS</span><h2>Replay this island?</h2><p>Clear the five local labs for practice. Keep your nickname, permanent routes, completions and points. Practice cannot award duplicate points.</p><button class="primary" id="confirm-island-replay">Start island practice</button><button class="text-button" id="cancel-island-replay">Keep my investigations</button>','Confirm island replay');bind('cancel-island-replay',close);bind('confirm-island-replay',()=>{const g=Math.floor(adventure.current/5);for(let i=g*5;i<g*5+5;i++)labs[i]=freshLab(i);adventure.current=g*5;adventure.practice={group:g,done:[]};world?.reset();theme='';hud();close();toast('Practice ready. Permanent routes and earned points are preserved.');});}
function map() { show(`<span class="eyebrow">${esc(adventure.name)}’S WAY BACK TO LUFFY</span><h2>Four islands. One familiar ship.</h2>${journeyMap(adventure)}<div class="map-legend"><span>✓ Completed</span><span>● Current</span><span>○ Available</span><span>◌ Locked</span></div><h3 class="lesson-list-heading">Lesson list · choose a destination</h3><div class="island-map">${ISLANDS.map((name,g)=>`<article class="map-island island-${g}"><div class="illustrated-island">${islandIllustration(g)}</div><h3>${name}</h3><p>${groupCount(adventure,g)} / 5 restored · ${adventure.crossed.includes(g)?'crossing restored':unlocked(adventure,g)?'current route':'locked'}</p><div class="challenge-links">${challenges.slice(g*5,g*5+5).map(c=>`<button data-challenge="${c.id}" ${!unlocked(adventure,g)?'disabled':''}>${adventure.completed[c.id]?'✓':adventure.current===c.id?'●':'○'} ${c.title}<small>${adventure.completed[c.id]?.mode||(unlocked(adventure,g)?c.difficulty:'Complete the previous crossing')}</small></button>`).join('')}</div>${groupCount(adventure,g)===5?`<button class="primary" data-cross="${g}">${g===3?'Visit Luffy and the ship':'Follow restored crossing'} →</button>`:''}</article>`).join('')}</div><p class="micro">${Object.keys(adventure.completed).length} / 20 completed · ${totalPoints(adventure)} points · Practice keeps earned rewards.</p><button class="primary" id="map-back">Return to exploration →</button>`, 'World map',true);document.querySelectorAll<HTMLButtonElement>('[data-challenge]').forEach(b=>b.onclick=()=>selectChallenge(Number(b.dataset.challenge)));document.querySelectorAll<SVGGElement>('[data-map-node]').forEach(b=>{const select=()=>selectChallenge(Number(b.dataset.mapNode));b.onclick=select;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}};});document.querySelectorAll<HTMLButtonElement>('[data-cross]').forEach(b=>b.onclick=()=>void crossing(Number(b.dataset.cross)));bind('map-back',close);}
function selectChallenge(id: number) { if (!unlocked(adventure, Math.floor(id / 5))) {
    toast('This island needs its previous crossing restored first.');
    return;
} const old = Math.floor(adventure.current / 5); adventure.current = id; if (old !== Math.floor(id / 5))
    world?.reset(); hud(); close(); world?.goTo(stations[id % 5]); }
function familyTools(c: Challenge, l: Lab) {
    const r = l.request;
    if (c.family === 'idor')
        return `<div class="tool-grid"><label>Authenticated session<select id="user"><option value="operator-104" ${r.user === 'operator-104' ? 'selected' : ''}>Operator 104</option><option value="pearl" ${r.user === 'pearl' ? 'selected' : ''}>Pearl</option><option value="anonymous" ${r.user === 'anonymous' ? 'selected' : ''}>No session</option></select></label><label>${c.id === 3 ? 'Guild / project / invoice query' : c.id === 4 ? 'Document IDs (comma separated)' : 'Requested object identifier'}<input id="path" value="${esc(r.path)}"></label>${c.id === 1 ? `<label>New delivery destination<input id="value" value="${esc(r.value)}"></label>` : ''}</div><p class="micro">${c.id === 1 ? 'PATCH /api/parcels/:id · Body: destination' : c.id === 2 ? 'GET /download/:document · Activity reference: doc-pearl-9f' : c.id === 3 ? 'GET /api/invoices?guild=…&project=…&invoice=…' : c.id === 4 ? 'POST /api/export · Atomic all-or-nothing policy' : 'GET /api/records/:id · 104 belongs to Operator 104; 105 belongs to Pearl'}</p><button class="primary compact" id="run">Send request →</button>`;
    if (c.family === 'xss')
        return `<label class="field">${c.id === 7 ? 'Profile website URL' : c.id === 8 ? 'Browser fragment (location.hash)' : 'Untrusted text / prepared harmless marker'}<textarea id="value" rows="4">${esc(r.value)}</textarea></label><div class="button-row">${c.id === 6 ? '<button id="submit-notice">Store as author</button><button id="visit-notice">Open as separate visitor</button>' : '<button id="run">Render in isolated lab →</button>'}</div><div class="source-trace"><b>Source → destination</b><span>${c.id === 7 ? 'profile.website → href (URL context)' : c.id === 8 ? 'location.hash → innerHTML (browser only; no server reflection)' : c.id === 6 ? 'author → persisted notice → another visitor’s HTML view' : c.id === 9 ? 'rich HTML → rendering / restrictive DOMPurify policy' : 'search input → HTML result page'}</span></div><iframe id="xss-frame" title="Isolated harmless execution laboratory" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe>`;
    if (c.family === 'upload')
        return `<label class="field">Prepared fictional sample<select id="sample">${Object.entries(sampleInfo).map(([key, s]) => `<option value="${key}" ${r.sample === key ? 'selected' : ''}>${s.name} · ${key}</option>`).join('')}</select></label>${c.id === 12 ? `<label class="field">Original filename (metadata, not a trusted path)<input id="value" value="${esc(r.value)}"></label>` : ''}<div id="sample-meta"></div><div class="button-row">${c.id === 14 ? '<button id="upload-submit">Submit sample</button><button id="upload-process">Process next step</button><button id="upload-retrieve">Retrieve preview</button>' : '<button id="run">' + (c.id === 13 ? 'Trace upload → retrieval' : 'Submit prepared sample') + ' →</button>'}</div><p id="processing-state">Processing state: ${esc(l.fileState)}</p><details><summary>Storage inventory</summary><pre>${esc(JSON.stringify(l.files, null, 2))}</pre></details>`;
    return `<div class="tool-grid"><label>Visitor session<select id="user"><option value="operator-104" ${r.user === 'operator-104' ? 'selected' : ''}>Priming visitor</option><option value="visitor" ${r.user === 'visitor' ? 'selected' : ''}>Independent visitor</option></select></label>${c.id === 17 ? `<label>Language preference<select id="language"><option value="en" ${r.language === 'en' ? 'selected' : ''}>English</option><option value="fr" ${r.language === 'fr' ? 'selected' : ''}>French</option><option value="other">Unsupported / normalize</option></select></label>` : c.id === 18 ? `<label>Query parameters<input id="query" value="${esc(r.query)}"></label>` : `<label>${c.id === 16 ? 'Forwarded host' : c.id === 19 ? 'Training resource override' : 'Training announcement header'}<input id="header" value="${esc(r.header)}" placeholder="Empty for a clean visitor"></label>`}</div><div class="button-row"><button id="run">Send through shared cache →</button><button id="clean-visitor">Switch to clean visitor</button><button id="tick">Advance clock +61s</button><button id="purge-now">Clear lab cache</button></div>${c.id === 19 ? '<iframe id="cache-resource-frame" title="Isolated training resource" sandbox="allow-scripts"></iframe>' : ''}<div class="cache-inspector"><b>Cache clock: ${l.now}s · default TTL: 60s</b><pre>${esc(Object.entries(l.cache).map(([k, v]) => `${k}\n${v.body}\nRemaining TTL: ${Math.max(0, v.expires - l.now)}s`).join('\n\n') || 'No cached entries. The first response will be a MISS.')}</pre>${c.id === 18 ? `<p>Cache sees first item: ${esc(new URLSearchParams(r.query).get('item') || 'harbor')} · Origin sees last: ${esc(new URLSearchParams(r.query).getAll('item').at(-1) || 'harbor')}</p>` : ''}</div>`;
}
function readFields() { const l = lab(); for (const key of ['path', 'user', 'value', 'sample', 'language', 'query', 'header'] as (keyof LabRequest)[]) {
    const el = document.getElementById(key) as HTMLInputElement | null;
    if (el)
        l.request[key] = el.value;
} }
function renderSandbox(c: Challenge, l: Lab) {
    const frame = document.getElementById('xss-frame') as HTMLIFrameElement | null;
    if (!frame || !l.last || (l.last.status >= 400 && c.id!==7))
        return;
    let value = c.id === 6 ? l.notices.join('<hr>') : l.request.value, html = '';
    const safe = c.id === 5 ? l.fixes.includes('text') : c.id === 6 ? l.fixes.includes('stored') : c.id===7?l.fixes.includes('scheme'):c.id === 8 ? l.fixes.includes('dom') : l.fixes.includes('sanitize');
    if (c.id === 7) {
        const scriptURL=/^javascript:/i.test(value), action=JSON.stringify(value.replace(/^javascript:/i,'')).replace(/</g,'\\u003c');
        html = safe && !/^https?:/i.test(value) ? '<p>Unsafe URL rejected before activation. No code ran.</p>' : `<p>URL activation simulator: embedded browsers can disable script URLs. This frame models activation; all navigation stays offline.</p><a id="profile-link" href="${esc(value)}">Activate the profile link in this isolated lab</a><p id="activation-result"></p><script>document.getElementById('profile-link').addEventListener('click',function(e){e.preventDefault();${scriptURL&&!safe?`Function(${action})()`:`document.getElementById('activation-result').textContent='Safe destination accepted. No external navigation was made.';`}});<\/script>`;
    }
    else
        html = safe ? (c.id === 9 ? DOMPurify.sanitize(value, { ALLOWED_TAGS: ['b', 'strong', 'em', 'p', 'br', 'ul', 'li'], ALLOWED_ATTR: [] }) : `<pre>${esc(value)}</pre>`) : value;
    if (c.id === 9 && l.fixes.includes('decoy'))
        html = esc(value.replace(/<[^>]*>/g, ''));
    if (c.id === 6 && l.last.status === 201)
        html = '<p>Notice stored. Open as a separate visitor to render it.</p>';
    if (c.id === 8) {
        const literal = JSON.stringify(value).replace(/</g, '\\u003c');
        html = `<div id=echo></div><script>const labURL=new URL('https://lab.invalid/#'+encodeURIComponent(${literal}));const source=decodeURIComponent(labURL.hash.slice(1));document.getElementById('echo').${safe ? 'textContent' : 'innerHTML'}=source;<\/script>`;
    }
    frame.srcdoc = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' ${c.id===7?"'unsafe-eval'":''}; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><style>body{background:#edf2f1;color:#193f4c;font:16px system-ui;padding:15px}a{color:#204f84}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><p>OPAQUE-ORIGIN LAB · ${safe ? 'REPAIRED' : 'VULNERABLE'}</p>${html}`;
}
function workspace(message = '') {
    const c = challenges[adventure.current], l = lab(), id = c.id;
    let body = '';
    if (l.stage === 0)
        body = `<div class="policy-status">${l.fixes.length ? 'Repair controls active: ' + esc(l.fixes.join(', ')) : 'Original vulnerable policy · fictional local lab'}</div><div class="investigation-layout"><div><p>${esc(c.story)}</p><div class="notice"><b>Expected behavior</b><br>${esc(c.expected)}</div><details open><summary>Before you investigate</summary><p>${esc(c.prerequisite)}</p></details><div class="button-row"><button id="case-normal">Load normal-use case</button><button id="case-attack">Load investigation case</button></div>${familyTools(c, l)}</div><aside><h3>Response & evidence</h3><div class="response" aria-live="polite">${l.last ? `<b>${l.last.status} ${l.last.unsafe ? '· Boundary failure observed' : ''}</b><p>${esc(l.last.body)}</p><pre>${esc(JSON.stringify(l.last.headers))}</pre><p>${esc(l.last.trace.join(' → '))}</p>` : 'No request yet. Start with normal use, then change the relevant input.'}</div><p class="check-flags">${l.seenGood ? '✓' : '○'} Normal use observed<br>${l.seenBad ? '✓' : '○'} Vulnerability reproduced</p><details><summary>Evidence history (${l.history.length})</summary><ol>${l.history.map(x => `<li>${esc(x)}</li>`).join('')}</ol></details></aside></div><button class="primary" id="to-cause" ${l.seenGood && l.seenBad ? '' : 'disabled'}>Explain the root cause →</button>`;
    if (l.stage === 1)
        body = `<h3>Why did this happen?</h3><p>Use the evidence, not the name of the vulnerability.</p><div class="choices">${(id % 2 ? [c.falseCause, c.cause] : [c.cause, c.falseCause]).map((text, i) => `<button data-cause="${i}">${esc(text)}</button>`).join('')}</div>`;
    if (l.stage === 2)
        body = `<p>${esc(c.boundary)}</p><h3>Build the repair policy</h3><p>Combine controls that repair the demonstrated data flow. Verification will test the resulting behavior.</p><div class="repair-controls">${c.fixes.map(f => `<label><input type="checkbox" data-fix="${f.id}" ${l.fixes.includes(f.id) ? 'checked' : ''}><span>${esc(f.label)}</span></label>`).join('')}</div><button class="primary" id="apply-fix">Apply policy and inspect verification →</button><details><summary>Why plausible alternatives fail</summary><p>${esc(c.alternatives)}</p></details>`;
    if (l.stage === 3)
        body = `<p>The policy is active in the simulation. Test normal use as well as blocked behavior.</p><button class="primary" id="verify">Run security and normal-use checks →</button><div id="verification-results" aria-live="polite"></div>${l.verified ? '<button class="primary" id="to-debrief">Read the debrief →</button>' : ''}<button class="text-button" id="retest-live">Return to investigation with this policy →</button><button class="text-button" id="back-repair">← Adjust repair policy</button>`;
    if (l.stage === 4)
        body = `<h3>What you found</h3><p>${esc(c.cause)}</p><div class="notice">${esc(c.expected)}</div><details open><summary>Exact evidence and trust boundary</summary><ol>${l.history.map(x => `<li>${esc(x)}</li>`).join('')}</ol><p>${esc(c.boundary)}</p></details><details><summary>Vulnerable versus repaired policy</summary><p>Vulnerable flow: ${esc(c.cause)}</p><pre>${esc(securePolicies[id])}</pre><p>Illustrative policy, not a production backend. The executable local model supplies the checks.</p></details><details><summary>Impact and necessary conditions</summary><p>${esc(c.impact)}</p></details><details><summary>Annotated repair and why it works</summary><p>${esc(c.required.map(r => c.fixes.find(f => f.id === r)?.label).join('. '))}</p><p>The policy is evaluated before releasing or changing protected state. ${esc(c.expected)}</p></details><details><summary>Alternatives, verification, and takeaway</summary><p>${esc(c.alternatives)}</p><p>Retest both the exploit sequence and ordinary use. ${esc(c.takeaway)}</p></details><button class="primary" id="to-transfer">Try a different example →</button>`;
    if (l.stage === 5)
        body = `<h3>Transfer your understanding</h3><p>${esc(c.transfer.q)}</p><div class="choices">${c.transfer.answers.map((a, i) => `<button data-transfer="${i}">${esc(a)}</button>`).join('')}</div>`;
    show(`<div class="workspace-top"><div><span class="eyebrow">${ISLANDS[Math.floor(id / 5)]} · ${id % 5 + 1} / 5 · ${c.difficulty}</span><h2>${esc(c.title)}</h2><p>${esc(adventure.name)}’s local training laboratory · ${adventure.completed[id] ? 'Practice · already completed' : 'First investigation'}</p></div><button id="return-world">Return to exploration →</button></div><div class="lab-steps">${['Discover', 'Explain', 'Repair', 'Verify', 'Debrief', 'Transfer'].map((x, i) => `<span class="${i === l.stage ? 'active' : ''}">${i + 1} ${x}</span>`).join('')}</div>${body}${l.stage > 0 && l.stage !== 4 ? `<details class="persistent-evidence"><summary>Review the investigation evidence</summary><ol>${l.history.map(x => `<li>${esc(x)}</li>`).join('')}</ol></details>` : ''}<div id="feedback" class="feedback" role="status">${esc(message)}</div><div class="workspace-footer"><button id="hint">Ask Pip for a hint (${l.hint}/3)</button><button id="show-solution">Show solution</button><button id="reset-this">Reset this challenge</button></div><div id="hint-text" role="status"></div>`, 'Challenge', true);
    bind('return-world', close);
    bind('reset-this',confirmLabReset);
    bind('case-normal', () => { l.request = preset(id, false); workspace('Normal-use case loaded. Send it to observe expected behavior.'); });
    bind('case-attack', () => { l.request = preset(id, true); if (c.family === 'cache')
        l.cache = {}; workspace(c.family === 'cache' ? 'Prepared priming case loaded; lab cache cleared for a controlled experiment. Send, then switch to a clean visitor and send again.' : 'Investigation case loaded. Trace the changed input and observe the result.'); });
    const perform = (action = 'request') => { readFields(); runLab(id, l, action); store(); workspace(); };
    bind('run', () => perform());
    bind('submit-notice', () => { readFields(); l.request.user = 'author'; runLab(id, l, 'submit'); store(); workspace(); });
    bind('visit-notice', () => { readFields(); l.request.user = 'visitor'; runLab(id, l); workspace(); });
    bind('upload-submit', () => perform('submit'));
    bind('upload-process', () => perform('process'));
    bind('upload-retrieve', () => perform('retrieve'));
    bind('clean-visitor', () => { l.request = { ...preset(id, false), user: 'visitor' }; workspace('Independent clean visitor selected. Send the request through the same cache.'); });
    bind('tick', () => { l.now += 61; workspace('Lab clock advanced. Expired entries will MISS on the next request.'); });
    bind('purge-now', () => { l.cache = {}; workspace('Local cache cleared. This does not repair the response policy.'); });
    bind('to-cause', () => { if (l.seenGood && l.seenBad) {
        l.stage = 1;
        workspace();
    } });
    document.querySelectorAll<HTMLButtonElement>('[data-cause]').forEach(b => b.onclick = () => { if (Number(b.dataset.cause) === (id % 2 ? 1 : 0)) {
        l.reasoned = true;
        l.stage = 2;
        workspace('Correct. Repair the trust boundary you just identified.');
    }
    else
        workspace(`That does not explain the observed response. ${c.prerequisite} Compare the changed input with the returned evidence.`); });
    bind('apply-fix', () => { applyFixes(l, Array.from(document.querySelectorAll<HTMLInputElement>('[data-fix]:checked')).map(x => x.dataset.fix!)); l.stage = 3; workspace('Policy applied. It is not considered correct until the checks pass.'); });
    bind('retest-live', () => { l.stage = 0; workspace('Your repair controls remain active. Re-run the real lab interaction; use Explain to return through the checks.'); });
    bind('back-repair', () => { l.stage = 2; workspace(); });
    bind('verify', () => { const checks = verifyLab(id, l); store(); $('#verification-results').innerHTML = `<ul class="verify-list">${checks.map(x => `<li class="${x.pass ? 'passed' : 'failed'}"><b>${x.pass ? '✓ PASS' : '✕ FAIL'} · ${esc(x.name)}</b><p>${esc(x.actual)}</p></li>`).join('')}</ul>${l.verified ? '<button class="primary" id="verified-next">Read the debrief →</button>' : '<p class="feedback">Some checks failed. Adjust the policy; no completion has been awarded.</p>'}`; bind('verified-next', () => { l.stage = 4; workspace(); }); });
    bind('to-debrief', () => { if (l.verified) {
        l.stage = 4;
        workspace();
    } });
    bind('to-transfer', () => { l.stage = 5; workspace(); });
    document.querySelectorAll<HTMLButtonElement>('[data-transfer]').forEach(b => b.onclick = () => { if (Number(b.dataset.transfer) !== c.transfer.correct) {
        workspace(`Consider the destination and trust policy. ${c.takeaway} No completion was awarded.`);
        return;
    } if (!l.seenBad || !l.seenGood || !l.reasoned || !l.verified) {
        workspace('This lab still needs a demonstrated failure, an explanation, and passing verification.');
        return;
    } completeCurrent(); });
    bind('hint', () => { l.hint = Math.min(3, l.hint + 1); adventure.hints[id] = l.hint; $('#hint-text').innerHTML = `<b>Pip suggests</b><p>${esc(l.stage === 2 ? c.fixes.filter(f => c.required.includes(f.id)).map(f => f.label).join('; ') : l.stage === 3 ? 'Run the checks. Failed rows identify which normal behavior or boundary is still wrong.' : c.hints[l.hint - 1])}</p>`; $('#hint').textContent = `Ask Pip for a hint (${l.hint}/3)`; store(); });
    bind('show-solution', solution);
    if (c.family === 'xss' && l.stage === 0)
        renderSandbox(c, l);
    if (id === 19 && l.stage === 0 && l.last) {
        const frame = $('#cache-resource-frame') as HTMLIFrameElement;
        const resource = l.last.body.includes('/lab/marker.js') ? 'TRAINING RESOURCE MARKER EXECUTED' : l.last.body.includes('/lab/safe.js') ? 'Trusted training resource loaded' : 'Unknown training resource blocked';
        frame.srcdoc = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'"><style>body{font:16px system-ui;background:#edf2f1;color:#1a3f4e;padding:18px}</style><p>Isolated internal resource map — no network request</p><script>document.body.insertAdjacentText('beforeend',${JSON.stringify(resource)});<\/script>`;
    }
    if (c.family === 'upload' && l.stage === 0) {
        const s = sampleInfo[l.request.sample];
        $('#sample-meta').innerHTML = `<div class="notice">Name: ${esc(s.name)} · claimed MIME: ${esc(s.mime)}<br>Signature: ${s.signature ? 'PNG-like' : 'not PNG'} · Full decode: ${s.decode ? 'succeeds' : 'fails'} · Decoded pixels: ${s.pixels.toLocaleString()}<br>Prepared metadata only; no hostile bytes or resource-exhaustion workload is used.</div>`;
        $('#sample').onchange = () => { readFields(); workspace(); };
    }
}
function solution() { show(`<span class="eyebrow">WORKED SOLUTION · HONESTLY ASSISTED</span><h2>Let’s trace it together.</h2><p>The demonstration runs the actual local lab. Guided first completion earns 20 points. Replaying completed content adds no points.</p><button class="primary" id="start-solution">Show the steps →</button><button class="text-button" id="cancel-solution">Return to my investigation</button>`, 'Show solution'); bind('cancel-solution', () => workspace()); bind('start-solution', () => { const used = lab().hint; labs[adventure.current] = freshLab(adventure.current); lab().hint = used; lab().guided = true; guidedStep = 0; demonstrate(); }); }
function demonstrate() {
    const c = challenges[adventure.current], id = c.id, l = lab();
    let text = '';
    if (guidedStep === 0) {
        const clean = freshLab(id);
        l.request = preset(id, false);
        if (id === 14)
            runLab(id, l, 'submit');
        if (id === 14)
            runLab(id, l, 'process');
        runLab(id, l, id === 14 ? 'retrieve' : 'request');
        text = `Normal use: ${l.last?.body}`;
    }
    if (guidedStep === 1) {
        l.fixes = [];
        if (c.family === 'cache')
            l.cache = {};
        l.request = preset(id, true);
        if (id === 6)
            runLab(id, l, 'submit');
        if (id === 14)
            runLab(id, l, 'submit');
        runLab(id, l, id === 14 ? 'retrieve' : 'request');
        if (c.family === 'cache') {
            l.request = { ...preset(id, false), user: 'visitor' };
            runLab(id, l);
        }
        text = `Changed input → separate observation: ${l.last?.body}`;
    }
    if (guidedStep === 2) {
        l.reasoned = true;
        text = c.cause + ' ' + c.boundary;
    }
    if (guidedStep === 3) {
        applyFixes(l, c.required);
        const checks = verifyLab(id, l);
        text = checks.map(x => `${x.pass ? 'PASS' : 'FAIL'}: ${x.name} — ${x.actual}`).join('\n');
    }
    show(`<span class="eyebrow">${esc(c.title)} · STEP ${guidedStep + 1} / 4</span><h2>${['Observe legitimate use', 'Reproduce the vulnerability', 'Explain the failed boundary', 'Apply and verify the repair'][guidedStep]}</h2><pre class="worked-evidence">${esc(text)}</pre><p>${esc(guidedStep === 3 ? c.required.map(x => c.fixes.find(f => f.id === x)?.label).join('. ') : c.prerequisite)}</p>${c.family === 'xss' && guidedStep === 1 ? '<iframe id="xss-frame" sandbox="allow-scripts" title="Isolated harmless execution laboratory"></iframe>' : ''}<button class="primary" id="solution-next">${guidedStep === 3 ? 'Continue to the debrief' : 'Next step'} →</button><button class="text-button" id="solution-exit">Return to exploration</button>`, 'Guided solution', true);
    if (c.family === 'xss' && guidedStep === 1)
        renderSandbox(c, l);
    bind('solution-exit', close);
    bind('solution-next', () => { if (guidedStep < 3) {
        guidedStep++;
        demonstrate();
    }
    else {
        l.stage = 4;
        workspace();
    } });
}
function completeCurrent() { const id = adventure.current, l = lab(), first = completeChallenge(adventure, id, l.guided, l.hint); store(); hud(); world?.celebrate(); const g = Math.floor(id / 5), practice = adventure.practice?.group === g ? adventure.practice : null; if (practice && !practice.done.includes(id))
    practice.done.push(id); const count = practice ? practice.done.length : groupCount(adventure, g); store(); show(`<span class="eyebrow">${first ? 'LOCAL ROUTE ELEMENT RESTORED' : 'PRACTICE COMPLETE'}</span><h2>${esc(adventure.name)},<br>one less wrong turn.</h2><p>${esc(challenges[id].title)} · ${l.guided ? 'Guided solution' : first ? 'Independent solution' : 'Independent practice'}${l.hint ? ' · with requested hints' : ''}</p><div class="score-card"><div><strong>${first ? (l.guided ? 20 : 100) : 0}</strong><small>NEW POINTS</small></div><div><strong>${count} / 5</strong><small>${practice ? 'PRACTICE PROGRESS' : count===5?'ISLAND COMPLETE':'ISLAND PROGRESS'}</small></div></div><p>${first ? 'A local route element is repaired; the pier visibly rebuilds section by section.' : 'Your permanent completion and score are unchanged.'} ${practice ? 'Practice progress is separate; permanent routes stay unlocked.' : count === 5 ? 'All five local challenges are complete. The main crossing is restored.' : 'The ferry connection needs all five local challenges.'}</p><button class="primary" id="next-adventure">${count === 5 ? 'Follow the restored route' : 'Continue the island'} →</button><button class="text-button" id="practice-again">Reset this lab for practice</button>`, 'Challenge complete'); bind('practice-again',confirmLabReset); bind('next-adventure', () => { if (count === 5) {
    adventure.practice = null;
    void crossing(g);
}
else {
    adventure.current = challenges.find(c => Math.floor(c.id / 5) === g && (practice ? !practice.done.includes(c.id) : !adventure.completed[c.id]))!.id;
    close();
    world?.goTo(stations[adventure.current % 5]);
} }); }
async function crossing(g: number) { if (groupCount(adventure, g) !== 5 || pending)
    return; if(!world){toast('Wait for the 3D world to finish loading, then try again.');return;} stopPending(); if(Math.floor(adventure.current/5)!==g){adventure.current=g*5;world.reset();theme='';hud();}if(g===3&&adventure.finale){world.reset();world.setRestored(true);} pending = true; const token = actionScope.token; close(); world?.setMode(false, ''); $('#cinematic').hidden = false; $('#travel-title').textContent = g === 3 ? `${adventure.name} finds the boat.` : `${adventure.name} follows the restored crossing.`; $('#travel-caption').textContent = g === 3 ? 'Twenty mysteries solved. One very relieved navigator.' : `${ISLANDS[g]} → ${ISLANDS[g + 1]}`; $('#skip-route').onclick = () => world?.skipRoute(); $('#route-reset').onclick = resets; const motion = world?.followRoute(g === 3); if (comfort.quiet)
    world?.skipRoute(); await motion; if (!actionScope.isCurrent(token))
    return; pending = false; $('#cinematic').hidden = true; if (!adventure.crossed.includes(g))
    adventure.crossed.push(g); if (g === 3) {
    adventure.finale = true;
    store();
    show(`<span class="eyebrow">20 / 20 · THE BOAT AT LAST</span><h2>${esc(adventure.name)} is aboard.</h2><p>Zoro and Luffy are together aboard. Four restored crossings and twenty security investigations made the way home.</p><p>${totalPoints(adventure)} total points. Every completed challenge remains available for practice.</p><button class="primary" id="final-map">Review lessons →</button><button class="primary secondary" id="final-explore">Explore completed islands →</button><button class="text-button" id="final-replay">Replay adventure</button><button class="text-button" id="reunion-again">Watch the reunion again</button>`, 'Adventure complete');
    bind('final-map', map);
    bind('final-explore',()=>{world?.reset();theme='';close();});
    bind('final-replay',()=>{resets();$('#reset-all').click();});
    bind('reunion-again',()=>{world?.reset();void crossing(3);});
}
else {
    adventure.current = (g + 1) * 5;
    world?.reset();
    theme = '';
    store();
    hud();
    show(`<span class="eyebrow">WELCOME TO ${ISLANDS[g + 1].toUpperCase()}</span><h2>A new shore.<br>A different mystery.</h2><p>${g === 0 ? 'The gardens need safe messages, not browser instructions.' : g === 1 ? 'The harbor needs safe files from upload through retrieval.' : 'The observatory shares cached signals. Keys, visitors and TTL matter here.'}</p><button class="primary" id="new-shore">Explore ${ISLANDS[g + 1]} →</button><button class="text-button" id="shore-guide">Review the field guide</button>`, 'New island');
    bind('new-shore', close);
    bind('shore-guide', tutorial);
} }
async function boot() { try {
    const { GameWorld } = await import('./game-world');
    $('#world-container').innerHTML = '';
    world = new GameWorld($('#world-container'), { interact: id => { const station = stations.indexOf(id); if (station >= 0) {
            adventure.current = Math.floor(adventure.current / 5) * 5 + station;
            workspace();
        }
        else
            tutorial(); }, prompt: id => { const b = $('#interact'); b.hidden = !id || !!kind || pending; if (id) {
            const station = stations.indexOf(id);
            $('#interact span').textContent = station >= 0 ? challenges[Math.floor(adventure.current / 5) * 5 + station].title : 'Read arrival guide';
        } }, story:phase=>{if(['crossing','ferry-boarding','sailing','arrival'].includes(phase)){const lines:Record<string,string[]>={crossing:['The repaired ferry pier.','Five investigations restored five sections. Follow the deck to the ferry.'],'ferry-boarding':['All aboard the cable ferry.','Zoro steps onto a boat. The sea remains impassable.'],sailing:['Across the channel.','The ferry carries Zoro to the visible arrival pier.'],arrival:['A new shore, safely reached.','The next island begins at its arrival dock.']};const line=lines[phase];$('#travel-title').textContent=line[0];$('#travel-caption').textContent=line[1];}else{const line=FINALE_LINES[phase as keyof typeof FINALE_LINES];$('#travel-title').textContent=line.title;$('#travel-caption').textContent=line.caption;}}, ready: () => { }, error: message => { $('#world-container').innerHTML = `<div class="graphics-fallback"><h2>The graphics need a little help.</h2><p>${esc(message)}</p><button id="retry">Reload saved adventure</button></div>`; bind('retry', () => location.reload()); } }, comfort);
    theme = '';
    hud();
    world.setMode(started, kind);
    if(adventure.finale&&!adventure.practice&&Math.floor(adventure.current/5)===3)world.showAboard();
}
catch (error) {
    console.error(error);
    $('#world-container').innerHTML = '<div class="graphics-fallback"><h2>3D graphics could not start.</h2><p>Enable WebGL 2 and browser hardware acceleration, or try another browser. Saved progress is retained. Reload to retry.</p></div>';
} }
document.addEventListener('keydown', e => { if (!kind)
    return; if (e.key === 'Escape') {
    e.preventDefault();
    close();
} if (e.key === 'Tab') {
    const items = Array.from(document.querySelectorAll<HTMLElement>('#overlay button:not(:disabled),#overlay input,#overlay textarea,#overlay select,#overlay summary'));
    const first = items[0], last = items.at(-1);
    if (e.shiftKey && (document.activeElement === first || document.activeElement === $('.panel'))) {
        e.preventDefault();
        last?.focus();
    }
    else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
    }
} });
function positionOverlays() {
    const compact=$('#scene').clientWidth<800, bottom=$('.objective').offsetHeight+34;
    $('.chapter-mark').style.top='';
    for(const selector of ['.touch-pad','.camera-tools']) {
        const el=document.querySelector<HTMLElement>(selector);
        if(el)el.style.bottom=compact?bottom+'px':'';
    }
    $('#interact').style.bottom=compact?(bottom+108)+'px':'';
}
new ResizeObserver(positionOverlays).observe($('.island-label'));
new ResizeObserver(positionOverlays).observe($('#scene'));
new ResizeObserver(positionOverlays).observe($('.objective'));
bind('home', () => adventure.name ? intro() : naming());
bind('map', () => adventure.name ? map() : naming());
bind('tutorial', tutorial);
bind('settings', settings);
bind('resets', resets);
bind('interact', () => world?.interact());
bind('go', () => { view('explore'); if (!adventure.name) {
    naming();
    return;
} const g = Math.floor(adventure.current / 5); if (groupCount(adventure, g) === 5 && !adventure.crossed.includes(g)) {
    void crossing(g);
    return;
} world?.goTo(stations[adventure.current % 5]); });
hud();
adventure.name ? intro() : naming();
void boot();

// Touch controls share the keyboard movement vector and stop on release/cancellation.
$('#scene').insertAdjacentHTML('beforeend','<div class="touch-pad" aria-label="Touch movement"><button data-walk="0,-1" aria-label="Walk up">↑</button><button data-walk="-1,0" aria-label="Walk left">←</button><button data-walk="0,1" aria-label="Walk down">↓</button><button data-walk="1,0" aria-label="Walk right">→</button></div>');
document.querySelectorAll<HTMLButtonElement>('[data-walk]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);const [x,y]=b.dataset.walk!.split(',').map(Number);world?.setTouch(x,y);};for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>world?.setTouch(0,0));});



