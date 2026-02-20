import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

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
  console.log(`DEELAN init

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
  let targetDir = '.';
  let includeVscode = true;
  let includeFrontmatter = true;
  let includeSrc = false;
  let includeGit = true;
  let includeLfsAttrs = true;
  let force = false;
  let help = false;

  for (const token of argv) {
    if (token === '--help' || token === '-h') help = true;
    else if (token === '--with-src') includeSrc = true;
    if (token === '--no-vscode') includeVscode = false;
    else if (token === '--no-frontmatter') includeFrontmatter = false;
    else if (token === '--no-git') includeGit = false;
    else if (token === '--no-lfs-attrs') includeLfsAttrs = false;
    else if (token === '--yes' || token === '--force') force = true;
    else if (!token.startsWith('--')) targetDir = token;
  }

  return { targetDir, includeVscode, includeFrontmatter, includeSrc, includeGit, includeLfsAttrs, force, help };
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureEmptyOrForce(target: string, force: boolean): Promise<void> {
  if (!(await exists(target))) {
    await fs.mkdir(target, { recursive: true });
    return;
  }

  const entries = await fs.readdir(target);
  if (entries.length === 0 || force) return;

  throw new Error(
    `Target directory is not empty: ${target}\nRe-run with --yes to allow writing into an existing directory.`
  );
}

async function copyFileRelative(rel: string, targetRoot: string): Promise<void> {
  const src = path.join(PACKAGE_ROOT, rel);
  const dst = path.join(targetRoot, rel);
  await fs.mkdir(path.dirname(dst), { recursive: true });
  if (await exists(src)) {
    await fs.copyFile(src, dst);
    return;
  }

  const fallback = FALLBACK_FILE_TEMPLATES[rel as (typeof REQUIRED_FILES)[number]];
  if (!fallback) {
    throw new Error(`Required file missing in package and no fallback is defined: ${rel}`);
  }

  await fs.writeFile(dst, fallback, 'utf8');
}

async function copyDirRelative(rel: string, targetRoot: string): Promise<void> {
  const src = path.join(PACKAGE_ROOT, rel);
  const dst = path.join(targetRoot, rel);
  await fs.cp(src, dst, { recursive: true, force: true });
}

async function writeGitignore(targetRoot: string): Promise<void> {
  const gitignorePath = path.join(targetRoot, '.gitignore');
  await fs.writeFile(gitignorePath, GITIGNORE_TEMPLATE, 'utf8');
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
  if (await exists(attrsPath)) return;
  await fs.writeFile(attrsPath, GITATTRIBUTES_LFS_TEMPLATE, 'utf8');
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
    console.warn('init warning: unable to initialize git repository automatically.');
    if (init.output) console.warn(init.output);
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

  await ensureEmptyOrForce(targetRoot, options.force);

  for (const rel of REQUIRED_FILES) {
    if (rel === 'astro.config.mjs' && !options.includeSrc) {
      const dst = path.join(targetRoot, rel);
      await fs.mkdir(path.dirname(dst), { recursive: true });
      await fs.writeFile(dst, ASTRO_CONFIG_EXTERNAL_SRC_TEMPLATE, 'utf8');
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

  if (options.includeVscode && (await exists(path.join(PACKAGE_ROOT, '.vscode')))) {
    await copyDirRelative('.vscode', targetRoot);
  }

  if (options.includeFrontmatter && (await exists(path.join(PACKAGE_ROOT, '.frontmatter')))) {
    await copyDirRelative('.frontmatter', targetRoot);
  }

  await writeGitignore(targetRoot);
  await maybeInitializeGit(targetRoot, options);

  console.log(`Initialized DEELAN project at ${targetRoot}`);
  console.log('Next steps:');
  console.log(`- cd ${targetRoot}`);
  console.log('- edit content under content/posts and content/snippets');
  if (!options.includeSrc) {
    console.log('- optional: run `deelan init . --with-src --yes` later if you want local src customization');
  }
  if (options.includeGit) {
    console.log('- optional: run `git lfs install` if you plan to track large binary assets with LFS');
  }
  console.log('- run `deelan build` then `deelan serve`');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(`init failed: ${message}`);
  process.exitCode = 1;
});
