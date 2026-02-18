# DEELAN Blueprint (Core)

Data Engineering Electronic LAboratory Notebook (DEELAN)

## 0) Decision Snapshot

- Runtime: Node LTS
- Package manager: npm
- Framework: Astro (static-first)
- Content source: Markdown + YAML frontmatter
- Math rendering: MathJax (self-hosted for offline)
- Code highlighting: Shiki (build-time)
- Search: dual index (posts vs snippets), boolean query parser + structured filters
- Offline: PWA service worker + cache versioning
- Version history: build-time Git timeline artifact per content item
- Export: folder-based HTML export + PDF via headless Chromium

## 1) Repository Layout

```text
deelan/
  package.json
  astro.config.mjs
  tsconfig.json
  .nvmrc
  .gitignore
  deelan.config.yml

  content/
    posts/
    snippets/

  src/
    pages/
      index.astro
      posts/
      snippets/
    components/
      layout/
    styles/
    lib/
      content/
      search/
      git/
      export/
      tags/

  scripts/
    validate-content.ts
    build-indexes.ts
    build-git-timeline.ts
    export-item.ts
    tags.ts
    prepare-mathjax.ts

  generated/
    search/
    timeline/
    manifests/

  public/
    js/
    mathjax/
    service-worker.js

  docs/
```

## 2) Content Model

Required frontmatter:

- `id`
- `type`: `post | snippet`
- `title`
- `tags` (hierarchical dot notation)
- `version`

Optional frontmatter:

- `summary`, `notes`, `related_ids`
- `created_at`, `updated_at`
- `status`: `draft | published | archived`

Derived at build time:

- `created_at_git`, `updated_at_git`
- `effective_created_at`, `effective_updated_at`
- `tag_ancestors`

## 3) Tag Hierarchy

Canonical format:

- lowercase
- dot-separated (`a.b.c`)
- regex: `^[a-z0-9]+(\.[a-z0-9]+)*$`

Filtering:

- exact: `a.b.c`
- subtree/prefix: `a.b.*`

## 4) Search and Filtering

- Separate posts/snippets indexes.
- Query operators: `&`, `|`, `(`, `)`.
- Structured filters: `tag:`, `from:`, `to:`.
- Date filter semantics: inclusive end-of-day for `to:`.

## 5) Offline / PWA

- Service worker pre-caches shell + key assets.
- Cache-first for static assets.
- Network-first for navigations with cache fallback.
- Cache version bump policy for invalidation.

## 6) Version Timeline

- Build script reads Git log per content file.
- Emits `generated/timeline/versions.json` with commit timeline and effective timestamps.

## 7) Export

CLI:

- `npm run export -- --id <id> --format html --out ./exports`
- `npm run export -- --id <id> --format pdf --out ./exports`

Current output layout:

- HTML: `exports/<id>/index.html`
- Assets: `exports/<id>/style.css`, `exports/<id>/mathjax/...`
- PDF: `exports/<id>/<id>.pdf`

Theme handling:

- default from `deelan.config.yml`
- override via `--theme light|dark`

## 8) Milestone Plan

### Phase 1 (MVP) — Complete

1. Static app scaffold and core routes.
2. Content schema validation and hierarchical tags.
3. Markdown rendering with Shiki and MathJax.
4. Search indexes and parser/evaluator basics.
5. Posts/snippets filtering UI.
6. PWA offline caching baseline.
7. Git timeline artifact and UI rendering.
8. HTML/PDF export CLI baseline.
9. Initial tests.

### Phase 2 (Enhancements) — In Progress

1. Tag CLI (`list`, `tree`, `duplicates`, `rename`, `merge`) with dry-run/apply.
2. Config-driven site shell (top nav, footer, theme toggle).
3. Getting Started, developer docs, editor integration docs.
4. MkDocs-based documentation workflow.
5. Filter logic hardening + date semantics fixes.
6. Export folder layout cleanup (`<id>/index.html`).

### Phase 3 (Planned)

1. Optional `--inline-assets` export mode (single-file HTML where practical).
2. Tag word-cloud generation command/output.
3. CI workflow for automation and maintainability (`test`, `validate`, `build`, docs checks).
4. Optional changelog surfacing in UI.

## 9) Optional Changelog Surfacing (Clarification)

Definition:

- Surface a concise, user-facing change log per content item derived from Git commits and/or a manual changelog field/file.
- Example: “v1.2: rewrote partitioning section”, “v1.3: added dbt snippet links”.

Estimated scope:

- Medium-sized task (not huge, but more than a quick patch).
- Requires:
  - deciding source of truth (Git messages only vs mixed manual metadata)
  - normalization rules for noisy commit messages
  - UI placement and truncation/expansion behavior

Reason for Phase 3 placement:

- Valuable for readers and maintenance, but not required for core functional correctness.

## 10) Risks and Guardrails

- ID drift: enforce explicit stable IDs + uniqueness checks.
- Tag entropy: strict validation + tag CLI maintenance tooling.
- Git edge cases: allow timestamp overrides in frontmatter.
- Offline staleness: explicit cache versioning and update strategy.
