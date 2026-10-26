# CVPass 0.1.0 — local public-release preparation

This is release preparation, **not F10**, a remote rename, publication, tag or
GitHub Release. Version stays 0.1.0. The sanitized local base is `b22c2f9`;
the remote still holds the old history. Do not fetch it or push without approval.

## Public repository plan (not executed)

Recommended final name: `cvpass`, under the current owner's account. First obtain
approval for remote history sanitization; then separately approve the GitHub
repository rename/visibility and release. Only after a real rename, update the
local origin URL to the approved `.../cvpass.git`. No command is executed here.
README EN/ES use relative links; no speculative download badge or nonexistent
release URL is advertised. Review issue/security reporting settings before going
public. There is no designated private security email/channel yet.

Never upload the original Git backup bundle, private mailmap/email inventories,
real CVs/PDF/XML/photos, acceptance databases, app profiles or raw private logs.
The local backup intentionally retains old private metadata. Historical SHA
strings inside phase evidence still describe their original measurements.

## Compatibility and user data

[Classification](REBRANDING.md). Names are changed only at public boundaries.
The data directory stays `appData/CVForge`; no file copy or silent reset occurs.
`appId`, executable/desktop identity, SQLite migrations/schema, formats, payloads,
renderer/template versions and IPC remain stable. Normal custom userData override
continues working. Assets, drafts, revisions, workspace and ExportRecord use the
existing adapters. PDF content/rendering is frozen; default output filenames change.

`scripts/release-compatibility.mjs` launches the preserved original CVForge
AppImage, creates/imports the synthetic `tests/release-demo.ts` workspace, edits,
exports PDF/CV/workspace, preserves a durable pending draft and closes. It then
launches CVPass with the **same XDG config and no userData override**, checks the
old SQLite/profile/assets/history/draft/receipt, edits through the GUI, confirms
and reopens. Old exports are independently imported/reopened in empty libraries;
workspace snapshots/blobs and retained history are compared exactly.

An initial harness assertion expected ordinary edit history in the filtered
linguistic-revision API. It was corrected to verify full workspace history;
no product behavior was changed to hide that harness error. Both logs remain local.

## Compatibility matrix

| Input | State |
| --- | --- |
| CVForge/CVPass `.cvproj` CV | Supported complete declared CV project |
| `.cvproj` workspace | Supported declared backup; explicit restore/replace safeguards |
| Own compatible editable PDF | Supported visible exported version only |
| Own PDF without payload | Valid PDF; no structured recovery in MVP |
| Tested structured Europass PDF/XML | Partial supported subset, review required |
| Generic text PDF | Not supported for editable reconstruction |
| Scanned PDF / OCR | Future phase, not MVP |
| Future/incompatible format | Explicit rejection, no destructive save |
| Corrupt/oversize/ambiguous input | Controlled error/review, no partial confirmed CV |

## Branding gate

**Missing selected master:** place the approved option 1 PNG at
`assets/branding/icon-master.png` (ideally 1024×1024). Run `npm run branding:prepare`
then rebuild twice and revalidate package/screenshots/checksum. No substitute logo
or fake SVG is created. Pending wordmark: optional `assets/branding/cvpass-horizontal.png`.
The provisional AppImage still uses Electron's icon. Do not treat it as the final
public branded artifact while this is pending. No AppStream metadata existed;
none is claimed as validated. The generated .desktop name is CVPass, while its
technical key/executable remain cvforge for compatibility.

## Licensing and author

GPL-3.0-only, official full GNU GPL v3.0 in LICENSE, author/copyright Alexandru
David Raboaca Neagu. [Third-party inventory/notices](../../THIRD_PARTY_NOTICES.md).
Reviewed direct dependencies retain MIT/ISC/Apache-2.0 notices; SQLite public-domain
and Liberation Sans OFL-1.1 remain. Electron/Chromium license files stay packaged.
No unlicensed logo, Europass resource or translation/OCR model weight is added.
This is a reasonable direct/resource audit, not a transitive legal certification.

## Validation

Commands actually available: `npm test`, `npm run typecheck`, `npm run build`,
`npm run package:appimage`, `npm run test:f9:ui`, `npm run validate:f9:offline`.
GUI acceptance runs under Xvfb/Openbox, with data on SSD outside the checkout.
Network isolation: user/network namespace, loopback only for local CDP, drop
capabilities, no external routes and ENETUNREACH test. Do not turn off the sandbox
in the real packaged application. Synthetic PDFs/profiles only are used for tests;
the two private Europass samples are local additional acceptance, never fixtures.

NF-05 and official F9 A/B/C remain unchanged and are **not rerun** for a rename.
History debt remains: 50 revisions, Confirmar p95 316.6 ms, outside the official
acceptance corpus; global history reads/copies need later optimization.

Final results, artifact, checksums, reproducibility, screenshots and audit receipts
are recorded below after execution. The final publication gate also requires the
selected branding master and separate user approval of remote actions.

Executed results: [validation and artifact](VALIDATION.md), [privacy/license audit](AUDIT.md).
