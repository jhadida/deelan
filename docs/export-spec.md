# Export Spec

## CLI

```bash
npm run export -- --id <content-id> --format html --out ./exports
npm run export -- --id <content-id> --format pdf --out ./exports
```

Arguments:

- `--id` (required): generated content ID (`post--<slug>` or `snippet--<slug>`)
- `--format` (optional): `html` (default) or `pdf`
- `--out` (optional): output directory (default: `./exports`)
- `--theme` (optional): `light` or `dark`
- `--pdf-scale` (optional): PDF scale factor (`> 0` and `<= 2`, default: `1`)

Theme behavior:

- If `--theme` is provided, export uses that theme.
- Otherwise export defaults to `default_theme` from `deelan.config.yml`.

## HTML Export

Outputs:

- `<id>/index.html`
- `<id>/style.css`
- `<id>/mathjax/...`

This keeps each export self-contained in a single directory while avoiding large single-file HTML output by default.

## PDF Export

PDF is generated from the exported HTML via Playwright/Chromium.
Output path:

- `<id>/<id>.pdf`

Scale can be tuned to fit page content density:

```bash
npm run export -- --id post--de-partitioning-primer --format pdf --pdf-scale 0.95
```

Playwright browser binaries are **not guaranteed to be present** after npm install in every environment.

If Chromium is not installed yet, run:

```bash
npm run optional:pdf
```

## Notes

- Export validates content frontmatter before generating output.
- IDs are generated from file path and filename (not read from frontmatter).
- Export fails on duplicate IDs.
