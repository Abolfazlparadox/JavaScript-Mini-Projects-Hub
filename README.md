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

[Explore Live Hub](#-overview) • [Project Catalog](#-project-catalog) • [Getting Started](#-quick-start) • [Adding New Projects](#-how-to-add-a-new-project)

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

## 🗂️ Project Catalog

| # | Project Name | Category | Key Web Concepts & APIs | Live Path | Status |
|---|---|---|---|---|---|
| **01** | **ChromaCraft Studio** | DOM & Visuals | Color Math, WCAG Luminance, Web Audio API, LocalStorage | [`projects/01-color-flipper`](projects/01-color-flipper/index.html) | 🟢 **Live & Interactive** |
| **02** | **CalcPro Studio** | State & Logic | Safe Math Parser, History Tape, Memory Registers, Numpad | [`projects/02-calculator`](projects/02-calculator/index.html) | 🟢 **Live & Interactive** |
| **03** | **SkyPulse Weather** | Utilities & Tools | Dual API + Mock Engine, 5-Day Forecast, Geolocation, Units | [`projects/03-weather-app`](projects/03-weather-app/index.html) | 🟢 **Live & Interactive** |
| **04** | **Aura Testimonials** | UI Components | SVG Countdown Ring, Touch Swipe, Star Ratings, Modal | [`projects/04-testimonial-slider`](projects/04-testimonial-slider/index.html) | 🟢 **Live & Interactive** |
| **05** | **PulseGauge Studio** | DOM & Visuals | SVG Stroke Math, Pomodoro Timer, Stream Simulator | [`projects/05-circular-progress`](projects/05-circular-progress/index.html) | 🟢 **Live & Interactive** |
| **06** | **Lumina Gallery Pro** | Media & Canvas | Masonry Grid, Fullscreen Lightbox, Keyboard Shortcuts, Download | [`projects/06-image-gallery`](projects/06-image-gallery/index.html) | 🟢 **Live & Interactive** |
| **07** | **AuthCraft Portal** | UI Components | Sliding Tabs, Password Strength Meter, Eye Toggle, Local Auth | [`projects/07-auth-portal`](projects/07-auth-portal/index.html) | 🟢 **Live & Interactive** |
| **08** | **SocialSphere Feed** | UI Components | Post Creation, Live Comments, Story Modal, Like Reactions | [`projects/08-social-network`](projects/08-social-network/index.html) | 🟢 **Live & Interactive** |
| **09** | **Wanderlust Explorer** | DOM & Visuals | Destination Filters, Tour Booking Modal, Sticky Header, Drawer | [`projects/09-travel-explorer`](projects/09-travel-explorer/index.html) | 🟢 **Live & Interactive** |
| **10** | **TaskFlow / Grocery Bud**| Utilities & Tools | Full CRUD operations, `localStorage` synchronization | [`projects/template`](projects/template/index.html) | 🟡 *Template Ready* |

---

## 🏛️ Repository Architecture

The monorepo follows an isolated, modular folder hierarchy:

```text
15-app-javascripts/
├── index.html                     # Central Showcase Hub & Dashboard
├── hub.css                        # Glassmorphic UI design tokens (Dark & Light)
├── hub.js                         # Hub controller (Search, filters, modal preview)
├── projects.json                  # Central metadata registry for all mini-apps
├── package.json                   # Project metadata and quick-start scripts
├── .gitignore                     # Clean repository ignores
├── README.md                      # Repository documentation
│
├── projects/
│   ├── 01-color-flipper/          # ChromaCraft Studio
│   ├── 02-calculator/             # CalcPro Engineering Calculator
│   ├── 03-weather-app/            # SkyPulse Meteorological Dashboard
│   ├── 04-testimonial-slider/     # Aura Testimonial Slider & Carousel
│   ├── 05-circular-progress/      # PulseGauge Circular Progress Studio
│   ├── 06-image-gallery/          # Lumina Gallery Pro & Lightbox
│   ├── 07-auth-portal/            # AuthCraft 3-in-1 Authentication Portal
│   ├── 08-social-network/         # SocialSphere Feed & Stories
│   ├── 09-travel-explorer/        # Wanderlust Travel Expeditions
│   └── template/                  # Standard Scaffolding for new projects (#10+)
│
└── Assets/
    └── color-flipper/             # Legacy redirect to projects/01-color-flipper
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
   cp -r projects/template projects/10-new-project
   ```
2. **Build Your Feature:**
   - Customize `projects/10-new-project/index.html`
   - Add styles in `projects/10-new-project/styles.css`
   - Implement your logic in `projects/10-new-project/app.js`
3. **Register in `projects.json`:**
   Add a new entry to the `projects.json` array:
   ```json
   {
     "id": "10",
     "slug": "10-new-project",
     "title": "Your Project Title",
     "subtitle": "Subtitle Description",
     "description": "Short explanation of the feature.",
     "category": "State & Logic",
     "tags": ["DOM Events", "Web API"],
     "difficulty": "Beginner",
     "path": "projects/10-new-project/index.html",
     "status": "completed",
     "icon": "🚀"
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
