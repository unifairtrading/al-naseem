# Project Summary — Al Naseem Group

- Goal: premium responsive Bahrain Umrah website plus secure /admin CMS.
- Repo: unifairtrading/al-naseem; active version branch: version/v0.1-foundation; base: rebuild/firebase-foundation.
- Live Hosting URL: https://al-naseem-d40c8.web.app. Version branch is build-only; it must not deploy to live.
- Backend: Firebase Auth, Firestore and Hosting. Storage/Cloud Functions billing needs confirmation.
- Roles: user = Super Admin + Developer; company staff = Staff Admin.
- Staff directly edit/publish permitted business content without Super Admin approval; client is responsible. Enquiries/audit grouped monthly; archive screen opens print-ready report (browser Save as PDF), staff save/check/confirm on PC, then purge from Firestore. Confirmed archive marker + 28-day minimum age required by rules; no server PDF storage. Confirmation is staff attestation.
- Hotel enquiry/booking is separate from Umrah.
- Existing foundation: public site, admin login/dashboard, hotel management and enquiry inbox.
- Implemented in v0.1 branch: build-only CI, classified enquiries, atomic audit logs, Staff Admin monthly print-to-PDF archive panel, explicit save confirmation, marker-gated batch purge and 28-day minimum age rule. Expanded isolated Firestore Emulator suite passed 9/9 tests; build also passed in CI. Firestore rules have not been deployed or tested against the live database.
- No paid billing, domain purchase, production data edits or merge to main without explicit approval.
- PRD reconstructed from PROJECT_BLUEPRINT.md and confirmed decisions; open items in memory/open-questions.md.
- Archive feature implemented in version branch and build checks passed. Added exact month-end/leap-year eligibility logic; the expanded 10-test Emulator suite and production build passed. Extracted PDF report generation into a testable function and added content/count/XSS-escaping tests; latest CI is running. Real browser print/save/confirm QA and separately approved safe Firebase release test remain; no live deployment.
- Remaining: test browser PDF flow and (only after approval) deploy rules, separate enquiry views/filters, staff account provisioning, editable Umrah packages/business content, feedback moderation and QA. No live deploy or merge to main.
