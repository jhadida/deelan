# Visual Gallery

This page is a placeholder gallery you can fill with screenshots that show what Deelan looks like in practice.

Recommended location for screenshots:

- `docs/assets/screenshots/`

Recommended naming convention:

- `01-home-light.png`
- `02-home-dark.png`
- `03-posts-table.png`
- `04-snippets-explorer.png`
- `05-view-post.png`
- `06-view-snippet.png`
- `07-analytics-overview.png`
- `08-analytics-treemap.png`
- `09-analytics-graph.png`
- `10-export-html.png`

## Home

![Home (light)](assets/screenshots/01-home-light.png)
![Home (dark)](assets/screenshots/02-home-dark.png)

## Posts and Snippets

![Posts table](assets/screenshots/03-posts-table.png)
![Snippets explorer](assets/screenshots/04-snippets-explorer.png)

## Rendered Views

![Rendered post](assets/screenshots/05-view-post.png)
![Rendered snippet](assets/screenshots/06-view-snippet.png)

## Analytics

![Analytics overview](assets/screenshots/07-analytics-overview.png)
![Analytics treemap](assets/screenshots/08-analytics-treemap.png)
![Analytics graph](assets/screenshots/09-analytics-graph.png)

## Standalone Example (Showcase Post)

You can export the showcase post as a standalone HTML artifact:

```bash
deelan export post--showcase --format html --out exports/showcase
```

Then copy the output file into docs assets, for example:

- from: `exports/showcase/post--showcase.html`
- to: `docs/assets/examples/showcase.html`

Once copied, this link will work in published docs:

- [Open standalone showcase HTML](assets/examples/showcase.html)
