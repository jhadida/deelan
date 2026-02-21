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

test('deelan init scaffolds minimal project and supports helper opt-out flags', async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deelan-init-test-'));
  const target = path.join(tmpRoot, 'notebook');

  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      [CLI, 'init', target, '--no-vscode', '--no-frontmatter'],
      { cwd: REPO_ROOT }
    );

    assert.match(stdout, /Initialized Deelan project/);

    await fs.access(path.join(target, 'astro.config.mjs'));
    await fs.access(path.join(target, 'tsconfig.json'));
    await fs.access(path.join(target, 'deelan.config.yml'));
    await fs.access(path.join(target, 'content', 'posts'));
    await fs.access(path.join(target, 'content', 'snippets'));
    await fs.access(path.join(target, 'public', 'js'));
    await assert.rejects(() => fs.access(path.join(target, 'src', 'pages')));
    await fs.access(path.join(target, '.gitattributes'));

    const gitignore = await fs.readFile(path.join(target, '.gitignore'), 'utf8');
    assert.match(gitignore, /\.astro\//);
    assert.match(gitignore, /\.generated\//);
    assert.match(gitignore, /\.site-deelan\//);
    assert.match(gitignore, /exports\//);

    await assert.rejects(() => fs.access(path.join(target, '.vscode')));
    await assert.rejects(() => fs.access(path.join(target, '.frontmatter')));
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test('deelan init --with-src copies local src templates', async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deelan-init-src-test-'));
  const target = path.join(tmpRoot, 'notebook');

  try {
    await execFileAsync(process.execPath, [CLI, 'init', target, '--with-src'], { cwd: REPO_ROOT });
    await fs.access(path.join(target, 'src', 'pages'));
    await fs.access(path.join(target, 'src', 'components'));
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});
