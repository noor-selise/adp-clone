# blocks-cli Capability Analysis

**Package:** `@seliseblocks/cli-os` v0.2.1 (local monorepo checkout at `../blocks-cli/blocks-cli`, umbrella workspace `@seliseblocks/packages`)
**Companion SDK:** `@seliseblocks/client` (framework-agnostic frontend TypeScript SDK, sibling package `blocks-client`)
**Purpose (from its own README):** "Terminal/admin/AI control plane for auth, projects, scaffolding, Data config, Release operations, and IAM/MFA/Auth/Mail/Notification/Storage admin."

This section evaluates `blocks-cli` specifically as the backend platform for MentorMatch, mapping every MVP requirement from `02-REQUIREMENTS.md` to a concrete CLI/SDK capability, and calling out the one real gap (Next.js scaffolding).

## 1. What it actually is (not the npm package the name might suggest)

A web search for "blocks-cli" surfaces an unrelated npm package, `@blocks-network/cli` (Blocks Network / blocks.ai) — a Go-binary CLI for scaffolding and running **AI agents** on an agent marketplace network. That is a different product from a different company and is **not** what's installed in this workspace or relevant to MentorMatch. The `blocks-cli` referenced throughout this report is SELISE's `@seliseblocks/cli-os`, confirmed by direct inspection of the local checkout (`package.json` name, `bin/run.js` entry point, `AI_START_GUIDE.md`, and the sibling `blocks-construct-react` reference app in this same workspace).

## 2. Command surface → MentorMatch capability mapping

| CLI command family | What it does | MentorMatch use |
|---|---|---|
| `blocks login` / `auth status` / `projects list` / `use` | Authenticate the CLI and select the target Blocks project (tenant) | One-time dev/ops setup per environment (local, staging, prod) |
| `blocks new web` | Scaffolds a Vite+React+TS app wired to `@seliseblocks/client` | **Not used** — see §3, Next.js is wired manually instead |
| `blocks data schema list/pull/push`, `blocks data rules pull/deploy`, `blocks data sync` | Author and deploy Data Gateway schemas (`MentorProfile`, `AvailabilityRule`, `Session`, `Review`, `Report`, `AuditTrail`) and their access rules | Backs FR-6–24, FR-30–32 (§02-REQUIREMENTS.md) |
| `blocks data files upload` / `dms-upload` | Presigned upload + DMS registration for files | Backs FR-6 (mentor profile photo) |
| `blocks auth users *`, `blocks auth roles/permissions *`, `blocks auth mfa *`, `blocks auth oidc-clients *` | IAM admin: users, roles (mentee/mentor/admin), MFA, OIDC client registration | Backs FR-1–5, FR-30 |
| `blocks mail *` | Mail template/settings configuration | Backs FR-25, FR-27 |
| `blocks notification *` / `blocks notifier *` | Notification channel config (admin) + runtime send/read (app) | Backs FR-26, FR-28, FR-29 |
| `blocks localization *` | Translation key sync | Backs NFR-20 (future-proofing, not required content at MVP) |
| `blocks secrets *` | Secret storage for the project | Stores `VIDEO_VENDOR_API_KEY` server-side config rather than a `.env` committed to source |
| `blocks release *` / Release module (portal) | Deployment configuration and triggering, same mechanism used by the `blocks-construct-react` reference app (RegDocPortal) already in this workspace | Backs NFR-19 (deploy to SELISE Blocks Cloud) |
| `blocks skill list/show/add` | AI-agent-facing conversational workflow library (`blocks-onboarding`, `blocks-data-gateway-configuration`, `blocks-iam-*`, `blocks-release-deployment`, etc.) | Directly de-risks BRD risk "SELISE Blocks platform learning curve" — implementers should run these skills during actual build, not rediscover the CLI from scratch |
| `--dry-run` / `--yes` convention on every mutating command | Every infra-mutating command previews, then requires explicit approval | Backs NFR-17 (dry-run-able config changes) |

## 3. The one real gap: no Next.js scaffolder

Direct inspection of `blocks-cli/blocks-cli/src/lib/scaffold-web/` and `src/commands/new/web.ts` confirms `blocks new web` generates a **Vite + React + TypeScript** SPA (`VITE_BLOCKS_OIDC_CLIENT_ID`, `npm run dev`) — there is no Next.js code-gen path in this version (`0.2.1`) of the CLI.

This is a genuine, verified gap against the "Next.js" requirement, not a guess. It's a low-severity gap because:
- The scaffolder only saves boilerplate (routing shell, layout, auth pages) — it does not gate access to any backend capability.
- `@seliseblocks/client` has no framework dependency; every other capability in the table above is consumed identically whether the frontend is Vite+React or Next.js.
- The workspace already contains a precedent for hand-wiring the SDK outside the generated scaffold pattern (see `blocks-construct-react`'s RegDocPortal, which layers custom `src/lib/blocks/` config on top of the base scaffold).

**Recommendation:** proceed with Next.js per the confirmed decision; absorb the one-time manual SDK wiring cost documented in `03-ARCHITECTURE.md` §4. If SELISE later ships a Next.js scaffolder, the manually-written `lib/blocks/*` modules can likely be deleted in favor of generated equivalents with minimal risk, since they follow the same SDK contract.

## 4. Operating-model fit for a small team (BRD G4 — "operationally lean")

`blocks-cli`'s own guardrails (from `AGENTS.md` / `AI_START_GUIDE.md`) map directly onto good practice this project should inherit rather than reinvent:

- **Never touch local CLI storage/token files directly** — always go through `blocks` commands. MentorMatch's own ops runbook should adopt the same rule for its `VIDEO_VENDOR_API_KEY` and Blocks credentials.
- **Dry-run before every mutation** (schema push, rules deploy, IAM/OIDC changes, release deploy) — directly satisfies NFR-17 with zero extra engineering; it's a CLI convention the team just needs to follow.
- **AI-agent skill library** (`blocks-skills/`) — since this workspace already uses Cursor-based AI agents extensively, implementers should run `blocks skill show <name>` for each capability area during actual build (e.g., `blocks-data-gateway-configuration` before writing the `Session`/`Review` schemas) instead of reverse-engineering flags from source.

## 5. Residual risks specific to the CLI/SDK choice

| Risk | Detail | Mitigation |
|---|---|---|
| Single-vendor backend dependency | All of Auth/Data/Storage/Mail/Notification depend on SELISE Blocks Cloud uptime and roadmap. | Acceptable trade for MVP speed per BRD G4; the video vendor is already isolated (NFR-18) as the one deliberately swappable piece — Blocks itself is treated as foundational infrastructure, not swappable, consistent with the confirmed decision to standardize on it. |
| CLI version drift (`0.2.1` is pre-1.0) | Command flags/behavior may change between versions before a 1.0 release. | Pin the CLI version in CI (`package.json` devDependency, not just global install) and re-run `blocks data validate`/`sync --dry-run` in CI on every schema change to catch drift early. |
| No Next.js scaffold means the SDK wiring in `lib/blocks/` is bespoke, unreviewed-by-vendor code | A future SELISE update to `@seliseblocks/client`'s API surface could require updating this wiring manually. | Keep `lib/blocks/client.ts` as the single import boundary (already required by NFR-16) so an SDK upgrade touches one file, not every feature module. |
