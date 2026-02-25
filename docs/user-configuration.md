# Configuration

Runtime configuration is stored in `deelan.config.yml` at project root.

## Available Options

- `blog_title` (`string`) site title in header and page titles
- `footer_text` (`string`) footer text
- `default_theme` (`light | dark`) initial theme before user override
- `timezone` (`string`, default: `UTC`) IANA timezone for rendered timestamps
- `accent_hue` (`number`, default: `150`) shared hue seed used by light/dark theme variables
- `content_max_width` (`string`, default: `1100px`) main content container width
- `code_theme_light` (`string`, default: `github-light`) Shiki theme for light mode code blocks
- `code_theme_dark` (`string`, default: `github-dark`) Shiki theme for dark mode code blocks
- `timeline_commit_url_template` (`string`, default: empty) URL template with `${COMMIT_SHA}`
- `enable_posts_list_view` (`boolean`, default: `false`) enable optional posts list-card view and table/list toggle
- `enable_tailwind_pilot` (`boolean`, default: `false`) enable Tailwind pilot route styling experiments (separate branch workflow)
- `log_level` (`error | warn | info | debug`, default: `info`) global CLI/script logging threshold
- `log_file` (`string`, optional) path to append logs to (relative to project root)

## Example

```yaml
blog_title: Deelan.
footer_text: "Built with ♥ using Deelan."
default_theme: dark
timezone: America/Los_Angeles
accent_hue: 150
content_max_width: 1100px
code_theme_light: material-theme-lighter
code_theme_dark: material-theme-darker
timeline_commit_url_template: https://github.com/jhadida/deelan/commit/${COMMIT_SHA}
enable_posts_list_view: false
enable_tailwind_pilot: false
log_level: info
# log_file: .generated/logs/deelan.log
```

## Theme Tokens and UI Customization

For common customization, you do not need to copy `src/` styles:

- Change `accent_hue` to re-seed both light and dark palettes.
- Change `content_max_width` to adjust main page width.

These values map into CSS variables at runtime (for site rendering and exports):

- `accent_hue` -> `--accent-hue`
- `content_max_width` -> `--container-max` and `--detail-max`

## Timezone Format

Use IANA timezone identifiers, for example:

- `UTC`
- `America/Los_Angeles`
- `Europe/Paris`
- `Asia/Tokyo`

## Code Highlighting Themes

`code_theme_light` and `code_theme_dark` map directly to [Shiki themes](https://shiki.style/themes).

Example:

```yaml
code_theme_light: one-light
code_theme_dark: nord
```

## Notes

- Timestamps are rendered without timezone suffix.
- Invalid `timezone` falls back to `UTC`.
- Invalid code themes fall back to `github-light` / `github-dark`.
- `accent_hue` is clamped to `0..360`.
- Invalid `content_max_width` falls back to `1100px`.
- If `timeline_commit_url_template` is missing `${COMMIT_SHA}`, timeline SHAs render as plain text.

## Logging Configuration

Logging resolution order is:

1. CLI flags (`--log-level`, `--log-file`)
2. Environment (`DEELAN_LOG_LEVEL`, `DEELAN_LOG_FILE`)
3. `deelan.config.yml` (`logging.level` / `logging.file` or `log_level` / `log_file`)
4. Built-in defaults (`info`, no log file)

Example overrides:

```bash
deelan build --log-level debug
deelan validate --log-file .generated/logs/validate.log
```
