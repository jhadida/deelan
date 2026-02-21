# Initialization

`deelan init` scaffolds a new project directory.

## Command

```bash
deelan init [dir] [options]
```

## Default Output

- `content/` starter post + snippet
- `public/js/`
- `astro.config.mjs`, `tsconfig.json`, `deelan.config.yml`
- `.gitignore` (`.astro`, `.generated`, `.site-deelan`, `exports`)

By default, source templates are resolved from the installed package at build time.

## Options

- `--with-src` copy local `src/` templates for advanced customization
- `--no-vscode` skip `.vscode` helper files
- `--no-frontmatter` skip `.frontmatter` helper files
- `--no-git` skip git initialization
- `--no-lfs-attrs` skip default `.gitattributes` LFS patterns
- `--yes` / `--force` allow writing into non-empty target directory

## Git and LFS Defaults

When `--no-git` is not set and target is not already in a repo:

- git repository is initialized
- `.gitattributes` with default LFS mappings is created (unless `--no-lfs-attrs`)

