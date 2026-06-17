require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const { query, initDB, pool } = require('../config/db');

async function seed() {
    console.log('🌱 Seeding database...');

    await initDB();
    console.log('✅ Tables created');

    // ─── ADMIN ───
    const existingAdmin = await query('SELECT id FROM admins LIMIT 1');
    if (existingAdmin.rows.length === 0) {
        const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'pshetty2024', 10);
        await query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)',
            [process.env.ADMIN_USERNAME || 'admin', hash]);
        console.log('✅ Admin user created');
    }

    // ─── SERVICES ───
    const existingServices = await query('SELECT id FROM services LIMIT 1');
    if (existingServices.rows.length === 0) {
        const services = [
            { category: 'Web Development', title: 'Landing Pages', description: 'High-converting single-page websites designed to capture leads and showcase your brand.', icon: 'globe', features: ['Responsive Design', 'SEO Optimized', 'Contact Forms', 'Analytics Integration'], order: 1 },
            { category: 'Web Development', title: 'Business Websites', description: 'Professional multi-page websites that establish your online presence and credibility.', icon: 'briefcase', features: ['Multi-page Layout', 'CMS Integration', 'Blog System', 'Social Media Integration'], order: 2 },
            { category: 'Web Development', title: 'E-commerce Websites', description: 'Full-featured online stores with secure payment processing and inventory management.', icon: 'shopping-cart', features: ['Product Catalog', 'Payment Gateway', 'Order Management', 'Admin Dashboard'], order: 3 },
            { category: 'Web Development', title: 'Custom Web Apps', description: 'Tailored web applications built to solve your specific business challenges.', icon: 'code', features: ['Custom Features', 'Database Design', 'API Development', 'User Authentication'], order: 4 },
            { category: 'Mobile App Development', title: 'Android Apps', description: 'Native Android applications with Material Design and seamless user experience.', icon: 'smartphone', features: ['Material Design', 'Push Notifications', 'Offline Support', 'Play Store Launch'], order: 5 },
            { category: 'Mobile App Development', title: 'iOS Apps', description: 'Premium iOS applications following Apple design guidelines and best practices.', icon: 'smartphone', features: ['Native UI', 'Push Notifications', 'iCloud Sync', 'App Store Launch'], order: 6 },
            { category: 'Mobile App Development', title: 'Cross-Platform Apps', description: 'Build once, deploy everywhere with Flutter or React Native frameworks.', icon: 'layers', features: ['Single Codebase', 'Native Performance', 'Both Stores', 'Cost-effective'], order: 7 },
            { category: 'Software Development', title: 'Billing Software', description: 'GST-compliant billing and invoicing software for Indian businesses.', icon: 'file-text', features: ['GST Compliance', 'Invoice Generation', 'Inventory Management', 'Reports & Analytics'], order: 8 },
            { category: 'Software Development', title: 'ERP Systems', description: 'Enterprise resource planning systems to streamline business operations.', icon: 'database', features: ['Multi-module', 'Role-based Access', 'Automation', 'Custom Reports'], order: 9 },
            { category: 'Software Development', title: 'Custom Business Tools', description: 'Purpose-built software tools designed for your unique workflow.', icon: 'tool', features: ['Custom Logic', 'API Integration', 'Data Migration', 'Training Support'], order: 10 },
            { category: 'SaaS Development', title: 'SaaS Platforms', description: 'Subscription-based platforms with multi-tenant architecture and scalable backends.', icon: 'cloud', features: ['Subscription Billing', 'Multi-tenant', 'Admin Dashboard', 'Scalable Infrastructure'], order: 11 },
            { category: 'SaaS Development', title: 'Admin Dashboards', description: 'Powerful data dashboards with real-time analytics and reporting.', icon: 'bar-chart', features: ['Data Visualization', 'Real-time Updates', 'Export Options', 'Role-based Access'], order: 12 },
            { category: 'AI Solutions', title: 'AI Chatbots', description: 'Intelligent conversational bots for customer support and engagement.', icon: 'message-circle', features: ['NLP Integration', 'Custom Training', 'Multi-platform', 'Analytics'], order: 13 },
            { category: 'AI Solutions', title: 'Automation Tools', description: 'AI-powered automation to streamline repetitive tasks and workflows.', icon: 'cpu', features: ['Workflow Automation', 'Smart Processing', 'API Integration', 'Monitoring'], order: 14 },
        ];

        for (const s of services) {
            await query(
                'INSERT INTO services (category, title, description, icon, features, display_order) VALUES ($1,$2,$3,$4,$5,$6)',
                [s.category, s.title, s.description, s.icon, JSON.stringify(s.features), s.order]
            );
        }
        console.log('✅ Services seeded (14 items)');
    }

    // ─── PROJECTS ───
    const existingProjects = await query('SELECT id FROM projects LIMIT 1');
    if (existingProjects.rows.length === 0) {
        const projects = [
            {
                title: 'Impana Gold — Sri Devi Industries',
                client_name: 'Sri Devi Industries',
                description: 'Built a professional website and full GST-compliant billing software for Impana Gold, a premium food manufacturing brand under Sri Devi Industries. The system handles product inventory, invoicing, financial reporting, and customer management for their food business operations.',
                category: 'Web + Software',
                features: ['Professional Website', 'GST Billing Software', 'Invoice Generation', 'Inventory Management', 'Financial Reports', 'Customer Database'],
                image_url: 'https://impana-gold-billing.onrender.com/',
                order: 1,
            },
            {
                title: 'PCC App — Padashetty Coaching Class',
                client_name: 'Padashetty Coaching Class',
                description: 'Full-stack Android application for managing coaching class operations. Features include student enrollment, attendance tracking, fee management, and performance analytics with a clean, intuitive interface. Live on the Google Play Store.',
                category: 'Mobile App',
                features: ['Student Management', 'Attendance Tracking', 'Fee Management', 'Performance Analytics', 'Push Notifications', 'Parent Portal'],
                image_url: 'https://play.google.com/store/apps/details?id=com.padashettycoaching.app',
                order: 2,
            },
            {
                title: 'Advanced Coaching Platform',
                client_name: 'Coaching Platform',
                description: 'Comprehensive educational platform with Android and iOS apps, featuring separate student and teacher dashboards, examination system, detailed analytics, and communication tools — built as a complete EdTech ecosystem.',
                category: 'Full-Stack Platform',
                features: ['Android + iOS Apps', 'Student Dashboard', 'Teacher Dashboard', 'Exam System', 'Analytics & Reports', 'Communication System', 'Video Lectures', 'Payment Integration'],
                image_url: null,
                order: 3,
            },
        ];

        for (const p of projects) {
            await query(
                'INSERT INTO projects (title, client_name, description, category, features, image_url, display_order) VALUES ($1,$2,$3,$4,$5,$6,$7)',
                [p.title, p.client_name, p.description, p.category, JSON.stringify(p.features), p.image_url, p.order]
            );
        }
        console.log('✅ Projects seeded (3 items)');
    }

    // ─── PRICING ───
    const existingPricing = await query('SELECT id FROM pricing LIMIT 1');
    if (existingPricing.rows.length === 0) {
        const pricing = [
            { tier: 'basic', name: 'Basic Website', description: 'Perfect for personal portfolios and small landing pages.', price: 8000, features: ['Single Page Design', 'Responsive Layout', 'Contact Form', 'SEO Basics', 'Free Hosting Setup', '1 Revision Round'], plan_type: 'one-time', is_popular: false },
            { tier: 'business', name: 'Business Website', description: 'Professional multi-page website for growing businesses.', price: 20000, features: ['Up to 5 Pages', 'Custom Design', 'CMS Integration', 'SEO Optimization', 'Social Media Links', 'Analytics Setup', '2 Revision Rounds'], plan_type: 'one-time', is_popular: true },
            { tier: 'custom', name: 'Custom Software', description: 'Tailored software solutions for specific business needs.', price: 45000, features: ['Custom Requirements', 'Database Design', 'Admin Panel', 'API Development', 'Testing & QA', 'Deployment', 'Source Code', '3 Revision Rounds'], plan_type: 'one-time', is_popular: false },
            { tier: 'maintenance', name: 'Monthly Maintenance', description: 'Keep your website updated, secure, and performing optimally.', price: 2000, features: ['Bug Fixes', 'Content Updates', 'Security Patches', 'Performance Monitoring', 'Monthly Report', 'Priority Support'], plan_type: 'subscription', is_popular: false },
            { tier: 'saas-hosting', name: 'SaaS Hosting & Support', description: 'Managed hosting with full technical support for SaaS products.', price: 5000, features: ['Cloud Hosting', 'SSL Certificate', 'Daily Backups', 'Uptime Monitoring', '24/7 Support', 'Scaling Support'], plan_type: 'subscription', is_popular: true },
            { tier: 'app-support', name: 'App Support Plan', description: 'Ongoing support and updates for your mobile applications.', price: 3500, features: ['Bug Fixes', 'OS Compatibility Updates', 'Feature Updates', 'Store Management', 'Crash Analytics', 'Priority Support'], plan_type: 'subscription', is_popular: false },
        ];

        for (const p of pricing) {
            await query(
                'INSERT INTO pricing (tier, name, description, price, features, plan_type, is_popular) VALUES ($1,$2,$3,$4,$5,$6,$7)',
                [p.tier, p.name, p.description, p.price, JSON.stringify(p.features), p.plan_type, p.is_popular]
            );
        }
        console.log('✅ Pricing seeded (6 tiers)');
    }

    console.log('🎉 Seed complete!');
    await pool.end();
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
