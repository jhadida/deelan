import fs from 'node:fs/promises';
import path from 'node:path';
import { pathExists, resolvePackageRoot } from '../src/lib/util';
import { createLogger } from '../src/lib/logger';

const logger = createLogger('prepare-search');

async function copyPublicJs(filename: string, root: string, packageRoot: string | null): Promise<void> {
  if (!packageRoot) return; // dev repo: file is already in place
  const src = path.join(packageRoot, 'public', 'js', filename);
  if (!(await pathExists(src))) {
    logger.warn(`package asset not found, skipping: public/js/${filename}`);
    return;
  }
  const dst = path.join(root, 'public', 'js', filename);
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.copyFile(src, dst);
  logger.debug(`copied ${path.relative(root, src) || src} -> public/js/${filename}`);
}

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
  logger.debug(`copied ${path.relative(root, src) || src} -> public/js/search-core.js`);

  await copyPublicJs('filter.js', root, packageRoot);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  logger.error(`failed: ${message}`);
  process.exitCode = 1;
});
