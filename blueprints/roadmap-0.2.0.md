# Deelan Roadmap 0.2.0

Target: ship a focused `0.2.0` quality and UX release on top of `0.1.x`.

## Status: Released

## Release Goals

- Improve search ergonomics and validation feedback.
- Simplify and standardize CLI command behavior.
- Improve UI contrast and visual hierarchy.

## Completed Scope

### 1) Query-based search UX hardening (P1) ✓

- Trigger button next to the query field for query-mode execution.
- `Enter` in query field bound to the same trigger action.
- Red border while query pattern is invalid.
- `Invalid query` toast notification on `Enter` with invalid query.

### 2) CLI framework migration to Commander (P1) ✓

- Top-level `deelan` command routing migrated to `commander`.
- Existing command contract stable (`init`, `validate`, `build`, `serve`, `tags`, `export`, `--help`, `--version`).
- Auto-generated help with examples, unknown command suggestions.
- `--version` flag added alongside backward-compatible `version` command.
- Migration-focused test coverage added (54 total tests).

### 3) UI contrast and visual hierarchy (bonus) ✓

- Increased separation between background, surface, and elevated surface tokens.
- Stronger line colors for improved border visibility in both themes.
- Topbar accent glow and active nav link highlighting.
- Search shell redesigned with rounded corners, lighter background, always-visible keyboard hints.

### 4) Previously completed P2 items ✓

- Command output verbosity: resolved by existing logger infrastructure.
- Design system: `--color-error` token added.

## Deferred to 0.2.1

- Harmonize subcommand arg parsing to use Commander (init, tags, export, validate).
- Heading copy-link controls in rendered content.
