# ⚡ #18 — DevTyping Speed Benchmark

> Developer-centric typing benchmark with real JavaScript / Python / CSS snippets — live WPM, accuracy, error heatmap, performance chart, grades and personal-best history.

---

## 🌟 Features

- **Real code snippets** — 9 curated JS / Python / CSS samples with newlines & indentation
- **Per-character engine** — correct / incorrect / caret states, `Tab` inserts 2 spaces
- **Live metrics** — WPM, CPM, accuracy, errors, countdown ring with urgent state
- **Results lab** — S/A/B/C/D grade, consistency score, WPM-over-time canvas chart + error bars
- **Error heatmap** — session-wide most-mistyped characters (`␣`, `⏎` aware)
- **History** — per-language personal bests + recent runs table, persisted
- **Shortcuts** — `Tab` new snippet, `Esc` restart, `H` history, `Enter` dismiss results

## 🛠️ Tech Stack & Web APIs

- **Engine:** keystroke-level scoring, per-second sampling, consistency (CV) math
- **Rendering:** Canvas 2D performance chart • **Feedback:** Web Audio blips
- **Storage:** LocalStorage history / bests / sound preference

## 🚀 How to Run

1. Open `index.html` directly in any browser, or launch it from the root Hub.
