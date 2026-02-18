import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const REPO_ROOT = process.cwd();

test('service worker precaches offline fallback and search core', async () => {
  const sw = await fs.readFile(path.join(REPO_ROOT, 'public', 'service-worker.js'), 'utf8');

  assert.match(sw, /const CACHE_VERSION = 'deelan-v\d+';/);
  assert.match(sw, /'\/offline\.html'/);
  assert.match(sw, /'\/js\/search-core\.js'/);
  assert.match(sw, /request\.mode === 'navigate'/);
  assert.match(sw, /caches\.match\('\/offline\.html'\)/);
});

test('pwa register script handles waiting worker updates', async () => {
  const registerJs = await fs.readFile(path.join(REPO_ROOT, 'public', 'js', 'pwa-register.js'), 'utf8');

  assert.match(registerJs, /registration\.waiting/);
  assert.match(registerJs, /postMessage\(\{ type: 'SKIP_WAITING' \}\)/);
  assert.match(registerJs, /controllerchange/);
  assert.match(registerJs, /window\.location\.reload\(\)/);
});
