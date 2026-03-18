# Contributor Agent Context

This file is a quick orientation for contributors using AI coding agents on this repository.

## Repository Purpose

Deelan is a private-first Markdown notebook site builder with:
- typed content model (`post` and `snippet`)
- validation + build preflight generation
- Astro static site rendering
- CLI workflows for validation, tags, export, and project init

## Top-Level Layout

- `bin/`: thin user CLI entrypoint (`deelan`)
- `scripts/`: script-backed command implementations and prebuild steps
- `src/`: Astro site source, shared libraries, schemas, styles
- `content/`: authored markdown posts/snippets and local assets
- `public/`: runtime static assets copied into built site
- `docs/`: MkDocs documentation source
- `storybook/`: Storybook config for UI component development
- `templates/`: scaffold templates (project init, reverse proxy guidance)
- `tests/`: node test suite for CLI/lib/script behaviors
- `blueprints/`: planning notes and project backlog/checklists

## Core Commands

User-facing CLI:
- `deelan init`
- `deelan validate`
- `deelan build`
- `deelan serve`
- `deelan tags`
- `deelan export`

Repository npm wrappers:
- `npm run validate`
- `npm run build`
- `npm run serve`
- `npm run tags`
- `npm run export`

Prebuild pipeline (internal):
- `npm run build:prepare-mathjax`
- `npm run build:prepare-search`
- `npm run build:prepare-content-assets`
- `npm run build:indexes`
- `npm run build:analytics`
- `npm run build:timeline`

## Content Model Conventions

- Posts: `content/posts/*.md`
- Snippets: `content/snippets/*.md`
- Default discovery is top-level markdown files only.
- Subfolders are ignored unless explicitly included with `--include-subfolder`.

Generated IDs:
- `post--<slug>`
- `snippet--<slug>`

Slug/file rules:
- lowercase kebab-case
- single `.md` extension

## Generated Artifacts

- Build output: `.site-deelan/`
- Storybook output: `.site-storybook/`
- Docs output: `.site-docs/`
- Local generated workspace: `.generated/`

Keep generated output out of source edits unless task explicitly targets them.

## Quality Gates

Before merge:
- `npm test`
- `npm run validate`
- `npm run build`

When touching docs/UI workflows:
- `npm run docs:build`
- `npm run storybook:build`

When touching export:
- smoke HTML + PDF export paths

## Coding and Contribution Guardrails

- Prefer existing shared utilities under `src/lib/` over duplicating helpers in scripts.
- Keep script logging through shared logger patterns.
- Preserve top-level CLI contract (`deelan` commands) for user-facing changes.
- Favor small, explicit schema/content validation rules.
- Avoid introducing heavy dependencies unless there is clear UX/runtime value.
- Keep docs synchronized with CLI behavior.

## Packaging Notes

- Runtime assets required for built site must stay included in package.
- Playwright is optional and only required for PDF export.
- Always verify publish surface with:
  - `npm pack --dry-run --cache ./.generated/.npm-cache`
