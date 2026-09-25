/**
 * KanbanFlow Board (#17) | Agile Board Engine
 * Native HTML5 drag & drop, dynamic swimlanes, priorities, tags,
 * due dates, search/filter, JSON backup and LocalStorage persistence.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'kanbanflow_board_v1';
  var COLORS = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#a78bfa', '#94a3b8'];

  // ---------- State ----------
  var board = loadBoard();
  var query = '', priorityFilter = 'all';
  var editingCardId = null, editingColId = null, pickedColor = COLORS[0];
  var dragCardId = null, menuColId = null;

  function uid(prefix) {
    return (prefix || 'id') + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  }
  function loadBoard() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var b = JSON.parse(raw);
        if (b && Array.isArray(b.columns)) return normalize(b);
      }
    } catch (e) {}
    return seedBoard();
  }
  function normalize(b) {
    b.columns = b.columns.filter(function (c) { return c && typeof c.title === 'string'; }).map(function (c) {
      return {
        id: c.id || uid('col'),
        title: String(c.title).slice(0, 40),
        color: c.color || COLORS[0],
        cards: Array.isArray(c.cards) ? c.cards.filter(function (k) { return k && typeof k.title === 'string'; }).map(function (k) {
          return {
            id: k.id || uid('card'),
            title: String(k.title).slice(0, 120),
            desc: typeof k.desc === 'string' ? k.desc.slice(0, 600) : '',
            priority: ['low', 'medium', 'high'].indexOf(k.priority) !== -1 ? k.priority : 'medium',
            tags: Array.isArray(k.tags) ? k.tags.slice(0, 6) : [],
            due: typeof k.due === 'string' ? k.due : '',
            createdAt: +k.createdAt || Date.now(),
          };
        }) : [],
      };
    });
    return b;
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(board)); } catch (e) {}
  }
  function seedBoard() {
    function d(offset) {
      return new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
    }
    var now = Date.now();
    return normalize({
      columns: [
        { id: 'col-backlog', title: 'Backlog', color: '#94a3b8', cards: [
          { id: uid('card'), title: 'Design landing page hero', desc: 'New gradient hero with product screenshot and CTA buttons.', priority: 'medium', tags: ['design'], due: d(6), createdAt: now - 500000 },
          { id: uid('card'), title: 'Research OAuth providers', desc: 'Compare Auth0 vs Clerk vs custom JWT.', priority: 'low', tags: ['research'], due: '', createdAt: now - 400000 },
        ]},
        { id: 'col-progress', title: 'In Progress', color: '#38bdf8', cards: [
          { id: uid('card'), title: 'Implement login API', desc: 'POST /api/auth/login with rate limiting and JWT refresh rotation.', priority: 'high', tags: ['backend', 'api'], due: d(1), createdAt: now - 300000 },
        ]},
        { id: 'col-review', title: 'In Review', color: '#f59e0b', cards: [
          { id: uid('card'), title: 'PR #248: cart checkout flow', desc: 'Needs 2 approvals. Check edge case: empty cart + coupon.', priority: 'medium', tags: ['frontend'], due: d(2), createdAt: now - 200000 },
        ]},
        { id: 'col-done', title: 'Done', color: '#10b981', cards: [
          { id: uid('card'), title: 'Setup CI pipeline', desc: 'GitHub Actions: lint + test + build on every PR.', priority: 'medium', tags: ['devops'], due: '', createdAt: now - 900000 },
        ]},
      ],
    });
  }

  // ---------- DOM ----------
  function $(id) { return document.getElementById(id); }
  var boardEl = $('board'), searchInput = $('searchInput'), filterPriority = $('filterPriority');
  var progressFill = $('progressFill'), progressLabel = $('progressLabel');
  var cardModal = $('cardModal'), cardModalTitle = $('cardModalTitle');
  var cardTitle = $('cardTitle'), cardDesc = $('cardDesc'), cardColumn = $('cardColumn');
  var cardPriority = $('cardPriority'), cardTags = $('cardTags'), cardDue = $('cardDue');
  var btnDeleteCard = $('btnDeleteCard');
  var colModal = $('colModal'), colModalTitle = $('colModalTitle'), colTitle = $('colTitle'), colorPick = $('colorPick');
  var colMenu = $('colMenu');
  var toasts = $('toastContainer');

  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    toasts.appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isOverdue(due) {
    if (!due) return false;
    var t = new Date(); t.setHours(0, 0, 0, 0);
    return new Date(due + 'T00:00:00') < t;
  }
  function fmtDue(due) {
    if (!due) return '';
    return new Date(due + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // ---------- Queries ----------
  function findCol(id) {
    for (var i = 0; i < board.columns.length; i++) if (board.columns[i].id === id) return board.columns[i];
    return null;
  }
  function findCard(id) {
    for (var i = 0; i < board.columns.length; i++) {
      var cards = board.columns[i].cards;
      for (var j = 0; j < cards.length; j++) {
        if (cards[j].id === id) return { col: board.columns[i], card: cards[j], index: j };
      }
    }
    return null;
  }
  function cardVisible(card) {
    if (priorityFilter !== 'all' && card.priority !== priorityFilter) return false;
    var q = query.trim().toLowerCase();
    if (q) {
      var hay = (card.title + ' ' + card.desc + ' ' + card.tags.join(' ')).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  // ---------- Render ----------
  function render() {
    boardEl.innerHTML = '';
    var total = 0, done = 0;
    board.columns.forEach(function (col, colIdx) {
      total += col.cards.length;
      if (/done|complete/i.test(col.title)) done += col.cards.length;

      var colEl = document.createElement('div');
      colEl.className = 'column';
      colEl.style.setProperty('--col-color', col.color);
      colEl.dataset.colId = col.id;

      var head = document.createElement('div');
      head.className = 'col-head';
      head.innerHTML =
        '<span class="col-dot"></span>' +
        '<span class="col-title" title="' + esc(col.title) + '">' + esc(col.title) + '</span>' +
        '<span class="col-count">' + col.cards.length + '</span>' +
        '<button class="col-menu-btn" data-menu="' + col.id + '" title="Column options">⋮</button>';
      colEl.appendChild(head);

      var list = document.createElement('div');
      list.className = 'card-list';
      list.dataset.colId = col.id;

      col.cards.forEach(function (card) {
        if (!cardVisible(card)) return;
        var el = document.createElement('article');
        el.className = 'kb-card pri-' + card.priority;
        el.draggable = true;
        el.dataset.cardId = card.id;
        var overdue = isOverdue(card.due);
        el.innerHTML =
          '<div class="kb-card-top">' +
            '<span class="pri-badge ' + card.priority + '">' + card.priority + '</span>' +
            (card.due ? '<span class="due-chip' + (overdue ? ' overdue' : '') + '">📅 ' + esc(fmtDue(card.due)) + '</span>' : '') +
          '</div>' +
          '<div class="kb-card-title">' + esc(card.title) + '</div>' +
          (card.desc ? '<div class="kb-card-desc">' + esc(card.desc) + '</div>' : '') +
          (card.tags.length ? '<div class="kb-tags">' + card.tags.map(function (t) { return '<span class="kb-tag">#' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
          '<div class="kb-card-foot">' +
            '<span class="kb-date">' + new Date(card.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + '</span>' +
            '<span class="kb-mini-actions">' +
              (colIdx > 0 ? '<button class="kb-mini" data-move="left" title="Move left">◀</button>' : '') +
              (colIdx < board.columns.length - 1 ? '<button class="kb-mini" data-move="right" title="Move right">▶</button>' : '') +
              '<button class="kb-mini" data-edit title="Edit card">✏️</button>' +
            '</span>' +
          '</div>';
        list.appendChild(el);
      });

      var addBtn = document.createElement('button');
      addBtn.className = 'add-card-btn';
      addBtn.textContent = '＋ Add card';
      addBtn.dataset.addTo = col.id;

      colEl.appendChild(list);
      colEl.appendChild(addBtn);
      boardEl.appendChild(colEl);
    });

    var pct = total === 0 ? 0 : Math.round((done / total) * 100);
    progressFill.style.width = pct + '%';
    progressLabel.textContent = pct + '% • ' + done + '/' + total;
  }

  // ---------- Card modal ----------
  function fillColumnOptions(selectedId) {
    cardColumn.innerHTML = '';
    board.columns.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.title;
      if (c.id === selectedId) o.selected = true;
      cardColumn.appendChild(o);
    });
  }
  function openNewCard(colId) {
    editingCardId = null;
    cardModalTitle.textContent = '＋ New Card';
    cardTitle.value = ''; cardDesc.value = ''; cardTags.value = ''; cardDue.value = '';
    cardPriority.value = 'medium';
    fillColumnOptions(colId || (board.columns[0] && board.columns[0].id));
    btnDeleteCard.classList.add('hidden');
    cardModal.classList.remove('hidden');
    setTimeout(function () { cardTitle.focus(); }, 50);
  }
  function openEditCard(id) {
    var found = findCard(id);
    if (!found) return;
    editingCardId = id;
    cardModalTitle.textContent = '✏️ Edit Card';
    cardTitle.value = found.card.title;
    cardDesc.value = found.card.desc;
    cardPriority.value = found.card.priority;
    cardTags.value = found.card.tags.join(', ');
    cardDue.value = found.card.due || '';
    fillColumnOptions(found.col.id);
    btnDeleteCard.classList.remove('hidden');
    cardModal.classList.remove('hidden');
    setTimeout(function () { cardTitle.focus(); cardTitle.select(); }, 50);
  }
  function closeCard() { cardModal.classList.add('hidden'); editingCardId = null; }
  function saveCard() {
    var title = cardTitle.value.trim();
    if (!title) { toast('Card title is required', 'error'); cardTitle.focus(); return; }
    var tags = cardTags.value.split(',').map(function (t) { return t.trim().replace(/^#/, ''); }).filter(Boolean).slice(0, 6);
    var data = {
      title: title, desc: cardDesc.value.trim(),
      priority: cardPriority.value, tags: tags, due: cardDue.value || '',
    };
    if (editingCardId) {
      var found = findCard(editingCardId);
      if (!found) { closeCard(); return; }
      for (var k in data) found.card[k] = data[k];
      if (found.col.id !== cardColumn.value) {
        found.col.cards.splice(found.index, 1);
        var dest = findCol(cardColumn.value);
        if (dest) dest.cards.push(found.card);
      }
      toast('Card updated ✓', 'success');
    } else {
      var col = findCol(cardColumn.value) || board.columns[0];
      if (!col) { toast('Create a column first', 'error'); return; }
      data.id = uid('card');
      data.createdAt = Date.now();
      col.cards.push(data);
      toast('Card added ✓', 'success');
    }
    save(); render(); closeCard();
  }

  // ---------- Column modal ----------
  function buildColorPick() {
    colorPick.innerHTML = '';
    COLORS.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'color-dot' + (c === pickedColor ? ' sel' : '');
      b.style.background = c;
      b.dataset.color = c;
      b.title = c;
      colorPick.appendChild(b);
    });
  }
  function openNewColumn() {
    editingColId = null;
    colModalTitle.textContent = '＋ New Column';
    colTitle.value = '';
    pickedColor = COLORS[board.columns.length % COLORS.length];
    buildColorPick();
    colModal.classList.remove('hidden');
    setTimeout(function () { colTitle.focus(); }, 50);
  }
  function openRenameColumn(id) {
    var col = findCol(id);
    if (!col) return;
    editingColId = id;
    colModalTitle.textContent = '✏️ Rename Column';
    colTitle.value = col.title;
    pickedColor = col.color;
    buildColorPick();
    colModal.classList.remove('hidden');
    setTimeout(function () { colTitle.focus(); colTitle.select(); }, 50);
  }
  function closeCol() { colModal.classList.add('hidden'); editingColId = null; }
  function saveColumn() {
    var title = colTitle.value.trim();
    if (!title) { toast('Column title is required', 'error'); colTitle.focus(); return; }
    if (editingColId) {
      var col = findCol(editingColId);
      if (col) { col.title = title; col.color = pickedColor; }
      toast('Column updated ✓', 'success');
    } else {
      board.columns.push({ id: uid('col'), title: title, color: pickedColor, cards: [] });
      toast('Column added ✓', 'success');
    }
    save(); render(); closeCol();
  }

  // ---------- Column menu ----------
  function openMenu(colId, anchor) {
    menuColId = colId;
    var r = anchor.getBoundingClientRect();
    colMenu.classList.remove('hidden');
    var mw = 180;
    colMenu.style.left = Math.min(window.innerWidth - mw - 12, r.left - mw + r.width) + 'px';
    colMenu.style.top = (r.bottom + 6) + 'px';
  }
  function closeMenu() { colMenu.classList.add('hidden'); menuColId = null; }

  // ---------- Import / Export ----------
  function exportBoard() {
    var blob = new Blob([JSON.stringify(board, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kanbanflow-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('Board exported ✓', 'success');
  }
  function importBoard(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.columns)) throw new Error('bad');
        board = normalize(data);
        if (!board.columns.length) throw new Error('empty');
        save(); render();
        toast('Board imported ✓', 'success');
      } catch (e) { toast('Invalid board backup file', 'error'); }
      $('importFile').value = '';
    };
    reader.readAsText(file);
  }

  // ---------- Drag & Drop ----------
  function cardAfter(list, y) {
    var els = list.querySelectorAll('.kb-card:not(.dragging)');
    var closest = null, closestOffset = Number.NEGATIVE_INFINITY;
    for (var i = 0; i < els.length; i++) {
      var box = els[i].getBoundingClientRect();
      var offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closestOffset) { closestOffset = offset; closest = els[i]; }
    }
    return closest;
  }

  boardEl.addEventListener('dragstart', function (e) {
    var card = e.target.closest('.kb-card');
    if (!card) return;
    dragCardId = card.dataset.cardId;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', dragCardId); } catch (err) {}
  });
  boardEl.addEventListener('dragend', function () {
    dragCardId = null;
    var d = boardEl.querySelector('.dragging');
    if (d) d.classList.remove('dragging');
    var lists = boardEl.querySelectorAll('.card-list');
    for (var i = 0; i < lists.length; i++) lists[i].classList.remove('drag-over');
    var hints = boardEl.querySelectorAll('.drop-hint');
    for (var j = 0; j < hints.length; j++) hints[j].remove();
  });
  boardEl.addEventListener('dragover', function (e) {
    var list = e.target.closest('.card-list');
    if (!list || !dragCardId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    var lists = boardEl.querySelectorAll('.card-list');
    for (var i = 0; i < lists.length; i++) lists[i].classList.remove('drag-over');
    list.classList.add('drag-over');
  });
  boardEl.addEventListener('drop', function (e) {
    var list = e.target.closest('.card-list');
    if (!list || !dragCardId) return;
    e.preventDefault();
    var found = findCard(dragCardId);
    if (!found) return;
    var destCol = findCol(list.dataset.colId);
    if (!destCol) return;
    // Determine insert index from DOM order
    var afterEl = cardAfter(list, e.clientY);
    found.col.cards.splice(found.index, 1);
    var insertIdx = afterEl ? destCol.cards.findIndex(function (c) { return c.id === afterEl.dataset.cardId; }) : destCol.cards.length;
    if (insertIdx === -1) insertIdx = destCol.cards.length;
    // Account for same-column removal shifting
    destCol.cards.splice(insertIdx, 0, found.card);
    save(); render();
    toast('Card moved → ' + destCol.title, 'success');
  });

  // ---------- Board clicks (delegation) ----------
  boardEl.addEventListener('click', function (e) {
    var menuBtn = e.target.closest('[data-menu]');
    if (menuBtn) { e.stopPropagation(); openMenu(menuBtn.dataset.menu, menuBtn); return; }

    var addBtn = e.target.closest('[data-add-to]');
    if (addBtn) { openNewCard(addBtn.dataset.addTo); return; }

    var moveBtn = e.target.closest('[data-move]');
    if (moveBtn) {
      e.stopPropagation();
      var cardEl = e.target.closest('.kb-card');
      if (!cardEl) return;
      var found = findCard(cardEl.dataset.cardId);
      if (!found) return;
      var colIdx = 0;
      for (var i = 0; i < board.columns.length; i++) if (board.columns[i].id === found.col.id) colIdx = i;
      var target = moveBtn.dataset.move === 'left' ? colIdx - 1 : colIdx + 1;
      if (target < 0 || target >= board.columns.length) return;
      found.col.cards.splice(found.index, 1);
      board.columns[target].cards.push(found.card);
      save(); render();
      return;
    }

    var editBtn = e.target.closest('[data-edit]');
    if (editBtn) {
      e.stopPropagation();
      var cEl = e.target.closest('.kb-card');
      if (cEl) openEditCard(cEl.dataset.cardId);
      return;
    }

    var card = e.target.closest('.kb-card');
    if (card) openEditCard(card.dataset.cardId);
  });

  // ---------- Column menu actions ----------
  colMenu.addEventListener('click', function (e) {
    var b = e.target.closest('[data-colact]');
    if (!b || !menuColId) return;
    var col = findCol(menuColId);
    var act = b.dataset.colact;
    var idx = 0;
    for (var i = 0; i < board.columns.length; i++) if (board.columns[i].id === menuColId) idx = i;
    if (act === 'rename') { closeMenu(); openRenameColumn(menuColId); return; }
    if (!col) { closeMenu(); return; }
    if (act === 'left' && idx > 0) {
      board.columns.splice(idx, 1);
      board.columns.splice(idx - 1, 0, col);
      toast('Column moved left');
    } else if (act === 'right' && idx < board.columns.length - 1) {
      board.columns.splice(idx, 1);
      board.columns.splice(idx + 1, 0, col);
      toast('Column moved right');
    } else if (act === 'clear') {
      if (col.cards.length && confirm('Remove all cards in "' + col.title + '"?')) {
        col.cards = []; toast('Column cleared');
      }
    } else if (act === 'delete') {
      if (confirm('Delete column "' + col.title + '" and its ' + col.cards.length + ' card(s)?')) {
        board.columns.splice(idx, 1);
        toast('Column deleted', 'error');
      }
    }
    closeMenu();
    save(); render();
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#colMenu') && !e.target.closest('[data-menu]')) closeMenu();
  });

  // ---------- Wiring ----------
  searchInput.addEventListener('input', function () { query = searchInput.value; render(); });
  filterPriority.addEventListener('change', function () { priorityFilter = filterPriority.value; render(); });

  $('btnAddCard').addEventListener('click', function () { openNewCard(); });
  $('btnAddColumn').addEventListener('click', openNewColumn);
  $('btnSaveCard').addEventListener('click', saveCard);
  $('btnCancelCard').addEventListener('click', closeCard);
  $('btnCloseCard').addEventListener('click', closeCard);
  btnDeleteCard.addEventListener('click', function () {
    if (!editingCardId) return;
    var found = findCard(editingCardId);
    if (found) {
      found.col.cards.splice(found.index, 1);
      save(); render();
      toast('Card deleted', 'error');
    }
    closeCard();
  });
  cardModal.addEventListener('click', function (e) { if (e.target === cardModal) closeCard(); });

  $('btnSaveCol').addEventListener('click', saveColumn);
  $('btnCancelCol').addEventListener('click', closeCol);
  $('btnCloseCol').addEventListener('click', closeCol);
  colModal.addEventListener('click', function (e) { if (e.target === colModal) closeCol(); });
  colorPick.addEventListener('click', function (e) {
    var dot = e.target.closest('[data-color]');
    if (!dot) return;
    pickedColor = dot.dataset.color;
    var dots = colorPick.querySelectorAll('.color-dot');
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('sel', dots[i] === dot);
  });

  $('btnExport').addEventListener('click', exportBoard);
  $('btnImport').addEventListener('click', function () { $('importFile').click(); });
  $('importFile').addEventListener('change', function () { importBoard($('importFile').files[0]); });
  $('btnReset').addEventListener('click', function () {
    if (!confirm('Reset the board to sample data? Your current board will be replaced.')) return;
    board = seedBoard();
    save(); render();
    toast('Board reset to sample data', 'success');
  });

  window.addEventListener('keydown', function (e) {
    var typing = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) !== -1;
    if (e.key === 'Escape') { closeCard(); closeCol(); closeMenu(); }
    else if (e.key === '/' && !typing) { e.preventDefault(); searchInput.focus(); }
    else if ((e.key.toLowerCase() === 'n') && !typing) { openNewCard(); }
    else if ((e.key.toLowerCase() === 'c') && !typing) { openNewColumn(); }
    else if (e.key === 'Enter' && e.target === cardTitle) { saveCard(); }
    else if (e.key === 'Enter' && e.target === colTitle) { saveColumn(); }
  });

  // ---------- Init ----------
  render();
})();
