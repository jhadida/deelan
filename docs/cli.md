# CLI

DEELAN provides a thin command wrapper called `deelan`.

In this repository you can use it via npm scripts, and when published with a `bin` entry it can be invoked directly.

## Quick Usage

```bash
deelan --help
deelan init --help
deelan init my-notebook
deelan init my-notebook --with-src
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

- `deelan init [dir] [--with-src] [--no-vscode] [--no-frontmatter] [--no-git] [--no-lfs-attrs] [--yes]`
- `deelan build`
- `deelan serve [--port <n>]`
- `deelan tags ...`
- `deelan export ...`
- `deelan validate`

## `init` Defaults

`init` scaffolds a minimal working project with:

- `content/` starter post + snippet
- `public/js/`
- `astro.config.mjs`, `tsconfig.json`, `deelan.config.yml`
- `.gitignore` (ignores `.astro`, `.generated`, `.site-deelan`, `exports`)

By default, site templates are used from the installed package at build time.
For advanced customization, copy local source templates with:

- `--with-src`

Optional helpers are included by default:

- `.vscode/`
- `.frontmatter/`
- git repository initialization (when target is not already in a git repo)
- `.gitattributes` with default LFS rules (when git repo is initialized)

Disable helpers with:

- `--no-vscode`
- `--no-frontmatter`
- `--no-git`
- `--no-lfs-attrs`

Build-internal commands are still npm-scoped:

- `npm run build:prepare-mathjax`
- `npm run build:sync-search-core`
- `npm run build:sync-content-assets`
- `npm run build:indexes`
- `npm run build:timeline`

Optional feature installers:

- `npm run optional:pdf`
- `npm run optional:install`

## Related Command References

- Tag command details: `docs/tag-cli.md`
- Export command details: `docs/export-spec.md`
- Build workflow details: `docs/developer.md`
