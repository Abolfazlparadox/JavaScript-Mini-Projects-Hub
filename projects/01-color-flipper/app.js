/**
 * ChromaCraft Studio | Core Application Logic
 * Advanced Color, Gradient, and Palette Studio
 */

(function () {
  'use strict';

  // --- State Management ---
  const state = {
    mode: 'solid', // 'solid' | 'gradient' | 'palette'
    currentColor: '#6366F1',
    gradient: {
      type: 'linear',
      angle: 135,
      colors: ['#6366F1', '#EC4899'],
    },
    palette: {
      preset: 'harmony-analogous',
      colors: ['#6366F1', '#818cf8', '#a5b4fc', '#4f46e5', '#3730a3'],
    },
    history: [],
    favorites: JSON.parse(localStorage.getItem('chromacraft_favorites') || '[]'),
    soundEnabled: localStorage.getItem('chromacraft_sound') !== 'false',
  };

  // --- Curated Preset Palettes ---
  const PRESET_COLLECTIONS = {
    cyberpunk: ['#ff007f', '#00f0ff', '#ffe600', '#7b2cbf', '#10002b'],
    sunset: ['#0d1b2a', '#1b263b', '#415a77', '#f4a261', '#e76f51'],
    pastel: ['#bde0fe', '#ffc8dd', '#ffafcc', '#cdb4db', '#a2d2ff'],
    emerald: ['#064e3b', '#047857', '#10b981', '#34d399', '#a7f3d0'],
    terracotta: ['#582f0e', '#7f4f24', '#936639', '#a68a64', '#b6ad90'],
  };

  // --- DOM Elements ---
  const body = document.body;
  const tabSolid = document.getElementById('tabSolid');
  const tabGradient = document.getElementById('tabGradient');
  const tabPalette = document.getElementById('tabPalette');

  const colorTypeBadge = document.getElementById('colorTypeBadge');
  const contrastBadge = document.getElementById('contrastBadge');
  const contrastText = document.getElementById('contrastText');
  const primaryColorText = document.getElementById('primaryColorText');
  const copyHeroCodeBtn = document.getElementById('copyHeroCodeBtn');

  const valHex = document.getElementById('valHex');
  const valRgb = document.getElementById('valRgb');
  const valHsl = document.getElementById('valHsl');
  const codeFormatsGrid = document.getElementById('codeFormatsGrid');

  const gradientControls = document.getElementById('gradientControls');
  const gradientAngle = document.getElementById('gradientAngle');
  const angleLabel = document.getElementById('angleLabel');
  const btnLinearGrad = document.getElementById('btnLinearGrad');
  const btnRadialGrad = document.getElementById('btnRadialGrad');
  const gradientStopsList = document.getElementById('gradientStopsList');

  const palettePanel = document.getElementById('palettePanel');
  const presetSelect = document.getElementById('presetSelect');
  const paletteStrips = document.getElementById('paletteStrips');

  const btnFlip = document.getElementById('btnFlip');
  const btnFlipText = document.getElementById('btnFlipText');
  const btnCopyCss = document.getElementById('btnCopyCss');
  const btnSaveFavorite = document.getElementById('btnSaveFavorite');
  const favStarIcon = document.getElementById('favStarIcon');
  const favCount = document.getElementById('favCount');

  const historyChips = document.getElementById('historyChips');
  const btnClearHistory = document.getElementById('btnClearHistory');

  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIconOn = document.getElementById('soundIconOn');
  const soundIconOff = document.getElementById('soundIconOff');

  const favoritesToggleBtn = document.getElementById('favoritesToggleBtn');
  const favModal = document.getElementById('favModal');
  const btnCloseFav = document.getElementById('btnCloseFav');
  const btnCloseFav2 = document.getElementById('btnCloseFav2');
  const favListContainer = document.getElementById('favListContainer');
  const favEmptyMsg = document.getElementById('favEmptyMsg');
  const btnClearFavorites = document.getElementById('btnClearFavorites');

  const shortcutsBtn = document.getElementById('shortcutsBtn');
  const shortcutsModal = document.getElementById('shortcutsModal');
  const btnCloseShortcuts = document.getElementById('btnCloseShortcuts');
  const btnCloseShortcuts2 = document.getElementById('btnCloseShortcuts2');

  const toastContainer = document.getElementById('toastContainer');

  // --- Audio Synthesizer (Web Audio API) ---
  let audioCtx = null;
  function playBeep(type = 'flip') {
    if (!state.soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (type === 'flip') {
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'copy') {
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(920, now + 0.1);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      // Audio might be blocked before first interaction
    }
  }

  // --- Color Algorithms & Conversions ---
  function randomHexChannel() {
    return Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0');
  }

  function generateRandomHex() {
    return `#${randomHexChannel()}${randomHexChannel()}${randomHexChannel()}`.toUpperCase();
  }

  function hexToRgb(hex) {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return {
      r: Math.round(255 * f(0)),
      g: Math.round(255 * f(8)),
      b: Math.round(255 * f(4)),
    };
  }

  function rgbToHex(r, g, b) {
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  }

  // --- WCAG Luminance & Contrast Calculation ---
  function getLuminance(r, g, b) {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function getContrastRatio(lum1, lum2) {
    const brighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (brighter + 0.05) / (darker + 0.05);
  }

  function updateContrastAdaptation(hexColor) {
    const rgb = hexToRgb(hexColor);
    const bgLum = getLuminance(rgb.r, rgb.g, rgb.b);

    // Lum for pure black is 0, pure white is 1
    const contrastWithBlack = getContrastRatio(bgLum, 0);
    const contrastWithWhite = getContrastRatio(bgLum, 1);

    const isLightBg = bgLum > 0.42;
    body.setAttribute('data-contrast', isLightBg ? 'light' : 'dark');

    const effectiveRatio = isLightBg ? contrastWithBlack : contrastWithWhite;
    const ratioFormatted = effectiveRatio.toFixed(1) + ':1';

    let rating = 'WCAG AA';
    if (effectiveRatio >= 7) {
      rating = 'WCAG AAA';
    } else if (effectiveRatio < 4.5) {
      rating = 'Low Contrast';
    }

    contrastText.textContent = `${rating} • ${ratioFormatted}`;
  }

  // --- Mode Switching ---
  function setMode(newMode) {
    state.mode = newMode;
    [tabSolid, tabGradient, tabPalette].forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.mode === newMode);
      tab.setAttribute('aria-selected', tab.dataset.mode === newMode);
    });

    if (newMode === 'solid') {
      colorTypeBadge.textContent = 'HEX COLOR';
      gradientControls.classList.add('hidden');
      palettePanel.classList.add('hidden');
      codeFormatsGrid.classList.remove('hidden');
      btnFlipText.textContent = 'Flip Color';
      applySolidColor(state.currentColor, false);
    } else if (newMode === 'gradient') {
      colorTypeBadge.textContent = 'CSS GRADIENT';
      gradientControls.classList.remove('hidden');
      palettePanel.classList.add('hidden');
      codeFormatsGrid.classList.add('hidden');
      btnFlipText.textContent = 'Generate Gradient';
      applyGradient(state.gradient, false);
    } else if (newMode === 'palette') {
      colorTypeBadge.textContent = '5-COLOR PALETTE';
      gradientControls.classList.add('hidden');
      palettePanel.classList.remove('hidden');
      codeFormatsGrid.classList.add('hidden');
      btnFlipText.textContent = 'Generate Palette';
      applyPalette(state.palette.colors, false);
    }
  }

  // --- Applying Styles to Document & Card ---
  function applySolidColor(hex, pushHistory = true) {
    state.currentColor = hex;
    body.style.background = hex;

    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    primaryColorText.textContent = hex;
    valHex.textContent = hex;
    valRgb.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    valHsl.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

    updateContrastAdaptation(hex);
    updateFavoriteButtonState();

    if (pushHistory) {
      addToHistory({ type: 'solid', value: hex });
    }
  }

  function applyGradient(gradObj, pushHistory = true) {
    state.gradient = { ...gradObj };
    let cssGrad = '';
    if (state.gradient.type === 'radial') {
      cssGrad = `radial-gradient(circle at center, ${state.gradient.colors.join(', ')})`;
    } else {
      cssGrad = `linear-gradient(${state.gradient.angle}deg, ${state.gradient.colors.join(', ')})`;
    }

    body.style.background = cssGrad;
    primaryColorText.textContent = `${state.gradient.colors[0]} → ${state.gradient.colors[1]}`;

    // Compute contrast based on first color
    updateContrastAdaptation(state.gradient.colors[0]);
    renderGradientStops();
    updateFavoriteButtonState();

    if (pushHistory) {
      addToHistory({ type: 'gradient', value: cssGrad, stops: state.gradient.colors });
    }
  }

  function renderGradientStops() {
    gradientStopsList.innerHTML = '';
    state.gradient.colors.forEach((col, idx) => {
      const chip = document.createElement('div');
      chip.className = 'stop-chip';
      chip.innerHTML = `
        <span class="stop-color-dot" style="background: ${col}"></span>
        <span>${col}</span>
      `;
      chip.addEventListener('click', () => {
        copyToClipboard(col, `Color stop ${idx + 1} copied!`);
      });
      gradientStopsList.appendChild(chip);
    });
  }

  function applyPalette(colors, pushHistory = true) {
    state.palette.colors = [...colors];
    const dominantColor = colors[0];
    body.style.background = dominantColor;
    primaryColorText.textContent = dominantColor;

    updateContrastAdaptation(dominantColor);
    renderPaletteStrips();
    updateFavoriteButtonState();

    if (pushHistory) {
      addToHistory({ type: 'palette', colors: colors, value: dominantColor });
    }
  }

  function renderPaletteStrips() {
    paletteStrips.innerHTML = '';
    state.palette.colors.forEach((col) => {
      const strip = document.createElement('div');
      strip.className = 'palette-strip';
      strip.style.backgroundColor = col;
      strip.innerHTML = `<span>${col}</span>`;
      strip.title = `Click to set as primary background or copy ${col}`;
      strip.addEventListener('click', () => {
        applySolidColor(col);
        setMode('solid');
        showToast(`Applied ${col} from palette!`);
      });
      paletteStrips.appendChild(strip);
    });
  }

  // --- Generation Generators ---
  function generateNewSolid() {
    const hex = generateRandomHex();
    applySolidColor(hex);
    playBeep('flip');
  }

  function generateNewGradient() {
    const col1 = generateRandomHex();
    const col2 = generateRandomHex();
    const angle = Math.floor(Math.random() * 36) * 10;
    state.gradient.angle = angle;
    gradientAngle.value = angle;
    angleLabel.textContent = `${angle}°`;
    applyGradient({
      type: state.gradient.type,
      angle: angle,
      colors: [col1, col2],
    });
    playBeep('flip');
  }

  function generateHarmoniousPalette(type) {
    const baseH = Math.floor(Math.random() * 360);
    const baseS = 65 + Math.floor(Math.random() * 25);
    const baseL = 45 + Math.floor(Math.random() * 20);

    let colors = [];
    if (type === 'harmony-analogous') {
      const offsets = [-40, -20, 0, 20, 40];
      colors = offsets.map((off) => {
        const h = (baseH + off + 360) % 360;
        const rgb = hslToRgb(h, baseS, baseL);
        return rgbToHex(rgb.r, rgb.g, rgb.b);
      });
    } else if (type === 'harmony-complementary') {
      const compH = (baseH + 180) % 360;
      colors = [
        rgbToHex(...Object.values(hslToRgb(baseH, baseS, 35))),
        rgbToHex(...Object.values(hslToRgb(baseH, baseS, 55))),
        rgbToHex(...Object.values(hslToRgb(baseH, baseS, 75))),
        rgbToHex(...Object.values(hslToRgb(compH, baseS, 50))),
        rgbToHex(...Object.values(hslToRgb(compH, baseS, 70))),
      ];
    } else if (type === 'harmony-triadic') {
      const h2 = (baseH + 120) % 360;
      const h3 = (baseH + 240) % 360;
      colors = [
        rgbToHex(...Object.values(hslToRgb(baseH, baseS, 55))),
        rgbToHex(...Object.values(hslToRgb(h2, baseS, 55))),
        rgbToHex(...Object.values(hslToRgb(h3, baseS, 55))),
        rgbToHex(...Object.values(hslToRgb(baseH, baseS, 35))),
        rgbToHex(...Object.values(hslToRgb(h2, baseS, 75))),
      ];
    } else if (PRESET_COLLECTIONS[type]) {
      colors = [...PRESET_COLLECTIONS[type]];
    } else {
      colors = Array.from({ length: 5 }, () => generateRandomHex());
    }

    applyPalette(colors);
    playBeep('flip');
  }

  function handleFlipAction() {
    if (state.mode === 'solid') {
      generateNewSolid();
    } else if (state.mode === 'gradient') {
      generateNewGradient();
    } else if (state.mode === 'palette') {
      generateHarmoniousPalette(presetSelect.value);
    }
  }

  // --- History Queue ---
  function addToHistory(item) {
    // Avoid duplicate head
    if (state.history.length > 0 && state.history[0].value === item.value) return;
    state.history.unshift(item);
    if (state.history.length > 10) state.history.pop();
    renderHistory();
  }

  function renderHistory() {
    historyChips.innerHTML = '';
    state.history.forEach((item) => {
      const chip = document.createElement('button');
      chip.className = 'history-chip';
      chip.style.background = item.value;
      chip.title = `Restore ${item.value}`;
      chip.addEventListener('click', () => {
        if (item.type === 'solid') {
          setMode('solid');
          applySolidColor(item.value, false);
        } else if (item.type === 'gradient') {
          setMode('gradient');
          applyGradient(
            {
              type: state.gradient.type,
              angle: state.gradient.angle,
              colors: item.stops || ['#6366F1', '#EC4899'],
            },
            false
          );
        } else if (item.type === 'palette') {
          setMode('palette');
          applyPalette(item.colors || [item.value], false);
        }
        showToast(`Restored ${item.value}`);
      });
      historyChips.appendChild(chip);
    });
  }

  // --- Favorites Management ---
  function saveFavorites() {
    localStorage.setItem('chromacraft_favorites', JSON.stringify(state.favorites));
    updateFavoriteButtonState();
  }

  function updateFavoriteButtonState() {
    favCount.textContent = state.favorites.length;
    const currentVal =
      state.mode === 'solid' ? state.currentColor : state.mode === 'gradient' ? body.style.background : state.palette.colors[0];
    const isSaved = state.favorites.some((f) => f.value === currentVal);
    favStarIcon.style.fill = isSaved ? '#f59e0b' : 'none';
    favStarIcon.style.stroke = isSaved ? '#f59e0b' : 'currentColor';
  }

  function toggleCurrentFavorite() {
    let currentVal = state.currentColor;
    let type = state.mode;
    if (type === 'gradient') currentVal = body.style.background;
    if (type === 'palette') currentVal = state.palette.colors[0];

    const idx = state.favorites.findIndex((f) => f.value === currentVal);
    if (idx > -1) {
      state.favorites.splice(idx, 1);
      showToast('Removed from favorites');
    } else {
      state.favorites.unshift({ type, value: currentVal, date: new Date().toLocaleDateString() });
      showToast('Saved to favorites! ❤️');
      playBeep('copy');
    }
    saveFavorites();
    renderFavoritesModal();
  }

  function renderFavoritesModal() {
    favListContainer.innerHTML = '';
    if (state.favorites.length === 0) {
      favListContainer.appendChild(favEmptyMsg);
      favEmptyMsg.classList.remove('hidden');
      return;
    }
    favEmptyMsg.classList.add('hidden');
    const grid = document.createElement('div');
    grid.className = 'fav-grid';

    state.favorites.forEach((fav, index) => {
      const item = document.createElement('div');
      item.className = 'fav-item';
      item.innerHTML = `
        <div class="fav-item-preview">
          <div class="fav-color-box" style="background: ${fav.value}"></div>
          <span class="fav-code">${fav.value.length > 20 ? fav.value.substring(0, 20) + '...' : fav.value}</span>
        </div>
        <div class="fav-item-actions">
          <button class="btn-fav-apply" data-index="${index}">Apply</button>
          <button class="btn-fav-del" data-index="${index}">✕</button>
        </div>
      `;

      item.querySelector('.btn-fav-apply').addEventListener('click', () => {
        if (fav.type === 'solid') {
          setMode('solid');
          applySolidColor(fav.value, false);
        } else {
          body.style.background = fav.value;
          primaryColorText.textContent = fav.value;
        }
        favModal.classList.add('hidden');
        showToast('Favorite applied!');
      });

      item.querySelector('.btn-fav-del').addEventListener('click', () => {
        state.favorites.splice(index, 1);
        saveFavorites();
        renderFavoritesModal();
      });

      grid.appendChild(item);
    });

    favListContainer.appendChild(grid);
  }

  // --- Clipboard & Toast ---
  function copyToClipboard(text, message = 'Copied to clipboard!') {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast(message);
        playBeep('copy');
      })
      .catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast(message);
        playBeep('copy');
      });
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // --- Event Listeners ---
  // Tabs
  tabSolid.addEventListener('click', () => setMode('solid'));
  tabGradient.addEventListener('click', () => setMode('gradient'));
  tabPalette.addEventListener('click', () => setMode('palette'));

  // Main Flip Action
  btnFlip.addEventListener('click', handleFlipAction);

  // Copy Primary Code
  copyHeroCodeBtn.addEventListener('click', () => {
    copyToClipboard(state.currentColor, `Copied ${state.currentColor}!`);
  });

  // Copy formats pill clicks
  codeFormatsGrid.addEventListener('click', (e) => {
    const pill = e.target.closest('.format-pill');
    if (!pill) return;
    const type = pill.dataset.copy;
    if (type === 'hex') copyToClipboard(valHex.textContent, `Copied ${valHex.textContent}!`);
    if (type === 'rgb') copyToClipboard(valRgb.textContent, `Copied ${valRgb.textContent}!`);
    if (type === 'hsl') copyToClipboard(valHsl.textContent, `Copied ${valHsl.textContent}!`);
  });

  // Copy Full CSS
  btnCopyCss.addEventListener('click', () => {
    let cssSnippet = '';
    if (state.mode === 'solid') {
      cssSnippet = `background-color: ${state.currentColor};`;
    } else if (state.mode === 'gradient') {
      cssSnippet = `background: ${body.style.background};`;
    } else {
      cssSnippet = `/* Palette */\n${state.palette.colors.map((c, i) => `--color-${i + 1}: ${c};`).join('\n')}`;
    }
    copyToClipboard(cssSnippet, 'CSS snippet copied!');
  });

  // Save Favorite
  btnSaveFavorite.addEventListener('click', toggleCurrentFavorite);

  // Clear History
  btnClearHistory.addEventListener('click', () => {
    state.history = [];
    renderHistory();
    showToast('History cleared');
  });

  // Gradient controls
  gradientAngle.addEventListener('input', (e) => {
    const angle = e.target.value;
    angleLabel.textContent = `${angle}°`;
    state.gradient.angle = angle;
    applyGradient(state.gradient, false);
  });

  btnLinearGrad.addEventListener('click', () => {
    state.gradient.type = 'linear';
    btnLinearGrad.classList.add('active');
    btnRadialGrad.classList.remove('active');
    applyGradient(state.gradient, false);
  });

  btnRadialGrad.addEventListener('click', () => {
    state.gradient.type = 'radial';
    btnRadialGrad.classList.add('active');
    btnLinearGrad.classList.remove('active');
    applyGradient(state.gradient, false);
  });

  // Palette select
  presetSelect.addEventListener('change', (e) => {
    generateHarmoniousPalette(e.target.value);
  });

  // Sound toggle
  soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem('chromacraft_sound', state.soundEnabled);
    soundIconOn.classList.toggle('hidden', !state.soundEnabled);
    soundIconOff.classList.toggle('hidden', state.soundEnabled);
    showToast(state.soundEnabled ? 'Sound enabled 🔊' : 'Sound muted 🔇');
  });

  // Favorites Modal
  favoritesToggleBtn.addEventListener('click', () => {
    renderFavoritesModal();
    favModal.classList.remove('hidden');
  });
  btnCloseFav.addEventListener('click', () => favModal.classList.add('hidden'));
  btnCloseFav2.addEventListener('click', () => favModal.classList.add('hidden'));
  btnClearFavorites.addEventListener('click', () => {
    state.favorites = [];
    saveFavorites();
    renderFavoritesModal();
  });

  // Shortcuts Modal
  shortcutsBtn.addEventListener('click', () => shortcutsModal.classList.remove('hidden'));
  btnCloseShortcuts.addEventListener('click', () => shortcutsModal.classList.add('hidden'));
  btnCloseShortcuts2.addEventListener('click', () => shortcutsModal.classList.add('hidden'));

  // Close modals on outside click
  [favModal, shortcutsModal].forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Ignore when typing inside inputs
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      handleFlipAction();
    } else if (e.key === 'c' || e.key === 'C') {
      copyToClipboard(state.currentColor, `Copied ${state.currentColor}!`);
    } else if (e.key === '1' || e.key === 's' || e.key === 'S') {
      setMode('solid');
    } else if (e.key === '2' || e.key === 'g' || e.key === 'G') {
      setMode('gradient');
    } else if (e.key === '3' || e.key === 'p' || e.key === 'P') {
      setMode('palette');
    } else if (e.key === 'm' || e.key === 'M') {
      soundToggleBtn.click();
    } else if (e.key === 'f' || e.key === 'F') {
      toggleCurrentFavorite();
    } else if (e.key === 'Escape') {
      favModal.classList.add('hidden');
      shortcutsModal.classList.add('hidden');
    }
  });

  // --- Initialize ---
  function init() {
    // Initialize sound icon
    soundIconOn.classList.toggle('hidden', !state.soundEnabled);
    soundIconOff.classList.toggle('hidden', state.soundEnabled);

    // Initial color
    applySolidColor('#6366F1');
    updateFavoriteButtonState();
  }

  init();
})();
