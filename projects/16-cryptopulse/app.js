/**
 * CryptoPulse (#16) | Real-Time Market Ticker Engine
 * Live Binance REST + WebSocket streaming with graceful fallback to an
 * offline geometric-random-walk simulation. Canvas sparklines, watchlist,
 * threshold alerts (sound + Notification API) and detail charts.
 */
(function () {
  'use strict';

  var COINS = [
    { sym: 'BTC', pair: 'BTCUSDT', name: 'Bitcoin',   base: 97400,  decimals: 0, color: '#f7931a', vol: 28e9 },
    { sym: 'ETH', pair: 'ETHUSDT', name: 'Ethereum',  base: 3420,   decimals: 1, color: '#627eea', vol: 14e9 },
    { sym: 'SOL', pair: 'SOLUSDT', name: 'Solana',    base: 214,    decimals: 2, color: '#9945ff', vol: 3.2e9 },
    { sym: 'BNB', pair: 'BNBUSDT', name: 'BNB Chain', base: 692,    decimals: 2, color: '#f0b90b', vol: 1.4e9 },
    { sym: 'XRP', pair: 'XRPUSDT', name: 'Ripple',    base: 2.31,   decimals: 3, color: '#25a4e8', vol: 5.1e9 },
    { sym: 'DOGE', pair: 'DOGEUSDT', name: 'Dogecoin', base: 0.321, decimals: 4, color: '#c2a633', vol: 2.2e9 },
    { sym: 'ADA', pair: 'ADAUSDT', name: 'Cardano',   base: 0.94,   decimals: 4, color: '#3468d1', vol: 0.9e9 },
    { sym: 'AVAX', pair: 'AVAXUSDT', name: 'Avalanche', base: 41.2, decimals: 2, color: '#e84142', vol: 0.6e9 },
  ];
  var LS_WATCH = 'cryptopulse_watch_v1';
  var LS_ALERTS = 'cryptopulse_alerts_v1';
  var LS_SOUND = 'cryptopulse_sound_v1';
  var HIST_LEN = 90;

  // ---------- State ----------
  var market = {}; // sym -> {price, prev, open, high, low, volume, history[]}
  var mode = 'connecting'; // live | simulated | connecting
  var watchlist = loadJSON(LS_WATCH, ['BTC', 'ETH']);
  var alerts = loadJSON(LS_ALERTS, []);
  var soundOn = loadJSON(LS_SOUND, true);
  var query = '', sortMode = 'market', watchOnly = false;
  var detailSym = null, detailTimer = null;
  var sparkRefs = {}; // sym -> canvas ctx bundle

  COINS.forEach(function (c) {
    var open = c.base * (1 + (Math.random() - 0.5) * 0.03);
    market[c.sym] = {
      price: c.base, prev: c.base, open: open,
      high: Math.max(c.base, open) * 1.004, low: Math.min(c.base, open) * 0.996,
      volume: c.vol * (0.9 + Math.random() * 0.2),
      history: seedHistory(c.base),
    };
  });

  function seedHistory(base) {
    var h = [], p = base * (1 + (Math.random() - 0.5) * 0.02);
    for (var i = 0; i < HIST_LEN; i++) {
      p *= 1 + (Math.random() - 0.5) * 0.004;
      h.push(p);
    }
    h.push(base);
    return h.slice(-HIST_LEN);
  }

  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function persist() {
    try {
      localStorage.setItem(LS_WATCH, JSON.stringify(watchlist));
      localStorage.setItem(LS_ALERTS, JSON.stringify(alerts));
      localStorage.setItem(LS_SOUND, JSON.stringify(soundOn));
    } catch (e) {}
  }

  // ---------- DOM ----------
  function $(id) { return document.getElementById(id); }
  var grid = $('coinGrid'), emptyState = $('emptyState');
  var connPill = $('connPill'), connText = $('connText');
  var ovGainers = $('ovGainers'), ovLosers = $('ovLosers'), ovVolume = $('ovVolume'), ovUpdated = $('ovUpdated');
  var searchInput = $('searchInput'), sortSelect = $('sortSelect'), watchToggle = $('watchToggle');
  var detailModal = $('detailModal'), detailTitle = $('detailTitle'), detailPrice = $('detailPrice');
  var detailChange = $('detailChange'), detailChart = $('detailChart'), detailStats = $('detailStats');
  var alertsModal = $('alertsModal'), alertsList = $('alertsList'), alertCount = $('alertCount');
  var toasts = $('toastContainer');

  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    toasts.appendChild(el);
    setTimeout(function () { el.remove(); }, 3200);
  }

  // ---------- Formatting ----------
  function fmtPrice(c, p) {
    return '$' + Number(p).toLocaleString('en-US', { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals });
  }
  function fmtCompact(n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    return '$' + Math.round(n).toLocaleString();
  }
  function changePct(sym) {
    var m = market[sym];
    return ((m.price - m.open) / m.open) * 100;
  }

  // ---------- Sound + notifications ----------
  var actx = null;
  function beep() {
    if (!soundOn) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      [660, 880].forEach(function (f, i) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        var t = actx.currentTime + i * 0.14;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        o.connect(g); g.connect(actx.destination);
        o.start(t); o.stop(t + 0.14);
      });
    } catch (e) {}
  }
  function notify(title, body) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: body });
      }
    } catch (e) {}
  }

  // ---------- Data engine ----------
  function setMode(m) {
    mode = m;
    connPill.classList.remove('live', 'simulated', 'connecting');
    connPill.classList.add(m === 'live' ? 'live' : m === 'simulated' ? 'simulated' : 'connecting');
    connText.textContent = m === 'live' ? '● Live stream' : m === 'simulated' ? '◆ Simulated feed' : 'Connecting…';
  }

  function pushTick(sym, price, volume) {
    var m = market[sym];
    if (!m || !(price > 0)) return;
    m.prev = m.price;
    m.price = price;
    if (volume) m.volume = volume;
    m.high = Math.max(m.high, price);
    m.low = Math.min(m.low, price);
    m.history.push(price);
    if (m.history.length > HIST_LEN) m.history.shift();
    checkAlerts(sym, price);
  }

  function fetchWithTimeout(url, ms) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error('timeout')); }, ms);
      fetch(url).then(function (r) {
        clearTimeout(timer);
        if (!r.ok) reject(new Error('HTTP ' + r.status));
        else resolve(r.json());
      }, function (err) { clearTimeout(timer); reject(err); });
    });
  }

  function bootLive() {
    var symbols = JSON.stringify(COINS.map(function (c) { return c.pair; }));
    var url = 'https://api.binance.com/api/v3/ticker/24hr?symbols=' + encodeURIComponent(symbols);
    fetchWithTimeout(url, 7000).then(function (data) {
      if (!Array.isArray(data) || !data.length) throw new Error('empty');
      data.forEach(function (t) {
        var coin = null;
        for (var i = 0; i < COINS.length; i++) if (COINS[i].pair === t.symbol) coin = COINS[i];
        if (!coin) return;
        var m = market[coin.sym];
        var last = parseFloat(t.lastPrice);
        if (!(last > 0)) return;
        m.price = last; m.prev = last;
        m.open = parseFloat(t.openPrice) || last;
        m.high = parseFloat(t.highPrice) || last;
        m.low = parseFloat(t.lowPrice) || last;
        m.volume = parseFloat(t.quoteVolume) || m.volume;
        m.history[m.history.length - 1] = last;
      });
      setMode('live');
      renderAll();
      toast('Live market stream connected ✓', 'success');
      openSocket();
      setInterval(refreshRest, 20000);
    }, function () {
      enterSimulation('Live API unreachable — running offline simulation');
    });
  }

  function refreshRest() {
    if (document.hidden) return;
    var symbols = JSON.stringify(COINS.map(function (c) { return c.pair; }));
    fetchWithTimeout('https://api.binance.com/api/v3/ticker/24hr?symbols=' + encodeURIComponent(symbols), 8000)
      .then(function (data) {
        if (!Array.isArray(data)) return;
        data.forEach(function (t) {
          var coin = null;
          for (var i = 0; i < COINS.length; i++) if (COINS[i].pair === t.symbol) coin = COINS[i];
          if (!coin) return;
          pushTick(coin.sym, parseFloat(t.lastPrice), parseFloat(t.quoteVolume));
        });
        if (mode !== 'live') setMode('live');
        renderAll();
      }, function () { if (mode === 'live') setMode('simulated'); });
  }

  var ws = null;
  function openSocket() {
    try {
      var streams = COINS.map(function (c) { return c.pair.toLowerCase() + '@miniTicker'; }).join('/');
      ws = new WebSocket('wss://stream.binance.com:9443/stream?streams=' + streams);
      ws.onmessage = function (ev) {
        try {
          var msg = JSON.parse(ev.data);
          var d = msg.data;
          if (!d || !d.s || !d.c) return;
          var coin = null;
          for (var i = 0; i < COINS.length; i++) if (COINS[i].pair === d.s) coin = COINS[i];
          if (!coin) return;
          pushTick(coin.sym, parseFloat(d.c));
          if (mode !== 'live') setMode('live');
          renderPrices();
        } catch (e) {}
      };
      ws.onerror = function () { try { ws.close(); } catch (e) {} };
      ws.onclose = function () {
        if (mode === 'live') { setMode('simulated'); startSimulation(); }
      };
    } catch (e) { /* REST polling continues */ }
  }

  var simTimer = null;
  function enterSimulation(msg) {
    setMode('simulated');
    toast(msg || 'Simulated feed active ◆', 'warn');
    startSimulation();
    renderAll();
  }
  function startSimulation() {
    if (simTimer) return;
    simTimer = setInterval(function () {
      if (document.hidden || mode === 'live') return;
      COINS.forEach(function (c) {
        var m = market[c.sym];
        var vol = 0.0035;
        var shock = (Math.random() - 0.5) * 2 * vol;
        var revert = (c.base - m.price) / c.base * 0.02; // mean reversion
        var next = m.price * (1 + shock + revert);
        m.volume *= 1 + Math.random() * 0.0008;
        pushTick(c.sym, next);
      });
      renderAll();
    }, 2000);
  }

  // ---------- Alerts ----------
  function checkAlerts(sym, price) {
    var fired = false;
    alerts.forEach(function (a) {
      if (a.sym !== sym || a.triggered) return;
      if ((a.cond === 'above' && price >= a.target) || (a.cond === 'below' && price <= a.target)) {
        a.triggered = true;
        fired = true;
        toast('🔔 ' + sym + ' is ' + a.cond + ' $' + Number(a.target).toLocaleString() + ' → now ' + fmtPrice(coinBySym(sym), price), 'success');
        notify('CryptoPulse alert: ' + sym, 'Target ' + a.cond + ' $' + a.target + ' reached at ' + fmtPrice(coinBySym(sym), price));
      }
    });
    if (fired) { beep(); persist(); renderAlertBadge(); if (!alertsModal.classList.contains('hidden')) renderAlertsList(); }
  }
  function coinBySym(sym) {
    for (var i = 0; i < COINS.length; i++) if (COINS[i].sym === sym) return COINS[i];
    return COINS[0];
  }

  // ---------- Rendering ----------
  function visibleCoins() {
    var q = query.trim().toLowerCase();
    var list = COINS.filter(function (c) {
      if (watchOnly && watchlist.indexOf(c.sym) === -1) return false;
      if (q && (c.sym.toLowerCase().indexOf(q) === -1 && c.name.toLowerCase().indexOf(q) === -1)) return false;
      return true;
    });
    list.sort(function (a, b) {
      var ma = market[a.sym], mb = market[b.sym];
      switch (sortMode) {
        case 'price-desc': return mb.price - ma.price;
        case 'price-asc': return ma.price - mb.price;
        case 'change-desc': return changePct(b.sym) - changePct(a.sym);
        case 'change-asc': return changePct(a.sym) - changePct(b.sym);
        case 'volume': return mb.volume - ma.volume;
        default: return 0;
      }
    });
    return list;
  }

  function buildGrid() {
    grid.innerHTML = '';
    sparkRefs = {};
    var list = visibleCoins();
    emptyState.classList.toggle('hidden', list.length > 0);
    list.forEach(function (c) {
      var card = document.createElement('article');
      card.className = 'coin-card';
      card.style.setProperty('--coin-color', c.color);
      card.dataset.sym = c.sym;
      card.innerHTML =
        '<div class="coin-top">' +
          '<div class="coin-icon">' + c.sym.slice(0, 1) + '</div>' +
          '<div class="coin-names"><strong>' + c.name + '</strong><span>' + c.sym + ' / USDT</span></div>' +
          '<button class="star-btn' + (watchlist.indexOf(c.sym) !== -1 ? ' watched' : '') + '" data-star="' + c.sym + '" title="Toggle watchlist">⭐</button>' +
        '</div>' +
        '<div class="coin-price" data-price>' + fmtPrice(c, market[c.sym].price) + '</div>' +
        '<div class="coin-sub"><span class="chg-badge" data-chg></span><span class="coin-vol" data-vol style="font-size:.72rem;color:var(--dim);font-family:var(--font-mono)"></span></div>' +
        '<canvas class="spark" data-spark></canvas>' +
        '<div class="coin-stats"><span>H <b data-high></b></span><span>L <b data-low></b></span></div>' +
        '<div class="coin-actions">' +
          '<button class="btn-ghost" data-alert="' + c.sym + '">🔔 Alert</button>' +
          '<button class="btn-ghost" data-detail="' + c.sym + '">📊 Details</button>' +
        '</div>';
      grid.appendChild(card);
      sparkRefs[c.sym] = card.querySelector('[data-spark]');
    });
    renderPrices();
  }

  function renderPrices() {
    var cards = grid.querySelectorAll('.coin-card');
    var gainers = 0, losers = 0, totalVol = 0;
    COINS.forEach(function (c) {
      var chg = changePct(c.sym);
      if (chg >= 0) gainers++; else losers++;
      totalVol += market[c.sym].volume;
    });
    ovGainers.textContent = gainers;
    ovLosers.textContent = losers;
    ovVolume.textContent = fmtCompact(totalVol);
    ovUpdated.textContent = new Date().toLocaleTimeString();

    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        var sym = card.dataset.sym;
        var c = coinBySym(sym), m = market[sym];
        var priceEl = card.querySelector('[data-price]');
        priceEl.textContent = fmtPrice(c, m.price);
        priceEl.classList.remove('tick-up', 'tick-down');
        if (m.price > m.prev) priceEl.classList.add('tick-up');
        else if (m.price < m.prev) priceEl.classList.add('tick-down');
        var chg = changePct(sym);
        var badge = card.querySelector('[data-chg]');
        badge.textContent = (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%';
        badge.className = 'chg-badge ' + (chg >= 0 ? 'up' : 'down');
        card.querySelector('[data-vol]').textContent = 'Vol ' + fmtCompact(m.volume);
        card.querySelector('[data-high]').textContent = fmtPrice(c, m.high);
        card.querySelector('[data-low]').textContent = fmtPrice(c, m.low);
        drawSpark(sparkRefs[sym], m.history, chg >= 0);
      })(cards[i]);
    }
    if (detailSym && !detailModal.classList.contains('hidden')) renderDetailNumbers();
  }

  function renderAll() { buildGrid(); }

  function drawSpark(canvas, data, isUp) {
    if (!canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || 220, h = canvas.clientHeight || 56;
    if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!data.length) return;
    var min = Math.min.apply(null, data), max = Math.max.apply(null, data);
    if (max === min) { max = min * 1.001; }
    function x(i) { return (i / (data.length - 1)) * w; }
    function y(v) { return h - 5 - ((v - min) / (max - min)) * (h - 10); }
    var color = isUp ? '#10b981' : '#ef4444';
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, isUp ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (var i = 0; i < data.length; i++) ctx.lineTo(x(i), y(data[i]));
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    for (var j = 0; j < data.length; j++) { if (j === 0) ctx.moveTo(x(j), y(data[j])); else ctx.lineTo(x(j), y(data[j])); }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x(data.length - 1), y(data[data.length - 1]), 2.6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // ---------- Detail modal ----------
  function openDetail(sym) {
    detailSym = sym;
    detailModal.classList.remove('hidden');
    renderDetailNumbers();
    drawDetailChart();
    clearInterval(detailTimer);
    detailTimer = setInterval(function () {
      if (detailModal.classList.contains('hidden')) { clearInterval(detailTimer); return; }
      renderDetailNumbers();
      drawDetailChart();
    }, 2000);
    $('alertPrice').value = '';
  }
  function renderDetailNumbers() {
    var c = coinBySym(detailSym), m = market[detailSym];
    detailTitle.textContent = c.sym + ' / USDT — ' + c.name;
    detailPrice.textContent = fmtPrice(c, m.price);
    var chg = changePct(detailSym);
    detailChange.textContent = (chg >= 0 ? '+' : '') + chg.toFixed(2) + '% (24h)';
    detailChange.className = 'chg-badge ' + (chg >= 0 ? 'up' : 'down');
    detailStats.innerHTML =
      stat('24h High', fmtPrice(c, m.high)) + stat('24h Low', fmtPrice(c, m.low)) +
      stat('24h Open', fmtPrice(c, m.open)) + stat('Volume', fmtCompact(m.volume));
    function stat(l, v) { return '<div class="dstat"><span>' + l + '</span><strong>' + v + '</strong></div>'; }
  }
  function drawDetailChart() {
    var c = coinBySym(detailSym), m = market[detailSym];
    var canvas = detailChart;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || 540, h = canvas.clientHeight || 190;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var data = m.history;
    var min = Math.min.apply(null, data), max = Math.max.apply(null, data);
    var pad = (max - min) * 0.12 || max * 0.002;
    min -= pad; max += pad;
    function x(i) { return 8 + (i / (data.length - 1)) * (w - 80); }
    function y(v) { return (h - 14) - ((v - min) / (max - min)) * (h - 28); }
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.fillStyle = 'rgba(148,163,184,0.9)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var v = min + ((max - min) / 4) * g;
      var yy = y(v);
      ctx.beginPath(); ctx.moveTo(8, yy); ctx.lineTo(w - 72, yy); ctx.stroke();
      ctx.fillText(fmtPrice(c, v), w - 66, yy + 3);
    }
    var up = data[data.length - 1] >= data[0];
    var color = up ? '#10b981' : '#ef4444';
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, up ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.moveTo(x(0), h - 6);
    for (var i = 0; i < data.length; i++) ctx.lineTo(x(i), y(data[i]));
    ctx.lineTo(x(data.length - 1), h - 6);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    for (var j = 0; j < data.length; j++) { if (j === 0) ctx.moveTo(x(j), y(data[j])); else ctx.lineTo(x(j), y(data[j])); }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    // Last price line
    var ly = y(data[data.length - 1]);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.moveTo(8, ly); ctx.lineTo(w - 8, ly); ctx.stroke();
    ctx.setLineDash([]);
  }

  // ---------- Alerts UI ----------
  function renderAlertBadge() {
    var active = alerts.filter(function (a) { return !a.triggered; }).length;
    alertCount.textContent = alerts.length;
    alertCount.classList.toggle('hidden', alerts.length === 0);
    void active;
  }
  function renderAlertsList() {
    alertsList.innerHTML = '';
    if (!alerts.length) {
      alertsList.innerHTML = '<p style="color:var(--dim);text-align:center;padding:1.5rem 0">No alerts yet. Open a coin → Alert to create one.</p>';
      return;
    }
    alerts.forEach(function (a) {
      var c = coinBySym(a.sym);
      var row = document.createElement('div');
      row.className = 'alert-row' + (a.triggered ? ' triggered' : '');
      row.innerHTML =
        '<span class="mono">' + a.sym + '</span>' +
        '<span class="grow">price <b>' + a.cond + '</b> <span class="mono">' + fmtPrice(c, a.target) + '</span></span>' +
        '<span class="alert-badge">' + (a.triggered ? 'fired' : 'active') + '</span>' +
        '<button class="alert-del" data-del="' + a.id + '" title="Delete alert">✕</button>';
      alertsList.appendChild(row);
    });
  }
  function createAlert() {
    var target = parseFloat($('alertPrice').value);
    if (!(target > 0)) { toast('Enter a valid target price', 'warn'); return; }
    alerts.unshift({ id: 'a' + Date.now().toString(36) + Math.floor(Math.random() * 1e4), sym: detailSym, cond: $('alertCond').value, target: target, triggered: false, createdAt: Date.now() });
    persist(); renderAlertBadge();
    toast('Alert created for ' + detailSym + ' ✓', 'success');
    try {
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    } catch (e) {}
    $('alertPrice').value = '';
  }

  // ---------- Events ----------
  grid.addEventListener('click', function (e) {
    var star = e.target.closest('[data-star]');
    var al = e.target.closest('[data-alert]');
    var det = e.target.closest('[data-detail]');
    if (star) {
      var sym = star.dataset.star;
      var idx = watchlist.indexOf(sym);
      if (idx === -1) { watchlist.push(sym); toast(sym + ' added to watchlist ⭐'); }
      else { watchlist.splice(idx, 1); toast(sym + ' removed from watchlist'); }
      star.classList.toggle('watched', idx === -1);
      persist();
      if (watchOnly) buildGrid();
      return;
    }
    if (al) { openDetail(al.dataset.alert); return; }
    if (det) { openDetail(det.dataset.detail); return; }
  });

  searchInput.addEventListener('input', function () { query = searchInput.value; buildGrid(); });
  sortSelect.addEventListener('change', function () { sortMode = sortSelect.value; buildGrid(); });
  watchToggle.addEventListener('click', function () {
    watchOnly = !watchOnly;
    watchToggle.classList.toggle('on', watchOnly);
    buildGrid();
  });

  $('btnCloseDetail').addEventListener('click', function () { detailModal.classList.add('hidden'); clearInterval(detailTimer); detailSym = null; });
  detailModal.addEventListener('click', function (e) { if (e.target === detailModal) { detailModal.classList.add('hidden'); clearInterval(detailTimer); detailSym = null; } });
  $('btnCreateAlert').addEventListener('click', createAlert);

  $('btnAlerts').addEventListener('click', function () { renderAlertsList(); alertsModal.classList.remove('hidden'); });
  $('btnCloseAlerts').addEventListener('click', function () { alertsModal.classList.add('hidden'); });
  $('btnDoneAlerts').addEventListener('click', function () { alertsModal.classList.add('hidden'); });
  alertsModal.addEventListener('click', function (e) { if (e.target === alertsModal) alertsModal.classList.add('hidden'); });
  alertsList.addEventListener('click', function (e) {
    var del = e.target.closest('[data-del]');
    if (!del) return;
    alerts = alerts.filter(function (a) { return a.id !== del.dataset.del; });
    persist(); renderAlertsList(); renderAlertBadge();
  });
  $('btnClearAlerts').addEventListener('click', function () {
    alerts = []; persist(); renderAlertsList(); renderAlertBadge(); toast('All alerts cleared');
  });

  $('btnRefresh').addEventListener('click', function () {
    if (mode === 'live') { refreshRest(); toast('Refreshing live prices…'); }
    else {
      COINS.forEach(function (c) {
        var m = market[c.sym];
        pushTick(c.sym, m.price * (1 + (Math.random() - 0.5) * 0.004));
      });
      renderAll();
      bootLive();
    }
  });
  $('btnSound').addEventListener('click', function () {
    soundOn = !soundOn; persist();
    $('soundOn').classList.toggle('hidden', !soundOn);
    $('soundOff').classList.toggle('hidden', soundOn);
    toast(soundOn ? 'Alert sound on 🔊' : 'Alert sound muted 🔇');
  });

  window.addEventListener('keydown', function (e) {
    var typing = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) !== -1;
    if (e.key === 'Escape') {
      detailModal.classList.add('hidden'); alertsModal.classList.add('hidden');
      clearInterval(detailTimer); detailSym = null;
    } else if (e.key === '/' && !typing) { e.preventDefault(); searchInput.focus(); }
    else if ((e.key.toLowerCase() === 'a') && !typing) { renderAlertsList(); alertsModal.classList.remove('hidden'); }
    else if ((e.key.toLowerCase() === 'r') && !typing) { $('btnRefresh').click(); }
  });
  window.addEventListener('resize', function () { if (detailSym) drawDetailChart(); });

  // ---------- Init ----------
  $('soundOn').classList.toggle('hidden', !soundOn);
  $('soundOff').classList.toggle('hidden', soundOn);
  $('ovAssets').textContent = COINS.length;
  renderAlertBadge();
  renderAll();
  bootLive();
})();
