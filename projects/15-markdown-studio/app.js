/**
 * Markdown Live Studio (#15) | Zero-Dependency Markdown Engine
 * Custom block + inline parser, sync scroll, toolbar, counters,
 * HTML/MD export, print-to-PDF and LocalStorage autosave.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'markdown_studio_doc_v1';

  var SAMPLE = [
    '# Welcome to Markdown Live Studio ✍️',
    '',
    '> A **zero-dependency** Markdown editor with live preview, sync scrolling and one-click export.',
    '',
    '## ✨ Supported Syntax',
    '',
    '- **Bold**, *italic*, ~~strikethrough~~ and `inline code`',
    '- [Links](https://github.com) and images:',
    '',
    '![Paradox](https://img.shields.io/badge/Paradox-CodeLab-6366f1?style=for-the-badge)',
    '',
    '### ✅ Task lists',
    '',
    '- [x] Build custom Markdown parser',
    '- [x] Add synchronized scrolling',
    '- [ ] Export your first document',
    '',
    '### 💻 Fenced code blocks',
    '',
    '```js',
    'function greet(name) {',
    '  // Say hello with style',
    '  const msg = `Hello, ${name}!`;',
    '  return msg.repeat(2);',
    '}',
    '```',
    '',
    '### 📊 Tables',
    '',
    '| Feature        | Status | Speed  |',
    '| -------------- | :----: | -----: |',
    '| Live preview   |   ✅   | 60 fps |',
    '| Sync scroll    |   ✅   | instant|',
    '| HTML export    |   ✅   | 1 click|',
    '',
    '---',
    '',
    '1. Write on the **left**',
    '2. Preview on the **right**',
    '3. Export with the toolbar above 🚀',
    '',
  ].join('\n');

  // ---------- DOM ----------
  function $(id) { return document.getElementById(id); }
  var editor = $('editor'), preview = $('preview'), stage = $('mdStage');
  var statWords = $('statWords'), statChars = $('statChars');
  var statLines = $('statLines'), statRead = $('statRead');
  var saveState = $('saveState'), syncToggle = $('syncToggle');
  var toasts = $('toastContainer');

  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    toasts.appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }

  // ---------- Markdown parser ----------
  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function highlight(code, lang) {
    var e = escHtml(code);
    // Order: comments -> strings -> keywords/numbers. Use placeholders to avoid nesting.
    var stash = [];
    function keep(html) { stash.push(html); return '\u0000' + (stash.length - 1) + '\u0000'; }
    if (/^(js|javascript|ts|typescript|jsx|tsx|java|c|cpp|rust|go|php)$/i.test(lang || '')) {
      e = e.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, function (m) { return keep('<span class="tok-com">' + m + '</span>'); });
    } else if (/^(py|python|rb|ruby|sh|bash|yml|yaml)$/i.test(lang || '')) {
      e = e.replace(/(#[^\n]*)/g, function (m) { return keep('<span class="tok-com">' + m + '</span>'); });
    } else {
      e = e.replace(/(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)/g, function (m) { return keep('<span class="tok-com">' + m + '</span>'); });
    }
    e = e.replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;|&#39;(?:[^&]|&(?!#39;))*?&#39;|`[^`]*?`)/g, function (m) {
      return keep('<span class="tok-str">' + m + '</span>');
    });
    e = e.replace(/\b(const|let|var|function|return|if|else|for|while|class|import|from|export|def|print|None|True|False|new|try|catch|await|async|fn|struct|impl|mut|pub|SELECT|FROM|WHERE)\b/g, '<span class="tok-kw">$1</span>');
    e = e.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
    e = e.replace(/\u0000(\d+)\u0000/g, function (m, i) { return stash[+i]; });
    return e;
  }

  function inlineMd(s) {
    var e = escHtml(s);
    e = e.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, '<img src="$2" alt="$1" loading="lazy" />');
    e = e.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    e = e.replace(/(`+)(.+?)\1/g, '<code>$2</code>');
    e = e.replace(/(\*\*|__)(.+?)\1/g, '<strong>$2</strong>');
    e = e.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    e = e.replace(/(^|[^_\w])_([^_\n]+)_/g, '$1<em>$2</em>');
    e = e.replace(/~~(.+?)~~/g, '<del>$1</del>');
    return e;
  }

  function isTableSep(line) {
    return /^\|?[\s:|-]+\|[\s:|-]*\|?[\s:|-]*$/.test(line.trim()) && line.indexOf('|') !== -1;
  }
  function splitRow(line) {
    var t = line.trim().replace(/^\||\|$/g, '');
    return t.split('|').map(function (c) { return c.trim(); });
  }

  function parseMarkdown(src) {
    var lines = String(src).split('\n');
    var html = [], i = 0;
    var inFence = false, fenceLang = '', fenceBuf = [];
    var paraBuf = [];

    function flushPara() {
      if (!paraBuf.length) return;
      html.push('<p>' + inlineMd(paraBuf.join(' ')) + '</p>');
      paraBuf = [];
    }

    while (i < lines.length) {
      var line = lines[i];

      // Fenced code
      var fenceMatch = line.match(/^```(\w*)\s*$/);
      if (fenceMatch) {
        if (!inFence) { flushPara(); inFence = true; fenceLang = fenceMatch[1] || 'code'; fenceBuf = []; }
        else {
          inFence = false;
          html.push('<pre class="codeblock"><span class="code-lang">' + escHtml(fenceLang) + '</span><code>' + highlight(fenceBuf.join('\n'), fenceLang) + '</code></pre>');
        }
        i++; continue;
      }
      if (inFence) { fenceBuf.push(line); i++; continue; }

      // Headings
      var h = line.match(/^(#{1,4})\s+(.+)$/);
      if (h) { flushPara(); var lvl = h[1].length; html.push('<h' + lvl + '>' + inlineMd(h[2]) + '</h' + lvl + '>'); i++; continue; }

      // HR
      if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) { flushPara(); html.push('<hr />'); i++; continue; }

      // Blockquote
      if (/^\s*>/.test(line)) {
        flushPara();
        var q = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        html.push('<blockquote><p>' + inlineMd(q.join(' ')) + '</p></blockquote>');
        continue;
      }

      // Table
      if (line.indexOf('|') !== -1 && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        flushPara();
        var heads = splitRow(line);
        var aligns = splitRow(lines[i + 1]).map(function (c) {
          if (/^:.*:$/.test(c)) return 'center';
          if (/^:/.test(c)) return 'left';
          if (/:$/.test(c)) return 'right';
          return 'left';
        });
        i += 2;
        var rows = [];
        while (i < lines.length && lines[i].indexOf('|') !== -1 && lines[i].trim() !== '') {
          rows.push(splitRow(lines[i])); i++;
        }
        var t = '<table><thead><tr>' + heads.map(function (c, k) {
          return '<th style="text-align:' + (aligns[k] || 'left') + '">' + inlineMd(c) + '</th>';
        }).join('') + '</tr></thead><tbody>' + rows.map(function (r) {
          return '<tr>' + heads.map(function (_, k) {
            return '<td style="text-align:' + (aligns[k] || 'left') + '">' + inlineMd(r[k] || '') + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table>';
        html.push(t);
        continue;
      }

      // Lists (flat + task)
      var listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
      if (listMatch) {
        flushPara();
        var ordered = /\d+\./.test(listMatch[2]);
        var items = [];
        while (i < lines.length) {
          var m = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
          if (!m) break;
          var content = m[3];
          var task = content.match(/^\[([ xX])\]\s+(.*)$/);
          if (task) {
            items.push('<li class="task">' + (task[1].toLowerCase() === 'x' ? '☑' : '☐') + ' ' + inlineMd(task[2]) + '</li>');
          } else {
            items.push('<li>' + inlineMd(content) + '</li>');
          }
          i++;
        }
        html.push((ordered ? '<ol>' : '<ul>') + items.join('') + (ordered ? '</ol>' : '<ul>'));
        continue;
      }

      // Blank
      if (/^\s*$/.test(line)) { flushPara(); i++; continue; }

      paraBuf.push(line.trim());
      i++;
    }
    if (inFence) {
      html.push('<pre class="codeblock"><span class="code-lang">' + escHtml(fenceLang) + '</span><code>' + highlight(fenceBuf.join('\n'), fenceLang) + '</code></pre>');
    }
    flushPara();
    return html.join('\n') || '<p style="color:var(--dim)">Nothing to preview yet — start writing…</p>';
  }

  // ---------- Render + stats ----------
  var renderTimer = null;
  function render() {
    preview.innerHTML = parseMarkdown(editor.value);
    updateStats();
  }
  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 120);
  }
  function updateStats() {
    var v = editor.value;
    var words = (v.trim().match(/\S+/g) || []).length;
    statWords.textContent = words;
    statChars.textContent = v.length;
    statLines.textContent = v ? v.split('\n').length : 0;
    statRead.textContent = Math.max(1, Math.ceil(words / 200)) + ' min';
  }

  // ---------- Autosave ----------
  var saveTimer = null;
  function markDirty() {
    saveState.textContent = '● editing…';
    saveState.classList.add('dirty');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(STORAGE_KEY, editor.value); } catch (e) {}
      saveState.textContent = '● saved';
      saveState.classList.remove('dirty');
    }, 600);
  }

  // ---------- Sync scroll ----------
  var syncLock = false;
  function bindSync(from, to) {
    from.addEventListener('scroll', function () {
      if (!syncToggle.checked || syncLock) return;
      syncLock = true;
      var maxFrom = from.scrollHeight - from.clientHeight;
      var ratio = maxFrom > 0 ? from.scrollTop / maxFrom : 0;
      to.scrollTop = ratio * (to.scrollHeight - to.clientHeight);
      setTimeout(function () { syncLock = false; }, 30);
    });
  }

  // ---------- Toolbar ----------
  function surround(before, after, placeholder) {
    var start = editor.selectionStart, end = editor.selectionEnd;
    var sel = editor.value.slice(start, end) || placeholder;
    var next = editor.value.slice(0, start) + before + sel + after + editor.value.slice(end);
    editor.value = next;
    editor.focus();
    editor.selectionStart = start + before.length;
    editor.selectionEnd = start + before.length + sel.length;
    afterEdit();
  }
  function prefixLines(prefix) {
    var start = editor.selectionStart;
    var lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
    editor.value = editor.value.slice(0, lineStart) + prefix + editor.value.slice(lineStart);
    editor.focus();
    editor.selectionStart = editor.selectionEnd = start + prefix.length;
    afterEdit();
  }
  function insertAtCursor(text) {
    var start = editor.selectionStart, end = editor.selectionEnd;
    editor.value = editor.value.slice(0, start) + text + editor.value.slice(end);
    editor.focus();
    editor.selectionStart = editor.selectionEnd = start + text.length;
    afterEdit();
  }
  function afterEdit() { scheduleRender(); markDirty(); }

  var COMMANDS = {
    h1: function () { prefixLines('# '); },
    h2: function () { prefixLines('## '); },
    h3: function () { prefixLines('### '); },
    bold: function () { surround('**', '**', 'bold text'); },
    italic: function () { surround('*', '*', 'italic text'); },
    strike: function () { surround('~~', '~~', 'struck'); },
    code: function () { surround('`', '`', 'code'); },
    quote: function () { prefixLines('> '); },
    ul: function () { prefixLines('- '); },
    ol: function () { prefixLines('1. '); },
    task: function () { prefixLines('- [ ] '); },
    link: function () { surround('[', '](https://)', 'link text'); },
    image: function () { insertAtCursor('![alt text](https://)'); },
    table: function () { insertAtCursor('\n| Column A | Column B |\n| -------- | :------: |\n| Cell 1   | Cell 2   |\n'); },
    hr: function () { insertAtCursor('\n---\n'); },
    fence: function () { insertAtCursor('\n```js\nconsole.log("hello");\n```\n'); },
    sample: function () { if (confirm('Replace current document with the sample?')) { editor.value = SAMPLE; afterEdit(); toast('Sample loaded 📄'); } },
    clear: function () { if (confirm('Clear the entire document?')) { editor.value = ''; afterEdit(); toast('Editor cleared'); } },
  };

  // ---------- Export ----------
  function standaloneHtml() {
    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n<title>Exported Markdown Document</title>\n<style>\n' +
      'body{font-family:-apple-system,"Segoe UI",Roboto,sans-serif;max-width:820px;margin:0 auto;padding:2rem;line-height:1.75;color:#1e293b;background:#fff}' +
      'pre{background:#0f172a;color:#e2e8f0;padding:1rem;border-radius:10px;overflow-x:auto}code{font-family:ui-monospace,monospace;font-size:.87em}' +
      'p code{background:#f1f5f9;padding:.1rem .35rem;border-radius:5px}' +
      'blockquote{border-left:4px solid #6366f1;background:#eef2ff;margin:1rem 0;padding:.6rem 1rem;border-radius:0 8px 8px 0}' +
      'table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:.5rem .75rem}th{background:#eef2ff}' +
      'img{max-width:100%;border-radius:8px}hr{border:none;border-top:2px solid #e2e8f0;margin:1.5rem 0}' +
      '\n</style>\n</head>\n<body>\n' + preview.innerHTML + '\n</body>\n</html>';
  }
  function download(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  // ---------- Events ----------
  editor.addEventListener('input', afterEdit);
  editor.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      insertAtCursor('  ');
    }
  });

  document.getElementById('toolbar').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cmd]');
    if (!b || !COMMANDS[b.dataset.cmd]) return;
    COMMANDS[b.dataset.cmd]();
  });

  document.getElementById('viewSwitch').addEventListener('click', function (e) {
    var b = e.target.closest('.view-btn');
    if (!b) return;
    var btns = this.querySelectorAll('.view-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    b.classList.add('active');
    stage.classList.remove('view-editor', 'view-split', 'view-preview', 'mobile-preview');
    stage.classList.add('view-' + b.dataset.view);
  });
  // On small screens, the preview view-button toggles the mobile preview pane
  preview.addEventListener('click', function () {});

  $('btnCopyHtml').addEventListener('click', function () {
    var done = function () { toast('HTML copied to clipboard ✓', 'success'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(preview.innerHTML).then(done, function () { fallbackCopy(); done(); });
    } else { fallbackCopy(); done(); }
    function fallbackCopy() {
      var ta = document.createElement('textarea');
      ta.value = preview.innerHTML;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove();
    }
  });
  $('btnExportHtml').addEventListener('click', function () {
    download(new Blob([standaloneHtml()], { type: 'text/html' }), 'markdown-export.html');
    toast('HTML exported ✓', 'success');
  });
  $('btnDownloadMd').addEventListener('click', function () {
    download(new Blob([editor.value], { type: 'text/markdown' }), 'document.md');
    toast('Markdown downloaded ✓', 'success');
  });
  $('btnPrint').addEventListener('click', function () { window.print(); });

  window.addEventListener('keydown', function (e) {
    var mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    var k = e.key.toLowerCase();
    if (k === 'b') { e.preventDefault(); COMMANDS.bold(); }
    else if (k === 'i') { e.preventDefault(); COMMANDS.italic(); }
    else if (k === 'k') { e.preventDefault(); COMMANDS.link(); }
    else if (k === 's') { e.preventDefault(); $('btnExportHtml').click(); }
  });

  // Mobile: split view shows editor; tapping preview view-btn shows preview
  var viewObserver = new MutationObserver(function () {});
  viewObserver.observe(stage, { attributes: true });
  document.getElementById('viewSwitch').addEventListener('click', function (e) {
    var b = e.target.closest('.view-btn');
    if (!b) return;
    if (window.innerWidth <= 820 && b.dataset.view === 'split') {
      stage.classList.toggle('mobile-preview');
    }
  });

  // ---------- Init ----------
  bindSync(editor, preview);
  bindSync(preview, editor);
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    editor.value = saved !== null && saved !== undefined ? saved : SAMPLE;
  } catch (e) { editor.value = SAMPLE; }
  render();
})();
