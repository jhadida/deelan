# CLI Reference

This section documents command-line workflows and command surfaces.

## Quick Usage

```bash
deelan --help
deelan init my-notebook
deelan validate
deelan build
deelan serve
deelan tags --help
deelan export --help
```

Repository-local equivalent if `deelan` is not on path:

```bash
node ./bin/deelan.mjs --help
```

Or if you pulled the whole package locally (e.g. developer usage):

```bash
npx deelan --help
```

## Command Decision Table

| You want to... | Command | Go to |
| --- | --- | --- |
| Initialize a project scaffold | `deelan init [dir]` | [Initialization](cli-init.md) |
| Validate content/frontmatter | `deelan validate` | - |
| Build static site output | `deelan build` | [Build Workflow](cli-build.md) |
| Serve built output locally | `deelan serve` | - |
| Manage tags | `deelan tags ...` | [Tag Management](cli-tags.md) |
| Export a post/snippet | `deelan export ...` | [HTML/PDF Export](cli-export.md) |

## Command Syntax

- `deelan init [dir] [options]`
- `deelan build [--include-subfolder <name>]...`
- `deelan serve [--port <n>]`
- `deelan validate [--include-subfolder <name>]...`
- `deelan tags <subcommand> [options]`
- `deelan export [options]`

## Include Subfolder Behavior

`build`, `validate`, `tags`, and `export` support repeated subfolder inclusion:

- `--include-subfolder <name>`

The provided value is interpreted under both entity roots:

- `content/posts/<name>/*.md`
- `content/snippets/<name>/*.md`

Examples:

- `deelan validate --include-subfolder synthetic`
- `deelan build --include-subfolder synthetic --include-subfolder experiments/v2`

## Notes

- `deelan` commands are the primary user-facing interface.
- Build-internal npm scripts remain available for maintainer workflows; see [Build Workflow](cli-build.md).
