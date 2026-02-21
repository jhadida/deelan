---
title: Pandas GroupBy Cheatsheet
tags:
  - python.pandas.groupby
  - data.transform
description: Useful aggregation patterns for exploratory work.
related_ids:
  - post--partitioning-primer
---

```python
import pandas as pd

out = (
    df.groupby(["country", "day"], as_index=False)
      .agg(total=("amount", "sum"), n=("amount", "size"))
)
```
