# Export Contents

## CLI

```bash
deelan export --id <content-id> --format html --out ./exports
deelan export --id <content-id> --format pdf --out ./exports
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
deelan export --id post--partitioning-primer --format pdf --pdf-scale 0.95
```

Playwright/Chromium is optional and only required for PDF export.
If missing, install:

```bash
npm install playwright
npx playwright install chromium
```

Repository maintainers can also use:

```bash
npm run optional:pdf
```

## Notes

- Export validates content frontmatter before generating output.
- IDs are generated from file path and filename (not read from frontmatter).
- Export fails on duplicate IDs.
