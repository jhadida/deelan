# Content Schema

DEELAN supports two frontmatter schemas:

- Posts: `src/schemas/frontmatter-post.schema.json`
- Snippets: `src/schemas/frontmatter-snippet.schema.json`

Combined reference schema:

- `src/schemas/frontmatter.schema.json`

## File Naming Rules

Content files under `content/posts/` and `content/snippets/` must be:

- lowercase kebab-case filename
- single `.md` extension

Valid examples:

- `de-partitioning-primer.md`
- `sql-window-dedupe-snippet.md`

Invalid examples (excluded at build time with warnings):

- `Foo-bar.md` (uppercase)
- `foo.bar.md` (multiple extensions)
- `foo_bar.md` (underscore)

## Generated ID and Type

- `type` is inferred from directory:
  - `content/posts/*` -> `post`
  - `content/snippets/*` -> `snippet`
- `id` is generated at build time from type + filename stem:
  - `post--<slug>`
  - `snippet--<slug>`

Examples:

- `content/posts/de-partitioning-primer.md` -> `post--de-partitioning-primer`
- `content/snippets/pandas-groupby-snippet.md` -> `snippet--pandas-groupby-snippet`

`type` is optional in frontmatter. If provided, it must match the directory-inferred type.

`id` should not be provided in frontmatter.

## Post Frontmatter

Required:

- `title`
- `tags`
- `version`

Optional:

- `type` (`post`)
- `summary`
- `notes`
- `related_ids` (generated IDs like `snippet--...` / `post--...`)
- `created_at`
- `updated_at`
- `status` (`draft | published | archived`)

## Snippet Frontmatter

Required:

- `title`
- `tags`

Optional:

- `type` (`snippet`)
- `summary`
- `notes`
- `related_ids`
- `created_at`
- `updated_at`

Snippets do not support `version` or `status`.
