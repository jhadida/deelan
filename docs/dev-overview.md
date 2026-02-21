# Developer Guide

For maintainers working on internals, build orchestration, docs tooling, and Storybook.

## Requirements

- Node.js 22+
- npm (with dev dependencies installed; do not use `--omit=dev`)
- Python 3 (for MkDocs tooling)
- Git + Git LFS
- Chromium browser binary for Playwright PDF export

Install project dependencies:

```bash
npm install
```

Install docs dependencies:

```bash
npm run docs:install
```

Install Chromium for PDF export:

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
