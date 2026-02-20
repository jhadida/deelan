import fs from 'node:fs/promises';
import path from 'node:path';
import { pathExists, resolvePackageRoot } from '../src/lib/util';

async function main(): Promise<void> {
  const root = process.cwd();
  const packageRoot = resolvePackageRoot(root);
  const localSrc = path.join(root, 'src', 'lib', 'search', 'search-core.js');
  const packageSrc = packageRoot ? path.join(packageRoot, 'src', 'lib', 'search', 'search-core.js') : null;
  let src = localSrc;
  if (!(await pathExists(localSrc)) && packageSrc) src = packageSrc;

  const dst = path.join(root, 'public', 'js', 'search-core.js');

  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.copyFile(src, dst);
  console.log(
    `sync-search-core: copied ${path.relative(root, src) || src} -> public/js/search-core.js`
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(`sync-search-core failed: ${message}`);
  process.exitCode = 1;
});
