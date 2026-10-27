# Manual Windows 10/11 x64 acceptance (required before official support)

Use a standard non-administrator account on real Windows 10 and Windows 11.
Record edition/build, CPU/RAM, display resolution and scale, artifact SHA-256,
branch/run/commit. CI's Windows Server runner is not a substitute for these clients.

1. Download the candidate Actions artifact ZIP. Extract it and use PowerShell
   `Get-FileHash .\CVPass-0.2.0-win-x64-Setup.exe -Algorithm SHA256`; compare
   `SHA256SUMS`. No public 0.2.0 Release exists yet.
2. Record signature/SmartScreen/Unknown Publisher behavior. The candidate is
   unsigned. Do not disable protections or use bypass scripts. If policy blocks
   execution, report that blocker rather than claiming installation passed.
3. Install per-user without admin, choose directory, check Start Menu/desktop
   icons, launch CVPass 0.2.0. No Linux-emulated folders or blank-library surprise.
4. Create a synthetic CV, add email a@example.test, confirm. Edit b@example.test,
   Cancel; a remains. Edit b again, Confirm, close/reopen; b remains.
5. Open Master Profile, populate synthetic entries, create independent CVs.
6. Photo select/preview/replace/cancel; education/work dates, skills/groups,
   languages including one single CEFR score, certifications/projects/customs.
7. Simple and Lateral preview/export: multi-page/48 paragraphs, lists, long URL,
   ES/EN/RO glyphs and photo; compare preview/export hashes, open in a separate
   Windows PDF reader. Test native Open/Save pickers and cancel, including paths
   with spaces/diacritics and a name already ending .pdf or .cvproj (no duplicates).
8. Linux .cvproj and own PDF -> Windows review/import/reopen; Windows exports ->
   Linux import/reopen. Workspace backup -> empty test library restore. Never
   replace a real library silently; retain a private backup first.
9. Disconnect network (airplane mode/unplug) and repeat create/edit/confirm,
   preview/export/import and reopen. Test at 100%,125%,150% and 1366x768/1920x1080;
   inspect modals, labels, scroll, focus/keyboard and taskbar icons.
10. Close and uninstall; verify app/shortcuts removed and `%APPDATA%\CVPass`
    library retained. Reinstall and confirm old synthetic data. Run Portable
    without installation/admin: same roaming-data policy, no library beside exe.

Record W-01…W-20 PASS/FAIL with evidence and errors. No real CV/DB/photo in public
issues/artifacts. Only sanitized reports/synthetic screenshots. Mark missing
client tests **not validated**, not PASS; do not announce official Windows support
until the user approves completed manual results. No tag/release/merge here.
