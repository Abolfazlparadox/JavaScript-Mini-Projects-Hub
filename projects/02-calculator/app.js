/**
 * CalcPro Studio | Core Engineering Calculator Engine
 */

(function () {
  'use strict';

  // --- Calculator State ---
  const state = {
    currentVal: '0',
    previousVal: null,
    operation: null,
    resetNext: false,
    memory: 0,
    history: JSON.parse(localStorage.getItem('calcpro_history') || '[]'),
    soundEnabled: localStorage.getItem('calcpro_sound') !== 'false',
  };

  // --- DOM Elements ---
  const primaryScreen = document.getElementById('primaryScreen');
  const expressionHistory = document.getElementById('expressionHistory');
  const currentOperatorBadge = document.getElementById('currentOperatorBadge');
  const memoryIndicator = document.getElementById('memoryIndicator');

  const historyPanel = document.getElementById('historyPanel');
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyTapeList = document.getElementById('historyTapeList');
  const btnClearTape = document.getElementById('btnClearTape');

  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIconOn = document.getElementById('soundIconOn');
  const soundIconOff = document.getElementById('soundIconOff');
  const toastContainer = document.getElementById('toastContainer');

  // --- Audio Engine ---
  let audioCtx = null;
  function playClick(type = 'click') {
    if (!state.soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (type === 'click') {
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'equal') {
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {}
  }

  // --- Safe Math Engine ---
  function formatNumber(numStr) {
    if (!numStr || numStr === 'Error' || numStr === 'Infinity' || numStr === '-Infinity') return numStr;
    const parts = numStr.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    const formattedInt = parseFloat(integerPart).toLocaleString('en-US');
    if (isNaN(parseFloat(integerPart))) return numStr;
    return decimalPart !== undefined ? `${formattedInt}.${decimalPart}` : formattedInt;
  }

  function updateScreen() {
    primaryScreen.textContent = formatNumber(state.currentVal);
    currentOperatorBadge.textContent = state.operation ? getOpSymbol(state.operation) : '';

    if (state.previousVal !== null && state.operation) {
      expressionHistory.textContent = `${formatNumber(state.previousVal)} ${getOpSymbol(state.operation)}`;
    } else {
      expressionHistory.textContent = '';
    }

    // Memory indicator
    memoryIndicator.classList.toggle('hidden', state.memory === 0);
  }

  function getOpSymbol(op) {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default: return op;
    }
  }

  function appendDigit(digit) {
    playClick('click');
    if (state.resetNext) {
      state.currentVal = digit === '.' ? '0.' : digit;
      state.resetNext = false;
    } else {
      if (digit === '.') {
        if (state.currentVal.includes('.')) return;
        state.currentVal += '.';
      } else {
        state.currentVal = state.currentVal === '0' ? digit : state.currentVal + digit;
      }
    }
    // Limit to 15 digits
    if (state.currentVal.replace(/[^0-9]/g, '').length > 15) return;
    updateScreen();
  }

  function chooseOperation(op) {
    playClick('click');
    if (state.currentVal === 'Error') return;

    if (state.previousVal !== null && !state.resetNext) {
      computeResult();
    }

    state.operation = op;
    state.previousVal = state.currentVal;
    state.resetNext = true;
    updateScreen();
  }

  function computeResult() {
    if (state.operation === null || state.previousVal === null) return;

    const prev = parseFloat(state.previousVal);
    const curr = parseFloat(state.currentVal);
    if (isNaN(prev) || isNaN(curr)) return;

    let res = 0;
    switch (state.operation) {
      case '+':
        res = prev + curr;
        break;
      case '-':
        res = prev - curr;
        break;
      case '*':
        res = prev * curr;
        break;
      case '/':
        if (curr === 0) {
          state.currentVal = 'Error';
          state.previousVal = null;
          state.operation = null;
          state.resetNext = true;
          updateScreen();
          return;
        }
        res = prev / curr;
        break;
    }

    // Fix floating point issues
    res = Math.round(res * 1e12) / 1e12;
    const resStr = res.toString();

    // Add to calculation history
    addHistoryRecord(`${formatNumber(state.previousVal)} ${getOpSymbol(state.operation)} ${formatNumber(state.currentVal)}`, resStr);

    state.currentVal = resStr;
    state.previousVal = null;
    state.operation = null;
    state.resetNext = true;
    playClick('equal');
    updateScreen();
  }

  // --- Scientific / Instant Functions ---
  function applyFunction(fn) {
    playClick('click');
    let val = parseFloat(state.currentVal);
    if (isNaN(val)) return;

    let expr = '';
    let res = 0;

    switch (fn) {
      case 'sqrt':
        if (val < 0) {
          state.currentVal = 'Error';
          updateScreen();
          return;
        }
        res = Math.sqrt(val);
        expr = `√(${val})`;
        break;
      case 'sq':
        res = val * val;
        expr = `sqr(${val})`;
        break;
      case 'percent':
        res = val / 100;
        expr = `${val}%`;
        break;
      case 'negate':
        res = -val;
        state.currentVal = res.toString();
        updateScreen();
        return;
    }

    res = Math.round(res * 1e12) / 1e12;
    const resStr = res.toString();
    addHistoryRecord(expr, resStr);

    state.currentVal = resStr;
    state.resetNext = true;
    updateScreen();
  }

  // --- Actions ---
  function clearAll() {
    playClick('click');
    state.currentVal = '0';
    state.previousVal = null;
    state.operation = null;
    state.resetNext = false;
    updateScreen();
  }

  function clearEntry() {
    playClick('click');
    state.currentVal = '0';
    updateScreen();
  }

  function backspace() {
    playClick('click');
    if (state.resetNext) return;
    if (state.currentVal.length === 1 || (state.currentVal.length === 2 && state.currentVal.startsWith('-'))) {
      state.currentVal = '0';
    } else {
      state.currentVal = state.currentVal.slice(0, -1);
    }
    updateScreen();
  }

  // --- Memory Operations ---
  function handleMemory(action) {
    playClick('click');
    const val = parseFloat(state.currentVal);
    switch (action) {
      case 'mc':
        state.memory = 0;
        showToast('Memory Cleared');
        break;
      case 'mr':
        state.currentVal = state.memory.toString();
        state.resetNext = true;
        showToast(`Memory Recalled: ${state.memory}`);
        break;
      case 'm+':
        if (!isNaN(val)) {
          state.memory += val;
          showToast(`Added to Memory: ${state.memory}`);
        }
        break;
      case 'm-':
        if (!isNaN(val)) {
          state.memory -= val;
          showToast(`Subtracted from Memory: ${state.memory}`);
        }
        break;
    }
    updateScreen();
  }

  // --- History Tape ---
  function addHistoryRecord(expr, res) {
    state.history.unshift({ expr, res, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    if (state.history.length > 20) state.history.pop();
    localStorage.setItem('calcpro_history', JSON.stringify(state.history));
    renderHistoryTape();
  }

  function renderHistoryTape() {
    historyTapeList.innerHTML = '';
    if (state.history.length === 0) {
      historyTapeList.innerHTML = '<p class="empty-tape-msg">No calculations yet.</p>';
      return;
    }

    state.history.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'tape-item';
      card.innerHTML = `
        <div class="tape-expr">${item.expr} =</div>
        <div class="tape-res">${item.res}</div>
      `;
      card.addEventListener('click', () => {
        state.currentVal = item.res;
        state.resetNext = true;
        updateScreen();
        showToast(`Recalled ${item.res}`);
      });
      historyTapeList.appendChild(card);
    });
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 1800);
  }

  // --- Event Listeners ---
  document.querySelector('.keypad-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.dataset.num !== undefined) {
      appendDigit(btn.dataset.num);
    } else if (btn.dataset.op !== undefined) {
      chooseOperation(btn.dataset.op);
    } else if (btn.dataset.fn !== undefined) {
      applyFunction(btn.dataset.fn);
    } else if (btn.dataset.action === 'equal') {
      computeResult();
    } else if (btn.dataset.action === 'clear') {
      clearAll();
    } else if (btn.dataset.action === 'clear-entry') {
      clearEntry();
    } else if (btn.dataset.action === 'backspace') {
      backspace();
    }
  });

  document.querySelector('.memory-bar').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.mem) {
      handleMemory(btn.dataset.mem);
    } else if (btn.dataset.action === 'copy') {
      navigator.clipboard.writeText(state.currentVal);
      showToast(`Copied ${state.currentVal} to clipboard!`);
    }
  });

  historyToggleBtn.addEventListener('click', () => {
    historyPanel.classList.toggle('hidden');
  });

  btnClearTape.addEventListener('click', () => {
    state.history = [];
    localStorage.removeItem('calcpro_history');
    renderHistoryTape();
    showToast('History tape cleared');
  });

  soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem('calcpro_sound', state.soundEnabled);
    soundIconOn.classList.toggle('hidden', !state.soundEnabled);
    soundIconOff.classList.toggle('hidden', state.soundEnabled);
    showToast(state.soundEnabled ? 'Sound Enabled 🔊' : 'Sound Muted 🔇');
  });

  // Global Keyboard listener
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
      appendDigit(e.key);
    } else if (['+', '-', '*', '/'].includes(e.key)) {
      chooseOperation(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      computeResult();
    } else if (e.key === 'Backspace') {
      backspace();
    } else if (e.key === 'Escape') {
      clearAll();
    } else if (e.key === '%') {
      applyFunction('percent');
    } else if (e.key.toLowerCase() === 'h') {
      historyToggleBtn.click();
    } else if (e.key.toLowerCase() === 'm') {
      soundToggleBtn.click();
    }
  });

  // Init
  soundIconOn.classList.toggle('hidden', !state.soundEnabled);
  soundIconOff.classList.toggle('hidden', state.soundEnabled);
  renderHistoryTape();
  updateScreen();
})();
