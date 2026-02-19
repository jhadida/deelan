# Editor Integration

## VSCode

Recommended extensions are listed in `.vscode/extensions.json`.

For frontmatter authoring, use the Front Matter extension for field-aware editing.

## Obsidian

Use DEELAN as a vault rooted at the repository directory.

Recommended plugins:

- Frontmatter Title
- Templates
- Metadata Menu (optional)

Use template files for consistent frontmatter:

- `content/posts/` template from `src/schemas/frontmatter-post.schema.json`
- `content/snippets/` template from `src/schemas/frontmatter-snippet.schema.json`

## Sublime / Vim / Emacs

Use YAML/Markdown language servers and snippets tied to the frontmatter schema fields.

Schemas:

- Post schema: `src/schemas/frontmatter-post.schema.json`
- Snippet schema: `src/schemas/frontmatter-snippet.schema.json`
- Combined schema: `src/schemas/frontmatter.schema.json`
