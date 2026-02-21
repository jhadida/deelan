import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createLogger } from '../src/lib/logger';
import {
  copyRelativeDir,
  copyRelativeFile,
  ensureEmptyOrForce,
  pathExists,
  writeTextFile
} from '../src/lib/util';
import { getParsedBoolFlag, hasHelpFlag, parseCliArgs } from '../src/lib/args';

interface InitOptions {
  targetDir: string;
  includeVscode: boolean;
  includeFrontmatter: boolean;
  includeSrc: boolean;
  includeGit: boolean;
  includeLfsAttrs: boolean;
  force: boolean;
  help: boolean;
}

const logger = createLogger('init');

function writeStdout(text: string): void {
  process.stdout.write(`${text}\n`);
}

const PACKAGE_ROOT = process.env.DEELAN_PACKAGE_ROOT
  ? path.resolve(process.env.DEELAN_PACKAGE_ROOT)
  : process.cwd();

const REQUIRED_FILES = ['astro.config.mjs', 'tsconfig.json', 'deelan.config.yml'] as const;
const REQUIRED_DIRS = ['content', 'public/js'] as const;
const OPTIONAL_SRC_DIRS = ['src/components', 'src/lib', 'src/pages', 'src/styles', 'src/schemas'] as const;

const GITIGNORE_TEMPLATE = `.astro/
.generated/
.site-deelan/
exports/
`;

const GITATTRIBUTES_LFS_TEMPLATE = `# DEELAN optional Git LFS defaults
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.jpeg filter=lfs diff=lfs merge=lfs -text
*.gif filter=lfs diff=lfs merge=lfs -text
*.webp filter=lfs diff=lfs merge=lfs -text
*.bmp filter=lfs diff=lfs merge=lfs -text
*.tif filter=lfs diff=lfs merge=lfs -text
*.tiff filter=lfs diff=lfs merge=lfs -text
*.pdf filter=lfs diff=lfs merge=lfs -text
*.zip filter=lfs diff=lfs merge=lfs -text
*.7z filter=lfs diff=lfs merge=lfs -text
*.tar filter=lfs diff=lfs merge=lfs -text
*.gz filter=lfs diff=lfs merge=lfs -text
*.tgz filter=lfs diff=lfs merge=lfs -text
*.bz2 filter=lfs diff=lfs merge=lfs -text
*.xz filter=lfs diff=lfs merge=lfs -text
`;

const FALLBACK_FILE_TEMPLATES: Record<(typeof REQUIRED_FILES)[number], string> = {
  'astro.config.mjs': `import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.local',
  output: 'static',
  outDir: '.site-deelan'
});
`,
  'tsconfig.json': `{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "types": ["astro/client"]
  }
}
`,
  'deelan.config.yml': `blog_title: Deelan.
footer_text: "Built with \u2665 using Deelan."
default_theme: dark
timezone: UTC
accent_hue: 150
content_max_width: 1100px
code_theme_light: material-theme-lighter
code_theme_dark: material-theme-darker
timeline_commit_url_template: https://github.com/OWNER/REPO/commit/\${COMMIT_SHA}
`
};

const ASTRO_CONFIG_EXTERNAL_SRC_TEMPLATE = `import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const localSrcDir = path.join(projectRoot, 'src');
const packageSrcDir = process.env.DEELAN_PACKAGE_ROOT
  ? path.join(process.env.DEELAN_PACKAGE_ROOT, 'src')
  : localSrcDir;
const srcDir = fs.existsSync(localSrcDir) ? localSrcDir : packageSrcDir;

export default defineConfig({
  site: 'https://example.local',
  output: 'static',
  outDir: '.site-deelan',
  srcDir
});
`;

function printHelp(): void {
  writeStdout(`DEELAN init

Usage:
  deelan init [dir] [options]

Options:
  --with-src         Copy local src/ templates (advanced customization)
  --no-vscode        Skip .vscode helper files
  --no-frontmatter   Skip .frontmatter helper files
  --no-git           Skip automatic git repository initialization
  --no-lfs-attrs     Skip writing default .gitattributes LFS rules
  --yes, --force     Allow writing into a non-empty target directory
  -h, --help         Show this help

Defaults:
  - Creates a minimal content project in the target directory
  - Uses package-provided src templates at build time
  - Includes .vscode and .frontmatter helpers by default
  - Initializes git repo if target is not already in one
  - Writes default .gitattributes LFS patterns when creating new git repo
`);
}

