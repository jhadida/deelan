# DEELAN Blueprint

Data Engineering Electronic LAboratory Notebook (DEELAN)

## 0) Decision Snapshot

- Runtime: Node LTS (Phase 1)
- Package manager: `npm` (Phase 1)
- Bundler: none explicitly; Astro uses Vite internally
- Framework: Astro (static-first)
- Content source: Markdown + YAML frontmatter
- Math rendering: MathJax (self-hosted for offline)
- Code highlighting: Shiki (build-time)
- Search: dual index (posts vs snippets), custom query parser (`&`, `|`, `(`, `)`) + structured filters
- Offline: PWA service worker + cache versioning
- Version history: build-time Git timeline artifact per content item
- Export: standalone HTML + sidecar assets folder, PDF via headless Chromium

## 1) Why `npm` (and no webpack)

Use `npm` for lowest friction and easiest onboarding. Astro already includes a modern build pipeline through Vite, so adding webpack would add maintenance cost with little value.

Future option: Bun support can be evaluated once core functionality is stable.

## 2) Repository Layout

```text
deelan/
  package.json
  astro.config.mjs
  tsconfig.json
  .nvmrc
  .gitignore

  content/
    posts/
      2026-01-15-my-post.md
    snippets/
      pandas-groupby-cheatsheet.md

  src/
    pages/
      index.astro
      posts/
        index.astro
        [id].astro
      snippets/
        index.astro
        [id].astro
    components/
      layout/
      post/
      snippet/
      search/
      filters/
      common/
    styles/
      tokens.css
      themes/
        light.css
        dark.css
      global.css
    lib/
      content/
        schema.ts
        normalize.ts
        relations.ts
      search/
        index-posts.ts
        index-snippets.ts
        query-parser.ts
        query-eval.ts
      git/
        timeline.ts
      export/
        html.ts
        pdf.ts
      tags/
        hierarchy.ts
        validate.ts

  scripts/
    build-indexes.ts
    build-git-timeline.ts
    validate-content.ts
    export-item.ts

  generated/
    search/
      posts-index.json
      snippets-index.json
    timeline/
      versions.json
    manifests/
      content-manifest.json

  public/
    mathjax/
    icons/

  docs/
    content-schema.md
    search-grammar.md
    export-spec.md
```

## 3) Content Schema (Phase 1)

Single schema for both posts/snippets with `type` discriminator.

Required frontmatter:

- `id`: stable unique string (slug-like, manual)
- `type`: `post | snippet`
- `title`: string
- `tags`: string[] (hierarchical, canonical dot notation)
- `version`: string (e.g., `1.0.0` or `2026.01`)

Optional frontmatter:

- `summary`: string
- `notes`: string
- `related_ids`: string[]
- `created_at`: ISO datetime override
- `updated_at`: ISO datetime override
- `status`: `draft | published | archived` (default: `published`)

Derived at build time:

- `created_at_git`: first commit timestamp for file
- `updated_at_git`: latest commit timestamp for file
- `effective_created_at`: override or git-derived
- `effective_updated_at`: override or git-derived
- `tag_ancestors`: for each tag, all ancestor prefixes

Rule: no separate `categories` field in Phase 1; hierarchy lives in `tags`.

## 4) Tag Hierarchy Spec

Canonical format:

- lowercase only
- separator: `.` only
- regex: `^[a-z0-9]+(\.[a-z0-9]+)*$`

Examples:

- valid: `data.etl.airflow`
- valid: `python.pandas.groupby`
- invalid: `Data.ETL`, `data/etl`, `data..etl`

Filtering behavior:

- Exact: `data.etl.airflow`
- Prefix wildcard UX: `data.etl.*`
- Internal evaluation: exact match OR prefix with trailing dot

## 5) Search and Filtering

Two independent indexes:

- Posts index: optimized for richer metadata filters; can be larger and lazily loaded.
- Snippets index: compact and eagerly loaded for instant filtering.

### Query grammar (Phase 1)

Text expression grammar:

- operators: `&` (AND), `|` (OR)
- grouping: parentheses
- tokens: quoted phrases or bare terms

Example:

```text
("slowly changing dimension" | scd) & (spark | dbt)
```

Structured filters handled outside expression parser:

- `tag:data.etl.*`
- `from:2025-01-01`
- `to:2026-12-31`
- UI date pickers map to same filter model

Evaluation model:

- parse expression -> AST
- evaluate AST against pretokenized document fields
- apply structured filters (date, tags, type)

