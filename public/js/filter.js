import { parseQuery, evaluateQuery } from '/js/search-core.js';

export function initFilter(config) {
  const queryInput = document.querySelector(config.querySelector);
  const tagInput = config.tagSelector ? document.querySelector(config.tagSelector) : null;
  const fromInput = config.fromSelector ? document.querySelector(config.fromSelector) : null;
  const toInput = config.toSelector ? document.querySelector(config.toSelector) : null;
  const items = Array.from(document.querySelectorAll(config.itemSelector));
  const countEl = config.countSelector ? document.querySelector(config.countSelector) : null;

  function apply() {
    const parsed = parseQuery((queryInput ? queryInput.value : '').trim());

    if (tagInput && tagInput.value.trim()) {
      parsed.filters.tags.push(tagInput.value.trim().toLowerCase());
    }
    if (fromInput && fromInput.value) {
      parsed.filters.from = fromInput.value;
    }
    if (toInput && toInput.value) {
      parsed.filters.to = toInput.value;
    }

    let shown = 0;
    const visibleKeys = new Set();

    for (const item of items) {
      const target = {
        text: item.getAttribute('data-text') || '',
        tags: (item.getAttribute('data-tags') || '')
          .split(',')
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean),
        date: item.getAttribute('data-date') || null
      };

      const visible = evaluateQuery(parsed.expression, parsed.filters, target);
      item.style.display = visible ? '' : 'none';

      if (visible) {
        const key = item.getAttribute('data-key') || null;
        if (key) visibleKeys.add(key);
        else shown += 1;
      }
    }

    if (visibleKeys.size > 0) {
      shown = visibleKeys.size;
    }

    if (countEl) countEl.textContent = String(shown);
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
