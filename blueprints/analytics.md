# Analytics Blueprint

## Status Snapshot (2026-02-26)

### Completed

- Phase 1 build pipeline implemented:
    - `scripts/build-analytics.ts`
    - `build:analytics` command integrated into preflight/build flow
    - artifacts generated:
    - `.generated/analytics/tags.json`
    - `.generated/analytics/relations.json`
- Phase 1 UI implemented on `/analytics`:
    - summary cards
    - sortable tags table
    - minimal static hierarchy/treemap-style view
    - relations graph with node selection panel
    - node selection metadata panel with build-time network metrics
    - Cytoscape graph metrics reference link in UI
- Documentation and tests added:
    - `docs/user-analytics.md`
    - analytics build test coverage

### In Progress

- None; phase 1 scope is complete.

### Remaining / Planned

- Phase 2 richer analytics:
    - interactive hierarchy drill-down (full treemap/icicle UX)
    - co-occurrence exploration surface (matrix/heatmap)
    - optional analytics export formats (JSON/CSV/image)
    - richer graph interactions (focus/expand/collapse/neighbor filtering)

### Postponed

- Heavy analytics/UI complexity (full interaction model) deferred to phase 2.

## Scope and Principles

- Keep analytics static-site friendly:
    - build-time JSON generation
    - client-side rendering only
- Keep payload and dependency cost reasonable for default usage.

## Phase Plan

### Phase 1 (v1) — Completed

- High impact, low risk implementation now live.
- Includes:
    - build-time graph metrics (`degree`, `closeness`, `betweenness`, `pagerank`, components)
    - sortable tag table and static treemap
    - relation graph with node inspector

### Phase 2 (v2) — Open

- Rich interaction and deeper metrics, after core alpha hardening priorities.
