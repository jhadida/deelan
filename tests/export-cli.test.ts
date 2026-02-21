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

async function setupFixture(): Promise<{ root: string; outDir: string; id: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'deelan-export-cli-test-'));
  const outDir = path.join(root, 'exports');
  const id = 'post--export-demo';

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
title: Export Demo
tags:
  - data.exports
version: v1.0.0
---

# Export Demo

This is a test fixture with \`inline code\`.

\`\`\`python
print("hello")
\`\`\`
`;

  await fs.writeFile(path.join(root, 'content', 'posts', 'export-demo.md'), post, 'utf8');
  await fs.writeFile(path.join(root, 'deelan.config.yml'), 'default_theme: dark\n', 'utf8');

  return { root, outDir, id };
}

async function runExport(cwd: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [CLI, 'export', ...args], { cwd });
    return { stdout, stderr, code: 0 };
  } catch (error: unknown) {
    const e = error as { stdout?: string; stderr?: string; code?: number };
    return { stdout: e.stdout ?? '', stderr: e.stderr ?? '', code: e.code ?? 1 };
  }
}

test('export CLI generates HTML fixture successfully', async () => {
  const { root, outDir, id } = await setupFixture();
  try {
    const result = await runExport(root, ['--id', id, '--format', 'html', '--out', outDir]);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /Exported HTML:/);
    await fs.access(path.join(outDir, id, 'index.html'));
    await fs.access(path.join(outDir, id, 'style.css'));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('export CLI generates PDF fixture when Chromium is available', async (t) => {
  const { root, outDir, id } = await setupFixture();
  try {
    const result = await runExport(root, ['--id', id, '--format', 'pdf', '--out', outDir]);
    if (result.code !== 0) {
      if (/chromium|playwright|browser.*install|failed to launch/i.test(result.stderr)) {
        t.skip('Chromium/Playwright browser binary unavailable in this environment.');
        return;
      }
      assert.fail(`Unexpected export failure:\n${result.stderr}`);
    }

    assert.match(result.stdout, /Exported PDF:/);
    await fs.access(path.join(outDir, id, `${id}.pdf`));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
