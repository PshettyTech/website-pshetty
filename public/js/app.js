/* ═══════════════════════════════════════════════════════════
   APP.JS — Main Orchestrator (Premium Scroll Animations)
   GSAP scroll animations + navbar + hero entrance + parallax
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── DOM ───
    const loader = document.getElementById('loader');
    const loaderBar = document.getElementById('loader-progress-bar');
    const loaderPercent = document.getElementById('loader-percent');
    const navbar = document.getElementById('navbar');
    const navHamburger = document.getElementById('nav-hamburger');
    const navLinks = document.getElementById('nav-links');

    // ─── NAVBAR MOBILE MENU ───
    if (navHamburger && navLinks) {
        navHamburger.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            navHamburger.classList.toggle('active');
        });
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                navHamburger.classList.remove('active');
            });
        });
    }

    // ─── SMOOTH SCROLL FOR ANCHOR LINKS ───
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ─── LOADER (2-3 seconds) ───
    let progress = 0;
    const loadInterval = setInterval(() => {
        progress += Math.random() * 2 + 1;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadInterval);
            loaderBar.style.width = '100%';
            loaderPercent.textContent = '100';

            setTimeout(() => {
                loader.classList.add('hidden');
                navbar.classList.add('visible');
                animateHero();
                setupScrollAnimations();
                setupNavbarScroll();
            }, 300);
        } else {
            loaderBar.style.width = progress + '%';
            loaderPercent.textContent = Math.floor(progress);
        }
    }, 60);

    // ─── NAVBAR SCROLL BEHAVIOR ───
    function setupNavbarScroll() {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 60) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // ─── HERO ENTRANCE ANIMATION ───
    function animateHero() {
        const badge = document.querySelector('.hero__badge');
        const heading = document.querySelector('.hero__heading');
        const bottom = document.querySelector('.hero__bottom');
        const card = document.querySelector('.hero__card');

        gsap.set([badge, heading, bottom, card].filter(Boolean), { opacity: 0, y: 50 });

        const tl = gsap.timeline({ delay: 0.15 });
        if (badge) tl.to(badge, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
        if (heading) tl.to(heading, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');
        if (bottom) tl.to(bottom, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3');
        if (card) tl.to(card, { opacity: 1, y: 0, duration: 0.7, ease: 'back.out(1.4)' }, '-=0.4');
    }

    // ─── GSAP SCROLL ANIMATIONS ───
    function setupScrollAnimations() {
        gsap.registerPlugin(ScrollTrigger);

        // 1. Section reveal animations (data-anim)
        document.querySelectorAll('[data-anim]').forEach(el => {
            ScrollTrigger.create({
                trigger: el,
                start: 'top 88%',
                once: true,
                onEnter: () => el.classList.add('in-view'),
            });
        });

        // 2. Staggered children (data-anim-stagger)
        document.querySelectorAll('[data-anim-stagger]').forEach(el => {
            ScrollTrigger.create({
                trigger: el,
                start: 'top 85%',
                once: true,
                onEnter: () => el.classList.add('in-view'),
            });
        });

        // 3. Service cards — staggered scroll reveal
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach((card, i) => {
            ScrollTrigger.create({
                trigger: card,
                start: 'top 90%',
                once: true,
                onEnter: () => {
                    setTimeout(() => card.classList.add('in-view'), i * 80);
                },
            });
        });

        // 4. Project cards — slide-up reveal
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach((card, i) => {
            ScrollTrigger.create({
                trigger: card,
                start: 'top 88%',
                once: true,
                onEnter: () => {
                    setTimeout(() => card.classList.add('in-view'), i * 120);
                },
            });
        });

        // 5. Hero parallax — subtle vertical shift only (no scale to keep HD clarity)
        const heroBg = document.querySelector('.hero__bg-img');
        if (heroBg) {
            gsap.to(heroBg, {
                scrollTrigger: {
                    trigger: '.hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 0.5,
                },
                y: 80,
            });
        }

        // 6. Stats counter animation
        document.querySelectorAll('.stat-number').forEach(el => {
            const text = el.textContent.trim();
            const match = text.match(/^(\d+)/);
            if (match) {
                const target = parseInt(match[1]);
                const suffix = text.replace(match[1], '');
                el.textContent = '0' + suffix;

                ScrollTrigger.create({
                    trigger: el,
                    start: 'top 90%',
                    once: true,
                    onEnter: () => {
                        gsap.to({ val: 0 }, {
                            val: target,
                            duration: 1.5,
                            ease: 'power2.out',
                            onUpdate: function () {
                                el.textContent = Math.round(this.targets()[0].val) + suffix;
                            }
                        });
                    },
                });
            }
        });

        // 7. Founder cards — staggered
        document.querySelectorAll('.founder-card').forEach((card, i) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    once: true,
                },
                y: 60,
                opacity: 0,
                duration: 0.7,
                delay: i * 0.15,
                ease: 'power3.out',
            });
        });

        // 8. Pricing cards — staggered
        document.querySelectorAll('.pricing-card').forEach((card, i) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 88%',
                    once: true,
                },
                y: 50,
                opacity: 0,
                duration: 0.6,
                delay: i * 0.1,
                ease: 'power3.out',
            });
        });

        // 9. CTA banner — scale up
        const ctaBanner = document.querySelector('.cta-banner');
        if (ctaBanner) {
            gsap.from(ctaBanner, {
                scrollTrigger: {
                    trigger: ctaBanner,
                    start: 'top 85%',
                    once: true,
                },
                scale: 0.95,
                opacity: 0,
                duration: 0.7,
                ease: 'power3.out',
            });
        }

        // 10. Section title highlights — slide in
        document.querySelectorAll('.section-title .highlight, .section-title .highlight--purple, .section-title .highlight--yellow').forEach(el => {
            gsap.from(el, {
                scrollTrigger: {
                    trigger: el,
                    start: 'top 90%',
                    once: true,
                },
                scaleX: 0,
                transformOrigin: 'left center',
                duration: 0.6,
                ease: 'power3.out',
            });
        });
    }
})();
