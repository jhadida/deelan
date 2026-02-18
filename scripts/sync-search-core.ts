import fs from 'node:fs/promises';
import path from 'node:path';

async function main(): Promise<void> {
  const root = process.cwd();
  const src = path.join(root, 'src', 'lib', 'search', 'search-core.js');
  const dst = path.join(root, 'public', 'js', 'search-core.js');

  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.copyFile(src, dst);
  console.log('sync-search-core: copied src/lib/search/search-core.js -> public/js/search-core.js');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(`sync-search-core failed: ${message}`);
  process.exitCode = 1;
});
