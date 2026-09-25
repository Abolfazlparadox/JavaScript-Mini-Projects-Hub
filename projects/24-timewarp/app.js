/**
 * TimeWarp Studio (#24) | World Clock + Stopwatch + Countdown
 * Intl time zones, canvas analog clock, precision stopwatch with laps,
 * countdown ring with Web Audio alarm.
 */
(function () {
  'use strict';

  var LS_ZONES = 'timewarp_zones_v1';
  var LS_SOUND = 'timewarp_sound_v1';
  var COMMON_ZONES = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tehran',
    'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Singapore',
    'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland',
  ];

  function $(id) { return document.getElementById(id); }
  var toasts = $('toastContainer');
  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    toasts.appendChild(el);
    setTimeout(function () { el.remove(); }, 2000);
  }
  function loadJSON(k, fb) { try { var r = localStorage.getItem(k); return r === null ? fb : JSON.parse(r); } catch (e) { return fb; } }

  var soundOn = loadJSON(LS_SOUND, true);
  var actx = null;
  function beep(freq, dur, when, vol) {
    if (!soundOn) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      var t = actx.currentTime + (when || 0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) {}
  }
  function alarm() { for (var i = 0; i < 4; i++) { beep(880, 0.25, i * 0.32); beep(660, 0.25, i * 0.32 + 0.16); } }

  // ---------- Tabs ----------
  $('modeTabs').addEventListener('click', function (e) {
    var b = e.target.closest('.mode-btn');
    if (!b) return;
    var btns = this.querySelectorAll('.mode-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    b.classList.add('active');
    ['clock', 'stopwatch', 'countdown'].forEach(function (t) {
      $('tab-' + t).classList.toggle('hidden', t !== b.dataset.tab);
    });
  });

  // ---------- World clock ----------
  var zones = loadJSON(LS_ZONES, ['UTC', 'Asia/Tehran', 'Europe/London', 'America/New_York']);
  var zoneGrid = $('zoneGrid'), zoneSelect = $('zoneSelect');

  COMMON_ZONES.forEach(function (z) {
    var o = document.createElement('option');
    o.value = z; o.textContent = z.replace(/_/g, ' ');
    zoneSelect.appendChild(o);
  });

  function fmtInZone(date, tz, opts) {
    try { return new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: tz }, opts)).format(date); }
    catch (e) { return '—'; }
  }
  function tickClock() {
    var now = new Date();
    $('localTime').textContent = now.toLocaleTimeString('en-GB');
    $('localDate').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    try { $('localTz').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time'; } catch (e) {}
    drawAnalog(now);
    var cards = zoneGrid.querySelectorAll('.zone-card');
    for (var i = 0; i < cards.length; i++) {
      var tz = cards[i].dataset.tz;
      cards[i].querySelector('.zt').textContent = fmtInZone(now, tz, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      cards[i].querySelector('.zd').textContent = fmtInZone(now, tz, { weekday: 'short', month: 'short', day: 'numeric' });
    }
  }
  function renderZones() {
    zoneGrid.innerHTML = '';
    zones.forEach(function (tz) {
      var card = document.createElement('div');
      card.className = 'zone-card';
      card.dataset.tz = tz;
      var short = tz.split('/').pop().replace(/_/g, ' ');
      card.innerHTML = '<strong>' + short + '</strong><div class="zt">--:--:--</div><div class="zd">—</div>' +
        '<button class="zone-del" title="Remove">✕</button>';
      zoneGrid.appendChild(card);
    });
    tickClock();
  }
  zoneGrid.addEventListener('click', function (e) {
    var del = e.target.closest('.zone-del');
    if (!del) return;
    var tz = e.target.closest('.zone-card').dataset.tz;
    zones = zones.filter(function (z) { return z !== tz; });
    try { localStorage.setItem(LS_ZONES, JSON.stringify(zones)); } catch (e2) {}
    renderZones();
  });
  $('btnAddZone').addEventListener('click', function () {
    var tz = zoneSelect.value;
    if (zones.indexOf(tz) !== -1) { toast('Zone already added', ''); return; }
    zones.push(tz);
    try { localStorage.setItem(LS_ZONES, JSON.stringify(zones)); } catch (e) {}
    renderZones();
    toast(tz + ' added ✓', 'success');
  });

  var analog = $('analogCanvas');
  function drawAnalog(now) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var size = 190;
    if (analog.width !== size * dpr) { analog.width = size * dpr; analog.height = size * dpr; }
    var ctx = analog.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    var cx = size / 2, cy = size / 2, R = size / 2 - 8;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
    ctx.strokeStyle = 'rgba(56,189,248,0.4)'; ctx.lineWidth = 2; ctx.stroke();
    for (var i = 0; i < 60; i++) {
      var a = (i / 60) * Math.PI * 2;
      var big = i % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (R - (big ? 12 : 6)), cy + Math.sin(a) * (R - (big ? 12 : 6)));
      ctx.lineTo(cx + Math.cos(a) * (R - 2), cy + Math.sin(a) * (R - 2));
      ctx.strokeStyle = big ? '#7dd3fc' : 'rgba(148,163,184,0.4)';
      ctx.lineWidth = big ? 3 : 1.5;
      ctx.stroke();
    }
    var h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds() + now.getMilliseconds() / 1000;
    hand(((h + m / 60) / 12) * Math.PI * 2 - Math.PI / 2, R * 0.5, 5, '#f8fafc');
    hand(((m + s / 60) / 60) * Math.PI * 2 - Math.PI / 2, R * 0.72, 3.5, '#a5b4fc');
    hand((s / 60) * Math.PI * 2 - Math.PI / 2, R * 0.85, 1.5, '#f43f5e');
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fillStyle = '#f43f5e'; ctx.fill();
    function hand(angle, len, wdt, color) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.strokeStyle = color; ctx.lineWidth = wdt; ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  // ---------- Stopwatch ----------
  var swRunning = false, swStart = 0, swElapsed = 0, swTimer = null, laps = [];
  function fmtSw(ms) {
    var t = Math.floor(ms);
    var mm = String(Math.floor(t / 60000)).padStart(2, '0');
    var ss = String(Math.floor((t % 60000) / 1000)).padStart(2, '0');
    var cs = String(Math.floor((t % 1000) / 10)).padStart(2, '0');
    return { main: mm + ':' + ss, frac: '.' + cs };
  }
  function paintSw() {
    var ms = swElapsed + (swRunning ? performance.now() - swStart : 0);
    var f = fmtSw(ms);
    $('swDisplay').innerHTML = f.main + '<span>' + f.frac + '</span>';
  }
  function renderLaps() {
    var list = $('lapsList');
    list.innerHTML = '';
    $('lapsEmpty').style.display = laps.length ? 'none' : 'block';
    if (!laps.length) return;
    var times = laps.map(function (l) { return l.split; });
    var fast = Math.min.apply(null, times), slow = Math.max.apply(null, times);
    for (var i = laps.length - 1; i >= 0; i--) {
      var li = document.createElement('li');
      var tag = '';
      if (laps.length > 1 && laps[i].split === fast) { li.className = 'fastest'; tag = '<span class="tag">fastest</span>'; }
      if (laps.length > 1 && laps[i].split === slow) { li.className = 'slowest'; tag = '<span class="tag">slowest</span>'; }
      li.innerHTML = '<span>Lap ' + (i + 1) + tag + '</span><span>+' + fmtSw(laps[i].split).main + fmtSw(laps[i].split).frac + ' &nbsp;·&nbsp; ' + fmtSw(laps[i].total).main + '</span>';
      list.appendChild(li);
    }
  }
  $('btnSwStart').addEventListener('click', function () {
    if (swRunning) {
      swElapsed += performance.now() - swStart;
      swRunning = false;
      clearInterval(swTimer);
      this.textContent = '▶ Start';
    } else {
      swStart = performance.now();
      swRunning = true;
      clearInterval(swTimer);
      swTimer = setInterval(paintSw, 31);
      this.textContent = '⏸ Pause';
      beep(520, 0.08);
    }
  });
  $('btnSwLap').addEventListener('click', function () {
    if (!swRunning) { toast('Start the stopwatch first', ''); return; }
    var total = swElapsed + (performance.now() - swStart);
    var prev = laps.length ? laps[laps.length - 1].total : 0;
    laps.push({ total: Math.round(total), split: Math.round(total - prev) });
    renderLaps();
    beep(700, 0.07);
  });
  $('btnSwReset').addEventListener('click', function () {
    swRunning = false; clearInterval(swTimer);
    swElapsed = 0; laps = [];
    $('btnSwStart').textContent = '▶ Start';
    paintSw(); renderLaps();
  });

  // ---------- Countdown ----------
  var cdTotal = 1500, cdLeft = 1500, cdTimer = null, cdRunning = false, cdEnd = 0;
  var C = 603.2;
  function paintCd() {
    var mm = String(Math.floor(cdLeft / 60)).padStart(2, '0');
    var ss = String(Math.floor(cdLeft % 60)).padStart(2, '0');
    $('cdDisplay').textContent = mm + ':' + ss;
    var frac = cdTotal > 0 ? cdLeft / cdTotal : 0;
    $('cdRing').style.strokeDashoffset = String(C - C * frac);
    $('cdRing').style.stroke = cdLeft <= 10 && cdRunning ? '#ef4444' : '#6366f1';
    document.querySelector('.cd-card').classList.toggle('alarm', cdRunning && cdLeft <= 0);
  }
  function readCdInputs() {
    var h = Math.max(0, +$('cdH').value || 0), m = Math.max(0, +$('cdM').value || 0), s = Math.max(0, +$('cdS').value || 0);
    return h * 3600 + m * 60 + s;
  }
  function syncCdFromInputs() {
    if (cdRunning) return;
    cdTotal = readCdInputs() || 1500;
    cdLeft = cdTotal;
    $('cdSub').textContent = 'ready';
    paintCd();
  }
  ['cdH', 'cdM', 'cdS'].forEach(function (id) { $(id).addEventListener('input', syncCdFromInputs); });
  document.querySelectorAll('[data-cd]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (cdRunning) return;
      var v = +b.dataset.cd;
      $('cdH').value = Math.floor(v / 3600);
      $('cdM').value = Math.floor((v % 3600) / 60);
      $('cdS').value = v % 60;
      syncCdFromInputs();
    });
  });
  $('btnCdStart').addEventListener('click', function () {
    if (cdRunning) {
      cdRunning = false;
      clearInterval(cdTimer);
      this.textContent = '▶ Resume';
      $('cdSub').textContent = 'paused';
      return;
    }
    if (cdLeft <= 0) syncCdFromInputs();
    if (cdTotal <= 0) { toast('Set a duration first', ''); return; }
    cdRunning = true;
    cdEnd = Date.now() + cdLeft * 1000;
    this.textContent = '⏸ Pause';
    $('cdSub').textContent = 'running';
    beep(520, 0.1);
    clearInterval(cdTimer);
    cdTimer = setInterval(function () {
      cdLeft = Math.max(0, Math.round((cdEnd - Date.now()) / 1000));
      paintCd();
      if (cdLeft <= 0) {
        clearInterval(cdTimer);
        cdRunning = false;
        $('btnCdStart').textContent = '▶ Start';
        $('cdSub').textContent = "time's up!";
        alarm();
        toast("⏰ Time's up!", 'success');
        try {
          if ('Notification' in window && Notification.permission === 'granted') new Notification("TimeWarp: time's up! ⏰");
        } catch (e) {}
      }
    }, 250);
  });
  $('btnCdReset').addEventListener('click', function () {
    cdRunning = false;
    clearInterval(cdTimer);
    $('btnCdStart').textContent = '▶ Start';
    syncCdFromInputs();
  });

  // ---------- Sound + shortcuts ----------
  function paintSound() { $('btnSound').textContent = soundOn ? '🔊' : '🔇'; }
  $('btnSound').addEventListener('click', function () {
    soundOn = !soundOn;
    try { localStorage.setItem(LS_SOUND, JSON.stringify(soundOn)); } catch (e) {}
    paintSound();
    toast(soundOn ? 'Sound on 🔊' : 'Sound muted 🔇');
  });
  window.addEventListener('keydown', function (e) {
    var typing = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) !== -1;
    if (typing) return;
    if (e.code === 'Space' && !$('tab-stopwatch').classList.contains('hidden')) { e.preventDefault(); $('btnSwStart').click(); }
    else if (e.key.toLowerCase() === 'l' && !$('tab-stopwatch').classList.contains('hidden')) { $('btnSwLap').click(); }
  });

  // ---------- Init ----------
  paintSound();
  renderZones();
  paintSw(); renderLaps();
  syncCdFromInputs();
  setInterval(tickClock, 250);
  tickClock();
  try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {}
})();
