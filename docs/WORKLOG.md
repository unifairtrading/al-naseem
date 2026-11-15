# Worklog

- 2026-11-15 11:15 +03 | v0.1 | Implemented Staff Admin month-wise print-ready archive, browser Save-as-PDF flow, staff save confirmation, archive marker, batched source purge and Firestore age/marker guards; no server PDF storage | src/archive.js, src/admin.js, src/admin.css, src/main.js, firestore.rules, package.json | Next: verify CI; test Firestore rules and archive workflow before any release.


- 2026-11-15 10:30 +03 | v0.1 | Recorded one-calendar-month retention, monthly PDF download to staff PC, explicit save confirmation and post-confirmation Firestore purge; no server-side PDF storage | docs/PRD.md, docs/DECISIONS.md, docs/PROJECT_SUMMARY.md, docs/memory/context.md, docs/memory/open-questions.md, docs/versions/v0.1-foundation.md | Next: implement safe monthly archive/export workflow; never purge before confirmed download.


- 2026-11-15 10:22 +03 | v0.1 | Corrected enquiry status rollback to restore the actual previous status if the atomic update/audit batch fails | src/admin.js | Next: verify latest build checks; then continue with enquiry views and role testing.

- 2026-11-15 10:18 +03 | v0.1 | Added serviceType classification (umrah/hotel/combined/general), admin display, append-only audit rules and atomic audit writes for hotel publication/enquiry status changes | src/main.js, src/admin.js, firestore.rules | Next: verify CI; complete remaining role and workflow review.

- 2026-11-15 10:12 +03 | v0.1 | GitHub Actions build checks completed successfully on version/v0.1-foundation; no live deploy occurred | CI workflow, docs/versions/v0.1-foundation.md | Next: inspect admin/public behavior and complete Firestore role/data authorization review.

- 2026-11-15 10:08 +03 | v0.1 | Denied permanent deletion of customer enquiries in Firestore rules; version branch CI remains build-only | firestore.rules | Next: validate build and review role/data rules.

- 2026-11-15 10:08 +03 | v0.1 | Created version/v0.1-foundation from rebuild/firebase-foundation; changed CI so version branches run build checks but do not deploy to live | .github/workflows/build-check.yml | Next: inspect baseline, review security rules, implement/test safe fixes.
- 2026-11-15 10:08 +03 | PRD reconstruction | Consolidated existing PROJECT_BLUEPRINT.md and confirmed decisions into docs/PRD.md and project workflow docs | docs/PRD.md, docs/PROJECT_SUMMARY.md, docs/DECISIONS.md, docs/WORKLOG.md, docs/CHANGELOG.md, docs/versions/v0.1-foundation.md, docs/memory/context.md, docs/memory/open-questions.md | Next: present version plan and await approval.
