# Deelan Alpha Publish Checklist

Target: publish an initial `0.x` alpha to npm with a controlled and reproducible release process.

## Completed

- [x] Thin `deelan` CLI wrapper implemented.
- [x] `bin` mapping added in `package.json`.
- [x] CLI entrypoint uses cross-platform shebang (`#!/usr/bin/env node`).
- [x] Core command smoke coverage exists in tests (`deelan` command forwarding/init smoke).
- [x] Build/docs/storybook workflows are integrated and runnable locally.

## In Progress

- [ ] Keep CI as checks-only for now.
    - `release:check` + `ci.yml` are active.
    - package publish remains local via `npm run release -- <version> --execute`.
    - revisit tag-driven auto-publish only after manual approval gate strategy is finalized.

## Remaining (Before Publish)

### 1) Naming and ownership

- [x] Decide final npm package name (`deelan` or scoped alternative).
    - Selected: `@jhadida/deelan`.
- [x] Confirm npm name availability.
- [x] Reserve matching GitHub repository naming.
- [x] Ensure stable maintainer ownership.

### 2) Package metadata

- [x] Set `private: false`.
- [x] Finalize metadata fields:
    - `name`, `version`, `description`, `license`
    - `repository`, `bugs`, `homepage`, `keywords`, `author`
- [x] Confirm `engines.node` policy for published support.
    - Current policy: `>=22.0.0` (aligned with current test/build toolchain).

### 3) Publish surface control

- [x] Run `npm pack --dry-run` and verify tarball contents.
- [x] Ensure generated/local folders are excluded:
    - `.site-deelan/`
    - `.site-docs/`
    - `.site-storybook/`
    - `.generated/`
    - local `exports/`
    - `.codex/`
    - `blueprints/` (if intended non-runtime internal planning docs)

### 4) Documentation for npm consumers

- [x] Final README alpha sections:
    - npm install
    - quickstart
    - commands (`build`, `serve`, `validate`, `tags`, `export`, `init`)
    - config basics (`deelan.config.yml`)
    - filename-derived ID conventions
- [x] Add explicit alpha support/expectation notice.
- [x] Add top-level `AGENTS.md` contributor context for AI-assisted development:
    - repository map and folder intent
    - command/script conventions and quality gates
    - content/model conventions and generated artifacts
    - style/contribution guardrails

### 5) Quality gates for release candidate

- [x] `npm test`
- [x] `npm run build`
- [x] `npm run storybook:build`
- [x] `npm run docs:build` (if docs considered release gate)
- [x] Export smoke tests:
    - HTML export
    - PDF export

### 6) Release execution

- [x] Draft release notes (`alpha scope`, `known limitations`).
    - Draft file: `RELEASE_NOTES-alpha.md`.
- [x] Publish with dist-tag:
    - `npm publish --tag alpha --access public` (initial alpha publish completed)
- [x] Create git tag:
    - stable tag flow now in use (`v0.1.1` published)
- [ ] Post-publish verification in clean temp install.
    - still recommended outside restricted sandbox environment.
