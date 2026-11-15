# Changelog

## Unreleased
- Reconstructed consolidated PRD from existing project blueprint and confirmed decisions.
- Recorded Staff Admin direct-publish permission for permitted business content; no separate Super Admin approval.
- Recorded client responsibility and audit-log requirements.
- Recorded separate hotel and Umrah enquiry/booking workflows.
- Added v0.1 branch CI build checks without live Hosting or Firestore deployment.
- Denied permanent deletion of customer enquiries in the v0.1 Firestore rules.
- Added explicit service classification for public enquiries (Umrah, hotel, combined, general).
- Added append-only audit log rules and atomic audit records for hotel settings publication and enquiry status changes.
- Added one-calendar-month retention policy and monthly PDF archive/download to Staff Admin; Firestore source records are purged only after staff confirms the PDF is saved to the company PC; no server-side PDF storage.
- Implemented Staff Admin monthly print-ready archive for enquiries and audit history; staff save as PDF locally, inspect and confirm before Firestore purge.
- Added archive markers, batched cleanup, and Firestore safeguards requiring a confirmed archive marker and at least 28 days of record age; no server-side PDF storage.
- Used browser print-to-PDF rather than a PDF library so multilingual customer text can use local browser fonts.
- Added Firebase Emulator security-rule test suite (9/9 passed) covering public enquiry access, admin archive marker, age-gated purge, immutable archive month and append-only audit logs.
- CI now runs emulator security tests before the production build; version branches skip Firestore rules publishing and Hosting deployment.
- Corrected monthly archive eligibility to clamp one calendar month after the last day of each month, including February and leap-year boundaries; added date-boundary tests.
