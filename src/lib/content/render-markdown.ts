import { Marked } from 'marked';
import type { Tokens } from 'marked';
import { markedHighlight } from 'marked-highlight';
import { codeToHtml } from 'shiki';
import path from 'node:path';
import { getSiteConfig } from '../site-config';
import { replaceInternalLinks } from './internal-links';
import { isLocalAssetReference, toPosixPath } from '../util';

let initialized = false;
let shikiLightTheme = 'github-light';
let shikiDarkTheme = 'github-dark';
let parser: Marked | null = null;
let headingSlugger = createSlugger();

interface TocEntry {
  depth: number;
  text: string;
  id: string;
}

interface FootnoteState {
  markdown: string;
  definitions: Map<string, string>;
  order: string[];
}

interface RenderMarkdownOptions {
  sourceFilePath?: string;
}

function normalizeLang(lang: string | undefined): string {
  const candidate = (lang ?? 'text').trim();
  if (!candidate) return 'text';
  return candidate;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function slugify(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized || 'section';
}

function createSlugger(): (input: string) => string {
  const counts = new Map<string, number>();
  return (input: string) => {
    const base = slugify(input);
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen}`;
  };
}

function normalizeFigureWidth(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  return /^\d+(?:\.\d+)?(?:mm|cm|in|%)$/.test(value) ? value : null;
}

function transformFigureSyntax(markdown: string): string {
  return markdown.replace(
    /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\{width\s*=\s*([^}]+)\}\s*$/gm,
    (_full, altRaw: string, srcRaw: string, titleRaw: string | undefined, widthRaw: string) => {
      const width = normalizeFigureWidth(widthRaw);
      if (!width) return _full;
      const src = srcRaw.trim();
      const alt = altRaw.trim();
      const caption = (titleRaw ?? altRaw).trim();
      const figcaption = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : '';
      return `<figure class="md-figure" style="--md-figure-width: ${width};"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" />${figcaption}</figure>`;
    }
  );
}

function transformMermaidFences(markdown: string): string {
  return markdown.replaceAll(/```mermaid\s*\n([\s\S]*?)```/g, (_full, source: string) => {
    return `<pre class="mermaid">${escapeHtml(source.trim())}</pre>`;
  });
}

function extractFootnotes(markdown: string): FootnoteState {
  const lines = markdown.split('\n');
  const definitions = new Map<string, string>();
  const body: string[] = [];
  const order: string[] = [];
  const orderSet = new Set<string>();

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const start = line.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
    if (!start) {
      body.push(line);
      continue;
    }

    const id = start[1].trim();
    const chunks = [start[2]];
    while (i + 1 < lines.length && /^(?:\s{2,}|\t)/.test(lines[i + 1])) {
      i += 1;
      chunks.push(lines[i].replace(/^(?:\s{2,}|\t)/, ''));
    }
    definitions.set(id, chunks.join('\n').trim());
  }

  const markdownWithRefs = body.join('\n').replaceAll(/\[\^([^\]]+)\]/g, (_full, rawId: string) => {
    const id = rawId.trim();
    if (!definitions.has(id)) return _full;
    if (!orderSet.has(id)) {
      orderSet.add(id);
      order.push(id);
    }
    const index = order.indexOf(id) + 1;
    return `<sup class="md-footnote-ref" id="fnref-${id}"><a href="#fn-${id}">${index}</a></sup>`;
  });

  return {
    markdown: markdownWithRefs,
    definitions,
    order
  };
}

function collectHeadings(tokens: Tokens.Generic[], entries: TocEntry[], nextId: (value: string) => string): void {
  for (const token of tokens) {
    if (token.type === 'heading') {
      const heading = token as Tokens.Heading;
      entries.push({
        depth: heading.depth,
        text: heading.text,
        id: nextId(heading.text)
      });
      continue;
    }

    if ('tokens' in token && Array.isArray(token.tokens)) {
      collectHeadings(token.tokens as Tokens.Generic[], entries, nextId);
    }
  }
}

