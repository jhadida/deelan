# Configuration

DEELAN runtime configuration is stored in `deelan.config.yml` at the repository root.

## Available Options

- `blog_title` (`string`): site title shown in the header and page titles.
- `footer_text` (`string`): footer text shown at the bottom of pages.
- `default_theme` (`light | dark`): initial theme before user override.
- `timezone` (`string`, default: `UTC`): IANA timezone used for rendered timestamps.
- `code_theme_light` (`string`, default: `github-light`): Shiki theme name for light mode code blocks.
- `code_theme_dark` (`string`, default: `github-dark`): Shiki theme name for dark mode code blocks.
- `timeline_commit_url_template` (`string`, default: empty): URL template used to link timeline commits. Use `${COMMIT_SHA}` as placeholder.

## Timezone Format

Use an [IANA timezone identifier](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones), for example:

- `UTC`
- `America/Los_Angeles`
- `Europe/Paris`
- `Asia/Tokyo`

Example `deelan.config.yml`:

```yaml
blog_title: Deelan.
footer_text: "Built with ♥ using Deelan."
default_theme: dark
timezone: America/Los_Angeles
code_theme_light: github-light
code_theme_dark: github-dark
timeline_commit_url_template: https://github.com/jhadida/deelan/commit/${COMMIT_SHA}
```

Notes:

- Rendered timestamps are displayed without timezone suffix.
- If `timezone` is invalid, DEELAN falls back to `UTC` formatting.
- If a code theme name is invalid, DEELAN falls back to `github-light`/`github-dark`.
- If `timeline_commit_url_template` is empty or missing `${COMMIT_SHA}`, timeline commits render as plain text.

## Code Highlighting Themes

`code_theme_light` and `code_theme_dark` map directly to [Shiki theme names](https://shiki.style/themes).

Example:

```yaml
code_theme_light: one-light
code_theme_dark: nord
```
