import { parseQuery, evaluateQuery } from '/js/search-core.js';

export function initFilter(config) {
  const queryInput = document.querySelector(config.querySelector);
  const tagInput = config.tagSelector ? document.querySelector(config.tagSelector) : null;
  const titleInput = config.titleSelector ? document.querySelector(config.titleSelector) : null;
  const fromInput = config.fromSelector ? document.querySelector(config.fromSelector) : null;
  const toInput = config.toSelector ? document.querySelector(config.toSelector) : null;
  const items = Array.from(document.querySelectorAll(config.itemSelector));
  const countEl = config.countSelector ? document.querySelector(config.countSelector) : null;
  const simplePanel = config.simplePanelSelector ? document.querySelector(config.simplePanelSelector) : null;
  const advancedPanel = config.advancedPanelSelector
    ? document.querySelector(config.advancedPanelSelector)
    : null;
  const simpleTab = config.simpleTabSelector ? document.querySelector(config.simpleTabSelector) : null;
  const advancedTab = config.advancedTabSelector
    ? document.querySelector(config.advancedTabSelector)
    : null;
  const simpleModeInput = config.simpleModeSelector
    ? document.querySelector(config.simpleModeSelector)
    : null;
  const advancedModeInput = config.advancedModeSelector
    ? document.querySelector(config.advancedModeSelector)
    : null;

  function clearStructuredFilters(parsed) {
    parsed.filters.tags = [];
    parsed.filters.from = null;
    parsed.filters.to = null;
    parsed.filters.titles = [];
  }

  function detectMode() {
    return advancedModeInput && advancedModeInput.checked ? 'advanced' : 'simple';
  }

  function syncModeUI(mode) {
    if (simplePanel) {
      const isSimple = mode === 'simple';
      simplePanel.hidden = !isSimple;
      simplePanel.style.display = isSimple ? '' : 'none';
    }
    if (advancedPanel) {
      const isAdvanced = mode === 'advanced';
      advancedPanel.hidden = !isAdvanced;
      advancedPanel.style.display = isAdvanced ? '' : 'none';
    }
    if (simpleTab) simpleTab.setAttribute('aria-selected', String(mode === 'simple'));
    if (advancedTab) advancedTab.setAttribute('aria-selected', String(mode === 'advanced'));
    if (simpleModeInput) simpleModeInput.checked = mode === 'simple';
    if (advancedModeInput) advancedModeInput.checked = mode === 'advanced';
  }

  function apply() {
    const mode = detectMode();
    syncModeUI(mode);

    const parsed = parseQuery((queryInput ? queryInput.value : '').trim());

    if (mode === 'simple') {
      clearStructuredFilters(parsed);
      parsed.expression = null;

      if (tagInput && tagInput.value.trim()) {
        parsed.filters.tags.push(tagInput.value.trim().toLowerCase());
      }
      if (titleInput && titleInput.value.trim()) {
        parsed.filters.titles.push(titleInput.value.trim().toLowerCase());
      }
      if (fromInput && fromInput.value) {
        parsed.filters.from = fromInput.value;
      }
      if (toInput && toInput.value) {
        parsed.filters.to = toInput.value;
      }
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
        date: item.getAttribute('data-date') || null,
        title: item.getAttribute('data-title') || ''
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

    if (typeof config.onAfterApply === 'function') {
      config.onAfterApply({ shown, visibleKeys });
    }
  }

  [queryInput, tagInput, titleInput, fromInput, toInput].forEach((el) => {
    if (!el) return;
    el.addEventListener('input', apply);
    el.addEventListener('change', apply);
  });

  if (simpleTab && advancedTab) {
    simpleTab.addEventListener('click', apply);
    advancedTab.addEventListener('click', apply);
  }
  if (simpleModeInput && advancedModeInput) {
    simpleModeInput.addEventListener('change', apply);
    advancedModeInput.addEventListener('change', apply);
  }
  apply();

  return {
    apply
  };
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

export function initSnippetExplorer(config) {
  const list = document.querySelector(config.listSelector);
  const payloadRoot = config.payloadSelector ? document.querySelector(config.payloadSelector) : null;
  const detailTitle = document.querySelector(config.detailTitleSelector);
  const detailMeta = document.querySelector(config.detailMetaSelector);
  const detailNotes = document.querySelector(config.detailNotesSelector);
  const detailContent = document.querySelector(config.detailContentSelector);
  const detailRelated = document.querySelector(config.detailRelatedSelector);
  if (!list || !detailTitle || !detailMeta || !detailContent || !detailRelated) return;

  const itemButtons = Array.from(list.querySelectorAll('[data-snippet-key]'));
  const detailMap = new Map();
  if (payloadRoot) {
    const payloads = payloadRoot.querySelectorAll('[data-snippet-payload]');
    for (const payload of payloads) {
      const key = payload.getAttribute('data-snippet-payload');
      if (!key) continue;
      const htmlNode = payload.querySelector('[data-snippet-html]');
      const relatedNode = payload.querySelector('[data-snippet-related]');
      detailMap.set(key, {
        title: payload.getAttribute('data-title') || key,
        meta: payload.getAttribute('data-meta') || '',
        notes: payload.getAttribute('data-notes') || '',
        html: htmlNode ? htmlNode.innerHTML : '',
        relatedHtml: relatedNode
          ? relatedNode.innerHTML
          : '<p class="muted">No related items.</p>'
      });
    }
  }

  function renderByKey(key) {
    if (!detailMap.has(key)) return;
    const item = detailMap.get(key);
    if (!item) return;
    detailTitle.textContent = item.title;
    detailMeta.textContent = item.meta;
    if (detailNotes) {
      detailNotes.textContent = item.notes;
      detailNotes.style.display = item.notes ? '' : 'none';
    }
    detailContent.innerHTML = item.html;
    detailRelated.innerHTML = item.relatedHtml;
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      window.MathJax.typesetPromise([detailContent]).catch(() => {});
    }

    itemButtons.forEach((button) => {
      const selected = button.getAttribute('data-snippet-key') === key;
      button.setAttribute('aria-selected', String(selected));
    });
  }

  list.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest('[data-snippet-key]');
    if (!(button instanceof Element)) return;
    event.preventDefault();
    const key = button.getAttribute('data-snippet-key');
    if (key) renderByKey(key);
  });

  function ensureVisibleSelection(visibleKeys) {
    const selected = itemButtons.find((button) => button.getAttribute('aria-selected') === 'true');
    const selectedKey = selected ? selected.getAttribute('data-snippet-key') : null;
    if (selectedKey && visibleKeys.has(selectedKey)) return;
    const firstVisible = itemButtons.find((button) => {
      const listItem = button.closest('[data-snippet-item]');
      const key = button.getAttribute('data-snippet-key') || '';
      return !!listItem && listItem.style.display !== 'none' && visibleKeys.has(key);
    });
    if (firstVisible) {
      const key = firstVisible.getAttribute('data-snippet-key');
      if (key) renderByKey(key);
    } else {
      detailTitle.textContent = 'No snippet selected';
      detailMeta.textContent = '';
      if (detailNotes) {
        detailNotes.textContent = '';
        detailNotes.style.display = 'none';
      }
      detailContent.innerHTML = '<p class="muted">No matching snippets.</p>';
      detailRelated.innerHTML = '<p class="muted">No related items.</p>';
    }
  }

  const first = itemButtons[0];
  if (first) {
    const key = first.getAttribute('data-snippet-key');
    if (key) renderByKey(key);
  }

  return {
    ensureVisibleSelection
  };
}
