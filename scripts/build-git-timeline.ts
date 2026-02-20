import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import fg from 'fast-glob';
import matter from 'gray-matter';
import {
  inferContentIdentity,
  validateFrontmatter,
  type ContentType,
  type ContentFrontmatter
} from '../src/lib/content/schema';
import { buildContentGlobs } from '../src/lib/content/files';

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, '.generated', 'timeline', 'versions.json');

interface TimelineEntry {
  commit: string;
  date: string;
  author: string;
  message: string;
}

interface TimelineItem {
  id: string;
  type: ContentType;
  path: string;
  version: string | null;
  created_at_override: string | null;
  updated_at_override: string | null;
  created_at_git: string | null;
  updated_at_git: string | null;
  effective_created_at: string | null;
  effective_updated_at: string | null;
  commit_count: number;
  timeline: TimelineEntry[];
}

function toPosixPath(input: string): string {
  return input.split(path.sep).join('/');
}

function getGitHistory(filePath: string): TimelineEntry[] {
  try {
    const output = execFileSync(
      'git',
      ['log', '--follow', '--format=%H\t%aI\t%an\t%s', '--', filePath],
      {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      }
    ).trim();

    if (!output) return [];

    return output
      .split('\n')
      .map((line) => {
        const [commit, date, author, ...messageParts] = line.split('\t');
        return {
          commit,
          date,
          author,
          message: messageParts.join('\t')
        };
      })
      .filter((entry) => entry.commit && entry.date);
  } catch {
    return [];
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function buildTimelineItem(
  filePath: string,
  frontmatter: ContentFrontmatter,
  history: TimelineEntry[]
): TimelineItem {
  const latest = history[0] ?? null;
  const earliest = history.length > 0 ? history[history.length - 1] : null;

  const createdAtGit = earliest?.date ?? null;
  const updatedAtGit = latest?.date ?? null;

  return {
    id: frontmatter.id,
    type: frontmatter.type,
    path: toPosixPath(filePath),
    version: frontmatter.type === 'post' ? frontmatter.version : null,
    created_at_override: frontmatter.created_at ?? null,
    updated_at_override: frontmatter.updated_at ?? null,
    created_at_git: createdAtGit,
    updated_at_git: updatedAtGit,
    effective_created_at: frontmatter.created_at ?? createdAtGit,
    effective_updated_at: frontmatter.updated_at ?? updatedAtGit,
    commit_count: history.length,
    timeline: history
  };
}

async function main(): Promise<void> {
  const files = await fg(buildContentGlobs(), { cwd: ROOT, onlyFiles: true });
  const issues: string[] = [];
  const warnings: string[] = [];
  const itemsById: Record<string, TimelineItem> = {};

  for (const filePath of files) {
    const absPath = path.join(ROOT, filePath);
    const raw = await fs.readFile(absPath, 'utf8');

    let parsed: matter.GrayMatterFile<string>;
    try {
      parsed = matter(raw);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      issues.push(`${filePath}: unable to parse frontmatter (${message})`);
      continue;
    }

    const identity = inferContentIdentity(absPath);
    if (!identity) {
      issues.push(`${filePath}: unable to infer content type from path`);
      continue;
    }

    if (!identity.validFileName) {
      warnings.push(`${filePath}: ${identity.warning ?? 'invalid filename'} (excluded)`);
      continue;
    }

    const validation = validateFrontmatter(parsed.data, filePath, identity.type, identity.id);
    if (!validation.value) {
      for (const err of validation.errors) {
        issues.push(`${filePath}: ${err}`);
      }
      continue;
    }

    const frontmatter = validation.value;
    if (itemsById[frontmatter.id]) {
      issues.push(`${filePath}: duplicate id ${frontmatter.id} in timeline generation`);
      continue;
    }

    const history = getGitHistory(filePath);
    itemsById[frontmatter.id] = buildTimelineItem(filePath, frontmatter, history);
  }

  for (const warning of warnings) {
    console.warn(`build-git-timeline warning: ${warning}`);
  }

  if (issues.length > 0) {
    console.error('build-git-timeline failed with validation issues:');
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  const out = {
    generated_at: new Date().toISOString(),
    total: Object.keys(itemsById).length,
    items: itemsById
  };

  await writeJson(OUTPUT, out);
  console.log(`build-git-timeline complete: ${out.total} items.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(`build-git-timeline crashed: ${message}`);
  process.exitCode = 1;
});
