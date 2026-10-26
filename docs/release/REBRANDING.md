# CVForge → CVPass compatibility classification

Public product: **CVPass 0.1.0**, Alexandru David Raboaca Neagu, GPL-3.0-only.
No format/schema/template version is changed for branding.

| Class | Reference | Decision |
| --- | --- | --- |
| A public | Window/header/dialogs, productName, package name/description/author/license | CVPass; package `cvpass`, version 0.1.0 |
| A public | AppImage and user-selected default export filenames | CVPass prefix |
| B technical | `window.cvforge`, IPC channels, diagnostics/performance marks/env vars | Retain; invisible contract/test compatibility |
| C persistent | `org.cvforge.desktop`, Linux executable `cvforge`, generated `cvforge.desktop`/icon key | Retain stable installation identity; desktop displayed Name is CVPass |
| E data path | `appData/CVForge`, library SQLite/assets/backups/browser session | Explicitly preserve before Electron ready and the single-instance lock; honor existing `--user-data-dir` override |
| D format | `cvforge-project`, creator `CVForge`, cvproj v1 | Keep the strict existing codec readable in both directions |
| D format | `cvforge-pdf-data`, `cvforge-export-payload`, `cvforge-data.json`, import kinds/template IDs | Retain old PDF detection and payload contracts |
| F frozen renderer | CVForge PDF Creator/Producer/attachment description and `CVForgeSans` font family | Technical historical renderer identity retained so Simple/Lateral v1 and PDF content do not change for a rename |
| F evidence | Phase reports, frozen benchmark runner/digests, pre-branding examples/artifact names | Historical CVForge evidence retained, never relabeled as new validation |

No migration/copy of the user's library is needed: CVPass opens the exact same
historical data directory. New users also use that stable storage identity.
The GUI profile, CVs, drafts, revisions, assets and ExportRecord use unchanged
repositories/schema. Existing backups and source PDFs are not modified in place.
A real old/new packaged-process acceptance and independent portable imports are
required; results are recorded in PREPARATION.md, not inferred from these names.

The remote remains `cvforge` until separately approved. Do not fetch the remote's
unsanitized old history. Local sanitized main starts at `b22c2f9`; old SHA strings
inside phase evidence remain historical references. Private backup bundles and
email/identity inventories must never be committed or published.
