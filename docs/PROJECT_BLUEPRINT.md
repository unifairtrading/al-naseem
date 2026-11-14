# Project Blueprint

## 1. Goal

Build a professional, responsive Al Naseem Group website for Umrah services in Bahrain, with a secure admin portal so business information can be maintained without changing source code.

## 2. Public website

Planned sections:
- Home / hero banner
- About Al Naseem Group
- Umrah packages (air and bus options)
- Umrah guide (six clear steps)
- Booking / enquiry form
- Guest Feedback / customer reviews
- Contact details, map and social links

The existing repository contains preliminary package prices and business contact information. These are reference data only and must be confirmed by the business owner before the site is published.

## 3. Admin portal

A single sign-in route (planned: `/admin`) with role-based dashboards.

### Super Admin
- Full website and content control
- Manage Staff Admin accounts and permissions
- Manage packages, enquiries and feedback
- Technical configuration, Firebase integrations and audit records

### Staff Admin
- Create, edit, enable and disable packages
- Update prices, package details and availability
- Update business contact information and office location
- Manage booking enquiries and statuses
- Review, approve or reject customer feedback
- Cannot change role definitions, grant Super Admin access, or edit technical/security settings

## 4. Firebase services

- Firebase Authentication: staff sign-in
- Cloud Firestore: packages, site settings, enquiries, reviews, staff profiles and audit records
- Firebase Storage: approved logos, banners and review photos
- Firebase Hosting: public website and admin portal

Role assignment must be controlled by a trusted administrative process. A browser-side form must never be allowed to promote an account to Super Admin. Firestore and Storage rules will be designed alongside each feature and tested before deployment.

## 5. Suggested Firestore collections

- `users/{uid}`
- `packages/{packageId}`
- `siteSettings/{documentId}`
- `enquiries/{enquiryId}`
- `reviews/{reviewId}`
- `auditLogs/{logId}`

The exact fields and access rules will be finalized before implementation.

## 6. Delivery milestones

1. Foundation: project structure, responsive public pages and reusable components.
2. Firebase connection: project config, Authentication, Firestore and Storage.
3. Admin roles: Super Admin / Staff Admin authorization and dashboard navigation.
4. Business workflows: package management, enquiries and review moderation.
5. Security and quality: rules tests, form validation, accessibility, mobile testing.
6. Launch: Firebase Hosting, custom domain connection and production checks.

## 7. Decisions already confirmed

- Use Firebase, not Supabase.
- Use the existing GitHub repository.
- No domain or hosting has been purchased yet.
- Avoid requiring the user to write code manually in VS Code; use the connected GitHub workflow where supported.
- The user is Super Admin + Developer. The Al Naseem owner is Staff Admin.
- Keep the old repository history recoverable; do not rewrite or force-push the main branch during the rebuild.
