# Deelan

Data Engineering Electronic LAboratory Notebook.  
**Elevate your note-keeping experience.**

[![npm version](https://img.shields.io/npm/v/%40jhadida%2Fdeelan)](https://www.npmjs.com/package/@jhadida/deelan)
[![docs](https://img.shields.io/badge/docs-online-2ea44f)](https://jhadida.github.io/deelan)
[![gallery](https://img.shields.io/badge/gallery-screenshots-0ea5e9)](https://jhadida.github.io/deelan/main-gallery/)

<p align="center">
  <img src="logos/deelan-cartoon.png" alt="Deelan logo" width="280" />
</p>

Deelan is designed for people who want a durable, searchable, versioned knowledge base that stays close to plain text authoring and yet provides a useful, scaleable, and beautiful web-based view to navigate contents. 

You keep Markdown-formatted notes with rich authoring features in a simple git repo.  
Deelan creates a beautiful, scalable, private, and feature-rich navigation experience with just a handful of configuration files and CLI commands. 

## What Deelan Gives You

- Post + snippet content model with frontmatter validation. Templates provided for VSCode and Obsidian.
- Quickly find contents with an advanced search grammar, hierarchical tags, date ranges, and more.
- Rich rendered views out-of-the-box with code highlighting, Mathjax, git timelines, internal links, and more. 
- Static, local-first workflow (offline-friendly), with guidance and templates for secure private deployment.
- Export to self-contained HTML and PDF, share permalinks, explore and extend analytics.

> [!NOTE]
> Deelan is currently published as an early `0.x` experimental workflow.
> Expect iterative changes to CLI surface, generated outputs, and docs while the release hardening pass continues.

## Install

From npm (once published):

```bash
npm install -g @jhadida/deelan
deelan --help
```

Without global install:

```bash
npx @jhadida/deelan --help
```

Repository-local usage for contributors:

```bash
node ./bin/deelan.mjs --help
```

## Quickstart

```bash
deelan init my-notebook
cd my-notebook
deelan validate
deelan build
deelan serve
```

Open `http://localhost:4321`.

## Core Commands

```bash
deelan --help
deelan init --help
deelan validate --help
deelan build --help
deelan serve --help
deelan tags --help
deelan export --help
```

Optional PDF export dependencies:

```bash
npm install playwright
npx playwright install chromium
```

## Configuration Basics

Project settings live in `deelan.config.yml`.
Common options include default theme, timezone for rendered timestamps, and code highlighting themes.

See full reference in docs:
- `docs/user-configuration.md`


## Content ID Convention

IDs are filename-derived and type-prefixed:

- `content/posts/partitioning-primer.md` -> `post--partitioning-primer`
- `content/snippets/pandas-groupby.md` -> `snippet--pandas-groupby`

These IDs are used by search, related links, routes, and export commands.

## About this app 

Created by [Jonathan Hadida](https://github.com/jhadida) proudly with the help of GPT-5.3-Codex and minimal permissive dependencies (MIT/Apache-2.0 only for top-level dependencies).
