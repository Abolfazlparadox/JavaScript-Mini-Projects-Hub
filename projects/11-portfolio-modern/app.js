/**
 * Paradox • Minimalist Modern Dev Portfolio Controller
 * Abolfazl Mohammadshahi • 2026
 */

document.addEventListener('DOMContentLoaded', () => {
    // Theme Management
    const themeBtn = document.getElementById('theme-toggle-btn');
    const savedTheme = localStorage.getItem('paradox_theme') || 'dark';

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('paradox_theme', theme);
    }

    setTheme(savedTheme);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const current = document.body.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            setTheme(next);
        });
    }

    // Mobile Hamburger Menu
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');

    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });

        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
            });
        });
    }

    // Contact Form Submission
    const contactForm = document.getElementById('modern-contact-form');
    const formMsg = document.getElementById('form-msg');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtn = submitBtn ? submitBtn.innerHTML : '';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Submitting...";
            }

            const name = document.getElementById('c-name')?.value.trim() || 'Colleague';

            setTimeout(() => {
                if (formMsg) {
                    formMsg.className = 'feedback-msg success';
                    formMsg.innerHTML = `<i class='bx bx-check-double'></i> Thank you, ${name}! Your inquiry has been sent to Abolfazl (Paradox). Expect a prompt technical reply.`;
                }

                contactForm.reset();

                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtn;
                }

                setTimeout(() => {
                    if (formMsg) {
                        formMsg.innerHTML = '';
                        formMsg.className = 'feedback-msg';
                    }
                }, 6000);
            }, 800);
        });
    }
});
