const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { query } = require('../config/db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// ─── BRUTE-FORCE PROTECTION ───
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per `window`
    message: { error: 'Too many login attempts, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── LOGIN ───
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

        const result = await query('SELECT * FROM admins WHERE username = $1', [username]);
        if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

        const admin = result.rows[0];
        const valid = await bcrypt.compare(password, admin.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: admin.id, username: admin.username, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Send HttpOnly Cookie instead of raw JSON token
        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        res.json({ success: true, username: admin.username });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ─── LOGOUT ───
router.post('/logout', (req, res) => {
    res.clearCookie('admin_token');
    res.json({ success: true, message: 'Logged out successfully' });
});

// ─── DASHBOARD STATS ───
router.get('/dashboard', auth, async (req, res) => {
    try {
        const quotes = await query('SELECT COUNT(*) as count FROM quotes');
        const pending = await query("SELECT COUNT(*) as count FROM quotes WHERE status = 'pending'");
        const services = await query('SELECT COUNT(*) as count FROM services WHERE is_active = true');
        const projects = await query('SELECT COUNT(*) as count FROM projects WHERE is_active = true');
        const clients = await query('SELECT COUNT(*) as count FROM clients WHERE is_active = true');

        res.json({
            totalQuotes: parseInt(quotes.rows[0].count),
            pendingQuotes: parseInt(pending.rows[0].count),
            activeServices: parseInt(services.rows[0].count),
            activeProjects: parseInt(projects.rows[0].count),
            activeClients: parseInt(clients.rows[0].count),
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});

// ══════════════════════════════════════════════
// QUOTES MANAGEMENT
// ══════════════════════════════════════════════
router.get('/quotes', auth, async (req, res) => {
    try {
        const result = await query('SELECT * FROM quotes ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch quotes' }); }
});

router.patch('/quotes/:id', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const result = await query('UPDATE quotes SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Failed to update quote' }); }
});

router.delete('/quotes/:id', auth, async (req, res) => {
    try {
        await query('DELETE FROM quotes WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to delete quote' }); }
});

// ══════════════════════════════════════════════
// SERVICES CRUD
// ══════════════════════════════════════════════
router.get('/services', auth, async (req, res) => {
    try {
        const result = await query('SELECT * FROM services ORDER BY display_order ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch services' }); }
});

router.post('/services', auth, async (req, res) => {
    try {
        const { category, title, description, icon, features, display_order } = req.body;
        const result = await query(
            'INSERT INTO services (category, title, description, icon, features, display_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [category, title, description, icon || 'code', JSON.stringify(features || []), display_order || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Failed to create service' }); }
});

router.put('/services/:id', auth, async (req, res) => {
    try {
        const { category, title, description, icon, features, display_order, is_active } = req.body;
        const result = await query(
            'UPDATE services SET category=$1, title=$2, description=$3, icon=$4, features=$5, display_order=$6, is_active=$7 WHERE id=$8 RETURNING *',
            [category, title, description, icon, JSON.stringify(features || []), display_order, is_active, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Failed to update service' }); }
});

router.delete('/services/:id', auth, async (req, res) => {
    try { await query('DELETE FROM services WHERE id = $1', [req.params.id]); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: 'Failed to delete service' }); }
});

// ══════════════════════════════════════════════
// PROJECTS CRUD (portfolio showcase)
// ══════════════════════════════════════════════
router.get('/projects', auth, async (req, res) => {
    try {
        const result = await query('SELECT * FROM projects ORDER BY display_order ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch projects' }); }
});

router.post('/projects', auth, async (req, res) => {
    try {
        const { title, client_name, description, category, features, image_url, display_order } = req.body;
        const result = await query(
            'INSERT INTO projects (title, client_name, description, category, features, image_url, display_order) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [title, client_name, description, category, JSON.stringify(features || []), image_url, display_order || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Failed to create project' }); }
});

