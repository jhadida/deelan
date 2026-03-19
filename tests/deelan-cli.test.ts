import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const CLI = path.join(REPO_ROOT, 'bin', 'deelan.mjs');

async function runCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [CLI, ...args], { cwd: REPO_ROOT });
    return { stdout, stderr, code: 0 };
  } catch (error: unknown) {
    const e = error as { stdout?: string; stderr?: string; code?: number };
    return { stdout: e.stdout ?? '', stderr: e.stderr ?? '', code: e.code ?? 1 };
  }
}

test('deelan wrapper prints help', async () => {
  const result = await runCli(['--help']);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /Deelan CLI/);
  assert.match(result.stdout, /deelan version/);
  assert.match(result.stdout, /deelan tags/);
  assert.match(result.stdout, /deelan export/);
});

test('deelan wrapper prints version', async () => {
  const result = await runCli(['version']);
  assert.equal(result.code, 0);
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
});

test('deelan wrapper forwards export --help', async () => {
  const result = await runCli(['export', '--help']);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /Deelan export CLI/);
  assert.match(result.stdout, /--pdf-scale/);
});

test('deelan wrapper forwards init --help', async () => {
  const { stdout } = await execFileAsync(process.execPath, [CLI, 'init', '--help'], {
    cwd: REPO_ROOT
  });

  assert.match(stdout, /Deelan init/);
  assert.match(stdout, /--with-src/);
  assert.match(stdout, /--no-git/);
  assert.match(stdout, /--no-lfs-attrs/);
});

test('deelan wrapper reports unknown command', async () => {
  const result = await runCli(['definitely-unknown-command']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /unknown command/i);
});

// ─── commander migration coverage ───────────────────────────

test('deelan --version flag prints semver', async () => {
  const result = await runCli(['--version']);
  assert.equal(result.code, 0);
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
});

test('deelan help lists all commands', async () => {
  const result = await runCli(['--help']);
  assert.equal(result.code, 0);
  for (const cmd of ['version', 'build', 'serve', 'init', 'tags', 'export', 'validate']) {
    assert.match(result.stdout, new RegExp(`\\b${cmd}\\b`), `help should list "${cmd}" command`);
  }
});

test('deelan help <command> works for delegated commands', async () => {
  const result = await runCli(['help', 'build']);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /build/i);
});

test('deelan build --help shows custom help', async () => {
  const result = await runCli(['build', '--help']);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /--include-subfolder/);
  assert.match(result.stdout, /astro build/);
});

test('deelan serve --help shows custom help', async () => {
  const result = await runCli(['serve', '--help']);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /astro preview/);
});

test('deelan unknown command suggests similar', async () => {
  const result = await runCli(['buil']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /unknown command/i);
});

test('deelan with no arguments shows help', async () => {
  const result = await runCli([]);
  const output = result.stdout + result.stderr;
  assert.match(output, /Deelan CLI/);
});
