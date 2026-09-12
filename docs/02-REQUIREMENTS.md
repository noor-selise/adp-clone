# Functional & Non-Functional Requirements

Derived from `01-BRD.md` §6 (In Scope). Each functional requirement (FR) is written as an independently testable statement and tagged with the primary SELISE Blocks capability (via `@seliseblocks/client`) that backs it — see `06-BLOCKS-CLI-ANALYSIS.md` for the full capability mapping.

## A. Functional Requirements

### A.1 Identity & Onboarding

| ID | Requirement | Blocks capability |
|---|---|---|
| FR-1 | A visitor can sign up as a mentee or mentor with email + password, or via Google SSO (confirmed compatible: Blocks IAM's External IdP feature accepts Google's JWKS for federated login). LinkedIn SSO is **not** an MVP commitment — its JWKS/OIDC compatibility with Blocks IAM is unverified and is a post-MVP spike (`01-BRD.md` §8). | IAM / OIDC (+ External IdP for Google) |
| FR-2 | On first login, the user is routed through a role-specific onboarding flow (mentee: goals + interests, persisted to `MenteeProfile`, FR-36; mentor: title, company, skills, bio, availability, persisted to `MentorProfile`). | IAM (roles) + Data |
| FR-3 | A user's account can hold **both** the mentor and mentee roles simultaneously — they are independent capabilities, not mutually exclusive (see FR-35). A brand-new signup still picks one role to start onboarding with; adding the other role later is a lightweight "become a mentor" / "book as a mentee" action, not a support request. | IAM (roles) |
| FR-4 | An admin role exists with elevated permissions (user list, suspend, moderate reviews). | IAM (roles + access control) |
| FR-5 | MFA can be enabled per-account (optional at MVP, available via IAM module). | IAM (MFA) |
| FR-35 | A single IAM user can hold both the `mentor` and `mentee` roles at once. Holding `mentor` requires a `MentorProfile`; holding `mentee` requires a `MenteeProfile` (FR-36). The two profiles are independent records keyed by the same `userId` — completing one does not require or imply the other. | IAM (multi-role) + Data |
| FR-36 | A `MenteeProfile` schema persists mentee onboarding data (goals[], interests[], timezone) so it exists as structured data from day one, not free text bolted onto the IAM user record — this is what v1.3's AI-assisted matching (`01-BRD.md` §8) will read from. | Data (schema: `MenteeProfile`) |

### A.2 Mentor Profile & Directory

| ID | Requirement | Blocks capability |
|---|---|---|
| FR-6 | A mentor can create/edit a public profile: display name, photo, title, company, bio, skill tags, languages, timezone. | Data + Storage (photo) |
| FR-7 | A mentee can browse a paginated directory of mentors. | Data (GraphQL query) |
| FR-8 | A mentee can filter mentors by category/skill, minimum rating, language, and timezone/availability window. | Data (query filters) |
| FR-9 | A mentee can sort mentors by rating, session count, or "soonest availability". | Data (query sort) |
| FR-10 | A mentor's public profile displays aggregate rating, review count, and completed-session count, computed server-side (not client-trusted). | Data (computed/aggregation rule) |
| FR-11 | A mentee can search mentors by free-text (name, title, company, skill). | Data (search) |
| FR-33 | A mentor's `company` field starts in an **unverified** state; it moves to **verified** only when the mentor confirms a one-time link sent to a `name@company.com` address, or an admin manually verifies it. Public/generic email domains (gmail.com, outlook.com, etc.) can never reach `verified`. The confirmation link expires **48 hours** after issue; an expired, unconfirmed link reverts `companyVerificationStatus` from `pending` back to `unverified` and the mentor can re-request it. | Mail (verification link) + Data (`companyVerificationStatus`) |
| FR-34 | The mentor directory and profile UI visually distinguish verified vs. unverified company affiliation (e.g., a checkmark badge next to the company name) — company claims are never presented as equally trustworthy by default. | Frontend (design system §4.2 `MentorCard`) |

### A.3 Availability & Booking

