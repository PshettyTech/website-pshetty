require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./server/config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security & Global Middleware ───
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'"],
        },
    },
})); // Secure HTTP headers
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(xss()); // Sanitize against XSS attacks
app.use(cookieParser()); // Parse cookies for secure HttpOnly auth

// ─── Global Rate Limiter (Anti-DDoS) ───
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', globalLimiter);

// ─── Static Files ───
const staticOpts = { etag: false, lastModified: false, maxAge: 0 };
app.use(express.static(path.join(__dirname, 'public'), staticOpts));
// Serve frame images — mount at /frames (clean path, no spaces)
app.use('/frames', express.static(path.join(__dirname, 'pshetty img'), staticOpts));
// Serve uploaded screenshots
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), staticOpts));
// Serve generated PDFs
app.use('/generated', express.static(path.join(__dirname, 'generated')));

// ─── API Routes ───
app.use('/api', require('./server/routes/api'));
app.use('/api/quotes', require('./server/routes/quotes'));
app.use('/api/admin', require('./server/routes/admin'));
app.use('/api/client', require('./server/routes/client-auth'));
app.use('/api/client/portal', require('./server/routes/client-portal'));

// ─── SPA fallback for admin ───
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// ─── SPA fallback for client portal ───
app.get('/client', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'client', 'index.html'));
});
app.get('/client/dashboard*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'client', 'dashboard.html'));
});
app.get('/client/contract*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'client', 'contract.html'));
});
app.get('/client/welcome*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'client', 'welcome.html'));
});
app.get('/client/meeting*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'client', 'meeting.html'));
});
app.get('/client/invoice*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'client', 'invoice.html'));
});
app.get('/client/completion*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'client', 'completion.html'));
});

// ─── Catch-all: serve main site ───
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ───
async function start() {
    try {
        await initDB();
        console.log('✅ Database connected & tables ready');
        app.listen(PORT, '0.0.0.0', () => {
            const os = require('os');
            const networkInterfaces = os.networkInterfaces();
            let networkIP = 'Local Network IP not found';
            for (const name of Object.keys(networkInterfaces)) {
                for (const net of networkInterfaces[name]) {
                    if (net.family === 'IPv4' && !net.internal) {
                        networkIP = net.address;
                        break;
                    }
                }
            }
            console.log(`🚀 Pshetty Tech server running at:`);
            console.log(`   - Local:   http://localhost:${PORT}`);
            console.log(`   - Network: http://${networkIP}:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Failed to start:', err.message);
        app.listen(PORT, () => {
            console.log(`⚠️  Server running WITHOUT database at http://localhost:${PORT}`);
        });
    }
}

start();
