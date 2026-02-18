export type QueryOperator = '&' | '|';

export type QueryAst =
  | { type: 'term'; value: string }
  | { type: 'and'; left: QueryAst; right: QueryAst }
  | { type: 'or'; left: QueryAst; right: QueryAst };

export interface StructuredFilters {
  tags: string[];
  from: string | null;
  to: string | null;
}

export interface ParsedQuery {
  expression: QueryAst | null;
  filters: StructuredFilters;
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    if (ch === '&' || ch === '|' || ch === '(' || ch === ')') {
      tokens.push(ch);
      i += 1;
      continue;
    }

    if (ch === '"') {
      let j = i + 1;
      while (j < input.length && input[j] !== '"') j += 1;
      tokens.push(input.slice(i + 1, j));
      i = j < input.length ? j + 1 : j;
      continue;
    }

    let j = i;
    while (j < input.length && !/\s/.test(input[j]) && !['&', '|', '(', ')'].includes(input[j])) {
      j += 1;
    }
    tokens.push(input.slice(i, j));
    i = j;
  }

  return tokens;
}

class Parser {
  private readonly tokens: string[];
  private pos = 0;

  constructor(tokens: string[]) {
    this.tokens = tokens;
  }

  parse(): QueryAst | null {
    if (this.tokens.length === 0) return null;
    const ast = this.parseOr();
    return ast;
  }

  private parseOr(): QueryAst {
    let left = this.parseAnd();
    while (this.peek() === '|') {
      this.next();
      const right = this.parseAnd();
      left = { type: 'or', left, right };
    }
    return left;
  }

  private parseAnd(): QueryAst {
    let left = this.parsePrimary();
    while (this.peek() === '&') {
      this.next();
      const right = this.parsePrimary();
      left = { type: 'and', left, right };
    }
    return left;
  }

  private parsePrimary(): QueryAst {
    const token = this.peek();

    if (!token) {
      return { type: 'term', value: '' };
    }

    if (token === '(') {
      this.next();
      const inner = this.parseOr();
      if (this.peek() === ')') this.next();
      return inner;
    }

    if (token === ')' || token === '&' || token === '|') {
      this.next();
      return { type: 'term', value: '' };
    }

    this.next();
    return { type: 'term', value: token };
  }

  private peek(): string | null {
    return this.tokens[this.pos] ?? null;
  }

  private next(): string | null {
    const token = this.tokens[this.pos] ?? null;
    if (token !== null) this.pos += 1;
    return token;
  }
}

function extractStructuredFilters(raw: string): { textQuery: string; filters: StructuredFilters } {
  const filters: StructuredFilters = { tags: [], from: null, to: null };

  const parts = raw.split(/\s+/).filter(Boolean);
  const remaining: string[] = [];

  for (const part of parts) {
    if (part.startsWith('tag:')) {
      const value = part.slice(4).trim();
      if (value) filters.tags.push(value.toLowerCase());
      continue;
    }
    if (part.startsWith('from:')) {
      const value = part.slice(5).trim();
      if (value) filters.from = value;
      continue;
    }
    if (part.startsWith('to:')) {
      const value = part.slice(3).trim();
      if (value) filters.to = value;
      continue;
    }
    remaining.push(part);
  }

  return {
    textQuery: remaining.join(' '),
    filters
  };
}

export function parseQuery(raw: string): ParsedQuery {
  const { textQuery, filters } = extractStructuredFilters(raw.trim());
  const tokens = tokenize(textQuery);
  const parser = new Parser(tokens);
  return {
    expression: parser.parse(),
    filters
  };
}
