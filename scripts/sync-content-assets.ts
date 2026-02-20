import fs from 'node:fs/promises';
import path from 'node:path';
import { pathExists } from '../src/lib/util';

async function copyIfExists(src: string, dst: string): Promise<boolean> {
  if (!(await pathExists(src))) return false;
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.cp(src, dst, { recursive: true, force: true });
  return true;
}

async function main(): Promise<void> {
  const root = process.cwd();
  const outRoot = path.join(root, 'public', 'content-assets');

  await fs.rm(outRoot, { recursive: true, force: true });
  await fs.mkdir(outRoot, { recursive: true });

  const copied: string[] = [];
  if (await copyIfExists(path.join(root, 'content', 'posts', 'assets'), path.join(outRoot, 'posts'))) {
    copied.push('content/posts/assets');
  }
  if (
    await copyIfExists(
      path.join(root, 'content', 'snippets', 'assets'),
      path.join(outRoot, 'snippets')
    )
  ) {
    copied.push('content/snippets/assets');
  }
  if (await copyIfExists(path.join(root, 'content', 'assets'), path.join(outRoot, 'shared'))) {
    copied.push('content/assets');
  }

  if (copied.length === 0) {
    console.log('sync-content-assets: no content asset directories found.');
    return;
  }

  console.log(`sync-content-assets: copied ${copied.join(', ')} -> public/content-assets`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(`sync-content-assets failed: ${message}`);
  process.exitCode = 1;
});
