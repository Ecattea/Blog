# Dark-Mode Deferral & Future-Proof Token Strategy

Linear issue: **ECA-88**

This document records the decision to **defer Dark Mode** during the current reader-experience phase and defines the semantic-token principles that keep a future dark-mode layer cheap to add.

## Decision

Dark Mode is out of scope for the current milestone. All visual review, token tuning, and editorial styling work targets Light Mode only.

The deferral is deliberate, not accidental. Several active slices now touch typography, surfaces, popovers, captions, and interaction states. Without an explicit strategy those slices could hardcode absolute color names, flat surface assumptions, or brittle border values that become expensive to invert later.

This strategy exists to prevent that drift while keeping Dark Mode squarely out of the current implementation scope.

## Core Principles

When introducing or materially reshaping a token during the current pass, follow these four principles.

### 1. Intent-Based Naming

Token names must describe purpose, not appearance.

Anti-patterns (names that break logically in dark mode):

- `--text-dark-gray`, `--bg-white`, `--border-light`

Preferred patterns:

- Text: `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`
- Backgrounds: `--color-bg-canvas` (page root), `--color-bg-surface` (cards/blocks), `--color-bg-popover` (floating panels)
- Borders: `--color-border-subtle`, `--color-border-strong`

### 2. Surface Elevation

Light mode and dark mode express elevation through opposite physical metaphors:

- Light mode uses **shadows** against a light background.
- Dark mode uses **lighter background tints** (shadows are invisible against dark surfaces).

Even when two surfaces share the same hex value in light mode, they should use separate tokens if they occupy different elevation levels. A code-block surface and a floating popover may both be `#FFFFFF` today, but a future dark layer needs to assign them different values (e.g., `#1E1E1E` vs `#2C2C2C`) to express elevation.

### 3. Alpha-Channel Borders and States

Borders, dividers, and interaction states (hover, focus, active) should prefer alpha-channel values over solid hex colors.

Anti-patterns:

- `--color-border: #E5E5E5;`
- `--color-hover: #F0F0F0;`

Preferred:

- `--color-border: rgba(0, 0, 0, 0.1);`
- `--color-hover: rgba(0, 0, 0, 0.04);`

Alpha-channel values adapt naturally to different background tints. In a future dark layer they flip to `rgba(255, 255, 255, ...)` without tuning individual hex values.

### 4. Contrast Restraint

Avoid pure black (`#000000`) on pure white (`#FFFFFF`). High-contrast extremes cause halation and are equally harsh when inverted for dark mode.

Use off-blacks for text (e.g., `#1C1917`) and paper-toned backgrounds (e.g., `#FAFAF9`). This soft-contrast baseline maps naturally to comfortable dark-mode values (e.g., `#E0E0E0` text on `#121212` background) in a future pass.

## Current Token Audit

The shared token file `src/styles/tokens.css` already follows these principles for the most part.

**Semantic palette tokens** (compliant):

| Token | Value | Notes |
|-------|-------|-------|
| `--color-bg-canvas` | `#fafaf9` | Off-white page root. Semantic name. |
| `--color-bg-surface` | `rgba(255, 255, 255, 0.5)` | Alpha-channel card surface. |
| `--color-bg-surface-elevated` | `#ffffff` | Pure white, but semantically named and redefinable. |
| `--color-text-primary` | `#1c1917` | Off-black. |
| `--color-text-secondary` | `#57534e` | Muted. |
| `--color-text-body` | `#292524` | Off-black body text. |
| `--color-accent-primary` | `#2563eb` | Semantic accent role. |
| `--color-border-subtle` | `rgba(231, 229, 228, 0.6)` | Alpha channel. |
| `--color-border-strong` | `rgba(231, 229, 228, 1)` | Semantic name, but solid value; acceptable for now. |

**Legacy aliases** (`--bg-canvas`, `--text-primary`, etc.) point to their semantic counterparts and will be retired incrementally. They are not a dark-mode blocker because they resolve to the semantic tokens at runtime.

**Typography tokens** (`--type-*`) are mode-neutral by nature (sizes, weights, line-heights) and do not need a dark-mode mapping.

**Observation**: `--color-bg-surface-elevated` uses `#ffffff` (pure white), which technically tensions with Principle 4. However, it is semantically named and scoped to a single token, so a future dark layer can redefine it to an appropriate elevated surface value without renaming. No current action is required.

## What Counts as "New or Materially Reshaped"

This strategy applies when a current slice:

- **Creates** a new `--color-*` custom property.
- **Renames** or **changes the role** of an existing `--color-*` token (not just tweaking its value within the same role).
- **Introduces** a new surface, border, or interaction-state value that does not yet have a token.

It does **not** apply when a slice merely:

- Consumes an existing token in a new CSS rule.
- Adjusts the numeric value of an existing token within its current role (e.g., tuning `--color-border-subtle` opacity from `0.6` to `0.5`).

## Implementation Checklist for Current Slices

When building or modifying Light Mode components:

1. **Prefix consistently**: `--color-text-*`, `--color-bg-*`, `--color-border-*`, `--color-action-*`.
2. **Separate surfaces by elevation**: never hardcode `background: white`; map to a semantic surface token.
3. **Use alpha for interactions**: define hover/active/focus states with `rgba(0, 0, 0, X)`.
4. **Avoid pure extremes**: keep text off-black and backgrounds off-white or paper-toned.

## Scope Boundaries

This strategy is a **guardrail**, not a migration mandate.

**In scope:**

- Documenting the deferral decision and token principles.
- Guiding new or reshaped tokens introduced by current slices.
- Keeping the reader-experience refinement plan scoped to light-mode visual review.

**Out of scope:**

- Enabling Dark Mode in the site runtime.
- Adding a `prefers-color-scheme: dark` implementation layer.
- Repo-wide renaming of every existing color token in one pass.
- Visual QA for a dark theme in the current milestone.
- Forcing current slices into a full design-token or palette rewrite.

## Relationship to the Reader-Experience Plan

The active reader-experience refinement plan (`tmp-reader-experience-refinement-plan.md`) includes a "Current Visual Mode Boundary" section that:

- Scopes all visual review to light mode only.
- Requires intent-based semantic naming for new tokens.
- Requires alpha channels for borders and interaction states.
- Requires surface-elevation differentiation even when light-mode values match.
- Mandates a separate follow-up audit if site-level dark mode is re-enabled.

That section references this issue (ECA-88) as the standalone strategy. The two documents are complementary: this strategy defines the principles; the refinement plan applies them as a guardrail for individual slices.

## Future Follow-Up Path

When Dark Mode is re-enabled:

1. Create a dedicated Linear issue referencing **ECA-88** as the semantic-token baseline.
2. Audit `src/styles/tokens.css` and any component-local color values against the four principles above.
3. Add a `@media (prefers-color-scheme: dark)` (or class-based toggle) block that redefines token values. The goal is value redefinition only, with no DOM restructuring or CSS variable renaming.
4. Run visual QA across all reader-facing surfaces in both modes.

Until that follow-up issue is created, Dark Mode remains deferred and no slice should silently widen scope to include dark-mode tuning.
