const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
});

// ─── Query helper ───
async function query(text, params) {
    const res = await pool.query(text, params);
    return res;
}

// ─── Encryption for sensitive data (Aadhaar) ───
const ALGO = 'aes-256-cbc';
const ENC_KEY = crypto.scryptSync(process.env.JWT_SECRET || 'default-key', 'salt', 32);

function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGO, ENC_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
    if (!encryptedText) return null;
    const [ivHex, enc] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, ENC_KEY, iv);
    let decrypted = decipher.update(enc, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// ─── Initialize tables ───
async function initDB() {
    // ── Original tables ──
    await query(`
        CREATE TABLE IF NOT EXISTS admins (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS services (
            id SERIAL PRIMARY KEY,
            category VARCHAR(50) NOT NULL,
            title VARCHAR(100) NOT NULL,
            description TEXT,
            icon VARCHAR(50) DEFAULT 'code',
            features JSONB DEFAULT '[]',
            display_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS projects (
            id SERIAL PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            client_name VARCHAR(100) NOT NULL,
            description TEXT,
            category VARCHAR(50),
            features JSONB DEFAULT '[]',
            image_url VARCHAR(255),
            display_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS pricing (
            id SERIAL PRIMARY KEY,
            tier VARCHAR(50) NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            features JSONB DEFAULT '[]',
            plan_type VARCHAR(20) DEFAULT 'one-time',
            is_popular BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS quotes (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            company_name VARCHAR(100),
            email VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            project_type VARCHAR(50) NOT NULL,
            budget VARCHAR(50),
            description TEXT,
            estimated_price DECIMAL(10,2),
            estimated_timeline VARCHAR(100),
            pdf_path VARCHAR(255),
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    // ══════════════════════════════════════════════
    // NEW TABLES — Client Portal System
    // ══════════════════════════════════════════════

    // ── Clients (accounts created from accepted quotes) ──
    await query(`
        CREATE TABLE IF NOT EXISTS clients (
            id SERIAL PRIMARY KEY,
            quote_id INT REFERENCES quotes(id) ON DELETE SET NULL,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(150),
            email VARCHAR(150) NOT NULL,
            phone VARCHAR(20),
            company_name VARCHAR(150),
            aadhaar_encrypted TEXT,
            contract_signed BOOLEAN DEFAULT false,
            first_login_complete BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    // ── Client Contracts (signed agreements) ──
    await query(`
        CREATE TABLE IF NOT EXISTS client_contracts (
            id SERIAL PRIMARY KEY,
            client_id INT REFERENCES clients(id) ON DELETE CASCADE,
            project_title VARCHAR(200),
            project_description TEXT,
            pricing_summary TEXT,
            timeline VARCHAR(100),
            terms JSONB DEFAULT '[]',
            client_full_name VARCHAR(150),
            client_email VARCHAR(150),
            client_phone VARCHAR(20),
            client_aadhaar_encrypted TEXT,
            signature_data TEXT,
            signature_type VARCHAR(20) DEFAULT 'drawn',
            signed_at TIMESTAMP,
            ip_address VARCHAR(50),
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    // ── Client Projects (assigned work with lifecycle) ──
    await query(`
        CREATE TABLE IF NOT EXISTS client_projects (
            id SERIAL PRIMARY KEY,
            client_id INT REFERENCES clients(id) ON DELETE CASCADE,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            project_type VARCHAR(50),
            total_price DECIMAL(10,2),
            timeline VARCHAR(100),
            status VARCHAR(30) DEFAULT 'planning',
            completion_note TEXT,
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    // ── Project Stages (Planning → Deployment) ──
    await query(`
        CREATE TABLE IF NOT EXISTS project_stages (
            id SERIAL PRIMARY KEY,
            project_id INT REFERENCES client_projects(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            status VARCHAR(30) DEFAULT 'not_started',
            progress INT DEFAULT 0,
            stage_order INT DEFAULT 0,
            started_at TIMESTAMP,
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    // ── Project Updates (work screenshots + notes timeline) ──
    await query(`
        CREATE TABLE IF NOT EXISTS project_updates (
            id SERIAL PRIMARY KEY,
            project_id INT REFERENCES client_projects(id) ON DELETE CASCADE,
            title VARCHAR(200),
            description TEXT,
            image_url VARCHAR(500),
            update_type VARCHAR(30) DEFAULT 'progress',
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    // ── Meetings (kickoff + ongoing) ──
    await query(`
        CREATE TABLE IF NOT EXISTS meetings (
            id SERIAL PRIMARY KEY,
            client_id INT REFERENCES clients(id) ON DELETE CASCADE,
            project_id INT REFERENCES client_projects(id) ON DELETE SET NULL,
            title VARCHAR(200) DEFAULT 'Kickoff Meeting',
            meet_link VARCHAR(500),
            meeting_date TIMESTAMP,
            duration VARCHAR(50) DEFAULT '30-60 mins',
            agenda JSONB DEFAULT '[]',
            instructions TEXT,
            is_seen BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    // ── Invoices ──
    await query(`
        CREATE TABLE IF NOT EXISTS invoices (
            id SERIAL PRIMARY KEY,
            client_id INT REFERENCES clients(id) ON DELETE CASCADE,
            project_id INT REFERENCES client_projects(id) ON DELETE SET NULL,
            invoice_number VARCHAR(50) UNIQUE NOT NULL,
            invoice_date DATE DEFAULT CURRENT_DATE,
            due_date DATE,
            payment_terms VARCHAR(100) DEFAULT 'Due on Receipt',
            billing_period VARCHAR(100),
            line_items JSONB DEFAULT '[]',
            subtotal DECIMAL(10,2) DEFAULT 0,
            tax_percent DECIMAL(5,2) DEFAULT 0,
            tax_amount DECIMAL(10,2) DEFAULT 0,
            total DECIMAL(10,2) DEFAULT 0,
            payment_details JSONB DEFAULT '{}',
            notes TEXT,
            pdf_path VARCHAR(255),
            status VARCHAR(20) DEFAULT 'unpaid',
            is_seen BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    // ── Notifications ──
    await query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            client_id INT REFERENCES clients(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(200) NOT NULL,
            message TEXT,
            link VARCHAR(255),
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    // ── Cold Calls ──
    await query(`
        CREATE TABLE IF NOT EXISTS cold_calls (
            id SERIAL PRIMARY KEY,
            business_name VARCHAR(200) NOT NULL,
            phone_number VARCHAR(50),
            has_website BOOLEAN DEFAULT false,
            problem VARCHAR(50),
            is_called BOOLEAN DEFAULT false,
            result TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);
}

module.exports = { query, initDB, pool, encrypt, decrypt };
