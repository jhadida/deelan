const ID_PATTERN = '(?:post|snippet)--[a-z0-9]+(?:-[a-z0-9]+)*';
const INTERNAL_LINK_REGEX = new RegExp(`\\[\\[(${ID_PATTERN})(?:\\|([^\\]]+))?\\]\\]`, 'g');

export function extractInternalLinks(markdown: string): string[] {
  const ids = new Set<string>();
  for (const match of markdown.matchAll(INTERNAL_LINK_REGEX)) {
    const id = match[1]?.trim();
    if (!id) continue;
    ids.add(id);
  }
  return Array.from(ids);
}

function escapeLabel(label: string): string {
  return label.replaceAll('[', '\\[').replaceAll(']', '\\]');
}

export function replaceInternalLinks(markdown: string): string {
  return markdown.replaceAll(INTERNAL_LINK_REGEX, (_full, id: string, label?: string) => {
    const display = label?.trim() || id;
    return `[${escapeLabel(display)}](/view/${id})`;
  });
}
