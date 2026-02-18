import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const TSX_BIN = path.join(REPO_ROOT, 'node_modules', '.bin', 'tsx');
const TAG_SCRIPT = path.join(REPO_ROOT, 'scripts', 'tags.ts');

const POST = `---
id: post-one
type: post
title: Post One
tags:
  - data.pipeline.dbt
  - python.pandas
version: 1.0.0
---

Body
`;

const SNIPPET = `---
id: snippet-one
type: snippet
title: Snippet One
tags:
  - data.pipeline.airflow
version: 1.0.0
---

Body
`;

async function setupTempContent(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'deelan-tags-test-'));
  await fs.mkdir(path.join(root, 'content', 'posts'), { recursive: true });
  await fs.mkdir(path.join(root, 'content', 'snippets'), { recursive: true });
  await fs.writeFile(path.join(root, 'content', 'posts', 'post-one.md'), POST, 'utf8');
  await fs.writeFile(path.join(root, 'content', 'snippets', 'snippet-one.md'), SNIPPET, 'utf8');

  const tsconfig = {
    compilerOptions: {
      baseUrl: REPO_ROOT,
      paths: {
        '@/*': ['src/*']
      }
    }
  };
  await fs.writeFile(path.join(root, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2), 'utf8');

  return root;
}

async function runTags(cwd: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await execFileAsync(TSX_BIN, [TAG_SCRIPT, ...args], { cwd });
    return { stdout, stderr, code: 0 };
  } catch (error: unknown) {
    const e = error as { stdout?: string; stderr?: string; code?: number };
    return { stdout: e.stdout ?? '', stderr: e.stderr ?? '', code: e.code ?? 1 };
  }
}

test('tags stats prints summary metrics', async () => {
  const root = await setupTempContent();
  try {
    const result = await runTags(root, ['stats']);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /Items: 2 \(posts=1, snippets=1\)/);
    assert.match(result.stdout, /Unique tags: 3/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('tags subtree apply requires explicit confirmation', async () => {
  const root = await setupTempContent();
  try {
    const result = await runTags(root, [
      'rename',
      '--from',
      'data.pipeline',
      '--to',
      'data.platform',
      '--subtree',
      '--apply'
    ]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /--confirm-subtree/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('tags wordcloud writes output html', async () => {
  const root = await setupTempContent();
  try {
    const out = path.join(root, 'exports', 'wc.html');
    const result = await runTags(root, ['wordcloud', '--out', out]);

    assert.equal(result.code, 0);
    const html = await fs.readFile(out, 'utf8');

    assert.match(html, /Tag Word Cloud/);
    assert.match(html, /data\.pipeline\.dbt/);
    assert.match(html, /data\.pipeline\.airflow/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
