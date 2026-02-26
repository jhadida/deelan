#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseCliArgs } from '../src/lib/args';

function fail(message: string): never {
  console.error(`release: ${message}`);
  process.exit(1);
}

function run(cmd: string, args: string[], options?: { allowFailure?: boolean }): void {
  const rendered = [cmd, ...args].join(' ');
  console.log(`$ ${rendered}`);
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.status === 0) return;
  if (options?.allowFailure) return;
  fail(`command failed: ${rendered}`);
}

function renderCommand(cmd: string, args: string[]): string {
  return [cmd, ...args].join(' ');
}

function planOrRun(execute: boolean, cmd: string, args: string[]): void {
  const rendered = renderCommand(cmd, args);
  if (!execute) {
    console.log(`[dry-run] ${rendered}`);
    return;
  }
  run(cmd, args);
}

function capture(cmd: string, args: string[]): string {
  const result = spawnSync(cmd, args, { encoding: 'utf8' });
  if (result.status !== 0) fail(`command failed: ${[cmd, ...args].join(' ')}`);
  return result.stdout.trim();
}

function hasRemoteOrigin(): boolean {
  const result = spawnSync('git', ['remote', 'get-url', 'origin'], { stdio: 'ignore' });
  return result.status === 0;
}

interface Semver {
  major: number;
  minor: number;
  patch: number;
  prerelease: Array<number | string>;
}

function parseSemver(raw: string): Semver | null {
  const match =
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-.]+)?$/.exec(
      raw.trim()
    );
  if (!match) return null;
  const prerelease = (match[4] ?? '')
    .split('.')
    .filter(Boolean)
    .map((part) => (/^\d+$/.test(part) ? Number(part) : part));
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease
  };
}

function compareIdentifiers(a: number | string, b: number | string): number {
  const aNum = typeof a === 'number';
  const bNum = typeof b === 'number';
  if (aNum && bNum) return a - b;
  if (aNum && !bNum) return -1;
  if (!aNum && bNum) return 1;
  return String(a).localeCompare(String(b));
}

function compareSemver(a: Semver, b: Semver): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;

  const aPre = a.prerelease;
  const bPre = b.prerelease;
  if (aPre.length === 0 && bPre.length === 0) return 0;
  if (aPre.length === 0) return 1;
  if (bPre.length === 0) return -1;

  const max = Math.max(aPre.length, bPre.length);
  for (let i = 0; i < max; i += 1) {
    const av = aPre[i];
    const bv = bPre[i];
    if (av === undefined) return -1;
    if (bv === undefined) return 1;
    const cmp = compareIdentifiers(av, bv);
    if (cmp !== 0) return cmp;
  }
  return 0;
}

function readPackageVersion(): string {
  const raw = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8');
  const pkg = JSON.parse(raw) as { version?: unknown };
  if (typeof pkg.version !== 'string' || !pkg.version.trim()) {
    fail('package.json version is missing or invalid');
  }
  return pkg.version.trim();
}

function highestTaggedVersion(): string | null {
  const lines = capture('git', ['tag', '--list', 'v*'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let bestRaw: string | null = null;
  let bestParsed: Semver | null = null;
  for (const tag of lines) {
    const raw = tag.startsWith('v') ? tag.slice(1) : tag;
    const parsed = parseSemver(raw);
    if (!parsed) continue;
    if (!bestParsed || compareSemver(parsed, bestParsed) > 0) {
      bestParsed = parsed;
      bestRaw = raw;
    }
  }
  return bestRaw;
}

function printHelp(): void {
  console.log(`Usage:
  npm run release -- <version> [--execute] [--npm-tag <tag>] [--no-publish] [--no-push] [--allow-dirty]

Examples:
  npm run release -- 0.1.3
  npm run release -- 0.1.3 --execute
  npm run release -- 0.1.3 --execute --npm-tag alpha
  npm run release -- 0.1.3 --execute --no-publish --no-push

Notes:
  - Default mode is dry-run (safe): prints planned commands only.
  - Add --execute to actually run version/tag/publish/push commands.`);
}

function ensureCleanWorkingTree(allowDirty: boolean, reason: string): void {
  if (allowDirty) return;
  const dirty = capture('git', ['status', '--porcelain']);
  if (!dirty) return;
  fail(`working tree is not clean (${reason}); commit or stash changes first (or pass --allow-dirty)`);
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    return;
  }
  const { flags, positionals } = parseCliArgs(argv);
  const version = positionals[0] ?? '';
  if (!version) {
    printHelp();
    fail('missing required version argument');
  }

  const npmTag = (flags.get('npm-tag')?.at(-1) ?? 'latest').trim();
  const execute = flags.has('execute');
  const allowDirty = flags.has('allow-dirty');
  const shouldPublish = !flags.has('no-publish');
  const shouldPush = !flags.has('no-push');
  const targetSemver = parseSemver(version);
  if (!targetSemver) fail(`invalid semver version: ${version}`);

  ensureCleanWorkingTree(allowDirty, 'before release checks');

  const tagName = `v${version}`;
  const existingTag = capture('git', ['tag', '--list', tagName]);
  if (existingTag === tagName) {
    fail(`tag already exists: ${tagName}`);
  }
  const packageVersion = readPackageVersion();
  const packageSemver = parseSemver(packageVersion);
  if (!packageSemver) fail(`current package.json version is invalid semver: ${packageVersion}`);
  if (compareSemver(targetSemver, packageSemver) <= 0) {
    fail(`target version (${version}) must be greater than package.json version (${packageVersion})`);
  }
  const latestTag = highestTaggedVersion();
  if (latestTag) {
    const latestTagSemver = parseSemver(latestTag);
    if (latestTagSemver && compareSemver(targetSemver, latestTagSemver) <= 0) {
      fail(`target version (${version}) must be greater than latest git tag version (${latestTag})`);
    }
  }

  planOrRun(execute, 'npm', ['run', 'validate']);
  planOrRun(execute, 'npm', ['test']);
  planOrRun(execute, 'npm', ['run', 'build']);
  planOrRun(execute, 'npm', ['run', 'pack:dry-run']);
  ensureCleanWorkingTree(allowDirty, 'after release checks');

  planOrRun(execute, 'npm', ['version', version]);

  if (shouldPublish) {
    const publishArgs = ['publish'];
    if (npmTag && npmTag !== 'latest') publishArgs.push('--tag', npmTag);
    planOrRun(execute, 'npm', publishArgs);
  } else {
    console.log('release: skipping npm publish (--no-publish)');
  }

  if (shouldPush) {
    if (execute && !hasRemoteOrigin()) fail('git remote "origin" not configured; cannot push');
    planOrRun(execute, 'git', ['push']);
    planOrRun(execute, 'git', ['push', 'origin', tagName]);
  } else {
    console.log('release: skipping git push (--no-push)');
  }

  if (!execute) {
    console.log('release: dry-run complete. Re-run with --execute to perform these actions.');
    return;
  }
  console.log(`release: complete (${version})`);
}

main();
