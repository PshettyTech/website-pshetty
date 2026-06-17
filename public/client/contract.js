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
        { icon: 'fa-file-lines', title: 'SCOPE OF SERVICES', text: 'The Agency agrees to provide website development, website design, mobile app development, and custom software development services as outlined in the attached Proposal. Additional services such as SEO, maintenance, and support may be included as per mutual agreement.' },
        { icon: 'fa-calendar', title: 'TERM', text: 'This Agreement begins on the date signed below and continues for the duration specified in the project timeline, unless terminated earlier by either party with 15 days\' written notice.' },
        { icon: 'fa-indian-rupee-sign', title: 'PAYMENT TERMS', text: 'The Client agrees to pay the Agency the fees outlined in the Proposal. Invoices are due within 7 days of the invoice date. Late payments may be subject to a 5% late fee.' },
        { icon: 'fa-handshake', title: 'CLIENT RESPONSIBILITIES', text: 'The Client agrees to provide all necessary information, materials, and access required for the Agency to perform the services. Timely feedback and communication are essential for successful project completion.' },
        { icon: 'fa-lock', title: 'CONFIDENTIALITY', text: 'Both parties agree to keep confidential all non-public information shared during the term of this Agreement and not disclose it to any third party without written consent.' },
        { icon: 'fa-shield-check', title: 'OWNERSHIP', text: 'Upon full payment, all deliverables including source code, designs, and documentation become the property of the Client.' },
        { icon: 'fa-ban', title: 'TERMINATION', text: 'Either party may terminate this Agreement with written notice if the other party breaches any material term and fails to cure within 15 days of such notice.' },
        { icon: 'fa-exclamation-triangle', title: 'LIMITATION OF LIABILITY', text: 'The Agency shall not be liable for any indirect, incidental, or consequential damages arising from the services provided.' },
        { icon: 'fa-gavel', title: 'GOVERNING LAW', text: 'This Agreement shall be governed by and construed in accordance with the laws of India.' },
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
                    aadhaar: document.getElementById('cf-aadhaar').value.trim().replace(/\s/g, ''),
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
