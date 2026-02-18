import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { exportHtml } from '../src/lib/export/html';

const ORIGINAL_CWD = process.cwd();

async function withTempProject(fn: (root: string) => Promise<void>): Promise<void> {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deelan-export-test-'));
  try {
    await fn(tmpRoot);
  } finally {
    process.chdir(ORIGINAL_CWD);
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
}

test('exportHtml rewrites local assets/links and honors config theme default', async () => {
  await withTempProject(async (root) => {
    process.chdir(root);

    await fs.mkdir(path.join(root, 'content', 'posts', 'files'), { recursive: true });
    await fs.writeFile(path.join(root, 'content', 'posts', 'demo.md'), '# demo\n', 'utf8');
    await fs.writeFile(path.join(root, 'content', 'posts', 'diagram.png'), 'png-bytes', 'utf8');
    await fs.writeFile(path.join(root, 'content', 'posts', 'files', 'ref.txt'), 'reference', 'utf8');

    await fs.writeFile(
      path.join(root, 'deelan.config.yml'),
      ['blog_title: Deelan Test', 'footer_text: Test Footer', 'default_theme: dark'].join('\n'),
      'utf8'
    );

    const outDir = path.join(root, 'exports');

    const { htmlPath, exportDir } = await exportHtml({
      item: {
        filePath: 'content/posts/demo.md',
        body: '# demo',
        frontmatter: {
          id: 'demo-item',
          type: 'post',
          title: 'Demo',
          tags: ['data.pipeline.dbt'],
          version: '1.0.0'
        }
      },
      renderedHtml: [
        '<p><img src="./diagram.png" alt="diagram"></p>',
        '<p><a href="./files/ref.txt">Ref</a></p>',
        '<p><a href="./other.md">Other</a></p>',
        '<p><img src="https://example.com/image.png" alt="remote"></p>'
      ].join('\n'),
      outDir
    });

    const html = await fs.readFile(htmlPath, 'utf8');

    assert.match(html, /<html lang="en" data-theme="dark">/);
    assert.match(html, /src="\.\/media\/diagram\.png"/);
    assert.match(html, /href="\.\/media\/ref\.txt"/);
    assert.match(html, /href="\.\/other\.html"/);
    assert.match(html, /src="https:\/\/example\.com\/image\.png"/);

    await fs.access(path.join(exportDir, 'media', 'diagram.png'));
    await fs.access(path.join(exportDir, 'media', 'ref.txt'));
  });
});
