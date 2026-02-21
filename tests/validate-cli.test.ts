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
const CLI = path.join(REPO_ROOT, 'bin', 'deelan.mjs');

async function runValidate(cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [CLI, 'validate'], { cwd });
    return { stdout, stderr, code: 0 };
  } catch (error: unknown) {
    const e = error as { stdout?: string; stderr?: string; code?: number };
    return { stdout: e.stdout ?? '', stderr: e.stderr ?? '', code: e.code ?? 1 };
  }
}

test('validate reports unknown related_ids and internal links', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'deelan-validate-test-'));

  try {
    await fs.mkdir(path.join(root, 'content', 'posts'), { recursive: true });
    await fs.mkdir(path.join(root, 'content', 'snippets'), { recursive: true });
    await fs.writeFile(
      path.join(root, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            baseUrl: REPO_ROOT,
            paths: {
              '@/*': ['src/*']
            }
          }
        },
        null,
        2
      ),
      'utf8'
    );

    const post = `---
title: Validation Demo
tags:
  - data.validation
version: v1.0.0
related_ids:
  - snippet--missing-target
---

Broken inline link: [[snippet--missing-inline]]
`;

    await fs.writeFile(path.join(root, 'content', 'posts', 'validation-demo.md'), post, 'utf8');

    const result = await runValidate(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /unknown related_ids/i);
    assert.match(result.stderr, /unknown internal links/i);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
