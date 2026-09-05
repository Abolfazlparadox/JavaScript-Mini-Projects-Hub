/**
 * JavaScript Mini Projects Hub | Interactive Controller
 */

(function () {
  'use strict';

  // --- Embedded Fallback Data (Guarantees zero-failure on file:// protocol) ---
  const FALLBACK_PROJECTS = [
    {
      id: '01',
      slug: '01-color-flipper',
      title: 'ChromaCraft Studio',
      subtitle: 'Advanced Color & Gradient Flipper',
      description:
        'An interactive color studio with solid HEX/RGB/HSL generation, 360° gradient controls, WCAG contrast checking, and Web Audio API synthesis.',
      category: 'DOM & Visuals',
      tags: ['DOM Manipulation', 'Color Spaces', 'WCAG', 'Audio API', 'LocalStorage'],
      difficulty: 'Intermediate',
      path: 'projects/01-color-flipper/index.html',
      status: 'completed',
      icon: '🎨',
      highlights: ['360° Angle Dial', 'WCAG Luminance Engine', 'Palette Harmonies', 'Sound Synthesis'],
    },
    {
      id: '02',
      slug: '02-calculator',
      title: 'CalcPro Studio',
      subtitle: 'Modern Engineering Calculator',
      description:
        'A sleek glassmorphic calculator with safe evaluation, calculation history tape, memory registers, scientific operations, and full keyboard navigation.',
      category: 'State & Logic',
      tags: ['Safe Math', 'State Machine', 'Keyboard Nav', 'LocalStorage', 'Audio API'],
      difficulty: 'Intermediate',
      path: 'projects/02-calculator/index.html',
      status: 'completed',
      icon: '🔢',
      highlights: ['Safe Math Engine', 'History Tape', 'Memory Functions', 'Numpad Support'],
    },
    {
      id: '03',
      slug: '03-weather-app',
      title: 'SkyPulse Weather',
      subtitle: 'Dynamic Meteorological Studio',
      description:
        'Meteorological forecast dashboard with dual live OpenWeatherMap API & smart fallback engine, 5-day forecast, unit converter, and geolocation.',
      category: 'Utilities & Tools',
      tags: ['Fetch API', 'Async/Await', 'Geolocation', 'Dual Engine', 'Weather Metrics'],
      difficulty: 'Intermediate',
      path: 'projects/03-weather-app/index.html',
      status: 'completed',
      icon: '🌤️',
      highlights: ['Dual API & Mock Engine', '5-Day Forecast', '°C / °F Switcher', 'Geolocation'],
    },
    {
      id: '04',
      slug: '04-testimonial-slider',
      title: 'Aura Testimonials',
      subtitle: 'Interactive Review Carousel',
      description:
        'Responsive customer review carousel featuring auto-play with circular SVG countdown timer, touch swipe support, verified badges, and review submission.',
      category: 'UI Components',
      tags: ['Carousel Logic', 'SVG Animation', 'Touch Gestures', 'Modal Form', 'LocalStorage'],
      difficulty: 'Intermediate',
      path: 'projects/04-testimonial-slider/index.html',
      status: 'completed',
      icon: '💬',
      highlights: ['SVG Progress Ring', 'Touch Gestures', 'Random Review', 'Add Review Modal'],
    },
    {
      id: '05',
      slug: '05-circular-progress',
      title: 'PulseGauge Studio',
      subtitle: 'Circular Progress & Gauge Studio',
      description:
        'Interactive circular gauge studio featuring manual percentage slider, Pomodoro focus timer, simulated file transfer, and dynamic gradient palettes.',
      category: 'DOM & Visuals',
      tags: ['SVG Math', 'Timer Engine', 'Simulated Streams', 'Gradient Theming'],
      difficulty: 'Intermediate',
      path: 'projects/05-circular-progress/index.html',
      status: 'completed',
      icon: '⏱️',
      highlights: ['Interactive Slider', 'Pomodoro Timer', 'Upload Simulator', 'Gradient Palettes'],
    },
    {
      id: '06',
      slug: '06-image-gallery',
      title: 'Lumina Gallery Pro',
      subtitle: 'Responsive Lightbox & Showcase',
      description:
        'Modern responsive image gallery featuring category filter tabs, interactive fullscreen lightbox modal, keyboard navigation, and thumbnail filmstrip.',
      category: 'Media & Canvas',
      tags: ['Masonry Grid', 'Lightbox Modal', 'Keyboard Nav', 'Filmstrip Preview'],
      difficulty: 'Beginner / Intermediate',
      path: 'projects/06-image-gallery/index.html',
      status: 'completed',
      icon: '🖼️',
      highlights: ['Fullscreen Lightbox', 'Filmstrip Strip', 'Category Filters', 'Image Download'],
    },
    {
      id: '07',
      slug: '07-auth-portal',
      title: 'AuthCraft Portal',
      subtitle: 'Modern Authentication Suite',
      description:
        'Authentication portal featuring 3-way sliding tab forms, real-time validation, password strength entropy analysis, visibility eye toggle, and mock session.',
      category: 'UI Components',
      tags: ['Form Validation', 'Entropy Analyzer', 'LocalStorage Auth', 'Sliding Tabs'],
      difficulty: 'Intermediate',
      path: 'projects/07-auth-portal/index.html',
      status: 'completed',
      icon: '🔐',
      highlights: ['3-in-1 Sliding Tabs', 'Password Strength Meter', 'Eye Toggle', 'Session State'],
    },
    {
      id: '08',
      slug: '08-social-network',
      title: 'SocialSphere Feed',
      subtitle: 'Interactive Social Feed Studio',
      description:
        'Social media feed dashboard with interactive post creation, photo attachment, live like counters, real-time comments drawer, and ephemeral story modal.',
      category: 'UI Components',
      tags: ['Feed Architecture', 'DOM Event Delegation', 'Live Comments', 'Story Modal'],
      difficulty: 'Intermediate',
      path: 'projects/08-social-network/index.html',
      status: 'completed',
      icon: '🌐',
      highlights: ['Post Creation', 'Live Comments Drawer', 'Story Viewer Modal', 'Reaction Counters'],
    },
    {
      id: '09',
      slug: '09-travel-explorer',
      title: 'Wanderlust Explorer',
      subtitle: 'Curated Travel Experiences',
      description:
        'Immersive travel discovery portal with interactive destination filtering, seasonal expeditions, tour booking modal, and responsive mobile navigation.',
      category: 'DOM & Visuals',
      tags: ['Responsive Layout', 'Filter Tabs', 'Booking Modal', 'Sticky Header'],
      difficulty: 'Intermediate',
      path: 'projects/09-travel-explorer/index.html',
      status: 'completed',
      icon: '🗺️',
      highlights: ['Destination Filtering', 'Tour Booking Modal', 'Seasonal Escapes', 'Mobile Drawer'],
    },
    {
      id: '10',
      slug: '10-grocery-bud',
      title: 'TaskFlow / Grocery Bud',
      subtitle: 'Persistent CRUD Organizer',
      description:
        'Full-featured CRUD application with item editing, strike-through, clear-all with confirmation, and LocalStorage sync.',
      category: 'Utilities & Tools',
      tags: ['CRUD', 'LocalStorage', 'DOM Manipulation'],
      difficulty: 'Intermediate',
      path: 'projects/template/index.html',
      status: 'roadmap',
      icon: '📝',
      highlights: ['Full CRUD Operations', 'LocalStorage Persistence', 'Alert Badges'],
    },
  ];

  // --- Hub State ---
  let allProjects = [];
  let currentFilter = 'all';
  let searchQuery = '';

  // --- DOM References ---
  const htmlDoc = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');

  const statTotalProjects = document.getElementById('statTotalProjects');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryPills = document.getElementById('categoryPills');
  const projectsGrid = document.getElementById('projectsGrid');
  const resultsCount = document.getElementById('resultsCount');
  const noResultsBlock = document.getElementById('noResultsBlock');
  const btnResetFilters = document.getElementById('btnResetFilters');

  // Modals
  const previewModal = document.getElementById('previewModal');
  const previewIframe = document.getElementById('previewIframe');
  const previewTitle = document.getElementById('previewTitle');
  const previewBadge = document.getElementById('previewBadge');
  const btnClosePreview = document.getElementById('btnClosePreview');
  const btnReloadPreview = document.getElementById('btnReloadPreview');
  const btnExternalLaunch = document.getElementById('btnExternalLaunch');
  const viewportButtons = document.querySelectorAll('.vp-btn');

  const guideBtn = document.getElementById('guideBtn');
  const guideModal = document.getElementById('guideModal');
  const btnCloseGuide = document.getElementById('btnCloseGuide');
  const btnCloseGuide2 = document.getElementById('btnCloseGuide2');

  // --- Theme Management ---
  function initTheme() {
    const saved = localStorage.getItem('hub_theme') || 'dark';
    setTheme(saved);
  }

  function setTheme(theme) {
    htmlDoc.setAttribute('data-theme', theme);
    localStorage.setItem('hub_theme', theme);
    const isDark = theme === 'dark';
    themeIconSun.classList.toggle('hidden', isDark);
    themeIconMoon.classList.toggle('hidden', !isDark);
  }

  function toggleTheme() {
    const current = htmlDoc.getAttribute('data-theme') || 'dark';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  // --- Fetch / Load Projects ---
  async function loadProjects() {
    try {
      const res = await fetch('projects.json');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      allProjects = await res.json();
    } catch (e) {
      console.info('Using embedded fallback projects registry:', e.message);
      allProjects = FALLBACK_PROJECTS;
    }
    statTotalProjects.textContent = allProjects.length;
    renderProjects();
  }

  // --- Filtering & Rendering ---
  function getFilteredProjects() {
    return allProjects.filter((proj) => {
      // Category filter
      let matchesFilter = true;
      if (currentFilter === 'active') {
        matchesFilter = proj.status === 'completed';
      } else if (currentFilter !== 'all') {
        matchesFilter = proj.category.toLowerCase() === currentFilter.toLowerCase();
      }

      // Search filter
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = proj.title.toLowerCase().includes(q);
        const inSub = (proj.subtitle || '').toLowerCase().includes(q);
        const inDesc = proj.description.toLowerCase().includes(q);
        const inTags = proj.tags.some((t) => t.toLowerCase().includes(q));
        matchesSearch = inTitle || inSub || inDesc || inTags;
      }

      return matchesFilter && matchesSearch;
    });
  }

  function renderProjects() {
    const filtered = getFilteredProjects();
    projectsGrid.innerHTML = '';

    if (filtered.length === 0) {
      noResultsBlock.classList.remove('hidden');
      resultsCount.textContent = '0 projects found';
      return;
    }

    noResultsBlock.classList.add('hidden');
    resultsCount.textContent = `Showing ${filtered.length} of ${allProjects.length} projects`;

    filtered.forEach((proj) => {
      const card = document.createElement('article');
      card.className = `project-card ${proj.status === 'completed' ? 'featured' : ''}`;

      const isLive = proj.status === 'completed';
      const statusClass = isLive ? 'live' : 'roadmap';
      const statusLabel = isLive ? 'Live & Interactive' : 'Template Ready';

      card.innerHTML = `
        <div>
          <div class="card-top">
            <div class="card-icon-badge">
              <span class="project-icon">${proj.icon || '🚀'}</span>
              <span class="project-index">#${proj.id}</span>
            </div>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </div>

          <div class="card-content">
            <h2 class="project-card-title">${proj.title}</h2>
            <div class="project-card-subtitle">${proj.subtitle || proj.category}</div>
            <p class="project-card-desc">${proj.description}</p>
            
            <div class="tags-cloud">
              ${proj.tags.map((t) => `<span class="tag-chip">${t}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="card-actions">
          <a href="${proj.path}" class="btn-launch" title="Open ${proj.title} directly">
            <span>Launch App</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
          <button class="btn-preview" data-slug="${proj.slug}" title="Quick preview inside hub">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Preview</span>
          </button>
        </div>
      `;

      // Preview Button listener
      card.querySelector('.btn-preview').addEventListener('click', () => {
        openPreview(proj);
      });

      projectsGrid.appendChild(card);
    });
  }

  // --- Live Preview Modal Logic ---
  let currentPreviewUrl = '';

  function openPreview(project) {
    currentPreviewUrl = project.path;
    previewTitle.textContent = project.title;
    previewBadge.textContent = `#${project.id}`;
    previewIframe.src = project.path;
    btnExternalLaunch.href = project.path;

    // Reset viewport to desktop
    previewIframe.style.width = '100%';
    viewportButtons.forEach((b) => b.classList.toggle('active', b.dataset.width === '100%'));

    previewModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closePreview() {
    previewModal.classList.add('hidden');
    previewIframe.src = 'about:blank';
    document.body.style.overflow = '';
  }

  // --- Event Listeners ---
  // Theme toggle
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Search input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.classList.toggle('hidden', !searchQuery);
    renderProjects();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    searchInput.focus();
    renderProjects();
  });

  // Category filter pills
  categoryPills.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    document.querySelectorAll('.pill-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderProjects();
  });

  btnResetFilters.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    currentFilter = 'all';
    document.querySelectorAll('.pill-btn').forEach((b) => b.classList.toggle('active', b.dataset.filter === 'all'));
    renderProjects();
  });

  // Viewport switchers in modal
  viewportButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      viewportButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      previewIframe.style.width = btn.dataset.width;
    });
  });

  btnReloadPreview.addEventListener('click', () => {
    if (currentPreviewUrl) {
      previewIframe.src = currentPreviewUrl;
    }
  });

  btnClosePreview.addEventListener('click', closePreview);
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) closePreview();
  });

  // Guide modal
  guideBtn.addEventListener('click', () => guideModal.classList.remove('hidden'));
  btnCloseGuide.addEventListener('click', () => guideModal.classList.add('hidden'));
  btnCloseGuide2.addEventListener('click', () => guideModal.classList.add('hidden'));
  guideModal.addEventListener('click', (e) => {
    if (e.target === guideModal) guideModal.classList.add('hidden');
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Ctrl + K or Cmd + K focuses search
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    } else if (e.key === 'Escape') {
      closePreview();
      guideModal.classList.add('hidden');
    } else if (e.key.toLowerCase() === 't' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      toggleTheme();
    }
  });

  // --- Init ---
  initTheme();
  loadProjects();
})();
