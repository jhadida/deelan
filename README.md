# DEELAN

Data Engineering Electronic LAboratory Notebook.

## Getting Started

```bash
npm install
npm run build
npm run preview
```

Open [http://localhost:4321](http://localhost:4321).

## Key Commands

- `npm run dev` - local development
- `npm test` - unit tests
- `npm run validate` - content/frontmatter checks
- `npm run build` - full static build
- `npm run preview` - preview built site
- `npm run tags -- <command>` - tag management CLI
- `npm run export -- --id <id> --format html|pdf` - export content item

## Documentation

- User/developer docs: `docs/`
- MkDocs config: `mkdocs.yml`
- Install docs tooling: `npm run docs:install`
- Serve docs locally: `npm run docs:serve`
- Build docs: `npm run docs:build`
- Deploy docs to `gh-pages`: `npm run docs:deploy`

## Astro Site URL

Set `site` in `astro.config.mjs` to your deployed base URL (for example GitHub Pages URL).

Reference: [Astro `site` config](https://docs.astro.build/en/reference/configuration-reference/#site)
