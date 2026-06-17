// ═══════════════════════════════════════════════
// CLIENT DASHBOARD LOGIC
// ═══════════════════════════════════════════════
(function () {
    const API = '/api/client/portal';
    const headers = { 'Content-Type': 'application/json' };
    const content = document.getElementById('portal-content');
    let dashData = null;

    // ─── User Info ───
    const clientData = JSON.parse(localStorage.getItem('client_data') || '{}');
    document.getElementById('user-name').textContent = clientData.full_name || clientData.username || 'Client';
    document.getElementById('user-avatar').textContent = (clientData.full_name || 'C')[0].toUpperCase();

    // ─── Logout ───
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await fetch('/api/client/logout', { method: 'POST' });
        } catch(e) {}
        localStorage.removeItem('client_data');
        window.location.href = '/client/';
    });

    // ─── Notifications ───
    const bell = document.getElementById('notif-bell');
    const dropdown = document.getElementById('notif-dropdown');
    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
    dropdown.addEventListener('click', (e) => e.stopPropagation());

    document.getElementById('mark-all-read').addEventListener('click', async () => {
        await fetch(`${API}/notifications/read-all`, { method: 'PATCH', headers, credentials: 'include' });
        document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
        document.getElementById('notif-count').style.display = 'none';
    });

    // ─── Sidebar Navigation ───
    document.getElementById('nav-project').addEventListener('click', (e) => { e.preventDefault(); renderProject(); setActive(e.target); });
    document.getElementById('nav-updates').addEventListener('click', (e) => { e.preventDefault(); renderUpdates(); setActive(e.target); });
    document.getElementById('nav-meetings').addEventListener('click', (e) => { e.preventDefault(); renderMeetings(); setActive(e.target); });
    document.getElementById('nav-invoices').addEventListener('click', (e) => { e.preventDefault(); renderInvoices(); setActive(e.target); });

    function setActive(el) {
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        const link = el.closest('.sidebar-link');
        if (link) link.classList.add('active');
    }

    // ─── Load Dashboard ───
    async function loadDashboard() {
        try {
            const res = await fetch(`${API}/dashboard`, { headers, credentials: 'include' });
            if (res.status === 401) { window.location.href = '/client/'; return; }
            dashData = await res.json();

            renderNotifications(dashData.notifications, dashData.unreadCount);

            // Check for unseen meeting popup
            const unseenMeeting = dashData.meetings.find(m => !m.is_seen);
            if (unseenMeeting) {
                window.location.href = `/client/meeting.html?id=${unseenMeeting.id}`;
                return;
            }

            // Check for unseen invoice popup
            const unseenInvoice = dashData.invoices.find(i => !i.is_seen);
            if (unseenInvoice) {
                window.location.href = `/client/invoice.html?id=${unseenInvoice.id}`;
                return;
            }

            // Check for completion
            if (dashData.project && dashData.project.status === 'completed') {
                const completionNotif = dashData.notifications.find(n => n.type === 'completion' && !n.is_read);
                if (completionNotif) {
                    window.location.href = '/client/completion.html';
                    return;
                }
            }

            renderDashboard();
        } catch (err) {
            console.error('Dashboard load error:', err);
            content.innerHTML = '<div style="text-align:center;padding:80px;color:var(--danger);"><i class="fas fa-exclamation-circle" style="font-size:2rem;"></i><p style="margin-top:12px;">Failed to load dashboard. Please try again.</p></div>';
        }
    }

    // ─── Render Functions ───
    function renderNotifications(notifs, unread) {
        const countEl = document.getElementById('notif-count');
        if (unread > 0) { countEl.textContent = unread; countEl.style.display = 'flex'; }
        else { countEl.style.display = 'none'; }

        const list = document.getElementById('notif-list');
        if (!notifs.length) { list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-light);font-size:.84rem;">No notifications yet</div>'; return; }

        const iconMap = { meeting: 'fa-video', invoice: 'fa-file-invoice', update: 'fa-arrow-up', stage: 'fa-flag', completion: 'fa-trophy', contract: 'fa-file-contract', project: 'fa-project-diagram' };

        list.innerHTML = notifs.slice(0, 15).map(n => `
            <div class="notif-item ${n.is_read ? '' : 'unread'}" onclick="window.location.href='${n.link || '#'}'">
                <div class="notif-icon ${n.type}"><i class="fas ${iconMap[n.type] || 'fa-bell'}"></i></div>
                <div class="notif-text">
                    <div class="ntitle">${n.title}</div>
                    <div class="nmsg">${n.message || ''}</div>
                    <div class="ntime">${timeAgo(n.created_at)}</div>
                </div>
            </div>
        `).join('');
    }

    function renderDashboard() {
        const p = dashData.project;
        const stages = dashData.stages;
        const completedStages = stages.filter(s => s.status === 'completed').length;
        const totalProgress = stages.length ? Math.round((completedStages / stages.length) * 100) : 0;

        content.innerHTML = `
            <!-- Stats -->
            <div class="stats-row">
                <div class="stat-card">
                    <div class="label">Project Status</div>
                    <div class="value" style="font-size:1.3rem;color:${p ? (p.status === 'completed' ? 'var(--success)' : 'var(--accent)') : 'var(--text-light)'};">${p ? p.status.replace('_', ' ').toUpperCase() : 'No Project'}</div>
                    <div class="sub">${p ? p.title : '—'}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Overall Progress</div>
                    <div class="value">${totalProgress}%</div>
                    <div class="sub">${completedStages}/${stages.length} stages done</div>
                </div>
                <div class="stat-card">
                    <div class="label">Updates</div>
                    <div class="value">${dashData.updates.length}</div>
                    <div class="sub">Work updates posted</div>
                </div>
                <div class="stat-card">
                    <div class="label">Invoices</div>
                    <div class="value">${dashData.invoices.length}</div>
                    <div class="sub">${dashData.invoices.filter(i => i.status === 'unpaid').length} unpaid</div>
                </div>
            </div>

            <!-- Project Stages -->
            <div class="card" style="margin-bottom:24px;">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-project-diagram" style="color:var(--accent);margin-right:8px;"></i> Project Stages</div>
                </div>
                ${stages.length ? `<div class="stages-list">${stages.map(s => stageHTML(s)).join('')}</div>` : '<p style="color:var(--text-muted);font-size:.88rem;">No project stages assigned yet.</p>'}
            </div>

            <!-- Recent Updates -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-stream" style="color:var(--accent);margin-right:8px;"></i> Recent Updates</div>
                </div>
                ${dashData.updates.length ? `<div class="timeline">${dashData.updates.slice(0, 8).map(u => updateHTML(u)).join('')}</div>` : '<p style="color:var(--text-muted);font-size:.88rem;">No updates yet. Your team will post updates as work progresses.</p>'}
            </div>
        `;
    }

    function renderProject() {
        document.getElementById('page-title').textContent = 'Project';
        const p = dashData.project;
        if (!p) { content.innerHTML = '<div style="text-align:center;padding:80px;color:var(--text-muted);"><i class="fas fa-folder-open" style="font-size:2rem;color:var(--accent);"></i><p style="margin-top:12px;">No project assigned yet.</p></div>'; return; }

        const stages = dashData.stages;
        content.innerHTML = `
            <div class="card" style="margin-bottom:24px;">
                <h2 style="font-family:var(--font-display);font-weight:800;font-size:1.3rem;margin-bottom:8px;">${p.title}</h2>
                <p style="color:var(--text-muted);margin-bottom:16px;">${p.description || ''}</p>
                <div style="display:flex;gap:24px;flex-wrap:wrap;">
                    <div><span style="font-size:.72rem;color:var(--text-light);text-transform:uppercase;letter-spacing:.1em;">Type</span><br><strong>${p.project_type || '—'}</strong></div>
                    <div><span style="font-size:.72rem;color:var(--text-light);text-transform:uppercase;letter-spacing:.1em;">Price</span><br><strong style="color:var(--accent);">₹${p.total_price ? Number(p.total_price).toLocaleString('en-IN') : '—'}</strong></div>
                    <div><span style="font-size:.72rem;color:var(--text-light);text-transform:uppercase;letter-spacing:.1em;">Timeline</span><br><strong>${p.timeline || '—'}</strong></div>
                    <div><span style="font-size:.72rem;color:var(--text-light);text-transform:uppercase;letter-spacing:.1em;">Status</span><br><strong style="color:${p.status === 'completed' ? 'var(--success)' : 'var(--accent)'};">${p.status.toUpperCase()}</strong></div>
                </div>
            </div>
            <div class="card">
                <div class="card-title" style="margin-bottom:16px;">Stages</div>
                <div class="stages-list">${stages.map(s => stageHTML(s)).join('')}</div>
            </div>
        `;
    }

    function renderUpdates() {
        document.getElementById('page-title').textContent = 'Work Updates';
        if (!dashData.updates.length) {
            content.innerHTML = '<div style="text-align:center;padding:80px;color:var(--text-muted);"><i class="fas fa-stream" style="font-size:2rem;color:var(--accent);"></i><p style="margin-top:12px;">No updates yet.</p></div>';
            return;
        }
        content.innerHTML = `<div class="card"><div class="timeline">${dashData.updates.map(u => updateHTML(u)).join('')}</div></div>`;
    }

    function renderMeetings() {
        document.getElementById('page-title').textContent = 'Meetings';
        if (!dashData.meetings.length) {
            content.innerHTML = '<div style="text-align:center;padding:80px;color:var(--text-muted);"><i class="fas fa-video" style="font-size:2rem;color:var(--accent);"></i><p style="margin-top:12px;">No meetings scheduled yet.</p></div>';
            return;
        }
        content.innerHTML = dashData.meetings.map(m => `
            <div class="card" style="margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div>
                        <h3 style="font-family:var(--font-display);font-weight:700;font-size:1.1rem;margin-bottom:4px;">${m.title}</h3>
                        <p style="font-size:.82rem;color:var(--text-muted);">${m.meeting_date ? new Date(m.meeting_date).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }) : 'Date TBD'}</p>
                        <p style="font-size:.78rem;color:var(--text-light);margin-top:4px;">Duration: ${m.duration}</p>
                    </div>
                    <a href="/client/meeting.html?id=${m.id}" class="btn btn-primary btn-sm"><i class="fas fa-external-link-alt"></i> View Details</a>
                </div>
            </div>
        `).join('');
    }

    function renderInvoices() {
        document.getElementById('page-title').textContent = 'Invoices';
        if (!dashData.invoices.length) {
            content.innerHTML = '<div style="text-align:center;padding:80px;color:var(--text-muted);"><i class="fas fa-file-invoice-dollar" style="font-size:2rem;color:var(--accent);"></i><p style="margin-top:12px;">No invoices yet.</p></div>';
            return;
        }
        content.innerHTML = `<div class="card">
            <table class="invoice-table">
                <thead><tr><th>Invoice</th><th>Date</th><th>Due</th><th>Amount</th><th>Status</th><th></th></tr></thead>
                <tbody>${dashData.invoices.map(i => `
                    <tr>
                        <td style="font-weight:600;">${i.invoice_number}</td>
                        <td>${new Date(i.invoice_date).toLocaleDateString('en-IN')}</td>
                        <td>${i.due_date ? new Date(i.due_date).toLocaleDateString('en-IN') : '—'}</td>
                        <td style="font-weight:700;color:var(--accent);">₹${Number(i.total).toLocaleString('en-IN')}</td>
                        <td><span class="stage-status ${i.status === 'paid' ? 'completed' : 'in-progress'}">${i.status}</span></td>
                        <td><a href="/client/invoice.html?id=${i.id}" class="btn btn-outline btn-sm">View</a></td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>`;
    }

    // ─── Helpers ───
    function stageHTML(s) {
        const statusClass = s.status === 'completed' ? 'completed' : s.status === 'in_progress' ? 'in-progress' : 'not-started';
        const iconClass = s.status === 'completed' ? 'fa-check' : s.status === 'in_progress' ? 'fa-play' : 'fa-circle';
        const prog = s.progress || 0;
        const progClass = prog >= 80 ? 'high' : prog >= 40 ? 'mid' : 'low';
        return `
            <div class="stage-item ${statusClass}">
                <div class="stage-icon ${s.status.replace('_', '-')}"><i class="fas ${iconClass}"></i></div>
                <div class="stage-info">
                    <div class="stage-name">${s.name}</div>
                    <div class="stage-desc">${s.description || ''}</div>
                </div>
                <div class="stage-progress">
                    <div class="progress-bar"><div class="progress-fill ${progClass}" style="width:${prog}%"></div></div>
                    <div style="font-size:.65rem;color:var(--text-light);margin-top:4px;text-align:right;">${prog}%</div>
                </div>
                <span class="stage-status ${statusClass}">${s.status.replace('_', ' ')}</span>
            </div>
        `;
    }

    function updateHTML(u) {
        return `
            <div class="timeline-item update">
                <div class="time">${timeAgo(u.created_at)}</div>
                <div class="title">${u.title || 'Update'}</div>
                <div class="desc">${u.description || ''}</div>
                ${u.image_url ? `<img src="${u.image_url}" alt="${u.title || 'Screenshot'}" loading="lazy">` : ''}
            </div>
        `;
    }

    function timeAgo(date) {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString('en-IN');
    }

    // ─── Init ───
    loadDashboard();
})();