router.put('/projects/:id', auth, async (req, res) => {
    try {
        const { title, client_name, description, category, features, image_url, display_order, is_active } = req.body;
        const result = await query(
            'UPDATE projects SET title=$1, client_name=$2, description=$3, category=$4, features=$5, image_url=$6, display_order=$7, is_active=$8 WHERE id=$9 RETURNING *',
            [title, client_name, description, category, JSON.stringify(features || []), image_url, display_order, is_active, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Failed to update project' }); }
});

router.delete('/projects/:id', auth, async (req, res) => {
    try { await query('DELETE FROM projects WHERE id = $1', [req.params.id]); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: 'Failed to delete project' }); }
});

// ══════════════════════════════════════════════
// PRICING CRUD
// ══════════════════════════════════════════════
router.get('/pricing', auth, async (req, res) => {
    try {
        const result = await query('SELECT * FROM pricing ORDER BY price ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch pricing' }); }
});

router.post('/pricing', auth, async (req, res) => {
    try {
        const { tier, name, description, price, features, plan_type, is_popular } = req.body;
        const result = await query(
            'INSERT INTO pricing (tier, name, description, price, features, plan_type, is_popular) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [tier, name, description, price, JSON.stringify(features || []), plan_type || 'one-time', is_popular || false]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Failed to create pricing' }); }
});

router.put('/pricing/:id', auth, async (req, res) => {
    try {
        const { tier, name, description, price, features, plan_type, is_popular, is_active } = req.body;
        const result = await query(
            'UPDATE pricing SET tier=$1, name=$2, description=$3, price=$4, features=$5, plan_type=$6, is_popular=$7, is_active=$8 WHERE id=$9 RETURNING *',
            [tier, name, description, price, JSON.stringify(features || []), plan_type, is_popular, is_active, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Failed to update pricing' }); }
});

router.delete('/pricing/:id', auth, async (req, res) => {
    try { await query('DELETE FROM pricing WHERE id = $1', [req.params.id]); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: 'Failed to delete pricing' }); }
});

// ══════════════════════════════════════════════════════════
// CLIENT MANAGEMENT — The core of the portal system
// ══════════════════════════════════════════════════════════

// ─── List Clients ───
router.get('/clients', auth, async (req, res) => {
    try {
        const result = await query(`
            SELECT c.id, c.username, c.full_name, c.email, c.phone, c.company_name,
                   c.contract_signed, c.first_login_complete, c.is_active, c.last_login, c.created_at,
                   q.project_type, q.estimated_price,
                   cp.title as project_title, cp.status as project_status
            FROM clients c
            LEFT JOIN quotes q ON c.quote_id = q.id
            LEFT JOIN client_projects cp ON cp.client_id = c.id
            ORDER BY c.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch clients' }); }
});

// ─── Get Single Client Detail ───
router.get('/clients/:id', auth, async (req, res) => {
    try {
        const client = await query(`
            SELECT c.*, q.project_type, q.estimated_price, q.estimated_timeline, q.description as quote_description
            FROM clients c LEFT JOIN quotes q ON c.quote_id = q.id WHERE c.id = $1
        `, [req.params.id]);
        if (!client.rows.length) return res.status(404).json({ error: 'Client not found' });

        const project = await query('SELECT * FROM client_projects WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1', [req.params.id]);
        let stages = [], updates = [];
        if (project.rows.length) {
            stages = (await query('SELECT * FROM project_stages WHERE project_id = $1 ORDER BY stage_order ASC', [project.rows[0].id])).rows;
            updates = (await query('SELECT * FROM project_updates WHERE project_id = $1 ORDER BY created_at DESC', [project.rows[0].id])).rows;
        }
        const meetings = (await query('SELECT * FROM meetings WHERE client_id = $1 ORDER BY created_at DESC', [req.params.id])).rows;
        const invoices = (await query('SELECT * FROM invoices WHERE client_id = $1 ORDER BY created_at DESC', [req.params.id])).rows;
        const contract = (await query('SELECT id, signed_at, client_full_name, client_business_name, client_business_address, ip_address, signature_data FROM client_contracts WHERE client_id = $1', [req.params.id])).rows;

        const cl = client.rows[0];
        delete cl.password_hash;

        res.json({ client: cl, project: project.rows[0] || null, stages, updates, meetings, invoices, contract: contract[0] || null });
    } catch (err) {
        console.error('Client detail error:', err);
        res.status(500).json({ error: 'Failed to fetch client' });
    }
});

// ─── CREATE CLIENT from quote ───
router.post('/clients', auth, async (req, res) => {
    try {
        const { quote_id } = req.body;
        if (!quote_id) return res.status(400).json({ error: 'quote_id required' });

        // Get quote data
        const quote = await query('SELECT * FROM quotes WHERE id = $1', [quote_id]);
        if (!quote.rows.length) return res.status(404).json({ error: 'Quote not found' });
        const q = quote.rows[0];

        // Generate credentials
        const namePart = q.name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8) || 'client';
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const username = `${namePart}${randomSuffix}`;
        const plainPassword = crypto.randomBytes(4).toString('hex') + Math.floor(10 + Math.random() * 90);
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        // Create client
        const result = await query(
            `INSERT INTO clients (quote_id, username, password_hash, full_name, email, phone, company_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, full_name, email`,
            [quote_id, username, passwordHash, q.name, q.email, q.phone, q.company_name]
        );

        // Update quote status
        await query("UPDATE quotes SET status = 'converted' WHERE id = $1", [quote_id]);

        // Send welcome email immediately with credentials
        let emailSent = false;
        try {
            const emailService = require('../services/emailService');
            await emailService.sendWelcomeEmail(q.email, q.name, username, plainPassword);
            emailSent = true;
            console.log(`✅ Welcome email sent to ${q.email}`);
        } catch (emailErr) {
            console.error(`❌ Welcome email failed for ${q.email}:`, emailErr.message);
        }

        // Return plaintext credentials so admin can copy-paste
        res.status(201).json({
            success: true,
            client: result.rows[0],
            emailSent,
            credentials: {
                username,
                password: plainPassword,
                login_url: `${req.protocol}://${req.get('host')}/client/`,
            },
            message: emailSent
                ? 'Client created! Credentials have been emailed to the client.'
                : 'Client created! Email failed — copy credentials below and share manually.',
        });
    } catch (err) {
        console.error('Create client error:', err);
        if (err.code === '23505') return res.status(400).json({ error: 'Client already exists for this quote' });
        res.status(500).json({ error: 'Failed to create client' });
    }
});

