import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { renderMarkdown } from '../src/lib/content/render-markdown';
import { inferContentIdentity, validateFrontmatter, type ValidatedContent } from '../src/lib/content/schema';
import { buildContentGlobs } from '../src/lib/content/files';
import { exportHtml } from '../src/lib/export/html';
import { exportPdf } from '../src/lib/export/pdf';
import type { ExportItem } from '../src/lib/export/types';
import type { SiteTheme } from '../src/lib/site-config';

type ExportFormat = 'html' | 'pdf';

interface CliOptions {
  id: string;
  format: ExportFormat;
  outDir: string;
  theme: SiteTheme | null;
  pdfScale: number;
  help: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  if (argv.includes('--help') || argv.includes('-h') || argv.length === 0) {
    return {
      id: '',
      format: 'html',
      outDir: path.join(process.cwd(), 'exports'),
      theme: null,
      pdfScale: 1,
      help: true
    };
  }

  const args = new Map<string, string>();

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (value && !value.startsWith('--')) {
      args.set(key, value);
      i += 1;
    } else {
      args.set(key, 'true');
    }
  }

  const id = args.get('id');
  const format = (args.get('format') ?? 'html') as ExportFormat;
  const outDir = args.get('out') ?? path.join(process.cwd(), 'exports');
  const themeRaw = args.get('theme');
  const pdfScaleRaw = args.get('pdf-scale');

  if (!id) {
    throw new Error('Missing required argument: --id <content-id>');
  }

  if (format !== 'html' && format !== 'pdf') {
    throw new Error('Invalid format. Use --format html or --format pdf');
  }

  if (themeRaw && themeRaw !== 'light' && themeRaw !== 'dark') {
    throw new Error('Invalid theme. Use --theme light or --theme dark');
  }

  const pdfScale = pdfScaleRaw ? Number(pdfScaleRaw) : 1;
  if (!Number.isFinite(pdfScale) || pdfScale <= 0 || pdfScale > 2) {
    throw new Error('Invalid pdf scale. Use --pdf-scale <number> where number is > 0 and <= 2.');
  }

  return {
    id,
    format,
    outDir,
    theme: (themeRaw as SiteTheme | undefined) ?? null,
    pdfScale,
    help: false
  };
}

function printHelp(): void {
  console.log(`DEELAN export CLI

Usage:
  npm run export -- --id <content-id> [--format html|pdf] [--out <dir>] [--theme light|dark] [--pdf-scale <n>] [--include-subfolder <name>]

Arguments:
  --id       Required. Generated ID (e.g. post--de-partitioning-primer)
  --format   Optional. html (default) or pdf
  --out      Optional. Output directory (default: ./exports)
  --theme    Optional. light or dark. Overrides default_theme in deelan.config.yml
  --pdf-scale Optional. PDF scaling factor (>0 and <=2). Default: 1. Example: 0.95
  --include-subfolder Optional, repeatable. Include content/posts/<name>/*.md and content/snippets/<name>/*.md in discovery.

Examples:
  npm run export -- --id post--de-partitioning-primer
  npm run export -- --id snippet--pandas-groupby-snippet --format html --theme light
  npm run export -- --id post--de-partitioning-primer --format pdf --out ./exports --pdf-scale 0.95
  npm run export -- --id post--synthetic-post-0001 --include-subfolder synthetic
`);
}

async function loadValidatedItems(): Promise<ValidatedContent[]> {
  const root = process.cwd();
  const files = (await fg(buildContentGlobs(), { cwd: root, onlyFiles: true })).sort();
  const items: ValidatedContent[] = [];

  for (const filePath of files) {
    const absPath = path.join(root, filePath);
    const raw = await fs.readFile(absPath, 'utf8');
    const parsed = matter(raw);

    const identity = inferContentIdentity(absPath);
    if (!identity) continue;
    if (!identity.validFileName) continue;

    const result = validateFrontmatter(parsed.data, filePath, identity.type, identity.id);
    if (!result.value) {
      const details = result.errors.join('; ');
      throw new Error(`Invalid frontmatter in ${filePath}: ${details}`);
    }

    items.push({
      filePath,
      body: parsed.content,
      frontmatter: result.value
    });
  }

  return items;
}

function findById(items: ValidatedContent[], id: string): ExportItem {
  const matches = items.filter((item) => item.frontmatter.id === id);

  if (matches.length === 0) {
    throw new Error(`No content item found with id: ${id}`);
  }

  if (matches.length > 1) {
    throw new Error(`Duplicate content id detected: ${id}`);
  }

  return matches[0];
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  await fs.mkdir(options.outDir, { recursive: true });

  const items = await loadValidatedItems();
  const item = findById(items, options.id);
  const renderedHtml = await renderMarkdown(item.body);

  const htmlResult = await exportHtml({
    item,
    renderedHtml,
    outDir: options.outDir,
    theme: options.theme ?? undefined
  });

  if (options.format === 'html') {
    console.log(`Exported HTML: ${htmlResult.htmlPath}`);
    console.log(`Exported folder: ${htmlResult.exportDir}`);
    return;
  }

  const pdfPath = await exportPdf(htmlResult.htmlPath, options.outDir, { scale: options.pdfScale });
  console.log(`Exported PDF: ${pdfPath}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(`export failed: ${message}`);
  process.exitCode = 1;
});
