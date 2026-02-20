import fs from 'node:fs/promises';
import path from 'node:path';

interface CliOptions {
  posts: number;
  snippets: number;
  seed: number;
}

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'content', 'posts', 'synthetic');
const SNIPPETS_DIR = path.join(ROOT, 'content', 'snippets', 'synthetic');

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    posts: 120,
    snippets: 180,
    seed: 20260221
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (!next) continue;
    if (token === '--posts') {
      opts.posts = Math.max(1, Number(next) || opts.posts);
      i += 1;
      continue;
    }
    if (token === '--snippets') {
      opts.snippets = Math.max(1, Number(next) || opts.snippets);
      i += 1;
      continue;
    }
    if (token === '--seed') {
      opts.seed = Number(next) || opts.seed;
      i += 1;
      continue;
    }
  }
  return opts;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOne<T>(rand: () => number, values: T[]): T {
  return values[Math.floor(rand() * values.length)] as T;
}

function pickManyUnique<T>(rand: () => number, values: T[], count: number): T[] {
  const copy = [...values];
  const out: T[] = [];
  while (copy.length > 0 && out.length < count) {
    const idx = Math.floor(rand() * copy.length);
    const [value] = copy.splice(idx, 1);
    if (value === undefined) continue;
    out.push(value);
  }
  return out;
}

function pad(num: number, width: number): string {
  return String(num).padStart(width, '0');
}

function makeTagPool(): string[] {
  const top = [
    'data',
    'infra',
    'ml',
    'platform',
    'ops',
    'biz',
    'research',
    'security',
    'stream',
    'batch',
    'governance',
    'notebook'
  ];

  const mid = ['ingest', 'model', 'storage', 'quality', 'perf', 'cost'];
  const leaf = ['a', 'b', 'c', 'd', 'e'];

  const out: string[] = [];
  for (const t of top) {
    out.push(t);
    for (const m of mid) {
      out.push(`${t}.${m}`);
      for (const l of leaf) {
        out.push(`${t}.${m}.${l}`);
      }
    }
  }
  return out;
}

function randomDateIso(rand: () => number): string {
  const start = Date.parse('2023-01-01T00:00:00.000Z');
  const end = Date.parse('2026-02-20T00:00:00.000Z');
  const value = start + Math.floor(rand() * (end - start));
  return new Date(value).toISOString();
}

function loremParagraph(rand: () => number): string {
  const chunks = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Integer nec odio praesent libero sed cursus ante dapibus diam.',
    'Sed nisi nulla quis sem at nibh elementum imperdiet.',
    'Duis sagittis ipsum praesent mauris fusce nec tellus sed augue semper porta.',
    'Mauris massa vestibulum lacinia arcu eget nulla class aptent taciti sociosqu ad litora torquent.',
    'Curabitur sodales ligula in libero sed dignissim lacinia nunc.'
  ];
  const count = 2 + Math.floor(rand() * 4);
  return pickManyUnique(rand, chunks, count).join(' ');
}

function buildPostBody(rand: () => number, idx: number, relatedIds: string[]): string {
  const long = idx % 10 === 0;
  const paragraphs = long ? 18 + Math.floor(rand() * 10) : 3 + Math.floor(rand() * 4);

  const blocks: string[] = [];
  blocks.push('## Context');
  blocks.push(loremParagraph(rand));
  blocks.push('');
  blocks.push('## Notes');

  for (let i = 0; i < paragraphs; i += 1) {
    blocks.push(loremParagraph(rand));
    if (long && i > 0 && i % 6 === 0) {
      blocks.push('');
      blocks.push('### Inline Example');
      blocks.push('```python');
      blocks.push('values = [1, 2, 3, 5, 8, 13]');
      blocks.push('print(sum(values))');
      blocks.push('```');
      blocks.push('');
    }
  }

  blocks.push('');
  blocks.push('## Relationships');
  blocks.push(`This item references ${relatedIds.length} related item(s) through frontmatter metadata.`);
  blocks.push('');
  blocks.push('$$');
  blocks.push('f(x) = \\sum_{i=1}^{n} x_i^2');
  blocks.push('$$');
  return blocks.join('\n');
}

