import { parseQuery as parseQueryCore, validateQuery as validateQueryCore } from './search-core.js';

export type QueryOperator = '&' | '|';

export type QueryAst =
  | { type: 'term'; value: string }
  | { type: 'and'; left: QueryAst; right: QueryAst }
  | { type: 'or'; left: QueryAst; right: QueryAst };

export interface StructuredFilters {
  tags: string[];
  from: string | null;
  to: string | null;
  ids: string[];
}

export interface ParsedQuery {
  expression: QueryAst | null;
  filters: StructuredFilters;
}

export function parseQuery(raw: string): ParsedQuery {
  return parseQueryCore(raw) as ParsedQuery;
}

export interface QueryValidation {
  valid: boolean;
  error: string | null;
}

export function validateQuery(raw: string): QueryValidation {
  return validateQueryCore(raw) as QueryValidation;
}
