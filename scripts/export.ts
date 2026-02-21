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
import { createLogger } from '../src/lib/logger';
import {
  getParsedFlagValue,
  hasHelpFlag,
  parseCliArgs
} from '../src/lib/args';

type ExportFormat = 'html' | 'pdf';

interface CliOptions {
  id: string;
  format: ExportFormat;
  outDir: string;
  theme: SiteTheme | null;
  pdfScale: number;
  help: boolean;
}

const logger = createLogger('export');

function writeStdout(text: string): void {
  process.stdout.write(`${text}\n`);
}

function parseArgs(argv: string[]): CliOptions {
  if (hasHelpFlag(argv) || argv.length === 0) {
    return {
      id: '',
      format: 'html',
      outDir: path.join(process.cwd(), 'exports'),
      theme: null,
      pdfScale: 1,
      help: true
    };
  }

  const parsed = parseCliArgs(argv);
  const id = getParsedFlagValue(parsed.flags, 'id');
  const format = (getParsedFlagValue(parsed.flags, 'format') ?? 'html') as ExportFormat;
  const outDir = getParsedFlagValue(parsed.flags, 'out') ?? path.join(process.cwd(), 'exports');
  const themeRaw = getParsedFlagValue(parsed.flags, 'theme');
  const pdfScaleRaw = getParsedFlagValue(parsed.flags, 'pdf-scale');

  if (!id) {
    throw new Error('Missing required argument: --id <content-id>');
  }

  if (format !== 'html' && format !== 'pdf') {
    throw new Error('Invalid format. Use --format html or --format pdf');
  }

  if (themeRaw && themeRaw !== 'light' && themeRaw !== 'dark') {
    throw new Error('Invalid theme. Use --theme light or --theme dark');
  }

  const pdfScale = pdfScaleRaw === null ? 1 : Number(pdfScaleRaw);
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
  writeStdout(`Deelan export CLI

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
    logger.info(`Exported HTML: ${htmlResult.htmlPath}`);
    logger.info(`Exported folder: ${htmlResult.exportDir}`);
    return;
  }

  const pdfPath = await exportPdf(htmlResult.htmlPath, options.outDir, { scale: options.pdfScale });
  logger.info(`Exported PDF: ${pdfPath}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  logger.error(`failed: ${message}`);
  process.exitCode = 1;
});
