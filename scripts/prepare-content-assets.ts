import fs from 'node:fs/promises';
import path from 'node:path';
import { copyDirIfExists } from '../src/lib/util';
import { createLogger } from '../src/lib/logger';

const logger = createLogger('prepare-content-assets');

async function main(): Promise<void> {
  const root = process.cwd();
  const outRoot = path.join(root, 'public', 'content-assets');

  await fs.rm(outRoot, { recursive: true, force: true });
  await fs.mkdir(outRoot, { recursive: true });

  const copied: string[] = [];
  if (await copyDirIfExists(path.join(root, 'content', 'posts', 'assets'), path.join(outRoot, 'posts'))) {
    copied.push('content/posts/assets');
  }
  if (
    await copyDirIfExists(
      path.join(root, 'content', 'snippets', 'assets'),
      path.join(outRoot, 'snippets')
    )
  ) {
    copied.push('content/snippets/assets');
  }
  if (await copyDirIfExists(path.join(root, 'content', 'assets'), path.join(outRoot, 'shared'))) {
    copied.push('content/assets');
  }

  if (copied.length === 0) {
    logger.info('no content asset directories found.');
    return;
  }

  logger.info(`copied ${copied.join(', ')} -> public/content-assets`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  logger.error(`failed: ${message}`);
  process.exitCode = 1;
});
