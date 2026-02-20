# Developer Notes

## Build Pipeline

`npm run build` executes:

1. `build:prepare-mathjax`
2. `build:prepare-search`
3. `build:prepare-content-assets`
4. `validate`
5. `build-indexes`
6. `build-analytics`
7. `build-git-timeline`
8. `astro build`

### Command Intent

- `build:prepare-mathjax`:
    - Copies MathJax assets to `public/mathjax` for offline usage.
    - Used by `dev` and `build` preflight.
- `build:prepare-search`:
    - Syncs shared search core from `src/lib/search/search-core.js` to `public/js/search-core.js`.
    - Used by `dev` and `build` preflight to keep browser/runtime logic aligned.
- `build:prepare-content-assets`:
    - Copies content assets from `content/**/assets` into `public/content-assets/...`.
    - Ensures relative image/file paths resolve correctly from both `/view/*` and explorer routes.
- `build:analytics`:
    - Generates `.generated/analytics/tags.json` and `.generated/analytics/relations.json`.
    - Powers the `/analytics` route with static artifacts.
- `validate`:
    - Validates frontmatter, cross-references, and content constraints before indexing/build.
    - Scans only top-level markdown files under `content/posts/*.md` and `content/snippets/*.md`.
    - Subfolders are ignored for content discovery.
    - Optional inclusion for selected subfolders is supported via repeated `--include-subfolder <name>` or `DEELAN_INCLUDE_SUBFOLDERS=name1,name2`.
    - Safe to run independently while authoring content.
- `build:preflight`:
    - Internal orchestration command used by npm `prebuild`.
    - Runs asset prep + sync + content asset mirroring + validation + index/timeline generation.
    - Uses npm-only build-scoped commands (`build:indexes`, `build:timeline`) rather than end-user CLI wrapper commands.

## Test Workflow

- Run unit tests:
    - `npm test`
- Current test scope:
    - search query parsing (`&`, `|`, parentheses, structured filters)
    - search evaluation (text logic, hierarchical tags, date ranges)
- Test file:
    - `tests/search.test.ts`

## Load/Stress Testing with Synthetic Content

Synthetic content is ignored by default because discovery scans only top-level files.
Use `--include-subfolder synthetic` (or `DEELAN_INCLUDE_SUBFOLDERS=synthetic`) when you explicitly want it included.

Commands:

- Generate synthetic data:
    - `npm run synthetic:generate -- --posts 140 --snippets 220 --seed 20260222`
- Cleanup synthetic data:
    - `npm run synthetic:clean`
- Validate with synthetic data:
    - `npm run validate:with-synthetic`
    - Equivalent CLI form: `node ./bin/deelan.mjs validate --include-subfolder synthetic`
- Build with synthetic data:
    - `npm run build:with-synthetic`
    - Equivalent CLI form: `node ./bin/deelan.mjs build --include-subfolder synthetic`
- Run tests with synthetic mode enabled:
    - `npm run test:with-synthetic`

## Key Build Artifacts

- `.generated/search/posts-index.json`
- `.generated/search/snippets-index.json`
- `.generated/manifests/content-manifest.json`
- `.generated/analytics/tags.json`
- `.generated/analytics/relations.json`
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
    - `public/js/search-core.js` (synced by `scripts/prepare-search.ts` via `build:prepare-search`)

## Markdown/Math Rendering

- Markdown + code highlighting:
    - `src/lib/content/render-markdown.ts`
- MathJax asset preparation:
    - `scripts/prepare-mathjax.ts` (via `build:prepare-mathjax`)
- Offline MathJax runtime assets:
    - `public/mathjax/`
- Mirrored content assets:
    - `public/content-assets/...`

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
