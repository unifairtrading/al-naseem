# Decisions

## Confirmed
- Firebase backend; do not use Supabase.
- Repository: unifairtrading/al-naseem.
- User is Super Admin + Developer; Al Naseem owner/staff are Staff Admin.
- Staff Admin may directly edit and publish permitted business details/content without separate Super Admin approval. Client/company is responsible for staff actions and publication choices.
- Keep audit records for important changes (who, when, what) for one calendar month, then include them in a downloadable monthly PDF archive and purge source records from live Firestore only after staff confirms the PDF is saved to the company PC.
- Staff cannot change security rules, role definitions, Super Admin access or technical settings.
- Hotel booking/enquiry is separate from Umrah.
- Preserve Git history; no force-push or rewrite of main; do not merge to main without explicit approval.
- Do not enable paid Firebase billing/services without explicit approval.
- Prefer assistant-led GitHub development and simple non-technical instructions.

## Confirmed
- Monthly archive policy: enquiries and audit records remain in Firestore for one calendar month, then are exported to a month-wise PDF downloadable from the Staff Admin panel. No PDF copy is retained on Firebase/server storage. Purge source records only after the download flow completes and staff explicitly confirms the PDF is saved securely on the company PC. If not confirmed, keep the records.

## Pending
- Final production business data, packages and legal/privacy text.
- Hotel workflow depth (enquiry-only vs live availability/inventory).
- Exact editable-field list and any exceptions to direct publishing.
- Paid Firebase services, custom domain and launch timing.