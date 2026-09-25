# 📑 #15 — Markdown Live Studio

> High-performance split-pane Markdown editor with a hand-written zero-dependency parser, synchronized scrolling, formatting toolbar and one-click HTML / Markdown / PDF export.

---

## 🌟 Features

- **Custom Markdown parser** — headings, bold/italic/strike, inline + fenced code, lists, task lists, blockquotes, tables (with alignment), links, images, HR
- **Tiny syntax highlighter** — comments / strings / keywords / numbers in code blocks
- **Split-pane UX** — editor / split / preview view modes, bidirectional sync scroll toggle
- **Toolbar** — 16 one-click snippet actions (headings, lists, table, fence…)
- **Live counters** — words, characters, lines, reading time + autosave indicator
- **Export suite** — standalone styled HTML, `.md` download, copy-HTML, print-to-PDF
- **Persistence** — debounced LocalStorage autosave + sample document
- **Shortcuts** — `Ctrl+B/I/K`, `Ctrl+S` export, `Tab` inserts spaces

## 🛠️ Tech Stack & Web APIs

- **Parsing:** hand-rolled block + inline engine (regex state machine), XSS-safe escaping
- **Web APIs:** LocalStorage, Clipboard, Blob download, `window.print` with print CSS

## 🚀 How to Run

1. Open `index.html` directly in any browser, or launch it from the root Hub.
