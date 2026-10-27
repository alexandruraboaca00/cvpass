# Windows 0.2.0 candidate validation

This report distinguishes real CI evidence from unperformed manual acceptance.
Windows 10/11 x64 is not officially supported yet. No 0.2.0 tag/Release/merge.

## Linux regression

Local Linux 0.2.0 AppImage built: 162162672 bytes; SHA-256
`a910874057526fbe9d87de80ef13177f4b97faf1d7067b06272f50ca0a4087dc`.
F1–F9 offline regression: **228 tests PASS** (3 F1 + 192 domain/application/
SQLite + 23 UI/layout + 10 packaged GUI), **33 PDF PASS**, TypeScript/build PASS,
private local acceptance 2/2 PASS. No private fixtures/data added to Git.
AppImage 0.1.0 remains 162162621 bytes with approved SHA-256
`33754ed7bc85eff63c36c1a47164a47df0d4f9babf2b1eabfa6e52db2270070b`;
main/v0.1.0 remain b99efc5. New-version build no longer overwrites root 0.1.0
SHA256SUMS. No benchmark or NF-05 change.

## Windows acceptance matrix

All PASS below mean the stated **automated** evidence, not completed manual
client testing. CI is native windows-latest (Server runner), not
Wine/cross compilation and not manual Windows 10/11 client certification.

| ID | Criterion | CI status | Required evidence |
|---|---|---|---|
| W-01 | Application starts | PASS (CI) | Installed/portable real GUI, sandbox enabled |
| W-02 | SQLite create/open | PASS (CI) | PE AMD64 + Electron N-API 10 + dedicated worker |
| W-03 | Create CV | PASS (CI) | GUI creates synthetic CV |
| W-04 | Confirm/Cancel | PASS (CI) | Cancel preserves exact CV; Confirm persists |
| W-05 | Close/reopen | PASS (CI) | New process compares confirmed data |
| W-06 | Master Profile | PASS (CI) | Existing AC-06 GUI all areas/materialization/independence |
| W-07 | Simple | PASS (CI) | Preview/export + long PDF/48 paragraphs |
| W-08 | Lateral | PASS (CI) | Preview/export + multipage/48 paragraphs |
| W-09 | PDF export | PASS (CI) | Actual files/hash/payload, links, ES/EN/RO, photo |
| W-10 | Own PDF import | PASS (CI) | Empty-library confirmation and reopen |
| W-11 | .cvproj | PASS (CI) | Export/import/reopen with actual Windows files |
| W-12 | Workspace backup | PASS (CI) | Profile/multiple CV/assets/revisions restore |
| W-13 | Photo/assets | PASS (CI) | GUI AC-06 upload; backup/photo references retained |
| W-14 | Languages | PASS (CI) | Portable suite + AC-05 GUI sensitive/manual workflows |
| W-15 | Installer | PASS (CI) | Actual NSIS /S per-user installation, unsigned check |
| W-16 | Uninstaller | PASS (CI) | Actual uninstall; library checksum retained |
| W-17 | Portable | PASS (CI) | Actual portable EXE, ordinary roaming library |
| W-18 | Offline | PASS (CI) | OS per-exe egress rule, TCP blocked, zero HTTP |
| W-19 | Linux ↔ Windows | PASS (CI) | Native Linux corpus -> Windows -> fresh Linux comparison |
| W-20 | GUI/scale | PASS (CI) | 1366x768/1920x1080 at 1/1.25/1.5; bounds/screenshots |

## Actual findings / retained attempts

- Initial native run 40481853856: 16 resource-integrity test failures because
  Windows checkout changed hashed OFL.txt to CRLF. Fixed by .gitattributes;
  hash/resource versions were not weakened or replaced.
- Run 40482435882: the actual native Electron/SQLite probe passed (Electron
  44.7.2, runtime Node 24.21.0, N-API 10, SQLite 3.53.4), then harness cleanup
  failed deleting Electron's live session directory. Probe temp is now left to
  runner teardown after process exit; no application behavior changed.
- Run 40483458057: native build produced NSIS/portable; Linux->Windows project,
  workspace and PDF imports passed; per-user install passed. Firewall setup then
  rejected a mixed-separator path. Normalized the test path, retained real egress
  blocking; this was not an app networking failure.
- Run 40484367864 superseded/cancelled by a newer fixture correction. A local
  diagnostic caught that the synthetic project had no existing link; the URL test
  now explicitly creates a new link. No product data or acceptance criteria changed.
- Local full packaged smoke (Linux diagnosis only): Confirm/Cancel, both PDF
  templates, all 48 paragraphs, long URL/margins/glyphs/links, empty-library PDF/
  project/workspace restore and reopen PASS. This is not Windows evidence.

