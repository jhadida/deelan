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
- Tailwind pilot decision:
    - pilot completed in branch `codex/tailwind-pilot`
    - decision: no full migration for now; keep current CSS architecture
- Brand and visual identity (phase 1):
    - usage notes for app, docs, Storybook, and exported artifacts (`logos/BRAND.md`, `docs/topic-branding.md`)
    - color/accent guidance and typography pairing documentation
    - docs/app/home branding integration (favicon, homepage hero, docs index branding pass)
    - publish-size optimization recorded:
      - canonical hires source kept in `logos/`
      - runtime hero switched to high-quality JPG in `public/images/`
      - measured `npm pack --dry-run` footprint improved from ~1.8 MB to ~551.2 kB in replacement simulation
- Release automation baseline completed:
    - `scripts/release.ts` added with semver/tag guardrails
    - safe-by-default dry-run mode; `--execute` required for side effects
    - `release:check` script added for reproducible quality gates
    - CI workflows added (`ci.yml`, `release.yml`)
- Release policy decided: keep CI in checks-only mode; local publish path remains source of truth
    - `npm run release -- <version> --execute` is canonical
    - no manual-approval gate for tag-driven publish (not needed for sole-maintainer workflow)
- Search bar UX: live red border on invalid query (via `aria-invalid` + CSS); trigger button + Enter key with "Invalid query." toast; placeholder updated to hint syntax
- Design system: `--color-error` token defined in `tokens.css` (dark-mode override in `themes/dark.css`); hardcoded value replaced in `global.css`
- Command output verbosity: resolved by existing logger infrastructure (`--log-level`, `DEELAN_LOG_LEVEL`, `logging.level` in config); no `npm_config_loglevel` bridge needed
- UI contrast and visual hierarchy review:
    - increased separation between `--bg`, `--surface`, `--surface-elevated` tokens for better layer distinction
    - stronger line colors for improved border visibility in both themes
    - topbar accent glow and active nav link highlighting added
    - search shell redesigned with rounded corners, lighter background, always-visible keyboard hints
- CLI framework migration to Commander (0.2.0):
    - top-level `deelan` routing migrated from custom if/else to Commander
    - `--version` flag added alongside backward-compatible `version` command
    - auto-generated help with examples, unknown command suggestions
    - 7 new CLI tests added (54 total)

## Remaining

### 1. UI refinement

- [P2] Revisit posts list view feature-flag decision:
    - currently gated by `enable_posts_list_view` (default: `false`)
    - decide whether to remove list view permanently after table scaling pass
    - if retained, add "load more" incremental loading strategy for list view
    - evaluate optional infinite scroll only after keyboard/accessibility behavior is validated
- [P2] UI blueprint phase 4.
- [P3] Final vector mark package (SVG icon + lockup variants).

### 2. UX refinement

- [P1] Harmonize subcommand arg parsing to use Commander:
    - migrate `init`, `tags`, `export`, `validate` scripts from custom `parseCliArgs()` to Commander
    - consistent help formatting across all commands
    - potentially retire `src/lib/args.ts` custom parsing utilities
    - see `blueprints/commander-cli.md` Phase 5 for details
- [P2] Heading copy-link controls in rendered content.

### 3. Feature enhancements

- [P2] Analytics blueprint phase 2.
- [P2] Explore enterprise auth integration options (OIDC/SAML/SSO):
    - assess required runtime changes beyond static preview serving
    - define scope boundaries (viewer-only auth vs role-based permissions)
    - estimate complexity before committing to built-in account/privilege management
