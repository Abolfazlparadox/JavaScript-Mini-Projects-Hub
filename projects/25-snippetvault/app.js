/**
 * SnippetVault (#25) | Code Snippet Manager Engine
 * CRUD vault with languages, tags, search, favorites,
 * copy-to-clipboard and JSON backup.
 */
(function () {
  'use strict';

  var LS_KEY = 'snippetvault_data_v1';
  var LANGS = ['JavaScript', 'Python', 'HTML', 'CSS', 'TypeScript', 'SQL', 'Bash', 'JSON', 'Other'];

  function $(id) { return document.getElementById(id); }
  var grid = $('snipGrid'), emptyState = $('emptyState'), countPill = $('countPill');
  var toasts = $('toastContainer');

  var snippets = load() || seed();
  var query = '', langFilter = 'all', favOnly = false, editingId = null;

  function load() { try { var r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(snippets)); } catch (e) {} }
  function uid() { return 's' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    toasts.appendChild(el);
    setTimeout(function () { el.remove(); }, 2000);
  }
  function seed() {
    return [
      { id: uid(), title: 'Debounce function', lang: 'JavaScript', desc: 'Delay execution until calls stop for N ms.', tags: ['utils', 'performance'], fav: true, createdAt: Date.now() - 80000,
        code: 'function debounce(fn, delay) {\n  let t;\n  return (...args) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...args), delay);\n  };\n}' },
      { id: uid(), title: 'Fetch with timeout', lang: 'JavaScript', desc: 'AbortController-based fetch timeout.', tags: ['fetch', 'async'], fav: false, createdAt: Date.now() - 70000,
        code: 'async function fetchTimeout(url, ms = 5000) {\n  const c = new AbortController();\n  const t = setTimeout(() => c.abort(), ms);\n  try {\n    return await fetch(url, { signal: c.signal });\n  } finally {\n    clearTimeout(t);\n  }\n}' },
      { id: uid(), title: 'Glass card CSS', lang: 'CSS', desc: 'Reusable glassmorphism card block.', tags: ['css', 'ui'], fav: true, createdAt: Date.now() - 60000,
        code: '.glass {\n  background: rgba(18, 24, 38, 0.72);\n  backdrop-filter: blur(20px);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 22px;\n}' },
      { id: uid(), title: 'Top-N per group (SQL)', lang: 'SQL', desc: 'Row-number window for top rows per group.', tags: ['sql', 'window'], fav: false, createdAt: Date.now() - 50000,
        code: 'SELECT * FROM (\n  SELECT o.*, ROW_NUMBER() OVER (\n    PARTITION BY customer_id ORDER BY total DESC\n  ) AS rn\n  FROM orders o\n) t WHERE rn <= 3;' },
    ];
  }

  function visible() {
    var q = query.trim().toLowerCase();
    return snippets.filter(function (s) {
      if (favOnly && !s.fav) return false;
      if (langFilter !== 'all' && s.lang !== langFilter) return false;
      if (q) {
        var hay = (s.title + ' ' + s.desc + ' ' + s.code + ' ' + s.tags.join(' ') + ' ' + s.lang).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort(function (a, b) { return b.createdAt - a.createdAt; });
  }

  function renderLangOptions() {
    var sel = $('filterLang');
    var used = {};
    snippets.forEach(function (s) { used[s.lang] = true; });
    sel.innerHTML = '<option value="all">All languages</option>';
    LANGS.forEach(function (l) {
      if (!used[l]) return;
      var o = document.createElement('option');
      o.value = l; o.textContent = l;
      if (l === langFilter) o.selected = true;
      sel.appendChild(o);
    });
    if (langFilter !== 'all' && !used[langFilter]) langFilter = 'all';
  }

  function render() {
    renderLangOptions();
    var list = visible();
    grid.innerHTML = '';
    emptyState.classList.toggle('hidden', list.length > 0);
    countPill.textContent = snippets.length + ' snippet' + (snippets.length === 1 ? '' : 's');
    list.forEach(function (s) {
      var card = document.createElement('article');
      card.className = 'snip-card';
      card.dataset.id = s.id;
      card.innerHTML =
        '<div class="snip-head"><div class="snip-title-row">' +
        '<span class="snip-title">' + esc(s.title) + '</span>' +
        '<button class="fav-star' + (s.fav ? ' on' : '') + '" data-fav title="Toggle favorite">⭐</button></div>' +
        '<span class="lang-badge">' + esc(s.lang) + '</span>' +
        (s.desc ? '<div class="snip-desc">' + esc(s.desc) + '</div>' : '') +
        (s.tags.length ? '<div class="snip-tags">' + s.tags.map(function (t) { return '<span>#' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
        '</div>' +
        '<pre class="snip-code">' + esc(s.code) + '</pre>' +
        '<div class="snip-foot"><button data-copy>📋 Copy</button><button data-edit>✏️ Edit</button><button data-del>🗑 Delete</button></div>';
      grid.appendChild(card);
    });
  }

  function copyCode(code) {
    function done() { toast('Code copied ✓', 'success'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, function () { fb(); done(); });
    else { fb(); done(); }
    function fb() {
      var ta = document.createElement('textarea');
      ta.value = code; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove();
    }
  }

  // ---------- Modal ----------
  function openNew() {
    editingId = null;
    $('modalTitle').textContent = '＋ New Snippet';
    $('sTitle').value = ''; $('sLang').value = 'JavaScript'; $('sTags').value = '';
    $('sDesc').value = ''; $('sCode').value = ''; $('sFav').checked = false;
    $('btnDelete').classList.add('hidden');
    $('snipModal').classList.remove('hidden');
    setTimeout(function () { $('sTitle').focus(); }, 50);
  }
  function openEdit(id) {
    var s = null;
    snippets.forEach(function (x) { if (x.id === id) s = x; });
    if (!s) return;
    editingId = id;
    $('modalTitle').textContent = '✏️ Edit Snippet';
    $('sTitle').value = s.title; $('sLang').value = s.lang; $('sTags').value = s.tags.join(', ');
    $('sDesc').value = s.desc || ''; $('sCode').value = s.code; $('sFav').checked = !!s.fav;
    $('btnDelete').classList.remove('hidden');
    $('snipModal').classList.remove('hidden');
  }
  function closeModal() { $('snipModal').classList.add('hidden'); editingId = null; }
  function saveModal() {
    var title = $('sTitle').value.trim();
    var code = $('sCode').value;
    if (!title) { toast('Title is required', ''); return; }
    if (!code.trim()) { toast('Code is empty', ''); return; }
    var tags = $('sTags').value.split(',').map(function (t) { return t.trim().replace(/^#/, ''); }).filter(Boolean).slice(0, 8);
    if (editingId) {
      snippets.forEach(function (s) {
        if (s.id === editingId) {
          s.title = title; s.lang = $('sLang').value; s.tags = tags;
          s.desc = $('sDesc').value.trim(); s.code = code; s.fav = $('sFav').checked;
        }
      });
      toast('Snippet updated ✓', 'success');
    } else {
      snippets.unshift({ id: uid(), title: title, lang: $('sLang').value, tags: tags, desc: $('sDesc').value.trim(), code: code, fav: $('sFav').checked, createdAt: Date.now() });
      toast('Snippet saved ✓', 'success');
    }
    save(); render(); closeModal();
  }

  // ---------- Events ----------
  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.snip-card');
    if (!card) return;
    var id = card.dataset.id;
    var s = null;
    snippets.forEach(function (x) { if (x.id === id) s = x; });
    if (!s) return;
    if (e.target.closest('[data-copy]')) { copyCode(s.code); }
    else if (e.target.closest('[data-edit]')) { openEdit(id); }
    else if (e.target.closest('[data-fav]')) {
      s.fav = !s.fav; save(); render();
      toast(s.fav ? 'Added to favorites ⭐' : 'Removed from favorites');
    }
    else if (e.target.closest('[data-del]')) {
      if (!confirm('Delete "' + s.title + '"?')) return;
      snippets = snippets.filter(function (x) { return x.id !== id; });
      save(); render();
      toast('Snippet deleted');
    }
  });
  $('searchInput').addEventListener('input', function () { query = $('searchInput').value; render(); });
  $('filterLang').addEventListener('change', function () { langFilter = $('filterLang').value; render(); });
  $('favToggle').addEventListener('click', function () {
    favOnly = !favOnly;
    $('favToggle').classList.toggle('on', favOnly);
    render();
  });
  $('btnAdd').addEventListener('click', openNew);
  $('btnAddEmpty').addEventListener('click', openNew);
  $('btnSave').addEventListener('click', saveModal);
  $('btnCancel').addEventListener('click', closeModal);
  $('btnClose').addEventListener('click', closeModal);
  $('snipModal').addEventListener('click', function (e) { if (e.target === $('snipModal')) closeModal(); });
  $('btnDelete').addEventListener('click', function () {
    if (!editingId) return;
    snippets = snippets.filter(function (x) { return x.id !== editingId; });
    save(); render(); closeModal();
    toast('Snippet deleted');
  });
  $('btnExport').addEventListener('click', function () {
    if (!snippets.length) { toast('Nothing to export', ''); return; }
    var blob = new Blob([JSON.stringify(snippets, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'snippetvault-backup.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('Backup exported ✓', 'success');
  });
  $('btnImport').addEventListener('click', function () { $('importFile').click(); });
  $('importFile').addEventListener('change', function () {
    var f = $('importFile').files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var data = JSON.parse(r.result);
        if (!Array.isArray(data)) throw new Error('bad');
        var valid = data.filter(function (s) { return s && s.title && s.code; }).map(function (s) {
          return { id: uid(), title: String(s.title).slice(0, 80), lang: LANGS.indexOf(s.lang) !== -1 ? s.lang : 'Other',
            tags: Array.isArray(s.tags) ? s.tags.slice(0, 8) : [], desc: String(s.desc || '').slice(0, 140),
            code: String(s.code).slice(0, 20000), fav: !!s.fav, createdAt: +s.createdAt || Date.now() };
        });
        if (!valid.length) { toast('No valid snippets', ''); return; }
        snippets = valid.concat(snippets);
        save(); render();
        toast('Imported ' + valid.length + ' ✓', 'success');
      } catch (e) { toast('Invalid backup file', ''); }
      $('importFile').value = '';
    };
    r.readAsText(f);
  });
  window.addEventListener('keydown', function (e) {
    var typing = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) !== -1;
    if (e.key === 'Escape') { closeModal(); }
    else if (e.key === '/' && !typing) { e.preventDefault(); $('searchInput').focus(); }
    else if (e.key.toLowerCase() === 'n' && !typing) { openNew(); }
  });

  render();
})();
