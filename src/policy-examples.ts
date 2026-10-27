/** Illustrative policies. Executable simulation and verification live in labs.ts. */
export const securePolicies = [
    'user = requireSession(request)\nrecord = loadRecord(id)\nrequire(record.ownerId === user.id)\nreturn record',
    'parcel = loadParcel(id)\nrequire(can(session.user, "update", parcel))\ntransaction(() => parcel.destination = destination)',
    'document = loadByReference(reference)\nrequire(can(session.user, "download", document))\n// Both archive UI and direct-download route call this policy.',
    'require(memberCan(user, guild, "read-invoice"))\nrequire(project.guildId === guild.id)\nrequire(invoice.projectId === project.id)\nreturn invoice',
    'documents = loadAll(ids)\nrequire(documents.every(d => can(user, "export", d)))\n// Atomic policy: no partial bytes leave on denial.\nreturn exportAll(documents)',
    'resultLabel.textContent = searchTerm\n// Server-rendered alternatives must encode for their output context.',
    'for (notice of persistedNotices) renderAsText(notice.body)\n// Apply to old entries as well as new submissions.',
    'url = parseURL(profile.website)\nrequire(["http:", "https:"].includes(url.protocol))\nanchor.setAttribute("href", url.href)',
    'source = decode(fragment)\necho.textContent = source\n// Browser-only source; the server never sees the fragment.',
    'safe = DOMPurify.sanitize(html, {\n  ALLOWED_TAGS: ["b", "strong", "em", "p", "br", "ul", "li"],\n  ALLOWED_ATTR: []\n})\nrenderPermittedHTML(safe)\n// CSP is additional protection, not the repair.',
    'require(serverAllows(actualContentType))\n// The browser accept attribute is only a convenience.',
    'require(allowedMetadataAndContent(file))\nimage = decodeFullImage(file)\nrequire(image.pixels <= budget && processingWithinLimit)\n// A signature alone does not establish a valid bounded image.',
    'key = serverGeneratedUniqueId()\nstoreUnderControlledRoot(key, bytes)\nmetadata.originalName = escapedDisplayName\n// Client filename never chooses the storage path.',
    'require(approvedPassiveType(file))\nserveFromIsolatedMediaOrigin(file, {\n disposition: "attachment", nosniff: true\n})\n// Upload acceptance and response delivery are distinct policies.',
    'file.state = "pending"\nvalidateWithinBudget(file).then(result => {\n file.state = result.approved ? "approved" : "rejected"\n}).catch(() => file.state = "failed")\nrequire(file.state === "approved") // before retrieval',
    'response = canonicalAnnouncement()\n// Remove unnecessary untrusted header influence.\ninvalidateAffectedEntries()',
    'redirect = configuredCanonicalOrigin + "/home"\n// Do not trust arbitrary forwarded-host input.\ninvalidateAffectedEntries()',
    'language = normalizeToSupported(request.language, ["en", "fr"])\nkey = path + "|language=" + language\n// Bounded variants; no unbounded arbitrary-header key expansion.\ninvalidateOldKeyPolicyEntries()',
    'require(query.getAll("item").length === 1)\n// Reject ambiguity before both cache lookup and origin handling.\nkey = canonicalQuery(query)\ninvalidateAmbiguousEntries()',
    'resource = trustedResourceMap["main"]\n// Ignore the unkeyed resource override.\ninvalidatePoisonedPage()\nverifyPrimeThenSeparateVisitor()'
];
