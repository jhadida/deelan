# Build Workflow

This page describes the static build workflow and related commands.

## User-Facing Workflow

- `deelan validate`
- `deelan build`
- `deelan serve`

## Build Pipeline Stages

`deelan build` runs:

1. `build:prepare-mathjax`
2. `build:prepare-search`
3. `build:prepare-content-assets`
4. `validate`
5. `build:indexes`
6. `build:analytics`
7. `build:timeline`
8. `astro build`

## Maintainer/Debug Commands

These are typically run via npm scripts:

- `npm run build:prepare-mathjax`
- `npm run build:prepare-search`
- `npm run build:prepare-content-assets`
- `npm run build:indexes`
- `npm run build:analytics`
- `npm run build:timeline`
- `npm run build:preflight`

Synthetic stress-test helpers:

- `npm run synthetic:generate -- --posts 140 --snippets 220 --seed 20260222`
- `npm run synthetic:clean`
- `npm run validate:with-synthetic`
- `npm run build:with-synthetic`
- `npm run test:with-synthetic`

