# Deelan Brand Kit

This folder contains canonical Deelan logo assets and usage guidance.

## Asset Inventory

- `deelan-hires.png`
  - High-resolution full-color hero image (with background).
  - Primary use: repository README hero, app home hero, marketing visuals.
- `deelan-cartoon.png`
  - Lightweight full-size logo with transparent background.
  - Primary use: package pages, docs illustrations, social thumbnails.
- `deelan-favicon.png`
  - Source image for small identity marks.
  - Primary use: favicon/icon generation pipeline.
- `deelan-text.png`
  - Styled text wordmark for "Deelan".
  - Primary use: docs landing hero lockup (paired with cartoon mark).
- `deelan-squared.png`
  - Alternate wordmark where "ee" is shown as `e²`.
  - Primary use: optional docs/marketing variant for mathematically themed contexts.

Generated derivatives:

- `public/favicon.ico`
- `public/icons/favicon-32.png`
- `public/icons/deelan-favicon-192.png`
- `public/icons/deelan-favicon-256.png`
- `docs/assets/favicon.png`
- `docs/assets/deelan-logo.png`

## Surface Usage Matrix

- Astro app
  - Browser tab/favicon: `public/favicon.ico`, `public/icons/favicon-32.png`
  - Apple touch icon: `public/icons/deelan-favicon-192.png`
  - Home hero: `public/images/deelan-hires.png`
- MkDocs site
  - Header logo: `docs/assets/deelan-logo.png`
  - Favicon: `docs/assets/favicon.png`
- Storybook
  - Manager title-only branding (text, no logo image)
- Docs landing hero
  - Combined row: `deelan-cartoon.png` + `deelan-text.png` in `docs/index.md`
- Exports (HTML/PDF)
  - Inherit app theme/accent via CSS tokens.
  - No global logo watermark by default (intentional for content fidelity).

## Color and Accent Guidance

- Global accent seed: `accent_hue` in `deelan.config.yml`
- Valid range: `0..360` (clamped at runtime)
- Recommendation:
  - stay in `130..200` for balanced contrast in both light/dark themes
  - adjust only one variable first (`accent_hue`) before modifying theme CSS

## Typography Pairing (Current)

- UI/headings: `--font-ui` in `src/styles/tokens.css`
- Body copy: `--font-body` in `src/styles/tokens.css`
- Code: `--font-mono` in `src/styles/tokens.css`

Guideline:

- Keep UI font for navigation, buttons, section labels, and compact metadata.
- Keep body font for rendered content and long-form text.
- Keep mono font for code, IDs, and CLI-like snippets.

## Naming and Voice

- Preferred product name: `Deelan`
- Avoid all-caps `DEELAN` unless required by an external branding constraint.

## Open Brand Items

- Final vector package (SVG icon + full lockup) is not yet finalized.
- If vector source files become available, publish under:
  - `logos/deelan-mark.svg`
  - `logos/deelan-lockup.svg`
  - `logos/deelan-favicon.svg`
