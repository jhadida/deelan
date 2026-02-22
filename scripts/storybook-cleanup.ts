import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, '.site-storybook');

async function removeIfExists(target: string): Promise<void> {
  try {
    await fs.rm(target, { recursive: true, force: true });
  } catch {
    // noop
  }
}

async function main(): Promise<void> {
  await removeIfExists(path.join(outDir, 'icons'));
  await removeIfExists(path.join(outDir, 'images', 'deelan-hires.png'));
  await removeIfExists(path.join(outDir, 'favicon.ico'));
}

void main();
