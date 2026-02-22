import fs from 'node:fs/promises';
import path from 'node:path';

type CleanupMode = 'generated' | 'outputs' | 'all';

const root = process.cwd();
const mode = (process.argv[2] ?? 'all') as CleanupMode;

const generatedTargets = [
  '.generated',
  path.join('public', 'content-assets')
];

const outputTargets = ['.site-deelan', '.site-docs', '.site-storybook', 'exports'];

async function removeIfExists(target: string): Promise<void> {
  try {
    await fs.rm(path.join(root, target), { recursive: true, force: true });
  } catch {
    // noop
  }
}

async function main(): Promise<void> {
  const targets =
    mode === 'generated'
      ? generatedTargets
      : mode === 'outputs'
        ? outputTargets
        : [...generatedTargets, ...outputTargets];

  await Promise.all(targets.map((target) => removeIfExists(target)));
}

void main();
