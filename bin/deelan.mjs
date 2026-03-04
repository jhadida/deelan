#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');

const LOG_LEVEL_WEIGHT = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

function parseFlagValue(argv, flag) {
  const equalsPrefix = `${flag}=`;
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === flag) {
      const next = argv[i + 1];
      return next && !next.startsWith('--') ? next : null;
    }
    if (token.startsWith(equalsPrefix)) {
      return token.slice(equalsPrefix.length);
    }
  }
  return null;
}

function normalizeLevel(input) {
  if (!input || typeof input !== 'string') return null;
  const value = input.trim().toLowerCase();
  return value in LOG_LEVEL_WEIGHT ? value : null;
}

function resolveLogging(argv) {
  const argLevel = normalizeLevel(parseFlagValue(argv, '--log-level'));
  const envLevel = normalizeLevel(process.env.DEELAN_LOG_LEVEL);
  const level = argLevel ?? envLevel ?? 'info';

  const argFile = parseFlagValue(argv, '--log-file');
  const envFile = process.env.DEELAN_LOG_FILE;
  const filePathRaw = (argFile ?? envFile ?? '').trim();
  const filePath = filePathRaw ? path.resolve(process.cwd(), filePathRaw) : null;
  return { level, filePath };
}

function writeLog(logging, level, message) {
  if (LOG_LEVEL_WEIGHT[level] > LOG_LEVEL_WEIGHT[logging.level]) return;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} deelan ${message}`;
  if (level === 'error') process.stderr.write(`${line}\n`);
  else process.stdout.write(`${line}\n`);

  if (!logging.filePath) return;
  try {
    fs.mkdirSync(path.dirname(logging.filePath), { recursive: true });
    fs.appendFileSync(logging.filePath, `${line}\n`, 'utf8');
  } catch {
    // CLI logging should never crash command execution.
  }
}

const SCRIPT_MAP = {
  init: path.join(ROOT, 'scripts', 'init.ts'),
  tags: path.join(ROOT, 'scripts', 'tags.ts'),
  export: path.join(ROOT, 'scripts', 'export.ts'),
  validate: path.join(ROOT, 'scripts', 'validate.ts')
};

function printHelp() {
  process.stdout.write(`Deelan CLI

Usage:
  deelan <command> [...args]

Commands:
  init                Scaffold a new Deelan project
  build               Run preflight + static build for current project
  serve               Serve built output for current project
  version             Print installed Deelan version
  tags                Run tag management CLI
  export              Run export CLI
  validate            Validate content/frontmatter

Examples:
  deelan version
  deelan init --help
  deelan init my-notebook --no-vscode
  deelan init my-notebook --with-src
  deelan build
  deelan build --include-subfolder synthetic
  deelan serve --port 4321
  deelan tags stats
  deelan export --id post--partitioning-primer --format pdf --pdf-scale 0.95
  deelan validate
` + '\n');
}

function printVersion() {
  try {
    const raw = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const version = typeof parsed.version === 'string' ? parsed.version : null;
    if (!version) throw new Error('missing version');
    process.stdout.write(`${version}\n`);
  } catch {
    writeLog(resolveLogging([]), 'error', 'could not resolve package version');
    process.exit(1);
  }
}

function resolveRuntimeModule(specifier, dependencyName, logging) {
  try {
    return require.resolve(specifier);
  } catch {
    writeLog(logging, 'error', `missing runtime dependency "${dependencyName}". Reinstall package and retry.`);
    process.exit(1);
  }
}

function resolveAstroCli(logging) {
  let astroPackageJsonPath;
  try {
    astroPackageJsonPath = require.resolve('astro/package.json');
  } catch {
    writeLog(logging, 'error', 'missing runtime dependency "astro". Reinstall package and retry.');
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(astroPackageJsonPath, 'utf8');
    const pkg = JSON.parse(raw);
    const binEntry =
      typeof pkg?.bin === 'string'
        ? pkg.bin
        : pkg?.bin && typeof pkg.bin.astro === 'string'
          ? pkg.bin.astro
          : null;

    if (!binEntry) {
      throw new Error('astro bin entry not found');
    }

    const cliPath = path.resolve(path.dirname(astroPackageJsonPath), binEntry);
    if (!fs.existsSync(cliPath)) {
      throw new Error(`astro cli not found at ${cliPath}`);
    }
    return cliPath;
  } catch {
    writeLog(logging, 'error', 'missing runtime dependency "astro". Reinstall package and retry.');
    process.exit(1);
  }
}

function resolveTsxLoader(logging) {
  try {
    const tsxPkg = require.resolve('tsx/package.json');
    const loaderPath = path.join(path.dirname(tsxPkg), 'dist', 'loader.mjs');
    if (fs.existsSync(loaderPath)) return loaderPath;
  } catch {
    // fall through to shared error handling below
  }
  writeLog(logging, 'error', 'missing runtime dependency "tsx". Reinstall package and retry.');
  process.exit(1);
}

function runNode(args, logging) {
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, DEELAN_PACKAGE_ROOT: ROOT }
  });

  if (result.error) {
    writeLog(logging, 'error', `command failed: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

function runTsScript(scriptPath, args = []) {
  const logging = resolveLogging(args);
  const tsxLoader = resolveTsxLoader(logging);
  const result = spawnSync(process.execPath, ['--import', tsxLoader, scriptPath, ...args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, DEELAN_PACKAGE_ROOT: ROOT }
  });
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
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

function runBuild(args, logging) {
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(`Deelan build

Runs the Deelan preflight pipeline then builds the static site.

Usage:
  deelan build [options]

Deelan-specific options:
  --include-subfolder <name>   Also include content/posts/<name>/ and content/snippets/<name>/ (repeatable)
  --log-level <level>          Log level: error, warn, info, debug (default: info)
  --log-file <path>            Write logs to file in addition to stdout

All other options are forwarded to \`astro build\`.

Examples:
  deelan build
  deelan build --include-subfolder drafts
` + '\n');
    process.exit(0);
  }

  const astroCli = resolveAstroCli(logging);
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
    runTsScript(path.join(ROOT, script), scriptArgs);
  }

  runNode([astroCli, 'build', ...astroArgs], logging);
}

function runServe(args, logging) {
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(`Deelan serve

Serves the built site for local preview.

Usage:
  deelan serve [options]

All options are forwarded to \`astro preview\`.

Examples:
  deelan serve
  deelan serve --port 4321
` + '\n');
    process.exit(0);
  }

  const astroCli = resolveAstroCli(logging);
  runNode([astroCli, 'preview', ...args], logging);
}

const argv = process.argv.slice(2);
const logging = resolveLogging(argv);
const command = argv[0];

if (!command || command === 'help' || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

if (command === 'version') {
  printVersion();
  process.exit(0);
}

if (command === 'build') {
  runBuild(argv.slice(1), logging);
}

if (command === 'serve') {
  runServe(argv.slice(1), logging);
}

const scriptPath = SCRIPT_MAP[command];
if (!scriptPath) {
  writeLog(logging, 'error', `unknown command "${command}"`);
  writeLog(logging, 'error', 'Run `deelan --help` for available commands.');
  process.exit(1);
}

runTsScript(scriptPath, argv.slice(1));
