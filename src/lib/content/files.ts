import { getIncludedSubfolders as getIncludedSubfoldersFromArgs } from '../args';

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
