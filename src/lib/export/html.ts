import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { getSiteConfig, type SiteTheme } from '../site-config';
import { formatTimestamp } from '../time';
import { loadTimeline } from '../content/generated';
import { isLocalAssetReference, pathExists } from '../util';
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

async function exportCss(): Promise<string> {
  const root = process.cwd();
  try {
    const [tokens, light, dark, globalRaw] = await Promise.all([
      fs.readFile(path.join(root, 'src', 'styles', 'tokens.css'), 'utf8'),
      fs.readFile(path.join(root, 'src', 'styles', 'themes', 'light.css'), 'utf8'),
      fs.readFile(path.join(root, 'src', 'styles', 'themes', 'dark.css'), 'utf8'),
      fs.readFile(path.join(root, 'src', 'styles', 'global.css'), 'utf8')
    ]);

    const global = globalRaw.replace(/^@import\s+['"][^'"]+['"];\s*$/gm, '').trim();

    return `${tokens}\n\n${light}\n\n${dark}\n\n${global}\n\n@media print {
  @page {
    size: A4;
    margin: 0;
  }
  html,
  body {
    width: 210mm;
    height: 297mm;
    margin: 0 !important;
    padding: 0 !important;
  }
  .topbar,
  .theme-toggle,
  .nav-links {
    display: none !important;
  }
  pre, blockquote, table {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  h1, h2, h3 {
    page-break-after: avoid;
    break-after: avoid;
  }
}`;
  } catch {
    // Fallback for isolated test environments that do not include src/styles.
    return `
:root { --bg: #f5f4ef; --fg: #181818; --muted: #6b6b6b; --accent: #0b6e4f; --surface: #ffffff; }
[data-theme="dark"] { --bg: #121212; --fg: #f3f3ef; --muted: #b0b0b0; --accent: #5ecfa7; --surface: #1e1e1e; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
a { color: var(--accent); }
.container { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; }
.markdown-body pre { overflow: auto; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; }
.markdown-body code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace; }
img { max-width: 100%; height: auto; }
`;
  }
}

function getLatestGitTimestamp(filePath: string): string | null {
  try {
    const output = execFileSync('git', ['log', '-1', '--format=%aI', '--', filePath], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
    return output || null;
  } catch {
    return null;
  }
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

    if (!(await pathExists(absPath))) {
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
  const timeline = await loadTimeline();
  const theme: SiteTheme = context.theme ?? config.default_theme;
  const id = item.frontmatter.id;
  const exportDir = path.join(outDir, id);
  const htmlPath = path.join(exportDir, 'index.html');
  const cssPath = path.join(exportDir, 'style.css');
  const mathjaxDst = path.join(exportDir, 'mathjax');

  await fs.mkdir(exportDir, { recursive: true });
  await fs.writeFile(cssPath, await exportCss(), 'utf8');

  const mathjaxSrc = path.join(process.cwd(), 'public', 'mathjax');
  try {
    await copyDir(mathjaxSrc, mathjaxDst);
  } catch {
    // Export can still proceed without local MathJax assets.
  }

  const effectiveUpdated =
    timeline.items[item.frontmatter.id]?.effective_updated_at ??
    item.frontmatter.updated_at ??
    item.frontmatter.created_at ??
    getLatestGitTimestamp(item.filePath);
  const updated = formatTimestamp(effectiveUpdated, config.timezone);
  const isPost = item.frontmatter.type === 'post';
  const subtitle = isPost
    ? `${item.frontmatter.id} (${item.frontmatter.status ?? 'published'}) — Version: ${item.frontmatter.version} — Last updated: ${updated}`
    : `${item.frontmatter.id} — Last updated: ${updated}`;
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
    <main class="container stack">
      <header class="page-header detail-width">
        <span class="eyebrow">${isPost ? 'Post' : 'Snippet'}</span>
        <h1 class="page-title">${item.frontmatter.title}</h1>
        <p class="page-subtitle">${subtitle}</p>
      </header>
      ${
        isPost && item.frontmatter.summary
          ? `<p class="detail-width">${item.frontmatter.summary}</p>`
          : !isPost && item.frontmatter.notes
            ? `<p class="detail-width">${item.frontmatter.notes}</p>`
            : ''
      }
      <article class="detail-width markdown-body">${contentHtml}</article>
      <footer class="site-footer">
        <div class="container muted">${config.footer_text}</div>
      </footer>
    </main>
  </body>
</html>`;

  await fs.writeFile(htmlPath, html, 'utf8');
  return { htmlPath, exportDir };
}
