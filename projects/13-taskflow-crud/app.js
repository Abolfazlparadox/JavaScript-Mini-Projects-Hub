/**
 * TaskFlow Studio (#13) | Persistent CRUD Organizer Engine
 * Features: full CRUD, categories, priorities, due dates, search,
 * filters, sorting, batch actions, JSON import/export, LocalStorage.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'taskflow_tasks_v1';

  var CATEGORIES = {
    grocery: '🛒 Grocery',
    personal: '🙋 Personal',
    work: '💼 Work',
    health: '💪 Health',
    home: '🏠 Home',
    other: '📦 Other',
  };
  var PRIORITIES = { low: '🟢 Low', medium: '🟡 Medium', high: '🔴 High' };
  var PRI_RANK = { high: 3, medium: 2, low: 1 };

  // ---------- State ----------
  var state = {
    tasks: loadTasks(),
    status: 'all',
    category: 'all',
    query: '',
    sort: 'newest',
    editingId: null,
  };

  // ---------- DOM ----------
  function $(id) { return document.getElementById(id); }
  var els = {
    list: $('taskList'), empty: $('emptyState'),
    title: $('inputTitle'), category: $('inputCategory'), priority: $('inputPriority'), due: $('inputDue'),
    btnAdd: $('btnAdd'), search: $('searchInput'), pills: $('statusPills'),
    filterCat: $('filterCategory'), sort: $('sortSelect'),
    statTotal: $('statTotal'), statActive: $('statActive'), statDone: $('statDone'), statOverdue: $('statOverdue'),
    ring: $('progressRing'), ringPct: $('ringPct'), batchInfo: $('batchInfo'),
    btnCompleteAll: $('btnCompleteAll'), btnClearDone: $('btnClearDone'), btnClearAll: $('btnClearAll'),
    btnExport: $('btnExport'), btnImport: $('btnImport'), importFile: $('importFile'),
    editModal: $('editModal'), editTitle: $('editTitle'), editCategory: $('editCategory'),
    editPriority: $('editPriority'), editDue: $('editDue'), editDone: $('editDone'), editNotes: $('editNotes'),
    btnCloseEdit: $('btnCloseEdit'), btnCancelEdit: $('btnCancelEdit'),
    btnSaveEdit: $('btnSaveEdit'), btnDeleteTask: $('btnDeleteTask'),
    shortcutsModal: $('shortcutsModal'), btnShortcuts: $('btnShortcuts'),
    btnCloseShortcuts: $('btnCloseShortcuts'), toasts: $('toastContainer'),
  };

  // ---------- Persistence ----------
  function loadTasks() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedTasks();
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : seedTasks();
    } catch (e) { return seedTasks(); }
  }
  function saveTasks() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks)); } catch (e) {}
  }
  function seedTasks() {
    var today = new Date();
    function iso(offsetDays) {
      var d = new Date(today.getTime() + offsetDays * 86400000);
      return d.toISOString().slice(0, 10);
    }
    return [
      { id: uid(), title: 'Buy fresh vegetables & fruits', category: 'grocery', priority: 'high', due: iso(1), notes: 'Spinach, tomatoes, apples, bananas', completed: false, createdAt: Date.now() - 7200000, updatedAt: Date.now() - 7200000 },
      { id: uid(), title: 'Prepare sprint demo slides', category: 'work', priority: 'medium', due: iso(2), notes: '', completed: false, createdAt: Date.now() - 3600000, updatedAt: Date.now() - 3600000 },
      { id: uid(), title: 'Morning run — 5km', category: 'health', priority: 'low', due: iso(0), notes: '', completed: true, createdAt: Date.now() - 9000000, updatedAt: Date.now() - 4000000 },
    ];
  }
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  // ---------- Helpers ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isOverdue(t) {
    if (!t.due || t.completed) return false;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(t.due + 'T00:00:00') < today;
  }
  function fmtDue(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    els.toasts.appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }

  // ---------- Filtering / Sorting ----------
  function visibleTasks() {
    var q = state.query.trim().toLowerCase();
    var out = state.tasks.filter(function (t) {
      if (state.status === 'active' && t.completed) return false;
      if (state.status === 'completed' && !t.completed) return false;
      if (state.category !== 'all' && t.category !== state.category) return false;
      if (q) {
        var hay = (t.title + ' ' + (t.notes || '') + ' ' + (CATEGORIES[t.category] || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    out.sort(function (a, b) {
      switch (state.sort) {
        case 'oldest': return a.createdAt - b.createdAt;
        case 'priority': return (PRI_RANK[b.priority] || 0) - (PRI_RANK[a.priority] || 0) || b.createdAt - a.createdAt;
        case 'due':
          if (!a.due && !b.due) return b.createdAt - a.createdAt;
          if (!a.due) return 1; if (!b.due) return -1;
          return a.due < b.due ? -1 : a.due > b.due ? 1 : 0;
        case 'alpha': return a.title.localeCompare(b.title);
        default: return b.createdAt - a.createdAt;
      }
    });
    return out;
  }

  // ---------- Render ----------
  function render() {
    var tasks = visibleTasks();
    els.list.innerHTML = '';
    els.empty.classList.toggle('hidden', tasks.length > 0);

    tasks.forEach(function (t) {
      var li = document.createElement('li');
      li.className = 'task-item p-' + (t.priority || 'medium') + (t.completed ? ' completed' : '');
      li.dataset.id = t.id;
      var overdue = isOverdue(t);
      li.innerHTML =
        '<button class="task-check" data-act="toggle" title="Toggle complete">' + (t.completed ? '✓' : '') + '</button>' +
        '<div class="task-body">' +
          '<div class="task-title">' + esc(t.title) + '</div>' +
          '<div class="task-meta">' +
            '<span class="chip">' + esc(CATEGORIES[t.category] || t.category) + '</span>' +
            '<span class="chip pri-' + esc(t.priority) + '">' + esc(PRIORITIES[t.priority] || t.priority) + '</span>' +
            (t.due ? '<span class="chip' + (overdue ? ' overdue' : '') + '">📅 ' + esc(fmtDue(t.due)) + (overdue ? ' • overdue' : '') + '</span>' : '') +
            (t.notes ? '<span class="chip">📝 note</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="task-actions">' +
          '<button class="mini-btn" data-act="edit" title="Edit task">✏️</button>' +
          '<button class="mini-btn del" data-act="delete" title="Delete task">🗑</button>' +
        '</div>';
      els.list.appendChild(li);
    });

    renderStats();
  }

  function renderStats() {
    var total = state.tasks.length;
    var done = state.tasks.filter(function (t) { return t.completed; }).length;
    var active = total - done;
    var overdue = state.tasks.filter(isOverdue).length;
    els.statTotal.textContent = total;
    els.statActive.textContent = active;
    els.statDone.textContent = done;
    els.statOverdue.textContent = overdue;
    var pct = total === 0 ? 0 : Math.round((done / total) * 100);
    els.ringPct.textContent = pct + '%';
    var C = 238.76;
    els.ring.style.strokeDashoffset = String(C - (C * pct) / 100);
    var shown = visibleTasks().length;
    els.batchInfo.textContent = shown + ' shown • ' + total + ' total';
  }

  // ---------- CRUD ----------
  function addTask() {
    var title = els.title.value.trim();
    if (!title) { toast('Please enter a task title', 'error'); els.title.focus(); return; }
    state.tasks.unshift({
      id: uid(), title: title,
      category: els.category.value, priority: els.priority.value,
      due: els.due.value || '', notes: '',
      completed: false, createdAt: Date.now(), updatedAt: Date.now(),
    });
    els.title.value = ''; els.due.value = '';
    saveTasks(); render();
    toast('Task added ✓', 'success');
    els.title.focus();
  }
  function toggleTask(id) {
    var t = findTask(id); if (!t) return;
    t.completed = !t.completed; t.updatedAt = Date.now();
    saveTasks(); render();
  }
  function deleteTask(id) {
    state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
    saveTasks(); render();
    toast('Task deleted', 'error');
  }
  function findTask(id) {
    for (var i = 0; i < state.tasks.length; i++) if (state.tasks[i].id === id) return state.tasks[i];
    return null;
  }

  // ---------- Edit modal ----------
  function openEdit(id) {
    var t = findTask(id); if (!t) return;
    state.editingId = id;
    els.editTitle.value = t.title;
    els.editCategory.value = t.category;
    els.editPriority.value = t.priority;
    els.editDue.value = t.due || '';
    els.editDone.checked = !!t.completed;
    els.editNotes.value = t.notes || '';
    els.editModal.classList.remove('hidden');
    setTimeout(function () { els.editTitle.focus(); els.editTitle.select(); }, 50);
  }
  function closeEdit() { els.editModal.classList.add('hidden'); state.editingId = null; }
  function saveEdit() {
    var t = findTask(state.editingId); if (!t) { closeEdit(); return; }
    var title = els.editTitle.value.trim();
    if (!title) { toast('Title cannot be empty', 'error'); return; }
    t.title = title; t.category = els.editCategory.value;
    t.priority = els.editPriority.value; t.due = els.editDue.value || '';
    t.completed = els.editDone.checked; t.notes = els.editNotes.value.trim();
    t.updatedAt = Date.now();
    saveTasks(); render(); closeEdit();
    toast('Task updated ✓', 'success');
  }

  // ---------- Import / Export ----------
  function exportJSON() {
    if (!state.tasks.length) { toast('Nothing to export', 'error'); return; }
    var blob = new Blob([JSON.stringify(state.tasks, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'taskflow-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('Backup exported ✓', 'success');
  }
  function importJSON(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error('bad format');
        var valid = data.filter(function (t) { return t && typeof t.title === 'string'; }).map(function (t) {
          return {
            id: typeof t.id === 'string' ? t.id : uid(),
            title: String(t.title).slice(0, 120),
            category: CATEGORIES[t.category] ? t.category : 'other',
            priority: PRIORITIES[t.priority] ? t.priority : 'medium',
            due: typeof t.due === 'string' ? t.due : '',
            notes: typeof t.notes === 'string' ? t.notes.slice(0, 500) : '',
            completed: !!t.completed,
            createdAt: +t.createdAt || Date.now(), updatedAt: Date.now(),
          };
        });
        if (!valid.length) { toast('No valid tasks in file', 'error'); return; }
        var ids = {};
        state.tasks.forEach(function (t) { ids[t.id] = true; });
        valid.forEach(function (t) { if (ids[t.id]) t.id = uid(); });
        state.tasks = valid.concat(state.tasks);
        saveTasks(); render();
        toast('Imported ' + valid.length + ' tasks ✓', 'success');
      } catch (e) { toast('Invalid JSON backup file', 'error'); }
      els.importFile.value = '';
    };
    reader.readAsText(file);
  }

  // ---------- Events ----------
  els.btnAdd.addEventListener('click', addTask);
  els.title.addEventListener('keydown', function (e) { if (e.key === 'Enter') addTask(); });

  els.list.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var li = e.target.closest('.task-item');
    if (!li) return;
    var id = li.dataset.id;
    var act = btn.dataset.act;
    if (act === 'toggle') toggleTask(id);
    else if (act === 'edit') openEdit(id);
    else if (act === 'delete') deleteTask(id);
  });

  els.pills.addEventListener('click', function (e) {
    var b = e.target.closest('.pill'); if (!b) return;
    var btns = els.pills.querySelectorAll('.pill');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    b.classList.add('active');
    state.status = b.dataset.status;
    render();
  });
  els.search.addEventListener('input', function () { state.query = els.search.value; render(); });
  els.filterCat.addEventListener('change', function () { state.category = els.filterCat.value; render(); });
  els.sort.addEventListener('change', function () { state.sort = els.sort.value; render(); });

  els.btnCompleteAll.addEventListener('click', function () {
    if (!state.tasks.length) return;
    state.tasks.forEach(function (t) { t.completed = true; t.updatedAt = Date.now(); });
    saveTasks(); render(); toast('All tasks completed ✓', 'success');
  });
  els.btnClearDone.addEventListener('click', function () {
    var n = state.tasks.filter(function (t) { return t.completed; }).length;
    state.tasks = state.tasks.filter(function (t) { return !t.completed; });
    saveTasks(); render();
    toast(n ? 'Cleared ' + n + ' completed' : 'No completed tasks', n ? 'success' : 'error');
  });
  els.btnClearAll.addEventListener('click', function () {
    if (!state.tasks.length) return;
    if (!confirm('Delete ALL tasks? This cannot be undone.')) return;
    state.tasks = [];
    saveTasks(); render(); toast('All tasks deleted', 'error');
  });

  els.btnExport.addEventListener('click', exportJSON);
  els.btnImport.addEventListener('click', function () { els.importFile.click(); });
  els.importFile.addEventListener('change', function () { importJSON(els.importFile.files[0]); });

  els.btnSaveEdit.addEventListener('click', saveEdit);
  els.btnDeleteTask.addEventListener('click', function () {
    if (state.editingId) deleteTask(state.editingId);
    closeEdit();
  });
  els.btnCloseEdit.addEventListener('click', closeEdit);
  els.btnCancelEdit.addEventListener('click', closeEdit);
  els.editModal.addEventListener('click', function (e) { if (e.target === els.editModal) closeEdit(); });

  els.btnShortcuts.addEventListener('click', function () { els.shortcutsModal.classList.remove('hidden'); });
  els.btnCloseShortcuts.addEventListener('click', function () { els.shortcutsModal.classList.add('hidden'); });
  els.shortcutsModal.addEventListener('click', function (e) { if (e.target === els.shortcutsModal) els.shortcutsModal.classList.add('hidden'); });

  window.addEventListener('keydown', function (e) {
    var typing = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) !== -1;
    if (e.key === 'Escape') { closeEdit(); els.shortcutsModal.classList.add('hidden'); }
    else if (e.key === '/' && !typing) { e.preventDefault(); els.search.focus(); }
    else if (e.key === '?' && !typing) { els.shortcutsModal.classList.remove('hidden'); }
    else if (e.key === 'Enter' && e.target === els.editTitle) { saveEdit(); }
  });

  // ---------- Init ----------
  if (!els.due.value) { try { els.due.min = new Date().toISOString().slice(0, 10); } catch (e) {} }
  render();
})();
