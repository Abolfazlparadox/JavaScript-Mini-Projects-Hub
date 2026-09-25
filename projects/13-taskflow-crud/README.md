# 📝 #13 — TaskFlow Studio (Grocery Bud / CRUD Organizer)

> Full-featured persistent task & grocery organizer with inline editing, priorities, due-date tracking, batch actions and JSON backup.

---

## 🌟 Features

- **Full CRUD** — create, toggle, edit (modal with notes), delete
- **Categories & priorities** — 6 categories, 3 priority levels with color coding
- **Due dates** — overdue detection with red alert badges
- **Live search + filters** — status pills, category filter, 5 sort orders
- **Stats dashboard** — SVG progress ring, total/active/completed/overdue counters
- **Batch actions** — complete-all, clear-completed, delete-all (guarded)
- **Backup** — one-click JSON export / validated import
- **Persistence** — auto-saved to `localStorage`, seeded sample tasks on first run
- **Keyboard** — `Enter` add, `/` focus search, `Esc` close dialogs

## 🛠️ Tech Stack & Web APIs

- **DOM:** event delegation, dynamic list rendering, SVG ring math
- **Web APIs:** LocalStorage, FileReader, Blob download, native date input

## 🚀 How to Run

1. Open `index.html` directly in any browser, or launch it from the root Hub.
