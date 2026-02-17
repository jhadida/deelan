import type { QueryAst } from './query-parser';

export function evaluateQuery(ast: QueryAst, haystack: string): boolean {
  return haystack.toLowerCase().includes(ast.value.toLowerCase());
}
