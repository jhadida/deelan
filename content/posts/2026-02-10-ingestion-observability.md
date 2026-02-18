---
id: ingestion-observability-checklist
type: post
title: Ingestion Observability Checklist
tags:
  - data.ingestion
  - reliability.monitoring
version: 1.0.0
summary: A compact checklist for instrumenting ingestion jobs before production rollout.
related_ids:
  - sql-window-dedupe-snippet
  - pandas-groupby-snippet
created_at: "2026-02-10T08:30:00Z"
updated_at: "2026-02-12T16:20:00Z"
status: published
---

# Ingestion Observability Checklist

Minimum telemetry to collect on day one:

1. Run-level metrics (`duration`, `input_rows`, `output_rows`).
2. Failure reasons grouped by source system and stage.
3. Lag between source event time and warehouse availability.

Use a single run identifier to correlate logs, metrics, and alerts.

```sql
SELECT
  run_id,
  stage,
  COUNT(*) AS failures
FROM ingestion_errors
WHERE run_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY run_id, stage
ORDER BY failures DESC;
```
