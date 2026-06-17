const router = require('express').Router();
const { query } = require('../config/db');

// GET /api/services — public
router.get('/services', async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM services WHERE is_active = true ORDER BY display_order ASC'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// GET /api/projects — public
router.get('/projects', async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM projects WHERE is_active = true ORDER BY display_order ASC'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// GET /api/pricing — public
router.get('/pricing', async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM pricing WHERE is_active = true ORDER BY price ASC'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch pricing' });
    }
});

module.exports = router;
