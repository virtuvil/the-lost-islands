export type Fix = 'login' | 'random' | 'owner';
export const records = [{ id: 104, owner: 'operator-104', title: 'My tide journal', body: 'Tuesday: the sea returned my hat. Suspiciously polite.' }, { id: 105, owner: 'pearl', title: 'Pearl’s private letter', body: 'Secret: I have been teaching the lighthouse to waltz.' }];
export function request(id: number, user: string | null, fixed: boolean) {
    if (!user)
        return { status: 401, body: 'Sign in to open the archive.' };
    const record = records.find(r => r.id === id);
    if (!record)
        return { status: 404, body: 'No such record.' };
    if (fixed && record.owner !== user)
        return { status: 403, body: 'This record belongs to another resident. Access denied.' };
    return { status: 200, body: record.body, title: record.title, owner: record.owner };
}
export function score(hints: number, accessible: boolean, skipped: boolean, clues: number, quiz: boolean) { const levels = [100, 85, 70, 50]; return (skipped ? 20 : levels[accessible ? 0 : Math.min(3, Math.max(0, hints))]) + Math.min(1, Math.max(0, clues)) * 10 + (quiz ? 15 : 0); }
export const recap = [
    ['What happened?', 'You signed in as Operator 104 and changed /records/104 to /records/105. The archive returned Pearl’s private letter.'],
    ['Meet IDOR', 'Insecure Direct Object Reference means an app accepts an object identifier without checking whether you may access that object. An ID identifies a record; it does not grant permission.'],
    ['Why did it work?', 'The server checked that Operator 104 was signed in, but never checked that the requested record belonged to that operator. Authentication answers “Who are you?” Authorization answers “May you open this?”'],
    ['The repair', 'On the server, load the record and compare its owner with the trusted signed-in user. Return 403 before sending private data when they differ. For shared records, check the real permission policy instead.'],
    ['Prove it stays fixed', 'Test your own record (200), someone else’s record (403), and an anonymous request (401). Also test other IDs and every read or write route. Hidden buttons and hard-to-guess IDs do not replace authorization.']
];
export const hints = [['The board lists two neighboring record numbers.', 'Does Pearl’s record open with your session?', 'Send 104, then change the ID to 105 and send again.'], ['Signing in is only half the question.', 'Connect record ownership to the trusted session.', 'Choose “Check record ownership on the server.”'], ['A good repair also preserves allowed access.', 'Try your record, Pearl’s, and no session.', 'Run the remaining tests: expect 200, 403 and 401.']];
