import { filterItems, validateQuery } from '/js/search-core.js';

export function initFilter(config) {
  const queryInput = document.querySelector(config.querySelector);
  const items = Array.from(document.querySelectorAll(config.itemSelector));
  const countEl = config.countSelector ? document.querySelector(config.countSelector) : null;

  // Build item data array from DOM once at init
  const itemData = items.map((el) => ({
    id: el.getAttribute('data-id') || '',
    text: el.getAttribute('data-text') || '',
    tags: (el.getAttribute('data-tags') || '')
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean),
    date: el.getAttribute('data-date') || null,
    title: el.getAttribute('data-title') || ''
  }));

  const triggerBtn = queryInput
    ? queryInput.closest('.search-panel')?.querySelector('.search-trigger-btn')
    : null;

  function apply() {
    const raw = queryInput ? queryInput.value.trim() : '';
    const { visibleIds, valid, error } = filterItems(itemData, raw);

    if (!valid) {
      console.warn(`[search] Invalid query: ${error}`);
    }

    if (queryInput) {
      if (!valid && raw.length > 0) {
        queryInput.setAttribute('aria-invalid', 'true');
      } else {
        queryInput.removeAttribute('aria-invalid');
      }
    }

    // On invalid query fall back to showing all items
    let shown = 0;
    const visibleKeys = new Set();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const id = itemData[i].id;
      const visible = !valid || visibleIds.has(id);
      item.style.display = visible ? '' : 'none';

      if (visible) {
        if (id) visibleKeys.add(id);
        else shown++;
      }
    }

    if (visibleKeys.size > 0) shown = visibleKeys.size;
    if (countEl) countEl.textContent = String(shown);

    if (typeof config.onAfterApply === 'function') {
      config.onAfterApply({ shown, visibleKeys });
    }
  }

  function applyWithFeedback() {
    apply();
    if (queryInput && queryInput.getAttribute('aria-invalid') === 'true') {
      if (typeof window.showToast === 'function') window.showToast('Invalid query.');
    }
  }

  if (queryInput) {
    queryInput.addEventListener('input', apply);
    queryInput.addEventListener('change', apply);
    queryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyWithFeedback();
      }
    });
  }

  if (triggerBtn) {
    triggerBtn.addEventListener('click', applyWithFeedback);
  }

  apply();

  return { apply };
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
  const detailDescription = document.querySelector(config.detailNotesSelector);
  const detailContent = document.querySelector(config.detailContentSelector);
  const detailRelated = document.querySelector(config.detailRelatedSelector);
  if (!list || !detailTitle || !detailMeta || !detailContent || !detailRelated) return;

  const itemButtons = Array.from(list.querySelectorAll('[data-snippet-key]'));
  const detailMap = new Map();
  let selectedKey = null;
  if (payloadRoot) {
    const payloads = payloadRoot.querySelectorAll('[data-snippet-payload]');
    for (const payload of payloads) {
      const key = payload.getAttribute('data-snippet-payload');
      if (!key) continue;
      const htmlNode = payload.querySelector('[data-snippet-html]');
      const descriptionNode = payload.querySelector('[data-snippet-description]');
      const relatedNode = payload.querySelector('[data-snippet-related]');
      detailMap.set(key, {
        title: payload.getAttribute('data-title') || key,
        href: payload.getAttribute('data-href') || `/view/${key}`,
        updated: payload.getAttribute('data-updated') || '',
        descriptionHtml: descriptionNode ? descriptionNode.innerHTML : '',
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
    selectedKey = key;
    detailTitle.innerHTML = '';
    const titleLink = document.createElement('a');
    titleLink.href = item.href;
    titleLink.target = '_blank';
    titleLink.rel = 'noopener noreferrer';
    titleLink.title = 'Open in new tab.';
    titleLink.textContent = item.title;
    detailTitle.appendChild(titleLink);

    detailMeta.innerHTML = '';
    const idLink = document.createElement('a');
    idLink.href = '#';
    idLink.className = 'copy-link';
    idLink.setAttribute('data-copy-link', '');
    idLink.setAttribute('data-copy-url', item.href);
    idLink.title = 'Copy permalink';
    idLink.textContent = key;
    detailMeta.appendChild(idLink);
    detailMeta.appendChild(document.createTextNode(` — Last updated: ${item.updated}`));
    if (detailDescription) {
      detailDescription.innerHTML = item.descriptionHtml;
      detailDescription.style.display = item.descriptionHtml ? '' : 'none';
    }
    detailContent.innerHTML = item.html;
    detailRelated.innerHTML = item.relatedHtml;
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      window.MathJax.typesetPromise([detailContent]).catch(() => {});
    }

    itemButtons.forEach((button) => {
      const selected = button.getAttribute('data-snippet-key') === key;
      button.setAttribute('aria-selected', String(selected));
      if (selected) {
        button.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function getVisibleButtons() {
    return itemButtons.filter((button) => {
      const listItem = button.closest('[data-snippet-item]');
      return !!listItem && listItem.style.display !== 'none';
    });
  }

  function stepSelection(delta) {
    const visible = getVisibleButtons();
    if (visible.length === 0) return;

    let index = visible.findIndex((button) => button.getAttribute('data-snippet-key') === selectedKey);
    if (index < 0) index = 0;
    const nextIndex = (index + delta + visible.length) % visible.length;
    const nextKey = visible[nextIndex]?.getAttribute('data-snippet-key');
    if (nextKey) renderByKey(nextKey);
  }

  function openSelectionInNewTab() {
    if (!selectedKey) return;
    const item = detailMap.get(selectedKey);
    if (!item) return;
    window.open(item.href, '_blank', 'noopener,noreferrer');
  }

  function copySelectionPermalink() {
    const copyLink = detailMeta.querySelector('[data-copy-link]');
    if (!(copyLink instanceof HTMLElement)) return;
    copyLink.click();
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
    const activeKey = selected ? selected.getAttribute('data-snippet-key') : null;
    if (activeKey && visibleKeys.has(activeKey)) return;
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
      if (detailDescription) {
        detailDescription.textContent = '';
        detailDescription.style.display = 'none';
      }
      detailContent.innerHTML = '<p class="muted">No matching snippets.</p>';
      detailRelated.innerHTML = '<p class="muted">No related items.</p>';
      selectedKey = null;
    }
  }

  function isTypingContext(target) {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isTypingContext(event.target)) return;

    const key = event.key.toLowerCase();

    if (event.key === 'ArrowDown' || key === 'j') {
      event.preventDefault();
      stepSelection(1);
      return;
    }

    if (event.key === 'ArrowUp' || key === 'k') {
      event.preventDefault();
      stepSelection(-1);
      return;
    }

    if (event.key === 'Enter' || key === 'o') {
      event.preventDefault();
      openSelectionInNewTab();
      return;
    }

    if (key === 'y') {
      event.preventDefault();
      copySelectionPermalink();
    }
  });

  const first = itemButtons[0];
  if (first) {
    const key = first.getAttribute('data-snippet-key');
    if (key) renderByKey(key);
  }

  return {
    ensureVisibleSelection
  };
}
