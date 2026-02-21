# Analytics

Deelan includes a static `analytics/` route generated from build artifacts.

## What it shows

- summary cards (items, tags, average tags per item, relation edges)
- sortable tag frequency table
- top-tags histogram
- static hierarchical treemap (minimal, top-level/second-level preview)
- post/snippet relationship graph

## Build Artifacts

Generated during `build:analytics`:

- `.generated/analytics/tags.json`
- `.generated/analytics/relations.json`

These are rebuilt by `npm run build` (via preflight).

## Notes

- Treemap is intentionally minimal/static in v1.
- More advanced interactions (zoom/drill-down and richer graph metrics) are planned for future phases.
