import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { inferTypeFromPath, validateFrontmatter, type ContentFrontmatter } from '../src/lib/content/schema';

const CONTENT_GLOB = ['content/posts/**/*.md', 'content/snippets/**/*.md'];

interface ContentFile {
  filePath: string;
  frontmatter: ContentFrontmatter;
  body: string;
  rawData: Record<string, unknown>;
}

interface CliArgs {
  command: string;
  flags: Map<string, string | boolean>;
}

function parseArgs(argv: string[]): CliArgs {
  const [command = 'help', ...rest] = argv;
  const flags = new Map<string, string | boolean>();

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = rest[i + 1];
    if (next && !next.startsWith('--')) {
      flags.set(key, next);
      i += 1;
    } else {
      flags.set(key, true);
    }
  }

  return { command, flags };
}

function getStringFlag(flags: Map<string, string | boolean>, key: string): string | null {
  const value = flags.get(key);
  return typeof value === 'string' ? value : null;
}

function getBoolFlag(flags: Map<string, string | boolean>, key: string): boolean {
  return flags.get(key) === true;
}

async function loadContent(): Promise<ContentFile[]> {
  const root = process.cwd();
  const files = (await fg(CONTENT_GLOB, { cwd: root, onlyFiles: true })).sort();
  const out: ContentFile[] = [];

  for (const filePath of files) {
    const absPath = path.join(root, filePath);
    const raw = await fs.readFile(absPath, 'utf8');
    const parsed = matter(raw);

    const expectedType = inferTypeFromPath(absPath);
    if (!expectedType) continue;

    const valid = validateFrontmatter(parsed.data, filePath, expectedType);
    if (!valid.value) {
      throw new Error(`Invalid frontmatter in ${filePath}: ${valid.errors.join('; ')}`);
    }

    out.push({
      filePath,
      frontmatter: valid.value,
      body: parsed.content,
      rawData: parsed.data as Record<string, unknown>
    });
  }

  return out;
}

