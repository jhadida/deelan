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

function applyFilter(filters, prefix, value) {
  switch (prefix) {
    case 'tag':   if (value) filters.tags.push(value.toLowerCase()); break;
    case 'from':  if (value) filters.from = value; break;
    case 'to':    if (value) filters.to = value; break;
    case 'title': if (value) filters.titles.push(value.toLowerCase()); break;
    case 'id':    if (value) filters.ids.push(value.toLowerCase()); break;
  }
}

function extractStructuredFilters(raw) {
  const filters = { tags: [], from: null, to: null, titles: [], ids: [] };

  // First pass: extract quoted values (e.g. title:"foo bar")
  let unquoted = raw.replace(/\b(tag|title|id|from|to):"([^"]*)"/g, (_, prefix, value) => {
    applyFilter(filters, prefix, value.trim());
    return '';
  });

  // Separate parentheses from adjacent tokens so filter prefixes are recognized
  unquoted = unquoted.replace(/([()])/g, ' $1 ');

  const parts = unquoted.split(/\s+/).filter(Boolean);
  const remaining = [];

  for (const part of parts) {
    if (part.startsWith('tag:')) {
      applyFilter(filters, 'tag', part.slice(4).trim());
      continue;
    }
    if (part.startsWith('from:')) {
      applyFilter(filters, 'from', part.slice(5).trim());
      continue;
    }
    if (part.startsWith('to:')) {
      applyFilter(filters, 'to', part.slice(3).trim());
      continue;
    }
    if (part.startsWith('title:')) {
      applyFilter(filters, 'title', part.slice(6).trim());
      continue;
    }
    if (part.startsWith('id:')) {
      applyFilter(filters, 'id', part.slice(3).trim());
      continue;
    }
    remaining.push(part);
  }

  // Clean operators and parens orphaned by filter extraction
  const ops = new Set(['&', '|']);
  let clean = remaining;
  let len;
  do {
    len = clean.length;
    clean = clean.filter((t, i, a) => {
      if (ops.has(t) && (!a[i - 1] || !a[i + 1] || a[i - 1] === '(' || a[i + 1] === ')' || ops.has(a[i - 1]))) return false;
      return true;
    });
    const tmp = [];
    for (let i = 0; i < clean.length; i++) {
      if (clean[i] === '(' && clean[i + 1] === ')') { i++; continue; }
      tmp.push(clean[i]);
    }
    clean = tmp;
  } while (clean.length < len);

  return {
    textQuery: clean.join(' '),
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

function matchesFilters(filters, tags, date, title = '', id = '') {
  const normalizedTags = tags.map(normalize);
  const tagsOk = filters.tags.every((queryTag) => matchTag(queryTag, normalizedTags));
  if (!tagsOk) return false;
  const titleNorm = normalize(title);
  const titleOk = filters.titles.every((queryTitle) => titleNorm.includes(normalize(queryTitle)));
  if (!titleOk) return false;
  const idNorm = normalize(id);
  const idOk = filters.ids.every((queryId) => idNorm.includes(normalize(queryId)));
  if (!idOk) return false;
  return matchDate(filters, date);
}

function evaluateQuery(expression, filters, target) {
  return (
    evaluateExpression(expression, target.text) &&
    matchesFilters(filters, target.tags, target.date, target.title || '', target.id || '')
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

function validateQuery(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return { valid: true, error: null };

  const { textQuery } = extractStructuredFilters(trimmed);
  const expr = textQuery.trim();
  if (!expr) return { valid: true, error: null };

  let depth = 0;
  for (const ch of expr) {
    if (ch === '(') {
      depth++;
    } else if (ch === ')') {
      depth--;
      if (depth < 0) return { valid: false, error: 'Unexpected )' };
    }
  }
  if (depth !== 0) return { valid: false, error: 'Unclosed (' };

  const tokens = tokenize(expr);
  if (tokens.length === 0) return { valid: true, error: null };

  const ops = new Set(['&', '|']);

  if (ops.has(tokens[0])) return { valid: false, error: `Cannot start with '${tokens[0]}'` };
  if (ops.has(tokens[tokens.length - 1])) return { valid: false, error: `Cannot end with '${tokens[tokens.length - 1]}'` };

  for (let i = 0; i < tokens.length - 1; i++) {
    const curr = tokens[i];
    const next = tokens[i + 1];
    if (ops.has(curr) && ops.has(next)) return { valid: false, error: `Consecutive operators: '${curr} ${next}'` };
    if (curr === '(' && ops.has(next)) return { valid: false, error: `Operator after '('` };
    if (ops.has(curr) && next === ')') return { valid: false, error: `Operator before ')'` };
    if (curr === '(' && next === ')') return { valid: false, error: 'Empty parentheses' };
  }

  return { valid: true, error: null };
}

function filterItems(items, queryString) {
  const raw = (queryString || '').trim();

  if (!raw) {
    return { visibleIds: new Set(items.map((item) => item.id)), valid: true, error: null };
  }

  const validation = validateQuery(raw);
  if (!validation.valid) {
    return { visibleIds: new Set(), valid: false, error: validation.error };
  }

  const { expression, filters } = parseQuery(raw);
  const visibleIds = new Set();

  for (const item of items) {
    if (evaluateQuery(expression, filters, item)) {
      visibleIds.add(item.id);
    }
  }

  return { visibleIds, valid: true, error: null };
}

export {
  evaluateExpression,
  evaluateQuery,
  filterItems,
  matchesFilters,
  parseQuery,
  validateQuery
};
