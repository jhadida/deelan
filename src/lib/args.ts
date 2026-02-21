function flagNameToToken(name: string): string {
  const trimmed = name.trim();
  return trimmed.startsWith('--') ? trimmed : `--${trimmed}`;
}

export function getFlagValues(argv: string[], name: string): string[] {
  const token = flagNameToToken(name);
  const equalsPrefix = `${token}=`;
  const values: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] ?? '';
    if (arg === token) {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        values.push(next);
        i += 1;
      }
      continue;
    }

    if (arg.startsWith(equalsPrefix)) {
      const value = arg.slice(equalsPrefix.length);
      if (value) values.push(value);
    }
  }

  return values;
}

export function getLastFlagValue(argv: string[], name: string): string | null {
  const values = getFlagValues(argv, name);
  if (values.length === 0) return null;
  return values[values.length - 1] ?? null;
}

export function hasFlag(argv: string[], name: string): boolean {
  const token = flagNameToToken(name);
  const equalsPrefix = `${token}=`;
  return argv.some((arg) => arg === token || arg.startsWith(equalsPrefix));
}

export interface ParsedCliArgs {
  flags: Map<string, string[]>;
  positionals: string[];
}

export function parseCliArgs(argv: string[]): ParsedCliArgs {
  const flags = new Map<string, string[]>();
  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i] ?? '';
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }

    if (token === '--') {
      for (let j = i + 1; j < argv.length; j += 1) {
        positionals.push(argv[j] ?? '');
      }
      break;
    }

    const eqIndex = token.indexOf('=');
    let key = token.slice(2);
    let value: string | null = null;

    if (eqIndex >= 0) {
      key = token.slice(2, eqIndex);
      value = token.slice(eqIndex + 1);
    } else {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        value = next;
        i += 1;
      }
    }

    const list = flags.get(key) ?? [];
    list.push(value ?? 'true');
    flags.set(key, list);
  }

  return { flags, positionals };
}

export function hasParsedFlag(flags: Map<string, string[]>, key: string): boolean {
  return flags.has(key);
}

export function getParsedFlagValues(flags: Map<string, string[]>, key: string): string[] {
  return [...(flags.get(key) ?? [])];
}

export function getParsedFlagValue(flags: Map<string, string[]>, key: string): string | null {
  const values = flags.get(key);
  if (!values || values.length === 0) return null;
  return values[values.length - 1] ?? null;
}

export function getParsedBoolFlag(flags: Map<string, string[]>, key: string): boolean {
  if (!flags.has(key)) return false;
  const value = getParsedFlagValue(flags, key);
  if (value === null) return true;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return true;
}

export function getParsedNumberFlag(flags: Map<string, string[]>, key: string): number | null {
  const value = getParsedFlagValue(flags, key);
  if (value === null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function hasHelpFlag(argv: string[]): boolean {
  return argv.includes('--help') || argv.includes('-h');
}

function normalizeSubfolder(input: string): string | null {
  const normalized = input.replaceAll('\\', '/').trim().replace(/^\/+|\/+$/g, '');
  if (!normalized) return null;
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.some((part) => part === '.' || part === '..')) return null;
  return parts.join('/');
}

export function getIncludedSubfolders(argv: string[], env: NodeJS.ProcessEnv = process.env): string[] {
  const selected = new Set<string>();

  for (const value of getFlagValues(argv, '--include-subfolder')) {
    const normalized = normalizeSubfolder(value);
    if (normalized) selected.add(normalized);
  }

  const envRaw = env.DEELAN_INCLUDE_SUBFOLDERS ?? '';
  for (const value of envRaw.split(',')) {
    const normalized = normalizeSubfolder(value);
    if (normalized) selected.add(normalized);
  }

  return Array.from(selected).sort((a, b) => a.localeCompare(b));
}
