/* ═══════════════════════════════════════════════════════════
   APP.JS — Main Orchestrator
   OPTIMIZED: minimal per-frame work, efficient scroll handling
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── DOM ───
    const canvas = document.getElementById('webgl-canvas');
    const loader = document.getElementById('loader');
    const loaderBar = document.getElementById('loader-progress-bar');
    const loaderPercent = document.getElementById('loader-percent');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const navbar = document.getElementById('navbar');
    const canvasSection = document.getElementById('canvas-section');
    const scrollProgressBar = document.getElementById('scroll-progress');
    const currentFrameEl = document.getElementById('current-frame');

    const textBuild = document.getElementById('text-build');
    const textTrust = document.getElementById('text-trust');
    const textGrow = document.getElementById('text-grow');
    const textFinale = document.getElementById('text-finale');
    const finaleTagline = textFinale.querySelector('.finale-tagline');

    // ─── CONFIG ───
    const SCROLL_DISTANCE = 5500;
    const FRAME_COUNT = 90;

    // ─── STATE ───
    let scrollProgress = 0;
    let isLoaded = false;

    // ─── INIT ───
    function initialize() {
        SceneManager.init(canvas, onLoadProgress, onLoadComplete);
    }

    function onLoadProgress(percent) {
        const p = Math.floor(percent);
        loaderBar.style.width = p + '%';
        loaderPercent.textContent = p;
    }

    function onLoadComplete() {
        isLoaded = true;

        ParticleSystem.init(SceneManager.getScene());
        PostProcessing.init(canvas, SceneManager.getScene());

        setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => {
                scrollIndicator.classList.add('visible');
                navbar.classList.add('visible');
            }, 500);
            setupScrollTrigger();
            requestAnimationFrame(renderLoop);
        }, 400);
    }

    // ─── GSAP SCROLL ───
    function setupScrollTrigger() {
        gsap.registerPlugin(ScrollTrigger);

        // Main pinned section with scroll scrub
        gsap.timeline({
            scrollTrigger: {
                trigger: canvasSection,
                start: 'top top',
                end: '+=' + SCROLL_DISTANCE,
                pin: true,
                scrub: 0.3,        // lower = more responsive
                anticipatePin: 1,
                onUpdate: function (self) {
                    scrollProgress = self.progress;
                    onScroll(self.progress);
                },
            },
        });

        // ── BUILD text (progress 0.10 – 0.28) ──
        const tlBuild = gsap.timeline({
            scrollTrigger: {
                trigger: canvasSection,
                start: 'top top',
                end: '+=' + SCROLL_DISTANCE,
                scrub: 0.3,
            },
        });
        tlBuild.fromTo(textBuild,
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 0.06, ease: 'power2.out' }, 0.10
        );
        tlBuild.to(textBuild, { opacity: 1, duration: 0.10 }, 0.16);
        tlBuild.to(textBuild, { opacity: 0, y: -30, duration: 0.04, ease: 'power2.in' }, 0.26);

        // ── TRUST text (progress 0.38 – 0.56) ──
        const tlTrust = gsap.timeline({
            scrollTrigger: {
                trigger: canvasSection,
                start: 'top top',
                end: '+=' + SCROLL_DISTANCE,
                scrub: 0.3,
            },
        });
        tlTrust.fromTo(textTrust,
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 0.06, ease: 'power2.out' }, 0.38
        );
        tlTrust.to(textTrust, { opacity: 1, duration: 0.10 }, 0.44);
        tlTrust.to(textTrust, { opacity: 0, y: -30, duration: 0.04, ease: 'power2.in' }, 0.56);

        // ── GROW text (progress 0.62 – 0.80) ──
        const tlGrow = gsap.timeline({
            scrollTrigger: {
                trigger: canvasSection,
                start: 'top top',
                end: '+=' + SCROLL_DISTANCE,
                scrub: 0.3,
            },
        });
        tlGrow.fromTo(textGrow,
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 0.06, ease: 'power2.out' }, 0.62
        );
        tlGrow.to(textGrow, { opacity: 1, duration: 0.10 }, 0.68);
        tlGrow.to(textGrow, { opacity: 0, y: -30, duration: 0.04, ease: 'power2.in' }, 0.80);

        // ── FINALE tagline (progress 0.88 – 1.0) ──
        const tlFinale = gsap.timeline({
            scrollTrigger: {
                trigger: canvasSection,
                start: 'top top',
                end: '+=' + SCROLL_DISTANCE,
                scrub: 0.3,
            },
        });
        tlFinale.fromTo(textFinale,
            { opacity: 0 },
            { opacity: 1, duration: 0.04 }, 0.88
        );
        tlFinale.fromTo(finaleTagline,
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 0.06, ease: 'power2.out' }, 0.90
        );

        // ── Scroll indicator fade ──
        gsap.to(scrollIndicator, {
            scrollTrigger: {
                trigger: canvasSection,
                start: 'top top',
                end: '+=150',
                scrub: true,
            },
            opacity: 0,
        });
    }

    // ─── SCROLL HANDLER ───
    function onScroll(progress) {
        // Frame index
        const frameIdx = progress * (FRAME_COUNT - 1);
        SceneManager.setFrame(frameIdx);

        // Frame counter display
        currentFrameEl.textContent = String(Math.round(frameIdx) + 1).padStart(3, '0');

        // Progress bar
        scrollProgressBar.style.width = (progress * 100) + '%';

        // Camera depth path
        SceneManager.setCameraZ(cameraPath(progress));

        // Subtle rotation parallax
        const rx = Math.sin(progress * Math.PI * 2) * 0.006;
        const ry = Math.cos(progress * Math.PI * 1.5) * 0.004;
        SceneManager.setCameraRotation(rx, ry);

        // Post-processing
        PostProcessing.update(progress);
    }

    function cameraPath(p) {
        // smooth cinematic zoom curve
        if (p < 0.3)  return 3.0 - (p / 0.3) * 0.5;           // 3.0 → 2.5
        if (p < 0.5)  return 2.5 - ((p - 0.3) / 0.2) * 0.2;   // 2.5 → 2.3
        if (p < 0.8)  return 2.3 + ((p - 0.5) / 0.3) * 0.4;   // 2.3 → 2.7
        return 2.7 + ((p - 0.8) / 0.2) * 0.1;                  // 2.7 → 2.8
    }

    // ─── RENDER LOOP ───
    function renderLoop(ts) {
        if (!isLoaded) return;
        ParticleSystem.update(ts, scrollProgress);
        SceneManager.render();
        requestAnimationFrame(renderLoop);
    }

    // ─── START ───
    initialize();
})();
