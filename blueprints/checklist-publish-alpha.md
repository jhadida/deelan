# Deelan Alpha Publish Checklist

Target: publish an initial `0.x` alpha to npm with a controlled and reproducible release process.

## Completed

- [x] Thin `deelan` CLI wrapper implemented.
- [x] `bin` mapping added in `package.json`.
- [x] CLI entrypoint uses cross-platform shebang (`#!/usr/bin/env node`).
- [x] Core command smoke coverage exists in tests (`deelan` command forwarding/init smoke).
- [x] Build/docs/storybook workflows are integrated and runnable locally.

## In Progress

- [x] Confirm final publish surface for npm package contents (`.npmignore` review, `npm pack --dry-run`).
    - Current dry-run tarball: ~551.2 kB package size / ~746.0 kB unpacked.
- [x] Ensure CLI help and docs are fully drift-free before alpha cut.
- [x] Confirm whether Playwright remains required dependency or is reclassified as optional strategy.

## Remaining (Before Publish)

### 1) Naming and ownership

- [ ] Decide final npm package name (`deelan` or scoped alternative).
- [ ] Confirm npm name availability.
- [ ] Reserve matching GitHub repository naming.
- [ ] Ensure stable maintainer ownership.

### 2) Package metadata

- [x] Set `private: false`.
- [x] Finalize metadata fields:
    - `name`, `version`, `description`, `license`
    - `repository`, `bugs`, `homepage`, `keywords`, `author`
- [x] Confirm `engines.node` policy for published support.
    - Current policy: `>=22.0.0` (aligned with current test/build toolchain).

### 3) Publish surface control

- [ ] Run `npm pack --dry-run` and verify tarball contents.
- [ ] Ensure generated/local folders are excluded:
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
- [x] Add top-level `CODEX.md` contributor context for Codex-assisted development:
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
- [ ] Publish with dist-tag:
    - `npm publish --tag alpha`
- [ ] Create git tag:
    - `v0.1.0-alpha.0`
- [ ] Post-publish verification in clean temp install.
    - Blocked in current sandbox: no network access to npm registry (`ENOTFOUND registry.npmjs.org`).
