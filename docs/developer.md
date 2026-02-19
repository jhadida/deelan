# Developer Notes

## Build Pipeline

`npm run build` executes:

1. `build:prepare-mathjax`
2. `build:sync-search-core`
3. `validate`
4. `build-indexes`
5. `build-git-timeline`
6. `astro build`

### Command Intent

- `build:prepare-mathjax`:
  - Copies MathJax assets to `public/mathjax` for offline usage.
  - Used by `dev` and `build` preflight.
- `build:sync-search-core`:
  - Syncs shared search core from `src/lib/search/search-core.js` to `public/js/search-core.js`.
  - Used by `dev` and `build` preflight to keep browser/runtime logic aligned.
- `validate`:
  - Validates frontmatter, cross-references, and content constraints before indexing/build.
  - Safe to run independently while authoring content.
- `build:preflight`:
  - Internal orchestration command used by npm `prebuild`.
  - Runs asset prep + sync + validation + index/timeline generation.
  - Uses npm-only build-scoped commands (`build:indexes`, `build:timeline`) rather than end-user CLI wrapper commands.

## Test Workflow

- Run unit tests:
  - `npm test`
- Current test scope:
  - search query parsing (`&`, `|`, parentheses, structured filters)
  - search evaluation (text logic, hierarchical tags, date ranges)
- Test file:
  - `tests/search.test.ts`

## Key Build Artifacts

- `.generated/search/posts-index.json`
- `.generated/search/snippets-index.json`
- `.generated/manifests/content-manifest.json`
- `.generated/timeline/versions.json`

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
  - `public/js/search-core.js` (synced by `scripts/sync-search-core.ts` via `build:sync-search-core`)

## Markdown/Math Rendering

- Markdown + code highlighting:
  - `src/lib/content/render-markdown.ts`
- MathJax asset preparation:
  - `scripts/prepare-mathjax.ts` (via `build:prepare-mathjax`)
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
