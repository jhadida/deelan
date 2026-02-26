# Developer Guide

For maintainers working on internals, build orchestration, docs tooling, and Storybook.

## Requirements

- Node.js 22+
- npm (with dev dependencies installed; do not use `--omit=dev`)
- Python 3 (for MkDocs tooling)
- Git + Git LFS
- Optional: Playwright + Chromium for PDF export

Install project dependencies:

```bash
npm install
```

Install docs dependencies:

```bash
npm run docs:install
```

Install optional PDF export dependencies:

```bash
npm install playwright
npx playwright install chromium
```

Repository shortcut:

```bash
npm run optional:pdf
```

## Developer Quickstart

Run local development:

```bash
npm run dev
```

Run core checks:

```bash
npm test
npm run validate
npm run build
```

## Docs and Storybook Tooling

Storybook:

- `npm run storybook:serve`
- `npm run storybook:build`

MkDocs:

- `npm run docs:serve`
- `npm run docs:build`
- `npm run docs:deploy`

## Contributor Workflow

Typical contributor loop:

1. create a feature branch
2. run local checks before opening PR
3. open PR and iterate on review feedback
4. merge only after required checks pass

Useful commands:

- validate content: `npm run validate`
- run tests: `npm test`
- full quality gate: `npm run release:check`

If you deploy the Astro site publicly, set `site` in `astro.config.mjs` to your canonical URL.

## Release and GitHub Actions

Local release command (publish remains local/manual):

- dry run (default): `npm run release -- <version>`
- execute release: `npm run release -- <version> --execute`
- execute shortcut: `npm run release:execute -- <version>`

Release script behavior:

- validates semver ordering and tag constraints
- runs `validate`, `test`, `build`, and `pack:dry-run`
- calls `npm version` (commit + tag)
- publishes to npm and pushes git commit/tag only in `--execute` mode

GitHub Actions in this repository:

- `.github/workflows/ci.yml`
  - runs `release:check` on PRs and pushes to `main`
- `.github/workflows/release.yml`
  - runs checks-only on `v*` tags
  - verifies tag/version consistency
  - does not publish to npm
- `.github/workflows/docs.yml`
  - deploys MkDocs to `gh-pages` on doc-related changes to `main`
  - supports manual trigger via `workflow_dispatch`
