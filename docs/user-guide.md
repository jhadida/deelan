# Getting Started

This guide is for new users and intentionally focuses on `deelan` commands only.

## Prerequisites

- Node.js 22+
- Git
- Git LFS (strongly recommended for non-text assets)

## Create a Project

```bash
deelan init my-notebook
cd my-notebook
```

If `deelan` is not on your path in this repository, see the [CLI Overview](cli-overview.md) for repository-local invocation details.

## Build and Serve

```bash
deelan validate
deelan build
deelan serve
```

Open [http://localhost:4321](http://localhost:4321).

## Core Commands

- `deelan validate` - validate frontmatter and cross-references.
- `deelan build` - run preflight generation + static build.
- `deelan serve` - serve the built site.
- `deelan tags --help` - inspect and manage tags.
- `deelan export --help` - export an item as HTML or PDF.

## Content Types

DEELAN has two content types with distinct intent:

- `post`
    - Longer-form content.
    - Includes lifecycle metadata such as `version` and `status`.
    - Shows a timeline/history section in the rendered detail view.
- `snippet`
    - Short, focused reference notes or code fragments.
    - Intentionally lighter metadata surface (no `version`/`status` fields).
    - Optimized for fast browsing and in-page preview in snippets explorer.

In both cases, IDs are generated from filenames and type:

- `post--<slug>`
- `snippet--<slug>`

## Content Discovery Rules

By default, DEELAN discovers only top-level markdown files:

- `content/posts/*.md`
- `content/snippets/*.md`

Subfolders are ignored unless explicitly included.

To include subfolders, repeat:

- `--include-subfolder <name>`

Examples:

- `deelan validate --include-subfolder synthetic`
- `deelan build --include-subfolder synthetic --include-subfolder experiments/v2`

## Content Authoring

Create content under:

- `content/posts/`
- `content/snippets/`

Then refer to:

- [Authoring](user-authoring.md)
- [Frontmatter](user-frontmatter.md)
- [Configuration](user-configuration.md)
- [Editor Integration](user-editor.md)

## Git + LFS

`deelan init` initializes a git repository by default when target is not already in one.
It also writes default `.gitattributes` LFS patterns unless `--no-lfs-attrs` is used.