| ID | Requirement | Blocks capability |
|---|---|---|
| FR-12 | A mentor can define recurring weekly availability blocks and mark one-off blackout dates. | Data (schema: `AvailabilityRule`) |
| FR-13 | A mentee viewing a mentor's profile sees only currently-open, non-expired, non-conflicting time slots. | Data (derived query, server-computed) |
| FR-14 | A mentee can book an open slot in one action; the slot is immediately locked from other bookers (no double-booking). | Data (transactional write / access rule) |
| FR-15 | A mentor can accept-by-default (auto-confirm) bookings, matching ADPList's low-friction model; manual-approval mode is a config toggle for later. | Data + Notification |
| FR-16 | A mentee or mentor can cancel a confirmed session up to a configurable cutoff (e.g., 2 hours before start). | Data + Notification |
| FR-17 | Session state machine: `requested → confirmed → completed`, with `cancelled` and `no_show` as terminal branches. The `completed` vs. `no_show` split is decided by FR-37 (video-vendor attendance check), not by the grace-period timer alone. | Data (schema + rules) |
| FR-37 | When a session's grace period (FR-20) elapses, a scheduled job queries the video vendor's participant/attendance data for that room: both parties present at any point → `completed`; neither party ever joined → `no_show`; exactly one party joined → `completed` with an `attendedBy` flag (so an aggrieved no-show party still has a record to dispute via FR-23). This is what makes the BRD §9 "session completion rate" metric measurable at all. | Data (rule) + external video vendor API (attendance/participant query) |

### A.4 Video Sessions

| ID | Requirement | Blocks capability |
|---|---|---|
| FR-18 | On session confirmation, a unique video room is provisioned via the third-party video SDK and its join URL stored against the session. | External video vendor API + Data (store reference) |
| FR-19 | Both participants can join the video room from the app at or after the scheduled start time, authenticated as themselves (not anonymous). | Client SDK (current user) + video vendor token |
| FR-20 | The room becomes inaccessible after a grace period post-scheduled-end (prevents indefinite reuse). | App logic + video vendor room expiry |

### A.5 Reviews & Trust

| ID | Requirement | Blocks capability |
|---|---|---|
| FR-21 | A mentee can submit a 1–5 star rating + text review only for a session in `completed` state, once per session. | Data (rule: one review per session, only if completed) |
| FR-22 | A mentor's aggregate rating recalculates automatically when a review is added/edited/removed. | Data (rule/trigger) |
| FR-23 | A user can report a review or a profile for moderation. | Data (schema: `Report`) + Notification (to admin) |
| FR-24 | An admin can hide a reported review pending investigation, and permanently remove or restore it. | IAM (admin role) + Data |

### A.6 Notifications

| ID | Requirement | Blocks capability |
|---|---|---|
| FR-25 | Booking confirmation is sent by email to both parties immediately on confirmation. | Mail |
| FR-26 | Reminder notifications are sent at T-24h and T-1h before a session. | Notification (scheduled) + Mail |
| FR-27 | Cancellation notice is sent immediately to the non-cancelling party. | Mail/Notification |
| FR-28 | A mentor is notified when a new review is posted. | Notification |
| FR-29 | In-app notification center shows unread/read state for all of the above. | Notifier (runtime) |

### A.7 Admin / Back Office

| ID | Requirement | Blocks capability |
|---|---|---|
| FR-30 | Admin can list, search, and suspend/reinstate any user account **using SELISE Blocks' own admin console** — no custom MentorMatch UI is built for generic user management (FR-38). | IAM (users, native console) |
| FR-31 | Admin can view a queue of reported reviews/profiles and resolve each, **via a minimal custom Next.js `/admin/reports` surface** — Blocks' generic console has no concept of the MentorMatch-specific `Report` schema, so this one piece is hand-built. | Data + IAM |
| FR-32 | Admin actions are recorded in an audit trail (who did what, when). | Data (schema: `AuditTrail`) |
| FR-38 | The admin surface is deliberately split, not uniform: generic account operations (FR-30) stay on Blocks' native console (zero build cost, per G4 "operationally lean"); only the one workflow Blocks' console cannot represent — the `Report` moderation queue (FR-31) — gets custom-built. This split is a scope decision, not an oversight. | N/A (documentation of the split itself) |

---

## B. Non-Functional Requirements

### B.1 Performance

