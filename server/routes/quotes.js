const router = require('express').Router();
const { query } = require('../config/db');
const { generateQuotePDF, estimatePrice } = require('../services/pdfGenerator');
const { sendQuoteEmail } = require('../services/emailService');
const rateLimit = require('express-rate-limit');

// Rate limit quote submissions
const quoteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { error: 'Too many quote requests. Please try again later.' },
});

// POST /api/quotes — submit a quote request
router.post('/', quoteLimiter, async (req, res) => {
    try {
        const { name, company_name, email, phone, project_type, budget, description } = req.body;

        // Validate required fields
        if (!name || !email || !project_type) {
            return res.status(400).json({ error: 'Name, email, and project type are required.' });
        }

        // Email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email address.' });
        }

        // Estimate price and timeline
        const estimate = estimatePrice(project_type);

        // Insert into database
        const result = await query(
            `INSERT INTO quotes (name, company_name, email, phone, project_type, budget, description, estimated_price, estimated_timeline, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
             RETURNING *`,
            [name, company_name || null, email, phone || null, project_type, budget || null, description || null, estimate.price, estimate.timeline]
        );

        const quote = result.rows[0];

        // Generate PDF
        let pdfPath = null;
        try {
            pdfPath = await generateQuotePDF(quote);
            // Update quote record with PDF path
            await query('UPDATE quotes SET pdf_path = $1 WHERE id = $2', [pdfPath, quote.id]);
        } catch (pdfErr) {
            console.error('PDF generation failed:', pdfErr.message);
        }

        // Send email (async, don't block response) — always send, even if PDF failed
        sendQuoteEmail(quote.email, quote.name, pdfPath).catch(err => {
            console.error('Email send error:', err.message);
        });

        res.status(201).json({
            success: true,
            quote: {
                id: quote.id,
                estimated_price: quote.estimated_price,
                estimated_timeline: quote.estimated_timeline,
                pdf_url: pdfPath ? `/${pdfPath}` : null,
            },
        });
    } catch (err) {
        console.error('Quote submission error:', err);
        res.status(500).json({ error: 'Failed to process quote request.' });
    }
});

// GET /api/quotes/:id/pdf — download PDF
router.get('/:id/pdf', async (req, res) => {
    try {
        const result = await query('SELECT pdf_path FROM quotes WHERE id = $1', [req.params.id]);
        if (!result.rows.length || !result.rows[0].pdf_path) {
            return res.status(404).json({ error: 'PDF not found' });
        }
        const pdfPath = require('path').join(__dirname, '..', '..', result.rows[0].pdf_path);
        res.download(pdfPath);
    } catch (err) {
        res.status(500).json({ error: 'Failed to download PDF' });
    }
});

module.exports = router;
