# Is Deelan for me?

Deelan is a local-first publishing layer for Markdown notes.

If your current workflow is "Word files in folders", Deelan is the same core habit with a stronger structure:

- you still write content files
- you still organize files in folders
- but the content is plain text (`.md`) instead of binary document formats
- and Deelan turns those files into a searchable, linked, browsable site

!!! tip 

    If you are not familiar with Markdown or git, there are a lot of introduction texts and videos that can be found online.
    Ask your favorite AI agent for a brief intro and recommendations to learn more. 

## The Core Idea

You keep a normal git repository with:

- `content/posts/*.md` for long-form entries
- `content/snippets/*.md` for short reusable notes

Deelan reads this repository and generates:

- list/explorer pages
- rendered detail pages (`/view/<id>`)
- search indexes
- tag analytics
- exportable HTML/PDF outputs

## Why This Helps

Compared with ad-hoc document folders:

- content changes and history is traceable with git and can be sync'd between multiple devices
- links between notes stay explicit and validated
- metadata is structured (frontmatter)
- outputs are static (simple hosting, private sharing, offline-friendly)

## What Writing Looks Like

You write Markdown as usual. A small frontmatter header describes metadata such as:

- title
- tags
- description
- related item IDs

Deelan then handles rendering, navigation, linking, and filtering.

## Typical Workflow

1. Initialize a notebook project with `deelan init`.
2. Add/edit notes in `content/posts` and `content/snippets`.
3. Validate with `deelan validate`.
4. Build with `deelan build`.
5. Serve locally with `deelan serve`.
6. Export individual items with `deelan export`.

## What Deelan Is Not

Deelan is not a collaborative online editor by itself.

- It does not replace Google Docs or Word online co-editing.
- It does not manage user accounts/permissions internally.

Instead, it gives you a durable publishing and navigation layer on top of files you own.

## Where It Fits Best

Deelan works best when you want:

- private knowledge capture
- long-term maintainability
- clean version history
- static publishing with minimal infrastructure

For teams, the common model is:

- author in git
- validate/build in CI
- serve static output behind your preferred access controls
