# 🕰️ #24 — TimeWarp Studio

> Multi-zone world clock with a live analog canvas, precision stopwatch with laps, and a countdown timer with alarm.

---

## 🌟 Features

- **World clock** — 15 IANA zones via `Intl`, add/remove persisted, local hero + canvas analog with smooth sweep
- **Stopwatch** — centisecond precision, lap splits with fastest/slowest badges
- **Countdown** — H/M/S inputs, 5 presets incl. 🍅 Pomodoro, progress ring, urgent state, Web Audio alarm + Notification
- **Shortcuts** — `Space` start/pause, `L` lap (stopwatch tab)

## 🛠️ Tech Stack & Web APIs

- **Time:** Intl.DateTimeFormat, performance.now • **Audio/Alerts:** Web Audio alarm, Notification API • **Canvas:** analog clock

## 🚀 How to Run

1. Open `index.html` directly in any browser, or launch it from the root Hub.
