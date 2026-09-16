# MentorMatch — Mentor and Mentee Registration Flow

**Status:** Draft pending user review  
**Date:** 2026-09-16  
**Project:** AdpList (`D67e7edaf9e1d432288361305fcc74c47`)  
**App domain:** `https://dpkhbr.slsblx.com`

Related: Phase 1 foundation spec (`2026-09-16-mentormatch-phase1-foundation-design.md`), FR-1/FR-2/FR-3/FR-35/FR-36, Corner design system (`docs/04-DESIGN-SYSTEM.md`), [ADPList](https://adplist.org/) IA (not a visual clone).

---

## Goal

A visitor can create an account as a **mentee** or a **mentor**, complete a short first-login profile, and land on the dashboard — without an admin in the loop. A signed-in mentee can later add a mentor profile (and the reverse) without a second account.

---

## Decisions (locked)

| Topic | Decision |
|---|---|
| Done means | Account + IAM roles + track profile + dashboard |
| Who registers | Any visitor (public self-signup) |
| Who does *not* register others | `mentor` / `mentee` never get `mutate-users`; admin still invites via Blocks console |
| Account UI | In-app `/register` via `auth.signup()`, then existing OIDC `/login` |
| Activation | Follow IAM: active → login; pending → check-email + `/activate` |
| Roles on signup | Reuse `admin` / `mentor` / `mentee`. No new roles. |
| Default roles | `defaultRolesForNewUser: ["mentor", "mentee"]` — Blocks cannot assign one role per URL without a service token; the client is browser-only |
| Product track | `as=mentee` \| `as=mentor`, not “which IAM role they hold” |
| Dashboard gating | **Profile records**, not IAM role membership |
| Onboarding surface | Dedicated `/onboarding` with a hard gate |
| Mentor required fields | Display name, title. Timezone from browser |
| Mentee required fields | At least one goal, at least one interest. Timezone from browser |
| FR-3 add-the-other-track | Reuse `/onboarding?as=mentor` or `?as=mentee`; `/become-a-mentor` and `/become-a-mentee` are aliases |
| Landing CTA | ADPList *voice and IA*; button is **Get started**, not “Get matched” (no directory yet) |
| Mentee signup vs directory | Open both tracks now. Mentee empty state is honest. Seed mentors already exist |

---

## Explicit deviations from existing docs

| Doc | Requirement | This spec |
|---|---|---|
| FR-2 | Mentor onboarding includes company, skills, bio, availability | Name + title only. Rest on `/settings/profile`. Availability/photo are Phase 2 |
| Design system §5 | Example CTA “Get matched with a mentor” | Headline may be ADPList-like. Primary button: **Get started** until directory ships |
| G3 / NFR-13 | Under 5 minutes to first booking | Out of this slice. No browse/book UI |
| FR-1 | Google SSO | Out. Email + password only. SSO signup stays off |
| NFR-20 | All strings via Localization keys | English copy in components, matching the current app. No localization wrapper in this slice |
| BRD §11 | Seed mentors before public mentee signup | Already seeded (`mentor1–3`). Opening mentee signup is allowed; missing piece is directory UI |
| Architecture | `/become-a-mentor/page.tsx` as its own page | Same form at `/onboarding?as=mentor`; alias routes redirect |

---

## Out of scope

- Mentor directory, search, matching quiz, booking, video, reviews
- Google SSO, MFA, photo upload, availability, company verification
- Admin-in-app user create
- Cloning ADPList Trustpilot, logos, stats, or long-scroll marketing sections
- Dual-role `RoleSwitcher` chrome (dashboard may *show* both sections once both profiles exist; the segmented switcher is still later)

---

## Live IAM (do not recreate)

Observed 2026-09-16:

| Slug | Users |
|---|---|
| `admin` | `noor@yopmail.com` |
| `mentor` | `mentor1@yopmail.com`, `mentor2@yopmail.com`, `mentor3@yopmail.com` |
| `mentee` | none |
| `clouduser` | platform |

Signup policy **today** (must change, human-confirmed at implementation):

```
isSignUpEnable: false
isEmailPasswordSignUpEnabled: false
isSSoSignUpEnabled: false
defaultRolesForNewUser: []
defaultPermissionsForNewUser: []
```

`auth.signup()` will fail until email/password signup is enabled.

Admin already holds `blocks-iam::iam::mutate-users`. Mentors do not. Keep it that way.

---

## IAM change (implementation, `--dry-run` then confirm)

Target signup settings:

| Field | Value |
|---|---|
| Email/password signup | enabled (`true`) |
| SSO signup | **disabled** (`false`) |
| `defaultRolesForNewUser` / `--default-roles` | `mentor,mentee` |
| `defaultPermissionsForNewUser` | empty (roles already carry permissions) |

Do not create roles. Do not grant `mutate-users` to `mentor` or `mentee`.

After save, `blocks iam signup-settings get --json` must show email/password signup enabled, SSO signup disabled, and default roles `mentor` and `mentee`. If `isSignUpEnable` is still false, stop — do not ship `/register` against a tenant that rejects signup.

---

## User flows

### A — New mentee (primary)

```
Landing  →  Get started  →  /register?as=mentee
         →  auth.signup({ email, password, firstName, lastName })
         →  IAM active?  no → pending screen; /activate?code= if present
         →  yes → /login (existing OIDC)
         →  /login/callback
         →  no MenteeProfile → /onboarding?as=mentee
         →  create MenteeProfile → /dashboard (mentee section only)
```

### B — New mentor

Same, with `as=mentor`, mentor onboarding fields, `MentorProfile`, dashboard mentor section only.

### C — Logged-in mentee becomes a mentor (FR-3)

Logged in, has `MenteeProfile`, no `MentorProfile` → `/onboarding?as=mentor` (or `/become-a-mentor`) → create `MentorProfile` → dashboard shows **both** sections.

Inverse: `/onboarding?as=mentee` or `/become-a-mentee`.

Logged out “Become a mentor” → `/register?as=mentor`.  
Already has that profile → `/dashboard`.

### D — Skip onboarding

| Actor | Behavior |
|---|---|
| `admin` only (e.g. `noor@yopmail.com`) | Never onboarding. Dashboard as today |
| Seed mentor with `MentorProfile` | Dashboard |
| Seed mentor with no `MentorProfile` | Mentor onboarding (infer track from having `mentor` and not `mentee`) |

---

## Track resolution

Query/storage values are only `mentee` or `mentor`. Anything else is ignored.

`sessionStorage` key: `mentormatch:register-track`.

Resolution order:

1. Valid `as` query param (write-through to sessionStorage).
2. Else sessionStorage.
3. Else if exactly one of the two profiles exists: no onboarding; go dashboard.
4. Else if neither profile:
   - IAM roles include `mentor` and not `mentee` → mentor form
   - include `mentee` and not `mentor` → mentee form
   - both, or neither of those two → two-card picker (“Get guidance” / “Become a mentor”)
5. `admin` without `mentor`/`mentee` → dashboard (step 4 never applies).

---

## Hard gate

Authenticated routes `/dashboard` and `/settings/profile` (and later `(app)` pages) must redirect to `/onboarding` when the user **still needs a first-track profile**:

- Needs onboarding if neither `MentorProfile` nor `MenteeProfile` exists **and** the user is not admin-only.
- Also needs onboarding if they are explicitly on a become-* path (`as` set) and that profile is missing (FR-3), even if the other profile exists.

`/onboarding` itself is behind `RequireAuth`.  
`/register` and `/activate` are public. If already authenticated, `/register` redirects using the same gate (onboarding vs dashboard).

Do **not** key this gate on “has IAM role `mentor`” alone — every self-signup will have both roles.

---

## Pages and copy

Corner tokens only (`docs/04-DESIGN-SYSTEM.md`). Single-column forms, quiet chrome (design system booking-flow principle applied to register/onboarding). Visible focus ring. Brand coral is not body text.

### Landing `web/app/(public)/page.tsx`

- Header: **Log in** → `/login`. Primary **Get started** → `/register?as=mentee`.
- Hero headline (ADPList-like, honest): e.g. “Get unstuck. With a mentor who gets it.”
- Hero button: **Get started** (not “Get matched with a mentor”).
- Subline: “Create your profile — booking comes next.”
- Secondary text link: **Become a mentor** → `/register?as=mentor`.
- Do not add Trustpilot, company logo strips, or a fake matcher.

### Register `web/app/(public)/register/page.tsx`

One form. Copy depends on `as`:

- Mentee: “Find your next step with a mentor.”
- Mentor: “Be someone in their corner.”

Fields: first name, last name, email, password, confirm password (confirm is UI-only, never sent). Check `iam.users.emailAvailable` before submit. Duplicate → inline error + link to Log in.

Submit: `auth.signup({ email, password, firstName, lastName })`. Persist track. Then login or pending state.

Footer: “Already have an account? Log in.”

### Login `web/app/(public)/login/page.tsx`

Keep OIDC “Continue with Blocks”. Add “Create an account” → `/register?as=mentee`.

### Activate `web/app/(public)/activate/page.tsx`

Only when IAM returns pending or the URL has `code`. `validateActivation` then `activate`. Do not send a confirm-password field. Then send them to `/login`. Resend uses `auth.resendActivation` when the code is invalid/expired.

If signup response indicates the account is already active, skip this page.

### Onboarding `web/app/(app)/onboarding/page.tsx`

Minimal header (logo + sign out), no dashboard nav.

**Mentee form:** one goals field and one interests field, comma-separated, same `splitList` helper as `/settings/profile`. Each must parse to a non-empty `string[]`. Timezone hidden/default `Intl.DateTimeFormat().resolvedOptions().timeZone`.

**Mentor form:** display name (required), title (required), timezone same default. Pre-fill display name from `firstName + lastName` or email local-part when IAM `me` has names.

**Picker:** two cards, then the matching form. Do not create a profile until they submit.

Create via `getBlocksClient().data.collection("MentorProfile"|"MenteeProfile").create(...)`.  
`userId` = same identifier `/settings/profile` already uses (`claims.sub`).  
Mentor create includes `companyVerificationStatus: "unverified"` (never `"verified"` from the client — NFR-22).

On success: clear become-* intent from the URL and go `/dashboard`. On failure: stay, show the IAM/Data error.

### Dashboard

- Mentor card if `MentorProfile` exists (not merely because they have the `mentor` role).
- Mentee card if `MenteeProfile` exists.
- Admin card unchanged (permission `mentormatch::ui::admin-panel`).
- Mentee with no directory yet: empty copy “Your profile is ready. Finding mentors is next.”
- Footer/nav **Become a mentor** if authenticated, no `MentorProfile`. **Also book as a mentee** if authenticated, no `MenteeProfile`.

### Aliases

- `web/app/(app)/become-a-mentor/page.tsx` → redirect `/onboarding?as=mentor`
- `web/app/(app)/become-a-mentee/page.tsx` → redirect `/onboarding?as=mentee`

---

## Data and access rules

Schemas already exist. Do not add fields.

`blocks/data/rules.json` is locally empty (`"policies": []`). Onboarding create will 403 until owner-write policies are deployed.

Required policy intent (pull live rules first, then merge — do not clobber portal policies):

- Authenticated owner: create/read/update own `MentorProfile` / `MenteeProfile` where `userId` equals the caller.
- Admin: read all profiles.
- Public read of mentor public fields can wait for the directory slice if not already live; this slice only needs **owner create/read/update** so onboarding and settings work.

Workflow: `blocks data rules pull` → edit → `blocks data validate` → `blocks data sync --dry-run` → human confirm → `--yes`.

One profile per user per schema: if create hits a duplicate `userId`, treat as success and continue (or update). Do not leave them stuck on onboarding.

---

## Errors

| Case | UI |
|---|---|
| Signup disabled (settings not applied) | Inline: registration is not available; do not dump a raw stack |
| Email taken | “An account with this email already exists” + Log in |
| Password mismatch | Client-only, before submit |
| IAM password policy reject | Surface IAM message |
| Activation expired | Message + resend |
| Profile create 403 | Stay on onboarding; message that save failed (rules likely not deployed) |
| Network/SDK throw | Inline error, form stays filled |

---

## Testing

**Pure functions** (no Blocks): track parse; `needsOnboarding(roles, profiles, track)`; dashboard section visibility from profiles.

**Manual / browser (HTTPS on `https://dpkhbr.slsblx.com`):**

1. New mentee: landing Get started → register → login → mentee onboarding → dashboard mentee card only, honest empty copy.
2. New mentor: Become a mentor → register → login → mentor onboarding → dashboard mentor card only.
3. Logged-in mentee: Become a mentor → mentor form → both cards.
4. `mentor1@yopmail.com`: skips onboarding if profile exists.
5. `noor@yopmail.com`: never onboarding.
6. Duplicate email on register.
7. Keyboard + focus ring on register and onboarding (NFR-14 for this flow).

---

## Success criteria

- Visitor completes mentee path and mentor path without an admin.
- First-login user cannot reach dashboard until the chosen track profile exists.
- Admin and seeded mentors with profiles are unchanged.
- Enabling signup is dry-run + confirmed; no new IAM roles.
- Landing does not promise matching or booking.

---

## Implementation notes

- Skills: `blocks-iam-account` (signup, activate, emailAvailable), `blocks-iam-sso-oidc-implementation` (existing login), `blocks-iam-organizations` (signup-settings, confirm before save), `blocks-data-gateway-crud` (`collection().create`), `blocks-data-gateway-configuration` (rules pull/sync), `blocks-frontend-local-https` (cookie session).
- Never raw `fetch`/`curl` to `api.seliseblocks.com`.
- Do not put a CLI impersonation token in the Next.js app.
- Signup-settings and rules deploy are mutating: `--dry-run`, then explicit user `--yes`.
