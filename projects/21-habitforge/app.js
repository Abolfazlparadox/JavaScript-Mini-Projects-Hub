/**
 * HabitForge (#21) | Streaks & Habit Tracker Engine
 * Weekly check-ins, streak math, GitHub-style heatmap, XP levels.
 */
(function () {
  'use strict';

  var LS_KEY = 'habitforge_data_v1';
  var ICONS = ['📚', '💪', '🧘', '🚶', '💧', '🥗', '💻', '🎨', '🎸', '😴', '📝', '🌱'];
  var COLORS = ['#f59e0b', '#ef4444', '#ec4899', '#a78bfa', '#6366f1', '#38bdf8', '#10b981', '#facc15'];

  function $(id) { return document.getElementById(id); }
  var habitList = $('habitList'), emptyState = $('emptyState'), heatmap = $('heatmap');
  var toasts = $('toastContainer');

  var habits = load() || seed();
  var editingId = null, pickedIcon = ICONS[0], pickedColor = COLORS[0];

  function load() { try { var r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(habits)); } catch (e) {} }
  function uid() { return 'h' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
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
  function dayKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function seed() {
    var h1 = { id: uid(), name: 'Read 20 pages', icon: '📚', color: '#a78bfa', target: 7, log: {} };
    var h2 = { id: uid(), name: 'Workout', icon: '💪', color: '#ef4444', target: 5, log: {} };
    var today = new Date();
    for (var i = 0; i < 60; i++) {
      var d = new Date(today.getTime() - i * 86400000);
      if (Math.random() < 0.75) h1.log[dayKey(d)] = 1;
      if (Math.random() < 0.5) h2.log[dayKey(d)] = 1;
    }
    return [h1, h2];
  }

  // Streak: consecutive days ending today (or yesterday if today pending)
  function streakOf(h) {
    var s = 0, d = new Date();
    if (!h.log[dayKey(d)]) d = new Date(d.getTime() - 86400000);
    while (h.log[dayKey(d)]) { s++; d = new Date(d.getTime() - 86400000); }
    return s;
  }
  function totalOf(h) { return Object.keys(h.log).length; }

  function render() {
    habitList.innerHTML = '';
    emptyState.classList.toggle('hidden', habits.length > 0);
    var today = new Date(), todayKey = dayKey(today);
    var totalCheckins = 0, bestStreak = 0, doneToday = 0;

    habits.forEach(function (h) {
      totalCheckins += totalOf(h);
      var st = streakOf(h);
      if (st > bestStreak) bestStreak = st;
      if (h.log[todayKey]) doneToday++;

      var card = document.createElement('article');
      card.className = 'habit-card';
      card.style.setProperty('--habit-color', h.color);
      card.dataset.id = h.id;

      // Last 7 days (Mon..Sun of current week? use trailing 7 incl today)
      var cells = '';
      var weekDone = 0;
      for (var i = 6; i >= 0; i--) {
        var d = new Date(today.getTime() - i * 86400000);
        var key = dayKey(d);
        var done = !!h.log[key];
        if (done && i < 7) weekDone++;
        var isToday = i === 0;
        cells += '<div class="day-cell' + (done ? ' done' : '') + (isToday ? ' today' : '') + '" data-day="' + key + '" title="' + key + '">' +
          '<small>' + d.toLocaleDateString('en-US', { weekday: 'narrow' }) + '</small><b>' + d.getDate() + '</b><span class="dot"></span></div>';
      }
      var weekPct = Math.min(Math.round((weekDone / h.target) * 100), 100);
      card.innerHTML =
        '<div class="habit-top"><div class="habit-ico">' + h.icon + '</div>' +
        '<div class="habit-name">' + esc(h.name) + '</div>' +
        '<span class="streak-badge">🔥 ' + st + ' day' + (st === 1 ? '' : 's') + '</span>' +
        '<button class="habit-edit" data-edit title="Edit habit">✏️</button></div>' +
        '<div class="week-row">' + cells + '</div>' +
        '<div class="habit-foot"><span>' + weekDone + '/' + h.target + ' this week</span><span>' + totalOf(h) + ' total</span></div>' +
        '<div class="target-bar"><div class="target-fill" style="width:' + weekPct + '%"></div></div>';
      habitList.appendChild(card);
    });

    $('statHabits').textContent = habits.length;
    $('statCheckins').textContent = totalCheckins;
    $('statStreak').textContent = bestStreak + '🔥';
    $('statToday').textContent = habits.length ? Math.round((doneToday / habits.length) * 100) + '%' : '0%';
    var xp = totalCheckins * 10;
    $('xpPoints').textContent = xp + ' XP';
    $('xpLevel').textContent = 'Lv ' + (1 + Math.floor(Math.sqrt(xp / 100)));
    renderHeatmap();
  }

  function renderHeatmap() {
    heatmap.innerHTML = '';
    var today = new Date();
    var days = 18 * 7;
    var counts = {};
    habits.forEach(function (h) {
      Object.keys(h.log).forEach(function (k) { counts[k] = (counts[k] || 0) + 1; });
    });
    var max = 1;
    Object.keys(counts).forEach(function (k) { if (counts[k] > max) max = counts[k]; });
    // Align to weeks: start on Monday-ish (just trailing days)
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(today.getTime() - i * 86400000);
      var c = counts[dayKey(d)] || 0;
      var cell = document.createElement('i');
      if (c > 0) {
        var lvl = Math.max(1, Math.ceil((c / Math.max(max, habits.length)) * 4));
        cell.className = 'lv' + lvl;
      }
      cell.title = dayKey(d) + ': ' + c + ' check-in' + (c === 1 ? '' : 's');
      heatmap.appendChild(cell);
    }
  }

  // ---------- Modal ----------
  function buildPicks() {
    var ip = $('iconPick'); ip.innerHTML = '';
    ICONS.forEach(function (ic) {
      var b = document.createElement('button');
      b.textContent = ic;
      b.className = ic === pickedIcon ? 'sel' : '';
      b.addEventListener('click', function () { pickedIcon = ic; buildPicks(); });
      ip.appendChild(b);
    });
    var cp = $('colorPick'); cp.innerHTML = '';
    COLORS.forEach(function (c) {
      var b = document.createElement('button');
      b.style.background = c;
      b.className = c === pickedColor ? 'sel' : '';
      b.addEventListener('click', function () { pickedColor = c; buildPicks(); });
      cp.appendChild(b);
    });
  }
  function openNew() {
    editingId = null;
    $('modalTitle').textContent = '＋ New Habit';
    $('hName').value = ''; $('hTarget').value = '7';
    pickedIcon = ICONS[0]; pickedColor = COLORS[habits.length % COLORS.length];
    buildPicks();
    $('btnDelete').classList.add('hidden');
    $('habitModal').classList.remove('hidden');
    setTimeout(function () { $('hName').focus(); }, 50);
  }
  function openEdit(id) {
    var h = null;
    habits.forEach(function (x) { if (x.id === id) h = x; });
    if (!h) return;
    editingId = id;
    $('modalTitle').textContent = '✏️ Edit Habit';
    $('hName').value = h.name; $('hTarget').value = String(h.target);
    pickedIcon = h.icon; pickedColor = h.color;
    buildPicks();
    $('btnDelete').classList.remove('hidden');
    $('habitModal').classList.remove('hidden');
  }
  function closeModal() { $('habitModal').classList.add('hidden'); editingId = null; }
  function saveModal() {
    var name = $('hName').value.trim();
    if (!name) { toast('Enter a habit name', ''); return; }
    if (editingId) {
      habits.forEach(function (h) {
        if (h.id === editingId) { h.name = name; h.icon = pickedIcon; h.color = pickedColor; h.target = +$('hTarget').value; }
      });
      toast('Habit updated ✓', 'success');
    } else {
      habits.push({ id: uid(), name: name, icon: pickedIcon, color: pickedColor, target: +$('hTarget').value, log: {} });
      toast('Habit created — forge that streak! 🔥', 'success');
    }
    save(); render(); closeModal();
  }

  // ---------- Events ----------
  habitList.addEventListener('click', function (e) {
    var editBtn = e.target.closest('[data-edit]');
    if (editBtn) {
      var card = e.target.closest('.habit-card');
      if (card) openEdit(card.dataset.id);
      return;
    }
    var cell = e.target.closest('[data-day]');
    if (!cell) return;
    var cardEl = e.target.closest('.habit-card');
    var h = null;
    habits.forEach(function (x) { if (x.id === cardEl.dataset.id) h = x; });
    if (!h) return;
    var key = cell.dataset.day;
    if (h.log[key]) { delete h.log[key]; }
    else {
      h.log[key] = 1;
      if (key === dayKey(new Date())) toast(h.icon + ' Checked in! Streak: ' + streakOf(h) + '🔥', 'success');
    }
    save(); render();
  });

  $('btnAdd').addEventListener('click', openNew);
  $('btnAddEmpty').addEventListener('click', openNew);
  $('btnSave').addEventListener('click', saveModal);
  $('btnCancel').addEventListener('click', closeModal);
  $('btnClose').addEventListener('click', closeModal);
  $('habitModal').addEventListener('click', function (e) { if (e.target === $('habitModal')) closeModal(); });
  $('btnDelete').addEventListener('click', function () {
    if (!editingId) return;
    if (!confirm('Delete this habit and its history?')) return;
    habits = habits.filter(function (h) { return h.id !== editingId; });
    save(); render(); closeModal();
    toast('Habit deleted');
  });

  window.addEventListener('keydown', function (e) {
    var typing = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) !== -1;
    if (e.key === 'Escape') { closeModal(); }
    else if (e.key.toLowerCase() === 'n' && !typing) { openNew(); }
    else if (e.key === 'Enter' && e.target === $('hName')) { saveModal(); }
  });

  render();
})();
