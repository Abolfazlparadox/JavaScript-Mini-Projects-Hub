/**
 * InvoiceForge (#28) | Professional Invoice Generator Engine
 * Live invoice preview, line items, tax/discount/shipping math,
 * status stamps, JSON backup and print-to-PDF.
 */
(function () {
  'use strict';

  var LS_KEY = 'invoiceforge_data_v1';

  function $(id) { return document.getElementById(id); }
  var itemsList = $('itemsList'), toasts = $('toastContainer');

  var inv = load() || seed();
  var saveTimer = null;

  function load() { try { var r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function uid() { return 'i' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
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
    var today = new Date().toISOString().slice(0, 10);
    var due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    return {
      biz: { name: 'Paradox Studio', email: 'hello@paradox.dev', addr: 'Tehran, Iran' },
      client: { name: 'Acme Corp', email: 'billing@acme.co' },
      no: 'INV-2026-001', issue: today, due: due, cur: '$', status: 'unpaid',
      items: [
        { id: uid(), desc: 'Landing page design', qty: 1, rate: 850 },
        { id: uid(), desc: 'Frontend development (hours)', qty: 24, rate: 45 },
        { id: uid(), desc: 'SEO optimization', qty: 1, rate: 220 },
      ],
      tax: 9, disc: 5, ship: 0,
      notes: 'Payment due within 14 days. Bank transfer preferred.\nThank you for your business!',
    };
  }
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(LS_KEY, JSON.stringify(inv)); } catch (e) {}
    }, 400);
  }
  function money(n) { return inv.cur + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function totals() {
    var sub = inv.items.reduce(function (a, it) { return a + (it.qty * it.rate); }, 0);
    var disc = sub * ((+inv.disc || 0) / 100);
    var taxed = (sub - disc) * ((+inv.tax || 0) / 100);
    var total = sub - disc + taxed + (+inv.ship || 0);
    return { sub: sub, disc: disc, tax: taxed, total: total };
  }

  function renderItems() {
    itemsList.innerHTML = '';
    inv.items.forEach(function (it) {
      var row = document.createElement('div');
      row.className = 'item-row';
      row.dataset.id = it.id;
      row.innerHTML =
        '<input type="text" class="field" data-f="desc" value="' + esc(it.desc) + '" placeholder="Description" maxlength="80" />' +
        '<input type="number" class="field" data-f="qty" value="' + it.qty + '" min="0" step="1" title="Qty" />' +
        '<input type="number" class="field" data-f="rate" value="' + it.rate + '" min="0" step="0.01" title="Rate" />' +
        '<button class="item-del" data-del title="Remove">✕</button>';
      itemsList.appendChild(row);
    });
  }

  function render() {
    $('pBiz').textContent = inv.biz.name || 'Your Business';
    $('pBizMeta').textContent = [inv.biz.email, inv.biz.addr].filter(Boolean).join(' • ') || 'email • address';
    $('pNo').textContent = '#' + (inv.no || '0001');
    var st = $('pStatus');
    st.textContent = (inv.status || 'unpaid').toUpperCase();
    st.className = 'status-stamp ' + (inv.status || 'unpaid');
    $('pClient').textContent = inv.client.name || 'Client Name';
    $('pClientEmail').textContent = inv.client.email || 'client@email.com';
    $('pIssue').textContent = fmtDate(inv.issue);
    $('pDue').textContent = fmtDate(inv.due);
    var tb = $('pItems');
    tb.innerHTML = '';
    if (!inv.items.length) tb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8">No line items yet.</td></tr>';
    inv.items.forEach(function (it) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + esc(it.desc || '—') + '</td><td>' + it.qty + '</td><td>' + money(it.rate) + '</td><td>' + money(it.qty * it.rate) + '</td>';
      tb.appendChild(tr);
    });
    var t = totals();
    $('pSub').textContent = money(t.sub);
    $('pTax').textContent = money(t.tax);
    $('pTaxRow').querySelector('span').textContent = 'Tax (' + (+inv.tax || 0) + '%)';
    $('pDisc').textContent = '−' + money(t.disc);
    $('pDiscRow').querySelector('span').textContent = 'Discount (' + (+inv.disc || 0) + '%)';
    $('pShip').textContent = money(inv.ship);
    $('pTotal').textContent = money(t.total);
    $('pNotes').textContent = inv.notes || '';
    $('pNotes').style.display = inv.notes ? 'block' : 'none';
  }

  function syncInputs() {
    $('bName').value = inv.biz.name; $('bEmail').value = inv.biz.email; $('bAddr').value = inv.biz.addr;
    $('cName').value = inv.client.name; $('cEmail').value = inv.client.email;
    $('invNo').value = inv.no; $('invIssue').value = inv.issue; $('invDue').value = inv.due;
    $('invCur').value = inv.cur; $('invStatus').value = inv.status;
    $('taxPct').value = inv.tax; $('discPct').value = inv.disc; $('shipAmt').value = inv.ship;
    $('invNotes').value = inv.notes || '';
    renderItems();
  }

  // ---------- Events ----------
  function bind(id, fn) { $(id).addEventListener('input', function () { fn($(id).value); render(); persist(); }); }
  bind('bName', function (v) { inv.biz.name = v; });
  bind('bEmail', function (v) { inv.biz.email = v; });
  bind('bAddr', function (v) { inv.biz.addr = v; });
  bind('cName', function (v) { inv.client.name = v; });
  bind('cEmail', function (v) { inv.client.email = v; });
  bind('invNo', function (v) { inv.no = v; });
  bind('invIssue', function (v) { inv.issue = v; });
  bind('invDue', function (v) { inv.due = v; });
  bind('invCur', function (v) { inv.cur = v; });
  bind('invStatus', function (v) { inv.status = v; });
  bind('taxPct', function (v) { inv.tax = +v || 0; });
  bind('discPct', function (v) { inv.disc = +v || 0; });
  bind('shipAmt', function (v) { inv.ship = +v || 0; });
  bind('invNotes', function (v) { inv.notes = v; });

  itemsList.addEventListener('input', function (e) {
    var f = e.target.dataset.f;
    if (!f) return;
    var row = e.target.closest('.item-row');
    var it = null;
    inv.items.forEach(function (x) { if (x.id === row.dataset.id) it = x; });
    if (!it) return;
    if (f === 'desc') it.desc = e.target.value;
    else if (f === 'qty') it.qty = Math.max(0, +e.target.value || 0);
    else if (f === 'rate') it.rate = Math.max(0, +e.target.value || 0);
    render(); persist();
  });
  itemsList.addEventListener('click', function (e) {
    var del = e.target.closest('[data-del]');
    if (!del) return;
    var row = e.target.closest('.item-row');
    inv.items = inv.items.filter(function (x) { return x.id !== row.dataset.id; });
    renderItems(); render(); persist();
  });
  function addItem() {
    inv.items.push({ id: uid(), desc: '', qty: 1, rate: 0 });
    renderItems(); render(); persist();
    var rows = itemsList.querySelectorAll('.item-row');
    var last = rows[rows.length - 1];
    if (last) last.querySelector('[data-f="desc"]').focus();
  }
  $('btnAddItem').addEventListener('click', addItem);

  $('btnPrint').addEventListener('click', function () { window.print(); });
  $('btnNew').addEventListener('click', function () {
    if (!confirm('Start a new blank invoice? Current data will be replaced.')) return;
    inv = { biz: { name: '', email: '', addr: '' }, client: { name: '', email: '' },
      no: 'INV-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 900) + 100),
      issue: new Date().toISOString().slice(0, 10), due: '', cur: '$', status: 'unpaid',
      items: [], tax: 0, disc: 0, ship: 0, notes: '' };
    syncInputs(); render(); persist();
    toast('New invoice started 📄');
  });
  $('btnExport').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(inv, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (inv.no || 'invoice') + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('Invoice exported ✓', 'success');
  });
  $('btnImport').addEventListener('click', function () { $('importFile').click(); });
  $('importFile').addEventListener('change', function () {
    var f = $('importFile').files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var data = JSON.parse(r.result);
        if (!data || !Array.isArray(data.items)) throw new Error('bad');
        inv = {
          biz: data.biz || { name: '', email: '', addr: '' },
          client: data.client || { name: '', email: '' },
          no: data.no || 'INV-001', issue: data.issue || '', due: data.due || '',
          cur: data.cur || '$', status: data.status || 'unpaid',
          items: data.items.filter(function (x) { return x; }).map(function (x) {
            return { id: uid(), desc: String(x.desc || ''), qty: +x.qty || 0, rate: +x.rate || 0 };
          }),
          tax: +data.tax || 0, disc: +data.disc || 0, ship: +data.ship || 0, notes: data.notes || '',
        };
        syncInputs(); render(); persist();
        toast('Invoice imported ✓', 'success');
      } catch (e) { toast('Invalid invoice file', ''); }
      $('importFile').value = '';
    };
    r.readAsText(f);
  });
  window.addEventListener('keydown', function (e) {
    var typing = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) !== -1;
    if (typing) return;
    if (e.key.toLowerCase() === 'a') addItem();
    else if (e.key.toLowerCase() === 'p') window.print();
  });

  // ---------- Init ----------
  syncInputs();
  render();
})();
