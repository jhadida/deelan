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
- Documentation IA redesign:
    - split docs into User/CLI/Developer tracks
    - streamlined getting started navigation and command flow
- Analytics interaction hardening:
    - tag table column sorting fixed
    - treemap and relation graph render path stabilized
- UI scaling and discoverability (partially completed):
    - bounded heights + internal scroll for `posts/` table view and analytics tag table
    - snippets explorer deep-link UX added (open in `/view` + permalink copy)
- Quality hardening before alpha:
    - expanded regression coverage for asset URL rewriting, internal-link validation failures, timezone behavior
    - end-to-end export fixtures added (HTML + PDF command path, PDF skip when Chromium unavailable)
    - shared logger implemented and wired into CLI entrypoints + prebuild scripts
- Corporate hosting and access control (P1 docs slice):
    - reverse-proxy protection documented (Caddy/Nginx)
    - TLS termination guidance documented
    - basic auth guidance documented
    - ready-to-edit proxy templates added under `templates/reverse-proxy/`
- Optional UX polish (partially completed):
    - keyboard shortcuts added in snippets explorer
    - admonitions styling refined (title banner, color coding, icons, optional collapsible syntax)

## In Progress

## Remaining

### 0. Brand and visual identity

- [P0] Create Deelan logo and visual identity kit:
    - logo exploration and final mark (SVG + icon variants)
    - color/accent guidance and typography pairing
    - usage notes for app, docs, Storybook, and exported artifacts

### 1. Packaging/publish readiness

- Finalize publish surface (`.npmignore` sanity pass, package size budget).
- Ensure `deelan --help` and docs stay fully aligned.
- Prepare alpha release checklist and notes.

### 4. Optional UX polish (post-alpha candidate)

- [P2] Heading copy-link controls in rendered content.

### 5. UI scaling and discoverability

- [P2] Improve post list scalability:
    - add "load more" incremental loading strategy for list view
    - evaluate optional infinite scroll only after keyboard/accessibility behavior is validated

### 6. Corporate hosting and access control

- [P2] Explore enterprise auth integration options (OIDC/SAML/SSO):
    - assess required runtime changes beyond static preview serving
    - define scope boundaries (viewer-only auth vs role-based permissions)
    - estimate complexity before committing to built-in account/privilege management
