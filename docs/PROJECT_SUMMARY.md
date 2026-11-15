# Project Summary — Al Naseem Group

- Goal: premium responsive Bahrain Umrah website plus secure /admin CMS.
- Repo: unifairtrading/al-naseem; active version branch: version/v0.1-foundation; base: rebuild/firebase-foundation.
- Live Hosting URL: https://al-naseem-d40c8.web.app. Version branch is build-only; it must not deploy to live.
- Backend: Firebase Auth, Firestore and Hosting. Storage/Cloud Functions billing needs confirmation.
- Roles: user = Super Admin + Developer; company staff = Staff Admin.
- Staff directly edit and publish permitted business content without Super Admin approval; client is responsible for staff publishing decisions. Keep audit records.
- Hotel enquiry/booking is separate from Umrah.
- Existing foundation: public site, admin login/dashboard, hotel management and enquiry inbox.
- Remaining: stabilize security and login; staff account provisioning; package/content CMS; feedback; audit log; separate enquiry workflows; QA.
- No paid billing, domain purchase, production data edits or merge to main without explicit approval.
- PRD reconstructed from PROJECT_BLUEPRINT.md and confirmed decisions; open items in memory/open-questions.md.
- v0.1 started: CI workflow now runs build checks on version branches without deploying them. Next: inspect/fix confirmed baseline issues and verify CI.
