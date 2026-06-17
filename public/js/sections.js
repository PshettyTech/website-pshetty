/* ═══════════════════════════════════════════════════════════
   SECTIONS.JS — Dynamic Content Loading & Section Rendering
   Bright & Colorful card layouts with tag pills + checklists
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    const API = '';

    // ─── Tag color rotation for service cards ───
    const TAG_COLORS = ['orange', 'purple', 'yellow', 'blue', 'orange', 'purple'];
    const CARD_STYLES = [
        '', '', 'service-card--purple', '', '', ''
    ];

    // ─── SERVICES ───
    async function loadServices() {
        const grid = document.getElementById('services-grid');
        if (!grid) return;

        try {
            const res = await fetch(`${API}/api/services`);
            const services = await res.json();
            renderServices(services, 'all');

            // Tab filtering
            document.querySelectorAll('.service-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.service-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    const cat = tab.dataset.category;
                    renderServices(services, cat);
                });
            });
        } catch (err) {
            grid.innerHTML = renderFallbackServices();
        }
    }

    function renderServices(services, category) {
        const grid = document.getElementById('services-grid');
        const filtered = category === 'all' ? services : services.filter(s => s.category === category);

        grid.innerHTML = filtered.map((s, i) => {
            const features = typeof s.features === 'string' ? JSON.parse(s.features) : (s.features || []);
            const tagColor = TAG_COLORS[i % TAG_COLORS.length];
            const cardStyle = CARD_STYLES[i % CARD_STYLES.length];
            const isPurple = cardStyle === 'service-card--purple';
            const tagClass = isPurple ? 'service-card__tag--purple' : `service-card__tag--${tagColor}`;

            // Shorten category to a tag label
            const tagLabel = (s.category || 'TECH').replace(' Development', '').replace(' Solutions', '').toUpperCase();

            return `
                <div class="service-card ${cardStyle}" style="animation-delay: ${i * 60}ms">
                    <div class="service-card__tag ${tagClass}">${tagLabel}</div>
                    <h3 class="service-card__title">${s.title}</h3>
                    <p class="service-card__desc">${s.description}</p>
                    <div class="service-card__pricing">☆ CUSTOM PRICING</div>
                    <ul class="service-card__features">
                        ${features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <a href="#quote" class="service-card__cta">CONTACT US →</a>
                </div>`;
        }).join('');
    }

    function renderFallbackServices() {
        const fallback = [
            { category: 'Web Development', title: 'Landing Pages', description: 'High-converting single-page websites that capture leads and drive action.', features: ['Responsive Design', 'SEO Optimized', 'Contact Forms', 'Fast Loading'] },
            { category: 'Web Development', title: 'Business Websites', description: 'Professional multi-page websites for growing businesses.', features: ['Multi-page Layout', 'CMS Integration', 'Blog System', 'Analytics'] },
            { category: 'Web Development', title: 'E-commerce Websites', description: 'Full-featured online stores with payment integration.', features: ['Product Catalog', 'Payment Gateway', 'Admin Dashboard', 'Inventory Management'] },
            { category: 'Mobile App Development', title: 'Android & iOS Apps', description: 'Native and cross-platform mobile apps for your business.', features: ['Material Design', 'Push Notifications', 'Store Launch', 'Analytics'] },
            { category: 'Software Development', title: 'Billing Software', description: 'GST-compliant billing solutions for Indian businesses.', features: ['GST Compliance', 'Invoice Generation', 'Reports', 'Multi-user'] },
            { category: 'AI Solutions', title: 'AI Chatbots', description: 'Intelligent conversational bots that engage your customers.', features: ['NLP Integration', 'Custom Training', 'Analytics', '24/7 Support'] },
        ];
        return fallback.map((s, i) => {
            const tagColor = TAG_COLORS[i % TAG_COLORS.length];
            const cardStyle = CARD_STYLES[i % CARD_STYLES.length];
            const isPurple = cardStyle === 'service-card--purple';
            const tagClass = isPurple ? 'service-card__tag--purple' : `service-card__tag--${tagColor}`;
            const tagLabel = (s.category || 'TECH').replace(' Development', '').replace(' Solutions', '').toUpperCase();

            return `
                <div class="service-card ${cardStyle}" style="animation-delay: ${i * 60}ms">
                    <div class="service-card__tag ${tagClass}">${tagLabel}</div>
                    <h3 class="service-card__title">${s.title}</h3>
                    <p class="service-card__desc">${s.description}</p>
                    <div class="service-card__pricing">☆ CUSTOM PRICING</div>
                    <ul class="service-card__features">
                        ${s.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <a href="#quote" class="service-card__cta">CONTACT US →</a>
                </div>`;
        }).join('');
    }

    // ─── PROJECTS ───
    async function loadProjects() {
        const list = document.getElementById('projects-list');
        if (!list) return;

        try {
            const res = await fetch(`${API}/api/projects`);
            const projects = await res.json();
            renderProjects(projects);
        } catch (err) {
            list.innerHTML = renderFallbackProjects();
        }
    }

    function renderProjects(projects) {
        const list = document.getElementById('projects-list');
        const PROJECT_IMAGES = {
            'impana': '/assets/impana-gold.png',
            'pcc': '/assets/pcc.png',
        };

        function getProjectImage(title) {
            const t = (title || '').toLowerCase();
            if (t.includes('impana')) return PROJECT_IMAGES.impana;
            if (t.includes('pcc') || t.includes('padashetty coaching') || t.includes('coaching')) return PROJECT_IMAGES.pcc;
            return null;
        }

        list.innerHTML = projects.map((p, i) => {
            const features = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
            const liveLink = p.image_url ? `<a href="${p.image_url}" target="_blank" rel="noopener" class="btn btn--primary btn--sm project-link"><i class="fas fa-external-link-alt"></i> VIEW LIVE →</a>` : '';
            const img = getProjectImage(p.title);
            const imageHtml = img 
                ? `<img src="${img}" alt="${p.title}" class="project-card__img" />`
                : `<div class="project-card__image-placeholder"><i class="fas fa-folder"></i></div>`;
            return `
                <div class="project-card" data-anim="fade-up">
                    <div class="project-card__image" style="padding: 0;">
                        ${imageHtml}
                    </div>
                    <div class="project-card__content">
                        <div class="project-card__category">${p.category || 'Project'}</div>
                        <h3 class="project-card__title">${p.title}</h3>
                        <p class="project-card__client">Client: ${p.client_name}</p>
                        <p class="project-card__desc">${p.description}</p>
                        <div class="project-card__features">
                            ${features.map(f => `<span class="project-card__feature-tag">${f}</span>`).join('')}
                        </div>
                        ${liveLink}
                    </div>
                </div>`;
        }).join('');

        // Re-register scroll animations
        if (typeof ScrollTrigger !== 'undefined') {
            list.querySelectorAll('[data-anim]').forEach(el => {
                ScrollTrigger.create({
                    trigger: el,
                    start: 'top 85%',
                    once: true,
                    onEnter: () => el.classList.add('in-view'),
                });
            });
        }
    }

    function renderFallbackProjects() {
        const fallback = [
            { title: 'Impana Gold — Sri Devi Industries', client_name: 'Sri Devi Industries', description: 'Professional website and GST-compliant billing software for Impana Gold, a premium food manufacturing brand.', category: 'Web + Software', features: ['Professional Website', 'GST Billing', 'Invoice Generation', 'Inventory Management'], url: 'https://impana-gold-billing.onrender.com/', image: '/assets/impana-gold.png' },
            { title: 'PCC App — Padashetty Coaching Class', client_name: 'Padashetty Coaching Class', description: 'Full-stack Android app for student management, attendance tracking, and fee management. Live on Play Store.', category: 'Mobile App', features: ['Student Management', 'Attendance Tracking', 'Fee Management', 'Analytics'], url: 'https://play.google.com/store/apps/details?id=com.padashettycoaching.app', image: '/assets/pcc.png' },
            { title: 'Advanced Coaching Platform', client_name: 'Coaching Platform', description: 'Comprehensive educational platform with Android/iOS apps, student & teacher dashboards.', category: 'Full-Stack Platform', features: ['Android + iOS', 'Student Dashboard', 'Teacher Dashboard', 'Exam System', 'Analytics'], url: null, image: null },
        ];
        const icons = ['fa-utensils', 'fa-graduation-cap', 'fa-rocket'];
        return fallback.map((p, i) => {
            const imageHtml = p.image 
                ? `<img src="${p.image}" alt="${p.title}" class="project-card__img" />`
                : `<div class="project-card__image-placeholder"><i class="fas ${icons[i]}"></i></div>`;
            return `
            <div class="project-card" data-anim="fade-up">
                <div class="project-card__image" style="padding: 0;">
                    ${imageHtml}
                </div>
                <div class="project-card__content">
                    <div class="project-card__category">${p.category}</div>
                    <h3 class="project-card__title">${p.title}</h3>
                    <p class="project-card__client">Client: ${p.client_name}</p>
                    <p class="project-card__desc">${p.description}</p>
                    <div class="project-card__features">
                        ${p.features.map(f => `<span class="project-card__feature-tag">${f}</span>`).join('')}
                    </div>
                    ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener" class="btn btn--primary btn--sm project-link"><i class="fas fa-external-link-alt"></i> VIEW LIVE →</a>` : ''}
                </div>
            </div>`;
        }).join('');
    }

    // ─── PRICING ───
    let allPricing = [];

    async function loadPricing() {
        const grid = document.getElementById('pricing-grid');
        if (!grid) return;

        try {
            const res = await fetch(`${API}/api/pricing`);
            allPricing = await res.json();
            renderPricing('one-time');
        } catch (err) {
            allPricing = getFallbackPricing();
            renderPricing('one-time');
        }

        // Tab filtering
        document.querySelectorAll('.pricing-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.pricing-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderPricing(tab.dataset.plan);
            });
        });
    }

    function renderPricing(planType) {
        const grid = document.getElementById('pricing-grid');
        const filtered = allPricing.filter(p => p.plan_type === planType);
        const isSubscription = planType === 'subscription';

        grid.innerHTML = filtered.map(p => {
            const features = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
            const popular = p.is_popular ? ' pricing-card--popular' : '';
            const price = Number(p.price).toLocaleString('en-IN');

            return `
                <div class="pricing-card${popular}">
                    ${p.is_popular ? '<div class="pricing-badge">Most Popular</div>' : ''}
                    <h3 class="pricing-name">${p.name}</h3>
                    <p class="pricing-desc">${p.description}</p>
                    <div class="pricing-price">
                        <div class="pricing-amount">₹${price}${isSubscription ? '<span>/mo</span>' : ''}</div>
                        ${!isSubscription ? '<div class="pricing-period">one-time payment</div>' : '<div class="pricing-period">billed monthly</div>'}
                    </div>
                    <ul class="pricing-features">
                        ${features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <a href="#quote" class="btn btn--primary pricing-cta">GET STARTED →</a>
                </div>`;
        }).join('');
    }

    function getFallbackPricing() {
        return [
            { tier: 'basic', name: 'Basic Website', description: 'Perfect for landing pages.', price: 8000, features: ['Single Page', 'Responsive', 'Contact Form', 'SEO Basics'], plan_type: 'one-time', is_popular: false },
            { tier: 'business', name: 'Business Website', description: 'For growing businesses.', price: 20000, features: ['Up to 5 Pages', 'Custom Design', 'CMS', 'SEO', 'Analytics'], plan_type: 'one-time', is_popular: true },
            { tier: 'custom', name: 'Custom Software', description: 'Tailored solutions.', price: 45000, features: ['Custom Features', 'Admin Panel', 'API Development', 'Source Code'], plan_type: 'one-time', is_popular: false },
            { tier: 'maintenance', name: 'Monthly Maintenance', description: 'Keep your site running.', price: 2000, features: ['Bug Fixes', 'Content Updates', 'Security Patches', 'Monthly Report'], plan_type: 'subscription', is_popular: false },
            { tier: 'saas', name: 'SaaS Hosting', description: 'Managed hosting.', price: 5000, features: ['Cloud Hosting', 'SSL', 'Daily Backups', '24/7 Support'], plan_type: 'subscription', is_popular: true },
            { tier: 'app', name: 'App Support', description: 'Ongoing app support.', price: 3500, features: ['Bug Fixes', 'OS Updates', 'Store Management', 'Crash Analytics'], plan_type: 'subscription', is_popular: false },
        ];
    }

    // ─── INIT ───
    document.addEventListener('DOMContentLoaded', () => {
        loadServices();
        loadProjects();
        loadPricing();
    });
})();
