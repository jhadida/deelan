const TAG_REGEX = /^[a-z0-9]+(\.[a-z0-9]+)*$/;

export function isValidTag(tag: string): boolean {
  return TAG_REGEX.test(tag);
}

export function ancestors(tag: string): string[] {
  const parts = tag.split('.');
  const out: string[] = [];
  for (let i = 1; i < parts.length; i += 1) {
    out.push(parts.slice(0, i).join('.'));
  }
  return out;
}

export function matchesTagPrefix(tag: string, query: string): boolean {
  if (!query.endsWith('.*')) return tag === query;
  const base = query.slice(0, -2);
  return tag === base || tag.startsWith(base + '.');
}
