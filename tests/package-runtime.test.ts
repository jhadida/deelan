import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

test('tsx is a runtime dependency for packaged CLI commands', () => {
  const raw = fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8');
  const pkg = JSON.parse(raw) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  assert.ok(pkg.dependencies?.tsx, 'tsx must be listed under dependencies');
  assert.ok(!pkg.devDependencies?.tsx, 'tsx should not be devDependency-only');
});

test('CLI resolves runtime dependencies via Node resolution (hoist-safe)', () => {
  const source = fs.readFileSync(path.join(REPO_ROOT, 'bin', 'deelan.mjs'), 'utf8');
  assert.match(source, /resolveRuntimeModule\('astro\/astro\.js'/);
  assert.match(source, /require\.resolve\('tsx\/package\.json'\)/);
  assert.match(source, /dist', 'loader\.mjs'/);
});
