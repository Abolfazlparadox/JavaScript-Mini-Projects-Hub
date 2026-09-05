# 🎨 #01 - ChromaCraft: Advanced Color & Gradient Studio

> An interactive, responsive, and accessible Color Studio & Flipper built with pure Vanilla JavaScript, CSS variables, and modern web APIs.

![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-Modern_Glassmorphism-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Accessibility](https://img.shields.io/badge/WCAG-2.1_AAA_Compliant-10B981?style=for-the-badge)

---

## 🌟 Key Features

- **Multiple Creative Modes:**
  - **Solid Color Mode:** Instant random generation of HEX, RGB, and HSL values.
  - **Gradient Studio:** Linear and Radial gradient generation with real-time 360° angle slider control and individual stop previews.
  - **Palette Generator:** 5-color aesthetic harmonies (Analogous, Complementary, Triadic) plus curated design themes (Cyberpunk, Sunset, Pastel, Emerald, Terracotta).
- **Adaptive WCAG Contrast Engine:**
  - Computes the exact relative luminance of any generated background color using the official WCAG 2.1 formula:
    $$L = 0.2126 \times R + 0.7152 \times G + 0.0722 \times B$$
  - Dynamically flips UI text, icons, and borders between dark slate and crisp white to guarantee 100% legibility and accessibility.
- **Color History Strip:**
  - Preserves a visual deck of the last 10 generated colors. Click any chip to restore it immediately.
- **Local Favorites Storage:**
  - Save your favorite colors or gradients to `localStorage` and manage them anytime via the favorites modal.
- **Web Audio API Sound Effects:**
  - Built-in tactile synth click and chime feedback synthesized on-the-fly (zero external audio files, toggleable mute).
- **Quick Clipboard & CSS Export:**
  - One-click copy for HEX, RGB, HSL, or complete CSS background rules with toast feedback.
- **Power Keyboard Shortcuts:**
  - <kbd>Space</kbd>: Generate / Flip
  - <kbd>C</kbd>: Copy current code
  - <kbd>1</kbd> or <kbd>S</kbd>: Solid mode
  - <kbd>2</kbd> or <kbd>G</kbd>: Gradient mode
  - <kbd>3</kbd> or <kbd>P</kbd>: Palettes mode
  - <kbd>M</kbd>: Toggle sound
  - <kbd>F</kbd>: Save favorite

---

## 📂 File Architecture

```
01-color-flipper/
├── index.html       # Semantic HTML5 markup with accessible ARIA roles
├── styles.css       # Fluid glassmorphic UI, CSS variables, dynamic contrast
├── app.js           # ES6+ color math, audio engine, event bus, and storage
└── README.md        # Project documentation
```

---

## 🧠 Concepts & Skills Practiced

1. **Mathematical Color Models:** Converting between HEX, RGB, and HSL color spaces.
2. **Accessible Design Standards (a11y):** Dynamic contrast calculation according to W3C standards.
3. **Modern Web Audio API:** Synthesizing sound effects programmatically with `OscillatorNode` and `GainNode`.
4. **Clipboard API & Fallbacks:** Seamless asynchronous clipboard integration with graceful degradation.
5. **State & Local Storage Management:** Persisting preferences and favorited palettes across browser sessions.
