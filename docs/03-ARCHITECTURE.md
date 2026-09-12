# Architecture — MentorMatch on Next.js + SELISE Blocks

**Decision record for:** Framework, backend platform, video vendor, auth, deployment
**Confirmed inputs:** Next.js (App Router) app · SELISE Blocks IAM/OIDC for auth · third-party video SDK · no payments in MVP · deploy to SELISE Blocks Cloud

---

## 1. Key Architectural Decision: Next.js ≠ `blocks new web`

`blocks-cli`'s scaffolder (`blocks new web <appName> ...`) currently generates a **Vite + React + TypeScript** SPA — confirmed by reading `blocks-cli/src/lib/scaffold-web/` and the `Next: cd ... && npm run dev` output in `src/commands/new/web.ts`. It is **not** a Next.js generator.

Since the requirement is Next.js, MentorMatch does **not** use `blocks new web`. Instead:

- The Next.js app is created the standard way (`create-next-app`, App Router, TypeScript).
- `@seliseblocks/client` — the framework-agnostic SDK — is installed and wired in manually (it has no Vite/React-specific dependency; it talks to Blocks' `/iam/v4`, `/data/v4`, `/storage`, `/localization` REST/GraphQL surfaces over plain HTTP).
- `blocks-cli` itself is still used for everything it's designed for regardless of frontend framework: project login/selection, IAM/OIDC client registration, Data schema/rules authoring and deployment, Storage/DMS config, Mail/Notification config, Localization sync, Secrets, and Release deployment. **The CLI operates on the *project* (backend), not on the frontend scaffold** — so losing the scaffolder loses nothing except boilerplate we'd otherwise delete anyway (Vite config, React Router, etc.).

This is a **one-time manual wiring cost, not an ongoing tax** — once `lib/blocks/client.ts` exists (see §4), every feature team member consumes it the same way they would in the CLI's own scaffold.

## 2. System Context

```
Mentee (browser) ─┐
                   ├─→ Next.js App (App Router, RSC + Route Handlers) ─→ @seliseblocks/client ─→ SELISE Blocks Cloud
Mentor (browser) ─┘                                    │                                          ├─ IAM/OIDC (auth, roles, MFA)
                                                         │                                          ├─ Data Gateway (GraphQL: mentors, sessions, reviews)
                                                         │                                          ├─ Storage/DMS (profile photos)
                                                         │                                          ├─ Mail (transactional email)
                                                         │                                          └─ Notification (in-app + scheduled reminders)
                                                         └─→ Video Vendor API (Daily.co) — room provisioning, join tokens, attendance query

blocks-cli (dev/ops machine) ──manages──→ SELISE Blocks Cloud project (schemas, rules, IAM clients, localization, release)
```

## 3. Application Layers

| Layer | Technology | Responsibility |
|---|---|---|
| Presentation | Next.js 15 App Router, React Server Components, Tailwind CSS, shadcn/ui primitives | Routing, rendering, forms, optimistic UI for booking |
| Application/Domain | Route Handlers (`app/api/**/route.ts`) + Server Actions | Booking state machine, availability derivation, review-eligibility rules, video-room provisioning orchestration |
| SDK/Integration | `@seliseblocks/client` (`lib/blocks/client.ts`) | Auth session, current user, Data Gateway GraphQL calls, Storage uploads, Localization strings |
| Platform (BaaS) | SELISE Blocks Cloud | IAM/OIDC, Data (schemas + rules + GraphQL), Storage/DMS, Mail, Notification, Localization |
| External integration | Video vendor SDK (server-side room/token API + client-side embed) | Live 1:1 video session |
| Ops/Infra-as-config | `blocks-cli` (developer + CI) | Schema/rules authoring & deploy, IAM client/role config, Release deployment to Blocks Cloud |

## 4. SDK Wiring Detail (the piece that replaces `blocks new web`)

```
app/
  layout.tsx                 // wraps app in AuthProvider (reads Blocks OIDC session)
  (public)/
    page.tsx                 // landing page (SSR, marketing copy)
    mentors/page.tsx         // directory (RSC data fetch via Data Gateway)
    mentors/[id]/page.tsx    // mentor profile + availability
  (app)/                     // authenticated route group
    dashboard/page.tsx       // shows mentor view, mentee view, or both — driven by which profiles exist for this user (FR-3/FR-35)
    become-a-mentor/page.tsx // lightweight role-add flow: creates a MentorProfile for an existing mentee account (FR-3)
    sessions/page.tsx
    sessions/[id]/room/page.tsx   // video room join screen
  (admin)/                   // authenticated route group, admin role only — deliberately thin (FR-38)
    admin/reports/page.tsx   // the one moderation surface Blocks' native console can't represent (FR-31)
  api/
    bookings/route.ts        // POST: create booking (server-side, calls Data Gateway with access rules)
    video-rooms/route.ts     // POST: provision video room + mint join token (server-side only — secrets never reach client)
    reviews/route.ts         // POST: submit review (validates session state = completed)
    verify-company/route.ts  // POST: issue verification token + send Mail link; GET: confirm token, expires after 48h (§6a)
lib/
  blocks/
    client.ts                // instantiates @seliseblocks/client with x-blocks-key, base URL from env
    auth.ts                  // session helpers, role guards (mentee/mentor/admin — a user may hold mentee AND mentor concurrently)
    data.ts                  // typed GraphQL query/mutation wrappers per schema (MentorProfile, MenteeProfile, Session, Review, AvailabilityRule, Report, AuditTrail)
    localization.ts          // typed wrapper over the Localization module's translation-key lookups (NFR-20)
  video/
    provider.ts              // single interface: createRoom(sessionId), getJoinToken(sessionId, userId), getAttendance(sessionId) — isolates vendor (NFR-18); getAttendance backs FR-37
```

Environment/config (mirrors the pattern used in the CLI's own generated apps, e.g. `VITE_BLOCKS_OIDC_CLIENT_ID` → here `NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID`):

```
NEXT_PUBLIC_BLOCKS_PROJECT_KEY=<tenantId>          # x-blocks-key
NEXT_PUBLIC_BLOCKS_DOMAIN=https://<project>.seliseblocks.com
NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID=<publicClientId>
VIDEO_VENDOR_API_KEY=<server-only secret, never NEXT_PUBLIC_>
```

## 5. Data Model (Blocks Data Gateway schemas)

| Schema | Key fields | Notes |
|---|---|---|
| `MentorProfile` | userId, displayName, photoFileId, title, company, companyVerificationStatus (`unverified\|pending\|verified`), companyVerificationExpiresAt, bio, skills[], languages[], timezone, ratingAvg, ratingCount, sessionCount | `ratingAvg`/`ratingCount` recomputed server-side on review write (FR-22). `companyVerificationStatus` is server-set only (NFR-22); `pending` auto-reverts to `unverified` after `companyVerificationExpiresAt` (48h, FR-33) |
| `MenteeProfile` | userId, goals[], interests[], timezone | New (FR-36). One `userId` can have a `MentorProfile`, a `MenteeProfile`, or both (FR-3/FR-35) — they're independent records, not a shared row |
| `AvailabilityRule` | mentorId, dayOfWeek/recurrence, startTime, endTime, timezone, blackoutDates[] | Derived open-slots computed at query time, not stored as rows-per-slot |
| `Session` | mentorId, menteeId, startAt, endAt, state (`requested\|confirmed\|completed\|cancelled\|no_show`), videoRoomRef, attendedBy[] | State machine per FR-17; write-rule enforces no double-booking (NFR-7). `attendedBy` is populated by the FR-37 attendance-check job, not client-writable |
| `Review` | sessionId, mentorId, menteeId, rating, text, status (`published\|hidden`) | Rule: one per session, only if `Session.state = completed` (FR-21) |
| `Report` | targetType (`review\|profile`), targetId, reporterId, reason, status | Feeds admin moderation queue (FR-23/24) |
| `AuditTrail` | actorId, action, targetId, timestamp | Every admin mutation appends here (FR-32) — same pattern as the RegDocPortal reference app in this workspace |

Access rules (Blocks Data rules, deployed via `blocks data rules deploy`):
- Public/anonymous: read-only on `MentorProfile` public fields only (NFR-10).
- Mentee: create `Session` (booking) and `Review` (own sessions only); read/write own `MenteeProfile`; read own sessions.
- Mentor: update own `MentorProfile`/`AvailabilityRule`; read own sessions.
- A `userId` holding both roles gets the union of both rule sets — the rules key on role claims present on the token, not on an exclusive "account type" (FR-3/FR-35).
- Admin: full read/update on `Report`, suspend on IAM users (via Blocks' native console, FR-30/FR-38), read `AuditTrail`.

## 6. Booking Flow (sequence)

1. Mentee opens `mentors/[id]` → RSC fetches `MentorProfile` + derived open slots via Data Gateway.
2. Mentee clicks a slot → Server Action calls `api/bookings` → Data Gateway write with an access rule that atomically rejects if the slot is already taken (NFR-7) → `Session{state: confirmed}` created (auto-confirm per FR-15).
3. `api/bookings` triggers: Mail (confirmation to both parties, FR-25) + Notification schedule for T-24h/T-1h reminders (FR-26, run via a scheduled job, NFR-5) + async call to `api/video-rooms` to provision the room (NFR-6: booking succeeds even if this is briefly delayed; retried async).
4. At session time, both parties navigate to `sessions/[id]/room`, which calls `lib/video/provider.getJoinToken()` server-side and embeds the vendor's client SDK.
5. After `endAt` + grace period (FR-20), the Scheduled Jobs worker calls `lib/video/provider.getAttendance(sessionId)` (FR-37): both parties joined at any point → `Session.state → completed`; neither joined → `Session.state → no_show`; exactly one joined → `completed` with `attendedBy` recorded. Only the `completed` outcome makes a review eligible (FR-21) and fires the mentor rating recompute rule (FR-22) — a `no_show` session is not reviewable.

## 6a. Company Affiliation Verification (FR-33/34)

A mentor's `company` field is a trust signal (BRD G2), so it can't be taken on faith the way a display name can. Flow:

1. On profile save, if `company` is non-empty and `companyVerificationStatus` isn't already `verified`, the app sets `pending`, stamps `companyVerificationExpiresAt = now + 48h`, and offers "Verify your work email" (optional, never blocking — NFR-21).
2. Mentor enters a `name@company.com` address. A public/generic domain (gmail.com, outlook.com, etc., checked against a small denylist) is rejected client-side before it ever reaches the server.
3. `api/verify-company` (server-side) generates a one-time token, stores it against the `MentorProfile`, and sends the confirmation link via the Mail module (same capability as booking confirmations, FR-25).
4. Clicking the link hits a Route Handler that validates the token server-side (and that `now < companyVerificationExpiresAt`) and flips `companyVerificationStatus → verified` via a Data write — the client never sends this status directly (NFR-22).
5. If the link isn't confirmed before `companyVerificationExpiresAt`, the Scheduled Jobs worker reverts `pending → unverified` (this is the "verify-expiry" job in the architecture diagram) — the mentor can simply re-request the link, no admin action needed for the common case.
6. An admin can also set `verified`/`unverified` manually from the back office (extends FR-30's admin surface) for cases like acquisitions or role changes that a domain check can't capture.

This is intentionally the smallest verification mechanism that removes "type any company name" — it does **not** require an `Organization` tenant entity; that's the separate, deferred v2.2 Enterprise/B2B data model (`01-BRD.md` §8), which is about companies as customers, not mentors proving where they work.

## 7. Deployment Topology

- **Frontend + Route Handlers/Server Actions:** deployed as the Next.js app to **SELISE Blocks Cloud** via the CLI's Release module (`blocks` Release/Deployment configuration — same mechanism referenced in the `blocks-construct-react` example app in this workspace, adapted for a Next.js build output instead of a Vite static build).
- **Backend (IAM/Data/Storage/Mail/Notification):** fully managed by SELISE Blocks Cloud — no servers to operate.
- **Video vendor:** Daily.co, SaaS, no infra owned by us — chosen over generic "some Daily.co-class SDK" because its recording/transcription API directly backs the v1.2 roadmap item (`01-BRD.md` §8) and it exposes a per-room participant/attendance API that FR-37 depends on.
- **CI/CD:** on PR merge → `blocks data sync --dry-run` in CI (fails fast on schema/rule errors) → manual `--yes` approval gate for schema/rules/IAM changes → Release deploy for app code.

## 8. Why this satisfies the NFRs

- **NFR-16/17** — every backend capability goes through `@seliseblocks/client`/`blocks-cli`; every infra-mutating CLI command is dry-run-then-approve, matching the CLI's own guardrails (`AI_START_GUIDE.md` "Use the matching skill and dry-run first").
- **NFR-18** — `lib/video/provider.ts` is the single seam for swapping video vendors.
- **NFR-8/9/10/11** — enforced at the Data-rule and Route-Handler layer, never trusted from the client, per the CLI's own security boundary guidance (never send raw `fetch`/`curl` against Blocks APIs, secrets never reach the frontend).
