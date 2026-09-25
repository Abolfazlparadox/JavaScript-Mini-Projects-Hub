/**
 * MemoDeck (#26) | Flashcard Study System Engine
 * Decks + cards CRUD, 3D flip study mode, SM-2-lite scheduling,
 * session stats and retention tracking.
 */
(function () {
  'use strict';

  var LS_KEY = 'memodeck_data_v1';
  var DAY = 86400000;

  function $(id) { return document.getElementById(id); }
  var deckGrid = $('deckGrid'), emptyState = $('emptyState');
  var libraryView = $('libraryView'), studyView = $('studyView');
  var flashInner = $('flashInner'), gradeBox = $('gradeBox'), flipHint = $('flipHint');
  var toasts = $('toastContainer');

  var store = load() || seed();
  var editingDeckId = null, editingCardId = null, detailDeckId = null;
  var session = null; // {queue:[{deckId,cardId}], idx, correct, total}

  function load() { try { var r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch (e) {} }
  function uid(p) { return (p || 'id') + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
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
  function newCard(front, back) {
    return { id: uid('c'), front: front, back: back, interval: 0, ease: 2.5, due: Date.now(), reviews: 0, lapses: 0 };
  }
  function seed() {
    var d1 = { id: uid('d'), name: 'JavaScript Basics', createdAt: Date.now(), cards: [
      newCard('What does `===` compare?', 'Value AND type, with no coercion.'),
      newCard('What is a closure?', 'A function + its lexical scope preserved after the outer function returns.'),
      newCard('`let` vs `var`?', '`let` is block-scoped & TDZ-guarded; `var` is function-scoped & hoisted.'),
      newCard('What does `Array.map` return?', 'A NEW array with the callback applied to each element.'),
      newCard('Purpose of `use strict`?', 'Stricter parsing: no implicit globals, no silent errors, safer `this`.'),
    ]};
    var d2 = { id: uid('d'), name: 'CSS & Layout', createdAt: Date.now(), cards: [
      newCard('Flexbox vs Grid?', 'Flexbox = 1D layout; Grid = 2D rows + columns.'),
      newCard('What does `box-sizing: border-box` do?', 'Padding + border are included inside the declared width/height.'),
    ]};
    return { decks: [d1, d2] };
  }
  function findDeck(id) {
    for (var i = 0; i < store.decks.length; i++) if (store.decks[i].id === id) return store.decks[i];
    return null;
  }
  function dueCards(deckId) {
    var now = Date.now(), out = [];
    store.decks.forEach(function (d) {
      if (deckId && d.id !== deckId) return;
      d.cards.forEach(function (c) { if (c.due <= now) out.push({ deckId: d.id, card: c }); });
    });
    return out;
  }

  // ---------- Library ----------
  function render() {
    deckGrid.innerHTML = '';
    var totalCards = 0, totalDue = 0, revSum = 0, revN = 0;
    store.decks.forEach(function (d) {
      totalCards += d.cards.length;
      var due = d.cards.filter(function (c) { return c.due <= Date.now(); }).length;
      totalDue += due;
      d.cards.forEach(function (c) {
        if (c.reviews > 0) { revSum += Math.max(0, 1 - c.lapses / c.reviews); revN++; }
      });
      var card = document.createElement('article');
      card.className = 'deck-card';
      card.innerHTML = '<button class="deck-edit" data-deck-edit="' + d.id + '" title="Rename / delete">✏️</button>' +
        '<h3>' + esc(d.name) + '</h3>' +
        '<div class="deck-meta"><span>' + d.cards.length + ' cards</span><span class="due">' + due + ' due</span></div>' +
        '<div class="deck-actions"><button data-study="' + d.id + '">🎓 Study</button><button data-view="' + d.id + '">👁 Cards</button></div>';
      deckGrid.appendChild(card);
    });
    emptyState.classList.toggle('hidden', store.decks.length > 0);
    $('statDecks').textContent = store.decks.length;
    $('statCards').textContent = totalCards;
    $('statDue').textContent = totalDue;
    $('statRetention').textContent = revN ? Math.round((revSum / revN) * 100) + '%' : '—';
  }

  // ---------- Study session ----------
  function startStudy(deckId) {
    var queue = dueCards(deckId);
    if (!queue.length) { toast('Nothing due — all caught up! 🎉', 'success'); return; }
    // Shuffle
    for (var i = queue.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = queue[i]; queue[i] = queue[j]; queue[j] = tmp;
    }
    session = { queue: queue, idx: 0, correct: 0, total: queue.length };
    libraryView.classList.add('hidden');
    studyView.classList.remove('hidden');
    showCard(false);
  }
  function showCard() {
    if (!session || session.idx >= session.queue.length) { endStudy(); return; }
    var item = session.queue[session.idx];
    $('cardFront').textContent = item.card.front;
    $('cardBack').textContent = item.card.back;
    flashInner.classList.remove('flipped');
    gradeBox.classList.add('hidden');
    flipHint.classList.remove('hidden');
    $('studyCount').textContent = session.idx + ' / ' + session.total;
    $('studyFill').style.width = Math.round((session.idx / session.total) * 100) + '%';
  }
  function flip() {
    if (!session) return;
    flashInner.classList.add('flipped');
    gradeBox.classList.remove('hidden');
    flipHint.classList.add('hidden');
  }
  function grade(kind) {
    if (!session || session.idx >= session.queue.length) return;
    var item = session.queue[session.idx];
    var c = item.card;
    c.reviews++;
    if (kind === 'again') {
      c.lapses++;
      c.interval = 0;
      c.ease = Math.max(1.3, c.ease - 0.2);
      c.due = Date.now() + 10 * 60000; // 10 min
      session.queue.push(item); // re-queue
      session.total++;
    } else {
      session.correct++;
      if (kind === 'hard') { c.ease = Math.max(1.3, c.ease - 0.05); c.interval = c.interval === 0 ? 1 : Math.max(1, Math.round(c.interval * 1.2)); }
      else if (kind === 'good') { c.interval = c.interval === 0 ? 1 : Math.round(c.interval * c.ease); }
      else { c.ease = Math.min(3.0, c.ease + 0.1); c.interval = c.interval === 0 ? 3 : Math.round(c.interval * c.ease * 1.3); }
      c.due = Date.now() + c.interval * DAY;
    }
    session.idx++;
    save();
    showCard();
  }
  function endStudy() {
    var acc = session && session.total ? Math.round((session.correct / session.total) * 100) : 0;
    session = null;
    studyView.classList.add('hidden');
    libraryView.classList.remove('hidden');
    render();
    toast('Session complete — accuracy ' + acc + '% 🎓', 'success');
  }

  // ---------- Deck modal ----------
  function openDeckModal(id) {
    editingDeckId = id || null;
    $('deckModalTitle').textContent = id ? '✏️ Edit Deck' : '📚 New Deck';
    $('deckName').value = id ? (findDeck(id) || {}).name || '' : '';
    $('btnDeleteDeck').classList.toggle('hidden', !id);
    $('deckModal').classList.remove('hidden');
    setTimeout(function () { $('deckName').focus(); }, 50);
  }
  function saveDeck() {
    var name = $('deckName').value.trim();
    if (!name) { toast('Deck name required', ''); return; }
    if (editingDeckId) {
      var d = findDeck(editingDeckId);
      if (d) d.name = name;
      toast('Deck updated ✓', 'success');
    } else {
      store.decks.unshift({ id: uid('d'), name: name, createdAt: Date.now(), cards: [] });
      toast('Deck created ✓', 'success');
    }
    save(); render();
    $('deckModal').classList.add('hidden');
    editingDeckId = null;
  }

  // ---------- Card modal ----------
  function fillDeckOptions(selId) {
    var sel = $('cardDeck');
    sel.innerHTML = '';
    store.decks.forEach(function (d) {
      var o = document.createElement('option');
      o.value = d.id; o.textContent = d.name;
      if (d.id === selId) o.selected = true;
      sel.appendChild(o);
    });
  }
  function openCardModal(deckId, cardId) {
    if (!store.decks.length) { toast('Create a deck first', ''); openDeckModal(); return; }
    editingCardId = cardId || null;
    $('cardModalTitle').textContent = cardId ? '✏️ Edit Card' : '＋ New Card';
    if (cardId) {
      var found = null, ownerId = deckId;
      store.decks.forEach(function (d) {
        d.cards.forEach(function (c) { if (c.id === cardId) { found = c; ownerId = d.id; } });
      });
      if (!found) return;
      fillDeckOptions(ownerId);
      $('cardFrontInput').value = found.front;
      $('cardBackInput').value = found.back;
    } else {
      fillDeckOptions(deckId || store.decks[0].id);
      $('cardFrontInput').value = '';
      $('cardBackInput').value = '';
    }
    $('btnDeleteCard').classList.toggle('hidden', !cardId);
    $('cardModal').classList.remove('hidden');
    setTimeout(function () { $('cardFrontInput').focus(); }, 50);
  }
  function saveCard() {
    var front = $('cardFrontInput').value.trim();
    var back = $('cardBackInput').value.trim();
    if (!front || !back) { toast('Front and back required', ''); return; }
    var deck = findDeck($('cardDeck').value) || store.decks[0];
    if (editingCardId) {
      store.decks.forEach(function (d) {
        var idx = -1;
        d.cards.forEach(function (c, i) { if (c.id === editingCardId) idx = i; });
        if (idx !== -1) {
          var card = d.cards[idx];
          card.front = front; card.back = back;
          if (d.id !== deck.id) { d.cards.splice(idx, 1); deck.cards.push(card); }
        }
      });
      toast('Card updated ✓', 'success');
    } else {
      deck.cards.push(newCard(front, back));
      toast('Card added ✓', 'success');
    }
    save(); render();
    if (detailDeckId) renderDetail(detailDeckId);
    $('cardModal').classList.add('hidden');
    editingCardId = null;
  }

  // ---------- Detail modal ----------
  function renderDetail(deckId) {
    detailDeckId = deckId;
    var d = findDeck(deckId);
    if (!d) return;
    $('detailTitle').textContent = '📚 ' + d.name + ' (' + d.cards.length + ')';
    var list = $('detailList');
    list.innerHTML = '';
    if (!d.cards.length) list.innerHTML = '<p style="color:var(--dim);text-align:center">No cards yet.</p>';
    d.cards.forEach(function (c) {
      var row = document.createElement('div');
      row.className = 'detail-row';
      var dueStr = c.due <= Date.now() ? 'due now' : 'due in ' + Math.ceil((c.due - Date.now()) / DAY) + 'd';
      row.innerHTML = '<div class="grow"><b>' + esc(c.front) + '</b><small>' + esc(c.back) + ' • ' + dueStr + ' • ×' + c.reviews + '</small></div>' +
        '<button data-card-edit="' + c.id + '" title="Edit">✏️</button>';
      list.appendChild(row);
    });
    $('detailModal').classList.remove('hidden');
  }

  // ---------- Events ----------
  deckGrid.addEventListener('click', function (e) {
    var study = e.target.closest('[data-study]');
    var view = e.target.closest('[data-view]');
    var edit = e.target.closest('[data-deck-edit]');
    if (study) { startStudy(study.dataset.study); }
    else if (view) { renderDetail(view.dataset.view); }
    else if (edit) { openDeckModal(edit.dataset.deckEdit); }
  });
  $('detailList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-card-edit]');
    if (b) openCardModal(detailDeckId, b.dataset.cardEdit);
  });

  flashInner.addEventListener('click', flip);
  gradeBox.addEventListener('click', function (e) {
    var b = e.target.closest('[data-grade]');
    if (b && !gradeBox.classList.contains('hidden')) grade(b.dataset.grade);
  });
  $('btnExitStudy').addEventListener('click', function () {
    session = null;
    studyView.classList.add('hidden');
    libraryView.classList.remove('hidden');
    render();
  });

  $('btnStudy').addEventListener('click', function () { startStudy(null); });
  $('btnAddDeck').addEventListener('click', function () { openDeckModal(); });
  $('btnAddCard').addEventListener('click', function () { openCardModal(detailDeckId); });
  $('btnSaveDeck').addEventListener('click', saveDeck);
  $('btnSaveCard').addEventListener('click', saveCard);
  $('btnDeleteDeck').addEventListener('click', function () {
    if (!editingDeckId) return;
    if (!confirm('Delete this deck and all its cards?')) return;
    store.decks = store.decks.filter(function (d) { return d.id !== editingDeckId; });
    save(); render();
    $('deckModal').classList.add('hidden');
    editingDeckId = null;
    toast('Deck deleted');
  });
  $('btnDeleteCard').addEventListener('click', function () {
    if (!editingCardId) return;
    store.decks.forEach(function (d) { d.cards = d.cards.filter(function (c) { return c.id !== editingCardId; }); });
    save(); render();
    if (detailDeckId) renderDetail(detailDeckId);
    $('cardModal').classList.add('hidden');
    editingCardId = null;
    toast('Card deleted');
  });
  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { $(b.dataset.close).classList.add('hidden'); });
  });
  ['deckModal', 'cardModal', 'detailModal'].forEach(function (id) {
    $(id).addEventListener('click', function (e) { if (e.target === $(id)) $(id).classList.add('hidden'); });
  });

  window.addEventListener('keydown', function (e) {
    var typing = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) !== -1;
    if (e.key === 'Escape') {
      ['deckModal', 'cardModal', 'detailModal'].forEach(function (id) { $(id).classList.add('hidden'); });
      return;
    }
    if (typing) {
      if (e.key === 'Enter' && e.target === $('deckName')) saveDeck();
      return;
    }
    if (!studyView.classList.contains('hidden') && session) {
      if (e.code === 'Space') { e.preventDefault(); if (gradeBox.classList.contains('hidden')) flip(); }
      else if (e.key === '1' && !gradeBox.classList.contains('hidden')) grade('again');
      else if (e.key === '2' && !gradeBox.classList.contains('hidden')) grade('hard');
      else if (e.key === '3' && !gradeBox.classList.contains('hidden')) grade('good');
      else if (e.key === '4' && !gradeBox.classList.contains('hidden')) grade('easy');
      return;
    }
    if (studyView.classList.contains('hidden')) {
      if (e.key.toLowerCase() === 's') startStudy(null);
      else if (e.key.toLowerCase() === 'd') openDeckModal();
      else if (e.key.toLowerCase() === 'n') openCardModal(detailDeckId);
    }
  });

  render();
})();
