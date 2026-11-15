# Project Summary — Al Naseem Group

- Goal: premium Bahrain Umrah website with separate hotel booking/enquiry and secure `/admin` CMS.
- Repo: `unifairtrading/al-naseem`; active branch: `version/v0.1-foundation`; live site: https://al-naseem-d40c8.web.app.
- Backend: Firebase Auth, Firestore, Hosting. Firebase Storage/Cloud Functions billing requires approval before enabling.
- Roles: user = Super Admin + Developer; company staff = Staff Admin.
- Staff may directly publish permitted business content; client is responsible. Audit records track changes.
- Monthly retention: staff create a print-ready PDF, save/check it on the company PC and explicitly confirm; only then can eligible records be purged. No PDF is stored on the server.
- Hotel management and customer enquiry inbox are present in the version branch; enquiries are classified as Umrah, hotel, combined or general.
- Archive report and purge now use a consistent month key, including fallback to `createdAt` for legacy records without `archiveMonth`.
- Latest CI runs 43695325809 and 43695337944 passed (Firestore Emulator tests + production build). Version branch does not deploy; live Hosting and Firestore rules remain untouched.
- Remaining v0.1: real browser PDF workflow QA and public/admin baseline review. Remaining roadmap: secure staff provisioning, Umrah/content CMS, separate booking workflows, feedback and launch QA.
- No paid billing, production data edits, merge to `main`, or live deployment without explicit approval.
- Reconstructed PRD and decisions are in `docs/PRD.md`, `docs/DECISIONS.md`; unresolved items in `docs/memory/open-questions.md`.
