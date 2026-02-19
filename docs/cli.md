# CLI

DEELAN provides a thin command wrapper called `deelan`.

In this repository you can use it via npm scripts, and when published with a `bin` entry it can be invoked directly.

## Quick Usage

```bash
deelan --help
deelan init my-notebook
deelan tags --help
deelan export --help
deelan validate
```

Repository-local equivalents:

```bash
npm run tags -- --help
npm run export -- --help
npm run validate
```

## Supported Wrapper Commands

- `deelan init [dir] [--no-vscode] [--no-frontmatter] [--yes]`
- `deelan build`
- `deelan serve [--port <n>]`
- `deelan tags ...`
- `deelan export ...`
- `deelan validate`

## `init` Defaults

`init` scaffolds a working project with:

- `content/` starter post + snippet
- `src/`, `public/js/`, `src/schemas/`
- `astro.config.mjs`, `tsconfig.json`, `deelan.config.yml`
- `.gitignore` (ignores `.astro`, `.generated`, `.site-deelan`, `exports`)

Optional helpers are included by default:

- `.vscode/`
- `.frontmatter/`

Disable helpers with:

- `--no-vscode`
- `--no-frontmatter`

Build-internal commands are still npm-scoped:

- `npm run build:prepare-mathjax`
- `npm run build:sync-search-core`
- `npm run build:indexes`
- `npm run build:timeline`

## Related Command References

- Tag command details: `docs/tag-cli.md`
- Export command details: `docs/export-spec.md`
- Build workflow details: `docs/developer.md`
