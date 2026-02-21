---
title: Partitioning Primer for Data Lakes
tags:
  - data.lake.partitioning
  - query.optimization
version: 1.0.0
description: Why and how to partition for practical query performance.
related_ids:
  - snippet--pandas-groupby-snippet
status: published
---

# Partitioning Primer

This is a starter post.

Inline math using MathJax style: $N = \sum_{i=1}^{k} x_i$.

```sql
SELECT dt, COUNT(*)
FROM events
WHERE dt BETWEEN '2026-01-01' AND '2026-01-31'
GROUP BY dt;
```
