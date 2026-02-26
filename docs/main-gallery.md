# Visual Gallery

## Theming

```yml title="deelan.config.yml"
default_theme: light
```

![Home (light)](assets/screenshots/home-light.png)

```yml title="deelan.config.yml"
default_theme: dark
```

![Home (dark)](assets/screenshots/home-dark.png)


```yml title="deelan.config.yml"
default_theme: dark
accent_hue: 10
```

![Home (dark)](assets/screenshots/home-dark-hue.png)

---

## Posts and Snippets

View and search posts at `/posts`:

![Posts table](assets/screenshots/post-table.png)

View and filter snippets at `/snippets`:

![Snippets explorer](assets/screenshots/snippet-explorer.png)

Posts and snippets can be exported as standalone artifacts using e.g.:
```bash
deelan export --id post--showcase --format html --out ./exports
```

[View standalone showcase HTML.](assets/showcase/index.html)

---

## Analytics

Each post or snippet can be assigned multiple tags. 
The analytics page at `/analytics` displays basic tag statistics. All tags can also be explored in a table: 

![Analytics overview](assets/screenshots/analytics-overview.png)

The relationships between posts and snippets, as defined by internal links between them (see `related_ids` frontmatter property), can be visualized as a graph with network-theoretic metrics computed at build time:

![Analytics graph](assets/screenshots/analytics-graph.png)
