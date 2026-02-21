# Frontmatter

Deelan uses separate frontmatter schemas for posts and snippets.

## File Naming and Discovery

Default discovery scans only:

- `content/posts/*.md`
- `content/snippets/*.md`

Subfolders are ignored unless explicitly included via repeated:

- `--include-subfolder <name>`

Examples:

- `--include-subfolder synthetic`
- `--include-subfolder experiments/v2`

Discovered files must be:

- lowercase kebab-case filename
- single `.md` extension

Valid:

- `de-partitioning-primer.md`
- `sql-window-dedupe-snippet.md`

Invalid (excluded with warnings):

- `Foo-bar.md` (uppercase)
- `foo.bar.md` (multiple extensions)
- `foo_bar.md` (underscore)

## Identity Derivation

- `type` inferred from directory:
    - `content/posts/*` -> `post`
    - `content/snippets/*` -> `snippet`
- `id` generated from type + slug:
    - `post--<slug>`
    - `snippet--<slug>`

Examples:

- `content/posts/de-partitioning-primer.md` -> `post--de-partitioning-primer`
- `content/snippets/pandas-groupby-snippet.md` -> `snippet--pandas-groupby-snippet`

`type` is optional in frontmatter. If provided, it must match inferred type.
`id` should not be provided in frontmatter.

## Frontmatter Schemas

### Post

Required:

- `title`
- `tags`
- `version`

Optional:

- `type` (`post`)
- `description`
- `related_ids` (`post--...` / `snippet--...`)
- `created_at`
- `updated_at`
- `status` (`draft | published | archived`)

### Snippet

Required:

- `title`
- `tags`

Optional:

- `type` (`snippet`)
- `description`
- `related_ids`
- `created_at`
- `updated_at`

Snippets do not support `version` or `status`.
