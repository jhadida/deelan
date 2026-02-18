import type { QueryAst, StructuredFilters } from './query-parser';

export interface QueryTarget {
  text: string;
  tags: string[];
  date: string | null;
}

function normalize(input: string): string {
  return input.toLowerCase();
}

function matchTag(query: string, tags: string[]): boolean {
  const q = normalize(query);

  if (q.endsWith('.*')) {
    const base = q.slice(0, -2);
    return tags.some((tag) => tag === base || tag.startsWith(base + '.'));
  }

  return tags.includes(q);
}

function matchDate(filters: StructuredFilters, date: string | null): boolean {
  if (!filters.from && !filters.to) return true;
  if (!date) return false;

  const value = Date.parse(date);
  if (!Number.isFinite(value)) return false;

  if (filters.from) {
    const from = Date.parse(filters.from);
    if (Number.isFinite(from) && value < from) return false;
  }

  if (filters.to) {
    const to = Date.parse(`${filters.to}T23:59:59.999`);
    if (Number.isFinite(to) && value > to) return false;
  }

  return true;
}

export function evaluateExpression(ast: QueryAst | null, text: string): boolean {
  if (!ast) return true;

  const haystack = normalize(text);

  switch (ast.type) {
    case 'term':
      return ast.value.trim().length === 0 || haystack.includes(normalize(ast.value));
    case 'and':
      return evaluateExpression(ast.left, haystack) && evaluateExpression(ast.right, haystack);
    case 'or':
      return evaluateExpression(ast.left, haystack) || evaluateExpression(ast.right, haystack);
  }
}

export function matchesFilters(filters: StructuredFilters, tags: string[], date: string | null): boolean {
  const normalizedTags = tags.map(normalize);
  const tagsOk = filters.tags.every((queryTag) => matchTag(queryTag, normalizedTags));
  if (!tagsOk) return false;
  return matchDate(filters, date);
}

export function evaluateQuery(
  ast: QueryAst | null,
  filters: StructuredFilters,
  target: QueryTarget
): boolean {
  return evaluateExpression(ast, target.text) && matchesFilters(filters, target.tags, target.date);
}
