import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import {
  inferContentIdentity,
  validateFrontmatter,
  type ContentFrontmatter
} from '../src/lib/content/schema';
import { buildContentGlobs } from '../src/lib/content/files';
import { createLogger } from '../src/lib/logger';
import {
  getParsedBoolFlag,
  getParsedFlagValue,
  getParsedNumberFlag,
  hasHelpFlag,
  parseCliArgs
} from '../src/lib/args';

interface ContentFile {
  filePath: string;
  frontmatter: ContentFrontmatter;
  body: string;
  rawData: Record<string, unknown>;
}

const logger = createLogger('tags');

function writeStdout(text: string): void {
  process.stdout.write(`${text}\n`);
}

async function loadContent(): Promise<ContentFile[]> {
  const root = process.cwd();
  const files = (await fg(buildContentGlobs(), { cwd: root, onlyFiles: true })).sort();
  const out: ContentFile[] = [];

  for (const filePath of files) {
    const absPath = path.join(root, filePath);
    const raw = await fs.readFile(absPath, 'utf8');
    const parsed = matter(raw);

    const identity = inferContentIdentity(absPath);
    if (!identity) continue;
    if (!identity.validFileName) {
      logger.warn(`${filePath}: ${identity.warning ?? 'invalid filename'} (excluded)`);
      continue;
    }

    const valid = validateFrontmatter(parsed.data, filePath, identity.type, identity.id);
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
    writeStdout(`${tag}\t${count}`);
  }
  writeStdout(`\nTotal unique tags: ${tags.length}`);
}

function printTagStats(content: ContentFile[], counts: Map<string, number>): void {
  const totalItems = content.length;
  const totalTagAssignments = [...counts.values()].reduce((a, b) => a + b, 0);
  const avg = totalItems > 0 ? totalTagAssignments / totalItems : 0;

  const posts = content.filter((item) => item.frontmatter.type === 'post').length;
  const snippets = content.filter((item) => item.frontmatter.type === 'snippet').length;

  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10);

  writeStdout(`Items: ${totalItems} (posts=${posts}, snippets=${snippets})`);
  writeStdout(`Unique tags: ${counts.size}`);
  writeStdout(`Tag assignments: ${totalTagAssignments}`);
  writeStdout(`Average tags/item: ${avg.toFixed(2)}`);
  writeStdout('\nTop tags:');
  for (const [tag, count] of top) {
    writeStdout(`- ${tag}: ${count}`);
  }
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
    writeStdout(`${prefix}${branch} ${name}${child.count > 0 ? ` (${child.count})` : ''}`);
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

  writeStdout('Potential canonical duplicates:');
  let canonicalFound = 0;
  for (const [key, group] of canonicalGroups.entries()) {
    if (group.length > 1) {
      canonicalFound += 1;
      writeStdout(`- ${key}: ${group.join(', ')}`);
    }
  }
  if (canonicalFound === 0) writeStdout('- none');

  writeStdout(`\nPotential near duplicates (distance <= ${maxDistance}):`);
  let fuzzyFound = 0;
  for (let i = 0; i < tags.length; i += 1) {
    for (let j = i + 1; j < tags.length; j += 1) {
      const a = tags[i];
      const b = tags[j];
      const d = levenshtein(a, b);
      if (d <= maxDistance) {
        fuzzyFound += 1;
        writeStdout(`- ${a} <-> ${b} (distance=${d})`);
      }
    }
  }
  if (fuzzyFound === 0) writeStdout('- none');
}

function mapTag(tag: string, from: string, to: string, subtree: boolean): string {
  if (subtree) {
    if (tag === from) return to;
    if (tag.startsWith(`${from}.`)) return `${to}${tag.slice(from.length)}`;
    return tag;
  }
  return tag === from ? to : tag;
}

function impactedTagSet(allTags: string[], from: string, subtree: boolean): string[] {
  return allTags.filter((tag) => (subtree ? tag === from || tag.startsWith(`${from}.`) : tag === from));
}