## 6) UI Blueprint

### Posts

- Route: `/posts`
- View toggle: list / table
- Controls: full-text query, tag/prefix filter, date range, sort
- Item route: `/posts/[id]`
- Reader: title, metadata, content, related posts/snippets

### Snippets

- Route: `/snippets`
- Left sidebar: search box + tag filters + snippet list
- Main pane: snippet content with code highlighting
- Right metadata pane: dates, tags, notes, related snippets
- Item route: `/snippets/[id]` (shareable deep-link)

## 7) Offline (PWA)

Service worker responsibilities:

- Precache app shell assets
- Precache snippet index + core metadata
- Cache-first for static assets
- Stale-while-revalidate for non-critical generated JSON
- Versioned cache keys tied to build hash

Outcome:

- usable offline after first successful load
- instant snippet filtering while offline

## 8) Git Version Timeline

Build script (`scripts/build-git-timeline.ts`) processes each content file:

- first commit -> creation signal
- latest commit -> last update signal
- commit list -> timeline entries

Generated artifact (`generated/timeline/versions.json`):

```json
{
  "items": {
    "my-stable-id": {
      "path": "content/posts/2026-01-15-my-post.md",
      "created_at_git": "2026-01-15T10:11:12Z",
      "updated_at_git": "2026-02-01T13:20:00Z",
      "timeline": [
        {
          "commit": "abc1234",
          "date": "2026-02-01T13:20:00Z",
          "author": "Name",
          "message": "Refine section on partition pruning"
        }
      ]
    }
  }
}
```

UI shows concise timeline with expandable commit details.

## 9) Export Spec

CLI entry: `scripts/export-item.ts`

Commands:

- `npm run export -- --id my-stable-id --format html --out ./exports`
- `npm run export -- --id my-stable-id --format pdf --out ./exports`

HTML export (default):

- outputs `my-stable-id.html`
- outputs `my-stable-id.assets/` for images/CSS/JS/fonts
- does not inline heavy binary assets

PDF export:

- render exported HTML in headless Chromium
- print CSS for reader-friendly pagination

Future flag:

- `--inline-assets` (single-file HTML)

## 10) Commands (Phase 1)

In `package.json`:

- `dev`: run Astro dev server
- `build`: validate content + build indexes + build timeline + Astro build
- `preview`: serve built output locally
- `validate`: schema, tags, ID uniqueness, relation checks
- `export`: export one item to HTML/PDF

Suggested scripts:

```json
{
  "scripts": {
    "dev": "astro dev",
    "validate": "tsx scripts/validate-content.ts",
    "prebuild": "npm run validate && tsx scripts/build-indexes.ts && tsx scripts/build-git-timeline.ts",
    "build": "astro build",
    "preview": "astro preview",
    "export": "tsx scripts/export-item.ts"
  }
}
```

## 11) Milestone Plan

### Phase 1 (MVP)

1. Scaffold Astro project, base pages, shared layout.
2. Implement schema validation + hierarchical tag normalization.
3. Implement posts/snippets rendering with Shiki + MathJax.
4. Build dual search indexes and query parser (`&`, `|`, parentheses).
5. Build posts filters (date, tag) and snippets instant filter UI.
6. Add service worker offline strategy.
7. Add Git timeline build artifact + item timeline UI.
8. Add HTML/PDF export CLI.
9. Add smoke tests for parser/filter/export/validation.

### Phase 2 (Enhancements)

1. Tag management CLI: list/tree/stats/fuzzy duplicates.
2. Safe rename/merge (including subtree rename `a.b.* -> x.y.*`) with dry-run.
3. Advanced theming via token config and custom theme packs.
4. Component explorer (Storybook) for rendering primitives.
5. Search ranking tuning and saved filters.

## 12) Risks and Guardrails

- ID drift risk: prevent by requiring stable `id` and uniqueness checks.
- Tag taxonomy entropy: prevent via strict canonical regex + CLI tooling.
- Git history edge cases (rebases/imported files): support explicit timestamp overrides.
- Offline staleness: use cache versioning and manifest hash invalidation.

## 13) Immediate Next Implementation Steps

1. Initialize Astro + TypeScript repo with Node LTS and npm.
2. Create schema/validation and sample content for one post + one snippet.
3. Implement minimal posts/snippets routes and rendering.
4. Wire index generation + basic filter UI.
5. Add timeline artifact generation and display.
6. Add export CLI.

