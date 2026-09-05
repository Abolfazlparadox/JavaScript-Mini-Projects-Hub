# 🚀 JavaScript Mini Projects Hub

<div align="center">

![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-Semantic-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Modern_Glassmorphism-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![WCAG](https://img.shields.io/badge/Accessibility-WCAG_2.1_AAA-10B981?style=for-the-badge)
![Dependencies](https://img.shields.io/badge/Dependencies-Zero-blueviolet?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

<br/>

**A curated, modern monorepo showcase of focused frontend mini-applications built with pure Vanilla JavaScript (ES6+), semantic HTML5, and responsive CSS.**

[Explore Live Hub](#-live-hub--architecture) • [Project Catalog](#-project-catalog) • [Getting Started](#-quick-start) • [Adding New Projects](#-how-to-add-a-new-project)

</div>

---

## 📖 Overview

The **JavaScript Mini Projects Hub** is an open-source collection of practical web mini-applications designed to demonstrate core DOM manipulation, asynchronous browser APIs, state handling, and accessible UI engineering—all with **zero third-party frameworks or build-step dependencies**.

The repository features an interactive **Central Showcase Hub** (`index.html`) equipped with:
- 🔍 **Real-Time Live Search:** Instant keyword lookup across titles, tags, and architectural concepts (`Ctrl + K`).
- 🏷️ **Dynamic Category Filters:** Quickly isolate DOM visuals, UI components, state engines, or utilities.
- 📱 **Embedded Iframe Device Previews:** Test each application directly within the hub in Desktop, Tablet (768px), or Mobile (375px) viewports without leaving the page.
- 🌓 **Persistent Theme Switcher:** Dark & Light glassmorphic design system stored via `localStorage`.

---

## 🎨 Spotlight: #01 ChromaCraft Studio

The original Color Flipper has been elevated into **ChromaCraft Studio**, a production-grade color and gradient engineering tool:

```
projects/01-color-flipper/
```

- **Multiple Creative Modes:**
  - **Solid Color Generator:** Instant random generation of HEX, RGB, and HSL values.
  - **Gradient Studio:** Linear and Radial gradient generation with real-time 360° angle slider control and individual stop previews.
  - **Palette Harmonies:** 5-color aesthetic harmonies (Analogous, Complementary, Triadic) plus curated design themes (Cyberpunk, Sunset, Pastel, Emerald, Terracotta).
- **Adaptive WCAG Contrast Engine:**
  - Computes the exact relative luminance of any background color using the official WCAG 2.1 formula ($L = 0.2126R + 0.7152G + 0.0722B$).
  - Dynamically flips UI text, icons, and borders between dark slate and crisp white to guarantee 100% legibility and accessibility.
- **Micro-Audio Synthesizer:**
  - Built-in tactile synth click and chime feedback synthesized programmatically using the native **Web Audio API** (zero external assets, toggleable mute).
- **History & Favorites:**
  - Visual deck of the last 10 generated colors with one-click restoration, plus local favorites drawer.
- **Keyboard Shortcuts:** <kbd>Space</kbd> (Flip), <kbd>C</kbd> (Copy), <kbd>1</kbd>/<kbd>S</kbd> (Solid), <kbd>2</kbd>/<kbd>G</kbd> (Gradient), <kbd>3</kbd>/<kbd>P</kbd> (Palette), <kbd>M</kbd> (Mute).

---

## 🗂️ Project Catalog

| # | Project Name | Category | Key Web Concepts & APIs | Live Path | Status |
|---|---|---|---|---|---|
| **01** | **ChromaCraft Studio** | DOM & Visuals | Color Math, WCAG Luminance, Web Audio API, LocalStorage | [`projects/01-color-flipper`](projects/01-color-flipper/index.html) | 🟢 **Live & Featured** |
| **02** | **TallyPro Counter** | State & Logic | Numeric state handling, step limits, session history | [`projects/template`](projects/template/index.html) | 🟡 *Template Ready* |
| **03** | **Testimonial Slider** | UI Components | Carousel logic, timer progress, touch gesture handling | [`projects/template`](projects/template/index.html) | 🟡 *Template Ready* |
| **04** | **Adaptive App Navbar** | UI Components | Responsive mobile drawer, click-outside listener, focus trap | [`projects/template`](projects/template/index.html) | 🟡 *Template Ready* |
| **05** | **Aura Modal System** | UI Components | Accessible dialogs, scroll-lock, backdrop blur, Escape key | [`projects/template`](projects/template/index.html) | 🟡 *Template Ready* |
| **06** | **Fluid Accordion FAQ** | UI Components | Zero-jump height transitions, live query filtering | [`projects/template`](projects/template/index.html) | 🟡 *Template Ready* |
| **07** | **Gourmet Menu Filter** | State & Logic | Array `filter()`/`reduce()`, debounced search, range sliders | [`projects/template`](projects/template/index.html) | 🟡 *Template Ready* |
| **08** | **Cinematic Video Hero** | Media & Canvas | HTML5 Video API, preloader lifecycle, audio switcher | [`projects/template`](projects/template/index.html) | 🟡 *Template Ready* |
| **09** | **ScrollSense Navigator**| DOM & Visuals | `IntersectionObserver`, reading scroll indicator, back-to-top | [`projects/template`](projects/template/index.html) | 🟡 *Template Ready* |
| **10** | **TaskFlow / Grocery Bud**| Utilities & Tools | Full CRUD operations, `localStorage` synchronization | [`projects/template`](projects/template/index.html) | 🟡 *Template Ready* |

---

## 🏛️ Repository Architecture

The monorepo follows an isolated, predictable folder hierarchy:

```text
15-app-javascripts/
├── index.html                  # Central Showcase Hub & Dashboard
├── hub.css                     # Glassmorphic UI design tokens (Dark & Light)
├── hub.js                      # Hub controller (Search, filters, modal preview)
├── projects.json               # Central metadata registry for all mini-apps
├── package.json                # Project metadata and quick-start scripts
├── .gitignore                  # Clean repository ignores
├── README.md                   # Repository documentation
│
├── projects/
│   ├── 01-color-flipper/       # ChromaCraft Studio (Upgraded)
│   │   ├── index.html          # Semantic accessible markup
│   │   ├── styles.css          # Fluid glassmorphism & dynamic contrast
│   │   ├── app.js              # ES6+ color engine, audio synth, shortcuts
│   │   └── README.md           # Dedicated project guide
│   │
│   └── template/               # Standard Scaffolding for new projects
│       ├── index.html          # Pre-configured layout with Hub navigation
│       ├── styles.css          # Reusable responsive styles
│       ├── app.js              # Starter event logic
│       └── README.md           # Project docs template
│
└── Assets/
    └── color-flipper/          # Legacy compatibility redirect to 01-color-flipper
```

---

## ⚡ Quick Start

Because this repository uses native web standards, **no build step, bundler, or package installation is required**.

### Option A: Direct Browser Preview
Double-click `index.html` at the repository root to open the Showcase Hub directly in your preferred browser.

### Option B: Local Static Server (Recommended)
If you prefer running via a local development server:

```bash
# Clone the repository
git clone https://github.com/Abolfazlparadox/color-flipper.git
cd color-flipper

# Start local server (using npx without permanent install)
npx serve .
```

Then visit `http://localhost:3000` in your browser.

---

## 🛠️ How to Add a New Project

Adding a new mini-application to the suite takes less than 2 minutes:

1. **Duplicate the Template:**
   ```bash
   cp -r projects/template projects/02-counter
   ```
2. **Build Your Feature:**
   - Customize `projects/02-counter/index.html`
   - Add styles in `projects/02-counter/styles.css`
   - Implement your logic in `projects/02-counter/app.js`
3. **Register in `projects.json`:**
   Add a new entry to the `projects.json` array:
   ```json
   {
     "id": "02",
     "slug": "02-counter",
     "title": "TallyPro Counter",
     "subtitle": "Smart Stateful Counter",
     "description": "Dynamic counter with bounds and step configuration.",
     "category": "State & Logic",
     "tags": ["DOM Events", "State Management"],
     "difficulty": "Beginner",
     "path": "projects/02-counter/index.html",
     "status": "completed",
     "icon": "🔢"
   }
   ```
4. **Done!** The project will instantly appear in the Central Hub with live search, category tagging, and iframe previews.

---

## ✉️ Author & Contact

**Abolfazl Mohammadshahi**  
*Senior Software Engineer*

- **LinkedIn:** [Abolfazl Mohammadshahi](https://www.linkedin.com/in/abolfazl-mohammadshahi-12b87b324)
- **GitHub:** [@Abolfazlparadox](https://github.com/Abolfazlparadox)
- **Email:** [abolfazlmohammadshahi78@gmail.com](mailto:abolfazlmohammadshahi78@gmail.com)

---

## 📄 License

This repository is licensed under the [MIT License](LICENSE). Feel free to use, modify, and learn from this codebase.
