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