function collectTagCounts(content: ContentFile[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const item of content) {
    for (const tag of item.frontmatter.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return counts;
}

function printTagList(counts: Map<string, number>): void {
  const tags = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [tag, count] of tags) {
    console.log(`${tag}\t${count}`);
  }
  console.log(`\nTotal unique tags: ${tags.length}`);
}

interface TreeNode {
  children: Map<string, TreeNode>;
  count: number;
}

function newNode(): TreeNode {
  return { children: new Map(), count: 0 };
}

function buildTagTree(counts: Map<string, number>): TreeNode {
  const root = newNode();

  for (const [tag, count] of counts.entries()) {
    const parts = tag.split('.');
    let node = root;
    for (const part of parts) {
      if (!node.children.has(part)) node.children.set(part, newNode());
      node = node.children.get(part)!;
    }
    node.count += count;
  }

  return root;
}

function printTree(node: TreeNode, prefix = ''): void {
  const entries = [...node.children.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  entries.forEach(([name, child], index) => {
    const isLast = index === entries.length - 1;
    const branch = isLast ? '└─' : '├─';
    console.log(`${prefix}${branch} ${name}${child.count > 0 ? ` (${child.count})` : ''}`);
    printTree(child, `${prefix}${isLast ? '   ' : '│  '}`);
  });
}

function canonicalTag(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  return dp[a.length][b.length];
}

function printDuplicates(counts: Map<string, number>, maxDistance: number): void {
  const tags = [...counts.keys()].sort((a, b) => a.localeCompare(b));

  const canonicalGroups = new Map<string, string[]>();
  for (const tag of tags) {
    const key = canonicalTag(tag);
    const group = canonicalGroups.get(key) ?? [];
    group.push(tag);
    canonicalGroups.set(key, group);
  }

  console.log('Potential canonical duplicates:');
  let canonicalFound = 0;
  for (const [key, group] of canonicalGroups.entries()) {
    if (group.length > 1) {
      canonicalFound += 1;
      console.log(`- ${key}: ${group.join(', ')}`);
    }
  }
  if (canonicalFound === 0) console.log('- none');

  console.log(`\nPotential near duplicates (distance <= ${maxDistance}):`);
  let fuzzyFound = 0;
  for (let i = 0; i < tags.length; i += 1) {
    for (let j = i + 1; j < tags.length; j += 1) {
      const a = tags[i];
      const b = tags[j];
      const d = levenshtein(a, b);
      if (d <= maxDistance) {
        fuzzyFound += 1;
        console.log(`- ${a} <-> ${b} (distance=${d})`);
      }
    }
  }
  if (fuzzyFound === 0) console.log('- none');
}

function mapTag(tag: string, from: string, to: string, subtree: boolean): string {
  if (subtree) {
    if (tag === from) return to;
    if (tag.startsWith(`${from}.`)) return `${to}${tag.slice(from.length)}`;
    return tag;
  }
  return tag === from ? to : tag;
}

async function applyTagRewrite(
  content: ContentFile[],
  from: string,
  to: string,
  subtree: boolean,
  apply: boolean
): Promise<void> {
  let changedFiles = 0;
  let changedTags = 0;

  for (const item of content) {
    const before = item.frontmatter.tags;
    const after = before.map((tag) => mapTag(tag, from, to, subtree));

    const fileChanged = after.some((tag, idx) => tag !== before[idx]);
    if (!fileChanged) continue;

    const deduped = Array.from(new Set(after));
    const replacedCount = before.filter((tag, idx) => deduped[idx] !== tag).length;

    changedFiles += 1;
    changedTags += replacedCount;

    console.log(`- ${item.filePath}`);
    console.log(`  ${before.join(', ')}`);
    console.log(`  -> ${deduped.join(', ')}`);

    if (apply) {
      const newData = { ...item.rawData, tags: deduped };
      const output = matter.stringify(item.body, newData);
      await fs.writeFile(path.join(process.cwd(), item.filePath), output, 'utf8');
    }
  }

  if (changedFiles === 0) {
    console.log('No matching tags found.');
    return;
  }

  console.log(`\n${apply ? 'Applied' : 'Previewed'} changes: ${changedFiles} files, ${changedTags} tag updates.`);
  if (!apply) {
    console.log('Dry-run mode. Re-run with --apply to write changes.');
  }
}

function printHelp(): void {
  console.log(`DEELAN tags CLI

Commands:
  list
  tree
  duplicates [--distance <n>]
  rename --from <tag|prefix> --to <tag|prefix> [--subtree] [--apply]
  merge --from <tag|prefix> --to <tag|prefix> [--subtree] [--apply]

Examples:
  npm run tags -- list
  npm run tags -- tree
  npm run tags -- duplicates --distance 2
  npm run tags -- rename --from data.etl --to data.pipeline --subtree
  npm run tags -- merge --from python.panda.groupby --to python.pandas.groupby --apply
`);
}

async function main(): Promise<void> {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  const content = await loadContent();
  const counts = collectTagCounts(content);

  if (command === 'list') {
    printTagList(counts);
    return;
  }

  if (command === 'tree') {
    const tree = buildTagTree(counts);
    printTree(tree);
    return;
  }

  if (command === 'duplicates') {
    const distanceRaw = getStringFlag(flags, 'distance');
    const distance = distanceRaw ? Number(distanceRaw) : 2;
    printDuplicates(counts, Number.isFinite(distance) ? distance : 2);
    return;
  }

  if (command === 'rename' || command === 'merge') {
    const from = getStringFlag(flags, 'from');
    const to = getStringFlag(flags, 'to');
    const apply = getBoolFlag(flags, 'apply');
    const subtree = getBoolFlag(flags, 'subtree') || (from?.endsWith('.*') ?? false);

    if (!from || !to) {
      throw new Error('rename/merge requires --from <tag> and --to <tag>');
    }

    const normalizedFrom = from.endsWith('.*') ? from.slice(0, -2) : from;
    const normalizedTo = to.endsWith('.*') ? to.slice(0, -2) : to;

    await applyTagRewrite(content, normalizedFrom, normalizedTo, subtree, apply);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(`tags command failed: ${message}`);
  process.exitCode = 1;
});
