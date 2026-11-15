# Project Summary — Al Naseem Group

- Goal: premium responsive Bahrain Umrah website plus secure /admin CMS.
- Repo: unifairtrading/al-naseem; working branch: rebuild/firebase-foundation; live Hosting URL: https://al-naseem-d40c8.web.app.
- Backend: Firebase Auth, Firestore and Hosting. Storage/Cloud Functions billing needs confirmation.
- Roles: user = Super Admin + Developer; company staff = Staff Admin.
- Staff can directly edit and publish permitted business content (contact/WhatsApp/email, address/map, packages, banners) without Super Admin approval. Client is responsible for staff publishing decisions. Important edits need audit logs.
- Hotel enquiry/booking is separate from Umrah.
- Existing foundation includes public site, admin login/dashboard, hotel management and enquiry inbox. Verify code and CI before assuming deployment status.
- Remaining: package CMS, feedback moderation, content editor, staff account provisioning/permissions, audit log, security/rules tests, mobile QA and launch checks.
- No paid billing, domain purchase, production data edits or merge to main without explicit approval.
- PRD reconstructed from PROJECT_BLUEPRINT.md and confirmed conversation decisions; open items are in memory/open-questions.md.
- Next: review proposed version plan and approve v0.1 before implementation.