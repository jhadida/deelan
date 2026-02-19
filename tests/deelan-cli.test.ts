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
  assert.match(result.stdout, /DEELAN CLI/);
  assert.match(result.stdout, /deelan tags/);
  assert.match(result.stdout, /deelan export/);
});

test('deelan wrapper forwards export --help', async () => {
  const result = await runCli(['export', '--help']);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /DEELAN export CLI/);
  assert.match(result.stdout, /--pdf-scale/);
});

test('deelan wrapper reports unknown command', async () => {
  const result = await runCli(['definitely-unknown-command']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /unknown command/i);
});
