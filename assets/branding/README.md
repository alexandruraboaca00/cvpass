# CVPass branding source — selected option 1

The final approved master is **not present**. Place it at:

`assets/branding/icon-master.png`

Supply the actual selected option 1: overlapping blue CV sheets, white front
sheet, simplified avatar/content lines and a blue circle with a white check.
Use a square PNG, ideally 1024×1024, with the intended transparency. No Europass
or EU emblem. Do not substitute an invented design or trace a raster into SVG.

Then run `npm run branding:prepare`. It creates symbol-only PNG icons at 16, 24,
32, 48, 64, 128, 256, 512 and 1024 pixels under `assets/icons/`. The packager and
window pick them up when available. Until then builds are explicitly provisional
and retain Electron's default icon. No false CVPass logo is provided.

An optional approved horizontal wordmark may be supplied separately as
`assets/branding/cvpass-horizontal.png`. SVG is accepted only with a genuine
vector source. Copyright © 2026 Alexandru David Raboaca Neagu; project-owned
assets are GPL-3.0-only. Confirm provenance before adding any supplied asset.
