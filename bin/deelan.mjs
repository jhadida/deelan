#!/usr/bin/env node

import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TSX_CLI = path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const ASTRO_CLI = path.join(ROOT, 'node_modules', 'astro', 'astro.js');

const SCRIPT_MAP = {
  init: path.join(ROOT, 'scripts', 'init.ts'),
  tags: path.join(ROOT, 'scripts', 'tags.ts'),
  export: path.join(ROOT, 'scripts', 'export.ts'),
  validate: path.join(ROOT, 'scripts', 'validate.ts')
};

function printHelp() {
  console.log(`DEELAN CLI

Usage:
  deelan <command> [...args]

Commands:
  init                Scaffold a new DEELAN project
  build               Run preflight + static build for current project
  serve               Serve built output for current project
  tags                Run tag management CLI
  export              Run export CLI
  validate            Validate content/frontmatter

Examples:
  deelan init --help
  deelan init my-notebook --no-vscode
  deelan init my-notebook --with-src
  deelan build
  deelan build --include-subfolder synthetic
  deelan serve --port 4321
  deelan tags stats
  deelan export --id post--de-partitioning-primer --format pdf --pdf-scale 0.95
  deelan validate
`);
}

function runNode(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, DEELAN_PACKAGE_ROOT: ROOT }
  });

  if (result.error) {
    console.error(`deelan: command failed: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

function splitBuildArgs(args) {
  const scriptArgs = [];
  const astroArgs = [];

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];

    if (token === '--include-subfolder') {
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        scriptArgs.push(token, next);
        i += 1;
      } else {
        scriptArgs.push(token);
      }
      continue;
    }

    if (token.startsWith('--include-subfolder=')) {
      scriptArgs.push(token);
      continue;
    }

    astroArgs.push(token);
  }

  return { scriptArgs, astroArgs };
}

function runBuild(args) {
  const { scriptArgs, astroArgs } = splitBuildArgs(args);
  const chain = [
    ['scripts/prepare-mathjax.ts'],
    ['scripts/prepare-search.ts'],
    ['scripts/prepare-content-assets.ts'],
    ['scripts/validate.ts'],
    ['scripts/build-indexes.ts'],
    ['scripts/build-analytics.ts'],
    ['scripts/build-git-timeline.ts']
  ];

  for (const [script] of chain) {
    const result = spawnSync(process.execPath, [TSX_CLI, path.join(ROOT, script), ...scriptArgs], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: { ...process.env, DEELAN_PACKAGE_ROOT: ROOT }
    });
    if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
  }

  runNode([ASTRO_CLI, 'build', ...astroArgs]);
}

function runServe(args) {
  runNode([ASTRO_CLI, 'preview', ...args]);
}

const argv = process.argv.slice(2);
const command = argv[0];

if (!command || command === 'help' || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

if (command === 'build') {
  runBuild(argv.slice(1));
}

if (command === 'serve') {
  runServe(argv.slice(1));
}

const scriptPath = SCRIPT_MAP[command];
if (!scriptPath) {
  console.error(`deelan: unknown command "${command}"`);
  console.error('Run `deelan --help` for available commands.');
  process.exit(1);
}

runNode([TSX_CLI, scriptPath, ...argv.slice(1)]);
