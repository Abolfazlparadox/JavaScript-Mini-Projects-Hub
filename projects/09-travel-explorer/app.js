/**
 * Wanderlust Travel Explorer | Navigation, Filtering & Reservation Engine
 */

(function () {
  'use strict';

  // DOM
  const travelHeader = document.getElementById('travelHeader');
  const btnMobileMenu = document.getElementById('btnMobileMenu');
  const mobileDrawer = document.getElementById('mobileDrawer');

  const destFilters = document.getElementById('destFilters');
  const destCards = document.querySelectorAll('.dest-card');

  const bookingModal = document.getElementById('bookingModal');
  const btnCloseBooking = document.getElementById('btnCloseBooking');
  const bookingForm = document.getElementById('bookingForm');
  const tourSelect = document.getElementById('tourSelect');

  const btnOpenBookingNav = document.getElementById('btnOpenBookingNav');
  const btnOpenBookingDrawer = document.getElementById('btnOpenBookingDrawer');
  const btnHeroBooking = document.getElementById('btnHeroBooking');
  const toastContainer = document.getElementById('toastContainer');

  // Sticky header scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      travelHeader.style.background = 'rgba(11, 15, 23, 0.96)';
    } else {
      travelHeader.style.background = 'rgba(11, 15, 23, 0.85)';
    }
  });

  // Mobile menu
  btnMobileMenu.addEventListener('click', () => {
    mobileDrawer.classList.toggle('hidden');
  });

  document.querySelectorAll('.drawer-link').forEach((l) => {
    l.addEventListener('click', () => mobileDrawer.classList.add('hidden'));
  });

  // Destination Filtering
  destFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('.dest-filter-btn');
    if (!btn) return;
    document.querySelectorAll('.dest-filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    destCards.forEach((card) => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.style.display = match ? 'flex' : 'none';
    });
  });

  // Booking Modal Operations
  function openBookingModal(preselectedTour = null) {
    if (preselectedTour) {
      tourSelect.value = preselectedTour;
    }
    bookingModal.classList.remove('hidden');
    mobileDrawer.classList.add('hidden');
  }

  function closeBookingModal() {
    bookingModal.classList.add('hidden');
  }

  btnOpenBookingNav.addEventListener('click', () => openBookingModal());
  btnOpenBookingDrawer.addEventListener('click', () => openBookingModal());
  btnHeroBooking.addEventListener('click', () => openBookingModal());
  btnCloseBooking.addEventListener('click', closeBookingModal);

  bookingModal.addEventListener('click', (e) => {
    if (e.target === bookingModal) closeBookingModal();
  });

  document.querySelectorAll('.btn-book-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      openBookingModal(btn.dataset.tour);
    });
  });

  // Booking Form Submit
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const tour = tourSelect.value;
    const name = document.getElementById('leadName').value.trim();
    const date = document.getElementById('bookDate').value;
    const guests = document.getElementById('guestCount').value;

    closeBookingModal();
    bookingForm.reset();
    showToast(`🎉 Reservation confirmed for ${name}! Expedition: ${tour} (${guests} travelers on ${date}).`);
  });

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  // Pre-fill minimum date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const bookDateInput = document.getElementById('bookDate');
  if (bookDateInput) {
    bookDateInput.min = tomorrow.toISOString().split('T')[0];
    bookDateInput.value = tomorrow.toISOString().split('T')[0];
  }
})();
