# Branding and Visual Identity

This page describes the current Deelan visual identity system and where each asset is used.

## Brand Assets

Canonical assets live in `logos/`:

- `deelan-hires.png`: full-color hero art (high resolution)
- `deelan-cartoon.png`: lightweight transparent logo
- `deelan-favicon.png`: source image for favicon/icon derivatives

Operational derivatives are generated/copied into:

- `public/` for Astro app usage
- `docs/assets/` for MkDocs usage

Detailed mapping is maintained in `logos/BRAND.md`.

## Where Branding Appears

- App shell (Astro):
  - favicon and touch icon in `<head>`
  - home hero image in the index route
- Docs (MkDocs Material):
  - header logo and favicon from `docs/assets/`
- Storybook:
  - dark manager theme + Deelan manager title
- HTML/PDF export:
  - typography and color treatment follow theme tokens
  - no forced logo watermark by default

## Accent and Color Direction

Deelan uses a hue-seeded theme model:

- configure `accent_hue` in `deelan.config.yml`
- light/dark palettes derive from this single hue
- app and export styling share the same token model

Practical recommendation:

- start by adjusting only `accent_hue`
- keep hue in `130..200` for robust legibility across themes

See also: [Configuration](user-configuration.md).

## Typography Direction

Current typography roles:

- UI/controls/headings: `--font-ui`
- body text: `--font-body`
- code/technical literals: `--font-mono`

Avoid mixing role intent. The strongest results come from consistent role usage rather than frequent font switching.

## Naming

Use `Deelan` as the default product spelling.

## Current Gap (Vector Finalization)

A final vector package is still pending:

- icon mark SVG
- lockup SVG
- favicon SVG source

This does not block product usage, but it is the remaining step for a complete publish-ready visual identity kit.
