const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    connectionTimeout: 5000, // 5 seconds
    greetingTimeout: 5000,
    socketTimeout: 5000,
});

const FROM = `"Pshetty Tech" <${process.env.GMAIL_USER}>`;
const BASE = process.env.BASE_URL || 'http://localhost:3000';

// ─── CTA Button Helper ───
function ctaButton(label, href, type) {
    if (type === 'outline') {
        return `<div style="text-align:center;margin:8px 0;"><a href="${href}" style="display:inline-block;padding:13px 36px;background:#fff;color:#1a1a2e;border:1.5px solid #e5e7eb;border-radius:12px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;">${label}</a></div>`;
    }
    return `<div style="text-align:center;margin:12px 0;"><a href="${href}" style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg,#ff6a00,#ff8c33);color:#fff;border:none;border-radius:12px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;box-shadow:0 6px 20px rgba(255,106,0,.25);">${label} &rarr;</a></div>`;
}

// ─── Send Quote Email ───
async function sendQuoteEmail(to, name, pdfPath) {
    const body = `
        <p style="font-size:15px;color:#1a1a2e;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
        <p style="color:#6b7280;line-height:1.7;margin:0 0 24px;">Thank you for reaching out to <strong style="color:#ff6a00;">Pshetty Tech</strong>! We've carefully reviewed your requirements and your quote is ready.</p>
        <div style="background:linear-gradient(135deg,#fff8f4,#fff3ec);border:1px solid rgba(255,106,0,.15);border-left:4px solid #ff6a00;border-radius:12px;padding:24px;margin:0 0 28px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#ff6a00;">NEXT STEPS</p>
            <ul style="margin:12px 0 0;padding-left:20px;color:#374151;font-size:14px;line-height:2.2;"><li>Review the attached quote PDF</li><li>Reply to this email with any questions</li><li>We'll follow up within <strong>24 hours</strong></li></ul>
        </div>
        ${ctaButton('View Your Quote', BASE + '/client/', 'primary')}
        <p style="color:#9ca3af;font-size:13px;margin-top:28px;line-height:1.7;">If you have any questions, simply reply to this email. We're here to help!</p>`;
    await transporter.sendMail({ from: FROM, to, subject: `Your Quote is Ready — Pshetty Tech`, html: emailWrap('📄', 'QUOTE GENERATED', `Hi ${name}, your quote from Pshetty Tech is ready.`, body) });
}

// ─── Send Welcome Email (new client) ───
async function sendWelcomeEmail(to, name, username, password) {
    const body = `
        <p style="font-size:15px;color:#1a1a2e;margin:0 0 16px;">Welcome, <strong>${name}</strong>! 🎉</p>
        <p style="color:#6b7280;line-height:1.7;margin:0 0 28px;">We're thrilled to have you on board. Your client portal is ready — track your project, review updates, and stay connected all in one place.</p>
        <div style="background:#f7f8fa;border:1px solid #e5e7eb;border-radius:14px;padding:28px;margin:0 0 28px;">
            <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6b7280;">YOUR LOGIN CREDENTIALS</p>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin-bottom:10px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;letter-spacing:.05em;text-transform:uppercase;">Username</p>
                <p style="margin:0;font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:#ff6a00;">${username}</p>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;letter-spacing:.05em;text-transform:uppercase;">Password</p>
                <p style="margin:0;font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:#1a3a6e;">${password}</p>
            </div>
        </div>
        ${ctaButton('Enter My Client Portal', BASE + '/client/', 'primary')}
        <div style="background:rgba(239,68,68,.04);border:1px solid rgba(239,68,68,.12);border-radius:10px;padding:16px 20px;margin-top:24px;">
            <p style="margin:0;font-size:13px;color:#dc2626;line-height:1.6;">&#9888; <strong>Keep these safe.</strong> On first login, you'll review and sign your project contract before accessing the portal.</p>
        </div>`;
    await transporter.sendMail({ from: FROM, to, subject: `Welcome to Pshetty Tech — Your Client Portal is Ready 🎉`, html: emailWrap('🎉', 'WELCOME ABOARD', `Welcome aboard, ${name}! Your client portal is ready.`, body) });
}

