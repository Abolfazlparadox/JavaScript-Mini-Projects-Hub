/**
 * Aura Testimonials Slider | Core Carousel Logic
 */

(function () {
  'use strict';

  const DEFAULT_REVIEWS = [
    {
      name: 'Sophia Chen',
      role: 'Staff Product Designer at Vercel',
      image: 'assets/img/Yoo_In-Na-1982-p1.jpg',
      rating: 5,
      quote:
        'The architecture and component system built into this project are simply extraordinary. Clean, accessible, and blindingly fast. A true benchmark for modern frontend standards.',
    },
    {
      name: 'Marcus Vance',
      role: 'Frontend Architect at Linear',
      image: 'assets/img/2044001.jpg',
      rating: 5,
      quote:
        'Zero bloated frameworks, pure vanilla excellence. Working through this codebase felt like a breath of fresh air. The micro-animations and accessibility are top-notch.',
    },
    {
      name: 'Elena Rostova',
      role: 'Engineering Director at Stripe',
      image: 'assets/img/2146725.jpg',
      rating: 5,
      quote:
        'Every single line of JavaScript has a deliberate purpose. You rarely find open-source collections that maintain this level of precision, security, and aesthetic elegance.',
    },
    {
      name: 'David K. Miller',
      role: 'UI/UX Specialist at GitHub',
      image: 'assets/img/2537397.jpg',
      rating: 4,
      quote:
        'The responsive layouts adapt flawlessly across all viewports. The interactive demo features and keyboard navigation make the user experience remarkably fluid.',
    },
    {
      name: 'Liam Gallagher',
      role: 'Fullstack Developer at Supabase',
      image: 'assets/img/4278058.jpg',
      rating: 5,
      quote:
        'A masterclass in pure JavaScript DOM engineering. The state handling, offline fallbacks, and modular structure serve as an incredible reference.',
    },
  ];

  // --- State ---
  const savedCustomReviews = JSON.parse(localStorage.getItem('aura_custom_reviews') || '[]');
  const reviews = [...DEFAULT_REVIEWS, ...savedCustomReviews];

  let currentIndex = 0;
  let autoplayActive = true;
  let timerInterval = null;
  let progressTime = 0;
  const AUTOPLAY_DURATION = 5000; // 5 seconds

  // --- DOM Elements ---
  const reviewerImg = document.getElementById('reviewerImg');
  const reviewerName = document.getElementById('reviewerName');
  const reviewerRole = document.getElementById('reviewerRole');
  const ratingStars = document.getElementById('ratingStars');
  const reviewBody = document.getElementById('reviewBody');
  const sliderDots = document.getElementById('sliderDots');

  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnRandom = document.getElementById('btnRandom');

  const autoplayBtn = document.getElementById('autoplayBtn');
  const ringBar = document.getElementById('ringBar');
  const playIcon = document.getElementById('playIcon');

  const btnOpenReviewModal = document.getElementById('btnOpenReviewModal');
  const reviewModal = document.getElementById('reviewModal');
  const btnCloseReviewModal = document.getElementById('btnCloseReviewModal');
  const btnCancelModal = document.getElementById('btnCancelModal');
  const newReviewForm = document.getElementById('newReviewForm');
  const toastContainer = document.getElementById('toastContainer');

  const CIRCUMFERENCE = 2 * Math.PI * 15.5; // ~97.389

  // --- Render Current Review ---
  function showReview(index) {
    currentIndex = (index + reviews.length) % reviews.length;
    const item = reviews[currentIndex];

    // Subtle fade transition
    reviewBody.style.opacity = '0';
    reviewerName.style.opacity = '0';

    setTimeout(() => {
      reviewerImg.src = item.image || 'assets/img/Yoo_In-Na-1982-p1.jpg';
      reviewerName.textContent = item.name;
      reviewerRole.textContent = item.role;
      ratingStars.textContent = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating);
      reviewBody.textContent = `"${item.quote}"`;

      reviewBody.style.transition = 'opacity 0.25s ease';
      reviewerName.style.transition = 'opacity 0.25s ease';
      reviewBody.style.opacity = '1';
      reviewerName.style.opacity = '1';
    }, 150);

    updateDots();
    resetProgress();
  }

  function initDots() {
    sliderDots.innerHTML = '';
    reviews.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.className = `dot-btn ${idx === currentIndex ? 'active' : ''}`;
      dot.title = `Review #${idx + 1}`;
      dot.addEventListener('click', () => showReview(idx));
      sliderDots.appendChild(dot);
    });
  }

  function updateDots() {
    document.querySelectorAll('.dot-btn').forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
  }

  // --- Autoplay & Timer Progress Ring ---
  function startAutoplay() {
    if (timerInterval) clearInterval(timerInterval);
    progressTime = 0;
    timerInterval = setInterval(() => {
      if (!autoplayActive) return;
      progressTime += 50;
      const progressFraction = progressTime / AUTOPLAY_DURATION;
      const offset = CIRCUMFERENCE - progressFraction * CIRCUMFERENCE;
      ringBar.style.strokeDashoffset = offset;

      if (progressTime >= AUTOPLAY_DURATION) {
        showReview(currentIndex + 1);
      }
    }, 50);
  }

  function resetProgress() {
    progressTime = 0;
    ringBar.style.strokeDashoffset = CIRCUMFERENCE;
  }

  function toggleAutoplay() {
    autoplayActive = !autoplayActive;
    playIcon.textContent = autoplayActive ? '⏸' : '▶';
    showToast(autoplayActive ? 'Autoplay Resumed' : 'Autoplay Paused');
  }

  // --- Random Review ---
  function showRandomReview() {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * reviews.length);
    } while (newIndex === currentIndex && reviews.length > 1);
    showReview(newIndex);
  }

  // --- Touch Swipe Support ---
  let touchStartX = 0;
  let touchEndX = 0;

  const card = document.getElementById('testimonialCard');
  card.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  card.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 50) {
      showReview(currentIndex + 1); // Swipe left -> Next
    } else if (touchEndX - touchStartX > 50) {
      showReview(currentIndex - 1); // Swipe right -> Prev
    }
  });

  // Pause on hover
  card.addEventListener('mouseenter', () => (autoplayActive = false));
  card.addEventListener('mouseleave', () => {
    if (playIcon.textContent === '⏸') autoplayActive = true;
  });

  // --- Toast ---
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // --- Add Review Modal Form ---
  newReviewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('inputName').value.trim();
    const role = document.getElementById('inputRole').value.trim();
    const rating = parseInt(document.getElementById('inputRating').value, 10);
    const quote = document.getElementById('inputReview').value.trim();

    if (!name || !quote) return;

    const newRev = {
      name,
      role,
      image: 'assets/img/2044001.jpg',
      rating,
      quote,
    };

    reviews.push(newRev);
    savedCustomReviews.push(newRev);
    localStorage.setItem('aura_custom_reviews', JSON.stringify(savedCustomReviews));

    initDots();
    showReview(reviews.length - 1);
    reviewModal.classList.add('hidden');
    newReviewForm.reset();
    showToast('Your review has been submitted! 🎉');
  });

  // --- Event Listeners ---
  btnPrev.addEventListener('click', () => showReview(currentIndex - 1));
  btnNext.addEventListener('click', () => showReview(currentIndex + 1));
  btnRandom.addEventListener('click', showRandomReview);
  autoplayBtn.addEventListener('click', toggleAutoplay);

  btnOpenReviewModal.addEventListener('click', () => reviewModal.classList.remove('hidden'));
  btnCloseReviewModal.addEventListener('click', () => reviewModal.classList.add('hidden'));
  btnCancelModal.addEventListener('click', () => reviewModal.classList.add('hidden'));

  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'ArrowLeft') showReview(currentIndex - 1);
    if (e.key === 'ArrowRight') showReview(currentIndex + 1);
    if (e.code === 'Space') {
      e.preventDefault();
      showRandomReview();
    }
    if (e.key === 'Escape') reviewModal.classList.add('hidden');
  });

  // --- Init ---
  ringBar.style.strokeDasharray = CIRCUMFERENCE;
  initDots();
  showReview(0);
  startAutoplay();
})();
