/* ═══════════════════════════════════════════════════════════
   QUOTE-FORM.JS — Quote Form Logic, Estimation, & PDF Download
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    const form = document.getElementById('quote-form');
    const typeSelect = document.getElementById('q-type');
    const estimatePreview = document.getElementById('estimate-preview');
    const estimatePrice = document.getElementById('estimate-price');
    const submitBtn = document.getElementById('quote-submit');
    const successPanel = document.getElementById('quote-success');
    const successPrice = document.getElementById('success-price');
    const successTimeline = document.getElementById('success-timeline');
    const pdfDownload = document.getElementById('pdf-download');

    if (!form) return;

    // ─── Price estimation map (must match server) ───
    const ESTIMATES = {
        'web-landing': { price: 8000, timeline: '1-2 weeks' },
        'web-business': { price: 20000, timeline: '2-3 weeks' },
        'web-ecommerce': { price: 40000, timeline: '4-6 weeks' },
        'web-custom': { price: 50000, timeline: '4-8 weeks' },
        'mobile-android': { price: 35000, timeline: '4-6 weeks' },
        'mobile-ios': { price: 40000, timeline: '4-6 weeks' },
        'mobile-cross': { price: 60000, timeline: '6-10 weeks' },
        'software-billing': { price: 45000, timeline: '4-8 weeks' },
        'software-erp': { price: 100000, timeline: '8-16 weeks' },
        'software-custom': { price: 60000, timeline: '6-12 weeks' },
        'saas-platform': { price: 120000, timeline: '10-16 weeks' },
        'saas-dashboard': { price: 50000, timeline: '4-8 weeks' },
        'ai-chatbot': { price: 30000, timeline: '3-6 weeks' },
        'ai-automation': { price: 55000, timeline: '4-8 weeks' },
    };

    // ─── Live estimate preview ───
    typeSelect.addEventListener('change', () => {
        const est = ESTIMATES[typeSelect.value];
        if (est) {
            estimatePrice.textContent = '₹' + est.price.toLocaleString('en-IN');
            estimatePreview.style.display = 'block';
        } else {
            estimatePreview.style.display = 'none';
        }
    });

    // ─── Form submission ───
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        submitBtn.disabled = true;

        const formData = {
            name: form.name.value.trim(),
            company_name: form.company_name.value.trim(),
            email: form.email.value.trim(),
            phone: form.phone.value.trim(),
            project_type: form.project_type.value,
            budget: form.budget.value,
            description: form.description.value.trim(),
        };

        try {
            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Show success
                form.style.display = 'none';
                successPanel.style.display = 'block';
                successPrice.textContent = '₹' + Number(data.quote.estimated_price).toLocaleString('en-IN');
                successTimeline.textContent = data.quote.estimated_timeline;

                if (data.quote.pdf_url) {
                    pdfDownload.href = data.quote.pdf_url;
                    pdfDownload.style.display = 'inline-flex';
                } else {
                    pdfDownload.style.display = 'none';
                }
            } else {
                alert(data.error || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            alert('Connection error. Please check your internet and try again.');
        }

        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
    });
})();
