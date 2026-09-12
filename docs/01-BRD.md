# Business Requirements Document (BRD)

**Project:** MentorMatch — an ADPList-style 1:1 mentorship marketplace
**Prepared as:** Staff Engineer / Architect scoping document
**Status:** Draft v1.0
**Date:** 2026-09-13

---

## 1. Executive Summary

ADPList (adplist.org) is proof that a low-friction, mostly-free mentorship marketplace can reach massive scale (36,000+ mentors, 400,000+ members, 160+ countries) by removing the two biggest barriers to mentorship: **cost** and **discovery**. This BRD scopes **MentorMatch**, an MVP-first clone of that core loop, built on **Next.js** for the application layer and **SELISE Blocks** (via `blocks-cli` / `@seliseblocks/client`) as the backend-as-a-service layer for Auth/IAM, Data, Storage, Mail, and Notifications.

The MVP scope (confirmed with stakeholder) is the **core marketplace only**: mentor discovery, profiles, booking, 1:1 video sessions, and reviews — deliberately excluding communities/events, enterprise/B2B tooling, payments, and mobile apps in v1. Those are captured as a prioritized post-MVP roadmap in §8.

## 2. Business Context & Problem Statement

| Problem | Evidence from ADPList's model |
|---|---|
| Early/mid-career professionals lack access to experienced people who can give personalized, contextual guidance. | ADPList's core pitch: "A fresh perspective from someone who's been there." |
| Existing content (courses, articles, social feeds) is generic and one-directional. | ADPList's own comparison table: personal mentorship vs. "learning on your own" — live conversation, personal feedback, follow-up questions are the differentiators. |
| Mentorship is gated by cost and by not knowing who to ask. | ADPList removes cost (free sessions) and discovery friction (guided onboarding + browsable mentor directory + ratings). |
| Trust is hard to establish with a stranger over video. | ADPList uses public reviews (Trustpilot-integrated), session counts, review counts, and company/title badges as trust signals. |

## 3. Vision Statement

> Make it as easy to book 30 minutes with someone who has already solved your problem as it is to book a restaurant table — for free, in one sitting, anywhere in the world.

## 4. Goals & Objectives

