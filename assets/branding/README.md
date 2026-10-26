# Official CVPass branding — selected option 1

The two user-supplied approved originals are preserved byte-for-byte:

- `icon-master.png`: 1297×1212 RGBA PNG, symbol only.
- `logo-horizontal.png`: 1983×793 RGBA PNG, symbol and CVPass wordmark.

Both have transparent corners/background; there is no opaque black/white
rectangle. The white front document belongs to the design. No artistic changes,
new logo or fake SVG were made. The source vector is not supplied.

Run `npm run branding:prepare` to produce 16, 24, 32, 48, 64, 128, 256, 512 and
1024px square PNGs under `assets/icons/`. Because the master is not square, the
utility centers it on a transparent 1297px square before high-quality resizing.
It preserves the aspect ratio and transparency, without cropping the artwork.
The original file is never overwritten. `scripts/release-branding-check.cjs`
validates PNG signatures, alpha, dimensions and transparent corners via Electron.

The 256px derivative is used by the Electron window; electron-builder uses the
same derived set for the AppImage and Linux desktop icon. Historical app ID,
executable and desktop/icon key remain unchanged for compatibility. README EN/ES
use the original horizontal logo at a bounded display width, with relative paths.

Copyright © 2026 Alexandru David Raboaca Neagu. User-approved project branding,
distributed under GPL-3.0-only with the project; no Europass/UE emblems or resources.

The supplied originals retain C2PA/OpenAI provenance chunks (no email or local
personal path found). No hand-drawn/vector origin is claimed. Technical icon
derivatives do not copy the original metadata chunks.
