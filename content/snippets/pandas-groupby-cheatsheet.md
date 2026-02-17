---
id: pandas-groupby-snippet
type: snippet
title: Pandas GroupBy Cheatsheet
tags:
  - python.pandas.groupby
  - data.transform
version: 1.0.0
notes: Useful aggregation patterns for exploratory work.
related_ids:
  - de-partitioning-primer
status: published
---

```python
import pandas as pd

out = (
    df.groupby(["country", "day"], as_index=False)
      .agg(total=("amount", "sum"), n=("amount", "size"))
)
```
