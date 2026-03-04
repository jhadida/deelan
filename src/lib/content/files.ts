import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { getIncludedSubfolders as getIncludedSubfoldersFromArgs } from '../args';
import { inferContentIdentity, type ContentIdentity } from './schema';

export const CONTENT_GLOB = ['content/posts/*.md', 'content/snippets/*.md'] as const;

export function isTopLevelContentMarkdownPath(filePath: string): boolean {
  const normalized = filePath.replaceAll('\\', '/');
  return /^content\/(posts|snippets)\/[^/]+\.md$/u.test(normalized);
}

export function getIncludedSubfolders(argv: string[] = process.argv.slice(2)): string[] {
  return getIncludedSubfoldersFromArgs(argv);
}

export function buildContentGlobs(argv: string[] = process.argv.slice(2)): string[] {
  const included = getIncludedSubfolders(argv);
  if (included.length === 0) return [...CONTENT_GLOB];

  const globs = new Set<string>(CONTENT_GLOB);
  for (const subfolder of included) {
    globs.add(`content/posts/${subfolder}/*.md`);
    globs.add(`content/snippets/${subfolder}/*.md`);
  }
  return Array.from(globs).sort((a, b) => a.localeCompare(b));
}

export interface RawContentFile {
  filePath: string;
  identity: ContentIdentity | null;
  data: Record<string, unknown>;
  content: string;
  parseError?: string;
}

export async function loadRawContent(argv?: string[]): Promise<RawContentFile[]> {
  const root = process.cwd();
  const files = (await fg(buildContentGlobs(argv), { cwd: root, onlyFiles: true })).sort();
  const out: RawContentFile[] = [];

  for (const filePath of files) {
    const absPath = path.join(root, filePath);
    const raw = await fs.readFile(absPath, 'utf8');
    const identity = inferContentIdentity(absPath);
    try {
      const parsed = matter(raw);
      out.push({ filePath, identity, data: parsed.data as Record<string, unknown>, content: parsed.content });
    } catch (err) {
      out.push({ filePath, identity, data: {}, content: '', parseError: err instanceof Error ? err.message : String(err) });
    }
  }

  return out;
}
