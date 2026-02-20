import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../src/lib/content/render-markdown';

test('renderMarkdown supports internal links, TOC, figures, footnotes, and mermaid blocks', async () => {
  const markdown = `
[[toc]]

## Intro
See [[post--alpha|Alpha Post]] and note[^n1].

![Pipeline](./img/pipeline.png){width=60%}

\`\`\`mermaid
flowchart TD
  A --> B
\`\`\`

> [!NOTE] Heads up
> Works with callouts.

[^n1]: Footnote content.
`;

  const html = await renderMarkdown(markdown);
  assert.match(html, /class="md-toc"/);
  assert.match(html, /id="intro"/);
  assert.match(html, /href="\/view\/post--alpha"/);
  assert.match(html, /class="md-figure"/);
  assert.match(html, /--md-figure-width: 60%/);
  assert.match(html, /<pre class="mermaid">/);
  assert.match(html, /class="md-admonition md-admonition-note"/);
  assert.match(html, /class="md-footnotes"/);
});

test('renderMarkdown rewrites local asset links when source file path is provided', async () => {
  const markdown = '![Img](./assets/example/figure-01-overview.svg){width=50%}';
  const html = await renderMarkdown(markdown, { sourceFilePath: 'content/posts/example.md' });
  assert.match(html, /src="\/content-assets\/posts\/example\/figure-01-overview\.svg"/);
});
