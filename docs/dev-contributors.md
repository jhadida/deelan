# Contributors

This page centralizes contributor workflow, release usage, and CI/CD behavior.

## Contributor Workflow

Typical loop:

1. Create a feature branch.
2. Run local checks before opening a PR.
3. Open PR and iterate on review feedback.
4. Merge only after required checks pass.

Useful commands:

- Validate content: `npm run validate`
- Run tests: `npm test`
- Full quality gate: `npm run release:check`

If you deploy the Astro site publicly, set `site` in `astro.config.mjs` to your canonical URL.

## Local Release Workflow

Publishing remains local/manual.

- Dry run (default): `npm run release -- <version>`
- Execute release: `npm run release -- <version> --execute`
- Execute shortcut: `npm run release:execute -- <version>`

Release behavior:

- Validates semver/tag constraints and ordering.
- Verifies npm auth readiness (`npm whoami`) when publish is enabled.
- Checks whether `package@version` already exists on npm.
- Runs `validate`, `test`, `build`, and `pack:dry-run`.
- Uses `npm version` (commit + tag) when appropriate.
- Publishes to npm and pushes git commit/tag only in execute mode.
- Auto-cleans stale local unpushed tags from interrupted releases and continues.

## GitHub Actions

### CI checks

- Workflow: `.github/workflows/ci.yml`
- Triggers: pull requests + pushes to `main`
- Action: runs `npm run release:check`

### Tag checks

- Workflow: `.github/workflows/release.yml`
- Triggers: pushes to `v*` tags
- Action: verifies tag/version consistency + runs `release:check`
- No npm publish in CI.

### Docs deployment

- Workflow: `.github/workflows/docs.yml`
- Triggers:
  - push to `main` when docs-related paths change
  - manual run (`workflow_dispatch`)
- Action: build + deploy MkDocs to `gh-pages`

## Branch Protection (Recommended)

For `main`:

- Require PR before merge.
- Require at least one approval.
- Require required status checks to pass (include `release-check`).
- Require branches to be up to date before merge.
- Require conversation resolution before merge.