// ─── Send OTP ───
async function sendOTP(to, otp) {
    const body = `
        <p style="color:#6b7280;line-height:1.7;margin:0 0 28px;text-align:center;">Use the code below to verify your identity. Valid for <strong>5 minutes</strong>.</p>
        <div style="text-align:center;margin:0 0 32px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#ff6a00,#ff8c33);border-radius:16px;padding:28px 48px;box-shadow:0 8px 32px rgba(255,106,0,.2);">
                <p style="margin:0;font-family:'Courier New',monospace;font-size:42px;font-weight:900;letter-spacing:16px;color:#fff;">${otp}</p>
            </div>
        </div>
        <p style="color:#9ca3af;font-size:13px;text-align:center;line-height:1.7;">Didn't request this? Simply ignore this email. Your account is safe.</p>`;
    await transporter.sendMail({ from: FROM, to, subject: `Your Verification Code — Pshetty Tech`, html: emailWrap('🔐', 'VERIFICATION', `Your one-time verification code is ${otp}.`, body) });
}

// ─── Send Meeting Email ───
async function sendMeetingEmail(to, name, meetLink, meetingDate) {
    const dateStr = meetingDate ? new Date(meetingDate).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }) : 'TBD — check your portal for details';
    const body = `
        <p style="font-size:15px;color:#1a1a2e;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
        <p style="color:#6b7280;line-height:1.7;margin:0 0 28px;">A meeting has been scheduled for your project. Please join on time.</p>
        <div style="background:#f7f8fa;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;margin:0 0 28px;">
            <div style="background:linear-gradient(135deg,#0a1628,#1a3a6e);padding:16px 24px;"><p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.5);">MEETING DETAILS</p></div>
            <div style="padding:24px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="padding:10px 0;width:44px;vertical-align:top;"><div style="width:36px;height:36px;background:rgba(255,106,0,.08);border-radius:50%;text-align:center;line-height:36px;font-size:16px;">📅</div></td><td style="padding:10px 0;vertical-align:middle;"><p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Date &amp; Time</p><p style="margin:0;font-size:14px;font-weight:700;color:#1a1a2e;">${dateStr}</p></td></tr>
                    <tr><td style="padding:10px 0;width:44px;vertical-align:top;"><div style="width:36px;height:36px;background:rgba(255,106,0,.08);border-radius:50%;text-align:center;line-height:36px;font-size:16px;">🔗</div></td><td style="padding:10px 0;vertical-align:middle;"><p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Meeting Link</p><a href="${meetLink}" style="font-size:14px;font-weight:700;color:#ff6a00;text-decoration:none;">${meetLink || 'Link shared separately'}</a></td></tr>
                </table>
            </div>
        </div>
        ${ctaButton('Join Meeting', meetLink || BASE + '/client/', 'primary')}
        ${ctaButton('View in Portal', BASE + '/client/', 'outline')}`;
    await transporter.sendMail({ from: FROM, to, subject: `Meeting Scheduled — Pshetty Tech`, html: emailWrap('📅', 'MEETING SCHEDULED', `A meeting has been scheduled for your project.`, body) });
}

// ─── Send Invoice Email ───
async function sendInvoiceEmail(to, name, invoiceNumber, total) {
    const body = `
        <p style="font-size:15px;color:#1a1a2e;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
        <p style="color:#6b7280;line-height:1.7;margin:0 0 28px;">A new invoice has been generated for your project. Please review and process payment at your earliest convenience.</p>
        <div style="background:linear-gradient(135deg,#0a1628,#1a3a6e);border-radius:14px;padding:32px;text-align:center;margin:0 0 28px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.45);">INVOICE NUMBER</p>
            <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:rgba(255,255,255,.7);">${invoiceNumber}</p>
            <div style="background:rgba(255,255,255,.06);border-radius:10px;padding:16px 24px;display:inline-block;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.4);">AMOUNT DUE</p>
                <p style="margin:0;font-size:36px;font-weight:900;color:#ff6a00;letter-spacing:-.5px;">&#8377;${Number(total).toLocaleString('en-IN')}</p>
            </div>
        </div>
        ${ctaButton('View Full Invoice', BASE + '/client/', 'primary')}
        <p style="color:#9ca3af;font-size:13px;margin-top:24px;line-height:1.7;text-align:center;">For payment details or queries, log into your client portal or reply to this email.</p>`;
    await transporter.sendMail({ from: FROM, to, subject: `Invoice ${invoiceNumber} — Pshetty Tech`, html: emailWrap('💰', 'NEW INVOICE', `Invoice ${invoiceNumber} for \u20b9${Number(total).toLocaleString('en-IN')} is ready.`, body) });
}

