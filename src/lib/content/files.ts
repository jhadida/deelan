export const CONTENT_GLOB = ['content/posts/*.md', 'content/snippets/*.md'] as const;

export function isTopLevelContentMarkdownPath(filePath: string): boolean {
  const normalized = filePath.replaceAll('\\', '/');
  return /^content\/(posts|snippets)\/[^/]+\.md$/u.test(normalized);
}

function normalizeSubfolder(input: string): string | null {
  const normalized = input.replaceAll('\\', '/').trim().replace(/^\/+|\/+$/g, '');
  if (!normalized) return null;
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.some((part) => part === '.' || part === '..')) return null;
  return parts.join('/');
}

export function getIncludedSubfolders(argv: string[] = process.argv.slice(2)): string[] {
  const selected = new Set<string>();

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i] ?? '';
    if (token === '--include-subfolder') {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        const normalized = normalizeSubfolder(next);
        if (normalized) selected.add(normalized);
        i += 1;
      }
      continue;
    }
    if (token.startsWith('--include-subfolder=')) {
      const value = token.slice('--include-subfolder='.length);
      const normalized = normalizeSubfolder(value);
      if (normalized) selected.add(normalized);
    }
  }

  const envRaw = process.env.DEELAN_INCLUDE_SUBFOLDERS ?? '';
  for (const value of envRaw.split(',')) {
    const normalized = normalizeSubfolder(value);
    if (normalized) selected.add(normalized);
  }

  return Array.from(selected).sort((a, b) => a.localeCompare(b));
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
