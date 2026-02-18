# Tag CLI

Run via:

```bash
npm run tags -- <command>
```

## Commands

- `list` - list tags with counts
- `tree` - show hierarchical tag tree
- `duplicates [--distance N]` - detect canonical and near duplicates
- `rename --from <tag> --to <tag> [--subtree] [--apply]`
- `merge --from <tag> --to <tag> [--subtree] [--apply]`

## Examples

```bash
npm run tags -- list
npm run tags -- tree
npm run tags -- duplicates --distance 2
npm run tags -- rename --from data.etl --to data.pipeline --subtree
npm run tags -- merge --from python.panda.groupby --to python.pandas.groupby --apply
```

## Safety

- `rename` and `merge` default to dry-run.
- Add `--apply` to write changes.
