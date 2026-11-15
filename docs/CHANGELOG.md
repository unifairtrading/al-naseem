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
