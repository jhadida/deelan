import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import {
  inferContentIdentity,
  validateFrontmatter,
  type ContentFrontmatter,
  type ValidatedContent
} from '../src/lib/content/schema';

const ROOT = process.cwd();
const CONTENT_GLOB = ['content/posts/**/*.md', 'content/snippets/**/*.md'];

interface ItemError {
  filePath: string;
  errors: string[];
}

interface ItemWarning {
  filePath: string;
  warning: string;
}

async function loadAndValidateFile(filePath: string): Promise<{
  item?: ValidatedContent;
  issue?: ItemError;
  warning?: ItemWarning;
}> {
  const absPath = path.join(ROOT, filePath);
  const raw = await fs.readFile(absPath, 'utf8');

  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      issue: {
        filePath,
        errors: [`unable to parse frontmatter: ${message}`]
      }
    };
  }

  const identity = inferContentIdentity(absPath);
  if (!identity) {
    return {
      issue: {
        filePath,
        errors: ['unable to infer content type from path.']
      }
    };
  }

  if (!identity.validFileName) {
    return {
      warning: {
        filePath,
        warning: identity.warning ?? 'invalid filename.'
      }
    };
  }

  const result = validateFrontmatter(parsed.data, filePath, identity.type, identity.id);
  if (!result.value) {
    return {
      issue: {
        filePath,
        errors: result.errors
      }
    };
  }

  return {
    item: {
      filePath,
      body: parsed.content,
      frontmatter: result.value
    }
  };
}

function validateCrossReferences(items: ValidatedContent[]): ItemError[] {
  const issues: ItemError[] = [];
  const ids = new Set(items.map((item) => item.frontmatter.id));

  const idToFiles = new Map<string, string[]>();
  for (const item of items) {
    const key = item.frontmatter.id;
    const files = idToFiles.get(key) ?? [];
    files.push(item.filePath);
    idToFiles.set(key, files);
  }

  for (const [id, files] of idToFiles.entries()) {
    if (files.length > 1) {
      for (const filePath of files) {
        issues.push({
          filePath,
          errors: [`duplicate id \`${id}\` found in: ${files.join(', ')}`]
        });
      }
    }
  }

  for (const item of items) {
    const relatedIds = item.frontmatter.related_ids ?? [];
    const missing = relatedIds.filter((id) => !ids.has(id));
    if (missing.length > 0) {
      issues.push({
        filePath: item.filePath,
        errors: [`unknown related_ids: ${missing.join(', ')}`]
      });
    }
  }

  return issues;
}

function printIssues(issues: ItemError[]): void {
  console.error(`\nContent validation failed with ${issues.length} issue(s):`);
  for (const issue of issues) {
    console.error(`\n- ${issue.filePath}`);
    for (const entry of issue.errors) {
      console.error(`  - ${entry}`);
    }
  }
}

function printWarnings(warnings: ItemWarning[]): void {
  if (warnings.length === 0) return;

  console.warn(`\nContent validation warnings (${warnings.length}):`);
  for (const warning of warnings) {
    console.warn(`- ${warning.filePath}`);
    console.warn(`  - ${warning.warning}`);
    console.warn('  - excluded from validation/build artifacts');
  }
}

function summarize(items: ValidatedContent[]): void {
  const counters: Record<ContentFrontmatter['type'], number> = { post: 0, snippet: 0 };
  for (const item of items) {
    counters[item.frontmatter.type] += 1;
  }

  console.log(
    `content validated: ${items.length} file(s) (${counters.post} posts, ${counters.snippet} snippets).`
  );
}

async function main(): Promise<void> {
  const files = await fg(CONTENT_GLOB, { cwd: ROOT, onlyFiles: true });

  if (files.length === 0) {
    console.log('no content files found under content/posts or content/snippets.');
    return;
  }

  const issues: ItemError[] = [];
  const warnings: ItemWarning[] = [];
  const items: ValidatedContent[] = [];

  for (const filePath of files.sort()) {
    const result = await loadAndValidateFile(filePath);
    if (result.issue) issues.push(result.issue);
    if (result.warning) warnings.push(result.warning);
    if (result.item) items.push(result.item);
  }

  printWarnings(warnings);
  issues.push(...validateCrossReferences(items));

  if (issues.length > 0) {
    printIssues(issues);
    process.exitCode = 1;
    return;
  }

  summarize(items);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(`validation crashed: ${message}`);
  process.exitCode = 1;
});
