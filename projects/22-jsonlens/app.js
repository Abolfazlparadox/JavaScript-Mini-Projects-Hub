/**
 * JSONLens Studio (#22) | JSON Formatter / Validator / Tree Explorer
 * Live validation with error pinpointing, syntax highlighting,
 * collapsible tree view, stats and file I/O.
 */
(function () {
  'use strict';

  var LS_KEY = 'jsonlens_doc_v1';
  var SAMPLE = {
    project: 'Paradox CodeLab',
    version: '2.0.0',
    active: true,
    stats: { apps: 28, portfolios: 3, tests: 190 },
    tags: ['vanilla-js', 'zero-deps', 'accessible'],
    owner: { name: 'Abolfazl Mohammadshahi', alias: 'Paradox', gpa: 18.5 },
    roadmap: null,
  };

  function $(id) { return document.getElementById(id); }
  var editor = $('editor'), gutter = $('gutter'), prettyOut = $('prettyOut'), treeOut = $('treeOut');
  var validPill = $('validPill'), errorBar = $('errorBar'), errorText = $('errorText');
  var inputStat = $('inputStat'), docStats = $('docStats'), toasts = $('toastContainer');

  var parsed = null, lastError = null, currentView = 'pretty';

  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    toasts.appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function indentVal() {
    var v = $('indentSelect').value;
    return v === 'tab' ? '\t' : parseInt(v, 10);
  }

  function highlight(json) {
    return esc(json).replace(/(&quot;(?:[^&\\]|\\.)*?&quot;)(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b/g,
      function (m, str, colon, num) {
        if (str !== undefined) return colon ? '<span class="k">' + str + '</span>' + colon : '<span class="s">' + str + '</span>';
        if (num !== undefined) return '<span class="n">' + num + '</span>';
        if (m === 'true' || m === 'false') return '<span class="b">' + m + '</span>';
        return '<span class="nl">' + m + '</span>';
      });
  }

  function statsOf(val) {
    var keys = 0, maxDepth = 0;
    (function walk(v, d) {
      if (d > maxDepth) maxDepth = d;
      if (Array.isArray(v)) v.forEach(function (x) { walk(x, d + 1); });
      else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { keys++; walk(v[k], d + 1); });
    })(val, 0);
    return { keys: keys, depth: maxDepth };
  }

  function treeHTML(val) {
    if (Array.isArray(val)) {
      if (!val.length) return '<span class="tb">[]</span>';
      var items = val.map(function (x, i) {
        return '<div><span class="tk">[' + i + ']</span> ' + treeHTML(x) + '</div>';
      }).join('');
      return '<details open><summary>Array(' + val.length + ')</summary>' + items + '</details>';
    }
    if (val && typeof val === 'object') {
      var keys = Object.keys(val);
      if (!keys.length) return '<span class="tb">{}</span>';
      var rows = keys.map(function (k) {
        return '<div><span class="tk">"' + esc(k) + '"</span>: ' + treeHTML(val[k]) + '</div>';
      }).join('');
      return '<details open><summary>Object{' + keys.length + '}</summary>' + rows + '</details>';
    }
    if (typeof val === 'string') return '<span class="tv">"' + esc(val.length > 120 ? val.slice(0, 120) + '…' : val) + '"</span>';
    if (typeof val === 'number') return '<span class="tn">' + val + '</span>';
    return '<span class="tb">' + String(val) + '</span>';
  }

  function errorPosition(msg, src) {
    var m = msg.match(/position\s+(\d+)/i);
    var pos = m ? +m[1] : -1;
    if (pos < 0) {
      var m2 = msg.match(/line\s+(\d+).*column\s+(\d+)/i);
      if (m2) {
        var lines = src.split('\n');
        pos = 0;
        for (var i = 0; i < Math.min(+m2[1] - 1, lines.length); i++) pos += lines[i].length + 1;
        pos += (+m2[2] - 1);
      }
    }
    return pos;
  }

  var renderTimer = null;
  function analyze() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(doAnalyze, 150);
  }

  function doAnalyze() {
    var src = editor.value;
    inputStat.textContent = src.length.toLocaleString() + ' chars • ' + (src ? src.split('\n').length : 0) + ' lines';
    updateGutter(-1);
    if (!src.trim()) {
      setValidity(null);
      prettyOut.innerHTML = '<code>—</code>';
      treeOut.innerHTML = '';
      docStats.textContent = '—';
      parsed = null;
      persist();
      return;
    }
    try {
      parsed = JSON.parse(src);
      lastError = null;
      setValidity(true);
      var pretty = JSON.stringify(parsed, null, indentVal());
      prettyOut.innerHTML = '<code>' + highlight(pretty) + '</code>';
      treeOut.innerHTML = treeHTML(parsed);
      var st = statsOf(parsed);
      docStats.textContent = st.keys + ' keys • depth ' + st.depth + ' • ' + new Blob([src]).size.toLocaleString() + ' B';
    } catch (e) {
      parsed = null;
      lastError = e.message;
      setValidity(false, e.message);
      var pos = errorPosition(e.message, src);
      if (pos >= 0) {
        var lineNo = src.slice(0, pos).split('\n').length;
        updateGutter(lineNo);
        errorText.textContent = e.message + '  →  line ' + lineNo;
      } else {
        errorText.textContent = e.message;
      }
      docStats.textContent = 'invalid';
    }
    persist();
  }

  function setValidity(state, msg) {
    if (state === null) {
      validPill.textContent = '○ Empty';
      validPill.className = 'valid-pill';
      validPill.style.color = 'var(--dim)';
      validPill.style.borderColor = 'var(--border)';
      errorBar.classList.add('hidden');
    } else if (state) {
      validPill.textContent = '● Valid JSON';
      validPill.className = 'valid-pill ok';
      validPill.style.cssText = '';
      errorBar.classList.add('hidden');
    } else {
      validPill.textContent = '● Invalid JSON';
      validPill.className = 'valid-pill bad';
      validPill.style.cssText = '';
      errorBar.classList.remove('hidden');
      void msg;
    }
  }

  function updateGutter(errLine) {
    var n = editor.value ? editor.value.split('\n').length : 1;
    var html = '';
    for (var i = 1; i <= n; i++) {
      html += i === errLine ? '<span class="err-line">' + i + '</span>\n' : i + '\n';
    }
    gutter.innerHTML = esc(html).replace(/&lt;span class=&quot;err-line&quot;&gt;(\d+)&lt;\/span&gt;/g, '<span class="err-line">$1</span>');
  }

  function persist() { try { localStorage.setItem(LS_KEY, editor.value); } catch (e) {} }

  // ---------- Actions ----------
  editor.addEventListener('input', analyze);
  editor.addEventListener('scroll', function () { gutter.scrollTop = editor.scrollTop; });
  editor.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      var s = editor.selectionStart;
      editor.value = editor.value.slice(0, s) + '  ' + editor.value.slice(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 2;
      analyze();
    }
  });

  $('btnFormat').addEventListener('click', function () {
    if (!parsed && editor.value.trim()) { doAnalyze(); }
    if (parsed === null && editor.value.trim()) { toast('Fix errors first ⚠️', ''); return; }
    if (parsed !== null) {
      editor.value = JSON.stringify(parsed, null, indentVal());
      doAnalyze();
      toast('Formatted ✨', 'success');
    }
  });
  $('btnMinify').addEventListener('click', function () {
    if (parsed === null) { toast('Nothing valid to minify', ''); return; }
    editor.value = JSON.stringify(parsed);
    doAnalyze();
    toast('Minified 📦', 'success');
  });
  $('btnValidate').addEventListener('click', function () {
    doAnalyze();
    toast(parsed !== null ? 'Valid JSON ✓' : 'Invalid: ' + (lastError || 'empty'), parsed !== null ? 'success' : '');
  });
  $('indentSelect').addEventListener('change', analyze);
  $('btnSample').addEventListener('click', function () {
    editor.value = JSON.stringify(SAMPLE, null, 2);
    doAnalyze();
    toast('Sample loaded 📄');
  });
  $('btnClear').addEventListener('click', function () { editor.value = ''; doAnalyze(); });
  $('btnLoad').addEventListener('click', function () { $('fileInput').click(); });
  $('fileInput').addEventListener('change', function () {
    var f = $('fileInput').files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () { editor.value = String(r.result); doAnalyze(); toast('File loaded 📂', 'success'); $('fileInput').value = ''; };
    r.readAsText(f);
  });
  $('btnCopy').addEventListener('click', function () {
    var text = parsed !== null ? JSON.stringify(parsed, null, indentVal()) : editor.value;
    if (!text) { toast('Nothing to copy', ''); return; }
    function done() { toast('Copied ✓', 'success'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fb(); done(); });
    else { fb(); done(); }
    function fb() {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove();
    }
  });
  $('btnDownload').addEventListener('click', function () {
    if (!editor.value.trim()) { toast('Nothing to download', ''); return; }
    var blob = new Blob([editor.value], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('Downloaded ✓', 'success');
  });
  $('viewTabs').addEventListener('click', function (e) {
    var b = e.target.closest('.view-btn');
    if (!b) return;
    currentView = b.dataset.view;
    var btns = this.querySelectorAll('.view-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i] === b);
    prettyOut.classList.toggle('hidden', currentView !== 'pretty');
    treeOut.classList.toggle('hidden', currentView !== 'tree');
  });

  // ---------- Init ----------
  try {
    var saved = localStorage.getItem(LS_KEY);
    editor.value = saved !== null ? saved : JSON.stringify(SAMPLE, null, 2);
  } catch (e) { editor.value = JSON.stringify(SAMPLE, null, 2); }
  doAnalyze();
})();
