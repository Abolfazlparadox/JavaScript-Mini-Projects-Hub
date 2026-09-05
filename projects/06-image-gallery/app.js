/**
 * Lumina Gallery Pro | Interactive Lightbox & Gallery Engine
 */

(function () {
  'use strict';

  const GALLERY_DATA = [
    { id: 1, title: 'Nordic Horizon', category: 'nature', src: 'assets/images/1.jpg' },
    { id: 2, title: 'Urban Geometry', category: 'urban', src: 'assets/images/2.jpg' },
    { id: 3, title: 'Minimalist Architecture', category: 'minimal', src: 'assets/images/3.png' },
    { id: 4, title: 'Sunset Silhouette', category: 'nature', src: 'assets/images/4.jpg' },
    { id: 5, title: 'Metropolitan Echo', category: 'urban', src: 'assets/images/5.jpg' },
    { id: 6, title: 'Desert Solitude', category: 'minimal', src: 'assets/images/6.jpg' },
  ];

  let currentCategory = 'all';
  let currentIndex = 0;
  let activeList = [...GALLERY_DATA];

  // DOM
  const photosGrid = document.getElementById('photosGrid');
  const filterTabs = document.getElementById('filterTabs');

  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxActiveImg = document.getElementById('lightboxActiveImg');
  const lightboxFilmstrip = document.getElementById('lightboxFilmstrip');

  const btnLightboxPrev = document.getElementById('btnLightboxPrev');
  const btnLightboxNext = document.getElementById('btnLightboxNext');
  const btnCloseLightbox = document.getElementById('btnCloseLightbox');
  const btnDownload = document.getElementById('btnDownload');

  // --- Render Photos Grid ---
  function renderGrid() {
    photosGrid.innerHTML = '';
    activeList = GALLERY_DATA.filter((item) => currentCategory === 'all' || item.category === currentCategory);

    activeList.forEach((photo, idx) => {
      const card = document.createElement('article');
      card.className = 'photo-card';
      card.innerHTML = `
        <img src="${photo.src}" alt="${photo.title}" class="card-img" loading="lazy" />
        <div class="photo-overlay">
          <span class="photo-category">${photo.category}</span>
          <h3 class="photo-title">${photo.title}</h3>
        </div>
      `;

      card.addEventListener('click', () => openLightbox(idx));
      photosGrid.appendChild(card);
    });
  }

  // --- Lightbox Operations ---
  function openLightbox(index) {
    currentIndex = index;
    updateLightboxContent();
    renderFilmstrip();
    lightboxModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightboxModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function updateLightboxContent() {
    const item = activeList[currentIndex];
    if (!item) return;

    lightboxActiveImg.style.opacity = '0';
    setTimeout(() => {
      lightboxActiveImg.src = item.src;
      lightboxActiveImg.alt = item.title;
      lightboxCounter.textContent = `${currentIndex + 1} of ${activeList.length}`;
      lightboxTitle.textContent = item.title;

      lightboxActiveImg.style.transition = 'opacity 0.25s ease';
      lightboxActiveImg.style.opacity = '1';
    }, 100);

    updateFilmstripActive();
  }

  function nextPhoto() {
    currentIndex = (currentIndex + 1) % activeList.length;
    updateLightboxContent();
  }

  function prevPhoto() {
    currentIndex = (currentIndex - 1 + activeList.length) % activeList.length;
    updateLightboxContent();
  }

  function renderFilmstrip() {
    lightboxFilmstrip.innerHTML = '';
    activeList.forEach((photo, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `filmstrip-thumb ${idx === currentIndex ? 'active' : ''}`;
      thumb.innerHTML = `<img src="${photo.src}" alt="${photo.title}" />`;
      thumb.addEventListener('click', () => {
        currentIndex = idx;
        updateLightboxContent();
      });
      lightboxFilmstrip.appendChild(thumb);
    });
  }

  function updateFilmstripActive() {
    document.querySelectorAll('.filmstrip-thumb').forEach((thumb, idx) => {
      thumb.classList.toggle('active', idx === currentIndex);
    });
  }

  // Download
  btnDownload.addEventListener('click', () => {
    const current = activeList[currentIndex];
    if (!current) return;
    const a = document.createElement('a');
    a.href = current.src;
    a.download = `${current.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    a.click();
  });

  // Event Listeners
  filterTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    document.querySelectorAll('#filterTabs .tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.filter;
    renderGrid();
  });

  btnLightboxNext.addEventListener('click', nextPhoto);
  btnLightboxPrev.addEventListener('click', prevPhoto);
  btnCloseLightbox.addEventListener('click', closeLightbox);

  lightboxModal.addEventListener('click', (e) => {
    if (e.target === lightboxModal) closeLightbox();
  });

  window.addEventListener('keydown', (e) => {
    if (lightboxModal.classList.contains('hidden')) return;
    if (e.key === 'ArrowRight') nextPhoto();
    if (e.key === 'ArrowLeft') prevPhoto();
    if (e.key === 'Escape') closeLightbox();
  });

  // Init
  renderGrid();
})();
