# Deelan v0.1.0-alpha.0 (Draft)

Release date: TBD

## Alpha Scope

This alpha establishes the core Deelan workflow for private-first Markdown notebooks:

- `deelan` CLI wrapper with user-facing commands:
  - `init`, `validate`, `build`, `serve`, `tags`, `export`
- Distinct post/snippet content model with schema validation and filename-derived IDs.
- Static Astro site generation with:
  - posts/snippets explorers
  - shared `view/<id>` route rendering
  - related-content rendering
  - timeline rendering for posts
- Search and filtering features including structured filters and advanced query mode.
- Analytics route including:
  - sortable tags table
  - tag treemap
  - content relation graph
- Export workflows:
  - self-contained HTML export
  - optional PDF export (Playwright + Chromium)
- Storybook component coverage for active UI primitives.
- Docs refresh for user guide, CLI reference, and developer guide.

## Notable UX/Content Features

- Theme-aware rendering and code highlighting with config-controlled defaults.
- Internal link resolution (`[[post--...]]`, `[[snippet--...]]`).
- Authoring quality features:
  - TOC
  - footnotes
  - admonitions (including collapsible syntax)
  - figure directive with caption and sizing
- Snippet explorer keyboard shortcuts and in-place snippet display.

## Known Limitations (Alpha)

- Surface and naming may still evolve while hardening continues.
- Analytics interactions are intentionally minimal and will be iterated.
- PDF export requires optional dependency install:
  - `npm install playwright`
  - `npx playwright install chromium`
- No built-in auth in `deelan serve`; secure hosting is expected via reverse proxy.
- CI/publish automation is not fully finalized yet.

## Upgrade/Compatibility Notes

- IDs are generated from file type + filename slug (`post--...`, `snippet--...`).
- Content discovery defaults to top-level `*.md` only under:
  - `content/posts/`
  - `content/snippets/`
- Subfolders require explicit inclusion (`--include-subfolder`).

## Verification Snapshot (Pre-Release)

Validated locally on 2026-02-22:

- `npm test`
- `npm run build`
- `npm run storybook:build`
- `npm run docs:build`
- HTML + PDF export smoke for `post--partitioning-primer`
