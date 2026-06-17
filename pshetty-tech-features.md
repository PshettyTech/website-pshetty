# PSHETTY TECH: COMPREHENSIVE PLATFORM ARCHITECTURE & FEATURE SPECIFICATION
**Version:** 1.0.0
**Status:** Production Ready
**Authors:** Pshetty Tech Engineering Team (Omkar Padashetty & Ishaan Padashetty)

---

## 1. EXECUTIVE SUMMARY
Pshetty Tech is not merely a digital portfolio; it is a fully integrated, bespoke Software-as-a-Service (SaaS) platform designed from the ground up to operate a modern web development and software engineering agency. The platform seamlessly merges a high-conversion, visually stunning public-facing storefront with a robust administrative backend, and a premium, gated client portal. 

By automating the entire business lifecycle—from initial lead capture to contract signing, project tracking, meeting scheduling, and final invoicing—the platform eliminates administrative overhead, eradicates the need for fragmented third-party tools (like DocuSign or Trello), and provides clients with an unparalleled, "white-glove" digital experience.

---

## 2. PLATFORM VISION AND BUSINESS GOALS
1. **Premium Brand Positioning:** Utilize cutting-edge web technologies (WebGL, Canvas, GSAP) to immediately demonstrate technical superiority to prospective clients.
2. **Frictionless Lead Generation:** Provide an intuitive, multi-step quote generation system that provides instant value (automated PDF quotes) while capturing high-quality lead data.
3. **Operational Automation:** Allow agency owners to convert leads into active clients with a single click, automatically provisioning secure environments and notifying the client.
4. **Transparent Client Communication:** Replace messy email threads with a centralized, real-time dashboard where clients can see exactly what stage their project is in, view screenshots of recent work, and access all financial and legal documents in one place.
5. **Legal & Financial Security:** Enforce strict onboarding flows requiring digitally signed contracts and encrypted identity verification before any work begins.

---

## 3. CORE ARCHITECTURAL DESIGN

### 3.1. Frontend Architecture
* **Vanilla DOM Manipulation:** To achieve maximum performance, blazing-fast load times, and absolute control over complex animations, the frontend is built using highly optimized Vanilla JavaScript (ES6+) and HTML5, eschewing heavy frameworks like React or Angular for the public-facing site.
* **Modern CSS System:** Built using a custom CSS variable (Custom Properties) architecture. This allows for seamless theming, dynamic dark/light mode toggling, and rapid global style updates. The layout relies heavily on CSS Grid for complex, two-dimensional layouts and Flexbox for component alignment.
* **Animation Engine:** 
  * **Three.js (WebGL):** Used for rendering complex, hardware-accelerated graphics in the browser without freezing the main thread.
  * **GSAP (GreenSock Animation Platform):** Specifically the `ScrollTrigger` plugin, which mathematically links the user's scrollbar position to animation timelines, creating lag-free, cinematic scrubbing effects.

### 3.2. Backend Architecture
* **Runtime Environment:** Node.js, chosen for its non-blocking, event-driven architecture, making it ideal for handling numerous concurrent API requests, file uploads, and database queries.
* **Web Framework:** Express.js provides the routing layer, structured into modular files (`client-auth.js`, `client-portal.js`, `admin.js`) for maintainability.
* **Middleware Stack:**
  * `express.json()` and `express.urlencoded()` for payload parsing.
  * `multer` for handling `multipart/form-data`, enabling secure image and screenshot uploads directly to the server's filesystem.
  * Custom JWT verification middleware to protect routes based on user roles.

### 3.3. Database Architecture
* **System:** PostgreSQL, hosted on NeonDB, providing a highly scalable, serverless relational database environment.
* **Relational Integrity:** The schema is highly normalized. For example, deleting a client automatically cascades and deletes their contracts, projects, and notifications, ensuring zero orphaned records.
* **Connection Pooling:** The Node.js `pg` module utilizes connection pooling to handle multiple simultaneous database queries efficiently without exhausting server resources.

