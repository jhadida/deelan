import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const TARGETS = [
  path.join(ROOT, 'content', 'posts', 'synthetic'),
  path.join(ROOT, 'content', 'snippets', 'synthetic')
];

async function main(): Promise<void> {
  for (const target of TARGETS) {
    await fs.rm(target, { recursive: true, force: true });
  }
  console.log('synthetic-cleanup complete: removed content/posts/synthetic and content/snippets/synthetic.');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(`synthetic-cleanup failed: ${message}`);
  process.exitCode = 1;
});
