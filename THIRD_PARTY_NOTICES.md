# Third-party notices — CVPass 0.1.0

Copyright © 2026 Alexandru David Raboaca Neagu. CVPass source is GPL-3.0-only.
Third-party components retain their own licenses; the application license does
not replace their copyright notices. The public release is Linux x86_64 only.

## Direct runtime dependencies

| Component | Version | License | Purpose |
| --- | --- | --- | --- |
| @tiptap/core | 3.32.0 | MIT | Rich text |
| @tiptap/extension-list | 3.32.0 | MIT | Semantic lists |
| @tiptap/pm | 3.32.0 | MIT | ProseMirror integration |
| @tiptap/react | 3.32.0 | MIT | React integration |
| @tiptap/starter-kit | 3.32.0 | MIT | Limited editor extensions |
| better-sqlite3 | 13.0.3 | MIT | SQLite worker binding |
| fflate | 0.8.3 | MIT | Portable archive support |
| parse5 | 8.0.1 | MIT | Imported HTML parser |
| pdf-lib | 1.17.1 | MIT | PDF payload attachment |
| pdfjs-dist | 6.4.299 | Apache-2.0 | PDF viewer/import inspection |
| react | 19.3.1 | MIT | Interface |
| react-dom | 19.3.1 | MIT | Interface rendering |
| saxes | 6.0.0 | ISC | Namespace-aware XML parsing |
| zod | 4.6.7 | MIT | Domain validation |

## Runtime and resources

- Electron **44.7.2**: MIT; bundles Chromium/Node and other components with their
  own licenses. The distributed Linux runtime retains **LICENSE.electron.txt**
  (builder name) and **LICENSES.chromium.html**. These are part of the AppImage,
  not replaced by CVPass's LICENSE. Source/provenance: the versioned
  [Electron repository](https://github.com/electron/electron/tree/v44.7.2).
- SQLite: public-domain upstream code; bundled through better-sqlite3, whose
  MIT license must also be retained. See the installed package license and
  [SQLite copyright statement](https://www.sqlite.org/copyright.html).
- Liberation Sans **2.1.5**, regular/bold/italic/bold-italic: **SIL OFL-1.1**,
  unmodified files. Full notice: [resources/fonts/OFL.txt](resources/fonts/OFL.txt).
- CV templates, CSS and synthetic demo content are project-authored. No Europass
  or EU branding/assets are included.
- The final CVPass icon master has not yet been supplied. No alternative logo
  has been invented; the provisional package uses Electron's default icon.
- No ONNX/model weights, OCR models or production translation models are bundled.
  The F1 exploration does not authorize redistribution of its separate weights.

## Build/test tools (not application functionality)

Electron-builder 26.15.3, Vite 8.3.4 and the installed @types packages: MIT.
TypeScript 7.0.2 and @playwright/test 1.64.1: Apache-2.0. Sources and dependency
versions are fixed in package-lock.json. Tool-only dependencies are not all
runtime dependencies. Test fixtures use synthetic data only.

## Redistribution

The reviewed direct licenses (MIT, ISC, Apache-2.0, OFL-1.1, SQLite public domain)
do not identify an incompatibility with GPL-3.0-only. Keep their full notices,
including those of bundled dependencies/runtime, when redistributing. The
AppImage inventory is checked separately; this direct audit is not a legal
certification of every transitive component. Distribute the matching CVPass
source and build instructions under GPL-3.0-only with the binary; keep upstream
license/source obligations of bundled runtime components. Do not publish private
CVs, validation databases, backup bundles or historical Git email inventories.

Primary compatibility references: [GNU license list](https://www.gnu.org/licenses/license-list.html)
and [Apache's GPL compatibility statement](https://www.apache.org/licenses/GPL-compatibility).
