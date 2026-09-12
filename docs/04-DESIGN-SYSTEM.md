# Design System — "Corner" (MentorMatch original design language)

**Direction confirmed:** original design system, inspired by ADPList's warm/human/professional mentorship branding (not a 1:1 skin of an existing `awesome-design-md` brand).
**Brand personality:** warm, credible, unpretentious, human-first — "a real conversation, not a course."

---

## 1. Brand Rationale

ADPList's visual language works because it constantly foregrounds **real people** (mentor photos, star ratings, review quotes) over abstract iconography, and keeps UI chrome quiet so the content (a person, a slot, a quote) is the hero. "Corner" (the name for this design language — "someone in your corner") follows the same principle: minimal ornament, generous whitespace, and a single warm accent color used sparingly against a mostly neutral, editorial-feeling canvas.

## 2. Design Tokens

### 2.1 Color

```
--color-bg:            #FFFFFF
--color-bg-subtle:     #F7F6F3   /* warm off-white, not cold gray */
--color-bg-inset:      #F1EFEA
--color-border:        #E7E3DB
--color-text:           #1A1917   /* near-black, warm undertone */
--color-text-muted:    #6B6862
--color-text-faint:    #97938B

--color-brand:         #E8532E   /* warm coral-orange — primary accent, used sparingly */
--color-brand-hover:   #D2431F
--color-brand-subtle:  #FDEDE7   /* tinted backgrounds for badges/highlights */

--color-success:       #1F7A4D
--color-success-bg:    #E9F5EE
--color-warning:       #B7791F
--color-warning-bg:    #FBF1E1
--color-danger:        #C4342B
--color-danger-bg:     #FBEAE8

--color-rating-star:   #F2A900   /* distinct from brand accent — ratings are their own signal */
```

Dark mode is a v1.1 nicety, not MVP-blocking; tokens are structured (semantic names, not raw hex in components) so a `--color-*` dark palette can be swapped in later without touching component code.

### 2.2 Typography

```
--font-display: "General Sans", "Inter", system-ui, sans-serif   /* headlines, mentor names */
--font-body:    "Inter", system-ui, sans-serif                    /* everything else */

--text-xs:   12px / 16px
--text-sm:   14px / 20px
--text-base: 16px / 24px
--text-lg:   18px / 28px
--text-xl:   22px / 30px
--text-2xl:  28px / 36px
--text-3xl:  36px / 44px
--text-4xl:  48px / 56px   /* hero headline only */

--font-weight-regular: 400
--font-weight-medium:  500
--font-weight-semibold: 600
--font-weight-bold:    700
```

Rule: only hero/section headlines use `--font-display`; every UI label, button, card, and form uses `--font-body`. This keeps the "editorial but not decorative" balance ADPList strikes.

### 2.3 Spacing (4px base scale)

```
--space-1: 4px   --space-2: 8px   --space-3: 12px   --space-4: 16px
--space-5: 20px  --space-6: 24px  --space-8: 32px   --space-10: 40px
--space-12: 48px --space-16: 64px --space-20: 80px  --space-24: 96px
```

### 2.4 Radius & Elevation

```
--radius-sm: 6px    /* inputs, small tags */
--radius-md: 10px   /* buttons, cards */
--radius-lg: 16px   /* profile cards, modals */
--radius-full: 999px /* avatars, pills */

--shadow-sm: 0 1px 2px rgba(26,25,23,0.06)
--shadow-md: 0 4px 12px rgba(26,25,23,0.08)
--shadow-lg: 0 12px 32px rgba(26,25,23,0.12)
```

Flat design bias: shadows are used only on hover/focus states and modals, not as default card decoration — matches ADPList's mostly-flat card grid.

## 3. Core Components (contract-level, no code)

| Component | Key states | Notes |
|---|---|---|
| `MentorCard` | default, hover (lift + shadow-md), loading (skeleton) | Photo (1:1, radius-full), name (semibold, text-lg), title/company (text-sm, muted), rating row (star icon + `--color-rating-star`, review count in parens), session-count chip |
| `AvailabilityChip` | open, selected, past/disabled | Pill shape (radius-full), open = brand-subtle bg + brand text; selected = solid brand bg + white text |
| `BookingButton` | default, loading, success, disabled | Primary button style; success state swaps label to a checkmark + "Booked" for 2s before navigating |
| `RatingStars` | read-only, interactive (review form) | 5-star row; interactive variant has hover-preview fill |
| `ReviewCard` | published | Quote-forward layout (mirrors ADPList's Trustpilot-style testimonial cards): large quote text, reviewer name/role small below |
| `FilterBar` | default, active-filter-count badge | Category pills + rating dropdown + language dropdown, sticky on scroll within directory page |
| `Toast/Notification` | info, success, warning, danger | Uses the four semantic color pairs above |
| `EmptyState` | no-results, no-sessions-yet | Illustration-light: an icon + one sentence + one primary action, never a wall of text |
| `RoleSwitcher` | mentee-only, mentor-only, both (active-tab) | Small segmented control in the dashboard header, shown only once an account holds both `MentorProfile` and `MenteeProfile` (FR-3/FR-35) — a single account is never forced to pick one identity |
| `AdminReportQueue` | pending, resolved | The one custom-built admin surface (FR-31/FR-38); plain table layout, not styled to match the marketplace-facing pages — utilitarian is correct here, it's an internal tool |

## 4. Layout Principles

1. **Content-first grid**: 12-column grid, max content width 1200px, generous 96px+ vertical rhythm between sections on marketing/landing pages (mirrors the long-scroll, section-per-idea structure of adplist.org's homepage).
2. **Directory = dense but breathable**: 3-column mentor card grid on desktop (2 on tablet, 1 on mobile), `--space-6` gutter, `--space-10` between filter bar and results.
3. **Booking flow = single-column, no distractions**: once a mentee is inside a booking flow, strip the global nav down to a minimal header (logo + exit) so nothing competes with the decision.
4. **Trust signals always visible, never buried**: rating, review count, and session count appear on the card, the profile header, and the booking confirmation — never require a click to see them.

## 5. Voice & Microcopy

- Second person, warm, low-jargon: "Get matched with a mentor" not "Initiate mentor matching."
- Buttons are verbs: "Book this slot", "Leave a review", not "Submit."
- Empty/error states are reassuring, not clinical: "No mentors match yet — try widening your filters" not "0 results found."

## 6. Accessibility Baseline (ties to NFR-14)

- Brand coral (`#E8532E`) on white passes AA for large text/icons only — always paired with the near-black `--color-text` for body copy, never used as body text color itself.
- All interactive chips/buttons carry a visible focus ring (`2px solid --color-brand`, offset 2px) in addition to hover state — hover-only affordance is disallowed.
- Star ratings expose an `aria-label` with the numeric value ("4.8 out of 5 stars, 187 reviews"), not just visual stars.

## 7. Next Steps for a Visual Design Pass

This document defines tokens and component contracts sufficient to brief a designer or a component-library implementation (e.g., shadcn/ui primitives themed to these tokens). Pixel-level mockups (Figma) are intentionally out of scope for this report per the "don't write code / just planning docs" instruction — see `00-REPORT.md` §6 for how to sequence a follow-up `design-flow` pass (tokens → IA → hi-fi mockups) once this BRD is approved.
