# Project Summary — Al Naseem Group

- Goal: premium responsive Bahrain Umrah website plus secure /admin CMS.
- Repo: unifairtrading/al-naseem; active version branch: version/v0.1-foundation; base: rebuild/firebase-foundation.
- Live Hosting URL: https://al-naseem-d40c8.web.app. Version branch is build-only; it must not deploy to live.
- Backend: Firebase Auth, Firestore and Hosting. Storage/Cloud Functions billing needs confirmation.
- Roles: user = Super Admin + Developer; company staff = Staff Admin.
- Staff directly edit and publish permitted business content without Super Admin approval; client is responsible for staff publishing decisions. Keep audit records.
- Hotel enquiry/booking is separate from Umrah.
- Existing foundation: public site, admin login/dashboard, hotel management and enquiry inbox.
- Implemented in v0.1 branch: build-only CI, enquiry deletion denial, serviceType classification (umrah/hotel/combined/general), append-only audit logs for hotel publishing and enquiry status changes (atomic writes). Latest CI for UI/audit commits is still running; rules commit passed.
- No paid billing, domain purchase, production data edits or merge to main without explicit approval.
- PRD reconstructed from PROJECT_BLUEPRINT.md and confirmed decisions; open items in memory/open-questions.md.
- Remaining: verify latest CI, test rules in deployed environment, separate enquiry views/filters, staff account provisioning, editable Umrah packages/business content, feedback moderation, full audit viewer, QA. No live deploy or merge to main.