function buildTocHtml(entries: TocEntry[]): string {
  const filtered = entries.filter((entry) => entry.depth >= 2 && entry.depth <= 3);
  if (filtered.length === 0) return '';

  const links = filtered
    .map((entry) => {
      const level = entry.depth === 2 ? 'md-toc-level-2' : 'md-toc-level-3';
      return `<li class="${level}"><a href="#${entry.id}">${escapeHtml(entry.text)}</a></li>`;
    })
    .join('');

  return `<nav class="md-toc" aria-label="Table of contents"><p class="md-toc-title">Contents</p><ul>${links}</ul></nav>`;
}

function injectToc(html: string, tocHtml: string, hasExplicitPlaceholder: boolean): string {
  if (!tocHtml) return html;
  const placeholderRegex = /<p>\s*(?:\[\[toc\]\]|\[toc\])\s*<\/p>/i;
  if (hasExplicitPlaceholder || placeholderRegex.test(html)) {
    return html.replace(placeholderRegex, tocHtml);
  }
  return `${tocHtml}\n${html}`;
}

function renderFootnotesHtml(state: FootnoteState): string {
  if (state.order.length === 0) return '';

  const items = state.order
    .map((id) => {
      const text = state.definitions.get(id) ?? '';
      return `<li id="fn-${id}">${escapeHtml(text)} <a href="#fnref-${id}" class="md-footnote-backref" aria-label="Back to reference">↩</a></li>`;
    })
    .join('');

  return `<section class="md-footnotes" aria-label="Footnotes"><hr /><ol>${items}</ol></section>`;
}

function transformAdmonitions(html: string): string {
  const supported = new Set(['note', 'tip', 'warning', 'danger', 'caution']);
  const iconByType: Record<string, string> = {
    note: 'ℹ',
    tip: '✓',
    warning: '⚠',
    danger: '⛔',
    caution: '⚠'
  };

  return html.replaceAll(/<blockquote>([\s\S]*?)<\/blockquote>/g, (full, inner: string) => {
    const firstParagraph = inner.match(/^\s*<p>([\s\S]*?)<\/p>/);
    if (!firstParagraph) return full;
    const paragraphContent = firstParagraph[1];
    const lines = paragraphContent.split('\n');
    const head = lines[0]?.match(/^\[([!?])([A-Z]+)\]\s*(.*)$/i);
    if (!head) return full;

    const mode = head[1] === '?' ? 'collapsible' : 'static';
    const requestedType = head[2].toLowerCase();
    const type = supported.has(requestedType) ? requestedType : 'note';
    const explicitTitle = head[3].trim();
    const bodyFirstParagraph = lines.slice(1).join('\n').trim();
    const defaultTitle = type.charAt(0).toUpperCase() + type.slice(1);
    const title = explicitTitle || defaultTitle;
    const icon = iconByType[type] ?? iconByType.note;
    const bodyParagraph =
      bodyFirstParagraph.length > 0 ? `<p>${bodyFirstParagraph}</p>` : '';
    const restInner = inner.replace(firstParagraph[0], bodyParagraph);
    const titleHtml = `<span class="md-admonition-icon" aria-hidden="true">${icon}</span><span>${escapeHtml(title)}</span>`;

    if (mode === 'collapsible') {
      return `<details class="md-admonition md-admonition-${type}"><summary class="md-admonition-title">${titleHtml}</summary>${restInner}</details>`;
    }

    return `<aside class="md-admonition md-admonition-${type}"><p class="md-admonition-title">${titleHtml}</p>${restInner}</aside>`;
  });
}

function resolveContentAssetUrl(ref: string, sourceFilePath: string): string | null {
  if (!isLocalAssetReference(ref)) return null;
  const normalizedRef = ref.split('?')[0]?.split('#')[0] ?? ref;
  const sourceAbs = path.isAbsolute(sourceFilePath)
    ? sourceFilePath
    : path.resolve(process.cwd(), sourceFilePath);
  const candidate = path.resolve(path.dirname(sourceAbs), normalizedRef);
  const contentRoot = path.resolve(process.cwd(), 'content');
  const rel = path.relative(contentRoot, candidate);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  const relPosix = toPosixPath(rel);

  const scoped = relPosix.match(/^(posts|snippets)\/assets\/(.+)$/);
  if (scoped) {
    return `/content-assets/${scoped[1]}/${scoped[2]}`;
  }

  const shared = relPosix.match(/^assets\/(.+)$/);
  if (shared) {
    return `/content-assets/shared/${shared[1]}`;
  }

  return null;
}