| Goal | Objective (measurable) |
|---|---|
| G1 — Prove the core loop | Mentee can go from landing page → browse → book → attend a video session → leave a review, end-to-end, with zero manual intervention. |
| G2 — Trustworthy mentor discovery | Every mentor has a public profile with verifiable signals (title/company, rating, review count, completed-session count) surfaced in search/filter. |
| G3 — Low time-to-first-session | A new mentee can find and book a mentor in under 5 minutes (mirrors ADPList's "~3 min" onboarding claim). |
| G4 — Operationally lean | Backend capabilities (auth, data, storage, mail, notifications) are sourced from a managed BaaS (SELISE Blocks) rather than hand-rolled, to keep the team small. |
| G5 — Trust & safety baseline | Mentors and mentees are identity-verified at signup level (email + optional SSO), and reviews/reports are moderated before public display. |

## 5. Stakeholders

| Stakeholder | Interest |
|---|---|
| Mentees (job seekers, career switchers, skill-builders) | Fast, free, credible access to a mentor in their exact situation. |
| Mentors (industry professionals) | Low-friction way to give back / build personal brand, full control of availability, no scheduling back-and-forth. |
| Platform team (Product/Eng) | Ship an MVP quickly on a stack the team already has tooling for (`blocks-cli`), and a clear roadmap to defend scope cuts. |
| Trust & Safety / Support | Ability to moderate profiles, reviews, and reported sessions. |
| Future: Enterprise buyers | (Out of MVP scope) Company-sponsored mentorship programs — see roadmap. |

## 6. In Scope (MVP) — "Core Marketplace"

1. Mentee & mentor onboarding (signup, profile creation, category/skill tagging).
2. Mentor directory: search, filter (category, rating, availability, language, seniority), sort.
3. Mentor public profile: bio, title/company, skills, rating, review count, session count, availability calendar.
4. Session booking: mentee selects an open slot, session is created, both parties notified.
5. 1:1 video session via a third-party video SDK (Daily.co-class provider), launched from the booked session.
6. Post-session review & rating (mentee → mentor is the primary flow; mentor → mentee optional/internal).
7. Session history for both roles (upcoming, past, cancelled).
8. Mentor availability management (recurring weekly availability + blackout dates).
9. Notifications: booking confirmation, reminder (T-24h/T-1h), cancellation, new review — via email (and in-app).
10. Admin/back-office minimum: user list, flag/suspend user, moderate a reported review.

## 7. Out of Scope (MVP) — explicitly deferred

- Payments / paid sessions (confirmed: MVP is free-only, matching ADPList's core model).
- Communities, group events, meetups.
- Enterprise/B2B team mentorship programs.
- Native mobile apps (responsive web only).
- AI-based mentor-matching recommendations (manual search/filter only in MVP).
- Content hub (blog/podcast/video library).
- Public jobs board.
- In-house WebRTC infrastructure (using a managed video SDK instead — see Architecture doc).

These are re-scoped as the **post-MVP roadmap** in §8 and detailed further in `06-BLOCKS-CLI-ANALYSIS.md` and `00-REPORT.md`.

## 8. Post-MVP Roadmap (how we grow toward ADPList's full model)

| Phase | Feature | Why it's next, not now |
|---|---|---|
| v1.1 | Reminders via SMS/push, calendar (.ics) sync | High retention value, low build cost once notifications exist. |
| v1.2 | Session recording + AI transcription/summary | ADPList's most-cited differentiator in reviews; needs a recording-capable video vendor and storage pipeline — straightforward once core booking exists. |
| v1.3 | AI-assisted mentor matching (recommend mentors from a mentee's stated goal) | Needs sufficient mentor/session data first; premature before there's a marketplace to recommend from. |
| v2.0 | Communities & events (group sessions, meetups) | New data model (many-to-many group membership) and moderation surface; deliberately separated from 1:1 core. |
| v2.1 | Paid sessions (Stripe Connect marketplace payments) | Requires KYC, payout compliance, refund/dispute flows — a project of its own. |
| v2.2 | Enterprise/B2B offering (company-sponsored programs, seats, admin dashboards) | Different buyer, different sales motion, different data model (org → seats → mentors). |
| v2.3 | Native mobile apps | Only worth the investment once web retention is proven. |
| v3.0 | Public content hub / jobs board | Marketing/growth surface, not core product — can be a separate CMS-driven microsite. |

## 9. Success Metrics (MVP)

- **Activation:** % of signed-up mentees who complete a booking within 7 days.
- **Liquidity:** median number of open mentor slots per active category.
- **Time-to-book:** median minutes from first directory view to confirmed booking.
- **Session completion rate:** % of booked sessions that are actually attended (not cancelled/no-show).
- **Trust signal coverage:** % of mentors with ≥1 published review after 30 days.

## 10. Assumptions & Constraints

- **Constraint:** Backend platform is SELISE Blocks, operated through `blocks-cli` (`@seliseblocks/cli-os`) and `@seliseblocks/client` SDK — confirmed decision.
- **Constraint:** Application framework is Next.js (App Router). `blocks-cli`'s native `blocks new web` scaffolder currently generates Vite+React, not Next.js, so the SDK will be wired into Next.js manually rather than via the scaffolder — confirmed decision, detailed in `03-ARCHITECTURE.md`.
- **Constraint:** Auth/Identity uses SELISE Blocks IAM/OIDC (roles: mentee, mentor, admin; MFA available) rather than a third-party auth provider — confirmed decision.
- **Constraint:** Video sessions use a third-party video SDK rather than in-house WebRTC — confirmed decision.
- **Assumption:** No payment processing is needed for MVP; all sessions are free.
- **Assumption:** Deployment target is SELISE Blocks Cloud via the CLI's Release module — confirmed decision.
- **Assumption:** Single language (English) content at MVP; SELISE Blocks Localization module is available but not required until v1.x.

## 11. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Two-sided marketplace cold-start (no mentors → no mentees, and vice versa) | High | Seed with a manually-recruited mentor cohort before public mentee signup opens (same playbook ADPList used). |
| No-shows / cancellations erode trust | Medium | Reminder notifications (§6.9) + no-show tracking feeding into a future mentor/mentee reliability score. |
| Review abuse / fake reviews | Medium | Reviews only unlockable after a completed session; admin moderation queue (§6.10). |
| Fake company affiliation (mentor claims an employer they don't have) erodes the trust signal G2 depends on | Medium | Company field ships with an unverified-by-default state; verified only via corporate-email confirmation or admin review (FR-33/34, `03-ARCHITECTURE.md` §6a). Kept deliberately separate from the v2.2 Enterprise/B2B `Organization` tenant model — this is about mentor honesty, not company accounts. |
| Third-party video vendor lock-in | Low-Medium | Abstract video-session creation behind a single internal service interface (see Architecture doc) so the vendor can be swapped. |
| SELISE Blocks platform learning curve for the team | Low | `blocks-cli` ships an AI-agent skill library (`blocks skill list`) specifically to shorten this ramp-up; leverage it during implementation. |

## 12. Glossary

- **Mentee**: a user seeking guidance/mentorship.
- **Mentor**: a user offering guidance, with a public profile and availability.
- **Session**: a scheduled 1:1 video meeting between a mentor and mentee.
- **BaaS**: Backend-as-a-Service — here, SELISE Blocks, accessed via `blocks-cli` (admin/scaffolding) and `@seliseblocks/client` (app-code SDK).
