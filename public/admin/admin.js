/* ═══════════════════════════════════════════════════════════
   ADMIN.JS — Admin Panel Logic
   Auth, CRUD operations, page routing
   ═══════════════════════════════════════════════════════════ */

const AdminApp = (() => {
    let currentPage = 'overview';

    // ─── DOM ───
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard');
    const pageTitle = document.getElementById('page-title');
    const pageContent = document.getElementById('page-content');
    const adminName = document.getElementById('admin-name');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    // ─── INIT ───
    async function init() {
        // Try to load dashboard. If it fails due to no auth, show login.
        try {
            await api('/api/admin/dashboard');
            showDashboard();
        } catch (err) {
            loginScreen.style.display = 'flex';
            dashboard.style.display = 'none';
        }

        // Login form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('login-user').value;
            const pass = document.getElementById('login-pass').value;
            try {
                const res = await api('/api/admin/login', 'POST', { username: user, password: pass });
                adminName.textContent = res.username;
                showDashboard();
            } catch (err) {
                const errDiv = document.getElementById('login-error');
                errDiv.textContent = err.message || 'Invalid credentials';
                errDiv.style.display = 'block';
            }
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', async () => {
            try {
                await api('/api/admin/logout', 'POST');
            } catch (e) { } // Ignore errors on logout
            loginScreen.style.display = 'flex';
            dashboard.style.display = 'none';
        });

        // Sidebar navigation
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                navigateTo(link.dataset.page);
            });
        });
    }

    function showDashboard() {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'flex';
        navigateTo('overview');
    }

    // ─── API HELPER ───
    async function api(url, method = 'GET', body = null) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' // THIS SENDS THE HTTPONLY COOKIE
        };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(url, opts);
        const data = await res.json();
        if (!res.ok) {
            // Auto logout if unauthorized
            if (res.status === 401 && url !== '/api/admin/login' && url !== '/api/admin/dashboard') {
                loginScreen.style.display = 'flex';
                dashboard.style.display = 'none';
            }
            throw new Error(data.error || 'Request failed');
        }
        return data;
    }

    // ─── PAGE ROUTING ───
    async function navigateTo(page) {
        currentPage = page;
        pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);

        switch (page) {
            case 'overview': await renderOverview(); break;
            case 'quotes': await renderQuotes(); break;
            case 'services': await renderServices(); break;
            case 'projects': await renderProjects(); break;
            case 'pricing': await renderPricing(); break;
            case 'clients': await renderClients(); break;
            case 'cold-calls': await renderColdCalls(); break;
        }
    }

    // ─── OVERVIEW ───
    async function renderOverview() {
        try {
            const stats = await api('/api/admin/dashboard');
            pageContent.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-box"><div class="stat-box__label">Total Quotes</div><div class="stat-box__value">${stats.totalQuotes}</div></div>
                    <div class="stat-box"><div class="stat-box__label">Pending Quotes</div><div class="stat-box__value">${stats.pendingQuotes}</div></div>
                    <div class="stat-box"><div class="stat-box__label">Active Services</div><div class="stat-box__value">${stats.activeServices}</div></div>
                    <div class="stat-box"><div class="stat-box__label">Active Projects</div><div class="stat-box__value">${stats.activeProjects}</div></div>
                    <div class="stat-box"><div class="stat-box__label">Active Clients</div><div class="stat-box__value">${stats.activeClients || 0}</div></div>
                </div>`;
        } catch (err) {
            pageContent.innerHTML = `<p style="color:#ef4444">${err.message}</p>`;
        }
    }

    // ─── QUOTES ───
    async function renderQuotes() {
        try {
            const quotes = await api('/api/admin/quotes');
            pageContent.innerHTML = `
                <table class="data-table">
                    <thead><tr>
                        <th>Date</th><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Type</th><th>Estimate</th><th>Status</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                        ${quotes.map(q => `
                            <tr>
                                <td>${new Date(q.created_at).toLocaleDateString('en-IN')}</td>
                                <td><strong>${q.name}</strong></td>
                                <td>${q.company_name || '-'}</td>
                                <td>${q.email}</td>
                                <td>${q.phone || '-'}</td>
                                <td>${q.project_type}</td>
                                <td>₹${Number(q.estimated_price||0).toLocaleString('en-IN')}</td>
                                <td><span class="badge badge--${q.status}">${q.status}</span></td>
                                <td>
                                    <button class="btn-sm btn-edit" onclick="AdminApp.editQuoteStatus(${q.id},'${q.status}')">Status</button>
                                    ${q.pdf_path ? `<a href="/${q.pdf_path}" target="_blank" class="btn-sm btn-primary" style="text-decoration:none;margin-left:4px;">PDF</a>` : ''}
                                    <button class="btn-sm btn-delete" onclick="AdminApp.deleteQuote(${q.id})" style="margin-left:4px;">Del</button>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>`;
        } catch (err) {
            pageContent.innerHTML = `<p style="color:#ef4444">${err.message}</p>`;
        }
    }

    function editQuoteStatus(id, currentStatus) {
        modalTitle.textContent = 'Update Quote Status';
        modalBody.innerHTML = `
            <div class="field">
                <label>Status</label>
                <select id="edit-status">
                    <option value="pending" ${currentStatus==='pending'?'selected':''}>Pending</option>
                    <option value="contacted" ${currentStatus==='contacted'?'selected':''}>Contacted</option>
                    <option value="converted" ${currentStatus==='converted'?'selected':''}>Converted</option>
                </select>
            </div>
            <button class="btn-save" onclick="AdminApp.saveQuoteStatus(${id})">Save</button>`;
        modal.style.display = 'flex';
    }

    async function saveQuoteStatus(id) {
        const status = document.getElementById('edit-status').value;
        await api(`/api/admin/quotes/${id}`, 'PATCH', { status });
        closeModal();
        renderQuotes();
    }

    async function deleteQuote(id) {
        if (!confirm('Delete this quote?')) return;
        await api(`/api/admin/quotes/${id}`, 'DELETE');
        renderQuotes();
    }

    // ─── SERVICES ───
    async function renderServices() {
        try {
            const services = await api('/api/admin/services');
            pageContent.innerHTML = `
                <button class="btn-add" onclick="AdminApp.addService()"><i class="fas fa-plus"></i> Add Service</button>
                <table class="data-table">
                    <thead><tr><th>Order</th><th>Category</th><th>Title</th><th>Active</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${services.map(s => `<tr>
                            <td>${s.display_order}</td>
                            <td>${s.category}</td>
                            <td><strong>${s.title}</strong></td>
                            <td>${s.is_active ? '✅' : '❌'}</td>
                            <td>
                                <button class="btn-sm btn-edit" onclick='AdminApp.editService(${JSON.stringify(s).replace(/'/g,"&#39;")})'>Edit</button>
                                <button class="btn-sm btn-delete" onclick="AdminApp.deleteService(${s.id})" style="margin-left:4px;">Del</button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>`;
        } catch (err) {
            pageContent.innerHTML = `<p style="color:#ef4444">${err.message}</p>`;
        }
    }

    function addService() {
        editService({ id: null, category: '', title: '', description: '', icon: 'code', features: [], display_order: 0, is_active: true });
    }

    function editService(s) {
        const features = typeof s.features === 'string' ? JSON.parse(s.features) : (s.features || []);
        modalTitle.textContent = s.id ? 'Edit Service' : 'Add Service';
        modalBody.innerHTML = `
            <div class="field"><label>Category</label><input id="e-cat" value="${s.category}"></div>
            <div class="field"><label>Title</label><input id="e-title" value="${s.title}"></div>
            <div class="field"><label>Description</label><textarea id="e-desc">${s.description||''}</textarea></div>
            <div class="field"><label>Icon</label><input id="e-icon" value="${s.icon||'code'}"></div>
            <div class="field"><label>Features (comma separated)</label><input id="e-feat" value="${features.join(', ')}"></div>
            <div class="field"><label>Order</label><input type="number" id="e-order" value="${s.display_order||0}"></div>
            <button class="btn-save" onclick="AdminApp.saveService(${s.id})">Save</button>`;
        modal.style.display = 'flex';
    }

    async function saveService(id) {
        const data = {
            category: document.getElementById('e-cat').value,
            title: document.getElementById('e-title').value,
            description: document.getElementById('e-desc').value,
            icon: document.getElementById('e-icon').value,
            features: document.getElementById('e-feat').value.split(',').map(s=>s.trim()).filter(Boolean),
            display_order: parseInt(document.getElementById('e-order').value) || 0,
            is_active: true,
        };
        if (id) { await api(`/api/admin/services/${id}`, 'PUT', data); }
        else { await api('/api/admin/services', 'POST', data); }
        closeModal();
        renderServices();
    }

    async function deleteService(id) {
        if (!confirm('Delete this service?')) return;
        await api(`/api/admin/services/${id}`, 'DELETE');
        renderServices();
    }

    // ─── PROJECTS ───
    async function renderProjects() {
        try {
            const projects = await api('/api/admin/projects');
            pageContent.innerHTML = `
                <button class="btn-add" onclick="AdminApp.addProject()"><i class="fas fa-plus"></i> Add Project</button>
                <table class="data-table">
                    <thead><tr><th>Order</th><th>Title</th><th>Client</th><th>Category</th><th>Active</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${projects.map(p => `<tr>
                            <td>${p.display_order}</td>
                            <td><strong>${p.title}</strong></td>
                            <td>${p.client_name}</td>
                            <td>${p.category||'-'}</td>
                            <td>${p.is_active ? '✅' : '❌'}</td>
                            <td>
                                <button class="btn-sm btn-edit" onclick='AdminApp.editProject(${JSON.stringify(p).replace(/'/g,"&#39;")})'>Edit</button>
                                <button class="btn-sm btn-delete" onclick="AdminApp.deleteProject(${p.id})" style="margin-left:4px;">Del</button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>`;
        } catch (err) {
            pageContent.innerHTML = `<p style="color:#ef4444">${err.message}</p>`;
        }
    }

    function addProject() {
        editProject({ id: null, title: '', client_name: '', description: '', category: '', features: [], image_url: '', display_order: 0, is_active: true });
    }

    function editProject(p) {
        const features = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
        modalTitle.textContent = p.id ? 'Edit Project' : 'Add Project';
        modalBody.innerHTML = `
            <div class="field"><label>Title</label><input id="e-title" value="${p.title}"></div>
            <div class="field"><label>Client Name</label><input id="e-client" value="${p.client_name}"></div>
            <div class="field"><label>Category</label><input id="e-cat" value="${p.category||''}"></div>
            <div class="field"><label>Description</label><textarea id="e-desc">${p.description||''}</textarea></div>
            <div class="field"><label>Features (comma separated)</label><input id="e-feat" value="${features.join(', ')}"></div>
            <div class="field"><label>Order</label><input type="number" id="e-order" value="${p.display_order||0}"></div>
            <button class="btn-save" onclick="AdminApp.saveProject(${p.id})">Save</button>`;
        modal.style.display = 'flex';
    }

    async function saveProject(id) {
        const data = {
            title: document.getElementById('e-title').value,
            client_name: document.getElementById('e-client').value,
            category: document.getElementById('e-cat').value,
            description: document.getElementById('e-desc').value,
            features: document.getElementById('e-feat').value.split(',').map(s=>s.trim()).filter(Boolean),
            display_order: parseInt(document.getElementById('e-order').value) || 0,
            is_active: true,
        };
        if (id) { await api(`/api/admin/projects/${id}`, 'PUT', data); }
        else { await api('/api/admin/projects', 'POST', data); }
        closeModal();
        renderProjects();
    }

    async function deleteProject(id) {
        if (!confirm('Delete this project?')) return;
        await api(`/api/admin/projects/${id}`, 'DELETE');
        renderProjects();
    }

    // ─── PRICING ───
    async function renderPricing() {
        try {
            const pricing = await api('/api/admin/pricing');
            pageContent.innerHTML = `
                <button class="btn-add" onclick="AdminApp.addPricing()"><i class="fas fa-plus"></i> Add Pricing</button>
                <table class="data-table">
                    <thead><tr><th>Name</th><th>Price</th><th>Type</th><th>Popular</th><th>Active</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${pricing.map(p => `<tr>
                            <td><strong>${p.name}</strong></td>
                            <td>₹${Number(p.price).toLocaleString('en-IN')}</td>
                            <td>${p.plan_type}</td>
                            <td>${p.is_popular ? '⭐' : '-'}</td>
                            <td>${p.is_active ? '✅' : '❌'}</td>
                            <td>
                                <button class="btn-sm btn-edit" onclick='AdminApp.editPricing(${JSON.stringify(p).replace(/'/g,"&#39;")})'>Edit</button>
                                <button class="btn-sm btn-delete" onclick="AdminApp.deletePricing(${p.id})" style="margin-left:4px;">Del</button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>`;
        } catch (err) {
            pageContent.innerHTML = `<p style="color:#ef4444">${err.message}</p>`;
        }
    }

    function addPricing() {
        editPricing({ id: null, tier: '', name: '', description: '', price: 0, features: [], plan_type: 'one-time', is_popular: false, is_active: true });
    }

    function editPricing(p) {
        const features = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
        modalTitle.textContent = p.id ? 'Edit Pricing' : 'Add Pricing';
        modalBody.innerHTML = `
            <div class="field"><label>Name</label><input id="e-name" value="${p.name}"></div>
            <div class="field"><label>Tier Key</label><input id="e-tier" value="${p.tier}"></div>
            <div class="field"><label>Description</label><textarea id="e-desc">${p.description||''}</textarea></div>
            <div class="field"><label>Price (₹)</label><input type="number" id="e-price" value="${p.price}"></div>
            <div class="field"><label>Type</label>
                <select id="e-type">
                    <option value="one-time" ${p.plan_type==='one-time'?'selected':''}>One-time</option>
                    <option value="subscription" ${p.plan_type==='subscription'?'selected':''}>Subscription</option>
                </select>
            </div>
            <div class="field"><label>Features (comma separated)</label><input id="e-feat" value="${features.join(', ')}"></div>
            <div class="field"><label>Popular?</label>
                <select id="e-pop">
                    <option value="false" ${!p.is_popular?'selected':''}>No</option>
                    <option value="true" ${p.is_popular?'selected':''}>Yes</option>
                </select>
            </div>
            <button class="btn-save" onclick="AdminApp.savePricing(${p.id})">Save</button>`;
        modal.style.display = 'flex';
    }

    async function savePricing(id) {
        const data = {
            name: document.getElementById('e-name').value,
            tier: document.getElementById('e-tier').value,
            description: document.getElementById('e-desc').value,
            price: parseFloat(document.getElementById('e-price').value) || 0,
            plan_type: document.getElementById('e-type').value,
            features: document.getElementById('e-feat').value.split(',').map(s=>s.trim()).filter(Boolean),
            is_popular: document.getElementById('e-pop').value === 'true',
            is_active: true,
        };
        if (id) { await api(`/api/admin/pricing/${id}`, 'PUT', data); }
        else { await api('/api/admin/pricing', 'POST', data); }
        closeModal();
        renderPricing();
    }

    async function deletePricing(id) {
        if (!confirm('Delete this pricing tier?')) return;
        await api(`/api/admin/pricing/${id}`, 'DELETE');
        renderPricing();
    }

    // ══════════════════════════════════════════════
    // CLIENTS MANAGEMENT
    // ══════════════════════════════════════════════
    async function renderClients() {
        try {
            const clients = await api('/api/admin/clients');
            const quotes = await api('/api/admin/quotes');
            const convertableQuotes = quotes.filter(q => q.status !== 'converted');

            pageContent.innerHTML = `
                ${convertableQuotes.length ? `<button class="btn-add" onclick="AdminApp.showCreateClient()"><i class="fas fa-user-plus"></i> Create Client from Quote</button>` : ''}
                <table class="data-table">
                    <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Project</th><th>Contract</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${clients.length ? clients.map(c => `<tr>
                            <td><strong>${c.full_name || '—'}</strong><br><span style="font-size:.72rem;color:#999;">${c.company_name || ''}</span></td>
                            <td><code style="background:#f3f4f6;padding:2px 8px;border-radius:4px;font-size:.8rem;">${c.username}</code></td>
                            <td>${c.email || '—'}</td>
                            <td>${c.project_title || '<span style="color:#999">No project</span>'}</td>
                            <td>${c.contract_signed ? '<span style="color:#22c55e">✅ Signed</span>' : '<span style="color:#f59e0b">⏳ Pending</span>'}</td>
                            <td>${c.project_status ? `<span class="badge badge--${c.project_status}">${c.project_status}</span>` : '—'}</td>
                            <td style="font-size:.78rem;">${c.last_login ? new Date(c.last_login).toLocaleString('en-IN') : 'Never'}</td>
                            <td><button class="btn-sm btn-edit" onclick="AdminApp.viewClient(${c.id})">Manage</button></td>
                        </tr>`).join('') : '<tr><td colspan="8" style="text-align:center;color:#999;padding:32px;">No clients yet. Create one from an accepted quote.</td></tr>'}
                    </tbody>
                </table>`;
        } catch (err) {
            pageContent.innerHTML = `<p style="color:#ef4444">${err.message}</p>`;
        }
    }

    async function showCreateClient() {
        const quotes = await api('/api/admin/quotes');
        const available = quotes.filter(q => q.status !== 'converted');
        modalTitle.textContent = 'Create Client from Quote';
        modalBody.innerHTML = `
            <div class="field"><label>Select Quote</label>
                <select id="cc-quote">
                    <option value="">— Select a quote —</option>
                    ${available.map(q => `<option value="${q.id}">${q.name} — ${q.project_type} (₹${Number(q.estimated_price||0).toLocaleString('en-IN')})</option>`).join('')}
                </select>
            </div>
            <button class="btn-save" onclick="AdminApp.createClient()">Create Client</button>
            <div id="cc-result" style="margin-top:16px;"></div>`;
        modal.style.display = 'flex';
    }

    async function createClient() {
        const quoteId = document.getElementById('cc-quote').value;
        if (!quoteId) return alert('Select a quote');
        try {
            const res = await api('/api/admin/clients', 'POST', { quote_id: parseInt(quoteId) });
            const emailBadge = res.emailSent
                ? `<p style="color:#22c55e;font-weight:600;font-size:.82rem;margin-top:8px;">✅ Credentials email sent to client automatically.</p>`
                : `<p style="color:#f59e0b;font-weight:600;font-size:.82rem;margin-top:8px;">⚠️ Email failed — copy and share credentials manually.</p>`;
            document.getElementById('cc-result').innerHTML = `
                <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;">
                    <p style="color:#22c55e;font-weight:700;margin-bottom:12px;">✅ Client Created!</p>
                    <p style="margin-bottom:8px;"><strong>Name:</strong> ${res.client.full_name}</p>
                    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:8px 0;">
                        <p style="margin-bottom:4px;"><strong>Username:</strong> <code style="background:#fef3c7;padding:2px 8px;border-radius:4px;font-size:1rem;user-select:all;">${res.credentials.username}</code></p>
                        <p><strong>Password:</strong> <code style="background:#fef3c7;padding:2px 8px;border-radius:4px;font-size:1rem;user-select:all;">${res.credentials.password}</code></p>
                    </div>
                    <p style="font-size:.78rem;color:#666;margin-top:8px;">Login URL: <a href="${res.credentials.login_url}" target="_blank">${res.credentials.login_url}</a></p>
                    ${emailBadge}
                    <p style="font-size:.72rem;color:#ef4444;margin-top:8px;">⚠️ Copy these credentials now! The password cannot be retrieved later.</p>
                </div>`;
        } catch (err) {
            document.getElementById('cc-result').innerHTML = `<p style="color:#ef4444">${err.message}</p>`;
        }
    }

    async function viewClient(id) {
        try {
            const data = await api(`/api/admin/clients/${id}`);
            const c = data.client;
            const p = data.project;
            const stages = data.stages;
            const updates = data.updates;
            const meetings = data.meetings;
            const invoices = data.invoices;

            pageTitle.textContent = c.full_name || c.username;
            pageContent.innerHTML = `
                <div style="margin-bottom:16px;"><button class="btn-sm btn-edit" onclick="AdminApp.renderClients()" style="margin-bottom:16px;"><i class="fas fa-arrow-left"></i> Back to Clients</button></div>

                <!-- Client Info -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
                    <div class="stat-box"><div class="stat-box__label">Email</div><div style="font-size:.9rem;">${c.email}</div></div>
                    <div class="stat-box"><div class="stat-box__label">Phone</div><div style="font-size:.9rem;">${c.phone || '—'}</div></div>
                    <div class="stat-box"><div class="stat-box__label">Contract</div><div style="font-size:.9rem;">${c.contract_signed ? '✅ Signed' : '⏳ Pending'}</div></div>
                    <div class="stat-box"><div class="stat-box__label">Last Login</div><div style="font-size:.9rem;">${c.last_login ? new Date(c.last_login).toLocaleString('en-IN') : 'Never'}</div></div>
                </div>

                <!-- Contract Details -->
                ${c.contract_signed && data.contract ? `
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:24px;">
                    <h3 style="font-weight:700;margin-bottom:16px;">⚖️ Contract & Legal Details</h3>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
                        <div><strong style="color:#666;font-size:0.8rem;text-transform:uppercase;">Signatory Name</strong><br/>${data.contract.client_full_name}</div>
                        <div><strong style="color:#666;font-size:0.8rem;text-transform:uppercase;">Signed At</strong><br/>${new Date(data.contract.signed_at).toLocaleString('en-IN')}</div>
                        <div><strong style="color:#666;font-size:0.8rem;text-transform:uppercase;">Business Name</strong><br/>${data.contract.client_business_name || '—'}</div>
                        <div><strong style="color:#666;font-size:0.8rem;text-transform:uppercase;">IP Address (Verified)</strong><br/><code>${data.contract.ip_address || 'Unknown'}</code></div>
                        <div style="grid-column: 1 / -1;"><strong style="color:#666;font-size:0.8rem;text-transform:uppercase;">Business Address</strong><br/>${data.contract.client_business_address || '—'}</div>
                    </div>
                    <div style="margin-top:16px;padding-top:16px;border-top:1px solid #eee;">
                        <strong style="color:#666;font-size:0.8rem;text-transform:uppercase;">Digital Signature</strong><br/>
                        ${data.contract.signature_data && data.contract.signature_data.startsWith('data:image') 
                            ? `<img src="${data.contract.signature_data}" style="max-height:100px; max-width:100%; border:1px solid #ddd; border-radius:4px; margin-top:8px; padding:4px;" alt="Signature">` 
                            : `<div style="font-family:'Dancing Script',cursive; font-size:2rem; padding:8px 0;">${data.contract.signature_data}</div>`
                        }
                    </div>
                </div>
                ` : ''}

                <!-- Project Section -->
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                        <h3 style="font-weight:700;">📋 Project</h3>
                        ${!p ? `<button class="btn-sm btn-primary" onclick="AdminApp.assignProject(${id})"><i class="fas fa-plus"></i> Assign Project</button>` : ''}
                    </div>
                    ${p ? `
                        <p><strong>${p.title}</strong> — <span class="badge badge--${p.status}">${p.status}</span></p>
                        <p style="color:#666;font-size:.84rem;margin-top:4px;">${p.description || ''}</p>

                        <!-- Stages -->
                        <h4 style="margin-top:20px;margin-bottom:12px;font-weight:600;">Stages</h4>
                        <table class="data-table">
                            <thead><tr><th>Stage</th><th>Status</th><th>Progress</th><th>Actions</th></tr></thead>
                            <tbody>${stages.map(s => `<tr>
                                <td><strong>${s.name}</strong></td>
                                <td><span class="badge badge--${s.status}">${s.status}</span></td>
                                <td><div style="background:#e5e7eb;height:8px;border-radius:4px;width:100px;"><div style="background:#ff6a00;height:100%;border-radius:4px;width:${s.progress}%;"></div></div> ${s.progress}%</td>
                                <td>
                                    <select onchange="AdminApp.updateStage(${id},${s.id},this.value)" style="padding:4px 8px;border-radius:4px;border:1px solid #ddd;font-size:.78rem;">
                                        <option value="not_started" ${s.status==='not_started'?'selected':''}>Not Started</option>
                                        <option value="in_progress" ${s.status==='in_progress'?'selected':''}>In Progress</option>
                                        <option value="completed" ${s.status==='completed'?'selected':''}>Completed</option>
                                    </select>
                                </td>
                            </tr>`).join('')}</tbody>
                        </table>

                        <!-- Actions -->
                        <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">
                            <button class="btn-sm btn-primary" onclick="AdminApp.postUpdate(${id},${p.id})"><i class="fas fa-camera"></i> Post Update</button>
                            <button class="btn-sm btn-edit" onclick="AdminApp.sendMeeting(${id},${p.id})"><i class="fas fa-video"></i> Send Meeting</button>
                            <button class="btn-sm btn-edit" onclick="AdminApp.sendInvoice(${id},${p.id})"><i class="fas fa-file-invoice"></i> Send Invoice</button>
                            <button class="btn-sm btn-delete" onclick="AdminApp.completeProject(${id},${p.id})"><i class="fas fa-check"></i> Complete Project</button>
                        </div>
                    ` : '<p style="color:#999;">No project assigned yet.</p>'}
                </div>

                <!-- Updates -->
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:16px;">
                    <h3 style="font-weight:700;margin-bottom:12px;">📸 Work Updates (${updates.length})</h3>
                    ${updates.length ? updates.slice(0,10).map(u => `
                        <div style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                            <strong>${u.title || 'Update'}</strong> <span style="font-size:.72rem;color:#999;">${new Date(u.created_at).toLocaleString('en-IN')}</span>
                            <p style="font-size:.84rem;color:#666;">${u.description || ''}</p>
                            ${u.image_url ? `<img src="${u.image_url}" style="max-width:200px;border-radius:8px;margin-top:8px;border:1px solid #eee;">` : ''}
                        </div>
                    `).join('') : '<p style="color:#999;">No updates yet.</p>'}
                </div>

                <!-- Meetings -->
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:16px;">
                    <h3 style="font-weight:700;margin-bottom:12px;">📅 Meetings (${meetings.length})</h3>
                    ${meetings.map(m => `<div style="padding:8px 0;border-bottom:1px solid #f3f4f6;"><strong>${m.title}</strong> — ${m.meeting_date ? new Date(m.meeting_date).toLocaleString('en-IN') : 'TBD'} <a href="${m.meet_link||'#'}" target="_blank" style="color:#ff6a00;">${m.meet_link ? 'Link' : ''}</a></div>`).join('') || '<p style="color:#999;">No meetings.</p>'}
                </div>

                <!-- Invoices -->
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
                    <h3 style="font-weight:700;margin-bottom:12px;">💰 Invoices (${invoices.length})</h3>
                    ${invoices.map(i => `<div style="padding:8px 0;border-bottom:1px solid #f3f4f6;"><strong>${i.invoice_number}</strong> — ₹${Number(i.total).toLocaleString('en-IN')} — <span class="badge badge--${i.status}">${i.status}</span></div>`).join('') || '<p style="color:#999;">No invoices.</p>'}
                </div>
            `;
        } catch (err) {
            pageContent.innerHTML = `<p style="color:#ef4444">${err.message}</p>`;
        }
    }

    function assignProject(clientId) {
        modalTitle.textContent = 'Assign Project';
        modalBody.innerHTML = `
            <div class="field"><label>Project Title</label><input id="ap-title" placeholder="e.g. Business Website"></div>
            <div class="field"><label>Description</label><textarea id="ap-desc" placeholder="Brief description"></textarea></div>
            <div class="field"><label>Type</label><input id="ap-type" placeholder="e.g. Web Development"></div>
            <div class="field"><label>Total Price (₹)</label><input type="number" id="ap-price" placeholder="50000"></div>
            <div class="field"><label>Timeline</label><input id="ap-timeline" placeholder="e.g. 4-6 weeks"></div>
            <button class="btn-save" onclick="AdminApp.saveProject2(${clientId})">Assign Project</button>`;
        modal.style.display = 'flex';
    }

    async function saveProject2(clientId) {
        await api(`/api/admin/clients/${clientId}/project`, 'POST', {
            title: document.getElementById('ap-title').value,
            description: document.getElementById('ap-desc').value,
            project_type: document.getElementById('ap-type').value,
            total_price: parseFloat(document.getElementById('ap-price').value) || 0,
            timeline: document.getElementById('ap-timeline').value,
        });
        closeModal();
        viewClient(clientId);
    }

    async function updateStage(clientId, stageId, status) {
        await api(`/api/admin/clients/${clientId}/stages/${stageId}`, 'PATCH', { status });
        viewClient(clientId);
    }

    function postUpdate(clientId, projectId) {
        modalTitle.textContent = 'Post Work Update';
        modalBody.innerHTML = `
            <div class="field"><label>Title</label><input id="pu-title" placeholder="e.g. Login page completed"></div>
            <div class="field"><label>Description</label><textarea id="pu-desc" placeholder="Details about this update"></textarea></div>
            <div class="field"><label>Screenshot</label><input type="file" id="pu-file" accept="image/*"></div>
            <button class="btn-save" onclick="AdminApp.saveUpdate(${clientId},${projectId})">Post Update</button>`;
        modal.style.display = 'flex';
    }

    async function saveUpdate(clientId, projectId) {
        const form = new FormData();
        form.append('title', document.getElementById('pu-title').value);
        form.append('description', document.getElementById('pu-desc').value);
        form.append('project_id', projectId);
        const file = document.getElementById('pu-file').files[0];
        if (file) form.append('screenshot', file);

        await fetch(`/api/admin/clients/${clientId}/updates`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: form,
        });
        closeModal();
        viewClient(clientId);
    }

    function sendMeeting(clientId, projectId) {
        modalTitle.textContent = 'Schedule Meeting';
        modalBody.innerHTML = `
            <div class="field"><label>Title</label><input id="sm-title" value="Kickoff Meeting"></div>
            <div class="field"><label>Google Meet Link</label><input id="sm-link" placeholder="https://meet.google.com/..."></div>
            <div class="field"><label>Date & Time</label><input type="datetime-local" id="sm-date"></div>
            <div class="field"><label>Duration</label><input id="sm-dur" value="30-60 mins"></div>
            <button class="btn-save" onclick="AdminApp.saveMeeting(${clientId},${projectId})">Send Meeting</button>`;
        modal.style.display = 'flex';
    }

    async function saveMeeting(clientId, projectId) {
        await api(`/api/admin/clients/${clientId}/meeting`, 'POST', {
            title: document.getElementById('sm-title').value,
            meet_link: document.getElementById('sm-link').value,
            meeting_date: document.getElementById('sm-date').value,
            duration: document.getElementById('sm-dur').value,
            project_id: projectId,
        });
        closeModal();
        viewClient(clientId);
    }

    function sendInvoice(clientId, projectId) {
        modalTitle.textContent = 'Create Invoice';
        modalBody.innerHTML = `
            <div class="field"><label>Due Date</label><input type="date" id="si-due"></div>
            <div class="field"><label>Payment Terms</label><input id="si-terms" value="Due on Receipt"></div>
            <div class="field"><label>Billing Period</label><input id="si-period" placeholder="e.g. Jun 2026"></div>
            <div id="si-items"><h4 style="margin-bottom:8px;">Line Items</h4></div>
            <button type="button" class="btn-sm btn-edit" onclick="AdminApp.addInvItem()" style="margin-bottom:12px;"><i class="fas fa-plus"></i> Add Item</button>
            <div class="field"><label>Notes</label><textarea id="si-notes" placeholder="Additional notes"></textarea></div>
            <button class="btn-save" onclick="AdminApp.saveInvoice(${clientId},${projectId})">Create Invoice</button>`;
        modal.style.display = 'flex';
        addInvItem(); // Add first item
    }

    let invItemCount = 0;
    function addInvItem() {
        invItemCount++;
        const div = document.createElement('div');
        div.style.cssText = 'display:grid;grid-template-columns:2fr 2fr 1fr 1fr;gap:8px;margin-bottom:8px;';
        div.innerHTML = `
            <input placeholder="Description" class="inv-desc" style="padding:8px;border:1px solid #ddd;border-radius:4px;font-size:.82rem;">
            <input placeholder="Deliverables" class="inv-del" style="padding:8px;border:1px solid #ddd;border-radius:4px;font-size:.82rem;">
            <input type="number" placeholder="Qty" value="1" class="inv-qty" style="padding:8px;border:1px solid #ddd;border-radius:4px;font-size:.82rem;">
            <input type="number" placeholder="Price" class="inv-price" style="padding:8px;border:1px solid #ddd;border-radius:4px;font-size:.82rem;">`;
        document.getElementById('si-items').appendChild(div);
    }

    async function saveInvoice(clientId, projectId) {
        const descs = document.querySelectorAll('.inv-desc');
        const dels = document.querySelectorAll('.inv-del');
        const qtys = document.querySelectorAll('.inv-qty');
        const prices = document.querySelectorAll('.inv-price');
        const items = [];
        let subtotal = 0;
        for (let i = 0; i < descs.length; i++) {
            const qty = parseInt(qtys[i].value) || 1;
            const price = parseFloat(prices[i].value) || 0;
            const amount = qty * price;
            subtotal += amount;
            items.push({ description: descs[i].value, deliverables: dels[i].value, qty, unit_price: price, amount });
        }
        await api(`/api/admin/clients/${clientId}/invoice`, 'POST', {
            project_id: projectId,
            due_date: document.getElementById('si-due').value || null,
            payment_terms: document.getElementById('si-terms').value,
            billing_period: document.getElementById('si-period').value,
            line_items: items,
            subtotal, tax_percent: 0, tax_amount: 0, total: subtotal,
            notes: document.getElementById('si-notes').value,
        });
        invItemCount = 0;
        closeModal();
        viewClient(clientId);
    }

    async function completeProject(clientId, projectId) {
        if (!confirm('Mark this project as completed? The client will see a completion page.')) return;
        const note = prompt('Completion note (optional):', 'Project successfully delivered.');
        await api(`/api/admin/clients/${clientId}/complete`, 'POST', { project_id: projectId, completion_note: note || '' });
        viewClient(clientId);
    }

    // ══════════════════════════════════════════════
    // COLD CALLS
    // ══════════════════════════════════════════════
    async function renderColdCalls() {
        try {
            const calls = await api('/api/admin/cold-calls');
            pageContent.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
                    <div style="display:flex; gap:8px;">
                        <button class="btn-add" onclick="AdminApp.addColdCall()"><i class="fas fa-plus"></i> Add Cold Call</button>
                        <input type="file" id="import-excel" accept=".xlsx, .xls, .csv" style="display:none;" onchange="AdminApp.handleExcelImport(event)">
                        <button class="btn-primary" onclick="document.getElementById('import-excel').click()" style="background:#10b981;"><i class="fas fa-file-excel"></i> Import Excel</button>
                    </div>
                    <button class="btn-primary" onclick="AdminApp.exportColdCallsPDF()" style="background:#dc2626;"><i class="fas fa-file-pdf"></i> Export to PDF</button>
                </div>
                <table class="data-table" id="cold-calls-table">
                    <thead><tr><th>Date</th><th>Business Name</th><th>Phone</th><th>Website?</th><th>Problem</th><th>Called?</th><th>Result</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${calls.map(c => `<tr>
                            <td>${new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                            <td><strong>${c.business_name}</strong></td>
                            <td>${c.phone_number || '-'}</td>
                            <td>${c.has_website ? '✅ Yes' : '❌ No'}</td>
                            <td><span class="badge" style="background:#f3f4f6;color:#374151;">${c.problem || '-'}</span></td>
                            <td>${c.is_called ? '✅ Yes' : '⏳ Pending'}</td>
                            <td>${c.result || '-'}</td>
                            <td>
                                <button class="btn-sm btn-edit" onclick='AdminApp.editColdCall(${JSON.stringify(c).replace(/'/g,"&#39;")})'>Edit</button>
                                <button class="btn-sm btn-delete" onclick="AdminApp.deleteColdCall(${c.id})" style="margin-left:4px;">Del</button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>`;
            // Store calls globally for PDF export
            window.currentColdCalls = calls;
        } catch (err) {
            pageContent.innerHTML = `<p style="color:#ef4444">${err.message}</p>`;
        }
    }

    function addColdCall() {
        editColdCall({ id: null, business_name: '', phone_number: '', has_website: false, problem: '', is_called: false, result: '' });
    }

    function editColdCall(c) {
        modalTitle.textContent = c.id ? 'Edit Cold Call' : 'Add Cold Call';
        modalBody.innerHTML = `
            <div class="field"><label>Business Name</label><input id="cc-name" value="${c.business_name}"></div>
            <div class="field"><label>Phone Number</label><input id="cc-phone" value="${c.phone_number || ''}"></div>
            <div class="field"><label>Has Website?</label>
                <select id="cc-web">
                    <option value="false" ${!c.has_website?'selected':''}>No</option>
                    <option value="true" ${c.has_website?'selected':''}>Yes</option>
                </select>
            </div>
            <div class="field"><label>Problem</label>
                <select id="cc-prob">
                    <option value="" ${!c.problem?'selected':''}>— Select Problem —</option>
                    <option value="no site" ${c.problem==='no site'?'selected':''}>No Site</option>
                    <option value="bad site" ${c.problem==='bad site'?'selected':''}>Bad Site</option>
                    <option value="no booking" ${c.problem==='no booking'?'selected':''}>No Booking System</option>
                    <option value="other" ${c.problem==='other'?'selected':''}>Other</option>
                </select>
            </div>
            <div class="field"><label>Is Called?</label>
                <select id="cc-called">
                    <option value="false" ${!c.is_called?'selected':''}>Pending</option>
                    <option value="true" ${c.is_called?'selected':''}>Yes</option>
                </select>
            </div>
            <div class="field"><label>Result / Notes</label><textarea id="cc-result">${c.result || ''}</textarea></div>
            <button class="btn-save" onclick="AdminApp.saveColdCall(${c.id})">Save</button>`;
        modal.style.display = 'flex';
    }

    async function saveColdCall(id) {
        const data = {
            business_name: document.getElementById('cc-name').value,
            phone_number: document.getElementById('cc-phone').value,
            has_website: document.getElementById('cc-web').value === 'true',
            problem: document.getElementById('cc-prob').value,
            is_called: document.getElementById('cc-called').value === 'true',
            result: document.getElementById('cc-result').value,
        };
        if (!data.business_name) return alert('Business name is required');

        if (id) { await api(`/api/admin/cold-calls/${id}`, 'PUT', data); }
        else { await api('/api/admin/cold-calls', 'POST', data); }
        closeModal();
        renderColdCalls();
    }

    async function deleteColdCall(id) {
        if (!confirm('Delete this cold call record?')) return;
        await api(`/api/admin/cold-calls/${id}`, 'DELETE');
        renderColdCalls();
    }

    function exportColdCallsPDF() {
        if (!window.currentColdCalls || window.currentColdCalls.length === 0) {
            return alert('No data to export!');
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(18);
        doc.text("Cold Calls Tracking - Pshetty Tech", 14, 20);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text("Generated on: " + new Date().toLocaleString('en-IN'), 14, 28);
        
        const tableBody = window.currentColdCalls.map(c => [
            new Date(c.created_at).toLocaleDateString('en-IN'),
            c.business_name,
            c.phone_number || '-',
            c.has_website ? 'Yes' : 'No',
            c.problem || '-',
            c.is_called ? 'Yes' : 'No',
            c.result || '-'
        ]);

        doc.autoTable({
            startY: 35,
            head: [['Date', 'Business Name', 'Phone Number', 'Website?', 'Problem', 'Called?', 'Result']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [255, 106, 0] }, // Pshetty Tech orange
            styles: { font: 'helvetica', fontSize: 10 },
            alternateRowStyles: { fillColor: [249, 250, 251] }
        });
        
        doc.save('Cold_Calls_Tracking.pdf');
    }

    async function handleExcelImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                if (rows.length < 2) return alert('Excel sheet seems empty or missing headers.');

                // Assume first row is header. Map standard columns.
                const headers = rows[0].map(h => String(h).toLowerCase().trim());
                
                const idxName = headers.findIndex(h => h.includes('name') || h.includes('business'));
                const idxPhone = headers.findIndex(h => h.includes('phone') || h.includes('contact'));
                const idxWeb = headers.findIndex(h => h.includes('website') || h.includes('site'));
                const idxProb = headers.findIndex(h => h.includes('problem') || h.includes('issue'));
                const idxCalled = headers.findIndex(h => h.includes('called') || h.includes('status'));
                const idxRes = headers.findIndex(h => h.includes('result') || h.includes('note'));

                if (idxName === -1) return alert('Could not find a "Business Name" column. Please ensure headers are present.');

                const calls = [];
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || !row[idxName]) continue; // Skip empty rows

                    const webVal = row[idxWeb] ? String(row[idxWeb]).toLowerCase() : 'no';
                    const calledVal = row[idxCalled] ? String(row[idxCalled]).toLowerCase() : 'no';

                    calls.push({
                        business_name: String(row[idxName]),
                        phone_number: row[idxPhone] ? String(row[idxPhone]) : '',
                        has_website: webVal.includes('yes') || webVal.includes('true') || webVal === 'y',
                        problem: row[idxProb] ? String(row[idxProb]) : '',
                        is_called: calledVal.includes('yes') || calledVal.includes('true') || calledVal === 'y',
                        result: row[idxRes] ? String(row[idxRes]) : ''
                    });
                }

                if (calls.length === 0) return alert('No valid records found to import.');

                // Send bulk to API
                const res = await api('/api/admin/cold-calls/bulk', 'POST', { calls });
                alert(`Successfully imported ${res.count} records!`);
                
                // Clear input and re-render
                event.target.value = '';
                renderColdCalls();
            } catch (err) {
                console.error(err);
                alert('Error parsing Excel file. Please ensure it is a valid .xlsx or .csv file.');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // ─── MODAL ───
    function closeModal() {
        modal.style.display = 'none';
    }

    // ─── START ───
    init();

    // ─── PUBLIC ───
    return {
        closeModal, editQuoteStatus, saveQuoteStatus, deleteQuote,
        addService, editService, saveService, deleteService,
        addProject, editProject, saveProject, deleteProject,
        addPricing, editPricing, savePricing, deletePricing,
        // Client management
        renderClients, showCreateClient, createClient, viewClient,
        assignProject, saveProject2, updateStage,
        postUpdate, saveUpdate,
        sendMeeting, saveMeeting,
        sendInvoice, addInvItem, saveInvoice,
        completeProject,
        // Cold Calls
        renderColdCalls, addColdCall, editColdCall, saveColdCall, deleteColdCall, exportColdCallsPDF, handleExcelImport
    };
})();
