# Deelan Blueprint (Core)

Data Engineering Electronic LAboratory Notebook (Deelan)

## Status Snapshot (2026-02-20)

### Completed

- Runtime/platform baseline:
    - Node + npm
    - Astro static-first app
    - Markdown + YAML frontmatter content
- Content model and identity:
    - IDs are filename-derived: `post--<slug>` / `snippet--<slug>`
    - Type inferred from folder (`posts` / `snippets`), optional override still validated
    - Split schema behavior: posts support `version`/`status`; snippets do not
- Core rendering/features:
    - Shiki build-time highlighting
    - MathJax offline setup
    - Internal links and markdown enhancements in place
- Search/indexing:
    - Boolean query parser + structured filters
    - Build-time indexes for posts/snippets
    - Top-level-only content discovery with optional `--include-subfolder`
- Timeline/versioning:
    - Git timeline artifact generated and rendered in UI
    - Commit URL templating support in config
- Export:
    - Unified export command/script (`scripts/export.ts`)
    - HTML/PDF export via `/view/<id>` rendering parity
    - Theme override and PDF scale support
- Tooling/docs:
    - Thin `deelan` CLI wrapper implemented (`init/build/serve/tags/export/validate`)
    - Storybook integrated
    - MkDocs docs pipeline integrated

### In Progress

- Hardening and packaging polish tracked in `.blueprint/backlog.md`

### Remaining / Planned

- Optional `--inline-assets` export mode
- CI/release automation polish for alpha-to-stable flow
- Optional per-item changelog surfacing in UI

### Postponed

- None in core beyond Phase 3 backlog items

## Architecture Notes (Current)

- Routes:
    - list/explorer routes for posts/snippets
    - canonical detail route: `/view/<id>`
- Generated artifacts:
    - `.generated/search/*`
    - `.generated/timeline/versions.json`
    - `.generated/analytics/*`
- Public prepared assets:
    - search runtime (`public/js/search-core.js`)
    - content assets mirrored to `public/content-assets/...`
    - MathJax assets under `public/mathjax`
- Config:
    - timezone formatting
    - default/code themes
    - timeline commit URL template

## Core Milestones

### Phase 1 (MVP) — Completed

- Static scaffold, core routes, content validation, markdown rendering, search, timeline, export baseline, tests.

### Phase 2 (Enhancements) — Completed

- Tag CLI, config-driven shell/theme, docs workflow, Storybook integration, route consolidation to `/view/<id>`, analytics phase 1.

### Phase 3 (Backlog) — Open

- Inline-assets export mode
- Changelog surfacing
- Additional automation/CI hardening
