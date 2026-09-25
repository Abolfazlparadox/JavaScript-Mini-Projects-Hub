# 🧪 #23 — RegexLab Tester

> Live regular-expression playground with match highlighting, capture-group inspector, replace preview, cheatsheet and saved patterns.

---

## 🌟 Features

- **Live evaluation** — debounced matching with invalid-regex error display
- **Highlight engine** — alternating match colors, zero-length-loop guarded
- **Group inspector** — `$1…$n` values + match indexes (first 30 shown)
- **Replace lab** — `$1`/`$&` preview + apply-to-input
- **Learning aids** — 5 one-click presets, 20-token clickable cheatsheet
- **Library** — save / load / delete named patterns (LocalStorage)

## 🛠️ Tech Stack & Web APIs

- **Engine:** native RegExp (all 6 flags) • **Storage:** LocalStorage pattern library

## 🚀 How to Run

1. Open `index.html` directly in any browser, or launch it from the root Hub.
