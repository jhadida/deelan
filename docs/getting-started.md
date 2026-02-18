# Getting Started

## Prerequisites

- Node.js 22+
- npm
- Python 3 (for docs tooling)

## Quick Start

```bash
npm install
npm run build
npm run preview
```

Open [http://localhost:4321](http://localhost:4321).

## Development Workflow

```bash
npm run dev
```

In a second terminal:

```bash
npm test
npm run validate
```

## Core Commands

- `npm run dev` - dev server
- `npm run build` - full static build (includes validation/index/timeline)
- `npm run preview` - preview built site
- `npm test` - unit tests
- `npm run validate` - content/frontmatter validation
- `npm run tags -- <command>` - tag management (`list`, `tree`, `duplicates`, `rename`, `merge`)

## Content Authoring

Add markdown files under:

- `content/posts/`
- `content/snippets/`

Use frontmatter fields documented in `docs/content-schema.md`.

## Documentation Site (MkDocs Material)

Install docs dependencies:

```bash
npm run docs:install
```

Serve docs locally:

```bash
npm run docs:serve
```

Build docs (output in `.site-docs/`):

```bash
npm run docs:build
```

Deploy docs to `gh-pages` branch:

```bash
npm run docs:deploy
```

The built docs output is excluded from git.

## Astro `site` Configuration

`astro.config.mjs` contains a `site` field. This should be set to the public base URL where your DEELAN site is hosted.

Example:

```js
site: 'https://your-user.github.io/deelan/'
```

Reference: [Astro `site` config](https://docs.astro.build/en/reference/configuration-reference/#site)
