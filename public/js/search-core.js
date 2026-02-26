function tokenize(input) {
  const tokens = [];
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

function extractStructuredFilters(raw) {
  const filters = { tags: [], from: null, to: null, titles: [] };

  const parts = raw.split(/\s+/).filter(Boolean);
  const remaining = [];

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
    if (part.startsWith('title:')) {
      const value = part.slice(6).trim();
      if (value) filters.titles.push(value.toLowerCase());
      continue;
    }
    remaining.push(part);
  }

  return {
    textQuery: remaining.join(' '),
    filters
  };
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  parse() {
    if (this.tokens.length === 0) return null;
    return this.parseOr();
  }

  parseOr() {
    let left = this.parseAnd();
    while (this.peek() === '|') {
      this.next();
      const right = this.parseAnd();
      left = { type: 'or', left, right };
    }
    return left;
  }

  parseAnd() {
    let left = this.parsePrimary();
    while (this.peek() === '&') {
      this.next();
      const right = this.parsePrimary();
      left = { type: 'and', left, right };
    }
    return left;
  }

  parsePrimary() {
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

  peek() {
    return this.tokens[this.pos] ?? null;
  }

  next() {
    const token = this.tokens[this.pos] ?? null;
    if (token !== null) this.pos += 1;
    return token;
  }
}

function normalize(input) {
  return input.toLowerCase();
}

function evaluateExpression(ast, text) {
  if (!ast) return true;
  const haystack = normalize(text);

  switch (ast.type) {
    case 'term':
      return ast.value.trim().length === 0 || haystack.includes(normalize(ast.value));
    case 'and':
      return evaluateExpression(ast.left, haystack) && evaluateExpression(ast.right, haystack);
    case 'or':
      return evaluateExpression(ast.left, haystack) || evaluateExpression(ast.right, haystack);
    default:
      return true;
  }
}

function matchTag(query, tags) {
  const q = normalize(query);

  if (q.endsWith('.*')) {
    const base = q.slice(0, -2);
    return tags.some((tag) => tag === base || tag.startsWith(base + '.'));
  }

  return tags.includes(q);
}

function matchDate(filters, date) {
  if (!filters.from && !filters.to) return true;
  if (!date) return false;

  const value = Date.parse(date);
  if (!Number.isFinite(value)) return false;

  if (filters.from) {
    const from = Date.parse(`${filters.from}T00:00:00.000Z`);
    if (Number.isFinite(from) && value < from) return false;
  }

  if (filters.to) {
    const to = Date.parse(`${filters.to}T23:59:59.999Z`);
    if (Number.isFinite(to) && value > to) return false;
  }

  return true;
}

function matchesFilters(filters, tags, date, title = '') {
  const normalizedTags = tags.map(normalize);
  const tagsOk = filters.tags.every((queryTag) => matchTag(queryTag, normalizedTags));
  if (!tagsOk) return false;
  const titleNorm = normalize(title);
  const titleOk = filters.titles.every((queryTitle) => titleNorm.includes(normalize(queryTitle)));
  if (!titleOk) return false;
  return matchDate(filters, date);
}

function evaluateQuery(expression, filters, target) {
  return (
    evaluateExpression(expression, target.text) &&
    matchesFilters(filters, target.tags, target.date, target.title || '')
  );
}

function parseQuery(raw) {
  const { textQuery, filters } = extractStructuredFilters(raw.trim());
  const tokens = tokenize(textQuery);
  const parser = new Parser(tokens);

  return {
    expression: parser.parse(),
    filters
  };
}

export {
  evaluateExpression,
  evaluateQuery,
  matchesFilters,
  parseQuery
};
