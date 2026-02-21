import fs from 'node:fs/promises';
import path from 'node:path';
import { copyDirRecursive, pathExists, resolvePackageRoot } from '../src/lib/util';
import { createLogger } from '../src/lib/logger';

const ROOT = process.cwd();
const PACKAGE_ROOT = resolvePackageRoot(ROOT);
const LEGACY_SOURCE_DIR = path.join(ROOT, 'node_modules', 'mathjax', 'es5');
const MODERN_SOURCE_DIR = path.join(ROOT, 'node_modules', 'mathjax');
const PACKAGE_LEGACY_SOURCE_DIR = PACKAGE_ROOT ? path.join(PACKAGE_ROOT, 'node_modules', 'mathjax', 'es5') : null;
const PACKAGE_MODERN_SOURCE_DIR = PACKAGE_ROOT ? path.join(PACKAGE_ROOT, 'node_modules', 'mathjax') : null;
const TARGET_DIR = path.join(ROOT, 'public', 'mathjax');
const logger = createLogger('prepare-mathjax');

async function main(): Promise<void> {
  let sourceDir = (await pathExists(LEGACY_SOURCE_DIR)) ? LEGACY_SOURCE_DIR : MODERN_SOURCE_DIR;
  const sourceExists = await pathExists(sourceDir);

  if (!sourceExists && PACKAGE_LEGACY_SOURCE_DIR && PACKAGE_MODERN_SOURCE_DIR) {
    sourceDir = (await pathExists(PACKAGE_LEGACY_SOURCE_DIR))
      ? PACKAGE_LEGACY_SOURCE_DIR
      : PACKAGE_MODERN_SOURCE_DIR;
  }

  if (!(await pathExists(sourceDir))) {
    throw new Error(
      `MathJax source not found at ${LEGACY_SOURCE_DIR}, ${MODERN_SOURCE_DIR}${
        PACKAGE_ROOT ? `, ${PACKAGE_LEGACY_SOURCE_DIR}, ${PACKAGE_MODERN_SOURCE_DIR}` : ''
      }`
    );
  }

  await copyDirRecursive(sourceDir, TARGET_DIR, {
    includeFile: (fileName) => !fileName.endsWith('.md')
  });
  logger.info(`complete: copied assets to ${path.relative(ROOT, TARGET_DIR)}.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  logger.error(`failed: ${message}`);
  process.exitCode = 1;
});