// ─── ASSIGN PROJECT + STAGES ───
router.post('/clients/:id/project', auth, async (req, res) => {
    try {
        const { title, description, project_type, total_price, timeline, stages } = req.body;
        const clientId = req.params.id;

        const project = await query(
            `INSERT INTO client_projects (client_id, title, description, project_type, total_price, timeline)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [clientId, title, description, project_type, total_price, timeline]
        );

        const projId = project.rows[0].id;
        const defaultStages = stages || [
            { name: 'Planning', description: 'Requirement gathering and project planning' },
            { name: 'UI/UX Design', description: 'Wireframing and visual design' },
            { name: 'Development', description: 'Building the application' },
            { name: 'Testing', description: 'Quality assurance and bug fixes' },
            { name: 'Deployment', description: 'Launch and delivery' },
        ];

        for (let i = 0; i < defaultStages.length; i++) {
            await query(
                'INSERT INTO project_stages (project_id, name, description, stage_order) VALUES ($1,$2,$3,$4)',
                [projId, defaultStages[i].name, defaultStages[i].description, i + 1]
            );
        }

        // Notification
        await query(
            `INSERT INTO notifications (client_id, type, title, message, link) VALUES ($1, 'project', 'Project Assigned', $2, '/client/dashboard.html')`,
            [clientId, `Your project "${title}" has been created with ${defaultStages.length} stages.`]
        );

        const stagesResult = await query('SELECT * FROM project_stages WHERE project_id = $1 ORDER BY stage_order', [projId]);
        res.status(201).json({ project: project.rows[0], stages: stagesResult.rows });
    } catch (err) {
        console.error('Assign project error:', err);
        res.status(500).json({ error: 'Failed to assign project' });
    }
});

// ─── UPDATE STAGE ───
router.patch('/clients/:id/stages/:stageId', auth, async (req, res) => {
    try {
        const { status, progress } = req.body;
        const updates = [];
        const vals = [];
        let idx = 1;

        if (status) { updates.push(`status = $${idx++}`); vals.push(status); }
        if (progress !== undefined) { updates.push(`progress = $${idx++}`); vals.push(progress); }
        if (status === 'in_progress') { updates.push(`started_at = COALESCE(started_at, NOW())`); }
        if (status === 'completed') { updates.push(`completed_at = NOW()`); updates.push(`progress = 100`); }

        vals.push(req.params.stageId);
        await query(`UPDATE project_stages SET ${updates.join(', ')} WHERE id = $${idx}`, vals);

        // Get stage name for notification
        const stage = await query('SELECT name FROM project_stages WHERE id = $1', [req.params.stageId]);
        const stageName = stage.rows[0]?.name || 'Stage';

        // Notification
        if (status === 'completed') {
            await query(
                `INSERT INTO notifications (client_id, type, title, message, link) VALUES ($1, 'stage', 'Stage Completed', $2, '/client/dashboard.html')`,
                [req.params.id, `"${stageName}" stage has been completed!`]
            );
        } else if (status === 'in_progress') {
            await query(
                `INSERT INTO notifications (client_id, type, title, message, link) VALUES ($1, 'stage', 'Stage Started', $2, '/client/dashboard.html')`,
                [req.params.id, `Work on "${stageName}" has started.`]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Stage update error:', err);
        res.status(500).json({ error: 'Failed to update stage' });
    }
});

// ─── POST WORK UPDATE (with screenshot) ───
router.post('/clients/:id/updates', auth, upload.single('screenshot'), async (req, res) => {
    try {
        const { title, description, project_id } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        await query(
            'INSERT INTO project_updates (project_id, title, description, image_url) VALUES ($1,$2,$3,$4)',
            [project_id, title, description, imageUrl]
        );

        // Notification
        await query(
            `INSERT INTO notifications (client_id, type, title, message, link) VALUES ($1, 'update', 'New Update', $2, '/client/dashboard.html')`,
            [req.params.id, title || 'A new work update has been posted.']
        );

        res.status(201).json({ success: true });
    } catch (err) {
        console.error('Update post error:', err);
        res.status(500).json({ error: 'Failed to post update' });
    }
});

// ─── SEND KICKOFF MEETING ───
router.post('/clients/:id/meeting', auth, async (req, res) => {
    try {
        const { title, meet_link, meeting_date, duration, agenda, instructions, project_id } = req.body;

        const result = await query(
            `INSERT INTO meetings (client_id, project_id, title, meet_link, meeting_date, duration, agenda, instructions)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [req.params.id, project_id, title || 'Kickoff Meeting', meet_link, meeting_date, duration || '30-60 mins',
             JSON.stringify(agenda || []), instructions]
        );

        // Notification
        await query(
            `INSERT INTO notifications (client_id, type, title, message, link) VALUES ($1, 'meeting', 'Meeting Scheduled', $2, $3)`,
            [req.params.id, `A ${title || 'kickoff meeting'} has been scheduled.`, `/client/meeting.html?id=${result.rows[0].id}`]
        );

        // Try email
        try {
            const client = await query('SELECT email, full_name FROM clients WHERE id = $1', [req.params.id]);
            const emailService = require('../services/emailService');
            await emailService.sendMeetingEmail(client.rows[0].email, client.rows[0].full_name, meet_link, meeting_date);
        } catch (e) { console.log('Meeting email failed'); }

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Meeting error:', err);
        res.status(500).json({ error: 'Failed to create meeting' });
    }
});

