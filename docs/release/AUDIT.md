# Local public-release audit

Audited the sanitized reachable Git history and current working files, not only
`git status`. The personal Gmail remains at **zero occurrences** in all local
Git objects (commits, author/committer metadata, messages, blobs and tags), and
in current public files. New own commits use the approved GitHub noreply identity.
No fetch was performed: the remote still has the old private history and must
be sanitized only after separate approval. The private pre-rewrite backup remains
outside the repository and must never be uploaded.

## Private data and secrets

The full reachable blob scan found no private-key headers, recognizable token
patterns, literal credential candidates or personal absolute paths. Email
candidates were reviewed: synthetic `.test`/`.invalid`/example.org fixtures,
public author noreply and upstream license/notices. Exact local checks against
the two private Europass samples find only two historical **SHA-256 strings**
in historical research blob `19ae3f80a612defb2da31a8f336677b1ca71a671`.
These are category A fingerprints, not the original files or contact details;
this previously reviewed history is preserved. No private source PDF, photo,
email, phone, database or academic document is copied into public assets.

Both private acceptance cases pass representative value, contact, photo and
reopen checks locally. Their inputs, filenames, parsed details and logs remain
outside published documentation. The official full author name is expressly
public; this exact name is exempt from the private-name sentinel check, while
emails, source hashes, photos and other private values remain prohibited.

Six screenshot PNGs are explicitly whitelisted in `.gitignore`; no wildcard
unignore exposes private image/output folders. Screenshots use `release-demo.ts`
only: Persona Demo, example.test, synthetic institutions and solid-color photo.
They were inspected visually. Original PDF/private acceptance data are never
used to create the screenshots. No application storage, AppImage, raw acceptance
logs or backup bundle is tracked. Pattern scans are evidence, not a guarantee
against every possible secret format.

## Licensing

[Third-party inventory](../../THIRD_PARTY_NOTICES.md): direct npm dependencies,
Electron/Chromium, SQLite, PDF.js, Liberation Sans and redistributed resources.
The project is GPL-3.0-only, with the official complete GPL v3 text in LICENSE.
MIT, ISC, Apache-2.0 and OFL notices remain available. The saxes 6.0.0 tarball
omitted its license file; the official upstream ISC/inherited notice is restored
in `resources/licenses/saxes-6.0.0-LICENSE` and verified inside the final package.
Electron and Chromium license files are retained. No Europass/UE branding,
unlicensed image, OCR model or translation model is added. This is a scoped
compatibility/notice review, not legal certification of every transitive package.

## Remaining gate

No new privacy blocker was detected. **The selected branding master is missing**;
the provisional package has Electron's default icon. Provide
`assets/branding/icon-master.png` before the final branded artifact is rebuilt,
checksummed and revalidated. No remote history rewrite/push, visibility change,
remote rename, tag or release was executed. Final local receipts are linked in
[VALIDATION.md](VALIDATION.md); all remote/public actions await approval.

[Final local audit receipt](evidence/privacy.json): 91 reachable commits, 855
reachable blobs and 1,398 total local Git objects checked at the recorded HEAD.
All 78 email candidate locations use only synthetic domains or the approved
GitHub noreply. Both exact private acceptance cases pass after the documentation
commits. All 61 local documentation links resolve. No new privacy blocker.