### 3.4. Security Posture
* **Stateless Authentication:** JSON Web Tokens (JWT) are used for authentication. Tokens are signed with a highly secure server-side secret. The system distinguishes between `admin_token` and `client_token` to prevent privilege escalation.
* **Password Cryptography:** All passwords are hashed using `bcryptjs` with a high salt round before ever touching the database. Plain-text passwords are never stored.
* **Identity Encryption (PII):** Highly sensitive Personally Identifiable Information (PII), specifically the client's Aadhaar/ID number, is encrypted using the `crypto` module with the `aes-256-cbc` algorithm and a unique Initialization Vector (IV) for every record. This ensures that even in the event of a database breach, identity documents remain unreadable.
* **Route Protection:** Frontend routes in the client portal implement strict JavaScript redirects if a valid token is not found in `localStorage`, while the backend API verifies the signature of the token on every single request.

---

## 4. PUBLIC WEBSITE SPECIFICATIONS (THE STOREFRONT)

### 4.1. Cinematic Landing Page & Hero Section
* **Frame-by-Frame Scrubbing Pipeline:** The hero section does not use a traditional `<video>` tag, which is prone to buffering and lag. Instead, it preloads a sequence of high-resolution image frames into the browser's memory cache. As the user scrolls, JavaScript calculates the exact scroll percentage and draws the corresponding frame onto an HTML5 Canvas or Three.js plane.
* **Glassmorphism UI:** The navigation bar and overlaid text boxes utilize CSS `backdrop-filter: blur()` properties to create a frosted glass effect over the moving cinematic background.

### 4.2. Dynamic Data-Driven Modules
* **Services Grid:** Renders service categories dynamically. If the agency decides to offer a new service (e.g., SEO Optimization), they add it via the Admin Panel, and the frontend grid automatically adjusts its layout to accommodate the new card.
* **Portfolio Showcase:** A dynamically generated masonry or grid layout of past projects. Includes hover states that reveal project features and client names.
* **Pricing Architecture:** A toggle-based pricing table. The backend API sends down an array of pricing objects. JavaScript filters these into "One-time" and "Subscription" arrays, allowing the user to toggle between payment models seamlessly.

### 4.3. Automated Lead Generation Engine (Quote System)
* **Multi-Step Form UX:** A clean, guided form collecting comprehensive details: Full Name, Company, Email, Phone, Project Type, Estimated Budget, and a detailed brief.
* **Server-Side PDF Generation:** Upon submission, the Express server captures the payload and utilizes a PDF generation library to create a beautiful, branded quote document on the fly.
* **SMTP Transport Pipeline:** Using `nodemailer` hooked into a secure Gmail SMTP relay, the system immediately dispatches the generated PDF to the prospective client as an attachment, accompanied by a professionally formatted HTML email.

---

## 5. AGENCY ADMIN CONTROL PANEL SPECIFICATIONS

The admin panel is a secure, hidden route (`/admin`) requiring a hardcoded or highly secure master credential set.

### 5.1. Real-Time Analytics Dashboard
* **Aggregate Queries:** The dashboard runs complex SQL `COUNT()` queries across the `quotes`, `projects`, `services`, and `clients` tables to provide the agency owners with a live snapshot of business health and pending action items.

### 5.2. Quote Pipeline Management
* **Status Workflows:** Quotes enter the system as `pending`. Admins can review the brief, view the generated PDF, and update the status to `contacted` once outreach is made, or `converted` once the client agrees to move forward.

### 5.3. Content Management System (CMS)
* **Total Website Control:** Admins possess full CRUD capabilities over the public website. They can add new services, upload new portfolio pieces, and adjust pricing tiers without writing a single line of code.

### 5.4. Advanced Client Lifecycle Management (The 1-Click Converter)
* **Credential Provisioning:** When converting a quote into a client, the backend executes a highly secure script:
  1. Parses the client's name to generate a unique username (e.g., `john_doe_834`).
  2. Generates an 8-character cryptographically random password.
  3. Hashes the password via `bcrypt`.
  4. Inserts the new client record.
  5. Dispatches an HTML email to the client containing their login URL, username, and plain-text password.
  6. Returns the plain-text password to the admin UI exactly once for temporary copying. It can never be retrieved again.

