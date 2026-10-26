# Public CVPass screenshots

Only synthetic data may appear here. Planned images: `library.png`, `profile.png`,
`editor.png`, `simple.png`, `lateral.png`, `preview.png`. They must be captured
from the renamed real GUI, never from private acceptance documents or databases.
The screenshot script/validation report records the fixture and capture method.
No real email, phone, address, academic identifier, source PDF or private file
path may be visible. Screenshots are project-authored and GPL-3.0-only.

All six images were captured from the actual CVPass AppImage by
`scripts/release-compatibility.mjs`, using `tests/release-demo.ts` (Persona Demo,
example.test contacts, synthetic institutions and synthetic solid-color photo).
They are lossless Playwright PNGs, not mockups or generated logo assets. No
private acceptance library or private PDF is used. Simple/Lateral are PDF.js
canvas captures of the actual generated PDFs.

The final branded AppImage is rechecked with the same synthetic fixture. The
window icon is verified against the official 256px pixels through X11; the
page screenshots do not include window decorations or a provisional icon.
No private photo is substituted for the synthetic solid-color demo photo.
