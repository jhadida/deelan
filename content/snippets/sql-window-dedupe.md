---
id: sql-window-dedupe-snippet
type: snippet
title: SQL Window Deduplication Pattern
tags:
  - sql.window
  - data.quality
version: 1.0.0
notes: Keep latest event per business key using `row_number`.
related_ids:
  - ingestion-observability-checklist
  - de-partitioning-primer
created_at: "2026-02-09T12:00:00Z"
updated_at: "2026-02-11T09:15:00Z"
status: published
---

```sql
WITH ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id, order_id
      ORDER BY event_ts DESC
    ) AS rn
  FROM raw_orders
)
SELECT *
FROM ranked
WHERE rn = 1;
```