// ─── Send Completion Email ───
async function sendCompletionEmail(to, name) {
    const body = `
        <p style="font-size:15px;color:#1a1a2e;margin:0 0 16px;">Congratulations, <strong>${name}</strong>! 🎉</p>
        <p style="color:#6b7280;line-height:1.7;margin:0 0 28px;">Your project has been <strong style="color:#22c55e;">successfully completed and delivered!</strong> Thank you for trusting us with your vision.</p>
        <div style="background:linear-gradient(135deg,rgba(34,197,94,.06),rgba(34,197,94,.02));border:1px solid rgba(34,197,94,.15);border-left:4px solid #22c55e;border-radius:12px;padding:24px;margin:0 0 28px;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#22c55e;letter-spacing:.06em;text-transform:uppercase;">WHAT'S INCLUDED</p>
            <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2.2;"><li>Full source code delivery</li><li>Deployment &amp; go-live</li><li>Post-launch support period</li><li>Complete project documentation</li></ul>
        </div>
        <div style="background:linear-gradient(135deg,#0a1628,#1a3a6e);border-radius:14px;padding:28px;text-align:center;margin:0 0 28px;">
            <p style="margin:0 0 4px;font-size:24px;">&ldquo;</p>
            <p style="margin:0;font-size:15px;font-style:italic;color:rgba(255,255,255,.8);line-height:1.7;">We don't just build websites. We build long-term partnerships. Your success is our success.</p>
            <p style="margin:16px 0 0;font-size:12px;font-weight:700;color:#ff6a00;letter-spacing:.1em;text-transform:uppercase;">— The Pshetty Tech Team</p>
        </div>
        ${ctaButton('View Completion Summary', BASE + '/client/', 'primary')}
        <p style="color:#9ca3af;font-size:13px;margin-top:24px;line-height:1.7;text-align:center;">Thank you for choosing Pshetty Tech. Let's grow together! 🚀</p>`;
    await transporter.sendMail({ from: FROM, to, subject: `Your Project is Complete! 🎉 — Pshetty Tech`, html: emailWrap('🚀', 'PROJECT DELIVERED', `Congratulations ${name}! Your project is complete.`, body) });
}

// ─── Master Email Template ───
function emailWrap(headerIcon, headerLabel, preheader, body) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${headerLabel} - Pshetty Tech</title></head><body style="margin:0;padding:0;background-color:#f7f8fa;font-family:Arial,'Helvetica Neue',sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f7f8fa;">${preheader}</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7f8fa;"><tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#0a1628 0%,#1a3a6e 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="text-align:left;vertical-align:middle;"><span style="background:rgba(255,106,0,.12);border:1px solid rgba(255,106,0,.2);border-radius:100px;padding:4px 14px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#ff6a00;">PSHETTY TECH</span></td>
    <td style="text-align:right;vertical-align:middle;"><span style="font-size:11px;color:rgba(255,255,255,.35);letter-spacing:.08em;text-transform:uppercase;">${headerLabel}</span></td>
  </tr></table>
  <div style="margin:28px 0 12px;"><div style="display:inline-block;background:rgba(255,106,0,.1);border:1px solid rgba(255,106,0,.2);border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;font-size:28px;">${headerIcon}</div></div>
  <p style="margin:0 0 6px;font-size:28px;font-weight:900;color:#fff;letter-spacing:-.5px;">Pshetty <span style="color:#ff6a00;">Tech</span></p>
  <p style="margin:0;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.35);">BUILD &bull; TRUST &bull; GROW</p>
  <div style="margin:28px 0 0;height:2px;background:linear-gradient(90deg,transparent,#ff6a00,transparent);border-radius:2px;"></div>
</td></tr>
<tr><td style="background:#ffffff;padding:40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">${body}</td></tr>
<tr><td style="background:#ffffff;padding:0 40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;"><div style="height:1px;background:linear-gradient(90deg,transparent,#e5e7eb,transparent);"></div></td></tr>
<tr><td style="background:linear-gradient(135deg,#0a1628 0%,#1a3a6e 100%);border-radius:0 0 16px 16px;padding:32px 40px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td><p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#ff6a00;">Pshetty Tech</p><p style="margin:0;font-size:11px;color:rgba(255,255,255,.35);">pshettytechofficial@gmail.com</p></td>
    <td style="text-align:right;"><p style="margin:0;font-size:11px;color:rgba(255,255,255,.25);">&copy; ${new Date().getFullYear()} Pshetty Tech<br>All rights reserved.</p></td>
  </tr></table>
</td></tr>
<tr><td style="height:32px;"></td></tr>
</table></td></tr></table></body></html>`;
}

module.exports = { sendQuoteEmail, sendWelcomeEmail, sendOTP, sendMeetingEmail, sendInvoiceEmail, sendCompletionEmail };
