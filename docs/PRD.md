# Al Naseem Group Website & Admin Portal — PRD

> Reconstructed consolidated PRD based on the existing PROJECT_BLUEPRINT.md and confirmed project decisions. This is a new working PRD, not a verbatim copy of the missing original. Unconfirmed details are listed under Open Questions.

## 1. Vision
Build a premium, responsive Al Naseem Group website for Umrah services in Bahrain, with a secure admin portal so company staff can maintain routine business information without developer involvement.

## 2. Roles
- Public visitor/customer: browse services, submit Umrah or hotel enquiries/bookings, submit feedback, contact the company.
- Staff Admin: manage permitted business content and operational records.
- Super Admin + Developer: full control of staff accounts, permissions, security, Firebase and technical settings.

## 3. Staff permissions and publishing
Staff Admin may directly edit AND publish permitted business details/content without a separate Super Admin approval. This is intentional; the client/company is responsible for what its staff publish and for the access it grants them. Permitted content includes phone/WhatsApp/email, office address/map location, packages/prices, banners and designated website content. Important changes must have an audit trail showing who changed what and when. Staff cannot grant Super Admin access, change role definitions, edit security rules or technical settings. Enquiries and audit records are retained in Firestore for one calendar month, then included in a downloadable monthly PDF archive in the Staff Admin panel. The Staff Admin archive screen groups records by calendar month and only offers a month after that full month and the following retention month have elapsed (a conservative monthly cycle, so every record in the selected month is at least one calendar month old). It opens a print-ready report; staff choose “Save as PDF” in the browser print dialog, save it securely on the company PC, inspect it, and explicitly confirm. Only after confirmation does the app create a Firestore archive marker and purge eligible source records from live Firestore. Firestore rules additionally require a confirmed archive marker and a minimum 28-day record age before deletion. If export/print/download/confirmation fails, records remain. The PDF is generated in the browser and is not uploaded or retained in Firebase/server storage. Staff confirmation is an attestation; a browser cannot independently prove that a file was saved to the PC. This is archive-and-purge (not soft delete).

## 4. Public website
Responsive professional website with: Home/hero, About, Umrah packages (air and bus options), six-step Umrah guide, Umrah enquiry/booking form, separate hotel enquiry/booking service, guest feedback/reviews, contact details/map/social links, and BenefitPay/payment information only when confirmed. All practical business content should be editable in admin. Never publish unconfirmed sample prices or contact details.

## 5. Enquiries and bookings
Public forms validate input and give clear confirmation/error messages. Umrah and hotel enquiries must be distinguishable and managed separately. Capture customer/contact details, service/package, traveller or guest details, dates and message as relevant. Admin lists submissions with timestamps and statuses such as new/pending, contacted, confirmed, cancelled and completed (final vocabulary to confirm). Staff may manage operational statuses. Provide WhatsApp contact actions where suitable. No online payment gateway unless separately approved.

## 6. Guest feedback
Public feedback submissions start private/pending. Staff Admin may review and approve/reject; only approved feedback appears publicly. Add validation/spam safeguards and preserve moderation history.

## 7. Admin portal
Secure sign-in at /admin. Dashboard data is hidden before authentication. After successful login, show dashboard only and hide login form; provide logout. Role-aware modules planned: overview, Umrah packages, hotel content/enquiries, website content/settings, contact details, enquiries/bookings, feedback, staff accounts/permissions, audit log, monthly PDF archive/download and system settings. Staff must be able to create a month-wise, print-ready PDF containing enquiries and audit history, save it locally via the browser’s “Save as PDF” option, and confirm it was checked and saved before eligible records are purged. No server copy is retained. Staff account creation/disable and permissions are Super Admin-only and must use trusted server-side provisioning or a documented secure admin procedure. Browser-side code must never assign privileged roles. UI hiding is not a security boundary; enforce access in Firestore/server rules.

