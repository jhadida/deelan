# Deelan Alpha Publish Checklist

Target: publish an initial `0.x` alpha to npm with a controlled and reproducible release process.

## Completed

- [x] Thin `deelan` CLI wrapper implemented.
- [x] `bin` mapping added in `package.json`.
- [x] CLI entrypoint uses cross-platform shebang (`#!/usr/bin/env node`).
- [x] Core command smoke coverage exists in tests (`deelan` command forwarding/init smoke).
- [x] Build/docs/storybook workflows are integrated and runnable locally.

## In Progress

- [ ] Confirm final publish surface for npm package contents (`.npmignore` review).
- [ ] Ensure CLI help and docs are fully drift-free before alpha cut.
- [ ] Confirm whether Playwright remains required dependency or is reclassified as optional strategy.

## Remaining (Before Publish)

### 1) Naming and ownership

- [ ] Decide final npm package name (`deelan` or scoped alternative).
- [ ] Confirm npm name availability.
- [ ] Reserve matching GitHub repository naming.
- [ ] Ensure stable maintainer ownership.

### 2) Package metadata

- [ ] Set `private: false`.
- [ ] Finalize metadata fields:
    - `name`, `version`, `description`, `license`
    - `repository`, `bugs`, `homepage`, `keywords`, `author`
- [ ] Confirm `engines.node` policy for published support.

### 3) Publish surface control

- [ ] Run `npm pack --dry-run` and verify tarball contents.
- [ ] Ensure generated/local folders are excluded:
    - `.site-deelan/`
    - `.site-docs/`
    - `.site-storybook/`
    - `.generated/`
    - local `exports/`
    - `.codex/`
    - `.blueprint/` (if intended non-runtime internal planning docs)

### 4) Documentation for npm consumers

- [ ] Final README alpha sections:
    - npm install
    - quickstart
    - commands (`build`, `serve`, `validate`, `tags`, `export`, `init`)
    - config basics (`deelan.config.yml`)
    - filename-derived ID conventions
- [ ] Add explicit alpha support/expectation notice.

### 5) Quality gates for release candidate

- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run storybook:build`
- [ ] `npm run docs:build` (if docs considered release gate)
- [ ] Export smoke tests:
    - HTML export
    - PDF export

### 6) Release execution

- [ ] Draft release notes (`alpha scope`, `known limitations`).
- [ ] Publish with dist-tag:
    - `npm publish --tag alpha`
- [ ] Create git tag:
    - `v0.1.0-alpha.0`
- [ ] Post-publish verification in clean temp install.

