/**
 * SpendWise (#20) | Smart Expense Tracker Engine
 * Monthly budgets, category donut + 6-month bars on canvas,
 * filters, month navigation, CSV export, LocalStorage.
 */
(function () {
  'use strict';

  var LS_TX = 'spendwise_tx_v1';
  var LS_BUDGET = 'spendwise_budget_v1';
  var CATS = {
    food: { label: '🍔 Food', color: '#f59e0b' },
    transport: { label: '🚕 Transport', color: '#38bdf8' },
    housing: { label: '🏠 Housing', color: '#a78bfa' },
    shopping: { label: '🛍️ Shopping', color: '#ec4899' },
    health: { label: '💊 Health', color: '#10b981' },
    fun: { label: '🎮 Fun', color: '#facc15' },
    bills: { label: '💡 Bills', color: '#f87171' },
    other: { label: '📦 Other', color: '#94a3b8' },
  };

  function $(id) { return document.getElementById(id); }
  var txList = $('txList'), emptyState = $('emptyState'), legend = $('legend');
  var monthLabel = $('monthLabel'), statSpent = $('statSpent'), statBudget = $('statBudget');
  var statLeft = $('statLeft'), statCount = $('statCount');
  var budgetRing = $('budgetRing'), budgetPct = $('budgetPct');
  var toasts = $('toastContainer');

  var txs = loadJSON(LS_TX, null) || seed();
  var budget = loadJSON(LS_BUDGET, 1500);
  var viewYear, viewMonth, query = '', filterCat = 'all';
  (function () { var n = new Date(); viewYear = n.getFullYear(); viewMonth = n.getMonth(); })();

  function loadJSON(k, fb) { try { var r = localStorage.getItem(k); return r === null ? fb : JSON.parse(r); } catch (e) { return fb; } }
  function persist() { try { localStorage.setItem(LS_TX, JSON.stringify(txs)); localStorage.setItem(LS_BUDGET, JSON.stringify(budget)); } catch (e) {} }
  function uid() { return 't' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    toasts.appendChild(el);
    setTimeout(function () { el.remove(); }, 2000);
  }
  function seed() {
    var out = [], cats = Object.keys(CATS), now = new Date();
    var samples = [['Groceries', 'food', 84.2], ['Uber ride', 'transport', 18.5], ['Netflix', 'fun', 15.99],
      ['Electricity bill', 'bills', 62.4], ['New sneakers', 'shopping', 129.0], ['Pharmacy', 'health', 24.75],
      ['Rent share', 'housing', 650], ['Coffee', 'food', 4.5], ['Gym', 'health', 35], ['Steam game', 'fun', 29.99]];
    for (var m = 0; m < 6; m++) {
      var d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      var n = 4 + Math.floor(Math.random() * 4);
      for (var i = 0; i < n; i++) {
        var s = samples[Math.floor(Math.random() * samples.length)];
        var day = 1 + Math.floor(Math.random() * 27);
        out.push({ id: uid() + m + i, title: s[0], amount: +(s[2] * (0.7 + Math.random() * 0.6)).toFixed(2), category: s[1],
          date: new Date(d.getFullYear(), d.getMonth(), day).toISOString().slice(0, 10) });
      }
    }
    return out;
  }

  function monthKey(y, m) { return y + '-' + String(m + 1).padStart(2, '0'); }
  function monthTxs() {
    var key = monthKey(viewYear, viewMonth);
    return txs.filter(function (t) { return (t.date || '').slice(0, 7) === key; })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  }

  function render() {
    var list = monthTxs();
    var d = new Date(viewYear, viewMonth, 1);
    monthLabel.textContent = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    var spent = list.reduce(function (a, t) { return a + (+t.amount || 0); }, 0);
    statSpent.textContent = money(spent);
    statBudget.textContent = money(budget);
    var left = budget - spent;
    statLeft.textContent = money(left);
    statLeft.className = left < 0 ? 'neg' : 'pos';
    statCount.textContent = list.length;
    var pct = budget > 0 ? Math.min(spent / budget, 1) : 0;
    budgetRing.style.strokeDashoffset = String(289 - 289 * pct);
    budgetRing.style.stroke = pct >= 1 ? '#ef4444' : pct >= 0.8 ? '#f59e0b' : '#10b981';
    budgetPct.textContent = (budget > 0 ? Math.round((spent / budget) * 100) : 0) + '%';

    // Filtered list
    var q = query.trim().toLowerCase();
    var shown = list.filter(function (t) {
      if (filterCat !== 'all' && t.category !== filterCat) return false;
      if (q && t.title.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    txList.innerHTML = '';
    emptyState.classList.toggle('hidden', shown.length > 0);
    shown.forEach(function (t) {
      var c = CATS[t.category] || CATS.other;
      var li = document.createElement('li');
      li.className = 'tx-item';
      var date = new Date(t.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      li.innerHTML = '<div class="tx-ico" style="--cat-bg:' + c.color + '26">' + c.label.split(' ')[0] + '</div>' +
        '<div class="tx-body"><div class="tx-title">' + esc(t.title) + '</div>' +
        '<div class="tx-meta">' + esc(c.label) + ' • ' + esc(date) + '</div></div>' +
        '<span class="tx-amt">-' + money(t.amount) + '</span>' +
        '<button class="tx-del" data-del="' + t.id + '" title="Delete">✕</button>';
      txList.appendChild(li);
    });
    renderDonut(list);
    renderBars();
  }

  function renderDonut(list) {
    var canvas = $('donutCanvas');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var size = 190;
    canvas.width = size * dpr; canvas.height = size * dpr;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    var byCat = {};
    list.forEach(function (t) { byCat[t.category] = (byCat[t.category] || 0) + (+t.amount || 0); });
    var total = Object.keys(byCat).reduce(function (a, k) { return a + byCat[k]; }, 0);
    legend.innerHTML = '';
    if (!total) {
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 26;
      ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - 20, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#64748b'; ctx.font = '12px Outfit, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('No data', size / 2, size / 2 + 4);
      return;
    }
    var ang = -Math.PI / 2;
    Object.keys(byCat).forEach(function (k) {
      var frac = byCat[k] / total;
      var c = CATS[k] || CATS.other;
      ctx.strokeStyle = c.color; ctx.lineWidth = 26; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - 20, ang + 0.02, ang + frac * Math.PI * 2 - 0.02); ctx.stroke();
      ang += frac * Math.PI * 2;
      var chip = document.createElement('span');
      chip.innerHTML = '<i style="background:' + c.color + '"></i>' + esc(c.label) + ' ' + Math.round(frac * 100) + '%';
      legend.appendChild(chip);
    });
    ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 20px JetBrains Mono, monospace'; ctx.textAlign = 'center';
    ctx.fillText(money(total).replace('.00', ''), size / 2, size / 2 + 7);
  }

  function renderBars() {
    var canvas = $('barsCanvas');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || 600, h = 170;
    canvas.width = w * dpr; canvas.height = h * dpr;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var now = new Date(), months = [];
    for (var i = 5; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var key = monthKey(d.getFullYear(), d.getMonth());
      var sum = txs.filter(function (t) { return (t.date || '').slice(0, 7) === key; })
        .reduce(function (a, t) { return a + (+t.amount || 0); }, 0);
      months.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), sum: sum, cur: i === 0 });
    }
    var max = Math.max.apply(null, months.map(function (m) { return m.sum; }).concat([1]));
    var bw = (w - 20) / months.length;
    months.forEach(function (m, idx) {
      var bh = Math.max(4, (m.sum / max) * (h - 52));
      var x = 10 + idx * bw + bw * 0.2, y = h - 30 - bh;
      var g = ctx.createLinearGradient(0, y, 0, h - 30);
      if (m.cur) { g.addColorStop(0, '#6366f1'); g.addColorStop(1, '#4f46e5'); }
      else { g.addColorStop(0, 'rgba(148,163,184,0.7)'); g.addColorStop(1, 'rgba(148,163,184,0.3)'); }
      ctx.fillStyle = g;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, bw * 0.6, bh, 6); else ctx.rect(x, y, bw * 0.6, bh);
      ctx.fill();
      ctx.fillStyle = '#94a3b8'; ctx.font = '11px JetBrains Mono, monospace'; ctx.textAlign = 'center';
      ctx.fillText(m.label, x + bw * 0.3, h - 14);
      if (m.sum > 0) { ctx.fillStyle = '#e2e8f0'; ctx.fillText('$' + Math.round(m.sum), x + bw * 0.3, y - 6); }
    });
  }

  function addTx() {
    var title = $('fTitle').value.trim();
    var amount = parseFloat($('fAmount').value);
    if (!title) { toast('Enter a title', ''); $('fTitle').focus(); return; }
    if (!(amount > 0)) { toast('Enter a valid amount', ''); $('fAmount').focus(); return; }
    var date = $('fDate').value || new Date().toISOString().slice(0, 10);
    txs.unshift({ id: uid(), title: title, amount: Math.round(amount * 100) / 100, category: $('fCategory').value, date: date });
    var dd = new Date(date + 'T00:00:00');
    viewYear = dd.getFullYear(); viewMonth = dd.getMonth();
    $('fTitle').value = ''; $('fAmount').value = '';
    persist(); render();
    toast('Expense added ✓', 'success');
  }

  function exportCSV() {
    if (!txs.length) { toast('Nothing to export', ''); return; }
    var rows = ['Title,Amount,Category,Date'];
    txs.forEach(function (t) {
      rows.push('"' + String(t.title).replace(/"/g, '""') + '",' + t.amount + ',' + t.category + ',' + t.date);
    });
    var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'spendwise-' + monthKey(viewYear, viewMonth) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('CSV exported ✓', 'success');
  }

  // ---------- Events ----------
  $('btnAdd').addEventListener('click', addTx);
  $('fAmount').addEventListener('keydown', function (e) { if (e.key === 'Enter') addTx(); });
  $('fTitle').addEventListener('keydown', function (e) { if (e.key === 'Enter') addTx(); });
  $('btnPrevMonth').addEventListener('click', function () {
    viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } render();
  });
  $('btnNextMonth').addEventListener('click', function () {
    viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } render();
  });
  $('searchInput').addEventListener('input', function () { query = $('searchInput').value; render(); });
  $('filterCat').addEventListener('change', function () { filterCat = $('filterCat').value; render(); });
  txList.addEventListener('click', function (e) {
    var del = e.target.closest('[data-del]');
    if (!del) return;
    txs = txs.filter(function (t) { return t.id !== del.dataset.del; });
    persist(); render();
    toast('Transaction deleted');
  });
  $('btnExport').addEventListener('click', exportCSV);
  $('btnBudget').addEventListener('click', function () {
    $('budgetInput').value = budget;
    $('budgetModal').classList.remove('hidden');
    setTimeout(function () { $('budgetInput').focus(); $('budgetInput').select(); }, 50);
  });
  $('btnCloseBudget').addEventListener('click', function () { $('budgetModal').classList.add('hidden'); });
  $('budgetModal').addEventListener('click', function (e) { if (e.target === $('budgetModal')) $('budgetModal').classList.add('hidden'); });
  $('btnSaveBudget').addEventListener('click', function () {
    var v = parseFloat($('budgetInput').value);
    if (!(v >= 0)) { toast('Enter a valid budget', ''); return; }
    budget = v; persist(); render();
    $('budgetModal').classList.add('hidden');
    toast('Budget updated ✓', 'success');
  });
  window.addEventListener('keydown', function (e) {
    var typing = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) !== -1;
    if (e.key === 'Escape') { $('budgetModal').classList.add('hidden'); }
    else if (e.key === '/' && !typing) { e.preventDefault(); $('searchInput').focus(); }
    else if (e.key.toLowerCase() === 'n' && !typing) { e.preventDefault(); $('fTitle').focus(); }
    else if (e.key.toLowerCase() === 'b' && !typing) { $('btnBudget').click(); }
  });
  window.addEventListener('resize', function () { renderBars(); });

  // ---------- Init ----------
  try { $('fDate').value = new Date().toISOString().slice(0, 10); } catch (e) {}
  render();
})();