## 8. Monthly archive and retention
- Retention period: one calendar month from each record's creation date; records become eligible for archive only after that period has elapsed.
- Provide a month-wise PDF export from the Staff Admin panel containing Umrah, hotel, combined and general enquiries plus relevant audit entries, with readable dates, service type, customer details, status and activity history.
- Generate the PDF from Firestore and download directly to the staff member's PC. Do not upload/store the PDF in Firebase Storage or other server storage.
- Do not purge records merely because a print view opened. Staff must choose “Save as PDF”, inspect/save the file on the company PC, and explicitly confirm. This confirmation is an attestation, not a browser-verifiable proof. If any step fails or is cancelled, retain source records.
- After confirmation, create a month-keyed archive marker, stage the selected documents with the matching archive month, and purge eligible source enquiry and audit documents from live Firestore in batches. Firestore rules require a matching confirmed marker and minimum record age. Retain only minimal non-personal archive-completion metadata if needed to prevent duplicate processing.
- Restrict archive generation and confirmation to authorized Staff Admin/Super Admin accounts. Avoid including unnecessary sensitive data in audit entries. Provide month selection, record counts, preview/confirmation and clear success/failure feedback. Prevent duplicate or concurrent processing for the same month.

## 9. Firebase architecture
Firebase is confirmed; do not switch to Supabase. Use Firebase Authentication, Cloud Firestore, Firebase Hosting, and Firebase Storage only after setup/billing approval. Firestore collections may include users, packages, hotels, siteSettings, enquiries, reviews and auditLogs. Use least-privilege Firestore/Storage rules, validate public writes narrowly, protect customer data, and test rules before deployment. Privileged account creation requires trusted server-side code (e.g. Cloud Functions/Admin SDK). Never commit service-account keys or .env secrets. Do not enable paid billing/services without explicit approval.

## 10. Quality and design
Premium, consistent top-to-bottom design; mobile-first responsive layouts; simple staff workflows; accessible headings, labels, contrast and keyboard use; clear form validation. Make small tested changes and avoid disrupting current staff operations.

## 11. Delivery workflow
Work in small versions, with a proposed version plan and user approval before v0.1 implementation. Maintain PROJECT_SUMMARY.md, WORKLOG.md, DECISIONS.md, CHANGELOG.md, version files and memory notes. Use a branch per version. Do not merge to main without explicit approval. Preserve Git history; never force-push or rewrite main. Verify GitHub Actions before claiming deployment success. Confirm business content before production launch.

## 12. Confirmed decisions
- Firebase, not Supabase.
- Existing repository: unifairtrading/al-naseem.
- User is Super Admin + Developer; Al Naseem owner/staff are Staff Admin.
- Staff may directly publish permitted business content without Super Admin approval; client is responsible for staff publishing decisions.
- Audit logging for important edits, with one-calendar-month retention followed by monthly PDF archive download and confirmed Firestore purge.
- Hotel workflow separate from Umrah.
- Prefer assistant-led GitHub workflow and simple Hinglish instructions; user should not need to code manually in VS Code.
- No paid billing, domain purchase or merge to main without explicit approval.

## 13. Known implementation snapshot (verify before relying)
Firebase project al-naseem-d40c8 and Hosting are configured. Existing code includes public site, admin login/dashboard foundation, hotel management and enquiry inbox. Package CMS, full feedback workflow, content editor, staff account management/permissions, audit log and system settings remain incomplete. Storage/Cloud Functions billing setup is not confirmed.

## 14. Open questions
- Approved phone, WhatsApp, email, address, map, social and payment details.
- Final Umrah package names, prices, inclusions/exclusions, availability and booking fields.
- Whether hotel flow is enquiry-only or requires live inventory/availability.
- Final status values for each enquiry type.
- Any exceptions to Staff Admin's direct-publish permissions (default is direct publish for permitted content).
- Feedback photo uploads and moderation details.
- Confirm the exact PDF layout/fields and one-calendar-month retention implementation details (current default: one month from each record's creation date).
- Storage/Cloud Functions billing implications, custom domain and launch timing.

## 15. Out of scope unless separately approved
Online payment gateway, third-party inventory/booking integrations, native mobile apps, automated WhatsApp messaging, and paid infrastructure/subscriptions.