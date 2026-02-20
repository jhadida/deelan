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
