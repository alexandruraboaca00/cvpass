# CVPass 0.1.0 release-preparation validation

This is local preparation on `release-v0.1.0`, based on sanitized main `b22c2f9`.
No fetch, push, remote rename, publication, tag, GitHub Release or F10 was performed.

## Executed regressions

The complete `validate:f9:offline` pipeline passed against the notice-complete
CVPass AppImage: **222 tests** (3 F1, 186 domain/application/SQLite, 23 GUI/layout,
10 packaged GUI), with no skipped/flaky/retried UI tests. **33 PDF cases** passed
(26 Simple/Lateral F8 plus 7 Simple F7). TypeScript and build passed. Both private
Europass samples passed local value/contact/photo checks, without publishing them.
The packaged GUI covers profile materialization/independence, workspace backup
and restore, import review, Confirm/Cancel, drafts, revisions, assets, portable
PDF/projects and matching preview/export hashes. Privacy sentinel checks pass.
Simple remains byte-equivalent to its reference except the existing PDF clock
dates; no renderer, pagination, snapshot, domain or SQLite schema was changed.

[Network receipt](evidence/network.json): only loopback for local CDP, no routes,
zero capabilities, external connection ENETUNREACH. All pipeline stages passed
inside that isolated environment, including import, rendering, preview and export.
[Package receipt](evidence/package.json) verifies standalone contents and sandbox.
Normal host FUSE mounting is checked separately from extract-and-run fallback.

## Historical CVForge compatibility

The actual preserved CVForge AppImage creates a synthetic library using its
normal `XDG_CONFIG_HOME/CVForge` location. CVPass opens that same SQLite library
without a userData override or copying files. Checks include profile, six CVs,
assets, pending draft recovery, revisions and ExportRecord; a GUI edit persists
after closing/reopening. Old CV project, PDF and workspace exports are imported
into independent empty libraries and reopened. Project content is compared after
normalizing newly assigned IDs/import provenance; the PDF visible projection is
compared in full, and workspace snapshot/blobs are compared exactly.

The compatibility harness initially made two incorrect assertions: it looked for
ordinary edit history in a filtered linguistic-revision list, and compared an
absent importRecords property to an empty list after excluding new import
provenance. Both test assumptions were corrected; no application behavior was
changed. Failed attempts remain in local logs. A compile-time optional icon
property issue was corrected before the final production build. Public screenshots
were recaptured from actual PDF.js canvas pixels to avoid viewport clipping.

## Artifact and reproducibility

`out/f9/CVPass-0.1.0-x86_64.AppImage`: **159,776,605 bytes**.

SHA-256: `e4be32c6d27d5fd9dec210026d765869855510003999353a4313a71775dbc125`.

[Two-build receipt](evidence/reproducibility.json): two sequential independent
AppImage packaging runs from the same validated compiled production inputs,
fixed SOURCE_DATE_EPOCH 1792756800, Electron 44.7.2, builder 26.15.3. The full
artifact bytes match. No concurrent dist rebuild was used for this proof.
The old CVForge checksum was not reused. [SHA256SUMS](../../SHA256SUMS).

The artifact is technically validated but has the default Electron icon. The
approved master is not available: place it at `assets/branding/icon-master.png`,
run `npm run branding:prepare`, rebuild twice and update checksums/evidence.
No substitute logo or fake vector was made. AppStream was absent, not claimed.

## Performance and outstanding limits

No F9 benchmark was repeated and no marker/threshold changed. Official NF-05
startup A/B/C remain 3075.6 / 2995.8 / 2935.0 ms against the explicitly revised
3200 ms limit; Confirmar 284.2 / 280.3 / 275.1 ms, combined 283.0 ms against
300 ms. Historical results remain in F9 documents. The 50-revision diagnostic
316.6 ms and global history read/copy debt remain outside the acceptance corpus.

Public-release readiness is **NOT READY FOR PUBLIC RELEASE** while the selected
branding master is missing. Remote sanitization/publication also require separate
approval; neither was attempted. See [preparation](PREPARATION.md),
[compatibility identifiers](REBRANDING.md), [audit](AUDIT.md) and
[third-party notices](../../THIRD_PARTY_NOTICES.md).

Final [legacy compatibility receipt](evidence/compatibility.json) and
[normal FUSE receipt](evidence/fuse.json) both PASS for the same final AppImage.
Six public screenshots were reviewed: Library, Master Profile, Editor, Simple,
Lateral and Preview. The only missing visual asset is the approved app icon.
