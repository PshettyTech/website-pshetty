const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const GENERATED_DIR = path.join(__dirname, '..', '..', 'generated', 'quotes');

// Ensure directory exists
if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

/**
 * Generate a professional quote PDF
 * @param {Object} quoteData - The quote information
 * @returns {string} - Path to generated PDF
 */
function generateQuotePDF(quoteData) {
    return new Promise((resolve, reject) => {
        const filename = `quote-${quoteData.id}-${Date.now()}.pdf`;
        const filepath = path.join(GENERATED_DIR, filename);
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        const ORANGE = '#ff6a00';
        const DARK = '#1a1a2e';
        const GRAY = '#4a4a5a';
        const LIGHT_GRAY = '#f8f8f8';
        const W = doc.page.width - 100; // content width

        // ═══ HEADER ═══
        // Orange accent bar
        doc.rect(0, 0, doc.page.width, 4).fill(ORANGE);

        // Company name
        doc.fontSize(28).font('Helvetica-Bold').fillColor(DARK)
            .text('Pshetty', 50, 30, { continued: true })
            .fillColor(ORANGE).text(' Tech');

        doc.fontSize(8).font('Helvetica').fillColor(GRAY)
            .text('BUILD  •  TRUST  •  GROW', 50, 62);

        // Contact info (right side)
        doc.fontSize(8).fillColor(GRAY)
            .text('pshettytech.com', 350, 35, { align: 'right', width: W - 300 })
            .text('contact@pshettytech.com', 350, 47, { align: 'right', width: W - 300 });

        // Separator
        doc.moveTo(50, 80).lineTo(doc.page.width - 50, 80)
            .strokeColor('#e0e0e0').lineWidth(0.5).stroke();

        // ═══ QUOTE TITLE ═══
        doc.fontSize(20).font('Helvetica-Bold').fillColor(DARK)
            .text('Project Quotation', 50, 100);

        doc.fontSize(9).font('Helvetica').fillColor(GRAY)
            .text(`Quote #PST-${String(quoteData.id).padStart(4, '0')}`, 50, 125)
            .text(`Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 137);

        // ═══ CLIENT DETAILS ═══
        let y = 170;
        doc.rect(50, y, W, 25).fill(ORANGE);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff')
            .text('CLIENT DETAILS', 60, y + 7);
        y += 35;

        const clientFields = [
            ['Name', quoteData.name],
            ['Company', quoteData.company_name || 'N/A'],
            ['Email', quoteData.email],
            ['Phone', quoteData.phone || 'N/A'],
        ];

        clientFields.forEach(([label, value]) => {
            doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
                .text(`${label}:`, 60, y);
            doc.font('Helvetica').fillColor(GRAY)
                .text(value, 140, y);
            y += 18;
        });

        // ═══ PROJECT SUMMARY ═══
        y += 15;
        doc.rect(50, y, W, 25).fill(ORANGE);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff')
            .text('PROJECT SUMMARY', 60, y + 7);
        y += 35;

        doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
            .text('Project Type:', 60, y);
        doc.font('Helvetica').fillColor(GRAY)
            .text(formatProjectType(quoteData.project_type), 140, y);
        y += 18;

        if (quoteData.budget) {
            doc.font('Helvetica-Bold').fillColor(DARK)
                .text('Budget:', 60, y);
            doc.font('Helvetica').fillColor(GRAY)
                .text(quoteData.budget, 140, y);
            y += 18;
        }

        doc.font('Helvetica-Bold').fillColor(DARK)
            .text('Description:', 60, y);
        y += 15;
        doc.font('Helvetica').fillColor(GRAY)
            .text(quoteData.description || 'To be discussed', 60, y, { width: W - 20 });
        y += doc.heightOfString(quoteData.description || 'To be discussed', { width: W - 20 }) + 10;

        // ═══ ESTIMATE ═══
        y += 15;
        doc.rect(50, y, W, 25).fill(ORANGE);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff')
            .text('ESTIMATED COST & TIMELINE', 60, y + 7);
        y += 40;

        // Cost box
        doc.rect(50, y, W / 2 - 10, 60).fill(LIGHT_GRAY).stroke('#e0e0e0');
        doc.fontSize(9).font('Helvetica').fillColor(GRAY)
            .text('Estimated Cost', 60, y + 10);
        doc.fontSize(22).font('Helvetica-Bold').fillColor(ORANGE)
            .text(`₹${Number(quoteData.estimated_price || 0).toLocaleString('en-IN')}`, 60, y + 28);

        // Timeline box
        const rightX = 50 + W / 2 + 10;
        doc.rect(rightX, y, W / 2 - 10, 60).fill(LIGHT_GRAY).stroke('#e0e0e0');
        doc.fontSize(9).font('Helvetica').fillColor(GRAY)
            .text('Estimated Timeline', rightX + 10, y + 10);
        doc.fontSize(16).font('Helvetica-Bold').fillColor(DARK)
            .text(quoteData.estimated_timeline || '2-4 weeks', rightX + 10, y + 30);

        y += 80;

        // ═══ WHAT'S INCLUDED ═══
        const inclusions = getInclusions(quoteData.project_type);
        if (inclusions.length > 0) {
            doc.rect(50, y, W, 25).fill('#2a2a3e');
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff')
                .text("WHAT'S INCLUDED", 60, y + 7);
            y += 35;

            inclusions.forEach((item) => {
                doc.fontSize(9).font('Helvetica').fillColor(DARK)
                    .text('✓  ' + item, 60, y, { width: W - 20 });
                y += 16;
            });
        }

        // ═══ TERMS ═══
        y += 20;
        doc.moveTo(50, y).lineTo(doc.page.width - 50, y)
            .strokeColor('#e0e0e0').lineWidth(0.5).stroke();
        y += 15;

        doc.fontSize(8).font('Helvetica-Bold').fillColor(DARK)
            .text('Terms & Conditions', 50, y);
        y += 14;

        const terms = [
            '50% advance payment required to begin the project.',
            'Remaining 50% upon project completion and delivery.',
            'Timeline begins after advance payment and requirement finalization.',
            'Two rounds of revisions included. Additional revisions billed separately.',
            'Source code ownership transfers upon full payment.',
        ];

        terms.forEach((term, i) => {
            doc.fontSize(7.5).font('Helvetica').fillColor(GRAY)
                .text(`${i + 1}. ${term}`, 50, y, { width: W });
            y += 13;
        });

        // ═══ DISCLAIMER ═══
        y += 10;
        doc.rect(50, y, W, 30).fill('#FFF8F0');
        doc.fontSize(8).font('Helvetica-Oblique').fillColor(ORANGE)
            .text('Final pricing may vary based on detailed requirements. You can negotiate based on your specific needs.', 60, y + 9, { width: W - 20 });

        // ═══ FOOTER ═══
        const footerY = doc.page.height - 40;
        doc.rect(0, footerY - 5, doc.page.width, 45).fill(DARK);
        doc.fontSize(8).font('Helvetica').fillColor('#999')
            .text('Pshetty Tech  •  Build. Trust. Grow.  •  pshettytech.com', 50, footerY + 5, {
                align: 'center', width: W
            });

        doc.end();

        stream.on('finish', () => resolve(`generated/quotes/${filename}`));
        stream.on('error', reject);
    });
}

function formatProjectType(type) {
    const map = {
        'web-landing': 'Landing Page Website',
        'web-business': 'Business Website',
        'web-ecommerce': 'E-commerce Website',
        'web-custom': 'Custom Web Application',
        'mobile-android': 'Android App',
        'mobile-ios': 'iOS App',
        'mobile-cross': 'Cross-Platform Mobile App',
        'software-billing': 'Billing Software (GST)',
        'software-erp': 'ERP System',
        'software-custom': 'Custom Business Software',
        'saas-platform': 'SaaS Platform',
        'saas-dashboard': 'Admin Dashboard',
        'ai-chatbot': 'AI Chatbot',
        'ai-automation': 'AI Automation Tool',
    };
    return map[type] || type;
}

function getInclusions(type) {
    const base = ['UI/UX Design', 'Responsive Layout', 'Source Code Delivery', 'Deployment Support'];
    const map = {
        'web-landing': [...base, 'SEO Optimization', 'Contact Form', 'Analytics Setup'],
        'web-business': [...base, 'CMS Integration', 'Multi-page Design', 'SEO Optimization'],
        'web-ecommerce': [...base, 'Product Catalog', 'Payment Integration', 'Order Management', 'Admin Panel'],
        'web-custom': [...base, 'Custom Features', 'Database Design', 'API Development', 'Admin Panel'],
        'mobile-android': ['Android App Development', 'Material Design', 'API Integration', 'Play Store Submission', 'Source Code'],
        'mobile-ios': ['iOS App Development', 'Native Design', 'API Integration', 'App Store Submission', 'Source Code'],
        'mobile-cross': ['Cross-Platform Development', 'Native-like Performance', 'API Integration', 'Both Store Submissions', 'Source Code'],
        'software-billing': ['GST Compliance', 'Invoice Generation', 'Inventory Management', 'Reports & Analytics', 'Data Export'],
        'software-erp': ['Multi-module System', 'Role-based Access', 'Reports & Analytics', 'Data Migration', 'Training'],
        'software-custom': ['Custom Requirements', 'Database Design', 'API Development', 'Testing', 'Documentation'],
        'saas-platform': ['Subscription System', 'Multi-tenant Architecture', 'Admin Dashboard', 'API Development', 'Scalable Backend'],
        'saas-dashboard': ['Data Visualization', 'Real-time Updates', 'Role-based Access', 'Export Functionality'],
        'ai-chatbot': ['NLP Integration', 'Custom Training', 'Multi-platform Support', 'Analytics Dashboard'],
        'ai-automation': ['Workflow Automation', 'API Integration', 'Custom Logic', 'Monitoring Dashboard'],
    };
    return map[type] || base;
}

// Pricing estimation logic
function estimatePrice(projectType) {
    const basePrice = {
        'web-landing': 8000,
        'web-business': 20000,
        'web-ecommerce': 40000,
        'web-custom': 50000,
        'mobile-android': 35000,
        'mobile-ios': 40000,
        'mobile-cross': 60000,
        'software-billing': 45000,
        'software-erp': 100000,
        'software-custom': 60000,
        'saas-platform': 120000,
        'saas-dashboard': 50000,
        'ai-chatbot': 30000,
        'ai-automation': 55000,
    };

    const timeline = {
        'web-landing': '1-2 weeks',
        'web-business': '2-3 weeks',
        'web-ecommerce': '4-6 weeks',
        'web-custom': '4-8 weeks',
        'mobile-android': '4-6 weeks',
        'mobile-ios': '4-6 weeks',
        'mobile-cross': '6-10 weeks',
        'software-billing': '4-8 weeks',
        'software-erp': '8-16 weeks',
        'software-custom': '6-12 weeks',
        'saas-platform': '10-16 weeks',
        'saas-dashboard': '4-8 weeks',
        'ai-chatbot': '3-6 weeks',
        'ai-automation': '4-8 weeks',
    };

    return {
        price: basePrice[projectType] || 25000,
        timeline: timeline[projectType] || '2-4 weeks',
    };
}

module.exports = { generateQuotePDF, estimatePrice };
