---
name: design-system-adplist-find-your-next-step-with-a-mentor
description: Creates implementation-ready design-system guidance with tokens, component behavior, and accessibility standards. Use when creating or updating UI rules, component specifications, or design-system documentation.
---

<!-- TYPEUI_SH_MANAGED_START -->

# ADPList — Find your next step with a mentor.

## Mission
Deliver implementation-ready design-system guidance for ADPList — Find your next step with a mentor. that can be applied consistently across content site interfaces.

## Brand
- Product/brand: ADPList — Find your next step with a mentor.
- URL: https://adplist.org/
- Audience: readers and knowledge seekers
- Product surface: content site

## Style Foundations
- Visual style: structured, accessible, implementation-first
- Main font style: `font.family.primary=-apple-system`, `font.family.stack=-apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif`, `font.size.base=16px`, `font.weight.base=400`, `font.lineHeight.base=24px`
- Typography scale: `font.size.xs=9px`, `font.size.sm=10px`, `font.size.md=11px`, `font.size.lg=12px`, `font.size.xl=13px`, `font.size.2xl=14px`, `font.size.3xl=15px`, `font.size.4xl=16px`
- Color palette: `color.text.primary=#282134`, `color.text.secondary=#e2cbd3`, `color.text.tertiary=#ffffff`, `color.text.inverse=#767179`, `color.surface.base=#000000`, `color.surface.muted=#fffdfa`, `color.surface.strong=#fffefa`, `color.border.default=#e5e7eb`, `color.border.strong=#e4ddd8`
- Spacing scale: `space.1=1px`, `space.2=4px`, `space.3=5px`, `space.4=7px`, `space.5=8px`, `space.6=12px`, `space.7=13px`, `space.8=14px`
- Radius/shadow/motion tokens: `radius.xs=8px`, `radius.sm=13px`, `radius.md=14px`, `radius.lg=20px`, `radius.xl=30px`, `radius.2xl=50px` | `motion.duration.instant=180ms`, `motion.duration.fast=200ms`, `motion.duration.normal=300ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
concise, confident, implementation-focused

## Rules: Do
- Use semantic tokens, not raw hex values in component guidance.
- Every component must define required states: default, hover, focus-visible, active, disabled, loading, error.
- Responsive behavior and edge-case handling should be specified for every component family.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and tokens.
3. Define component anatomy, variants, and interactions.
4. Add accessibility acceptance criteria.
5. Add anti-patterns and migration notes.
6. End with QA checklist.

## Required Output Structure
- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Prefer system consistency over local visual exceptions.

<!-- TYPEUI_SH_MANAGED_END -->
