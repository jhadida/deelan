import fs from 'node:fs/promises';
import path from 'node:path';
import { createLogger } from '../src/lib/logger';

const ROOT = process.cwd();
const TARGETS = [
  path.join(ROOT, 'content', 'posts', 'synthetic'),
  path.join(ROOT, 'content', 'snippets', 'synthetic')
];
const logger = createLogger('synthetic-cleanup');

async function main(): Promise<void> {
  for (const target of TARGETS) {
    await fs.rm(target, { recursive: true, force: true });
  }
  logger.info('complete: removed content/posts/synthetic and content/snippets/synthetic.');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  logger.error(`failed: ${message}`);
  process.exitCode = 1;
});
