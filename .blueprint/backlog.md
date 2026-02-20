# Backlog

## Completed Since Draft

- `deelan init` flow materially productized:
    - scaffold command implemented
    - template/project initialization path documented
    - helper assets integrated (optional toggles)
- CLI surface significantly improved (`deelan` wrapper in place).
- Analytics phase 1 implemented (`/analytics` + build artifacts).
- Storybook integrated and refreshed.
- Synthetic content generation/cleanup workflow added.

## In Progress

### 1. Documentation IA redesign

- Split docs into clear tracks:
    - User Guide
    - CLI Reference
    - Developer Guide
- Keep advanced internals out of Getting Started.
- Add quick “I want to do X -> go to Y” navigation aid.

### 2. Quality hardening before alpha

- Expand regression coverage:
    - asset URL rewriting across routes
    - internal-link validation failures
    - timezone formatting behavior
- Add end-to-end export fixture (HTML + PDF command success path).
- Add shared logger:
    - `src/lib/logger.ts`
    - levels: `error`, `warn`, `info`, `debug`
    - verbosity control via CLI/env/config
    - optional log-file sink

## Remaining

### 3. Packaging/publish readiness

- Finalize publish surface (`.npmignore` sanity pass, package size budget).
- Ensure `deelan --help` and docs stay fully aligned.
- Prepare alpha release checklist and notes.

### 4. Optional UX polish (post-alpha candidate)

- Keyboard shortcuts in snippets explorer.
- Heading copy-link controls in rendered content.
- Admonitions styling polish/refinement across docs and blueprint-style planning pages.
