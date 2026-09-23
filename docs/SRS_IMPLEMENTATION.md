# SRS implementation status

The current web MVP now reflects the updated SRS in the following areas:

- Registration route with Client, Tenant, Komisiyoneri, and Property Owner explanations plus an anti-bot challenge.
- Tenant dashboard surfaces for applications, rent and utilities, reminders, payment history, maintenance, viewings, and messages.
- Property Owner and Komisiyoneri listing workspaces with role-specific listing storage, scheduling, expiry metadata, and Rwanda location hierarchy.
- Rental application submission from a listing, applicant details, landlord notification-ready local records, and application tracking surfaces.
- Admin moderation queue surfaces for KYC, reports, listing removal, account suspension, and audit-log-ready local records.
- Listing report capture with the SRS report reasons, reviews, sharing, messaging, and permitted contact reveal.
- Cookie consent with necessary-only and optional-preference choices.
- National location lookup through `/api/locations`, with Province → District → Sector → Cell → Village relationships.

The frontend intentionally uses localStorage for demo persistence. Production work still required includes backend authentication and RBAC, encrypted KYC storage, real SMS/OTP, CAPTCHA provider verification, MTN MoMo/Airtel Money webhooks, licensed card PSP integration, push/SMS delivery, object storage/CDN, search indexing, maps, offline mobile caching, AI provider calls, and immutable server-side audit logs.

## Priority mapping

MVP work is represented in the current screens for roles, listings, search, locations, photos, messaging, applications, Mobile Money/card UI, moderation, tenant account basics, rent reminders, and basic property management. Video, map improvements, saved searches, utility payments, AI assistance, price estimation, and 3D tours remain Phase 2 integration work; advanced valuation, accounting, 3D, and analytics remain Phase 3.
