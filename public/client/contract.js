// ═══════════════════════════════════════════════
// CONTRACT PAGE LOGIC
// ═══════════════════════════════════════════════
(function () {
    const TOKEN = localStorage.getItem('client_token');
    if (!TOKEN) { window.location.href = '/client/'; return; }

    const API = '/api/client/portal';
    const headers = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

    // ─── Contract Terms ───
    const TERMS = [
        { icon: 'fa-file-lines', title: 'SCOPE OF SERVICES', text: 'Services shall be provided strictly as per the approved Statement of Work (SOW), quotation, or Annexure A attached to this Agreement. Any work outside this scope shall require separate written approval and additional charges.' },
        { icon: 'fa-indian-rupee-sign', title: 'PAYMENT TERMS', text: 'A non-refundable advance of minimum 40% is required prior to commencement. The remaining balance becomes due upon completion and acceptance. Failure to complete payment authorizes the Agency to suspend or terminate services without liability.' },
        { icon: 'fa-check-circle', title: 'USER ACCEPTANCE & APPROVAL (UAT)', text: 'Upon completion, the Agency shall provide access for review. The Client shall have 5 (five) days to test and report issues in writing. If no feedback is received within this period, the project shall be deemed accepted. Upon acceptance, full payment becomes immediately due.' },
        { icon: 'fa-ban', title: 'NO REFUND POLICY', text: 'All payments are strictly non-refundable once work has commenced.' },
        { icon: 'fa-server', title: 'DELIVERY & ACCESS CONTROL', text: 'The Agency retains full control over code, hosting, and deployment until full payment is received. No ownership or access shall be transferred before full settlement.' },
        { icon: 'fa-user-clock', title: 'CLIENT OBLIGATIONS', text: 'The Client shall provide lawful content, timely responses, and required materials. Failure to provide inputs or communication for 30 consecutive days shall result in the project being marked as "Dormant." In such case, the Agency reserves the right to invoice for all completed work. A restart fee may be required to resume the project.' },
        { icon: 'fa-scale-balanced', title: 'LEGAL USE & COMPLIANCE', text: 'The Client agrees not to use the deliverables for unlawful purposes under Indian law. Violation shall result in immediate termination without refund.' },
        { icon: 'fa-lock', title: 'CONFIDENTIALITY (NDA)', text: 'Both parties agree to keep confidential any proprietary, business, or technical information shared during the project. Such information shall not be disclosed to third parties without prior written consent. This obligation shall survive termination of the Agreement.' },
        { icon: 'fa-shield-halved', title: 'INDEMNITY', text: 'The Client agrees to indemnify and hold harmless the Agency from any claims arising due to misuse, illegal activity, or violation of laws.' },
        { icon: 'fa-exclamation-triangle', title: 'LIMITATION OF LIABILITY', text: 'The Agency shall not be liable for indirect or consequential damages. Total liability shall not exceed the total amount paid.' },
        { icon: 'fa-copyright', title: 'INTELLECTUAL PROPERTY', text: 'All rights remain with the Agency until full payment is made. Upon full payment, ownership transfers to the Client (excluding third-party components).' },
        { icon: 'fa-bullhorn', title: 'PORTFOLIO & MARKETING RIGHTS', text: 'The Agency retains the right to display the project in its portfolio and marketing materials. A discreet credit ("Developed by Pshetty Tech") may be included unless declined in writing.' },
        { icon: 'fa-cubes', title: 'THIRD-PARTY SERVICES', text: 'The Agency is not responsible for failures of third-party services.' },
        { icon: 'fa-headset', title: 'POST-LAUNCH SUPPORT & WARRANTY', text: 'A 14-day limited warranty is provided for fixing critical bugs. Post this period, all updates and fixes shall be chargeable unless covered under a separate maintenance agreement.' },
        { icon: 'fa-triangle-exclamation', title: 'TERMINATION & CURE PERIOD', text: 'Immediate termination applies for: Non-payment, Illegal activities. For other issues, a 5-day Cure Notice shall be provided. Failure to resolve results in termination without refund.' },
        { icon: 'fa-clock-rotate-left', title: 'DELAYED PAYMENT', text: 'Delayed payments beyond 7 days shall incur a 2% monthly penalty. Services may be suspended until cleared.' },
        { icon: 'fa-file-invoice-dollar', title: 'TAXES (GST & TDS)', text: 'All prices are exclusive of GST. GST shall be charged additionally. If TDS is deducted, the Client must provide Form 16A. Failure shall be treated as non-payment.' },
        { icon: 'fa-user-shield', title: 'DATA & PRIVACY', text: 'The Client is responsible for compliance with applicable data protection laws.' },
        { icon: 'fa-handshake', title: 'INDEPENDENT CONTRACTOR', text: 'The Agency is an independent contractor. No partnership, joint venture, or employment relationship is created.' },
        { icon: 'fa-gavel', title: 'DISPUTE RESOLUTION (ARBITRATION)', text: 'Parties shall first attempt resolution through mutual discussion. If unresolved within 30 days, disputes shall be referred to a sole arbitrator in Kalaburagi under the Arbitration and Conciliation Act, 1996. The decision shall be final and binding.' },
        { icon: 'fa-landmark', title: 'GOVERNING LAW & JURISDICTION', text: 'This Agreement shall be governed by the laws of India. Courts in Kalaburagi, Karnataka shall have exclusive jurisdiction.' },
        { icon: 'fa-cloud-bolt', title: 'FORCE MAJEURE', text: 'The Agency shall not be liable for delays due to events beyond control.' },
        { icon: 'fa-scissors', title: 'SEVERABILITY', text: 'If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.' },
        { icon: 'fa-file-signature', title: 'ENTIRE AGREEMENT', text: 'This Agreement, along with the SOW, constitutes the complete understanding between both parties.' },
    ];

    // Render terms
    const termsList = document.getElementById('terms-list');
    TERMS.forEach((t, i) => {
        termsList.innerHTML += `
            <div class="term-item">
                <div class="term-number">${i + 1}</div>
                <div class="term-icon"><i class="fas ${t.icon}"></i></div>
                <div class="term-content">
                    <h4>${t.title}</h4>
                    <p>${t.text}</p>
                </div>
            </div>
        `;
    });

    // Set date
    document.getElementById('contract-date').textContent = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // ─── Load contract data ───
    fetch(`${API}/contract`, { headers })
        .then(r => r.json())
        .then(data => {
            if (data.already_signed) {
                window.location.href = '/client/dashboard.html';
                return;
            }
            const c = data.client;
            const p = data.project;
            document.getElementById('info-name').textContent = c.company_name ? `${c.full_name} / ${c.company_name}` : c.full_name || '—';
            document.getElementById('info-email').textContent = c.email || '—';
            document.getElementById('info-project').textContent = p.type || '—';
            document.getElementById('info-price').textContent = p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : 'TBD';
            document.getElementById('info-timeline').textContent = p.timeline || 'TBD';

            // Pre-fill form
            document.getElementById('cf-name').value = c.full_name || '';
            document.getElementById('cf-email').value = c.email || '';
            document.getElementById('cf-phone').value = c.phone || '';
            document.getElementById('cf-business-name').value = c.company_name || '';
        })
        .catch(err => console.error('Contract load error:', err));

    // ─── Signature Pad ───
    const canvas = document.getElementById('sig-canvas');
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let sigType = 'draw';
    let hasSignature = false;

    function resizeCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width - 16;
        canvas.height = 160;
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    canvas.addEventListener('mousedown', (e) => { drawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
    canvas.addEventListener('mousemove', (e) => { if (!drawing) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); hasSignature = true; checkReady(); });
    canvas.addEventListener('mouseup', () => drawing = false);
    canvas.addEventListener('mouseleave', () => drawing = false);

    // Touch support
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); drawing = true; const t = e.touches[0]; const r = canvas.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo(t.clientX - r.left, t.clientY - r.top); });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (!drawing) return; const t = e.touches[0]; const r = canvas.getBoundingClientRect(); ctx.lineTo(t.clientX - r.left, t.clientY - r.top); ctx.stroke(); hasSignature = true; checkReady(); });
    canvas.addEventListener('touchend', () => drawing = false);

    document.getElementById('sig-clear').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasSignature = false;
        checkReady();
    });

    // Sig tabs
    document.querySelectorAll('.sig-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.sig-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            sigType = tab.dataset.type;
            if (sigType === 'draw') {
                document.getElementById('sig-draw-area').style.display = 'block';
                document.getElementById('sig-typed-input').style.display = 'none';
            } else {
                document.getElementById('sig-draw-area').style.display = 'none';
                document.getElementById('sig-typed-input').style.display = 'block';
            }
            checkReady();
        });
    });

    const typedInput = document.getElementById('sig-typed-input');
    typedInput.addEventListener('input', checkReady);

    // ─── Enable/Disable submit ───
    const acceptCb = document.getElementById('cf-accept');
    const submitBtn = document.getElementById('submit-contract');
    acceptCb.addEventListener('change', checkReady);

    function checkReady() {
        const sigOk = sigType === 'draw' ? hasSignature : typedInput.value.trim().length > 2;
        submitBtn.disabled = !(acceptCb.checked && sigOk);
    }

    // ─── Submit Contract ───
    document.getElementById('contract-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        const signatureData = sigType === 'draw' ? canvas.toDataURL('image/png') : typedInput.value.trim();

        try {
            const res = await fetch(`${API}/contract/sign`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    full_name: document.getElementById('cf-name').value.trim(),
                    email: document.getElementById('cf-email').value.trim(),
                    phone: document.getElementById('cf-phone').value.trim(),
                    business_name: document.getElementById('cf-business-name').value.trim(),
                    business_address: document.getElementById('cf-business-address').value.trim(),
                    signature_data: signatureData,
                    signature_type: sigType,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                // Update stored client data
                const cd = JSON.parse(localStorage.getItem('client_data') || '{}');
                cd.contract_signed = true;
                cd.first_login_complete = true;
                localStorage.setItem('client_data', JSON.stringify(cd));
                window.location.href = '/client/welcome.html';
            } else {
                alert(data.error || 'Failed to sign contract');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Sign & Submit Contract';
            }
        } catch (err) {
            alert('Connection error. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Sign & Submit Contract';
        }
    });
})();