// ─── CREATE INVOICE ───
router.post('/clients/:id/invoice', auth, async (req, res) => {
    try {
        const { project_id, due_date, payment_terms, billing_period, line_items, subtotal, tax_percent, tax_amount, total, payment_details, notes } = req.body;

        // Generate invoice number
        const count = await query('SELECT COUNT(*) as count FROM invoices');
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(parseInt(count.rows[0].count) + 1).padStart(4, '0')}`;

        const result = await query(
            `INSERT INTO invoices (client_id, project_id, invoice_number, due_date, payment_terms, billing_period, line_items, subtotal, tax_percent, tax_amount, total, payment_details, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
            [req.params.id, project_id, invoiceNumber, due_date, payment_terms || 'Due on Receipt',
             billing_period, JSON.stringify(line_items || []), subtotal || 0, tax_percent || 0, tax_amount || 0, total || 0,
             JSON.stringify(payment_details || {}), notes]
        );

        // Notification
        await query(
            `INSERT INTO notifications (client_id, type, title, message, link) VALUES ($1, 'invoice', 'New Invoice', $2, $3)`,
            [req.params.id, `Invoice ${invoiceNumber} for ₹${Number(total || 0).toLocaleString('en-IN')} has been generated.`,
             `/client/invoice.html?id=${result.rows[0].id}`]
        );

        // Try email
        try {
            const client = await query('SELECT email, full_name FROM clients WHERE id = $1', [req.params.id]);
            const emailService = require('../services/emailService');
            await emailService.sendInvoiceEmail(client.rows[0].email, client.rows[0].full_name, invoiceNumber, total);
        } catch (e) { console.log('Invoice email failed'); }

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Invoice error:', err);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

// ─── MARK PROJECT COMPLETE ───
router.post('/clients/:id/complete', auth, async (req, res) => {
    try {
        const { project_id, completion_note } = req.body;

        await query(
            "UPDATE client_projects SET status = 'completed', completion_note = $2, completed_at = NOW() WHERE id = $1",
            [project_id, completion_note || 'Project successfully delivered.']
        );

        // Complete all remaining stages
        await query(
            "UPDATE project_stages SET status = 'completed', progress = 100, completed_at = COALESCE(completed_at, NOW()) WHERE project_id = $1 AND status != 'completed'",
            [project_id]
        );

        // Notification
        await query(
            `INSERT INTO notifications (client_id, type, title, message, link) VALUES ($1, 'completion', 'Project Completed! 🎉', 'Your project has been completed! Thank you for working with us.', '/client/completion.html')`,
            [req.params.id]
        );

        // Try email
        try {
            const client = await query('SELECT email, full_name FROM clients WHERE id = $1', [req.params.id]);
            const emailService = require('../services/emailService');
            await emailService.sendCompletionEmail(client.rows[0].email, client.rows[0].full_name);
        } catch (e) { console.log('Completion email failed'); }

        res.json({ success: true });
    } catch (err) {
        console.error('Completion error:', err);
        res.status(500).json({ error: 'Failed to mark complete' });
    }
});

// ─── CLIENT ACTIVITY ───
router.get('/clients/:id/activity', auth, async (req, res) => {
    try {
        const client = await query('SELECT last_login, created_at FROM clients WHERE id = $1', [req.params.id]);
        const contract = await query('SELECT signed_at FROM client_contracts WHERE client_id = $1', [req.params.id]);
        res.json({
            last_login: client.rows[0]?.last_login,
            account_created: client.rows[0]?.created_at,
            contract_signed: contract.rows[0]?.signed_at,
        });
    } catch (err) { res.status(500).json({ error: 'Failed to fetch activity' }); }
});
// ══════════════════════════════════════════════
// COLD CALLS CRUD
// ══════════════════════════════════════════════
router.get('/cold-calls', auth, async (req, res) => {
    try {
        const result = await query('SELECT * FROM cold_calls ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch cold calls' }); }
});

router.post('/cold-calls', auth, async (req, res) => {
    try {
        const { business_name, phone_number, has_website, problem, is_called, result: call_result } = req.body;
        const result = await query(
            'INSERT INTO cold_calls (business_name, phone_number, has_website, problem, is_called, result) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [business_name, phone_number, has_website || false, problem, is_called || false, call_result]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Failed to create cold call' }); }
});