| ID | Requirement |
|---|---|
| NFR-1 | Mentor directory list (first page, 20 results) renders within 2s on a median broadband connection (p75), using Next.js server-side rendering + streaming. |
| NFR-2 | Search/filter interactions return results within 500ms server response time (p90) for up to 100K mentor records. |
| NFR-3 | Booking a slot completes (optimistic UI feedback) within 300ms perceived latency; server confirmation follows asynchronously with rollback UI on failure. |

### B.2 Scalability

| ID | Requirement |
|---|---|
| NFR-4 | The Data layer's schema and access-rule design must support horizontal growth to 100K+ mentors / 1M+ mentees without a schema migration (i.e., no hardcoded category enums baked into row-level structure). |
| NFR-5 | Notification fan-out (reminders) must be handled by a scheduled/queued job, not a synchronous request-path operation, to avoid blocking booking flows. |

### B.3 Availability & Reliability

| ID | Requirement |
|---|---|
| NFR-6 | Core booking flow (browse → book) has a target availability of 99.9% monthly, independent of video-vendor uptime (booking must succeed even if video room provisioning is briefly delayed — provision can be retried async). |
| NFR-7 | No double-booking is possible under concurrent requests for the same slot (enforced via the Data layer's transactional/optimistic-locking write rule, not client-side checks alone). |

### B.4 Security & Privacy

| ID | Requirement |
|---|---|
| NFR-8 | All authenticated routes verify identity via SELISE Blocks IAM/OIDC tokens; no route trusts a client-supplied user ID. |
| NFR-9 | Frontend code never contains client secrets or video-vendor API secrets; video room tokens are minted server-side per session, scoped to that room only. |
| NFR-10 | Personally identifiable information (email, phone) is never exposed in a public mentor-directory API response — only public-profile fields are queryable by unauthenticated/mentee sessions. |
| NFR-11 | All admin-mutating actions (FR-30–32) require the `admin` IAM role and are access-rule-enforced server-side, not just UI-hidden. |
| NFR-12 | The platform never logs or exposes CLI/SDK tokens, refresh tokens, or client secrets — enforced by following `blocks-cli`'s own guardrails during build/ops. |

### B.5 Usability & Accessibility

| ID | Requirement |
|---|---|
| NFR-13 | Time-to-first-booking for a new mentee is under 5 minutes end-to-end (mirrors BRD G3), validated via a scripted usability test. |
| NFR-14 | All interactive flows (signup, search, booking, review) meet WCAG 2.1 AA: keyboard operability, visible focus states, ARIA labeling on custom components, color-contrast ≥ 4.5:1 for text. |
| NFR-15 | The application is fully responsive from 375px (mobile web) to desktop widths; no native app required for MVP (per BRD scope). |

### B.5a Trust Integrity

| ID | Requirement |
|---|---|
| NFR-21 | Company-affiliation verification (FR-33) is asynchronous and best-effort: it never blocks profile creation or the "under 5 minutes to first booking" goal (NFR-13). An unverified profile is fully usable — only its trust badge differs. |
| NFR-22 | A mentor cannot self-report as "verified" through any client-writable field; `companyVerificationStatus` is server-set only (via the Mail-confirmed link or an admin action), never accepted from a client mutation — same "never trust the client" posture as NFR-8. |

### B.6 Maintainability & Operability

| ID | Requirement |
|---|---|
| NFR-16 | Backend capability (auth/data/storage/mail/notification) is consumed exclusively through `@seliseblocks/client` and `blocks-cli`-managed configuration — no bespoke reimplementation of a capability the SDK already provides. |
| NFR-17 | Infrastructure/config changes (schema push, IAM roles, localization, release) are dry-run-able and require explicit human approval before mutating production (matches `blocks-cli`'s own `--dry-run` / `--yes` convention). |
| NFR-18 | The video-session provisioning call is isolated behind one internal interface/module so the underlying vendor (Daily.co/Twilio/Zoom) can be swapped with a single-module change (addresses BRD risk: vendor lock-in). |
| NFR-19 | Deployment to SELISE Blocks Cloud is repeatable via the CLI's Release module (`blocks deploy` / Release configuration), not manual server operations. |

### B.7 Internationalization (future-proofing only — not required content at MVP)

| ID | Requirement |
|---|---|
| NFR-20 | All user-facing strings are routed through the Localization module's translation keys from day one, even though only English content ships at MVP — this avoids a costly string-extraction pass later. |
