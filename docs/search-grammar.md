# Search Grammar

DEELAN supports two layers of filtering:

1. Text expression (boolean operators)
2. Structured filters (`tag:`, `from:`, `to:`)

## Text Expression

Supported operators:

- `&` = logical AND
- `|` = logical OR
- `(` and `)` for grouping

Examples:

- `spark & partitioning`
- `(spark | dbt) & model`
- `"slowly changing dimension" | scd`

Matching is case-insensitive substring match over an item's text fields.

## Structured Filters

- `tag:<value>`
- `from:YYYY-MM-DD`
- `to:YYYY-MM-DD`

Examples:

- `tag:data.lake.*`
- `partition & pruning tag:query.optimization`
- `etl from:2026-01-01 to:2026-12-31`

Tag matching rules:

- exact: `tag:data.lake.partitioning`
- prefix wildcard: `tag:data.lake.*`

## Notes

- Structured tokens are removed from the text expression before parsing.
- Invalid/partial expressions degrade gracefully (empty terms are ignored).
- Additional dedicated UI controls for tag/from/to are merged with query-string filters.
