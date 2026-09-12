# Changelog

All changes to this project will be documented in this file.

## [Unreleased]

- Created project folder and researched adplist.org + blocks-cli (`@seliseblocks/cli-os`) as inputs for planning (by AI assistant, 2026-09-13)
- Added Business Requirements Document (`docs/01-BRD.md`) covering vision, scope, stakeholders, success metrics, risks, and post-MVP roadmap (by AI assistant, 2026-09-13)
- Added Functional & Non-Functional Requirements (`docs/02-REQUIREMENTS.md`) — 32 FRs, 20 NFRs (by AI assistant, 2026-09-13)
- Added Next.js + SELISE Blocks architecture document (`docs/03-ARCHITECTURE.md`), including the finding that `blocks-cli`'s scaffolder generates Vite+React rather than Next.js (by AI assistant, 2026-09-13)
- Added original ADPList-inspired design system ("Corner") with tokens and component contracts (`docs/04-DESIGN-SYSTEM.md`) (by AI assistant, 2026-09-13)
- Added `blocks-cli` capability analysis mapping every requirement to a CLI/SDK feature (`docs/05-BLOCKS-CLI-ANALYSIS.md`) (by AI assistant, 2026-09-13)
- Added interactive Archify architecture diagram (`docs/diagrams/mentormatch-architecture.html` + source JSON) (by AI assistant, 2026-09-13)
- Added master planning report tying all documents together (`docs/00-REPORT.md`) (by AI assistant, 2026-09-13)
- Added company-affiliation verification requirement (FR-33/34, NFR-21/22) to close the "any mentor can type any employer name" trust gap, distinguished from the separate deferred v2.2 Enterprise/B2B `Organization`-as-tenant model; updated `01-BRD.md` risks, `02-REQUIREMENTS.md`, `03-ARCHITECTURE.md` data model + new §6a verification flow, and `05-BLOCKS-CLI-ANALYSIS.md` (by AI assistant, 2026-09-13)
- Expanded the Archify architecture diagram to the full 12-node picture — added the async **Scheduled Jobs** worker and **Localization** as a sixth managed Blocks capability, refreshed card copy for the new ops/async surface, and re-validated (0 errors/0 warnings, showcase profile) and re-checked visually (containment pass at 1440×900, 1600×1000, 1920×1080, 2048×1320, light+dark) (by AI assistant, 2026-09-13)
