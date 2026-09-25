# 📈 #16 — CryptoPulse Live Ticker

> High-frequency crypto market tracker with live Binance REST + WebSocket streaming, canvas micro-charts, watchlist and threshold alerts — plus a full offline simulation fallback so it never breaks.

---

## 🌟 Features

- **Dual engine** — live Binance REST + `miniTicker` WebSocket stream, auto-fallback to offline geometric-random-walk simulation
- **8 assets** — BTC, ETH, SOL, BNB, XRP, DOGE, ADA, AVAX with price, 24h change, H/L, volume
- **Canvas micro-charts** — gradient sparklines per card + full detail chart with grid & last-price line
- **Market overview** — gainers / losers / total volume / last-update strip
- **Watchlist** — star coins, persisted, with watchlist-only filter
- **Price alerts** — above/below thresholds with sound, toast + Notification API
- **Search & 6 sort orders**, connection status pill, `A` / `R` / `/` shortcuts

## 🛠️ Tech Stack & Web APIs

- **Networking:** Fetch + REST polling, native WebSocket streams, timeout guards
- **Rendering:** Canvas 2D sparklines & charts • **Alerts:** Web Audio beeps, Notification API
- **Storage:** LocalStorage watchlist / alerts / sound preference

## 🚀 How to Run

1. Open `index.html` directly in any browser, or launch it from the root Hub.
2. With internet access you get the **live stream**; offline it runs the **simulated feed**.
