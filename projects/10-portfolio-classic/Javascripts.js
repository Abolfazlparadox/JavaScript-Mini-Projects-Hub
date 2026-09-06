/**
 * Paradox • Classic Noir Portfolio Controller
 * Abolfazl Mohammadshahi • 2026
 */

// Tab Switching
function opentab(tabname) {
    const tablinks = document.querySelectorAll(".tab-links");
    const tabcontents = document.querySelectorAll(".tab-contents");

    tablinks.forEach(link => link.classList.remove("active-link"));
    tabcontents.forEach(content => content.classList.remove("active-tab"));

    const targetTab = document.getElementById(tabname);
    if (targetTab) {
        targetTab.classList.add("active-tab");
    }

    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add("active-link");
    }
}

// Mobile Menu Navigation
const sidemenu = document.getElementById("sidemenu");

function openmenu() {
    if (sidemenu) {
        sidemenu.classList.add("active");
    }
}

function closemenu() {
    if (sidemenu) {
        sidemenu.classList.remove("active");
    }
}

// Close menu when clicking nav links on mobile
document.querySelectorAll("#sidemenu a").forEach(link => {
    link.addEventListener("click", () => {
        closemenu();
    });
});

// Interactive Contact Form Handling
const contactForm = document.getElementById("contact-form");
const msgFeedback = document.getElementById("msg");

if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
        e.preventDefault();
        
        const nameInput = document.getElementById("contact-name");
        const emailInput = document.getElementById("contact-email");
        const subjectInput = document.getElementById("contact-subject");
        const messageInput = document.getElementById("contact-message");

        const submitBtn = contactForm.querySelector(".submit-btn");
        const originalBtnText = submitBtn ? submitBtn.innerHTML : "";

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Sending Message...";
        }

        // Simulate secure API delivery
        setTimeout(() => {
            if (msgFeedback) {
                msgFeedback.className = "form-feedback success";
                msgFeedback.innerHTML = `<i class='bx bx-check-circle'></i> Thank you, ${nameInput ? nameInput.value.trim() : 'Friend'}! Your message has been received. Paradox will connect with you promptly.`;
            }

            contactForm.reset();

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }

            setTimeout(() => {
                if (msgFeedback) {
                    msgFeedback.innerHTML = "";
                    msgFeedback.className = "form-feedback";
                }
            }, 6000);
        }, 900);
    });
}
