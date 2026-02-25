# Analytics

Deelan includes a static `analytics/` route generated from build artifacts.

## What it shows

- summary cards (items, tags, average tags per item, relation edges, graph components)
- sortable tag frequency table
- static hierarchical treemap
- post/snippet relationship graph

## Build Artifacts

Generated during `build:analytics`:

- `.generated/analytics/tags.json`
- `.generated/analytics/relations.json`

These are rebuilt by `npm run build` (via preflight).

## Graph metrics

The node details panel reports:

- `Neighbors`: number of directly connected items (degree centrality)
- `Degree normalized`: degree normalized by graph size
- `Closeness`: inverse mean shortest-path distance to reachable nodes
- `Betweenness`: frequency of appearing on shortest paths between other nodes
- `Betweenness normalized`: normalized betweenness score
- `PageRank`: influence score from incoming graph structure
- `Component`: connected component id and component size

Metrics are computed at build time in headless Cytoscape and embedded in analytics artifacts.

Reference links:

- [Cytoscape.js centrality APIs](https://js.cytoscape.org/#eles.degreeCentrality)
- [Cytoscape.js PageRank](https://js.cytoscape.org/#eles.pageRank)

## Notes

- Treemap is intentionally static in v1 and optimized for readability over interaction.
