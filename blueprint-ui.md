# DEELAN Blueprint (UI)

Concrete UI evolution plan separate from core functionality.

## UI Phase 1: No-Framework Polish

Goal: improve quality and consistency using existing CSS/tokens, no framework migration.

Scope:

1. Information architecture polish
- Tighten page hierarchy and spacing rhythm.
- Align nav/headers/metadata blocks across posts/snippets/detail views.

2. Typography and readability
- Improve type scale and line-length for long-form reading.
- Tune code block sizing and contrast for light/dark themes.

3. Visual system hardening
- Expand design tokens (spacing, border radii, shadows, semantic colors).
- Standardize interactive states (hover/focus/active/disabled).

4. Responsive behavior
- Improve breakpoints for table/list/snippet sidebar layouts.
- Verify keyboard and touch usability for filters and toggles.

Deliverables:

- Updated token definitions and global styles.
- Refined layout components (shared shell + repeated UI primitives).
- UI regression checklist for posts/snippets/detail pages.

## UI Phase 2: Tailwind Pilot Branch and Comparison

Goal: run a low-risk experiment before committing to adoption.

Branch strategy:

- Create pilot branch: `codex/ui-tailwind-pilot`.
- Keep `main` unchanged except critical fixes.

Pilot scope (targeted only):

1. Apply Tailwind to shared shell and index/list pages.
2. Keep markdown rendering area and export CSS untouched.
3. Preserve existing functionality and page structure.

Comparison criteria (before/after):

1. Developer velocity
- Time to implement small UI changes.

2. Maintainability
- Readability of markup/styles.
- Ease of enforcing consistency.

3. Bundle/tooling impact
- Build time and generated CSS footprint.

4. Design quality
- Visual consistency, accessibility, and perceived polish.

Exit decision:

- Adopt Tailwind, partially adopt, or reject and continue no-framework path.

## UI Phase 3: Migration Plan (If Tailwind Adopted)

Goal: controlled adoption into main branch with minimal churn.

Steps:

1. Foundation setup
- Add Tailwind config and token mapping.
- Define theme strategy (CSS variables + Tailwind utilities).

2. Incremental migration order
- Shared shell and nav/footer.
- Posts/snippets list pages.
- Detail page metadata/layout wrappers.
- Keep markdown content styles as a dedicated layer.

3. Quality gates
- Visual QA checklist across breakpoints/themes.
- Accessibility checks for focus states and contrast.
- Build/perf checks on CSS output.

4. Documentation and onboarding
- Document class/style conventions.
- Provide examples of component patterns.
- Update developer docs with migration rationale and rules.

Fallback:

- If migration cost or quality regresses, stop at partial adoption and retain hybrid approach.
