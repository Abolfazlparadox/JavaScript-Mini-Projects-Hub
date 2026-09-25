/**
 * BeatPulse Synth (#14) | Web Audio Drum Machine & Step Sequencer
 * Pure synthesis (zero samples): kick/snare/hat/clap + melodic bass/lead
 * with lookahead scheduler, swing, filters, presets & FFT visualizer.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'beatpulse_state_v1';
  var STEPS = 16;

  var TRACKS = [
    { id: 'kick',  name: 'Kick',  color: '#6366f1', type: 'drum' },
    { id: 'snare', name: 'Snare', color: '#ec4899', type: 'drum' },
    { id: 'hat',   name: 'Hi-Hat',color: '#38bdf8', type: 'drum' },
    { id: 'clap',  name: 'Clap',  color: '#f59e0b', type: 'drum' },
    { id: 'bass',  name: 'Bass',  color: '#10b981', type: 'melodic', octave: 1 },
    { id: 'lead',  name: 'Lead',  color: '#a78bfa', type: 'melodic', octave: 2 },
  ];
  var SCALES = {
    minor:    [110.0, 130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66],
    major:    [130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66, 329.63],
    phrygian: [164.81, 174.61, 196.0, 220.0, 246.94, 261.63, 293.66, 329.63],
    blues:    [110.0, 130.81, 138.59, 146.83, 164.81, 196.0, 207.65, 220.0],
  };
  var PRESETS = {
    house: {
      kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
      clap:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0],
      bass:  [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0],
      lead:  [0,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0],
    },
    hiphop: {
      kick:  [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,1,1, 0,1,0,1, 1,0,1,0, 1,1,0,1],
      clap:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      bass:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],
      lead:  [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
    },
    techno: {
      kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
      snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
      hat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
      clap:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
      bass:  [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,1,0,0],
      lead:  [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,1,0],
    },
    dnb: {
      kick:  [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
      hat:   [1,1,0,1, 1,0,1,1, 0,1,1,0, 1,0,1,1],
      clap:  [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
      bass:  [1,0,0,1, 0,0,1,0, 0,0,0,0, 1,0,0,1],
      lead:  [0,0,1,0, 0,1,0,0, 0,0,1,0, 0,0,0,0],
    },
  };

  // ---------- State ----------
  var state = loadState();
  var playing = false;
  var currentStep = 0;
  var nextNoteTime = 0;
  var schedulerTimer = null;
  var scheduledSteps = []; // {step, time}

  function defaultPattern() {
    var p = {};
    TRACKS.forEach(function (t) {
      p[t.id] = new Array(STEPS).fill(0);
    });
    return p;
  }
  function loadState() {
    var s = {
      pattern: PRESETS.house ? JSON.parse(JSON.stringify(PRESETS.house)) : defaultPattern(),
      muted: {}, bpm: 120, swing: 0, volume: 80,
      wave: 'sawtooth', cutoff: 1800, reso: 6, scale: 'minor',
    };
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        if (saved.pattern) s.pattern = saved.pattern;
        ['bpm', 'swing', 'volume', 'wave', 'cutoff', 'reso', 'scale'].forEach(function (k) {
          if (saved[k] !== undefined) s[k] = saved[k];
        });
        if (saved.muted) s.muted = saved.muted;
      }
    } catch (e) {}
    TRACKS.forEach(function (t) {
      if (!Array.isArray(s.pattern[t.id]) || s.pattern[t.id].length !== STEPS) {
        s.pattern[t.id] = new Array(STEPS).fill(0);
      }
    });
    return s;
  }
  function saveState(silent) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
    if (!silent) toast('Pattern saved ✓', 'success');
  }

  // ---------- DOM ----------
  function $(id) { return document.getElementById(id); }
  var btnPlay = $('btnPlay'), iconPlay = $('iconPlay'), iconPause = $('iconPause');
  var btnStop = $('btnStop'), btnTap = $('btnTap');
  var bpmSlider = $('bpmSlider'), bpmVal = $('bpmVal');
  var swingSlider = $('swingSlider'), swingVal = $('swingVal');
  var volSlider = $('volSlider'), volVal = $('volVal');
  var stepDots = $('stepDots'), seqGrid = $('seqGrid');
  var waveSelect = $('waveSelect'), cutoffSlider = $('cutoffSlider'), cutoffVal = $('cutoffVal');
  var resoSlider = $('resoSlider'), resoVal = $('resoVal'), scaleSelect = $('scaleSelect');
  var vizCanvas = $('vizCanvas'), vizOverlay = $('vizOverlay');
  var toasts = $('toastContainer');

  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    toasts.appendChild(el);
    setTimeout(function () { el.remove(); }, 2000);
  }

  // ---------- Audio engine ----------
  var actx = null, masterGain = null, analyser = null, noiseBuf = null;

  function ensureAudio() {
    if (actx) {
      if (actx.state === 'suspended') actx.resume();
      return true;
    }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { toast('Web Audio not supported in this browser', ''); return false; }
      actx = new AC();
      masterGain = actx.createGain();
      masterGain.gain.value = state.volume / 100;
      analyser = actx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;
      masterGain.connect(analyser);
      analyser.connect(actx.destination);
      noiseBuf = actx.createBuffer(1, actx.sampleRate * 1, actx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      startVizLoop();
      return true;
    } catch (e) { toast('Could not start audio engine', ''); return false; }
  }

  function env(g, t, peak, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  }
  function noiseSrc(t, dur) {
    var s = actx.createBufferSource();
    s.buffer = noiseBuf; s.loop = true;
    s.start(t); s.stop(t + dur + 0.05);
    return s;
  }

  function playKick(t) {
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    env(g, t, 0.9, 0.28);
    o.connect(g); g.connect(masterGain);
    o.start(t); o.stop(t + 0.32);
  }
  function playSnare(t) {
    var n = noiseSrc(t, 0.2), f = actx.createBiquadFilter(), g = actx.createGain();
    f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.8;
    env(g, t, 0.55, 0.18);
    n.connect(f); f.connect(g); g.connect(masterGain);
    var o = actx.createOscillator(), g2 = actx.createGain();
    o.type = 'triangle'; o.frequency.value = 190;
    env(g2, t, 0.4, 0.1);
    o.connect(g2); g2.connect(masterGain);
    o.start(t); o.stop(t + 0.14);
  }
  function playHat(t, open) {
    var n = noiseSrc(t, open ? 0.35 : 0.08), f = actx.createBiquadFilter(), g = actx.createGain();
    f.type = 'highpass'; f.frequency.value = 7200;
    env(g, t, open ? 0.32 : 0.26, open ? 0.32 : 0.055);
    n.connect(f); f.connect(g); g.connect(masterGain);
  }
  function playClap(t) {
    for (var i = 0; i < 3; i++) {
      (function (k) {
        var tt = t + k * 0.018;
        var n = noiseSrc(tt, 0.12), f = actx.createBiquadFilter(), g = actx.createGain();
        f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.4;
        env(g, tt, 0.4, k === 2 ? 0.22 : 0.05);
        n.connect(f); f.connect(g); g.connect(masterGain);
      })(i);
    }
  }
  function playMelodic(t, freq, isBass) {
    var o = actx.createOscillator(), f = actx.createBiquadFilter(), g = actx.createGain();
    o.type = state.wave;
    o.frequency.setValueAtTime(freq * (isBass ? 0.5 : 1), t);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(Math.min(state.cutoff * 1.6, 12000), t);
    f.frequency.exponentialRampToValueAtTime(Math.max(state.cutoff, 60), t + (isBass ? 0.22 : 0.3));
    f.Q.value = state.reso;
    env(g, t, isBass ? 0.5 : 0.32, isBass ? 0.26 : 0.34);
    o.connect(f); f.connect(g); g.connect(masterGain);
    o.start(t); o.stop(t + 0.4);
  }

  function scaleFreq(step) {
    var scale = SCALES[state.scale] || SCALES.minor;
    return scale[step % scale.length];
  }

  function scheduleStep(step, t) {
    scheduledSteps.push({ step: step, time: t });
    TRACKS.forEach(function (tr) {
      if (state.muted[tr.id]) return;
      if (!state.pattern[tr.id][step]) return;
      try {
        if (tr.id === 'kick') playKick(t);
        else if (tr.id === 'snare') playSnare(t);
        else if (tr.id === 'hat') playHat(t, step % 4 === 2);
        else if (tr.id === 'clap') playClap(t);
        else if (tr.id === 'bass') playMelodic(t, scaleFreq(step), true);
        else if (tr.id === 'lead') playMelodic(t, scaleFreq((step + 3) % 8) * 2, false);
      } catch (e) {}
    });
  }

  function scheduler() {
    var spb = 60 / state.bpm / 4; // 16th note
    while (nextNoteTime < actx.currentTime + 0.12) {
      var t = nextNoteTime;
      if (currentStep % 2 === 1) t += spb * (state.swing / 100);
      scheduleStep(currentStep, t);
      nextNoteTime += spb;
      currentStep = (currentStep + 1) % STEPS;
    }
  }

  function startPlayback() {
    if (!ensureAudio()) return;
    playing = true;
    currentStep = 0;
    scheduledSteps = [];
    nextNoteTime = actx.currentTime + 0.06;
    schedulerTimer = setInterval(scheduler, 25);
    btnPlay.classList.add('playing');
    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
    vizOverlay.classList.add('gone');
    requestAnimationFrame(cursorLoop);
  }
  function pausePlayback() {
    playing = false;
    clearInterval(schedulerTimer);
    btnPlay.classList.remove('playing');
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
    paintCursor(-1);
  }
  function stopPlayback() {
    pausePlayback();
    currentStep = 0;
    scheduledSteps = [];
  }

  function cursorLoop() {
    if (!playing) return;
    var now = actx.currentTime;
    while (scheduledSteps.length && scheduledSteps[0].time <= now) {
      paintCursor(scheduledSteps.shift().step);
    }
    requestAnimationFrame(cursorLoop);
  }

  // ---------- Visualizer ----------
  var vizCtx = vizCanvas.getContext('2d');
  var vizData = null;
  function sizeViz() {
    var r = vizCanvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    vizCanvas.width = Math.max(1, r.width * dpr);
    vizCanvas.height = 130 * dpr;
  }
  function startVizLoop() {
    vizData = new Uint8Array(analyser.frequencyBinCount);
    (function draw() {
      requestAnimationFrame(draw);
      if (!analyser) return;
      analyser.getByteFrequencyData(vizData);
      var w = vizCanvas.width, h = vizCanvas.height;
      vizCtx.clearRect(0, 0, w, h);
      var n = 48, bw = w / n;
      for (var i = 0; i < n; i++) {
        var v = vizData[Math.floor((i / n) * vizData.length)] / 255;
        var bh = Math.max(3, v * h * 0.92);
        var grad = vizCtx.createLinearGradient(0, h - bh, 0, h);
        grad.addColorStop(0, '#ec4899');
        grad.addColorStop(1, '#6366f1');
        vizCtx.fillStyle = grad;
        var x = i * bw + bw * 0.18;
        vizCtx.beginPath();
        if (vizCtx.roundRect) vizCtx.roundRect(x, h - bh, bw * 0.64, bh, 4);
        else vizCtx.rect(x, h - bh, bw * 0.64, bh);
        vizCtx.fill();
      }
    })();
  }

  // ---------- Grid UI ----------
  var cellRefs = {}; // trackId -> [cells]
  function buildGrid() {
    seqGrid.innerHTML = '';
    cellRefs = {};
    TRACKS.forEach(function (tr) {
      var row = document.createElement('div');
      row.className = 'seq-row';
      var head = document.createElement('div');
      head.className = 'track-head';
      head.innerHTML =
        '<span class="track-dot" style="background:' + tr.color + ';box-shadow:0 0 8px ' + tr.color + '"></span>' +
        '<span class="track-name" title="' + tr.name + '">' + tr.name + '</span>' +
        '<button class="track-btn' + (state.muted[tr.id] ? ' muted' : '') + '" data-mute="' + tr.id + '" title="Mute ' + tr.name + '">M</button>' +
        '<button class="track-btn" data-preview="' + tr.id + '" title="Preview ' + tr.name + '">▶</button>';
      row.appendChild(head);
      cellRefs[tr.id] = [];
      for (var s = 0; s < STEPS; s++) {
        (function (step) {
          var c = document.createElement('button');
          c.className = 'step-cell' + (step % 4 === 0 ? ' beat' : '');
          c.style.setProperty('--track-color', tr.color);
          c.style.setProperty('--track-glow', tr.color + '99');
          c.setAttribute('aria-label', tr.name + ' step ' + (step + 1));
          if (state.pattern[tr.id][step]) c.classList.add('active');
          c.addEventListener('click', function () {
            state.pattern[tr.id][step] = state.pattern[tr.id][step] ? 0 : 1;
            c.classList.toggle('active');
            if (state.pattern[tr.id][step]) previewTrack(tr.id);
          });
          row.appendChild(c);
          cellRefs[tr.id].push(c);
        })(s);
      }
      seqGrid.appendChild(row);
    });
  }

  function paintCursor(step) {
    var dots = stepDots.children;
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('on', i === step);
    TRACKS.forEach(function (tr) {
      var cells = cellRefs[tr.id] || [];
      for (var s = 0; s < cells.length; s++) cells[s].classList.toggle('now', s === step);
    });
  }

  function previewTrack(id) {
    if (!ensureAudio()) return;
    var t = actx.currentTime + 0.01;
    try {
      if (id === 'kick') playKick(t);
      else if (id === 'snare') playSnare(t);
      else if (id === 'hat') playHat(t, false);
      else if (id === 'clap') playClap(t);
      else if (id === 'bass') playMelodic(t, scaleFreq(0), true);
      else if (id === 'lead') playMelodic(t, scaleFreq(4) * 2, false);
    } catch (e) {}
  }

  // ---------- Presets / random ----------
  function applyPattern(p) {
    TRACKS.forEach(function (tr) {
      state.pattern[tr.id] = p[tr.id].slice();
    });
    buildGrid();
    if (playing) paintCursor(-1);
  }
  function randomize() {
    var p = defaultPattern();
    function density(n) {
      var idxs = [];
      while (idxs.length < n) {
        var r = Math.floor(Math.random() * STEPS);
        if (idxs.indexOf(r) === -1) idxs.push(r);
      }
      return idxs;
    }
    [0, 4, 8, 12].forEach(function (s) { p.kick[s] = 1; });
    density(2).forEach(function (s) { p.kick[s] = 1; });
    [4, 12].forEach(function (s) { p.snare[s] = 1; });
    density(8).forEach(function (s) { p.hat[s] = 1; });
    density(2).forEach(function (s) { p.clap[s] = 1; });
    density(5).forEach(function (s) { p.bass[s] = 1; });
    density(4).forEach(function (s) { p.lead[s] = 1; });
    applyPattern(p);
    toast('Random groove generated 🎲', 'success');
  }

  // ---------- Tap tempo ----------
  var tapTimes = [];
  function tapTempo() {
    var now = performance.now();
    tapTimes.push(now);
    if (tapTimes.length > 5) tapTimes.shift();
    if (tapTimes.length >= 2) {
      var diffs = [];
      for (var i = 1; i < tapTimes.length; i++) diffs.push(tapTimes[i] - tapTimes[i - 1]);
      var avg = diffs.reduce(function (a, b) { return a + b; }, 0) / diffs.length;
      var bpm = Math.round(60000 / avg);
      bpm = Math.max(60, Math.min(200, bpm));
      state.bpm = bpm;
      bpmSlider.value = bpm;
      bpmVal.textContent = bpm;
    }
    if (tapTimes.length === 1) setTimeout(function () { tapTimes = []; }, 2500);
  }

  // ---------- Events ----------
  btnPlay.addEventListener('click', function () { playing ? pausePlayback() : startPlayback(); });
  btnStop.addEventListener('click', stopPlayback);
  btnTap.addEventListener('click', tapTempo);

  bpmSlider.addEventListener('input', function () { state.bpm = +bpmSlider.value; bpmVal.textContent = state.bpm; });
  swingSlider.addEventListener('input', function () { state.swing = +swingSlider.value; swingVal.textContent = state.swing + '%'; });
  volSlider.addEventListener('input', function () {
    state.volume = +volSlider.value;
    volVal.textContent = state.volume + '%';
    if (masterGain) masterGain.gain.value = state.volume / 100;
  });
  waveSelect.addEventListener('change', function () { state.wave = waveSelect.value; });
  cutoffSlider.addEventListener('input', function () { state.cutoff = +cutoffSlider.value; cutoffVal.textContent = state.cutoff + ' Hz'; });
  resoSlider.addEventListener('input', function () { state.reso = +resoSlider.value; resoVal.textContent = state.reso; });
  scaleSelect.addEventListener('change', function () { state.scale = scaleSelect.value; });

  seqGrid.addEventListener('click', function (e) {
    var muteBtn = e.target.closest('[data-mute]');
    var prevBtn = e.target.closest('[data-preview]');
    if (muteBtn) {
      var id = muteBtn.dataset.mute;
      state.muted[id] = !state.muted[id];
      muteBtn.classList.toggle('muted', !!state.muted[id]);
      return;
    }
    if (prevBtn) previewTrack(prevBtn.dataset.preview);
  });

  document.querySelectorAll('.preset-btn[data-preset]').forEach(function (b) {
    b.addEventListener('click', function () {
      applyPattern(JSON.parse(JSON.stringify(PRESETS[b.dataset.preset])));
      toast(b.textContent.trim() + ' pattern loaded', 'success');
    });
  });
  $('btnRandom').addEventListener('click', randomize);
  $('btnClear').addEventListener('click', function () { applyPattern(defaultPattern()); toast('Grid cleared'); });
  $('btnSave').addEventListener('click', function () { saveState(false); });

  var shortcutsModal = $('shortcutsModal');
  $('btnShortcuts').addEventListener('click', function () { shortcutsModal.classList.remove('hidden'); });
  $('btnCloseShortcuts').addEventListener('click', function () { shortcutsModal.classList.add('hidden'); });
  shortcutsModal.addEventListener('click', function (e) { if (e.target === shortcutsModal) shortcutsModal.classList.add('hidden'); });

  window.addEventListener('keydown', function (e) {
    var typing = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) !== -1;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveState(false); return; }
    if (typing) return;
    if (e.code === 'Space') { e.preventDefault(); playing ? pausePlayback() : startPlayback(); }
    else if (e.key.toLowerCase() === 's') stopPlayback();
    else if (e.key.toLowerCase() === 't') tapTempo();
    else if (e.key.toLowerCase() === 'r') randomize();
    else if (e.key === 'Escape') { shortcutsModal.classList.add('hidden'); if (playing) pausePlayback(); }
    else if (e.key === '?') shortcutsModal.classList.remove('hidden');
  });

  window.addEventListener('resize', sizeViz);
  window.addEventListener('beforeunload', function () { saveState(true); });

  // ---------- Init ----------
  for (var d = 0; d < STEPS; d++) {
    var dot = document.createElement('span');
    if (d % 4 === 0) dot.classList.add('beat');
    stepDots.appendChild(dot);
  }
  bpmSlider.value = state.bpm; bpmVal.textContent = state.bpm;
  swingSlider.value = state.swing; swingVal.textContent = state.swing + '%';
  volSlider.value = state.volume; volVal.textContent = state.volume + '%';
  waveSelect.value = state.wave;
  cutoffSlider.value = state.cutoff; cutoffVal.textContent = state.cutoff + ' Hz';
  resoSlider.value = state.reso; resoVal.textContent = state.reso;
  scaleSelect.value = state.scale;
  buildGrid();
  sizeViz();
  setTimeout(sizeViz, 100);
})();
