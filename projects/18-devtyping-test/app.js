/**
 * DevTyping Benchmark (#18) | Code Typing Engine
 * Real code snippets, per-character scoring, live WPM/CPM/accuracy,
 * error heatmap, performance chart, grades and personal-best history.
 */
(function () {
  'use strict';

  var LS_HIST = 'devtyping_history_v1';
  var LS_SOUND = 'devtyping_sound_v1';

  var SNIPPETS = {
    javascript: [
      { name: 'debounce.js', lines: [
        'function debounce(fn, delay) {',
        '  let timer = null;',
        '  return function (...args) {',
        '    clearTimeout(timer);',
        '    timer = setTimeout(() => fn(...args), delay);',
        '  };',
        '}',
      ]},
      { name: 'fetch-users.js', lines: [
        'async function fetchUsers(page = 1) {',
        '  const res = await fetch(`/api/users?page=${page}`);',
        '  if (!res.ok) throw new Error(`HTTP ${res.status}`);',
        '  const { data, total } = await res.json();',
        '  return { users: data, pages: Math.ceil(total / 20) };',
        '}',
      ]},
      { name: 'event-bus.js', lines: [
        'class EventBus {',
        '  constructor() { this.events = new Map(); }',
        '  on(name, fn) {',
        '    if (!this.events.has(name)) this.events.set(name, []);',
        '    this.events.get(name).push(fn);',
        '  }',
        '  emit(name, payload) {',
        '    (this.events.get(name) || []).forEach((fn) => fn(payload));',
        '  }',
        '}',
      ]},
      { name: 'quick-sort.js', lines: [
        'function quickSort(arr) {',
        '  if (arr.length < 2) return arr;',
        '  const pivot = arr[Math.floor(arr.length / 2)];',
        '  const left = arr.filter((x) => x < pivot);',
        '  const mid = arr.filter((x) => x === pivot);',
        '  const right = arr.filter((x) => x > pivot);',
        '  return [...quickSort(left), ...mid, ...quickSort(right)];',
        '}',
      ]},
    ],
    python: [
      { name: 'rate_limit.py', lines: [
        'def rate_limit(calls, period):',
        '    history = []',
        '    def decorator(fn):',
        '        def wrapper(*args, **kwargs):',
        '            now = time.monotonic()',
        '            window = [t for t in history if now - t < period]',
        '            if len(window) >= calls:',
        '                raise RuntimeError("rate limit exceeded")',
        '            window.append(now)',
        '            return fn(*args, **kwargs)',
        '        return wrapper',
        '    return decorator',
      ]},
      { name: 'retry.py', lines: [
        'async def fetch_with_retry(url, attempts=3):',
        '    for i in range(attempts):',
        '        try:',
        '            async with session.get(url) as resp:',
        '                resp.raise_for_status()',
        '                return await resp.json()',
        '        except ClientError as exc:',
        '            if i == attempts - 1:',
        '                raise',
        '            await asyncio.sleep(2 ** i)',
      ]},
      { name: 'models.py', lines: [
        'class Order(models.Model):',
        '    customer = models.ForeignKey(User, on_delete=models.CASCADE)',
        '    total = models.DecimalField(max_digits=10, decimal_places=2)',
        '    status = models.CharField(max_length=20, default="pending")',
        '    created_at = models.DateTimeField(auto_now_add=True)',
        '',
        '    def __str__(self):',
        '        return f"Order #{self.pk} - {self.status}"',
      ]},
    ],
    css: [
      { name: 'glass-card.css', lines: [
        '.glass-card {',
        '  background: rgba(18, 24, 38, 0.72);',
        '  border: 1px solid rgba(255, 255, 255, 0.1);',
        '  backdrop-filter: blur(20px);',
        '  border-radius: 22px;',
        '  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.6);',
        '  transition: transform 0.25s ease;',
        '}',
        '',
        '.glass-card:hover {',
        '  transform: translateY(-4px);',
        '}',
      ]},
      { name: 'grid.css', lines: [
        '.gallery {',
        '  display: grid;',
        '  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));',
        '  gap: 1rem;',
        '}',
        '',
        '@media (max-width: 640px) {',
        '  .gallery {',
        '    grid-template-columns: 1fr;',
        '  }',
        '}',
      ]},
    ],
  };
  var LANG_LABEL = { javascript: 'JavaScript', python: 'Python', css: 'CSS' };

  // ---------- State ----------
  var target = '', spans = [];
  var typed = '';
  var started = false, finished = false, startTime = 0;
  var duration = 30, timeLeft = 30, timerId = null;
  var totalKeys = 0, correctKeys = 0, errorCount = 0;
  var perSecond = []; // {wpm, errors}
  var secCorrect = 0, secErrors = 0, lastSecMark = 0;
  var errHeat = {}; // char -> count (session)
  var history = loadJSON(LS_HIST, []);
  var soundOn = loadJSON(LS_SOUND, true);
  var currentLang = 'javascript', currentIdx = 0;

  function loadJSON(k, fb) {
    try { var r = localStorage.getItem(k); return r === null ? fb : JSON.parse(r); }
    catch (e) { return fb; }
  }
  function persist() {
    try {
      localStorage.setItem(LS_HIST, JSON.stringify(history.slice(0, 40)));
      localStorage.setItem(LS_SOUND, JSON.stringify(soundOn));
    } catch (e) {}
  }

  // ---------- DOM ----------
  function $(id) { return document.getElementById(id); }
  var codeDisplay = $('codeDisplay'), codeWrap = $('codeWrap'), hiddenInput = $('hiddenInput');
  var focusOverlay = $('focusOverlay'), snippetName = $('snippetName'), bestLine = $('bestLine');
  var liveTime = $('liveTime'), liveWpm = $('liveWpm'), liveCpm = $('liveCpm');
  var liveAcc = $('liveAcc'), liveErr = $('liveErr'), timeFill = $('timeFill');
  var timerBox = document.querySelector('.live-item.timer');
  var langSelect = $('langSelect'), timeSelect = $('timeSelect');
  var resultsModal = $('resultsModal'), historyModal = $('historyModal');
  var heatRow = $('heatRow');
  var toasts = $('toastContainer');

  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    toasts.appendChild(el);
    setTimeout(function () { el.remove(); }, 2000);
  }

  // ---------- Audio ----------
  var actx = null;
  function blip(freq, dur, vol) {
    if (!soundOn) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      var t = actx.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.06, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.07));
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + (dur || 0.07) + 0.02);
    } catch (e) {}
  }

  // ---------- Snippet loading ----------
  function pickSnippet(lang, avoidIdx) {
    var pool = SNIPPETS[lang];
    var idx = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && idx === avoidIdx) idx = (idx + 1) % pool.length;
    return { snip: pool[idx], idx: idx };
  }
  function loadSnippet(lang, idx) {
    currentLang = lang;
    var picked;
    if (typeof idx === 'number') { picked = { snip: SNIPPETS[lang][idx % SNIPPETS[lang].length], idx: idx }; }
    else { picked = pickSnippet(lang, currentIdx); }
    currentIdx = picked.idx;
    target = picked.snip.lines.join('\n');
    snippetName.textContent = picked.snip.name;
    renderTarget();
    resetTest(false);
    updateBestLine();
  }

  function renderTarget() {
    codeDisplay.innerHTML = '';
    spans = [];
    for (var i = 0; i < target.length; i++) {
      var s = document.createElement('span');
      s.className = 'ch' + (i === 0 ? ' cur' : '');
      s.textContent = target[i];
      if (target[i] === '\n') s.innerHTML = '⏎\n';
      codeDisplay.appendChild(s);
      spans.push(s);
    }
  }

  function resetTest(keepFocus) {
    typed = '';
    hiddenInput.value = '';
    started = false; finished = false;
    clearInterval(timerId);
    timeLeft = duration;
    totalKeys = 0; correctKeys = 0; errorCount = 0;
    perSecond = []; secCorrect = 0; secErrors = 0; lastSecMark = 0;
    for (var i = 0; i < spans.length; i++) spans[i].className = 'ch' + (i === 0 ? ' cur' : '');
    codeWrap.scrollTop = 0;
    updateLive();
    timerBox.classList.remove('urgent');
    timeFill.style.width = '100%';
    if (keepFocus !== false) hiddenInput.focus();
  }

  // ---------- Typing handling ----------
  function handleInput() {
    if (finished) { hiddenInput.value = typed; return; }
    var val = hiddenInput.value;
    // Cap at target length (ignore overtyping beyond end)
    if (val.length > target.length) { val = val.slice(0, target.length); hiddenInput.value = val; }

    if (!started && val.length > 0) startClock();
    if (!started) { typed = val; paint(val); return; }

    // Keystroke accounting on appended chars
    if (val.length > typed.length) {
      for (var i = typed.length; i < val.length; i++) {
        totalKeys++;
        if (val[i] === target[i]) { correctKeys++; secCorrect++; }
        else {
          errorCount++; secErrors++;
          var ch = target[i] === '\n' ? '⏎' : target[i] === ' ' ? '␣' : target[i];
          errHeat[ch] = (errHeat[ch] || 0) + 1;
          blip(180, 0.09, 0.08);
        }
      }
    }
    typed = val;
    paint(val);
    updateLive();

    if (typed.length >= target.length) finishTest(true);
  }

  function paint(val) {
    for (var i = 0; i < spans.length; i++) {
      var cls = 'ch';
      if (i < val.length) cls += val[i] === target[i] ? ' ok' : ' bad';
      else if (i === val.length && !finished) cls += ' cur';
      spans[i].className = cls;
    }
    // Keep caret visible
    var cur = spans[Math.min(val.length, spans.length - 1)];
    if (cur && cur.scrollIntoView) {
      try { cur.scrollIntoView({ block: 'nearest' }); } catch (e) {}
    }
  }

  function elapsedMin() {
    var s = (performance.now() - startTime) / 1000;
    return Math.max(s / 60, 1 / 6000);
  }
  function calcWpm(correct, minutes) { return Math.round((correct / 5) / minutes); }

  function updateLive() {
    if (!started) {
      liveWpm.textContent = '0'; liveCpm.textContent = '0';
      liveAcc.textContent = '100%'; liveErr.textContent = '0';
      liveTime.textContent = timeLeft;
      return;
    }
    var mins = elapsedMin();
    liveWpm.textContent = calcWpm(correctKeys, mins);
    liveCpm.textContent = Math.round(correctKeys / mins);
    liveAcc.textContent = (totalKeys ? Math.round((correctKeys / totalKeys) * 100) : 100) + '%';
    liveErr.textContent = errorCount;
    liveTime.textContent = timeLeft;
    timeFill.style.width = Math.max(0, (timeLeft / duration) * 100) + '%';
    timerBox.classList.toggle('urgent', timeLeft <= 5);
  }

  function startClock() {
    started = true;
    startTime = performance.now();
    lastSecMark = startTime;
    timerId = setInterval(function () {
      var now = performance.now();
      timeLeft = Math.max(0, Math.ceil(duration - (now - startTime) / 1000));
      // Per-second sampling
      if (now - lastSecMark >= 1000) {
        var secs = Math.floor((now - lastSecMark) / 1000);
        for (var s = 0; s < secs; s++) {
          var wpm = Math.round(((secCorrect / Math.max(secs, 1)) * 60) / 5);
          perSecond.push({ wpm: perSecond.length ? Math.round((perSecond[perSecond.length - 1].wpm + wpm) / 2) : wpm, errors: secErrors });
        }
        secCorrect = 0; secErrors = 0;
        lastSecMark = now;
      }
      updateLive();
      if (timeLeft <= 0) finishTest(false);
    }, 200);
  }

  function finishTest(completed) {
    if (finished) return;
    finished = true;
    clearInterval(timerId);
    timeLeft = completed ? timeLeft : 0;
    paint(typed);
    blip(660, 0.12, 0.08);
    setTimeout(function () { blip(880, 0.14, 0.08); }, 110);

    var mins = elapsedMin();
    var wpm = calcWpm(correctKeys, mins);
    var acc = totalKeys ? (correctKeys / totalKeys) * 100 : 100;
    var cons = calcConsistency();
    var grade = calcGrade(wpm, acc);

    // Personal best
    var prevBest = bestFor(currentLang);
    var isBest = wpm > (prevBest ? prevBest.wpm : 0) && totalKeys >= 20;
    history.unshift({ wpm: wpm, acc: Math.round(acc * 10) / 10, lang: currentLang, dur: duration, date: Date.now(), completed: !!completed });
    history = history.slice(0, 40);
    persist();
    renderHeat();
    showResults({ wpm: wpm, acc: acc, cons: cons, grade: grade, isBest: isBest });
    updateBestLine();
  }

  function calcConsistency() {
    if (perSecond.length < 2) return 100;
    var vals = perSecond.map(function (p) { return p.wpm; });
    var mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    if (mean === 0) return 100;
    var variance = vals.reduce(function (a, b) { return a + Math.pow(b - mean, 2); }, 0) / vals.length;
    var cv = Math.sqrt(variance) / mean;
    return Math.max(0, Math.round(100 - cv * 100));
  }
  function calcGrade(wpm, acc) {
    if (wpm >= 70 && acc >= 97) return 'S';
    if (wpm >= 55 && acc >= 95) return 'A';
    if (wpm >= 40 && acc >= 92) return 'B';
    if (wpm >= 25 && acc >= 88) return 'C';
    return 'D';
  }
  function bestFor(lang) {
    var best = null;
    history.forEach(function (h) {
      if (h.lang === lang && (!best || h.wpm > best.wpm)) best = h;
    });
    return best;
  }
  function updateBestLine() {
    var b = bestFor(currentLang);
    bestLine.textContent = b ? b.wpm + ' WPM • ' + Math.round(b.acc) + '%' : '—';
  }

  // ---------- Results ----------
  function showResults(r) {
    $('resWpm').textContent = r.wpm;
    $('resSubtitle').textContent = LANG_LABEL[currentLang] + ' • ' + duration + 's • ' + typed.length + '/' + target.length + ' chars';
    var gb = $('gradeBadge');
    gb.textContent = r.grade;
    gb.className = 'grade-badge' + (r.grade === 'S' ? ' s' : '');
    $('resAcc').textContent = Math.round(r.acc * 10) / 10 + '%';
    $('resCons').textContent = r.cons + '%';
    $('resChars').textContent = correctKeys + '/' + totalKeys;
    $('resErr').textContent = errorCount;
    $('newBest').classList.toggle('hidden', !r.isBest);
    resultsModal.classList.remove('hidden');
    drawChart();
  }

  function drawChart() {
    var canvas = $('perfChart');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || 520, h = canvas.clientHeight || 150;
    canvas.width = w * dpr; canvas.height = h * dpr;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var data = perSecond.length ? perSecond : [{ wpm: 0, errors: 0 }];
    var maxW = Math.max.apply(null, data.map(function (p) { return p.wpm; }).concat([10]));
    function x(i) { return 34 + (i / Math.max(data.length - 1, 1)) * (w - 44); }
    function y(v) { return (h - 22) - (v / (maxW * 1.15)) * (h - 34); }
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.fillStyle = 'rgba(148,163,184,0.9)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.lineWidth = 1;
    for (var g = 0; g <= 3; g++) {
      var v = Math.round((maxW * 1.15 / 3) * g);
      var yy = y(v);
      ctx.beginPath(); ctx.moveTo(34, yy); ctx.lineTo(w - 10, yy); ctx.stroke();
      ctx.fillText(String(v), 6, yy + 3);
    }
    // Error bars
    data.forEach(function (p, i) {
      if (p.errors > 0) {
        ctx.fillStyle = 'rgba(239,68,68,0.7)';
        var bh = Math.min(p.errors * 8, h - 30);
        ctx.fillRect(x(i) - 2, h - 22 - bh, 4, bh);
      }
    });
    // WPM area
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(99,102,241,0.45)');
    grad.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.beginPath();
    ctx.moveTo(x(0), h - 22);
    for (var i = 0; i < data.length; i++) ctx.lineTo(x(i), y(data[i].wpm));
    ctx.lineTo(x(data.length - 1), h - 22);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    for (var j = 0; j < data.length; j++) { if (j === 0) ctx.moveTo(x(j), y(data[j].wpm)); else ctx.lineTo(x(j), y(data[j].wpm)); }
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = 'rgba(148,163,184,0.9)';
    ctx.fillText('wpm / second  •  red bars = errors', 34, h - 8);
  }

  // ---------- Heatmap ----------
  function renderHeat() {
    var entries = Object.keys(errHeat).map(function (k) { return { ch: k, n: errHeat[k] }; });
    entries.sort(function (a, b) { return b.n - a.n; });
    entries = entries.slice(0, 10);
    heatRow.innerHTML = '';
    if (!entries.length) {
      heatRow.innerHTML = '<span class="heat-empty">No errors yet — keep it clean! ✨</span>';
      return;
    }
    var max = entries[0].n;
    entries.forEach(function (e) {
      var d = document.createElement('div');
      d.className = 'heat-chip' + (e.n >= Math.max(3, max * 0.6) ? ' hot' : '');
      d.title = e.n + ' errors on "' + e.ch + '"';
      var label = e.ch;
      if (label === ' ') label = '␣';
      if (label === '\n') label = '⏎';
      d.innerHTML = '<span class="hk">' + label.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span><span class="hn">×' + e.n + '</span>';
      heatRow.appendChild(d);
    });
  }

  // ---------- History modal ----------
  function renderHistoryModal() {
    var grid = $('bestGrid');
    grid.innerHTML = '';
    ['javascript', 'python', 'css'].forEach(function (lang) {
      var b = bestFor(lang);
      var cell = document.createElement('div');
      cell.className = 'best-cell';
      cell.innerHTML = '<span>' + LANG_LABEL[lang] + '</span><strong>' + (b ? b.wpm + ' WPM' : '—') + '</strong>';
      grid.appendChild(cell);
    });
    var list = $('histList');
    list.innerHTML = '';
    if (!history.length) {
      list.innerHTML = '<p style="color:var(--dim);font-size:.85rem;text-align:center;padding:1rem 0">No tests yet. Complete a run to see it here.</p>';
      return;
    }
    history.slice(0, 15).forEach(function (h) {
      var row = document.createElement('div');
      row.className = 'hist-row';
      var date = new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
        new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      row.innerHTML = '<strong>' + h.wpm + ' WPM</strong><span>' + Math.round(h.acc) + '%</span><span class="grow">' + LANG_LABEL[h.lang] + ' • ' + h.dur + 's • ' + date + '</span>';
      list.appendChild(row);
    });
  }

  // ---------- Events ----------
  hiddenInput.addEventListener('input', handleInput);
  hiddenInput.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      var s = hiddenInput.selectionStart || 0, en = hiddenInput.selectionEnd || 0;
      hiddenInput.value = hiddenInput.value.slice(0, s) + '  ' + hiddenInput.value.slice(en);
      hiddenInput.selectionStart = hiddenInput.selectionEnd = s + 2;
      handleInput();
    }
  });
  codeWrap.addEventListener('click', function () { hiddenInput.focus(); });
  hiddenInput.addEventListener('focus', function () { focusOverlay.classList.add('gone'); });
  hiddenInput.addEventListener('blur', function () {
    if (!started || finished) focusOverlay.classList.remove('gone');
  });

  langSelect.addEventListener('change', function () { loadSnippet(langSelect.value); toast('Loaded ' + LANG_LABEL[langSelect.value] + ' snippet'); });
  timeSelect.addEventListener('change', function () { duration = +timeSelect.value; resetTest(); });

  $('btnRestart').addEventListener('click', function () { resetTest(); });
  $('btnNew').addEventListener('click', function () { loadSnippet(currentLang); });

  $('btnCloseResults').addEventListener('click', function () { resultsModal.classList.add('hidden'); resetTest(); });
  $('btnRetry').addEventListener('click', function () { resultsModal.classList.add('hidden'); resetTest(); });
  $('btnNextSnip').addEventListener('click', function () { resultsModal.classList.add('hidden'); loadSnippet(currentLang); });
  $('btnKeepTyping').addEventListener('click', function () { resultsModal.classList.add('hidden'); loadSnippet(currentLang); });

  $('btnHistory').addEventListener('click', function () { renderHistoryModal(); historyModal.classList.remove('hidden'); });
  $('btnCloseHistory').addEventListener('click', function () { historyModal.classList.add('hidden'); });
  $('btnDoneHist').addEventListener('click', function () { historyModal.classList.add('hidden'); });
  historyModal.addEventListener('click', function (e) { if (e.target === historyModal) historyModal.classList.add('hidden'); });
  $('btnClearHist').addEventListener('click', function () {
    history = []; persist(); renderHistoryModal(); updateBestLine(); toast('History cleared');
  });

  $('btnSound').addEventListener('click', function () {
    soundOn = !soundOn; persist();
    $('soundOn').classList.toggle('hidden', !soundOn);
    $('soundOff').classList.toggle('hidden', soundOn);
  });

  window.addEventListener('keydown', function (e) {
    var typing = e.target === hiddenInput;
    if (e.key === 'Escape') {
      if (!resultsModal.classList.contains('hidden')) { resultsModal.classList.add('hidden'); resetTest(); }
      else if (!historyModal.classList.contains('hidden')) { historyModal.classList.add('hidden'); }
      else if (typing) { resetTest(); }
    } else if (e.key === 'Tab' && !typing && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].indexOf(e.target.tagName) === -1) {
      e.preventDefault();
      loadSnippet(currentLang);
    } else if ((e.key.toLowerCase() === 'h') && !typing && ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) === -1) {
      renderHistoryModal(); historyModal.classList.remove('hidden');
    } else if (e.key === 'Enter' && !resultsModal.classList.contains('hidden')) {
      resultsModal.classList.add('hidden'); resetTest();
    }
  });
  window.addEventListener('resize', function () {
    if (!resultsModal.classList.contains('hidden')) drawChart();
  });

  // ---------- Init ----------
  $('soundOn').classList.toggle('hidden', !soundOn);
  $('soundOff').classList.toggle('hidden', soundOn);
  loadSnippet('javascript');
  renderHeat();
})();
