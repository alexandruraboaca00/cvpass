# Contributing to CVPass

Use Linux x86_64, Node/npm compatible with the lockfile and a graphical desktop
for Electron/UI tests. Start with:

```sh
npm ci
npm run setup:electron
npm run build
npm start
```

Check changes with `npm test`, `npm run typecheck` and `npm run build`.
`npm run test:f9:ui` requires a desktop and the packaged artifact;
`npm run package:appimage` creates a local AppImage and never publishes it.
See [release preparation](docs/release/PREPARATION.md) for isolated acceptance.

Open an issue describing the problem, expected behavior, app version and Linux
environment, with **synthetic reproduction data**. For pull requests, describe
the change, scope and tests. Keep domain, UI, storage and rendering separate;
preserve offline behavior, durable confirmation and file compatibility.

Never upload real CVs, private PDFs/XML, photos, SQLite databases, credentials,
private backup bundles or personal logs as fixtures. Redact screenshots and use
`.test`/`.invalid` contacts. Report security concerns following [SECURITY.md](SECURITY.md).
Contributions are provided under [GPL-3.0-only](LICENSE), retaining third-party notices.
