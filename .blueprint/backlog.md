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

### 0. Brand and visual identity

- [P0] Create DEELAN logo and visual identity kit:
    - logo exploration and final mark (SVG + icon variants)
    - color/accent guidance and typography pairing
    - usage notes for app, docs, Storybook, and exported artifacts

### 3. Packaging/publish readiness

- Finalize publish surface (`.npmignore` sanity pass, package size budget).
- Ensure `deelan --help` and docs stay fully aligned.
- Prepare alpha release checklist and notes.

### 4. Optional UX polish (post-alpha candidate)

- Keyboard shortcuts in snippets explorer.
- Heading copy-link controls in rendered content.
- Admonitions styling polish/refinement across docs and blueprint-style planning pages.

### 5. UI scaling and discoverability

- Add bounded table/list heights for high-volume datasets:
    - max-height + internal scroll for `posts/` table view
    - max-height + internal scroll for analytics tag table
- Improve post list scalability:
    - [P2] add "load more" incremental loading strategy for list view
    - evaluate optional infinite scroll only after keyboard/accessibility behavior is validated
- Snippets explorer deep-link UX:
    - add "open in /view" action (new tab) from right-pane snippet display
    - add quick permalink copy affordance (icon or clickable ID in subtitle)
- Analytics interaction hardening:
    - ensure tag table column sorting is functional
    - ensure treemap and relation graph render path is active and resilient

### 6. Corporate hosting and access control

- [P1] Document and support reverse-proxy protection pattern for local/private hosting:
    - run `deelan serve` behind Caddy/Nginx
    - enable TLS termination
    - enable basic auth for manager/collaborator access
    - provide deployment examples in docs
- [P2] Explore enterprise auth integration options (OIDC/SAML/SSO):
    - assess required runtime changes beyond static preview serving
    - define scope boundaries (viewer-only auth vs role-based permissions)
    - estimate complexity before committing to built-in account/privilege management
