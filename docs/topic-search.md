# Search Grammar

DEELAN search combines:

1. Boolean text expression
2. Structured filters

## Text Expression

Supported operators:

- `&` logical AND
- `|` logical OR
- `(` and `)` grouping

Examples:

- `spark & partitioning`
- `(spark | dbt) & model`
- `"slowly changing dimension" | scd`

Matching is case-insensitive substring matching over indexed text fields.

## Structured Filters

Supported tokens:

- `title:<value>`
- `tag:<value>`
- `from:YYYY-MM-DD`
- `to:YYYY-MM-DD`

Examples:

- `title:partitioning`
- `tag:data.lake.*`
- `title:etl tag:data.pipeline from:2026-01-01 to:2026-12-31`
- `(spark | dbt) & title:model tag:analytics`

### Tag matching

- exact: `tag:data.lake.partitioning`
- prefix wildcard: `tag:data.lake.*`

## Notes

- Structured tokens are removed before boolean expression parsing.
- Invalid/partial expressions degrade gracefully (empty terms ignored).
- UI controls (title/tag/date fields) merge with query-string filters.

