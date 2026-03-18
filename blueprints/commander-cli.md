# Commander CLI Migration Plan

Target: Migrate `bin/deelan.mjs` from custom arg parsing to Commander framework.

## Task Sizing: Medium (4-6 hours)

## Current Architecture

| Component | Lines | Complexity |
|-----------|-------|------------|
| `bin/deelan.mjs` | ~320 | Main routing, custom arg parsing, tsx/astro spawning |
| `src/lib/args.ts` | ~148 | Custom flag parsing utilities |
| Command scripts | 4 files | Each has own `parseArgs()` + help handling |
| CLI tests | 6 files | Cover help, version, unknown commands |

### Key Observations

1. **Entry point is plain JS** (`deelan.mjs`) — runs without tsx, spawns child processes for TS scripts
2. **Two command types:**
   - Direct handlers: `build`, `serve` (spawn Astro CLI)
   - Script delegates: `init`, `tags`, `export`, `validate` (spawn tsx + script)
3. **Custom arg splitting** in `build` to separate Deelan flags from Astro passthrough flags
4. **Logging resolved early** before command dispatch

## Implementation Plan

### Phase 1: Commander wrapper in entry point
- Install `commander` (already in dependencies)
- Restructure `bin/deelan.mjs` to use `program.command()` for each subcommand
- Keep script spawning intact — commander handles routing, scripts handle execution
- Preserve global `--log-level` and `--log-file` as program-level options

### Phase 2: Standardize help/version
- Let commander generate consistent `--help` output
- Keep `deelan version` as explicit command (or migrate to `--version`)
- Update tests for new help format

### Phase 3: Build command special handling
- Commander can capture unknown options via `.allowUnknownOption()` + `.passThroughOptions()`
- Route Deelan-specific flags (`--include-subfolder`) through commander
- Pass remaining args to Astro

### Phase 4: Test coverage
- Verify existing tests pass (may need help output regex updates)
- Add coverage for: global flags inheritance, unknown-command behavior
- Packaged install smoke test

### Optional Phase 5: Migrate script arg parsing
- Could convert `init`, `tags`, `export`, `validate` to use commander internally
- Lower priority — current approach works, and scripts are already isolated

## Files to Modify

| File | Change |
|------|--------|
| `bin/deelan.mjs` | Major rewrite — commander program structure |
| `tests/deelan-cli.test.ts` | Update help output assertions |
| `src/lib/args.ts` | Keep as-is (used by scripts) |

## What Stays the Same

- All command scripts (`scripts/*.ts`)
- Command behavior and flags
- tsx spawning mechanism

## Acceptance Criteria

From roadmap-0.2.0.md:

- No breaking changes to documented user-facing commands
- Existing CLI tests pass; add migration-focused coverage for:
  - consistent help output structure
  - unknown-command behavior
  - global flags handling
- Packaged install smoke test still passes (`deelan init --help`, `deelan --version`)
