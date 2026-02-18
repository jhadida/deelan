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

function parseStructured(raw) {
  const tokens = raw.split(/\s+/).filter(Boolean);
  const filters = { tags: [], from: null, to: null };
  const rest = [];

  for (const token of tokens) {
    if (token.startsWith('tag:')) {
      const value = token.slice(4).trim();
      if (value) filters.tags.push(value.toLowerCase());
      continue;
    }
    if (token.startsWith('from:')) {
      const value = token.slice(5).trim();
      if (value) filters.from = value;
      continue;
    }
    if (token.startsWith('to:')) {
      const value = token.slice(3).trim();
      if (value) filters.to = value;
      continue;
    }
    rest.push(token);
  }

  return { text: rest.join(' '), filters };
}

function parseExpr(raw) {
  const tokens = tokenize(raw);
  let pos = 0;

  function peek() {
    return tokens[pos] ?? null;
  }

  function next() {
    const t = tokens[pos] ?? null;
    if (t !== null) pos += 1;
    return t;
  }

  function parseOr() {
    let left = parseAnd();
    while (peek() === '|') {
      next();
      left = { type: 'or', left, right: parseAnd() };
    }
    return left;
  }

  function parseAnd() {
    let left = parsePrimary();
    while (peek() === '&') {
      next();
      left = { type: 'and', left, right: parsePrimary() };
    }
    return left;
  }

  function parsePrimary() {
    const token = peek();
    if (!token) return null;

    if (token === '(') {
      next();
      const inner = parseOr();
      if (peek() === ')') next();
      return inner;
    }

    if (token === ')' || token === '&' || token === '|') {
      next();
      return null;
    }

    next();
    return { type: 'term', value: token.toLowerCase() };
  }

  return parseOr();
}

function evalExpr(ast, text) {
  if (!ast) return true;
  const hay = text.toLowerCase();

  if (ast.type === 'term') {
    return !ast.value || hay.includes(ast.value);
  }

  if (ast.type === 'and') {
    return evalExpr(ast.left, hay) && evalExpr(ast.right, hay);
  }

  return evalExpr(ast.left, hay) || evalExpr(ast.right, hay);
}

function matchesTag(queryTag, tags) {
  if (queryTag.endsWith('.*')) {
    const base = queryTag.slice(0, -2);
    return tags.some((tag) => tag === base || tag.startsWith(base + '.'));
  }
  return tags.includes(queryTag);
}

function matchesDate(filters, rawDate) {
  if (!filters.from && !filters.to) return true;
  if (!rawDate) return false;

  const value = Date.parse(rawDate);
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

export function initFilter(config) {
  const queryInput = document.querySelector(config.querySelector);
  const tagInput = config.tagSelector ? document.querySelector(config.tagSelector) : null;
  const fromInput = config.fromSelector ? document.querySelector(config.fromSelector) : null;
  const toInput = config.toSelector ? document.querySelector(config.toSelector) : null;
  const items = Array.from(document.querySelectorAll(config.itemSelector));
  const countEl = config.countSelector ? document.querySelector(config.countSelector) : null;

  function apply() {
    const textRaw = queryInput ? queryInput.value : '';
    const parsed = parseStructured(textRaw.trim());

    if (tagInput && tagInput.value.trim()) {
      parsed.filters.tags.push(tagInput.value.trim().toLowerCase());
    }
    if (fromInput && fromInput.value) {
      parsed.filters.from = fromInput.value;
    }
    if (toInput && toInput.value) {
      parsed.filters.to = toInput.value;
    }

    const ast = parseExpr(parsed.text);

    let shown = 0;
    const visibleKeys = new Set();
    for (const item of items) {
      const text = item.getAttribute('data-text') || '';
      const tags = (item.getAttribute('data-tags') || '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      const date = item.getAttribute('data-date') || null;

      const matchText = evalExpr(ast, text);
      const matchTags = parsed.filters.tags.every((tag) => matchesTag(tag, tags));
      const matchDateRange = matchesDate(parsed.filters, date);
      const visible = matchText && matchTags && matchDateRange;

      item.style.display = visible ? '' : 'none';
      if (visible) {
        const key = item.getAttribute('data-key') || null;
        if (key) {
          visibleKeys.add(key);
        } else {
          shown += 1;
        }
      }
    }

    if (visibleKeys.size > 0) {
      shown = visibleKeys.size;
    }

    if (countEl) {
      countEl.textContent = String(shown);
    }
  }

  [queryInput, tagInput, fromInput, toInput].forEach((el) => {
    if (!el) return;
    el.addEventListener('input', apply);
    el.addEventListener('change', apply);
  });

  apply();
}

export function initViewToggle(config) {
  const tableBtn = document.querySelector(config.tableButtonSelector);
  const listBtn = document.querySelector(config.listButtonSelector);
  const tableView = document.querySelector(config.tableSelector);
  const listView = document.querySelector(config.listSelector);

  if (!tableBtn || !listBtn || !tableView || !listView) return;

  function set(mode) {
    tableView.style.display = mode === 'table' ? '' : 'none';
    listView.style.display = mode === 'list' ? '' : 'none';
    tableBtn.setAttribute('aria-pressed', String(mode === 'table'));
    listBtn.setAttribute('aria-pressed', String(mode === 'list'));
  }

  tableBtn.addEventListener('click', () => set('table'));
  listBtn.addEventListener('click', () => set('list'));
  set('table');
}
