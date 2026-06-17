const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { query } = require('../config/db');

// ─── BRUTE-FORCE PROTECTION ───
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per `window`
    message: { error: 'Too many login attempts, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Client JWT Middleware ───
function clientAuth(req, res, next) {
    const token = req.cookies.client_token;
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'client') return res.status(403).json({ error: 'Not a client token' });
        req.client = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// ─── LOGIN ───
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

        const result = await query('SELECT * FROM clients WHERE username = $1 AND is_active = true', [username]);
        if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

        const client = result.rows[0];
        const valid = await bcrypt.compare(password, client.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        // Update last login
        await query('UPDATE clients SET last_login = NOW() WHERE id = $1', [client.id]);

        const token = jwt.sign(
            { id: client.id, username: client.username, role: 'client' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Send HttpOnly Cookie instead of raw JSON token
        res.cookie('client_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            success: true,
            client: {
                id: client.id,
                username: client.username,
                full_name: client.full_name,
                email: client.email,
                company_name: client.company_name,
                contract_signed: client.contract_signed,
                first_login_complete: client.first_login_complete,
            },
        });
    } catch (err) {
        console.error('Client login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ─── LOGOUT ───
router.post('/logout', (req, res) => {
    res.clearCookie('client_token');
    res.json({ success: true, message: 'Logged out successfully' });
});

// ─── CURRENT CLIENT PROFILE ───
router.get('/me', clientAuth, async (req, res) => {
    try {
        const result = await query(
            'SELECT id, username, full_name, email, phone, company_name, contract_signed, first_login_complete, last_login, created_at FROM clients WHERE id = $1',
            [req.client.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Client not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// ─── OTP (Email-based) ───
const otpStore = new Map(); // In-memory for now; sufficient for single-server

router.post('/send-otp', clientAuth, async (req, res) => {
    try {
        const { email } = req.body;
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        otpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 });

        // Try sending email
        try {
            const emailService = require('../services/emailService');
            await emailService.sendOTP(email, otp);
        } catch (emailErr) {
            console.log('OTP email send failed, OTP:', otp);
        }

        res.json({ success: true, message: 'OTP sent to email' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

router.post('/verify-otp', clientAuth, async (req, res) => {
    try {
        const { email, otp } = req.body;
        const stored = otpStore.get(email);
        if (!stored) return res.status(400).json({ error: 'No OTP found. Request a new one.' });
        if (Date.now() > stored.expires) {
            otpStore.delete(email);
            return res.status(400).json({ error: 'OTP expired. Request a new one.' });
        }
        if (stored.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

        otpStore.delete(email);
        res.json({ success: true, verified: true });
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

module.exports = router;
module.exports.clientAuth = clientAuth;
