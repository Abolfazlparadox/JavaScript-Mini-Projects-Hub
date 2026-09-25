/**
 * ChoiceWheel (#27) | Decision Spinner Engine
 * Weighted canvas wheel, eased spin physics, tick sounds,
 * confetti winner modal and history.
 */
(function () {
  'use strict';

  var LS_OPTS = 'choicewheel_opts_v1';
  var LS_HIST = 'choicewheel_hist_v1';
  var LS_SOUND = 'choicewheel_sound_v1';
  var PALETTE = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#38bdf8', '#a78bfa', '#f43f5e', '#facc15', '#34d399', '#fb923c', '#22d3ee', '#e879f9'];

  function $(id) { return document.getElementById(id); }
  var canvas = $('wheelCanvas'), ctx = canvas.getContext('2d');
  var optList = $('optList'), histList = $('histList'), wheelStatus = $('wheelStatus');
  var btnSpin = $('btnSpin'), toasts = $('toastContainer');

  var options = loadJSON(LS_OPTS, null) || seed();
  var history = loadJSON(LS_HIST, []);
  var soundOn = loadJSON(LS_SOUND, true);
  var angle = 0, spinning = false, lastWinner = null;

  function loadJSON(k, fb) { try { var r = localStorage.getItem(k); return r === null ? fb : JSON.parse(r); } catch (e) { return fb; } }
  function persist() {
    try {
      localStorage.setItem(LS_OPTS, JSON.stringify(options));
      localStorage.setItem(LS_HIST, JSON.stringify(history.slice(0, 20)));
      localStorage.setItem(LS_SOUND, JSON.stringify(soundOn));
    } catch (e) {}
  }
  function uid() { return 'o' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
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
  function seed() {
    return [
      { id: uid(), label: 'Pizza 🍕', weight: 2, color: 0 },
      { id: uid(), label: 'Sushi 🍣', weight: 1, color: 1 },
      { id: uid(), label: 'Burger 🍔', weight: 2, color: 2 },
      { id: uid(), label: 'Salad 🥗', weight: 1, color: 3 },
      { id: uid(), label: 'Pasta 🍝', weight: 1, color: 4 },
      { id: uid(), label: 'Tacos 🌮', weight: 1, color: 5 },
    ];
  }

  // ---------- Audio ----------
  var actx = null;
  function tick() {
    if (!soundOn) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = 'square'; o.frequency.value = 1400;
      var t = actx.currentTime;
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + 0.04);
    } catch (e) {}
  }
  function fanfare() {
    if (!soundOn) return;
    [523, 659, 784, 1047].forEach(function (f, i) {
      setTimeout(function () {
        try {
          if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
          var o = actx.createOscillator(), g = actx.createGain();
          o.type = 'triangle'; o.frequency.value = f;
          var t = actx.currentTime;
          g.gain.setValueAtTime(0.12, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
          o.connect(g); g.connect(actx.destination);
          o.start(t); o.stop(t + 0.32);
        } catch (e) {}
      }, i * 120);
    });
  }

  // ---------- Wheel geometry (weighted) ----------
  function segments() {
    var total = options.reduce(function (a, o) { return a + o.weight; }, 0) || 1;
    var segs = [], acc = 0;
    options.forEach(function (o) {
      var frac = o.weight / total;
      segs.push({ opt: o, from: acc * Math.PI * 2, to: (acc + frac) * Math.PI * 2 });
      acc += frac;
    });
    return segs;
  }
  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    var s = Math.max(200, Math.min(r.width || 400, 440));
    canvas.width = s * dpr; canvas.height = s * dpr;
    draw();
  }
  function draw() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var s = canvas.width / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, s, s);
    var cx = s / 2, cy = s / 2, R = s / 2 - 6;
    var segs = segments();
    if (!segs.length) {
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#64748b'; ctx.font = '14px Outfit, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Add options to begin', cx, cy);
      return;
    }
    // Outer rim
    ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b'; ctx.fill();
    segs.forEach(function (sg) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, angle + sg.from, angle + sg.to);
      ctx.closePath();
      ctx.fillStyle = PALETTE[sg.opt.color % PALETTE.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2; ctx.stroke();
      // Label
      var mid = angle + (sg.from + sg.to) / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(mid);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      var label = sg.opt.label.length > 18 ? sg.opt.label.slice(0, 17) + '…' : sg.opt.label;
      ctx.font = '700 ' + Math.max(11, Math.min(15, R * 0.075)) + 'px Outfit, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
      ctx.fillText(label, R - 14, 0);
      ctx.restore();
    });
    // Bulbs
    for (var i = 0; i < 12; i++) {
      var a = (i / 12) * Math.PI * 2 + angle * 0.2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * (R + 2), cy + Math.sin(a) * (R + 2), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? '#fcd34d' : '#fff';
      ctx.fill();
    }
  }
  function winnerAt(a) {
    var segs = segments();
    if (!segs.length) return null;
    // Pointer at top = angle -PI/2 in canvas space; normalize
    var p = ((-Math.PI / 2 - a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    for (var i = 0; i < segs.length; i++) {
      if (p >= segs[i].from && p < segs[i].to) return segs[i].opt;
    }
    return segs[0].opt;
  }

  // ---------- Spin ----------
  function spin() {
    if (spinning) return;
    if (options.length < 2) { toast('Add at least 2 options', ''); $('optInput').focus(); return; }
    spinning = true;
    btnSpin.disabled = true;
    wheelStatus.textContent = 'Spinning… 🌀';
    var startAngle = angle;
    var turns = 5 + Math.random() * 4;
    var target = startAngle + turns * Math.PI * 2;
    var dur = 4200 + Math.random() * 1800;
    var t0 = performance.now();
    var lastTickSeg = -1;
    function frame(now) {
      var t = Math.min((now - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
      angle = startAngle + (target - startAngle) * eased;
      draw();
      // Tick per segment boundary pass
      var segs = segments().length || 1;
      var segIdx = Math.floor(((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2 / segs));
      if (segIdx !== lastTickSeg) { lastTickSeg = segIdx; if (t < 0.97) tick(); }
      if (t < 1) { requestAnimationFrame(frame); }
      else {
        angle = target % (Math.PI * 2);
        draw();
        finishSpin();
      }
    }
    requestAnimationFrame(frame);
  }
  function finishSpin() {
    spinning = false;
    btnSpin.disabled = false;
    var w = winnerAt(angle);
    lastWinner = w;
    if (!w) return;
    wheelStatus.textContent = 'Winner: ' + w.label + ' 🎉';
    history.unshift({ label: w.label, t: Date.now() });
    history = history.slice(0, 20);
    persist();
    renderHistory();
    fanfare();
    setTimeout(function () {
      $('winnerName').textContent = w.label;
      $('winnerModal').classList.remove('hidden');
      launchConfetti();
    }, 350);
  }

  // ---------- Confetti ----------
  var confetti = [], confettiRunning = false;
  function launchConfetti() {
    var c = $('confettiCanvas');
    var box = c.parentElement.getBoundingClientRect();
    c.width = box.width; c.height = box.height;
    confetti = [];
    var colors = PALETTE;
    for (var i = 0; i < 140; i++) {
      confetti.push({
        x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.3,
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
        vy: 2 + Math.random() * 3, vx: -1.5 + Math.random() * 3,
        rot: Math.random() * Math.PI, vr: -0.15 + Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    if (!confettiRunning) { confettiRunning = true; requestAnimationFrame(confettiLoop); }
  }
  function confettiLoop() {
    var c = $('confettiCanvas');
    if ($('winnerModal').classList.contains('hidden')) { confettiRunning = false; return; }
    var cx2 = c.getContext('2d');
    cx2.clearRect(0, 0, c.width, c.height);
    var alive = false;
    confetti.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      if (p.y < c.height + 30) alive = true;
      cx2.save();
      cx2.translate(p.x, p.y); cx2.rotate(p.rot);
      cx2.fillStyle = p.color;
      cx2.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      cx2.restore();
    });
    if (alive) requestAnimationFrame(confettiLoop);
    else confettiRunning = false;
  }

  // ---------- Options UI ----------
  function renderOptions() {
    optList.innerHTML = '';
    $('optCount').textContent = options.length + ' options';
    options.forEach(function (o) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="dot" style="background:' + PALETTE[o.color % PALETTE.length] + '"></span>' +
        '<span>' + esc(o.label) + '</span><small>×' + o.weight + '</small>' +
        '<button data-del="' + o.id + '" title="Remove">✕</button>';
      optList.appendChild(li);
    });
    draw();
  }
  function renderHistory() {
    histList.innerHTML = '';
    if (!history.length) {
      histList.innerHTML = '<li><span>No spins yet — good luck! 🍀</span></li>';
      return;
    }
    history.forEach(function (h) {
      var li = document.createElement('li');
      var time = new Date(h.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      li.innerHTML = '<b>👑 ' + esc(h.label) + '</b><span>' + time + '</span>';
      histList.appendChild(li);
    });
  }
  function addOption() {
    var label = $('optInput').value.trim();
    if (!label) { toast('Enter an option label', ''); return; }
    options.push({ id: uid(), label: label, weight: +$('optWeight').value, color: options.length % PALETTE.length });
    $('optInput').value = '';
    persist(); renderOptions();
    $('optInput').focus();
  }

  // ---------- Events ----------
  btnSpin.addEventListener('click', spin);
  $('btnAddOpt').addEventListener('click', addOption);
  $('optInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') addOption(); });
  optList.addEventListener('click', function (e) {
    var del = e.target.closest('[data-del]');
    if (!del) return;
    options = options.filter(function (o) { return o.id !== del.dataset.del; });
    persist(); renderOptions();
  });
  $('btnShuffle').addEventListener('click', function () {
    var cols = options.map(function (o) { return o.color; });
    for (var i = cols.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = cols[i]; cols[i] = cols[j]; cols[j] = t;
    }
    options.forEach(function (o, idx) { o.color = cols[idx]; });
    persist(); renderOptions();
    toast('Colors shuffled 🔀');
  });
  $('btnClearOpts').addEventListener('click', function () {
    if (!options.length || !confirm('Remove all options?')) return;
    options = [];
    persist(); renderOptions();
  });
  $('btnKeepWinner').addEventListener('click', function () { $('winnerModal').classList.add('hidden'); });
  $('winnerModal').addEventListener('click', function (e) { if (e.target === $('winnerModal')) $('winnerModal').classList.add('hidden'); });
  $('btnSpinAgain').addEventListener('click', function () { $('winnerModal').classList.add('hidden'); setTimeout(spin, 150); });
  $('btnRemoveWinner').addEventListener('click', function () {
    if (lastWinner) {
      options = options.filter(function (o) { return o.id !== lastWinner.id; });
      persist(); renderOptions();
      toast('Winner removed ✓');
    }
    $('winnerModal').classList.add('hidden');
    setTimeout(spin, 150);
  });
  $('btnSound').addEventListener('click', function () {
    soundOn = !soundOn; persist();
    $('btnSound').textContent = soundOn ? '🔊' : '🔇';
  });
  window.addEventListener('keydown', function (e) {
    var typing = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) !== -1;
    if (e.code === 'Space' && !typing && $('winnerModal').classList.contains('hidden')) { e.preventDefault(); spin(); }
    else if (e.key === 'Escape') { $('winnerModal').classList.add('hidden'); }
    else if (e.key === 'Enter' && !$('winnerModal').classList.contains('hidden')) { $('btnSpinAgain').click(); }
  });
  window.addEventListener('resize', sizeCanvas);

  // ---------- Init ----------
  $('btnSound').textContent = soundOn ? '🔊' : '🔇';
  renderOptions();
  renderHistory();
  sizeCanvas();
  setTimeout(sizeCanvas, 120);
})();
