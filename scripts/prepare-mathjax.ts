import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const LEGACY_SOURCE_DIR = path.join(ROOT, 'node_modules', 'mathjax', 'es5');
const MODERN_SOURCE_DIR = path.join(ROOT, 'node_modules', 'mathjax');
const TARGET_DIR = path.join(ROOT, 'public', 'mathjax');

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(src: string, dst: string): Promise<void> {
  await fs.mkdir(dst, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, dstPath);
      continue;
    }

    if (entry.isFile()) {
      if (entry.name.endsWith('.md')) continue;
      await fs.copyFile(srcPath, dstPath);
    }
  }
}

async function main(): Promise<void> {
  const sourceDir = (await exists(LEGACY_SOURCE_DIR)) ? LEGACY_SOURCE_DIR : MODERN_SOURCE_DIR;
  const sourceExists = await exists(sourceDir);
  if (!sourceExists) {
    throw new Error(
      `MathJax source not found at ${LEGACY_SOURCE_DIR} or ${MODERN_SOURCE_DIR}`
    );
  }

  await copyDir(sourceDir, TARGET_DIR);
  console.log(`prepare-mathjax complete: copied assets to ${path.relative(ROOT, TARGET_DIR)}.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(`prepare-mathjax failed: ${message}`);
  process.exitCode = 1;
});
