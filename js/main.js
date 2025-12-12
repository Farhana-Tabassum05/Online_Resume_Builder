text = document.getElementById("title");
subtext = document.getElementById("subtitle");
getStartedBtn = document.getElementById("getstarted");
page1 = document.querySelector(".page1");

// Get Started button click handler
getStartedBtn.addEventListener("click", function() {
    window.location.href = "sign in & sign up/Sign in.html#sign-in-container";
});

window.addEventListener("scroll", function() {
    let value = window.scrollY;
    let scale = 1 + value * 0.02;
    let opacity = Math.max(0, 1 - value * 0.001);
    let opacity1 = Math.max(0, 1 - value * 0.01);
    let page1Height = page1.offsetHeight;
    let buttonOpacity = Math.max(0, 1 - (value / (page1Height / 2)));
    let darknessFactor = Math.min(1, value / 900); // Reaches full black at 500px scroll
    
    text.style.transform = `scale(${scale})`;
    text.style.opacity = opacity;
    subtext.style.opacity = opacity1;
    getStartedBtn.style.opacity = buttonOpacity;
    page1.style.backgroundPositionY = `${value * 0.5}px`;
    
    // Gradually darken to black
    let r = Math.floor(255 * ( darknessFactor));
    let g = Math.floor(255 * ( darknessFactor));
    let b = Math.floor(255 * ( darknessFactor));
    page1.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
});

// --- Infinite carousel setup for .features #boxes ---
document.addEventListener('DOMContentLoaded', function(){
    const container = document.querySelector('.features #boxes');
    if (!container) return;

    // Create inner track and move all existing children into it
    const inner = document.createElement('div');
    inner.className = 'boxes-inner';
    while (container.firstChild) {
        inner.appendChild(container.firstChild);
    }

    // Duplicate the content to make the scroll seamless
    const clone = inner.cloneNode(true);
    inner.appendChild(clone);

    container.appendChild(inner);

    // Continuous smooth scroll without jumping
    let offset = 0;
    const speed = 0.7; // pixels per frame (~60fps = 120px/s at speed 2)
    const halfWidth = inner.scrollWidth / 2;
    let isAnimating = true;

    function animate() {
        if (isAnimating) {
            offset += speed;
            // Reset seamlessly when reaching halfway (where the duplicate starts)
            if (offset >= halfWidth) {
                offset = 0;
            }
            inner.style.transform = `translateX(-${offset}px)`;
        }
        requestAnimationFrame(animate);
    }

    // Pause on hover
    container.addEventListener('mouseenter', () => {
        isAnimating = false;
    });
    container.addEventListener('mouseleave', () => {
        isAnimating = true;
    });

    animate();
});

window.addEventListener("scroll", () => {
    document.querySelector(".navi")
        .classList.toggle("scrolled", window.scrollY > 10);
});

const revealItems = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
    });
}, { threshold: 0.5 });

revealItems.forEach(item => observer.observe(item));


