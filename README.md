# Deelan

Data Engineering Electronic LAboratory Notebook.  
**Elevate your note-keeping experience.**

<p align="center">
  <img src="logos/deelan-cartoon.png" alt="Deelan logo" width="280" />
</p>

You keep writing Markdown notes in a git repo.  
Deelan gives you a gorgeous, scalable, private, and feature-rich navigation experience with just a handful of configuration files and CLI commands.

## What Deelan Gives You

- Post + snippet content model with strong frontmatter validation. Templates and snippets provided for VSCode and Obsidian.
- Fast filtering based on advanced search grammar and hierarchical tag model. So you can quickly find what you are looking for.
- Rich rendered views with code highlighting, Mathjax, git timelines, internal links, and more. Out-of-the-box is all you need.
- Static, local-first workflow (offline-friendly), with guidance and template configs for secure private deployment.
- Export to self-contained HTML and PDF, share permalinks, explore and extend analytics.

## Quick Start (This Repository)

```bash
npm install
npm run build
npm run preview
```

Open `http://localhost:4321`.

## Core CLI Commands

```bash
npx deelan --help
npx deelan init --help
npx deelan build --help
npx deelan validate --help
npx deelan tags --help
npx deelan export --help
```

Equivalent npm wrappers are available (`npm run validate`, `npm run tags`, `npm run export`, etc.).

For contributors working directly in this repository, local bin execution also works:

```bash
node ./bin/deelan.mjs --help
```

## Documentation

- Online docs: [jhadida.github.io/deelan](https://jhadida.github.io/deelan)
- Local docs source:
  - User guide: `docs/user-overview.md`
  - CLI reference: `docs/cli-overview.md`
  - Developer guide: `docs/dev-overview.md`

Docs tooling:

```bash
npm run docs:install
npm run docs:serve
npm run docs:build
```

## For Contributors

- Run tests: `npm test`
- Run Storybook: `npm run storybook:serve`
- Build Storybook: `npm run storybook:build`

If you deploy the Astro site publicly, set `site` in `astro.config.mjs` to your canonical URL.

## About this app 

Created by [Jonathan Hadida](https://github.com/jhadida) proudly with the help of OpenAI Codex (GPT-5.3-Codex) and minimal permissive dependencies (MIT/Apache-2.0 only for top-level dependencies). Released under MIT license.
