import fs from 'node:fs/promises';
import path from 'node:path';

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function toPosixPath(input: string): string {
  return input.replaceAll('\\', '/');
}

export function resolvePackageRoot(root: string = process.cwd()): string | null {
  return process.env.DEELAN_PACKAGE_ROOT ? path.resolve(process.env.DEELAN_PACKAGE_ROOT) : null;
}

export function isLocalAssetReference(value: string): boolean {
  if (!value || value.startsWith('#')) return false;
  if (value.startsWith('/')) return false;
  if (value.startsWith('//')) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false;
  return true;
}

export function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function writeTextFile(filePath: string, value: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value, 'utf8');
}

export async function copyRelativeFile(params: {
  sourceRoot: string;
  targetRoot: string;
  relativePath: string;
}): Promise<boolean> {
  const src = path.join(params.sourceRoot, params.relativePath);
  if (!(await pathExists(src))) return false;

  const dst = path.join(params.targetRoot, params.relativePath);
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.copyFile(src, dst);
  return true;
}

export async function copyRelativeDir(params: {
  sourceRoot: string;
  targetRoot: string;
  relativePath: string;
}): Promise<boolean> {
  const src = path.join(params.sourceRoot, params.relativePath);
  if (!(await pathExists(src))) return false;

  const dst = path.join(params.targetRoot, params.relativePath);
  await fs.cp(src, dst, { recursive: true, force: true });
  return true;
}

export async function copyDirIfExists(src: string, dst: string): Promise<boolean> {
  if (!(await pathExists(src))) return false;
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.cp(src, dst, { recursive: true, force: true });
  return true;
}

export async function copyDirRecursive(
  src: string,
  dst: string,
  options?: { includeFile?: (fileName: string, absolutePath: string) => boolean }
): Promise<void> {
  await fs.mkdir(dst, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);

    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, dstPath, options);
      continue;
    }

    if (!entry.isFile()) continue;
    const include = options?.includeFile ? options.includeFile(entry.name, srcPath) : true;
    if (!include) continue;
    await fs.copyFile(srcPath, dstPath);
  }
}

export async function ensureEmptyOrForce(targetDir: string, force = false): Promise<void> {
  if (!(await pathExists(targetDir))) {
    await fs.mkdir(targetDir, { recursive: true });
    return;
  }

  const entries = await fs.readdir(targetDir);
  if (entries.length === 0 || force) return;

  throw new Error(`Target directory is not empty: ${targetDir}`);
}
