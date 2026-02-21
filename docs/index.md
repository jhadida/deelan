# DEELAN Documentation

## What is DEELAN?

DEELAN (Data Engineering Electronic LAboratory Notebook) is a static-first knowledge management tool for technical individuals and teams. It is designed for people who want a durable, searchable, versioned knowledge base that stays close to plain text authoring and yet provides a useful, scaleable, and beautiful web-based view to navigate contents.

At a practical level, DEELAN helps you:

- Write and maintain technical notes in markdown.
- Separate long-form writeups (`post`) from quick references (`snippet`).
- Search content with both simple filters and advanced query expressions.
- Keep traceable history through git timeline integration.
- Export selected content to self-contained HTML or PDF.
- Run fully offline with local assets and static-site behavior.

The project intentionally favors transparent files and reproducible build steps over opaque app-state storage.  That makes it suitable for individuals, small teams, and internal engineering groups that want control over content, portability across environments, and predictable long-term maintenance.

If you are new to DEELAN, start with the User Guide.  
If you are integrating or automating workflows, use the CLI Reference.  
If you are extending internals or build behavior, use the Developer Guide.

## Choose a Track

- New users and authors:
    - Start in [User Guide](user-overview.md)
- CLI usage and command flags:
    - Go to [CLI Reference](cli-overview.md)
- Build pipeline, internals, and maintenance:
    - Go to [Developer Guide](dev-overview.md)

## Quick Decision Table

| I want to... | Go to |
| --- | --- |
| Install and run DEELAN quickly | [Getting Started](user-guide.md) |
| Write posts/snippets with the right syntax | [Authoring](user-authoring.md) |
| Understand frontmatter fields and ID rules | [Frontmatter](user-frontmatter.md) |
| Configure timezone/themes/links | [Configuration](user-configuration.md) |
| Use the main `deelan` command | [CLI Overview](cli-overview.md) |
| Manage tags from CLI | [Tag Management](cli-tags.md) |
| Export to HTML/PDF | [Export Contents](cli-export.md) |
| Understand search query syntax | [Search Grammar](topic-search.md) |
| Work on build internals | [Developer Notes](dev-notes.md) |
