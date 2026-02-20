import fs from 'node:fs/promises';
import path from 'node:path';

interface InitOptions {
  targetDir: string;
  includeVscode: boolean;
  includeFrontmatter: boolean;
  includeSrc: boolean;
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
  --yes, --force     Allow writing into a non-empty target directory
  -h, --help         Show this help

Defaults:
  - Creates a minimal content project in the target directory
  - Uses package-provided src templates at build time
  - Includes .vscode and .frontmatter helpers by default
`);
}

function parseArgs(argv: string[]): InitOptions {
  let targetDir = '.';
  let includeVscode = true;
  let includeFrontmatter = true;
  let includeSrc = false;
  let force = false;
  let help = false;

  for (const token of argv) {
    if (token === '--help' || token === '-h') help = true;
    else if (token === '--with-src') includeSrc = true;
    if (token === '--no-vscode') includeVscode = false;
    else if (token === '--no-frontmatter') includeFrontmatter = false;
    else if (token === '--yes' || token === '--force') force = true;
    else if (!token.startsWith('--')) targetDir = token;
  }

  return { targetDir, includeVscode, includeFrontmatter, includeSrc, force, help };
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

  console.log(`Initialized DEELAN project at ${targetRoot}`);
  console.log('Next steps:');
  console.log(`- cd ${targetRoot}`);
  console.log('- edit content under content/posts and content/snippets');
  if (!options.includeSrc) {
    console.log('- optional: run `deelan init . --with-src --yes` later if you want local src customization');
  }
  console.log('- run `deelan build` then `deelan serve`');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(`init failed: ${message}`);
  process.exitCode = 1;
});
