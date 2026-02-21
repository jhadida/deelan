# Tag Management

Run via:

```bash
npm run tags -- <command>
```

## Commands

- `list` - list tags with counts
- `stats` - summary statistics (items, assignment counts, top tags)
- `tree` - show hierarchical tag tree
- `duplicates [--distance N]` - detect canonical and near duplicates
- `rename --from <tag> --to <tag> [--subtree] [--apply] [--confirm-subtree]`
- `merge --from <tag> --to <tag> [--subtree] [--apply] [--confirm-subtree]`
- `wordcloud [--out <path>]` - generate tag word cloud HTML

## Examples

```bash
npm run tags -- list
npm run tags -- stats
npm run tags -- tree
npm run tags -- duplicates --distance 2
npm run tags -- rename --from data.etl --to data.pipeline --subtree
npm run tags -- rename --from data.etl --to data.pipeline --subtree --apply --confirm-subtree
npm run tags -- wordcloud --out ./exports/tag-wordcloud.html
```

## Safety

- `rename` and `merge` default to dry-run.
- Add `--apply` to write changes.
- Subtree writes (`--subtree --apply`) require `--confirm-subtree`.