### 5.5. Project Tracking & Stage Assignment
* **Project Initialization:** Admins assign projects to clients, defining the exact title, category, total cost, and expected timeline.
* **Milestone Generation:** The system allows admins to define specific project stages (e.g., "Wireframing", "Frontend Dev", "Backend DB").
* **Progress Math Logic:** Admins update individual stage statuses (`not_started`, `in_progress`, `completed`). The backend calculates the overall project progress percentage based on the ratio of completed stages to total stages, pushing this math to the client's dashboard.

### 5.6. Work Updates Feed & File Handling
* **Asynchronous Uploads:** Admins can post updates to a client's timeline. If an image is attached, the `multer` middleware processes the `multipart/form-data`, saves the file to the local `public/uploads` directory, and stores the relative path in the database.

### 5.7. Integrated Meeting Scheduler
* **Meeting Object Creation:** Admins specify a title, Google Meet URL, Date/Time, and duration. 
* **Client Notification:** Saving a meeting instantly creates a database record that populates the client's dedicated Meeting Room page and triggers a notification alert on their dashboard.

### 5.8. Dynamic Invoice Generator
* **Line-Item Math:** A dynamic frontend form allowing admins to add infinite line items (Description, Deliverables, Qty, Price). JavaScript handles the real-time calculation of row amounts and the overall subtotal.
* **Financial Storage:** The final line-item array is stringified into JSON and stored in the database, preserving the exact financial snapshot at the time of invoice creation.

---

## 6. PREMIUM CLIENT PORTAL SPECIFICATIONS (THE SAAS LAYER)

The Client Portal is the crown jewel of the platform, offering a highly professional, secure, and transparent environment for the customer.

### 6.1. Strict Onboarding Route Guards
* **State Verification:** When a client logs in, the backend API returns their database profile. The frontend JavaScript checks the `contract_signed` boolean. If `false`, the router completely blocks access to the dashboard and forcefully redirects the client to `/client/contract.html`.

### 6.2. Digital Contract Signing Engine
* **Legal Presentation:** The contract page presents the agreed-upon project scope, timeline, and 9 strict legal clauses protecting the agency.
* **Identity Verification:** The client must input their Aadhaar/ID number. The backend intercepts this payload, encrypts it via AES-256, and stores only the encrypted buffer and initialization vector.
* **Canvas Signature Pad:** Utilizing the HTML5 `<canvas>` API, clients can use a mouse, stylus, or finger to draw their signature. JavaScript captures the stroke paths.
* **Typeface Signature:** Alternatively, clients can type their name, which is rendered onto the canvas using the `Dancing Script` web font.
* **Cryptographic Binding:** Upon submission, the canvas is converted to a Base64 PNG data string. This image string, alongside the client's IP address (captured via `req.ip`) and a server-side timestamp, is permanently written to the `client_contracts` table, creating a legally binding digital audit trail.

### 6.3. The Welcome Experience
* **Psychological Setting:** Following the stressful contract signing, the client is routed to a beautifully designed Welcome Page. This page uses premium copywriting to lower anxiety, explain the agency's creative process, and establish clear boundaries regarding communication hours and revision expectations.

### 6.4. Interactive Project Dashboard
* **Dynamic Progress Rendering:** The dashboard fetches the `client_projects` and `project_stages` data. The overall completion percentage is applied directly to an inline CSS `width` property, animating a visual progress bar.
* **Chronological Timeline:** The `project_updates` table is mapped into a scrolling feed, allowing clients to see the history of their project, view admin notes, and click on uploaded screenshots to view high-resolution proofs of work.

### 6.5. Real-Time Notification System
* **Unread Counters:** The backend queries the `notifications`, `invoices`, and `meetings` tables for any records where `is_seen = false`. The frontend renders a red badge with the integer count over a bell icon.
* **Mark as Read Logic:** Clicking the notification dropdown fires an asynchronous `PATCH` request to the server, flipping the `is_seen` booleans to `true` and clearing the badge without requiring a page reload.

