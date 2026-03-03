# Deelan Roadmap 0.2.0

Target: ship a focused `0.2.0` quality and UX release on top of `0.1.x`.

## Release Goals

- Improve search ergonomics and validation feedback.
- Simplify and standardize CLI command behavior.
- Keep release scope tight and avoid broad UI/platform churn.

## Must-Have Scope (P1)

### 1) Query-based search UX hardening

Acceptance criteria:

- Add a trigger button next to the query field for query-mode execution.
- Bind `Enter` in query field to the same trigger action.
- Show red border while query pattern is invalid.
- Show `Invalid query` notification on `Enter` with invalid query (same interaction style as permalink copy feedback).

Impact:

- Clearer user feedback for advanced query mode.
- Fewer silent failures and less confusion around parser constraints.

### 2) CLI framework migration to Commander

Scope:

- Refactor top-level `deelan` command routing to use `commander`.
- Keep existing command contract stable (`init`, `validate`, `build`, `serve`, `tags`, `export`, `--help`, `--version`).
- Normalize global help/usage formatting and error messages.
- Reduce custom arg parsing where `commander` already provides equivalent behavior.

Acceptance criteria:

- No breaking changes to documented user-facing commands.
- Existing CLI tests pass; add migration-focused coverage for:
  - consistent help output structure
  - unknown-command behavior
  - global flags handling
- Packaged install smoke test still passes (`deelan init --help`, `deelan --version`).

## Should-Have Scope (P2, only if P1 completes early)

- Investigate command output verbosity policy (`npm_config_loglevel` vs current defaults).
- Heading copy-link controls in rendered content.

## Explicitly Out of Scope for 0.2.0

- Analytics phase 2 interactive expansion.
- UI phase 4 mobile/accessibility hardening.
- Enterprise auth integrations (OIDC/SAML/SSO).
- Broad visual redesign work.

## Validation Gate for 0.2.0

Before release candidate:

- `npm test`
- `npm run validate`
- `npm run build`
- `npm run docs:build`
- packaged CLI smoke check in separate test folder using local tarball (`npm run pack:local`).
