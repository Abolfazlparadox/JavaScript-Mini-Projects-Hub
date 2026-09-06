/**
 * Paradox • Stellar Executive Portfolio Controller
 * Abolfazl Mohammadshahi • 2026
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Stellar Starfield Canvas Animation
    const canvas = document.getElementById('stellar-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            initStars();
        });

        const stars = [];
        const STAR_COUNT = 45;

        function initStars() {
            stars.length = 0;
            for (let i = 0; i < STAR_COUNT; i++) {
                stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 1.5 + 0.5,
                    alpha: Math.random() * 0.7 + 0.2,
                    speedY: (Math.random() - 0.5) * 0.25,
                    speedX: (Math.random() - 0.5) * 0.25,
                    color: Math.random() > 0.4 ? '#00f2fe' : '#10b981'
                });
            }
        }

        initStars();

        let animationFrameId;
        function animate() {
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];
                s.x += s.speedX;
                s.y += s.speedY;

                if (s.x < 0) s.x = width;
                if (s.x > width) s.x = 0;
                if (s.y < 0) s.y = height;
                if (s.y > height) s.y = 0;

                ctx.save();
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.fillStyle = s.color;
                ctx.globalAlpha = s.alpha;
                ctx.shadowBlur = 8;
                ctx.shadowColor = s.color;
                ctx.fill();
                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(animate);
        }

        animate();
    }

    // 2. Mobile Navigation Toggle
    const mobileBtn = document.getElementById('mobile-toggle');
    const navLinks = document.getElementById('nav-links');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            const isVisible = navLinks.style.display === 'flex';
            if (isVisible) {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.right = '0';
                navLinks.style.flexDirection = 'column';
                navLinks.style.background = '#070b14';
                navLinks.style.padding = '1.5rem 5%';
                navLinks.style.gap = '1rem';
                navLinks.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
            }
        });

        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    navLinks.style.display = 'none';
                }
            });
        });
    }

    // 3. Contact Form Submission Handling
    const form = document.getElementById('stellar-contact-form');
    const feedback = document.getElementById('stellar-msg');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerHTML : '';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Encrypting & Dispatching...";
            }

            const sender = document.getElementById('st-name')?.value.trim() || 'Partner';

            setTimeout(() => {
                if (feedback) {
                    feedback.className = 'form-feedback success';
                    feedback.innerHTML = `<i class='bx bx-check-shield'></i> Dispatch received from ${sender}. Paradox will analyze your requirements and connect via email.`;
                }

                form.reset();

                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }

                setTimeout(() => {
                    if (feedback) {
                        feedback.innerHTML = '';
                        feedback.className = 'form-feedback';
                    }
                }, 6000);
            }, 800);
        });
    }
});
