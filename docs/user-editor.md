# Editor Integration

## VSCode

Recommended extensions are listed in `.vscode/extensions.json` (all optional).

### Frontmatter Authoring Support

- `.frontmatter/config.yml` defines Deelan post/snippet fields for the Front Matter extension.
- `.vscode/deelan-frontmatter.code-snippets` provides raw Markdown snippets:
    - `deelan-post-fm`
    - `deelan-snippet-fm`
- `.vscode/settings.json` enables snippet suggestions in Markdown contexts.

Use snippets when editing Markdown files directly.
If suggestions still do not appear, use `Insert Snippet` from the command palette.

Use the Front Matter extension dashboard/forms when you prefer structured field editing.
Folder-scoped snippet activation (for `content/**` only) is not supported natively by VSCode workspace snippets.

### Validation

Live schema validation inside Markdown frontmatter is limited in VSCode.
Authoring help is provided via Front Matter forms + snippets, and canonical validation is:

```bash
deelan validate
```

## Obsidian

Use Obsidian to edit contents by creating a vault at the root of any new project folder.

### Recommended Setup

- Enable core `Templates` plugin.
- Optional community plugin: `Metadata Menu` for form-like metadata editing.

Template files are provided in:

- `.frontmatter/templates/post.md`
- `.frontmatter/templates/snippet.md`

Point Obsidian Templates folder to `.frontmatter/templates` (or copy these files into your preferred templates folder).

## Sublime / Vim / Emacs

Use YAML/Markdown language servers and snippets tied to the frontmatter schema fields.

Schemas:

- Post schema: `src/schemas/frontmatter-post.schema.json`
- Snippet schema: `src/schemas/frontmatter-snippet.schema.json`
- Combined schema: `src/schemas/frontmatter.schema.json`
