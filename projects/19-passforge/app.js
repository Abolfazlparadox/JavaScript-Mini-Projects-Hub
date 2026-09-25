/**
 * PassForge Studio (#19) | Secure Password / Passphrase / PIN Generator
 * crypto.getRandomValues entropy, strength meter, crack-time estimates,
 * color-coded output and local history.
 */
(function () {
  'use strict';

  var LS_OPTS = 'passforge_opts_v1';
  var LS_HIST = 'passforge_hist_v1';

  var SETS = {
    upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
    lower: 'abcdefghijkmnopqrstuvwxyz',
    digits: '23456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.<>?/~',
  };
  var AMBIGUOUS = '0O1lI|';
  var FULL = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
  };
  var WORDS = ('amber arctic beacon blaze breeze cactus canyon cedar cliff cloud comet coral crater dune ember '
    + 'falcon fern flame forest frost grove harbor hazel heron ivory jasmine juniper karma kayak lagoon lark '
    + 'lotus lunar maple meadow mesa mist moss north nova oak ocean olive onyx opal otter palm peak pepper '
    + 'pine plume quail quartz raven reef ridge river robin rocky sage sand shell sky slate solar spruce stone '
    + 'storm summit terra tide timber topaz trout tundra valley vapor willow wind wolf yarn yoga zephyr zinc').split(' ');

  function $(id) { return document.getElementById(id); }
  var outputText = $('outputText'), meterFill = $('meterFill'), strengthLabel = $('strengthLabel');
  var statEntropy = $('statEntropy'), statCharset = $('statCharset'), statCrack = $('statCrack'), statLen = $('statLen');
  var histList = $('histList'), toasts = $('toastContainer');

  var state = { mode: 'password', value: '', entropy: 0, charset: 0 };
  var opts = loadJSON(LS_OPTS, null) || {
    len: 20, upper: true, lower: true, digits: true, symbols: true, noAmbig: true,
    words: 5, sep: '-', caps: true, ppNum: true, pinLen: 6,
  };
  var history = loadJSON(LS_HIST, []);

  function loadJSON(k, fb) { try { var r = localStorage.getItem(k); return r === null ? fb : JSON.parse(r); } catch (e) { return fb; } }
  function persist() {
    try {
      localStorage.setItem(LS_OPTS, JSON.stringify(opts));
      localStorage.setItem(LS_HIST, JSON.stringify(history.slice(0, 24)));
    } catch (e) {}
  }
  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    toasts.appendChild(el);
    setTimeout(function () { el.remove(); }, 2000);
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Secure random int in [0, max)
  function randInt(max) {
    var arr = new Uint32Array(1);
    var limit = Math.floor(4294967296 / max) * max;
    var x;
    do { crypto.getRandomValues(arr); x = arr[0]; } while (x >= limit);
    return x % max;
  }

  function buildCharset() {
    var s = '';
    if (opts.upper) s += opts.noAmbig ? SETS.upper : FULL.upper;
    if (opts.lower) s += opts.noAmbig ? SETS.lower : FULL.lower;
    if (opts.digits) s += opts.noAmbig ? SETS.digits : FULL.digits;
    if (opts.symbols) s += SETS.symbols;
    return s;
  }

  function generate() {
    var val = '', charset = 0, entropy = 0;
    if (state.mode === 'password') {
      var set = buildCharset();
      if (!set) { toast('Select at least one character set', ''); return; }
      var chars = [];
      for (var i = 0; i < opts.len; i++) chars.push(set[randInt(set.length)]);
      val = chars.join('');
      charset = set.length;
      entropy = opts.len * Math.log2(set.length);
    } else if (state.mode === 'passphrase') {
      var words = [];
      for (var w = 0; w < opts.words; w++) {
        var wd = WORDS[randInt(WORDS.length)];
        words.push(opts.caps ? wd.charAt(0).toUpperCase() + wd.slice(1) : wd);
      }
      val = words.join(opts.sep);
      entropy = opts.words * Math.log2(WORDS.length);
      if (opts.ppNum) { val += randInt(10); entropy += Math.log2(10); }
      charset = WORDS.length;
    } else {
      var pin = [];
      for (var p = 0; p < opts.pinLen; p++) pin.push(randInt(10));
      val = pin.join('');
      charset = 10;
      entropy = opts.pinLen * Math.log2(10);
    }
    state.value = val; state.entropy = entropy; state.charset = charset;
    history.unshift({ v: val, mode: state.mode, t: Date.now() });
    history = history.slice(0, 24);
    persist();
    render();
    renderHistory();
  }

  function crackTime(entropyBits) {
    var guesses = Math.pow(2, Math.max(entropyBits - 1, 0));
    var secs = guesses / 1e10; // 10B guesses/sec offline attack
    if (!isFinite(secs)) return 'heat-death ☠️';
    var units = [[60, 'sec'], [60, 'min'], [24, 'hrs'], [30.4, 'days'], [12, 'mo']];
    var v = secs, u = 'sec';
    for (var i = 0; i < units.length; i++) {
      if (v < units[i][0] || i === units.length - 1 && v < 1e6) { u = units[i][1]; break; }
      v /= units[i][0]; u = i + 1 < units.length ? units[i + 1][1] : 'yrs';
      if (i === units.length - 1) u = 'yrs';
    }
    if (u === 'yrs' && v >= 1e9) return (v / 1e9).toFixed(1) + 'B yrs';
    if (u === 'yrs' && v >= 1e6) return (v / 1e6).toFixed(1) + 'M yrs';
    if (v >= 1000) return v.toExponential(1) + ' ' + u;
    return (Math.round(v * 10) / 10) + ' ' + u;
  }

  function colorize(val) {
    var html = '';
    for (var i = 0; i < val.length; i++) {
      var ch = val[i], cls = 'c-lower';
      if (/[A-Z]/.test(ch)) cls = 'c-upper';
      else if (/[0-9]/.test(ch)) cls = 'c-digit';
      else if (/[^a-zA-Z0-9]/.test(ch)) cls = 'c-sym';
      html += '<span class="' + cls + '">' + esc(ch) + '</span>';
    }
    return html;
  }

  function render() {
    outputText.innerHTML = state.value ? colorize(state.value) : '—';
    statEntropy.textContent = Math.round(state.entropy) + ' bits';
    statCharset.textContent = state.charset;
    statCrack.textContent = state.value ? crackTime(state.entropy) : '—';
    statLen.textContent = state.value.length;
    var score = Math.min(state.entropy / 128, 1);
    var pct = Math.round(score * 100);
    meterFill.style.width = pct + '%';
    var label, color;
    if (state.entropy >= 100) { label = 'Fortress 🛡️'; color = '#10b981'; }
    else if (state.entropy >= 70) { label = 'Strong 💪'; color = '#34d399'; }
    else if (state.entropy >= 50) { label = 'Decent 🙂'; color = '#f59e0b'; }
    else if (state.entropy >= 30) { label = 'Weak 😟'; color = '#fb923c'; }
    else { label = 'Cracked instantly ⚠️'; color = '#ef4444'; }
    meterFill.style.background = color;
    strengthLabel.textContent = label;
    strengthLabel.style.color = color;
  }

  function renderHistory() {
    histList.innerHTML = '';
    if (!history.length) {
      histList.innerHTML = '<li class="hist-empty" style="cursor:default">No passwords yet — generate one! 🎲</li>';
      return;
    }
    history.forEach(function (h) {
      var li = document.createElement('li');
      li.title = 'Click to copy';
      var time = new Date(h.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      li.innerHTML = '<span>' + esc(h.v) + '</span><small>' + h.mode + ' • ' + time + '</small>';
      li.addEventListener('click', function () { copyText(h.v); });
      histList.appendChild(li);
    });
  }

  function copyText(text) {
    text = text || state.value;
    if (!text) { toast('Nothing to copy', ''); return; }
    function done() { toast('Copied to clipboard ✓', 'success'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(); done(); });
    } else { fallback(); done(); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove();
    }
  }

  // ---------- Wiring ----------
  function setMode(m) {
    state.mode = m;
    var btns = document.querySelectorAll('.mode-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.mode === m);
    $('passwordOpts').classList.toggle('hidden', m !== 'password');
    $('passphraseOpts').classList.toggle('hidden', m !== 'passphrase');
    $('pinOpts').classList.toggle('hidden', m !== 'pin');
    generate();
  }
  $('modeTabs').addEventListener('click', function (e) {
    var b = e.target.closest('.mode-btn');
    if (b) setMode(b.dataset.mode);
  });

  function bindLen(id, valId, key, regen) {
    $(id).addEventListener('input', function () {
      opts[key] = +$(id).value;
      $(valId).textContent = $(id).value;
      persist();
      if (regen) generate();
    });
  }
  bindLen('lenSlider', 'lenVal', 'len', true);
  bindLen('wordsSlider', 'wordsVal', 'words', true);
  bindLen('pinSlider', 'pinVal', 'pinLen', true);

  function bindCheck(id, key) {
    $(id).addEventListener('change', function () { opts[key] = $(id).checked; persist(); generate(); });
  }
  bindCheck('optUpper', 'upper'); bindCheck('optLower', 'lower');
  bindCheck('optDigits', 'digits'); bindCheck('optSymbols', 'symbols');
  bindCheck('optAmbiguous', 'noAmbig'); bindCheck('optCaps', 'caps'); bindCheck('optPpNum', 'ppNum');
  $('sepSelect').addEventListener('change', function () { opts.sep = $('sepSelect').value; persist(); generate(); });

  $('btnGenerate').addEventListener('click', generate);
  $('btnRegenTop').addEventListener('click', generate);
  $('btnCopy').addEventListener('click', function () { copyText(); });
  $('btnCopyTop').addEventListener('click', function () { copyText(); });
  $('outputBox').addEventListener('click', function () { copyText(); });
  $('btnClearHist').addEventListener('click', function () { history = []; persist(); renderHistory(); toast('History cleared'); });

  window.addEventListener('keydown', function (e) {
    var typing = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) !== -1;
    if (typing) return;
    if (e.key.toLowerCase() === 'g') generate();
    else if (e.key.toLowerCase() === 'c') copyText();
  });

  // ---------- Init ----------
  $('lenSlider').value = opts.len; $('lenVal').textContent = opts.len;
  $('optUpper').checked = opts.upper; $('optLower').checked = opts.lower;
  $('optDigits').checked = opts.digits; $('optSymbols').checked = opts.symbols;
  $('optAmbiguous').checked = opts.noAmbig;
  $('wordsSlider').value = opts.words; $('wordsVal').textContent = opts.words;
  $('sepSelect').value = opts.sep; $('optCaps').checked = opts.caps; $('optPpNum').checked = opts.ppNum;
  $('pinSlider').value = opts.pinLen; $('pinVal').textContent = opts.pinLen;
  generate();
})();