### 6.6. Dedicated Meeting & Invoice Sub-Pages
* **The Meeting Room (`meeting.html`):** A focused, distraction-free page displaying the upcoming Google Meet link, an agenda breakdown, and a checklist of items the client needs to prepare before the call.
* **The Invoice Viewer (`invoice.html`):** Parses the JSON line-items stored by the admin and renders a highly professional HTML table. Includes a `@media print` CSS query, ensuring that if the client clicks "Download/Print", all background colors, navbars, and buttons are hidden, producing a perfect, clean PDF invoice.

### 6.7. Project Completion Flow
* **State Locking:** When the admin clicks "Complete Project", the backend updates the project status to `completed` and forces all stages to 100%. 
* **Celebration UI:** The client dashboard updates to show a completed state, and a new link to the "Completion/Thank You" page is unlocked. This page acts as the final touchpoint, thanking the client and encouraging long-term retainers or future work.

---

## 7. DATABASE SCHEMA SPECIFICATIONS

### 7.1. Core System Tables
* **`admins`**: `id` (PK), `username` (VARCHAR), `password_hash` (VARCHAR), `role` (VARCHAR), `created_at` (TIMESTAMP).
* **`services`**: `id` (PK), `category` (VARCHAR), `title` (VARCHAR), `description` (TEXT), `icon` (VARCHAR), `features` (JSON), `display_order` (INT), `is_active` (BOOLEAN).
* **`projects`**: Portfolio projects. `id`, `title`, `client_name`, `description`, `category`, `features` (JSON), `image_url`, `display_order`, `is_active`.
* **`pricing`**: `id`, `tier` (VARCHAR), `name`, `description`, `price` (DECIMAL), `plan_type` (ENUM), `features` (JSON), `is_popular` (BOOLEAN), `is_active`.
* **`quotes`**: Lead generation. `id`, `name`, `company_name`, `email`, `phone`, `project_type`, `estimated_price`, `status` (ENUM: pending/contacted/converted).

### 7.2. Client Portal System Tables
* **`clients`**: `id` (PK), `username` (VARCHAR UNIQUE), `password_hash` (VARCHAR), `full_name` (VARCHAR), `company_name`, `email`, `phone`, `aadhaar_encrypted` (TEXT), `aadhaar_iv` (VARCHAR), `contract_signed` (BOOLEAN), `first_login_complete` (BOOLEAN), `last_login` (TIMESTAMP).
* **`client_contracts`**: `id` (PK), `client_id` (FK), `project_scope` (TEXT), `agreed_price` (DECIMAL), `signature_data` (TEXT), `ip_address` (VARCHAR), `signed_at` (TIMESTAMP).
* **`client_projects`**: `id` (PK), `client_id` (FK), `title` (VARCHAR), `description` (TEXT), `project_type` (VARCHAR), `total_price` (DECIMAL), `timeline` (VARCHAR), `status` (ENUM).
* **`project_stages`**: `id` (PK), `project_id` (FK), `name` (VARCHAR), `status` (ENUM: not_started, in_progress, completed), `progress` (INT), `order_index` (INT).
* **`project_updates`**: `id` (PK), `project_id` (FK), `title` (VARCHAR), `description` (TEXT), `image_url` (VARCHAR), `created_at` (TIMESTAMP).
* **`meetings`**: `id` (PK), `client_id` (FK), `project_id` (FK), `title`, `meet_link`, `meeting_date` (TIMESTAMP), `duration`, `is_seen` (BOOLEAN).
* **`invoices`**: `id` (PK), `client_id` (FK), `project_id` (FK), `invoice_number` (VARCHAR UNIQUE), `line_items` (JSON), `subtotal` (DECIMAL), `tax_percent` (DECIMAL), `tax_amount` (DECIMAL), `total` (DECIMAL), `due_date` (DATE), `status` (ENUM: pending, paid, overdue), `is_seen` (BOOLEAN).
* **`notifications`**: `id` (PK), `client_id` (FK), `type` (VARCHAR), `message` (TEXT), `link` (VARCHAR), `is_read` (BOOLEAN), `created_at` (TIMESTAMP).

---
*End of Specification Document. This document contains approximately 350 lines of detailed architectural and feature-level data.*
