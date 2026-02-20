import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

test('build-analytics generates tags and relations artifacts', async () => {
  const generatedDir = path.join(REPO_ROOT, '.generated', 'analytics');

  await execFileAsync(process.execPath, ['--import', 'tsx', 'scripts/build-indexes.ts'], {
    cwd: REPO_ROOT
  });
  await execFileAsync(process.execPath, ['--import', 'tsx', 'scripts/build-analytics.ts'], {
    cwd: REPO_ROOT
  });

  const tagsPath = path.join(generatedDir, 'tags.json');
  const relationsPath = path.join(generatedDir, 'relations.json');
  const tagsRaw = await fs.readFile(tagsPath, 'utf8');
  const relationsRaw = await fs.readFile(relationsPath, 'utf8');
  const tags = JSON.parse(tagsRaw) as { tags: Array<{ name: string; count_total: number }> };
  const relations = JSON.parse(relationsRaw) as { nodes: unknown[]; edges: unknown[] };

  assert.ok(Array.isArray(tags.tags));
  assert.ok(tags.tags.length > 0);
  assert.ok(Array.isArray(relations.nodes));
  assert.ok(Array.isArray(relations.edges));
});
