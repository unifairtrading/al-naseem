# Al Naseem Group Website

A new, mobile-first website and admin system for Al Naseem Group's Umrah services in Bahrain.

## Project direction

This repository is being rebuilt from the ground up. The previous prototype is retained in Git history and in the `backup/pre-rebuild-2026-11-14` branch. Active development is taking place on `rebuild/firebase-foundation` until the first milestone is reviewed.

## Planned stack

- Frontend: HTML, CSS and JavaScript
- Build tooling: Vite
- Authentication: Firebase Authentication
- Database: Cloud Firestore
- Media: Firebase Storage
- Hosting: Firebase Hosting
- Source control: GitHub

## Admin roles

- **Super Admin (project owner/developer):** full technical and business control.
- **Staff Admin (Al Naseem business owner):** business content, packages, enquiries and review moderation only.

Both roles use the same admin sign-in page. The authenticated role determines the dashboard and allowed actions. Staff Admin must never be able to grant themselves Super Admin access.

## Important project rules

1. Never commit Firebase service-account private keys or other server secrets.
2. Do not launch with open/test-mode Firestore or Storage rules.
3. Public customer feedback is pending until approved by Staff Admin or Super Admin.
4. Demo testimonials must be clearly marked as examples and replaced with genuine customer feedback before launch.
5. Keep changes in small, reviewable commits.
6. Do not publish unconfirmed package prices or business contact details.

## Current status

- [x] Repository reviewed
- [x] Pre-rebuild backup branch created
- [x] Fresh development branch created
- [ ] Firebase project and web app configured
- [ ] Public website foundation
- [ ] Firestore data model and security rules
- [ ] Admin authentication and role management
- [ ] Booking enquiry and feedback workflows
- [ ] Firebase Hosting deployment
