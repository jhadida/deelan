# Developer Notes

## Build Pipeline

`npm run build` executes:

1. `prepare:mathjax`
2. `sync:search-core`
3. `validate`
4. `build-indexes`
5. `build-git-timeline`
6. `astro build`

## Test Workflow

- Run unit tests:
  - `npm test`
- Current test scope:
  - search query parsing (`&`, `|`, parentheses, structured filters)
  - search evaluation (text logic, hierarchical tags, date ranges)
- Test file:
  - `tests/search.test.ts`

## Key Build Artifacts

- `generated/search/posts-index.json`
- `generated/search/snippets-index.json`
- `generated/manifests/content-manifest.json`
- `generated/timeline/versions.json`

These are generated files and should not be treated as source-of-truth content.

## Script vs Library Separation

- `scripts/*`: build entrypoints and orchestration commands
- `src/lib/*`: reusable domain logic and shared types/helpers used by pages/scripts

Example:

- `scripts/build-git-timeline.ts` generates timeline artifacts
- `src/lib/git/timeline.ts` is the reusable timeline domain layer

## Search Architecture

- Shared search core (single source of truth):
  - `src/lib/search/search-core.js`
- TypeScript wrappers:
  - `src/lib/search/query-parser.ts`
  - `src/lib/search/query-eval.ts`
- Browser usage:
  - `public/js/filter.js`
  - `public/js/search-core.js` (synced by `scripts/sync-search-core.ts`)

## Markdown/Math Rendering

- Markdown + code highlighting:
  - `src/lib/content/render-markdown.ts`
- MathJax asset preparation:
  - `scripts/prepare-mathjax.ts`
- Offline MathJax runtime assets:
  - `public/mathjax/`

## PWA/Offline

- Service worker:
  - `public/service-worker.js`
- Client registration:
  - `public/js/pwa-register.js`
- Detailed behavior:
  - `docs/pwa.md`

## Current Gaps

- Index-list filtering is currently client-side only.
- Query parser has no explicit syntax-error UI feedback.
