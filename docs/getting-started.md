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
- `npm run storybook:serve` - Storybook dev server
- `npm run storybook:build` - static Storybook build

Wrapper CLI (repository-local):

- `node ./bin/deelan.mjs --help`

## Editor Setup (Optional, Recommended)

For frontmatter authoring ergonomics:

1. VSCode: install recommended extensions from `.vscode/extensions.json`.
   All extension recommendations are optional.
2. VSCode: use snippets `deelan-post-fm` and `deelan-snippet-fm`.
3. Obsidian: enable Templates plugin.
4. Obsidian: set templates folder to `.frontmatter/templates`.

Detailed guidance: `docs/editor-integration.md`.

Before build/export, run:

```bash
npm run validate
```

## Content Authoring

Add markdown files under:

- `content/posts/`
- `content/snippets/`

Use frontmatter fields documented in `docs/content-schema.md`.

Detail pages are generated under `/view/<id>` where `<id>` is auto-derived from filename:

- `post--<slug>` for posts
- `snippet--<slug>` for snippets

## DEELAN Configuration

Project-level app settings are configured in `deelan.config.yml` (root).

See `docs/configuration.md` for all options, including `timezone` and code highlighting themes.

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

`astro.config.mjs` contains a `site` field.

- Local/offline usage: this can be left as the placeholder value.
- Published deployment: set this to the public base URL where your DEELAN site is hosted.

Example:

```js
site: 'https://your-user.github.io/deelan/'
```

Reference: [Astro `site` config](https://docs.astro.build/en/reference/configuration-reference/#site)
