const router = require('express').Router();
const { query } = require('../config/db');
const { clientAuth } = require('./client-auth');

// All routes require client auth
router.use(clientAuth);

// ─── DASHBOARD ───
router.get('/dashboard', async (req, res) => {
    try {
        const clientId = req.client.id;

        // Get client info
        const client = await query(
            'SELECT id, full_name, email, company_name, contract_signed, first_login_complete FROM clients WHERE id = $1',
            [clientId]
        );

        // Get active project
        const project = await query(
            'SELECT * FROM client_projects WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1',
            [clientId]
        );

        let stages = [], updates = [];
        if (project.rows.length) {
            const projId = project.rows[0].id;
            stages = (await query('SELECT * FROM project_stages WHERE project_id = $1 ORDER BY stage_order ASC', [projId])).rows;
            updates = (await query('SELECT * FROM project_updates WHERE project_id = $1 ORDER BY created_at DESC LIMIT 20', [projId])).rows;
        }

        // Get meetings
        const meetings = (await query(
            'SELECT * FROM meetings WHERE client_id = $1 ORDER BY created_at DESC', [clientId]
        )).rows;

        // Get invoices
        const invoices = (await query(
            'SELECT id, invoice_number, invoice_date, due_date, total, status, is_seen FROM invoices WHERE client_id = $1 ORDER BY created_at DESC', [clientId]
        )).rows;

        // Get unread notifications
        const notifications = (await query(
            'SELECT * FROM notifications WHERE client_id = $1 ORDER BY created_at DESC LIMIT 30', [clientId]
        )).rows;

        const unreadCount = notifications.filter(n => !n.is_read).length;

        res.json({
            client: client.rows[0],
            project: project.rows[0] || null,
            stages,
            updates,
            meetings,
            invoices,
            notifications,
            unreadCount,
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});

// ─── GET CONTRACT ───
router.get('/contract', async (req, res) => {
    try {
        const clientId = req.client.id;

        // Get client + quote data
        const client = await query(
            `SELECT c.*, q.project_type, q.estimated_price, q.estimated_timeline, q.description as project_description
             FROM clients c LEFT JOIN quotes q ON c.quote_id = q.id WHERE c.id = $1`,
            [clientId]
        );
        if (!client.rows.length) return res.status(404).json({ error: 'Client not found' });

        // Check if already signed
        const existing = await query('SELECT id, signed_at FROM client_contracts WHERE client_id = $1', [clientId]);

        res.json({
            client: {
                full_name: client.rows[0].full_name,
                email: client.rows[0].email,
                phone: client.rows[0].phone,
                company_name: client.rows[0].company_name,
            },
            project: {
                type: client.rows[0].project_type,
                price: client.rows[0].estimated_price,
                timeline: client.rows[0].estimated_timeline,
                description: client.rows[0].project_description,
            },
            already_signed: existing.rows.length > 0,
            signed_at: existing.rows[0]?.signed_at || null,
        });
    } catch (err) {
        console.error('Contract error:', err);
        res.status(500).json({ error: 'Failed to load contract' });
    }
});

// ─── SIGN CONTRACT ───
router.post('/contract/sign', async (req, res) => {
    try {
        const clientId = req.client.id;
        const { full_name, email, phone, business_name, business_address, signature_data, signature_type } = req.body;

        if (!full_name || !signature_data || !business_name) {
            return res.status(400).json({ error: 'Name, Business Name, and signature are required' });
        }

        // Get project info from quote
        const client = await query(
            `SELECT c.*, q.project_type, q.estimated_price, q.estimated_timeline, q.description as project_description
             FROM clients c LEFT JOIN quotes q ON c.quote_id = q.id WHERE c.id = $1`,
            [clientId]
        );

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Save contract
        await query(
            `INSERT INTO client_contracts
             (client_id, project_title, project_description, pricing_summary, timeline, client_full_name, client_email, client_phone, client_business_name, client_business_address, signature_data, signature_type, signed_at, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13)`,
            [
                clientId,
                client.rows[0]?.project_type || 'Project',
                client.rows[0]?.project_description || '',
                client.rows[0]?.estimated_price ? `₹${client.rows[0].estimated_price}` : 'TBD',
                client.rows[0]?.estimated_timeline || 'TBD',
                full_name, email, phone, business_name, business_address,
                signature_data, signature_type || 'drawn', ip
            ]
        );

        // Update client record
        await query(
            'UPDATE clients SET contract_signed = true, first_login_complete = true, full_name = $2, email = $3, phone = $4, company_name = $5, business_address = $6 WHERE id = $1',
            [clientId, full_name, email, phone, business_name, business_address]
        );

        // Create notification
        await query(
            `INSERT INTO notifications (client_id, type, title, message, link) VALUES ($1, 'contract', 'Contract Signed', 'Your contract has been signed successfully.', '/client/dashboard.html')`,
            [clientId]
        );

        res.json({ success: true, message: 'Contract signed successfully' });
    } catch (err) {
        console.error('Contract sign error:', err);
        res.status(500).json({ error: 'Failed to sign contract' });
    }
});

// ─── GET MEETING ───
router.get('/meeting/:id', async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM meetings WHERE id = $1 AND client_id = $2',
            [req.params.id, req.client.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Meeting not found' });

        // Mark seen
        await query('UPDATE meetings SET is_seen = true WHERE id = $1', [req.params.id]);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load meeting' });
    }
});

// ─── GET INVOICE ───
router.get('/invoices/:id', async (req, res) => {
    try {
        const result = await query(
            `SELECT i.*, c.full_name as client_name, c.email as client_email, c.phone as client_phone, c.company_name
             FROM invoices i JOIN clients c ON i.client_id = c.id
             WHERE i.id = $1 AND i.client_id = $2`,
            [req.params.id, req.client.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Invoice not found' });

        // Mark seen
        await query('UPDATE invoices SET is_seen = true WHERE id = $1', [req.params.id]);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load invoice' });
    }
});

// ─── NOTIFICATIONS ───
router.get('/notifications', async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM notifications WHERE client_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.client.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load notifications' });
    }
});

router.patch('/notifications/:id/read', async (req, res) => {
    try {
        await query('UPDATE notifications SET is_read = true WHERE id = $1 AND client_id = $2',
            [req.params.id, req.client.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

router.patch('/notifications/read-all', async (req, res) => {
    try {
        await query('UPDATE notifications SET is_read = true WHERE client_id = $1', [req.client.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark all read' });
    }
});

module.exports = router;