function rewriteLocalAssetUrls(html: string, sourceFilePath?: string): string {
  if (!sourceFilePath) return html;

  let out = html;
  const srcRegex = /(<(?:img|source)\b[^>]*\bsrc=")([^"]+)(")/g;
  out = out.replace(srcRegex, (_full, pre: string, value: string, post: string) => {
    const next = resolveContentAssetUrl(value, sourceFilePath);
    return `${pre}${next ?? value}${post}`;
  });

  const hrefRegex = /(<a\b[^>]*\bhref=")([^"]+)(")/g;
  out = out.replace(hrefRegex, (_full, pre: string, value: string, post: string) => {
    const next = resolveContentAssetUrl(value, sourceFilePath);
    return `${pre}${next ?? value}${post}`;
  });

  return out;
}

function unwrapNestedShiki(input: string): string {
  return input.replace(
    /<pre><code class="language-[^"]*">([\s\S]*?<pre class="shiki[\s\S]*?<\/pre>[\s\S]*?)<\/code><\/pre>/g,
    '$1'
  );
}

export async function renderMarkdown(markdown: string, options: RenderMarkdownOptions = {}): Promise<string> {
  await ensureParser();

  const mdWithLinks = replaceInternalLinks(markdown);
  const mdWithFigures = transformFigureSyntax(mdWithLinks);
  const mdWithMermaid = transformMermaidFences(mdWithFigures);
  const explicitToc = /\[\[(?:toc)\]\]|\[(?:toc)\]/i.test(mdWithMermaid);
  const footnotes = extractFootnotes(mdWithMermaid);

  const tocId = createSlugger();
  const headings: TocEntry[] = [];
  const tokens = parser!.lexer(footnotes.markdown) as unknown as Tokens.Generic[];
  collectHeadings(tokens, headings, tocId);
  const tocHtml = buildTocHtml(headings);

  headingSlugger = createSlugger();
  const out = await parser!.parse(footnotes.markdown, { async: true });
  const html = typeof out === 'string' ? out : String(out);
  const withToc = injectToc(html, tocHtml, explicitToc);
  const withFootnotes = withToc + renderFootnotesHtml(footnotes);
  const withAdmonitions = transformAdmonitions(withFootnotes);
  const withAssets = rewriteLocalAssetUrls(withAdmonitions, options.sourceFilePath);
  return unwrapNestedShiki(withAssets);
}

export async function renderInlineMarkdown(markdown: string): Promise<string> {
  await ensureParser();
  const out = await parser!.parseInline(replaceInternalLinks(markdown), { async: true });
  return typeof out === 'string' ? out : String(out);
}

async function ensureParser(): Promise<void> {
  if (initialized) return;

  const config = await getSiteConfig();
  shikiLightTheme = config.code_theme_light;
  shikiDarkTheme = config.code_theme_dark;
  parser = new Marked({ gfm: true, breaks: false });
  parser.use(
    markedHighlight({
      async: true,
      highlight: async (code, lang) => {
        const language = normalizeLang(lang);
        try {
          return await codeToHtml(code, {
            lang: language,
            themes: {
              light: shikiLightTheme,
              dark: shikiDarkTheme
            },
            defaultColor: 'light'
          });
        } catch {
          return await codeToHtml(code, {
            lang: 'text',
            themes: {
              light: 'github-light',
              dark: 'github-dark'
            },
            defaultColor: 'light'
          });
        }
      }
    }),
    {
      renderer: {
        heading(token) {
          const id = headingSlugger(token.text);
          const text = this.parser.parseInline(token.tokens);
          return `<h${token.depth} id="${id}">${text}</h${token.depth}>`;
        }
      }
    });
  initialized = true;
}
