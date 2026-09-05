/**
 * PulseGauge Studio | Circular Progress & Gauge Controller
 */

(function () {
  'use strict';

  const CIRCUMFERENCE = 2 * Math.PI * 105; // ~659.734

  // --- Themes ---
  const THEMES = {
    ocean: { start: '#06b6d4', end: '#3b82f6' },
    sunset: { start: '#f59e0b', end: '#ef4444' },
    emerald: { start: '#10b981', end: '#059669' },
    cyber: { start: '#ec4899', end: '#8b5cf6' },
  };

  // --- State ---
  const state = {
    mode: 'gauge', // 'gauge' | 'timer' | 'upload'
    gaugeVal: 0,
    theme: 'ocean',

    // Timer state
    timerMinutes: 25,
    timerRemainingSec: 25 * 60,
    timerRunning: false,
    timerInterval: null,

    // Upload state
    uploading: false,
    uploadProgress: 0,
    uploadInterval: null,
  };

  // --- DOM Elements ---
  const gaugeProgress = document.getElementById('gaugeProgress');
  const gaugeValue = document.getElementById('gaugeValue');
  const gaugeStatus = document.getElementById('gaugeStatus');
  const gaugeGradient = document.getElementById('gaugeGradient');

  const tabBtns = document.querySelectorAll('.mode-tabs .tab-btn');
  const panelGauge = document.getElementById('panelGauge');
  const panelTimer = document.getElementById('panelTimer');
  const panelUpload = document.getElementById('panelUpload');

  const valSlider = document.getElementById('valSlider');
  const sliderLabel = document.getElementById('sliderLabel');
  const presetBtns = document.querySelectorAll('.preset-btn');

  const durBtns = document.querySelectorAll('.dur-btn');
  const btnTimerStart = document.getElementById('btnTimerStart');
  const btnTimerReset = document.getElementById('btnTimerReset');

  const btnStartUpload = document.getElementById('btnStartUpload');
  const btnCancelUpload = document.getElementById('btnCancelUpload');
  const uploadSpeedLabel = document.getElementById('uploadSpeedLabel');
  const themeDots = document.querySelectorAll('.theme-dot');

  // --- Render Progress ---
  function setProgress(pct, displayLabel = null, statusLabel = null) {
    const clamped = Math.max(0, Math.min(100, pct));
    const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
    gaugeProgress.style.strokeDashoffset = offset;

    gaugeValue.textContent = displayLabel !== null ? displayLabel : `${Math.round(clamped)}%`;
    if (statusLabel !== null) gaugeStatus.textContent = statusLabel;
  }

  // --- Switch Mode ---
  function setMode(mode) {
    state.mode = mode;
    tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));

    panelGauge.classList.toggle('hidden', mode !== 'gauge');
    panelTimer.classList.toggle('hidden', mode !== 'timer');
    panelUpload.classList.toggle('hidden', mode !== 'upload');

    // Reset when switching
    if (mode === 'gauge') {
      setProgress(state.gaugeVal, `${state.gaugeVal}%`, 'Interactive');
    } else if (mode === 'timer') {
      stopTimer();
      updateTimerDisplay();
    } else if (mode === 'upload') {
      stopUpload();
      setProgress(0, '0%', 'Ready to Upload');
    }
  }

  // --- Mode 1: Manual Gauge ---
  valSlider.addEventListener('input', (e) => {
    state.gaugeVal = parseInt(e.target.value, 10);
    sliderLabel.textContent = `${state.gaugeVal}%`;
    setProgress(state.gaugeVal, `${state.gaugeVal}%`, 'Manual Gauge');
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.val, 10);
      state.gaugeVal = val;
      valSlider.value = val;
      sliderLabel.textContent = `${val}%`;
      setProgress(val, `${val}%`, 'Preset Value');
    });
  });

  // --- Mode 2: Pomodoro Timer ---
  durBtns.forEach((b) => {
    b.addEventListener('click', () => {
      durBtns.forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      state.timerMinutes = parseInt(b.dataset.mins, 10);
      resetTimer();
    });
  });

  function updateTimerDisplay() {
    const mins = Math.floor(state.timerRemainingSec / 60);
    const secs = state.timerRemainingSec % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const totalSecs = state.timerMinutes * 60;
    const pct = ((totalSecs - state.timerRemainingSec) / totalSecs) * 100;
    setProgress(pct, timeStr, state.timerRunning ? 'Focusing...' : 'Paused');
  }

  function toggleTimer() {
    if (state.timerRunning) {
      stopTimer();
      btnTimerStart.textContent = 'Resume Focus';
    } else {
      state.timerRunning = true;
      btnTimerStart.textContent = 'Pause';
      state.timerInterval = setInterval(() => {
        if (state.timerRemainingSec > 0) {
          state.timerRemainingSec--;
          updateTimerDisplay();
        } else {
          stopTimer();
          setProgress(100, '00:00', 'Session Complete! 🔔');
          btnTimerStart.textContent = 'Start Focus';
        }
      }, 1000);
    }
  }

  function stopTimer() {
    state.timerRunning = false;
    if (state.timerInterval) clearInterval(state.timerInterval);
  }

  function resetTimer() {
    stopTimer();
    state.timerRemainingSec = state.timerMinutes * 60;
    btnTimerStart.textContent = 'Start Focus';
    updateTimerDisplay();
  }

  btnTimerStart.addEventListener('click', toggleTimer);
  btnTimerReset.addEventListener('click', resetTimer);

  // --- Mode 3: Upload Simulator ---
  function startUpload() {
    if (state.uploading) return;
    state.uploading = true;
    state.uploadProgress = 0;
    btnStartUpload.disabled = true;

    state.uploadInterval = setInterval(() => {
      state.uploadProgress += Math.random() * 8 + 3;
      if (state.uploadProgress >= 100) {
        state.uploadProgress = 100;
        setProgress(100, '100%', 'Upload Complete! ✅');
        uploadSpeedLabel.textContent = '145 MB transferred in 4.2s';
        stopUpload();
      } else {
        const speed = (Math.random() * 12 + 18).toFixed(1);
        setProgress(state.uploadProgress, `${Math.round(state.uploadProgress)}%`, 'Transferring...');
        uploadSpeedLabel.textContent = `Streaming at ${speed} MB/s`;
      }
    }, 200);
  }

  function stopUpload() {
    state.uploading = false;
    btnStartUpload.disabled = false;
    if (state.uploadInterval) clearInterval(state.uploadInterval);
  }

  btnStartUpload.addEventListener('click', startUpload);
  btnCancelUpload.addEventListener('click', () => {
    stopUpload();
    setProgress(0, '0%', 'Upload Cancelled');
    uploadSpeedLabel.textContent = 'Ready to transfer';
  });

  // --- Theme Swatches ---
  themeDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      themeDots.forEach((d) => d.classList.remove('active'));
      dot.classList.add('active');
      const th = THEMES[dot.dataset.theme];
      if (th) {
        gaugeGradient.children[0].setAttribute('stop-color', th.start);
        gaugeGradient.children[1].setAttribute('stop-color', th.end);
      }
    });
  });

  // --- Init ---
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  gaugeProgress.style.strokeDasharray = CIRCUMFERENCE;
  setProgress(0);
})();
