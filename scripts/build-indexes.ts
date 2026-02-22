import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { ancestors } from '../src/lib/tags/hierarchy';
import {
  inferContentIdentity,
  validateFrontmatter,
  type ContentType,
  type ContentFrontmatter
} from '../src/lib/content/schema';
import { buildContentGlobs } from '../src/lib/content/files';
import { createLogger } from '../src/lib/logger';
import { toPosixPath, uniqueSorted, writeJsonFile } from '../src/lib/util';

const ROOT = process.cwd();
const SEARCH_DIR = path.join(ROOT, '.generated', 'search');
const MANIFEST_DIR = path.join(ROOT, '.generated', 'manifests');
const logger = createLogger('build-indexes');

interface IndexItem {
  id: string;
  type: ContentType;
  title: string;
  description: string | null;
  version: string | null;
  status: 'draft' | 'published' | 'archived' | null;
  tags: string[];
  tag_ancestors: string[];
  related_ids: string[];
  created_at: string | null;
  updated_at: string | null;
  file_path: string;
  content_text: string;
}

interface IndexFile {
  generated_at: string;
  total: number;
  items: IndexItem[];
}

interface ManifestItem {
  id: string;
  type: ContentType;
  title: string;
  tags: string[];
  file_path: string;
  status: 'draft' | 'published' | 'archived' | null;
}

function buildIndexItem(filePath: string, body: string, frontmatter: ContentFrontmatter): IndexItem {
  const status = frontmatter.type === 'post' ? frontmatter.status ?? 'published' : null;
  const version = frontmatter.type === 'post' ? frontmatter.version : null;
  const tagAncestors = uniqueSorted(frontmatter.tags.flatMap((tag) => ancestors(tag)));
  const normalizedBody = body.replace(/\s+/g, ' ').trim();

  return {
    id: frontmatter.id,
    type: frontmatter.type,
    title: frontmatter.title,
    description: frontmatter.description ?? null,
    version,
    status,
    tags: uniqueSorted(frontmatter.tags),
    tag_ancestors: tagAncestors,
    related_ids: uniqueSorted(frontmatter.related_ids ?? []),
    created_at: frontmatter.created_at ?? null,
    updated_at: frontmatter.updated_at ?? null,
    file_path: toPosixPath(filePath),
    content_text: normalizedBody
  };
}

async function main(): Promise<void> {
  const files = await fg(buildContentGlobs(), { cwd: ROOT, onlyFiles: true });
  const issues: string[] = [];
  const warnings: string[] = [];

  const items: IndexItem[] = [];

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

    items.push(buildIndexItem(filePath, parsed.content, validation.value));
  }

  for (const warning of warnings) {
    logger.warn(warning);
  }

  const idMap = new Map<string, IndexItem>();
  for (const item of items) {
    if (idMap.has(item.id)) {
      issues.push(`duplicate id detected during index build: ${item.id}`);
    }
    idMap.set(item.id, item);
  }

  for (const item of items) {
    const missing = item.related_ids.filter((id) => !idMap.has(id));
    if (missing.length > 0) {
      issues.push(`${item.file_path}: unknown related_ids: ${missing.join(', ')}`);
    }
  }

  if (issues.length > 0) {
    logger.error('failed with validation issues:');
    for (const issue of issues) {
      logger.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  const generatedAt = new Date().toISOString();
  const posts = items.filter((item) => item.type === 'post');
  const snippets = items.filter((item) => item.type === 'snippet');

  const postsIndex: IndexFile = {
    generated_at: generatedAt,
    total: posts.length,
    items: posts
  };

  const snippetsIndex: IndexFile = {
    generated_at: generatedAt,
    total: snippets.length,
    items: snippets
  };

  const manifest = {
    generated_at: generatedAt,
    total: items.length,
    items: items.map<ManifestItem>((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      tags: item.tags,
      file_path: item.file_path,
      status: item.status
    }))
  };

  await fs.mkdir(SEARCH_DIR, { recursive: true });
  await fs.mkdir(MANIFEST_DIR, { recursive: true });

  await Promise.all([
    writeJsonFile(path.join(SEARCH_DIR, 'posts-index.json'), postsIndex),
    writeJsonFile(path.join(SEARCH_DIR, 'snippets-index.json'), snippetsIndex),
    writeJsonFile(path.join(MANIFEST_DIR, 'content-manifest.json'), manifest)
  ]);

  logger.debug(`complete: ${items.length} items (${posts.length} posts, ${snippets.length} snippets).`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  logger.error(`crashed: ${message}`);
  process.exitCode = 1;
});
