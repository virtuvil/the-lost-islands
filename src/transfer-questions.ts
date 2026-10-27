export const transfers: [
    string,
    string,
    string
][] = [
    ['A photo API uses a random ID. What keeps another person’s photo private?', 'Authorize the signed-in user for that photo on the server', 'Only increase the length of the photo ID'],
    ['A calendar API cancels events. What must its update handler check?', 'Permission to cancel the particular requested event before changing it', 'Only whether the caller is signed in'],
    ['A private download URL leaks in an activity feed. What still protects the file?', 'Authorization in the actual download handler, even when the reference is known', 'The fact that the URL was originally hard to guess'],
    ['A team URL contains a task from another project. What must be validated?', 'Requester membership, allowed action and the task’s real project relationship', 'Only that both IDs exist somewhere'],
    ['A batch delete starts with one owned document. What authorizes the rest?', 'Each selected object must pass the policy before an atomic operation proceeds', 'The first permitted document authorizes the whole batch'],
    ['An error page repeats a user-supplied filename. How should it display that value?', 'As text or with output encoding appropriate to the HTML context', 'As trusted HTML because it is only an error message'],
    ['Old product reviews are already in the database. What must a rendering repair cover?', 'Both previously stored reviews and new submissions for every viewer', 'Only reviews submitted after the repair was deployed'],
    ['An avatar-credit field becomes a clickable link. What matters besides escaping HTML?', 'Parse the URL and permit only intended schemes before assigning the attribute', 'Any URL becomes safe if quotation marks are encoded'],
    ['A browser widget reads a query string and writes a DOM node. Where is the important boundary?', 'Between untrusted browser data and a sink that interprets it as markup', 'Only at the server, even when the server never reflects that input'],
    ['A formatted biography needs bold and emphasis. Which policy preserves that legitimate feature?', 'An established sanitizer with a restrictive allowed HTML policy', 'Remove every tag, or keep every tag and rely only on CSP'],
    ['A mobile client bypasses the web file picker. What still enforces supported uploads?', 'Server-side validation of the received content and permitted types', 'The web page’s accept="images" attribute'],
    ['A truncated image has the right magic bytes. What must processing do?', 'Validate complete decoding and enforce decoded resource limits', 'Accept it immediately because the first bytes match'],
    ['Two voice uploads are both named clip.wav. What avoids collision?', 'Unique server-generated storage IDs, with the original name kept only as metadata', 'Store both under the user-supplied filename'],
    ['An attachment passes upload validation. Is that enough to serve active content inline on the application origin?', 'No; retrieval type, disposition and origin isolation are separate policy decisions', 'Yes; anything accepted at upload can safely execute on the app origin'],
    ['A video preview’s processing job failed. When may the preview become public?', 'Only after a successful approved state; failures stay unavailable', 'As soon as a timer has run for a few seconds'],
    ['A visitor-specific experiment header changes a shared banner. What must the cache policy consider?', 'Remove unnecessary influence or use justified bounded variation, and handle stale entries', 'Only lengthen the TTL'],
    ['An untrusted forwarded host changes a redirect. What should generate its destination?', 'Configured canonical URL policy, with only verified proxy metadata trusted', 'Whatever host-like value the request supplies'],
    ['A currency preference changes cached prices. Which key strategy is appropriate?', 'Normalize to supported currencies and vary only on the necessary bounded value', 'Include every arbitrary request header in every cache key'],
    ['A cache and origin choose different duplicate sort parameters. What is a sound repair?', 'Reject ambiguous requests consistently and identify normal responses the same way', 'Change only the visible URL label'],
    ['A shared page’s resource map accepts an unkeyed override. What is required?', 'Trusted resource selection, stale-entry invalidation and a separate-visitor retest', 'Assume a resource is safe whenever its name ends in .js']
];
