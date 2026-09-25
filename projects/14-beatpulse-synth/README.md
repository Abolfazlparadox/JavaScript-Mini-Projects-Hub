# 🎹 #14 — BeatPulse Audio Synth

> In-browser 16-step drum machine & melodic sequencer — 100% synthesized with the Web Audio API (zero audio samples), with a lookahead scheduler, swing, filters and live FFT visualizer.

---

## 🌟 Features

- **6 tracks × 16 steps** — Kick, Snare, Hi-Hat, Clap + melodic Bass & Lead
- **Pure synthesis** — sine drops, filtered noise, oscillator bass/leads (no samples)
- **Pro sequencer clock** — lookahead scheduler (25ms / 120ms), BPM 60–200, swing, tap tempo
- **Melodic engine** — 4 scales, waveform / cutoff / resonance controls
- **Live FFT visualizer** — AnalyserNode → canvas bars with playhead cursor
- **Presets** — House, Hip-Hop, Techno, DnB + Random + Clear, auto-persisted
- **Per-track mute + preview**, master volume, `Space` / `S` / `T` / `R` shortcuts

## 🛠️ Tech Stack & Web APIs

- **Web Audio API:** AudioContext, Oscillators, BiquadFilters, Gain envelopes, AnalyserNode
- **Canvas 2D:** real-time frequency visualizer • **Storage:** LocalStorage pattern persistence

## 🚀 How to Run

1. Open `index.html` directly in any browser, or launch it from the root Hub.
2. Press **Play** (audio starts on user gesture, per browser autoplay policy).