function buildSnippetBody(rand: () => number, idx: number): string {
  const long = idx % 20 === 0;
  const lines: string[] = [];
  lines.push('## Snippet');
  lines.push(loremParagraph(rand));
  lines.push('');
  lines.push('```sql');
  lines.push('select key, max(updated_at) as latest_updated_at');
  lines.push('from synthetic_events');
  lines.push('group by key;');
  lines.push('```');
  if (long) {
    lines.push('');
    lines.push('```python');
    lines.push('import pandas as pd');
    lines.push("df = pd.read_parquet('synthetic.parquet')");
    lines.push("df.groupby('key').size().sort_values(ascending=False).head(20)");
    lines.push('```');
    lines.push('');
    lines.push(loremParagraph(rand));
  }
  return lines.join('\n');
}

function toFrontmatter(data: Record<string, string | string[] | undefined>): string {
  const lines: string[] = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${item}`);
      }
      continue;
    }
    lines.push(`${key}: ${value}`);
  }
  lines.push('---');
  return lines.join('\n');
}

async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const rand = mulberry32(options.seed);
  const tagPool = makeTagPool();

  await fs.rm(POSTS_DIR, { recursive: true, force: true });
  await fs.rm(SNIPPETS_DIR, { recursive: true, force: true });
  await fs.mkdir(POSTS_DIR, { recursive: true });
  await fs.mkdir(SNIPPETS_DIR, { recursive: true });

  const postSlugs = Array.from({ length: options.posts }, (_, i) => `synthetic-post-${pad(i + 1, 4)}`);
  const snippetSlugs = Array.from(
    { length: options.snippets },
    (_, i) => `synthetic-snippet-${pad(i + 1, 4)}`
  );
  const postIds = postSlugs.map((slug) => `post--${slug}`);
  const snippetIds = snippetSlugs.map((slug) => `snippet--${slug}`);
  const allIds = [...postIds, ...snippetIds];

  const statusOptions = ['draft', 'published', 'archived'];

  for (let i = 0; i < postSlugs.length; i += 1) {
    const slug = postSlugs[i]!;
    const filePath = path.join(POSTS_DIR, `${slug}.md`);
    const tagCount = 3 + Math.floor(rand() * 5);
    const tags = pickManyUnique(rand, tagPool, tagCount).sort((a, b) => a.localeCompare(b));
    const relatedCount = 1 + Math.floor(rand() * 6);
    const related = pickManyUnique(
      rand,
      allIds.filter((id) => id !== `post--${slug}`),
      relatedCount
    ).sort((a, b) => a.localeCompare(b));
    const createdAt = randomDateIso(rand);
    const updatedAt = randomDateIso(rand);

    const frontmatter = toFrontmatter({
      title: `"Synthetic Post ${pad(i + 1, 4)}"`,
      tags,
      version: `v1.${Math.floor(rand() * 10)}.${Math.floor(rand() * 20)}`,
      summary: `"Synthetic stress-test content for analytics and UI."`,
      notes: `"Generated automatically for testing."`,
      related_ids: related.length > 0 ? related : undefined,
      created_at: `"${createdAt}"`,
      updated_at: `"${updatedAt}"`,
      status: pickOne(rand, statusOptions)
    });

    const body = buildPostBody(rand, i + 1, related);
    await writeFile(filePath, `${frontmatter}\n\n${body}\n`);
  }

  for (let i = 0; i < snippetSlugs.length; i += 1) {
    const slug = snippetSlugs[i]!;
    const filePath = path.join(SNIPPETS_DIR, `${slug}.md`);
    const tagCount = 2 + Math.floor(rand() * 4);
    const tags = pickManyUnique(rand, tagPool, tagCount).sort((a, b) => a.localeCompare(b));
    const relatedCount = Math.floor(rand() * 5);
    const related = pickManyUnique(
      rand,
      allIds.filter((id) => id !== `snippet--${slug}`),
      relatedCount
    ).sort((a, b) => a.localeCompare(b));
    const createdAt = randomDateIso(rand);
    const updatedAt = randomDateIso(rand);

    const frontmatter = toFrontmatter({
      title: `"Synthetic Snippet ${pad(i + 1, 4)}"`,
      tags,
      summary: `"Synthetic snippet generated for stress testing."`,
      notes: `"Generated automatically for testing."`,
      related_ids: related.length > 0 ? related : undefined,
      created_at: `"${createdAt}"`,
      updated_at: `"${updatedAt}"`
    });

    const body = buildSnippetBody(rand, i + 1);
    await writeFile(filePath, `${frontmatter}\n\n${body}\n`);
  }

  console.log(
    `synthetic-generate complete: ${options.posts} posts and ${options.snippets} snippets in content/**/synthetic (seed=${options.seed}).`
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(`synthetic-generate failed: ${message}`);
  process.exitCode = 1;
});
