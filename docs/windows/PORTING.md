# Windows 0.2.0 port (not F10)

Development branch `windows-support-v0.2.0`, based on published main `b99efc5`.
Linux 0.1.0/tag/assets stay intact. 0.2.0 is not released. Windows 10/11 x64 is
**not officially supported until final real-client manual validation**.

## Packaging and identity

One electron-builder config adds NSIS x64 and portable x64. NSIS is assisted,
per-user, no requested elevation, optional install directory, Start Menu/desktop
shortcuts. `deleteAppDataOnUninstall: false`; CI checks library retention. Portable
extracts runtime temporarily but uses ordinary roaming data, never data beside
its exe. `org.cvforge.desktop` remains the stable app ID/NSIS upgrade GUID input
and Windows AppUserModelID. No aesthetic rename of schemas, project/payload IDs,
Linux executable/desktop key or user data. ICO is a genuine multi-image container
of the approved transparent 16/24/32/48/64/128/256 PNGs, not a renamed PNG.

Targets: `CVPass-0.2.0-win-x64-Setup.exe` and
`CVPass-0.2.0-win-x64-Portable.exe`; candidates are Actions artifacts only.
No Store/MSIX/MSI, ARM/32-bit, macOS, updater, new template or F10.

## SQLite: why npmRebuild remains false

The locked **better-sqlite3 13.0.3** uses node-addon-api/N-API 10 and ships
`prebuilds/win32-x64.node`, unlike historical V8-ABI-only releases. Its published
`gypfile:false`/binding.gyp deliberately skips compilation when a prebuild exists.
The loader selects by actual platform/architecture. Blind rebuilding would add
unneeded tooling/risk to already validated Linux packaging. We retain
`npmRebuild:false`, validate MZ/PE AMD64 and N-API >=10, and **actually open,
write, close and reopen SQLite under Electron 44.7.2**. Installed-app smoke
repeats the real dedicated-worker path and verifies only the x64 Windows native
binary is unpacked. No Linux .node is accepted as evidence of Windows support.
For a future dependency without compatible N-API prebuilds, use a native Windows
Electron-target rebuild (e.g. electron-builder install-app-deps/@electron/rebuild),
then repeat these gates. A successful installer alone never proves ABI support.

Primary sources: [locked upstream package](https://github.com/WiseLibs/better-sqlite3/blob/v13.0.3/package.json),
[binding selection](https://github.com/WiseLibs/better-sqlite3/blob/v13.0.3/lib/binding.js),
[N-API definition](https://github.com/WiseLibs/better-sqlite3/blob/v13.0.3/binding.gyp),
[Electron native modules](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules).

## Paths / files / guarantees

Windows: `%APPDATA%\CVPass\library\library.sqlite3`; Electron session/cache in
`%APPDATA%\CVPass`. No Linux-emulated paths. Linux still uses
`app.getPath('appData')/CVForge`. An explicit --user-data-dir remains available
for isolated tests. Portable/installer share the standard data policy.

Storage guard uses path.relative with platform separators/case/drive handling.
POSIX chmod is meaningful on Linux; Windows permissions are inherited user ACLs,
not an assertion that Unix mode bits provide Windows ACL isolation. Reparse/symlink
checks remain. SQLite keeps **WAL/FULL**, transactions, revision/draft resolution
before acknowledgement; no performance marker or durability setting changes.
File export flushes the temporary file, then publishes atomically in the same
folder. Linux still fsyncs the parent directory. Node Windows cannot open/sync a
directory, so that POSIX-only step is skipped there: no claim of identical
power-loss namespace guarantees on Windows. Disk/write errors still propagate;
no false success. Project input rejects symlinks and checks opened-file identity.
Absolute local paths never enter portable project/payload identity.

A real initial Windows CI failure found Git CRLF conversion of hashed OFL.txt.
.gitattributes now preserves exact font/resource bytes; the hash checks were not
relaxed. All template/font/resource versions and formats stay unchanged.

## CI / unsigned candidate

Windows builds execute on windows-latest, npm ci, Node 26.12.1/npm 12.2.1,
Electron 44.7.2/builder 26.15.3. Actions pinned by commit; permissions read-only;
no release upload. Tests cover portable domain suite, real Electron native
probe, actual per-user installation, packaged UI/PDF/project workflows, GUI
profile/language/keyboard, uninstall retention, portable launch. Synthetic data
only. Build requires network to download dependencies; installed runtime does not.

Candidates are **unsigned**. SmartScreen/Unknown Publisher may appear; that alone
is not corruption. Verify checksum; do not disable/bypass protection. No certificate
was purchased or invented. Future approved signing can use builder's standard
protected CSC_LINK/CSC_KEY_PASSWORD secrets; never commit credentials.

See [validation](VALIDATION.md) and [manual testing](TESTING.md).

## Interoperability / offline / GUI scope

A Linux job renders synthetic PDFs using the real Chromium renderer and exports
complete projects/workspace. Native Windows imports and reopens each, comparing
full declared project/workspace and visible PDF projections. Windows then exports
its own files, which a fresh Linux job imports/reopens and compares. No real CV
is used or uploaded. Linux's fixture-rendering harness uses --no-sandbox in CI;
this is not evidence of packaged sandbox behavior. The installed product smoke
uses sandbox enabled and the actual Windows SQLite worker.

Windows installed-app egress is blocked by an OS firewall rule for routable non-loopback IPv4/IPv6 unicast
addresses; CDP remains loopback-only. A real main-process TCP connection is checked
not to succeed before workflows run; renderer HTTP requests must remain zero.
This does not disconnect the whole runner (which must upload test artifacts).
Portable's network-free behavior and OS airplane-mode tests remain manual checks.
UI automation captures 1366x768/1920x1080 at forced scale 1/1.25/1.5, checks modal
bounds/overflow, and exercises existing keyboard/profile/translation tests. This
is not client-monitor certification or a claim of complete accessibility/PDF-UA.


## Portable origin correction

Real Portable execution exposed an IPC URL comparison defect with Windows 8.3
extraction paths. The trusted address is now captured from the exact main frame
after the explicitly selected loadFile completes, rather than reconstructed from
Node's spelling. The webContents/frame identity checks and exact URL match remain;
untrusted navigation and windows are still denied. Both native Portable and full
Linux regression pass. This is a port bug fix, not a new renderer capability.