async function applyTagRewrite(
  content: ContentFile[],
  from: string,
  to: string,
  subtree: boolean,
  apply: boolean,
  confirmSubtree: boolean
): Promise<void> {
  const allDistinctTags = Array.from(new Set(content.flatMap((item) => item.frontmatter.tags))).sort();
  const impacted = impactedTagSet(allDistinctTags, from, subtree);

  if (subtree) {
    writeStdout(`Subtree mode enabled for prefix: ${from}`);
    writeStdout(`Impacted distinct tags (${impacted.length}):`);
    for (const tag of impacted) {
      writeStdout(`- ${tag}`);
    }

    if (apply && !confirmSubtree) {
      throw new Error('Refusing subtree write without --confirm-subtree. Run dry-run first, then re-run with --apply --confirm-subtree.');
    }
  }

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

    writeStdout(`- ${item.filePath}`);
    writeStdout(`  ${before.join(', ')}`);
    writeStdout(`  -> ${deduped.join(', ')}`);

    if (apply) {
      const newData = { ...item.rawData, tags: deduped };
      const output = matter.stringify(item.body, newData);
      await fs.writeFile(path.join(process.cwd(), item.filePath), output, 'utf8');
    }
  }

  if (changedFiles === 0) {
    writeStdout('No matching tags found.');
    return;
  }

  writeStdout(`\n${apply ? 'Applied' : 'Previewed'} changes: ${changedFiles} files, ${changedTags} tag updates.`);
  if (!apply) {
    writeStdout('Dry-run mode. Re-run with --apply to write changes.');
  }
}

async function generateWordCloud(counts: Map<string, number>, outPath: string): Promise<void> {
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const max = entries.length > 0 ? entries[0][1] : 1;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>DEELAN Tag Word Cloud</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 2rem; }
      .cloud { display: flex; flex-wrap: wrap; gap: 0.7rem; line-height: 1.2; }
      .tag { color: #0b6e4f; }
      .muted { color: #666; margin-bottom: 1rem; }
    </style>
  </head>
  <body>
    <h1>Tag Word Cloud</h1>
    <p class="muted">Generated from ${entries.length} unique tag(s).</p>
    <div class="cloud">
      ${entries
        .map(([tag, count]) => {
          const weight = 0.85 + (count / max) * 1.9;
          return `<span class="tag" style="font-size:${weight.toFixed(2)}rem" title="${count}">${tag}</span>`;
        })
        .join('\n')}
    </div>
  </body>
</html>`;

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, html, 'utf8');
  logger.info(`Word cloud written: ${outPath}`);
}

function printHelp(): void {
  writeStdout(`DEELAN tags CLI

Commands:
  list
  stats
  tree
  duplicates [--distance <n>]
  rename --from <tag|prefix> --to <tag|prefix> [--subtree] [--apply] [--confirm-subtree]
  merge --from <tag|prefix> --to <tag|prefix> [--subtree] [--apply] [--confirm-subtree]
  wordcloud [--out <path>]

Global options:
  --include-subfolder <name>   Repeatable. Include content/posts/<name>/*.md and content/snippets/<name>/*.md.

Examples:
  npm run tags -- list
  npm run tags -- list --include-subfolder synthetic
  npm run tags -- stats
  npm run tags -- tree
  npm run tags -- duplicates --distance 2
  npm run tags -- rename --from data.etl --to data.pipeline --subtree
  npm run tags -- rename --from data.etl --to data.pipeline --subtree --apply --confirm-subtree
  npm run tags -- wordcloud --out ./exports/tag-wordcloud.html
`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const parsed = parseCliArgs(argv);
  const command = parsed.positionals[0] ?? 'help';
  if (command === 'help' || hasHelpFlag(argv)) {
    printHelp();
    return;
  }

  const content = await loadContent();
  const counts = collectTagCounts(content);

  if (command === 'list') {
    printTagList(counts);
    return;
  }

  if (command === 'stats') {
    printTagStats(content, counts);
    return;
  }

  if (command === 'tree') {
    const tree = buildTagTree(counts);
    printTree(tree);
    return;
  }

  if (command === 'duplicates') {
    printDuplicates(counts, getParsedNumberFlag(parsed.flags, 'distance') ?? 2);
    return;
  }

  if (command === 'wordcloud') {
    const outPath =
      getParsedFlagValue(parsed.flags, 'out') ?? path.join(process.cwd(), 'exports', 'tag-wordcloud.html');
    await generateWordCloud(counts, outPath);
    return;
  }

  if (command === 'rename' || command === 'merge') {
    const from = getParsedFlagValue(parsed.flags, 'from');
    const to = getParsedFlagValue(parsed.flags, 'to');
    const apply = getParsedBoolFlag(parsed.flags, 'apply');
    const confirmSubtree = getParsedBoolFlag(parsed.flags, 'confirm-subtree');
    const subtree = getParsedBoolFlag(parsed.flags, 'subtree') || (from?.endsWith('.*') ?? false);

    if (!from || !to) {
      throw new Error('rename/merge requires --from <tag> and --to <tag>');
    }

    const normalizedFrom = from.endsWith('.*') ? from.slice(0, -2) : from;
    const normalizedTo = to.endsWith('.*') ? to.slice(0, -2) : to;

    await applyTagRewrite(content, normalizedFrom, normalizedTo, subtree, apply, confirmSubtree);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  logger.error(`command failed: ${message}`);
  process.exitCode = 1;
});
