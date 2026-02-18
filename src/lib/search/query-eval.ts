import {
  evaluateExpression as evaluateExpressionCore,
  evaluateQuery as evaluateQueryCore,
  matchesFilters as matchesFiltersCore
} from './search-core.js';
import type { QueryAst, StructuredFilters } from './query-parser';

export interface QueryTarget {
  text: string;
  tags: string[];
  date: string | null;
}

export function evaluateExpression(ast: QueryAst | null, text: string): boolean {
  return evaluateExpressionCore(ast, text);
}

export function matchesFilters(filters: StructuredFilters, tags: string[], date: string | null): boolean {
  return matchesFiltersCore(filters, tags, date);
}

export function evaluateQuery(
  ast: QueryAst | null,
  filters: StructuredFilters,
  target: QueryTarget
): boolean {
  return evaluateQueryCore(ast, filters, target);
}
