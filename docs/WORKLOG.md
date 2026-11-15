# Worklog

- 2026-11-15 11:32 +03 | v0.1 | Extracted monthly archive HTML/PDF report builder and added tests for both report sections, counts and escaping of customer-supplied HTML; CI run 43694551097 in progress | src/archive.js, tests/firestore.rules.test.js | Next: verify CI result; perform real browser print/save/confirm/retry QA without production data.

- 2026-11-15 11:27 +03 | v0.1 | Latest CI passed: 10/10 Firestore Emulator tests (including month-end/leap-year boundaries) and Vite build; Hosting and Firestore production deployment skipped as intended | GitHub Actions run 43694085194 | Next: browser print-to-PDF workflow QA in a non-production environment; production rules untouched.

- 2026-11-15 11:25 +03 | v0.1 | Corrected month eligibility to add one calendar month with end-of-month clamping (Jan 31 → Feb 28; Feb 28 → Mar 28; leap-year Feb 29 → Mar 29); added boundary tests, CI run pending | src/archive.js, tests/firestore.rules.test.js | Next: verify boundary test/build; browser print-to-PDF QA; no live deployment.

- 2026-11-15 11:23 +03 | v0.1 | Expanded Firestore Emulator suite passed 9/9 tests and Vite production build passed; Firebase rules publish and Hosting deploy were skipped on version branch | GitHub Actions run 43693914852 | Next: perform browser PDF print/save/confirm/retry QA; keep production rules untouched until release approval.

- 2026-11-15 11:20 +03 | v0.1 | Added isolated Firestore Emulator security tests; initial 7/7 suite passed, expanded suite covers immutable archive month and append-only audit logs and is running; no live deployment | tests/firestore.rules.test.js, firebase.json, package.json, .github/workflows/build-check.yml | Next: confirm expanded CI, then perform browser PDF workflow QA; live Firebase rules remain untouched.

- 2026-11-15 11:17 +03 | v0.1 | Hardened archive rules: fixed malformed rule text, made archiveMonth immutable, made audit logs append-only, required confirmed marker and 28-day minimum age for deletion; made archive cleanup resumable and aligned month eligibility to one calendar month | firestore.rules, src/archive.js | Next: run expanded emulator tests and inspect print-to-PDF flow.

- 2026-11-15 11:09 +03 | v0.1 | GitHub Actions build checks passed for monthly archive integration; Firestore rules remain undeployed and require Firebase testing | Actions runs 43693304878, 43693310375, 43693338747, 43693345217 | Next: validate Firestore rules and archive/purge flow in Firebase before any release.

- 2026-11-15 11:09 +03 | v0.1 | Implemented Staff Admin month-wise print-ready archive, browser Save-as-PDF flow, staff save confirmation, archive marker, batched source purge and Firestore age/marker guards; no server PDF storage | src/archive.js, src/admin.js, src/admin.css, src/main.js, firestore.rules, package.json | Next: verify CI; test Firestore rules and archive workflow before any release.


- 2026-11-15 10:30 +03 | v0.1 | Recorded one-calendar-month retention, monthly PDF download to staff PC, explicit save confirmation and post-confirmation Firestore purge; no server-side PDF storage | docs/PRD.md, docs/DECISIONS.md, docs/PROJECT_SUMMARY.md, docs/memory/context.md, docs/memory/open-questions.md, docs/versions/v0.1-foundation.md | Next: implement safe monthly archive/export workflow; never purge before confirmed download.


- 2026-11-15 10:22 +03 | v0.1 | Corrected enquiry status rollback to restore the actual previous status if the atomic update/audit batch fails | src/admin.js | Next: verify latest build checks; then continue with enquiry views and role testing.

- 2026-11-15 10:18 +03 | v0.1 | Added serviceType classification (umrah/hotel/combined/general), admin display, append-only audit rules and atomic audit writes for hotel publication/enquiry status changes | src/main.js, src/admin.js, firestore.rules | Next: verify CI; complete remaining role and workflow review.

- 2026-11-15 10:12 +03 | v0.1 | GitHub Actions build checks completed successfully on version/v0.1-foundation; no live deploy occurred | CI workflow, docs/versions/v0.1-foundation.md | Next: inspect admin/public behavior and complete Firestore role/data authorization review.

- 2026-11-15 10:08 +03 | v0.1 | Denied permanent deletion of customer enquiries in Firestore rules; version branch CI remains build-only | firestore.rules | Next: validate build and review role/data rules.

- 2026-11-15 10:08 +03 | v0.1 | Created version/v0.1-foundation from rebuild/firebase-foundation; changed CI so version branches run build checks but do not deploy to live | .github/workflows/build-check.yml | Next: inspect baseline, review security rules, implement/test safe fixes.
- 2026-11-15 10:08 +03 | PRD reconstruction | Consolidated existing PROJECT_BLUEPRINT.md and confirmed decisions into docs/PRD.md and project workflow docs | docs/PRD.md, docs/PROJECT_SUMMARY.md, docs/DECISIONS.md, docs/WORKLOG.md, docs/CHANGELOG.md, docs/versions/v0.1-foundation.md, docs/memory/context.md, docs/memory/open-questions.md | Next: present version plan and await approval.