function parseArgs(argv: string[]): InitOptions {
  const parsed = parseCliArgs(argv);
  const targetDir = parsed.positionals[0] ?? '.';
  const help = hasHelpFlag(argv);
  const includeSrc = getParsedBoolFlag(parsed.flags, 'with-src');
  const includeVscode = !getParsedBoolFlag(parsed.flags, 'no-vscode');
  const includeFrontmatter = !getParsedBoolFlag(parsed.flags, 'no-frontmatter');
  const includeGit = !getParsedBoolFlag(parsed.flags, 'no-git');
  const includeLfsAttrs = !getParsedBoolFlag(parsed.flags, 'no-lfs-attrs');
  const force = getParsedBoolFlag(parsed.flags, 'yes') || getParsedBoolFlag(parsed.flags, 'force');

  return {
    targetDir,
    includeVscode,
    includeFrontmatter,
    includeSrc,
    includeGit,
    includeLfsAttrs,
    force,
    help
  };
}

async function copyFileRelative(rel: string, targetRoot: string): Promise<void> {
  const copied = await copyRelativeFile({
    sourceRoot: PACKAGE_ROOT,
    targetRoot,
    relativePath: rel
  });
  if (copied) {
    return;
  }

  const fallback = FALLBACK_FILE_TEMPLATES[rel as (typeof REQUIRED_FILES)[number]];
  if (!fallback) {
    throw new Error(`Required file missing in package and no fallback is defined: ${rel}`);
  }

  await writeTextFile(dst, fallback);
}

async function copyDirRelative(rel: string, targetRoot: string): Promise<void> {
  const copied = await copyRelativeDir({
    sourceRoot: PACKAGE_ROOT,
    targetRoot,
    relativePath: rel
  });
  if (!copied) {
    throw new Error(`Required directory missing in package: ${rel}`);
  }
}

async function writeGitignore(targetRoot: string): Promise<void> {
  const gitignorePath = path.join(targetRoot, '.gitignore');
  await writeTextFile(gitignorePath, GITIGNORE_TEMPLATE);
}

function runGit(args: string[], cwd: string): { ok: boolean; output: string } {
  const result = spawnSync('git', args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8'
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  return { ok: (result.status ?? 1) === 0, output };
}

async function writeDefaultGitattributes(targetRoot: string): Promise<void> {
  const attrsPath = path.join(targetRoot, '.gitattributes');
  if (await pathExists(attrsPath)) return;
  await writeTextFile(attrsPath, GITATTRIBUTES_LFS_TEMPLATE);
}

function looksLikeGitRepo(targetRoot: string): boolean {
  const probe = runGit(['rev-parse', '--is-inside-work-tree'], targetRoot);
  return probe.ok && probe.output.includes('true');
}

async function maybeInitializeGit(targetRoot: string, options: InitOptions): Promise<void> {
  if (!options.includeGit) return;
  if (looksLikeGitRepo(targetRoot)) return;

  const init = runGit(['init'], targetRoot);
  if (!init.ok) {
    logger.warn('unable to initialize git repository automatically.');
    if (init.output) logger.warn(init.output);
    return;
  }

  if (options.includeLfsAttrs) {
    await writeDefaultGitattributes(targetRoot);
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const targetRoot = path.resolve(process.cwd(), options.targetDir);

  try {
    await ensureEmptyOrForce(targetRoot, options.force);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Target directory is not empty: ')) {
      throw new Error(
        `${error.message}\nRe-run with --yes to allow writing into an existing directory.`
      );
    }
    throw error;
  }

  for (const rel of REQUIRED_FILES) {
    if (rel === 'astro.config.mjs' && !options.includeSrc) {
      const dst = path.join(targetRoot, rel);
      await fs.mkdir(path.dirname(dst), { recursive: true });
      await writeTextFile(dst, ASTRO_CONFIG_EXTERNAL_SRC_TEMPLATE);
      continue;
    }
    await copyFileRelative(rel, targetRoot);
  }

  for (const rel of REQUIRED_DIRS) {
    await copyDirRelative(rel, targetRoot);
  }

  if (options.includeSrc) {
    for (const rel of OPTIONAL_SRC_DIRS) {
      await copyDirRelative(rel, targetRoot);
    }
  }

  if (options.includeVscode && (await pathExists(path.join(PACKAGE_ROOT, '.vscode')))) {
    await copyDirRelative('.vscode', targetRoot);
  }

  if (options.includeFrontmatter && (await pathExists(path.join(PACKAGE_ROOT, '.frontmatter')))) {
    await copyDirRelative('.frontmatter', targetRoot);
  }

  await writeGitignore(targetRoot);
  await maybeInitializeGit(targetRoot, options);

  logger.info(`Initialized DEELAN project at ${targetRoot}`);
  writeStdout('Next steps:');
  writeStdout(`- cd ${targetRoot}`);
  writeStdout('- edit content under content/posts and content/snippets');
  if (!options.includeSrc) {
    writeStdout('- optional: run `deelan init . --with-src --yes` later if you want local src customization');
  }
  if (options.includeGit) {
    writeStdout('- optional: run `git lfs install` if you plan to track non-text assets with LFS');
  }
  writeStdout('- run `deelan build` then `deelan serve`');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  logger.error(`failed: ${message}`);
  process.exitCode = 1;
});
