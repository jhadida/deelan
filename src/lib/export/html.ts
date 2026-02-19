import fs from 'node:fs/promises';
import path from 'node:path';
import { getSiteConfig, type SiteTheme } from '../site-config';
import type { ExportContext } from './types';

async function copyDir(src: string, dst: string): Promise<void> {
  await fs.mkdir(dst, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, dstPath);
      continue;
    }

    if (entry.isFile()) {
      await fs.copyFile(srcPath, dstPath);
    }
  }
}

function exportCss(): string {
  return `
:root {
  --bg: #f5f4ef;
  --fg: #181818;
  --muted: #6b6b6b;
  --accent: #0b6e4f;
  --surface: #ffffff;
}
[data-theme="dark"] {
  --bg: #121212;
  --fg: #f3f3ef;
  --muted: #b0b0b0;
  --accent: #5ecfa7;
  --surface: #1e1e1e;
}
* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}
a { color: var(--accent); }
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
header {
  border-bottom: 1px solid #ddd;
  margin-bottom: 1rem;
}
.meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.markdown-body { line-height: 1.65; }
.markdown-body pre {
  overflow: auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
}
.markdown-body code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace;
}
.footer {
  margin-top: 2rem;
  border-top: 1px solid #ddd;
  padding-top: 1rem;
  color: var(--muted);
}
img {
  max-width: 100%;
  height: auto;
}
@media print {
  @page {
    size: A4;
    margin: 14mm;
  }
  body {
    background: #fff;
  }
  pre, blockquote, table {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  h1, h2, h3 {
    page-break-after: avoid;
    break-after: avoid;
  }
}
`;
}

function isLocalAssetReference(value: string): boolean {
  if (!value || value.startsWith('#')) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false;
  if (value.startsWith('//')) return false;
  return true;
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function rewriteHtmlAssets(html: string, sourceFilePath: string, exportDir: string): Promise<string> {
  const sourceDir = path.dirname(path.join(process.cwd(), sourceFilePath));
  const mediaDir = path.join(exportDir, 'media');
  await fs.mkdir(mediaDir, { recursive: true });

  const map = new Map<string, string>();
  const usedNames = new Set<string>();

  async function copyLocalAsset(original: string): Promise<string | null> {
    if (!isLocalAssetReference(original)) return null;
    if (original.startsWith('/')) return original;

    const normalized = original.split('?')[0].split('#')[0];
    const absPath = path.resolve(sourceDir, normalized);

    try {
      await fs.access(absPath);
    } catch {
      return null;
    }

    if (map.has(original)) return map.get(original) ?? null;

    const parsed = path.parse(absPath);
    let candidate = sanitizeName(parsed.base || 'asset');
    if (!candidate) candidate = 'asset';
    let index = 1;
    while (usedNames.has(candidate)) {
      candidate = `${sanitizeName(parsed.name)}-${index}${parsed.ext}`;
      index += 1;
    }
    usedNames.add(candidate);

    const relPath = `./media/${candidate}`;
    await fs.copyFile(absPath, path.join(mediaDir, candidate));
    map.set(original, relPath);
    return relPath;
  }

  const imgRegex = /(<img\b[^>]*\bsrc=")([^"]+)(")/g;
  let output = html;
  for (const match of html.matchAll(imgRegex)) {
    const original = match[2];
    const replacement = await copyLocalAsset(original);
    if (!replacement || replacement === original) continue;
    output = output.replace(`src="${original}"`, `src="${replacement}"`);
  }

  const linkRegex = /(<a\b[^>]*\bhref=")([^"]+)(")/g;
  for (const match of output.matchAll(linkRegex)) {
    const original = match[2];
    if (!isLocalAssetReference(original)) continue;
    if (original.startsWith('/') || original.startsWith('./media/')) continue;

    if (original.endsWith('.md')) {
      const target = original.replace(/\.md$/i, '.html');
      output = output.replace(`href="${original}"`, `href="${target}"`);
      continue;
    }

    const copied = await copyLocalAsset(original);
    if (copied && copied !== original) {
      output = output.replace(`href="${original}"`, `href="${copied}"`);
    }
  }

  return output;
}

export async function exportHtml(context: ExportContext): Promise<{ htmlPath: string; exportDir: string }> {
  const { item, renderedHtml, outDir } = context;

  const config = await getSiteConfig();
  const theme: SiteTheme = context.theme ?? config.default_theme;
  const id = item.frontmatter.id;
  const exportDir = path.join(outDir, id);
  const htmlPath = path.join(exportDir, 'index.html');
  const cssPath = path.join(exportDir, 'style.css');
  const mathjaxDst = path.join(exportDir, 'mathjax');

  await fs.mkdir(exportDir, { recursive: true });
  await fs.writeFile(cssPath, exportCss(), 'utf8');

  const mathjaxSrc = path.join(process.cwd(), 'public', 'mathjax');
  try {
    await copyDir(mathjaxSrc, mathjaxDst);
  } catch {
    // Export can still proceed without local MathJax assets.
  }

  const updated = item.frontmatter.updated_at ?? item.frontmatter.created_at ?? 'N/A';
  const isPost = item.frontmatter.type === 'post';
  const postMeta = isPost
    ? `<div><strong>Version</strong><div>${item.frontmatter.version}</div></div>
        <div><strong>Status</strong><div>${item.frontmatter.status ?? 'published'}</div></div>`
    : '';
  const contentHtml = await rewriteHtmlAssets(renderedHtml, item.filePath, exportDir);
  const html = `<!doctype html>
<html lang="en" data-theme="${theme}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${item.frontmatter.title} | ${config.blog_title}</title>
    <link rel="stylesheet" href="./style.css" />
    <script>
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
          displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
        },
        options: {
          skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
        }
      };
    </script>
    <script defer src="./mathjax/tex-mml-chtml.js"></script>
  </head>
  <body>
    <main class="container">
      <header>
        <h1>${item.frontmatter.title}</h1>
        <p>${item.frontmatter.id}</p>
      </header>

      <section class="meta">
        <div><strong>Type</strong><div>${item.frontmatter.type}</div></div>
        ${postMeta}
        <div><strong>Updated</strong><div>${updated}</div></div>
      </section>

      <article class="markdown-body">${contentHtml}</article>

      <footer class="footer">${config.footer_text}</footer>
    </main>
  </body>
</html>`;

  await fs.writeFile(htmlPath, html, 'utf8');
  return { htmlPath, exportDir };
}
