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

`out/f9/CVPass-0.1.0-x86_64.AppImage`: **162,162,621 bytes**.

SHA-256: `33754ed7bc85eff63c36c1a47164a47df0d4f9babf2b1eabfa6e52db2270070b`.

[Two-build receipt](evidence/reproducibility.json): two sequential independent
full `npm run package:appimage` runs, each rebuilding TypeScript/Vite and AppImage,
fixed SOURCE_DATE_EPOCH 1792756800, Electron 44.7.2, builder 26.15.3. The full
artifact bytes match. No concurrent dist rebuild was used for this proof.
The old CVForge checksum was not reused. [SHA256SUMS](../../SHA256SUMS).

The approved master and horizontal logo are now supplied. [Branding receipt](evidence/branding.json)
checks the original RGBA PNGs and nine transparent derivatives. Originals remain
byte-for-byte unchanged. The non-square master is centered on transparent padding
and resized at best quality, without distortion/cropping. AppStream was absent,
not claimed. Linux icon/desktop keys remain historical; the visible icon is CVPass.

### Previous provisional artifact (history preserved)

Before the supplied assets, the candidate used Electron's default icon:
159,776,605 bytes, SHA-256
`e4be32c6d27d5fd9dec210026d765869855510003999353a4313a71775dbc125`.
It was NOT READY because the master was absent. That gate is now resolved.
Its receipts remain under [previous-unbranded](evidence/previous-unbranded/reproducibility.json),
separate from the new final candidate. No old checksum is reused.

## Performance and outstanding limits

No F9 benchmark was repeated and no marker/threshold changed. Official NF-05
startup A/B/C remain 3075.6 / 2995.8 / 2935.0 ms against the explicitly revised
3200 ms limit; Confirmar 284.2 / 280.3 / 275.1 ms, combined 283.0 ms against
300 ms. Historical results remain in F9 documents. The 50-revision diagnostic
316.6 ms and global history read/copy debt remain outside the acceptance corpus.

The branding gate is resolved. Final readiness is determined by the branded
regression and privacy audit below. Remote sanitization/publication require separate
approval; neither was attempted. See [preparation](PREPARATION.md),
[compatibility identifiers](REBRANDING.md), [audit](AUDIT.md) and
[third-party notices](../../THIRD_PARTY_NOTICES.md).

Final [legacy compatibility receipt](evidence/compatibility.json) and
[normal FUSE receipt](evidence/fuse.json) both PASS for the same final AppImage.
Six public screenshots were reviewed: Library, Master Profile, Editor, Simple,
Lateral and Preview. The official icon is now supplied and integrated.

## Official asset integration

Master: 1297×1212; wordmark: 1983×793, RGBA PNG with transparent corners.
Nine derivatives: 16/24/32/48/64/128/256/512/1024. The source is padded to a
1297px transparent square before resizing, never stretched or artistically
modified. The original hashes in `evidence/branding.json` remain unchanged.
The window uses 256px; the Linux packager uses the full icon directory and
preserves the historical desktop icon key. README EN/ES use the wordmark at
420px width, not a replacement text/logo. No AppStream file existed.

No NF-05 benchmark was repeated for this asset integration. All product content,
format/schema versions and renderers remain unchanged. The new build contains
only the intended branding resource/packaging differences.

## Final branded candidate — PASS

[Regression receipt](evidence/regression.json): F1–F9 **222 tests PASS**, 23 GUI
and 10 packaged GUI without skips/flaky cases, **33 PDF PASS**, TypeScript/build
PASS. Preview/export hash identity, Simple clock-date-only equivalence, Lateral,
portable PDF, `.cvproj`, profile independence, workspace backup/restore, assets,
drafts and revisions remain validated. The two private Europass samples also
pass the separate isolated [private acceptance](evidence/private-acceptance.json),
with no private values published. This separate run is explicit: the first full
branded pipeline invocation did not set its optional private-input environment
variable, so it did not execute that additional acceptance stage.

[Compatibility](evidence/compatibility.json) and [normal FUSE](evidence/fuse.json)
PASS on the same branded SHA-256. The actual X11 window icon matches the official
256px image after standard alpha representation conversion. The test initially
hit xprop's default 250KB property truncation and then compared premultiplied
nativeImage BGRA against straight-alpha X11 ARGB. The reader now requests enough
bytes and compares associated-alpha pixels with one-byte rounding tolerance.
These were test assumptions, not product/design changes; failed local logs remain.
The AppImage desktop icon matches an official derivative byte-for-byte; all nine
packaged icon files match source hashes, and the Electron default icon is absent.

Public screenshots were regenerated from this candidate and use the same synthetic
fixture, never the private acceptance PDFs. READMEs use the supplied horizontal
logo via a relative path; all 68 local links/image paths resolve. User-visible
GUI branding is CVPass. Historical PDF metadata/format and data-path CVForge
identifiers remain deliberately preserved, as classified in REBRANDING.md.

Conclusion: **READY FOR REMOTE SANITIZATION AND PUBLIC RELEASE**.
This is readiness only: no fetch, push/force push, remote rename, visibility
change, tag or GitHub Release was performed. The branch remains unmerged and
F10 is not started. All remote/public actions still require user approval.
