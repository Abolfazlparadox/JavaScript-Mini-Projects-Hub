# 🔑 #19 — PassForge Studio

> Secure password, passphrase & PIN generator with real entropy math, crack-time estimates and a local-only history.

---

## 🌟 Features

- **3 modes** — Password (4–64 chars, 5 charset toggles), Passphrase (wordlist + separator), PIN
- **Crypto-grade randomness** — `crypto.getRandomValues` with rejection sampling
- **Strength lab** — entropy bits, charset size, crack-time @ 10B guesses/sec, 5-tier meter
- **Color-coded output** — upper / lower / digit / symbol tinting, click-to-copy
- **History** — last 24 secrets stored locally only, one-click reuse
- **Shortcuts** — `G` regenerate, `C` copy

## 🛠️ Tech Stack & Web APIs

- **Crypto:** Web Crypto API • **Storage:** LocalStorage options + history • **UX:** Clipboard API

## 🚀 How to Run

1. Open `index.html` directly in any browser, or launch it from the root Hub.
