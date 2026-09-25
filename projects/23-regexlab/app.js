/**
 * RegexLab (#23) | Live Regular Expression Playground
 * Live match highlighting, capture groups, replace preview,
 * cheatsheet, presets and saved patterns.
 */
(function () {
  'use strict';

  var LS_KEY = 'regexlab_saved_v1';
  var PRESETS = [
    { name: '📧 Email', pattern: '([\\w.+-]+)@([\\w-]+\\.[\\w.]+)', flags: 'gm', test: 'Contact us at hello@paradox.dev or support@acme-corp.io for help.' },
    { name: '🔗 URL', pattern: 'https?://[^\\s/$.?#].[^\\s]*', flags: 'gm', test: 'Visit https://github.com/paradox and http://localhost:3000/docs?q=1 today.' },
    { name: '📞 Phone', pattern: '\\+?\\d[\\d\\s().-]{7,}\\d', flags: 'gm', test: 'Call +1 (555) 123-4567 or 020 7946 0958 tomorrow.' },
    { name: '📅 Date', pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b', flags: 'gm', test: 'Releases on 2026-01-15, 2026-03-02 and 2025-12-31 shipped.' },
    { name: '#️⃣ Hashtags', pattern: '#\\w+', flags: 'g', test: 'Loving #JavaScript and #WebDev in 2026! #100DaysOfCode' },
  ];
  var CHEAT = [
    ['.', 'any char (except newline)'], ['\\d', 'digit 0-9'], ['\\D', 'non-digit'], ['\\w', 'word char [A-Za-z0-9_]'],
    ['\\W', 'non-word char'], ['\\s', 'whitespace'], ['\\S', 'non-whitespace'], ['^ $', 'start / end anchors'],
    ['\\b', 'word boundary'], ['* + ?', '0+, 1+, 0/1 quantifiers'], ['{n,m}', 'between n and m times'], ['( )', 'capture group'],
    ['(?: )', 'non-capturing group'], ['[abc]', 'character set'], ['[^abc]', 'negated set'], ['a|b', 'alternation'],
    ['(?= )', 'positive lookahead'], ['(?! )', 'negative lookahead'], ['\\1', 'backreference'], ['g i m s u y', 'flags'],
  ];

  function $(id) { return document.getElementById(id); }
  var patternInput = $('patternInput'), testInput = $('testInput'), replaceInput = $('replaceInput');
  var highlightBox = $('highlightBox'), groupsList = $('groupsList'), replaceOut = $('replaceOut');
  var matchPill = $('matchPill'), matchSub = $('matchSub'), rxError = $('rxError');
  var toasts = $('toastContainer');

  var saved = loadSaved();

  function loadSaved() { try { var r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : []; } catch (e) { return []; } }
  function persist() { try { localStorage.setItem(LS_KEY, JSON.stringify(saved)); } catch (e) {} }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
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
  function activeFlags() {
    var out = '';
    var boxes = document.querySelectorAll('#flagBox input');
    for (var i = 0; i < boxes.length; i++) if (boxes[i].checked) out += boxes[i].dataset.flag;
    return out;
  }
  function setFlags(f) {
    var boxes = document.querySelectorAll('#flagBox input');
    for (var i = 0; i < boxes.length; i++) boxes[i].checked = f.indexOf(boxes[i].dataset.flag) !== -1;
  }

  function evaluate() {
    var src = patternInput.value;
    var text = testInput.value;
    rxError.classList.add('hidden');
    if (!src) {
      matchPill.textContent = '0 matches';
      matchPill.classList.add('zero');
      highlightBox.innerHTML = '<span class="dim">Enter a pattern to begin.</span>';
      groupsList.innerHTML = '';
      matchSub.textContent = '';
      renderReplace(null);
      return;
    }
    var re;
    try {
      re = new RegExp(src, activeFlags());
    } catch (e) {
      rxError.textContent = '⚠️ ' + e.message;
      rxError.classList.remove('hidden');
      matchPill.textContent = '! error';
      matchPill.classList.add('zero');
      return;
    }
    var global = re.global || re.sticky;
    var matches = [];
    if (global) {
      re.lastIndex = 0;
      var m, guard = 0;
      while ((m = re.exec(text)) !== null && guard < 500) {
        guard++;
        matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
        if (m[0] === '') re.lastIndex++; // avoid zero-length infinite loop
      }
    } else {
      var s = re.exec(text);
      if (s) matches.push({ match: s[0], index: s.index, groups: s.slice(1) });
    }

    matchPill.textContent = matches.length + ' match' + (matches.length === 1 ? '' : 'es');
    matchPill.classList.toggle('zero', matches.length === 0);
    matchSub.textContent = matches.length ? 'click a preset or tweak flags' : '';

    if (!matches.length) {
      highlightBox.innerHTML = '<span class="dim">No matches found.</span>';
      groupsList.innerHTML = '';
    } else {
      var html = '', last = 0;
      matches.forEach(function (mt) {
        html += esc(text.slice(last, mt.index)) + '<mark>' + esc(mt.match || '∅') + '</mark>';
        last = mt.index + mt.match.length;
      });
      html += esc(text.slice(last));
      highlightBox.innerHTML = html || '<span class="dim">(empty input)</span>';
      groupsList.innerHTML = '';
      matches.slice(0, 30).forEach(function (mt, i) {
        var card = document.createElement('div');
        card.className = 'group-card';
        var g = mt.groups.length
          ? mt.groups.map(function (x, gi) { return '<span class="g">$' + (gi + 1) + '="' + esc(x === undefined ? '∅' : x) + '"</span>'; }).join(' ')
          : '<span style="color:var(--dim)">no capture groups</span>';
        card.innerHTML = '<b>#' + (i + 1) + ' @' + mt.index + '</b> "' + esc(mt.match) + '"<br/>' + g;
        groupsList.appendChild(card);
      });
      if (matches.length > 30) {
        var more = document.createElement('div');
        more.className = 'group-card';
        more.textContent = '… and ' + (matches.length - 30) + ' more';
        groupsList.appendChild(more);
      }
    }
    renderReplace(re);
  }

  function renderReplace(re) {
    var rep = replaceInput.value;
    if (!re || !rep) {
      replaceOut.innerHTML = '<span class="dim">Replace preview appears here.</span>';
      return;
    }
    try {
      var out = testInput.value.replace(new RegExp(re.source, re.flags.indexOf('g') === -1 ? re.flags + 'g' : re.flags), rep);
      replaceOut.textContent = out || '(empty result)';
    } catch (e) {
      replaceOut.innerHTML = '<span class="dim">Replace error: ' + esc(e.message) + '</span>';
    }
  }

  // ---------- Presets / cheatsheet / saved ----------
  function renderPresets() {
    var row = $('quickRow');
    row.innerHTML = '';
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.textContent = p.name;
      b.addEventListener('click', function () {
        patternInput.value = p.pattern;
        setFlags(p.flags);
        testInput.value = p.test;
        evaluate();
        toast(p.name + ' loaded');
      });
      row.appendChild(b);
    });
  }
  function renderCheat() {
    var grid = $('cheatGrid');
    grid.innerHTML = '';
    CHEAT.forEach(function (c) {
      var d = document.createElement('div');
      d.innerHTML = '<code>' + esc(c[0]) + '</code>' + esc(c[1]);
      d.title = 'Click to insert';
      d.addEventListener('click', function () {
        var s = patternInput.selectionStart || patternInput.value.length;
        patternInput.value = patternInput.value.slice(0, s) + c[0].split(' ')[0] + patternInput.value.slice(patternInput.selectionEnd || s);
        patternInput.focus();
        evaluate();
      });
      grid.appendChild(d);
    });
  }
  function renderSaved() {
    var list = $('savedList');
    list.innerHTML = '';
    if (!saved.length) {
      list.innerHTML = '<p style="color:var(--dim);font-size:.82rem">No saved patterns yet.</p>';
      return;
    }
    saved.forEach(function (sv, idx) {
      var row = document.createElement('div');
      row.className = 'saved-row';
      row.innerHTML = '<b>' + esc(sv.name) + '</b><code>/' + esc(sv.pattern) + '/' + esc(sv.flags) + '</code>' +
        '<button data-load="' + idx + '" title="Load">📥</button><button data-del="' + idx + '" title="Delete">✕</button>';
      list.appendChild(row);
    });
  }

  // ---------- Events ----------
  patternInput.addEventListener('input', evaluate);
  testInput.addEventListener('input', evaluate);
  replaceInput.addEventListener('input', evaluate);
  document.querySelectorAll('#flagBox input').forEach(function (box) {
    box.addEventListener('change', evaluate);
  });
  $('btnApplyReplace').addEventListener('click', function () {
    try {
      var re = new RegExp(patternInput.value, activeFlags().indexOf('g') === -1 ? activeFlags() + 'g' : activeFlags());
      testInput.value = testInput.value.replace(re, replaceInput.value);
      evaluate();
      toast('Replacement applied ✓', 'success');
    } catch (e) { toast('Invalid pattern', ''); }
  });
  $('btnCheat').addEventListener('click', function () { $('cheatModal').classList.remove('hidden'); });
  $('btnCloseCheat').addEventListener('click', function () { $('cheatModal').classList.add('hidden'); });
  $('btnDoneCheat').addEventListener('click', function () { $('cheatModal').classList.add('hidden'); });
  $('cheatModal').addEventListener('click', function (e) { if (e.target === $('cheatModal')) $('cheatModal').classList.add('hidden'); });
  $('btnSave').addEventListener('click', function () { renderSaved(); $('saveModal').classList.remove('hidden'); setTimeout(function () { $('saveName').focus(); }, 50); });
  $('btnCloseSave').addEventListener('click', function () { $('saveModal').classList.add('hidden'); });
  $('saveModal').addEventListener('click', function (e) { if (e.target === $('saveModal')) $('saveModal').classList.add('hidden'); });
  $('btnDoSave').addEventListener('click', function () {
    var name = $('saveName').value.trim() || 'Pattern ' + (saved.length + 1);
    if (!patternInput.value) { toast('Pattern is empty', ''); return; }
    try { new RegExp(patternInput.value, activeFlags()); } catch (e) { toast('Cannot save invalid regex', ''); return; }
    saved.unshift({ name: name, pattern: patternInput.value, flags: activeFlags() });
    saved = saved.slice(0, 20);
    persist(); renderSaved();
    $('saveName').value = '';
    toast('Pattern saved ✓', 'success');
  });
  $('savedList').addEventListener('click', function (e) {
    var loadBtn = e.target.closest('[data-load]');
    var delBtn = e.target.closest('[data-del]');
    if (loadBtn) {
      var sv = saved[+loadBtn.dataset.load];
      patternInput.value = sv.pattern;
      setFlags(sv.flags);
      $('saveModal').classList.add('hidden');
      evaluate();
      toast('Pattern loaded ✓', 'success');
    } else if (delBtn) {
      saved.splice(+delBtn.dataset.del, 1);
      persist(); renderSaved();
    }
  });
  window.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      renderSaved(); $('saveModal').classList.remove('hidden');
      return;
    }
    var typing = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) !== -1;
    if (e.key === 'Escape') { $('cheatModal').classList.add('hidden'); $('saveModal').classList.add('hidden'); }
    else if (e.key === '?' && !typing) { $('cheatModal').classList.remove('hidden'); }
  });

  // ---------- Init ----------
  patternInput.value = PRESETS[0].pattern;
  testInput.value = PRESETS[0].test;
  renderPresets();
  renderCheat();
  evaluate();
})();