router.post('/cold-calls/bulk', auth, async (req, res) => {
    try {
        const { calls } = req.body;
        if (!calls || !Array.isArray(calls)) return res.status(400).json({ error: 'Invalid data format' });

        for (const call of calls) {
            await query(
                'INSERT INTO cold_calls (business_name, phone_number, has_website, problem, is_called, result) VALUES ($1,$2,$3,$4,$5,$6)',
                [call.business_name, call.phone_number, call.has_website || false, call.problem, call.is_called || false, call.result]
            );
        }
        res.status(201).json({ success: true, count: calls.length });
    } catch (err) {
        console.error('Bulk import error:', err);
        res.status(500).json({ error: 'Failed to import cold calls' });
    }
});

router.put('/cold-calls/:id', auth, async (req, res) => {
    try {
        const { business_name, phone_number, has_website, problem, is_called, result: call_result } = req.body;
        const result = await query(
            'UPDATE cold_calls SET business_name=$1, phone_number=$2, has_website=$3, problem=$4, is_called=$5, result=$6 WHERE id=$7 RETURNING *',
            [business_name, phone_number, has_website, problem, is_called, call_result, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Failed to update cold call' }); }
});

router.delete('/cold-calls/:id', auth, async (req, res) => {
    try {
        await query('DELETE FROM cold_calls WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to delete cold call' }); }
});

module.exports = router;