## Manual acceptance still required

Follow [TESTING.md](TESTING.md) on real Windows 10 and Windows 11 with a standard
non-admin user. Installer/SmartScreen/native dialogs, independent PDF reader,
actual monitor scaling/taskbar/shortcuts, airplane mode, uninstall/reinstall and
portable need a recorded user decision before official support. No WCAG/PDF-UA,
universal Windows hardware compatibility or production code signing is claimed.

## Current conclusion

**WINDOWS PORT READY FOR MANUAL VALIDATION**.

Native run [40488843555](https://github.com/alexandruraboaca00/cvpass/actions/runs/40488843555)
is fully green: Linux export, Windows, Linux reimport. Code commit
`053fe81faa99f8068a9a566459b8a3f0baff0570`; any following commit in this task changes
documentation/evidence only. Windows Server 2025 (`windows-latest`) is explicitly
not a Windows 10/11 client. 84 portable tests and 4 GUI tests PASS, no GUI skips,
flaky cases or errors. Smoke verifies 2 preview/export pairs and 2 long PDFs,
48 paragraphs, bounds, long URL, ES/EN/RO, links and photo. Software scales
100/125/150% and both requested sizes pass bounds and visual capture checks.

## Candidate artifacts (unsigned; Actions only)

| File | Bytes | SHA-256 |
|---|---:|---|
| CVPass-0.2.0-win-x64-Setup.exe | 141506322 | `972b547a0a776e2676035677c6e8299bfb613b9ed4cbf5d349600e7553b70b45` |
| CVPass-0.2.0-win-x64-Portable.exe | 141189862 | `7e5ea986ea634aee5607a1432a4245305ef8f39098e8264d6d520a6ce3358c73` |

Download **cvpass-windows-x64-candidate** from the green run above, not failed or
intermediate runs. SHA-256 values were computed on Windows after packaging.
Raw smoke/native/interop proofs, GUI report and synthetic screenshots are in the
Actions artifact (14-day retention). Selected sanitized evidence is in
[evidence](evidence/windows-smoke-summary.json): [native](evidence/native.json),
[artifacts](evidence/artifacts.json), [portable](evidence/portable.json),
[Linux→Windows](evidence/linux-to-windows.json),
[Windows→Linux](evidence/windows-to-linux.json).

Actual native SQLite: PE AMD64, Electron 44.7.2/runtime Node 24.21.0/N-API 10,
SQLite 3.53.4; packaged native directory contains only win32-x64.node. Both
installer artifacts are verified NotSigned. Uninstaller retained the exact DB
hash; Portable reopened that same ordinary roaming library without data beside exe.

## Portable IPC defect fixed

Runs 40486403291 / 40487494302 reached Portable, which opened its window but
returned IPC_SENDER_REJECTED. The actual temporary file URL used a Windows 8.3
alias and differed from Node's spelling. Main now captures Chromium's URL **once
after its explicit loadFile completes**. IPC still requires exact captured URL,
exact webContents and main frame; navigation/popups remain blocked. It does not
accept arbitrary file origins or weaken isolation. Unit tests reject uninitialized,
remote and different-file origins; installed and Portable workflows pass. Linux
regression was rerun in full after this runtime correction.

The Firewall harness also needed a valid non-loopback unicast scope; failed setup
attempts are retained in CI history. No networking check or product protection
was removed to obtain the green run. SmartScreen/native interactive file pickers,
physical taskbar/monitor appearance and real-client offline testing remain manual.

No main merge, 0.2.0 tag/Release, 0.1.0 mutation or F10. Official Windows support
still awaits the user's completed manual Windows 10 and 11 acceptance.


## Regression evidence / delivery

[Final Linux receipt](evidence/linux-regression.json): 228 tests + 33 PDF after the
Portable IPC correction; both private local acceptance files remain outside Git.
The earlier pre-correction Linux run was 226 tests, 33 PDF, AppImage 162158403
bytes / `52ee90e643d39b625f086e24bdf4cc655c56cc2ee527193f80af80745ddf2ad1`.
That earlier hash is not the final development AppImage. Published 0.1.0 is unchanged.
[Privacy scan](evidence/privacy.json): personal Gmail remains zero; no new secrets
or private binaries tracked. The two approved historical PDF digest strings stay
historical fingerprints only, never original PDF content.

Candidatas are delivered as the green run's **Actions artifacts**, not a public
Release. Source, checksums, proofs and screenshots are pinned to that run. Manual
validation must use those artifacts, never an older failed-run download. The
local attempt to retrieve the full Windows ZIP was diagnostic; it is not evidence
of a different Windows build or a reason to reuse an intermediate checksum.
