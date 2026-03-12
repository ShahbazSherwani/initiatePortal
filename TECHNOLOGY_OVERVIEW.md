# InitiatePH Platform — Technology Overview
### Prepared for Presentation | March 2026

---

## Executive Summary

InitiatePH is the Philippines' first all-in-one crowdfunding platform built for retail investors and SME borrowers operating under the regulatory framework of the Securities and Exchange Commission (SEC) of the Philippines. The platform has been engineered with a production-grade, multi-layered technology stack that covers the full spectrum from user-facing interfaces to database security, real-time threat detection, and automated compliance enforcement. This document provides a detailed account of every technology layer employed in the platform, the rationale behind each selection, and how they collectively deliver a secure, scalable, and regulatory-compliant financial services platform.

---

## 1. Frontend — React 18 with TypeScript

The user interface of InitiatePH is built on **React 18**, developed by Meta, which is the industry standard for building complex single-page applications that require real-time state management, interactive UI components, and high responsiveness. React's component-based architecture was chosen specifically because it allows the development team to build reusable, maintainable UI components — from investment cards to compliance dashboards — without duplicating logic. React 18 introduces concurrent rendering features that allow the browser to prioritise user-visible updates, resulting in a noticeably more fluid experience compared to traditional rendering models.

All frontend code is written in **TypeScript**, a statically-typed superset of JavaScript. TypeScript was adopted because financial platforms demand precision — a mismatched data type between what the frontend sends to the API and what the backend expects can result in incorrect monetary values, failed transactions, or corrupted investor records. TypeScript's compile-time type checking catches these mismatches during development, before they reach users. This is especially critical in the investment and payout calculation flows where amounts, percentages, and dates must be validated at every layer.

---

## 2. Build Tooling — Vite 6

The frontend is bundled and served using **Vite 6**, a next-generation build tool that leverages native ES Modules in the browser during development and esbuild for production bundling. Compared to older tools like Webpack, Vite provides near-instantaneous hot module replacement (HMR) during development, which dramatically reduces developer friction when iterating on UI features. In production, Vite's Rollup-based bundler generates optimally split chunks, enabling aggressive code-splitting so that users only download JavaScript relevant to the page they are currently viewing. This is critical for a platform with dozens of screens spanning investor flows, borrower creation, admin compliance dashboards, and owner portals.

---

## 3. UI Component System — Radix UI + Tailwind CSS + shadcn/ui

The visual design system is built on **Radix UI**, a low-level, unstyled, accessible component library. Radix UI provides the structural and accessibility foundations for complex interactive components such as dropdown menus, select inputs, checkboxes, popover overlays, tabs, and radio groups — all of which appear extensively throughout the platform's registration, project creation, and admin management flows. Radix UI primitives are ARIA-compliant out of the box, meaning the platform meets accessibility standards without requiring manual ARIA attribute management on every element.

**Tailwind CSS** provides the utility-first styling layer. Rather than writing component-scoped CSS, every visual style is composed from atomic utility classes directly in JSX. This approach results in a consistent design language across the entire application, eliminates stylesheet bloat from unused rules, and allows rapid visual iteration without context-switching between CSS files and component files.

The combination of Radix primitives with Tailwind's utility classes is exposed to developers through **shadcn/ui**, an opinionated but customisable component scaffolding system that generates production-ready, brand-aligned components directly into the project codebase. This gives the development team full ownership over component behaviour without depending on an external component library that could change its API or drop support.

---

## 4. Backend — Node.js with Express 5

The server-side logic of InitiatePH is powered by **Node.js** running an **Express 5** HTTP server. Node.js was selected for its event-driven, non-blocking I/O model, which is exceptionally well-suited to a financial platform where many concurrent users may be submitting investment requests, uploading documents, or querying project data simultaneously. Express 5, the latest major release, introduces built-in asynchronous error handling which ensures that unhandled promise rejections in route handlers are automatically caught and forwarded to error middleware, preventing server crashes in production.

The backend server (`server.js`) is a 14,000+ line monolith that has been deliberately structured with clearly separated concerns: authentication middleware, database access layers, email services, audit logging, intrusion detection hooks, and business logic are all modularly organized within the same runtime. The decision to keep this as a single deployable unit was made for operational simplicity on the Render.com hosting platform, while still maintaining clean internal architecture.

---

## 5. Deployment Infrastructure

### Frontend — Vercel
The React application is deployed on **Vercel**, the platform built by the creators of Next.js. Vercel provides automatic deployments triggered by every Git push to the `main` branch, global edge CDN distribution, automatic HTTPS via Let's Encrypt, and zero-downtime deployments via atomic build swaps. The frontend is accessible at `initiate-portal.vercel.app` and is served from Vercel's global edge network, ensuring minimal latency for users across the Philippines and beyond.

### Backend — Render
The Express API server is deployed on **Render**, a modern cloud platform that provides managed web services with automatic SSL, zero-configuration deployments from Git, and health monitoring. The backend runs at `initiate-portal-api.onrender.com`. Render was chosen over traditional providers like AWS or GCP for its simplicity, built-in free SSL, and automatic environment variable management without operational overhead that would distract from product development.

### Containerisation — Docker
The platform includes a `Dockerfile` that containerises the Express server, enabling the application to be reproduced in any environment with complete dependency isolation. Docker ensures that the production environment on Render is byte-for-byte identical to local development environments, eliminating environment-specific bugs in authentication flows, database connections, and email delivery.

---

## 6. Database — PostgreSQL via Supabase

All persistent data for the platform is stored in **PostgreSQL**, the world's most advanced open-source relational database. PostgreSQL was chosen over alternatives because financial platforms require ACID transactions — Atomicity, Consistency, Isolation, and Durability — which guarantee that, for example, a wallet top-up and the corresponding ledger entry either both succeed or both fail together, never leaving the system in a partial state.

The PostgreSQL instance is hosted on **Supabase**, which provides managed PostgreSQL with built-in connection pooling, real-time subscriptions, a web-based SQL editor for migrations, and a PostgREST API layer. The platform uses Supabase's `pg` Node.js driver (via a `Pool` connection) from the backend, not Supabase's client SDK, ensuring that all database access goes through the authenticated, server-side service role and is never exposed to the browser.

**Row Level Security (RLS)** has been explicitly enabled on every table in the `public` schema. Each table has a corresponding `service_role` policy that grants full access to the backend's PostgreSQL user, alongside user-scoped policies that prevent any direct PostgREST or anon-key access from reading or modifying other users' data. Tables protected with RLS include: `users`, `borrower_profiles`, `investor_profiles`, `projects`, `wallets`, `topup_requests`, `borrow_requests`, `team_members`, `support_tickets`, `audit_logs`, `payment_transactions`, `email_verifications`, `password_reset_tokens`, and all security event tables.

---

## 7. Authentication — Firebase Authentication

User authentication is handled by **Firebase Authentication**, Google's managed identity platform. Firebase Auth was selected for its battle-tested reliability, support for multiple sign-in providers, built-in token management, and the separation it provides between identity (who you are) and authorisation (what you can do). When a user signs in, Firebase issues a signed **JSON Web Token (JWT)** using RS256 (RSA Signature with SHA-256), which the frontend stores and attaches as a `Bearer` token on every subsequent API request.

The Express backend uses the **Firebase Admin SDK** (`firebase-admin`) to verify these JWTs on every protected route via a `verifyToken` middleware. This verification is cryptographic — it validates the token's signature against Firebase's public key, checks the expiry, and extracts the user's Firebase UID. This UID is then used to look up the user's profile and permissions in the PostgreSQL database, creating a clean two-factor identity model: Firebase proves identity, PostgreSQL determines permissions.

---

## 8. Email Delivery — Mailjet + Nodemailer + SendGrid

Transactional email delivery is handled through a multi-provider setup to ensure maximum deliverability. The primary provider is **Mailjet**, which is used for verification emails, investment confirmations, and invitation emails. Mailjet was chosen for its DKIM and SPF signing capabilities, which are essential for avoiding spam filters — particularly important for a financial platform where users must receive OTPs and legal agreement emails reliably.

**Nodemailer** is used as a fallback transport layer and for environments where direct SMTP access is preferred. **SendGrid** is in the stack as a secondary provider, providing an additional fallback and enabling A/B testing of email templates across providers.

All email flows implement proper DKIM signing configuration, SPF record alignment, custom `Reply-To` headers, and unsubscribe headers in compliance with spam prevention standards. The platform also implements email verification with time-limited tokens stored in the `email_verifications` table, and password reset tokens stored in `password_reset_tokens` with expiry enforcement at the database level.

---

## 9. Payment Processing — PayMongo

Investment transactions and wallet top-ups are processed through **PayMongo**, the Philippines' leading payment gateway. PayMongo supports GCash, Maya, credit cards (Visa/Mastercard), and online banking transfers, making it accessible to the broadest possible range of Filipino retail investors. PayMongo is PCI DSS compliant, meaning all card data processing meets the Payment Card Industry Data Security Standard without the platform needing to handle raw card numbers.

The integration uses PayMongo's Checkout API, which redirects users to PayMongo's hosted payment page — ensuring that sensitive payment credentials never touch the InitiatePH servers. Upon payment completion, PayMongo sends a cryptographically signed webhook to the backend, which verifies the signature and then updates the user's wallet balance and transaction history in PostgreSQL.

---

## 10. Data Encryption at Rest — AES-256-GCM

All sensitive personal and financial data stored in the database is encrypted using **AES-256-GCM** (Advanced Encryption Standard with a 256-bit key in Galois/Counter Mode), implemented in `src/server/encryption.js`. AES-256 is a NIST-approved symmetric encryption standard used by governments and financial institutions worldwide. The GCM mode was specifically chosen over CBC or ECB because it provides **authenticated encryption** — meaning it simultaneously encrypts the data and computes an authentication tag that detects any tampering with the ciphertext.

Each encrypted value is stored in the format `iv:authTag:encryptedData`, where:
- `iv` is a 16-byte (128-bit) cryptographically random Initialization Vector, unique per encryption operation
- `authTag` is a 16-byte GCM authentication tag that verifies data integrity
- `encryptedData` is the AES-256 encrypted ciphertext

The encryption key is a 32-byte (256-bit) key stored exclusively in environment variables — never in the codebase or database. This means even if the database were fully compromised, the encrypted columns would remain unreadable without the separate encryption key. Fields protected include: bank account numbers, national ID numbers, tax identification numbers, and other KYC-sensitive data.

---

## 11. Intrusion Detection System (IDS)

InitiatePH operates a custom real-time **Intrusion Detection System** implemented in `src/server/intrusion-detection.js`. This system monitors all incoming HTTP requests and maintains in-memory tracking maps to detect behavioural anomalies across the following threat categories:

**Brute Force and Credential Attacks:** The IDS tracks failed login attempts per IP address within a sliding 15-minute window. After 5 failed attempts, the account is flagged; after 10, the IP is temporarily blocked. Credential stuffing patterns (rapid sequential login attempts with different credentials) are detected by cross-referencing request frequency with the diversity of attempted usernames.

**SQL Injection Detection:** Every request body and URL parameter is scanned against a bank of SQL injection patterns using compiled regular expressions that detect UNION-based, boolean-based, and time-based blind injection attempts. Patterns match common payloads including `SELECT/INSERT/UPDATE/DELETE/DROP`, comment sequences (`--`, `/*`), and hex-encoded payloads (`0x...`).

**Cross-Site Scripting (XSS) Detection:** The IDS scans for XSS payloads including `<script>` tags, `javascript:` protocol handlers, inline event handlers (`onerror`, `onclick`, etc.), and `eval()` calls in all user-supplied input.

**Path Traversal Detection:** Patterns detect `../` directory traversal sequences and their URL-encoded variants (`%2e%2e/`) that could be used to read files outside the application root.

**Command Injection Detection:** Shell metacharacters and common Unix command names are detected in input to prevent server-side command execution.

**Mass Data Access Detection:** The IDS monitors for users or IPs that attempt to retrieve unusually large volumes of records in a short time, flagging potential data exfiltration.

**Bot Detection:** Requests are fingerprinted by User-Agent patterns, request timing, and behavioural signatures to identify automated scrapers and API scanners.

All detected threats are classified by severity (`low`, `medium`, `high`, `critical`) and persisted to the `security_events` table in PostgreSQL for audit trail purposes.

---

## 12. Audit Logging System

Every significant action on the platform — authentication events, profile changes, project submissions, investment approvals, refund decisions, and administrative actions — is recorded by the **AuditLogger** (`src/server/audit-logger.js`) into the `audit_logs` table.

Each audit record captures: the user's Firebase UID and email, the action type (e.g., `PROJECT_APPROVED`, `USER_SUSPENDED`, `REFUND_INITIATED`), the action category (`AUTH`, `USER_MGMT`, `PROJECT`, `FINANCIAL`, `ADMIN`, `SYSTEM`), the resource type and ID affected, the IP address of the request, the User-Agent string, the HTTP method and URL, the operation outcome (`success`, `failure`, `error`), and a JSON metadata blob for action-specific additional context.

This provides a non-repudiation trail that satisfies the recordkeeping requirements of the SEC's Crowdfunding Regulations, enabling regulators or internal compliance officers to reconstruct the complete history of any transaction, user action, or administrative decision.

---

## 13. Automated Vulnerability Scanning

The platform incorporates an automated **Vulnerability Scanner** (`src/server/vulnerability-scanner.js`) that runs `npm audit` against the full dependency tree on-demand or on a schedule. The scanner parses the JSON output of npm's security advisory database to produce a structured list of known CVEs (Common Vulnerabilities and Exposures) affecting installed packages, including the severity level, affected version range, recommended fix version, and a link to the advisory.

Scan results are stored in the `vulnerability_scans` and `vulnerability_scan_history` tables in PostgreSQL, creating a time-series record of the platform's dependency security posture. This enables the team to demonstrate to auditors and regulators that dependency security is actively monitored rather than checked once at deployment.

---

## 14. API Rate Limiting — express-rate-limit

All public-facing API endpoints are protected by rate limiting using the **express-rate-limit** library. Rate limiting is a fundamental defence against denial-of-service attacks, brute-force credential attacks, and API scraping. The platform applies differentiated rate limits based on endpoint sensitivity: authentication endpoints have much tighter limits than data-fetch endpoints, and administrative endpoints are rate-limited separately from user endpoints.

Rate limit violations are detected by the Intrusion Detection System and logged as `RATE_LIMIT_EXCEEDED` security events, allowing the operations team to distinguish automated attacks from legitimate traffic spikes.

---

## 15. HTTP Security Headers — Helmet.js

The Express server uses **Helmet.js**, a collection of middleware functions that set security-relevant HTTP response headers to protect against common web vulnerabilities:

- **Content-Security-Policy (CSP):** Restricts which origins can load scripts, styles, images, and frames, mitigating XSS attacks even if an injection succeeds.
- **X-Content-Type-Options: nosniff** — Prevents browsers from MIME-sniffing responses, closing a class of content-injection attacks.
- **X-Frame-Options: DENY** — Prevents the platform from being embedded in iframes on other domains, blocking clickjacking attacks.
- **Strict-Transport-Security (HSTS):** Forces browsers to only connect over HTTPS for a defined period, preventing SSL stripping attacks.
- **Referrer-Policy:** Controls how much referrer information is sent with requests, protecting user privacy.
- **X-DNS-Prefetch-Control:** Reduces information leakage through DNS prefetching.

---

## 16. CORS Policy

Cross-Origin Resource Sharing is managed via the **cors** middleware with an explicit whitelist of allowed origins. Only verified frontend domains (`initiate-portal.vercel.app`, localhost development ports) are permitted to make cross-origin API requests. All other origins receive a `403 Forbidden` response at the CORS preflight stage, before any request body is processed. This prevents malicious third-party websites from making authenticated API calls using a logged-in user's credentials.

---

## 17. SEC Compliance Engineering

InitiatePH is not merely compliant with the SEC Crowdfunding Regulations by policy — the compliance requirements are enforced programmatically in the codebase:

**Investment Limit Classification and Enforcement:** The platform automatically classifies investors into annual income brackets based on declared gross annual income and enforces the corresponding investment cap per project per 12-month period. Attempts to invest beyond the regulatory limit are rejected at the API level, not merely warned about in the UI.

**Minimum Funding Target (MFT) Enforcement:** Every project must declare a minimum funding target. If the total pledged amount at campaign close does not meet the MFT, all investor funds are automatically queued for full refund. This is enforced at the data model layer.

**90-Day Campaign Cap:** Campaign end dates are capped at 90 days from the start date in the project creation flow, matching the SEC-prescribed maximum offering period. Date pickers on milestone screens are bounded to this campaign window.

**Material Change Notification System:** When a borrower modifies a material term of a live project, the platform automatically queues notifications to all existing investors via the notification system and creates an immutable audit log entry of the change.

**Post-Offering Report Automation:** The system auto-generates post-offering report due dates 30 days after campaign close for every funded project, tracked in the compliance calendar.

**Ticket SLA Clock:** Support tickets are automatically timestamped and the compliance calendar tracks overdue tickets to ensure responses meet internal and regulatory service level agreements.

**Refund Dual-Approval:** Refund requests above a defined monetary threshold require approval from two separate admin-level users before processing, enforcing a maker-checker control common in financial operations.

**Compliance Calendar:** A dedicated admin screen displays all upcoming and overdue compliance obligations — post-offering report deadlines, quarterly AML review dates, investor reconfirmation deadlines, and SEC filing dates — colour-coded by severity.

**AML Red-Flag Logging:** The platform implements a Suspicious Transaction Report (STR) and Cash Transaction Report (CTR) logging system aligned with the Anti-Money Laundering Act of the Philippines. Transactions and users can be flagged, reports can be marked as filed, and a complete log is maintained for AMLC reporting purposes.

**Escrow Reconciliation:** A dedicated reconciliation engine compares `amountRaised` as recorded in project records against the sum of all `investorRequests` and cross-references wallet balances to detect and surface any discrepancies down to a one-peso tolerance.

---

## 18. Routing and Navigation — React Router v7

Client-side routing is handled by **React Router v7**, the most widely adopted routing library in the React ecosystem. The platform implements a multi-tiered route guard system:

- `PrivateRoute` — ensures the user is authenticated before rendering
- `AdminRoute` — ensures the user holds the `isAdmin` flag in their database profile
- `TeamOrAdminRoute` — permits access to either admins or team members with the specified permission scope
- `OwnerRedirect` — intelligently redirects from `/owner` to the appropriate sub-route based on whether the visitor is the platform owner or a team member

This layered guard system ensures that, for example, a logged-in investor cannot access `/owner/compliance` even by typing the URL directly — the route guard intercepts and redirects them.

---

## 19. State Management — React Context API

Platform-wide state is managed through a custom, lightweight **Context API** architecture rather than a heavy-weight library like Redux. The following context providers are in use:

- `AuthContext` — holds the Firebase JWT token, current user object, and authentication state
- `AccountContext` — tracks which account type (investor/borrower) is currently active
- `ProjectFormContext` — carries multi-step project creation form data across screens without remounting
- `ProjectsContext` — provides project CRUD operations and caching to all borrower screens
- `RegistrationProvider` — manages the multi-step registration flow state

This approach keeps bundle size small, avoids boilerplate, and provides direct component-level access to the data each screen needs.

---

## 20. Date Handling and Calendar — date-fns, FullCalendar, react-datepicker

Date arithmetic throughout the platform uses **date-fns**, a modular date utility library with no side effects and full TypeScript support. date-fns is used for campaign duration calculation, interest period computation, compliance deadline scheduling, and payout date validation.

The **FullCalendar** library (`@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/interaction`) powers the compliance calendar and unified calendar views, providing a rich, interactive calendar UI with event rendering, click interactions, and range selection.

**react-datepicker** is used in the project creation and milestone flows where users must select dates within bounded ranges — campaign start/end dates are bounded to SEC's 90-day maximum, and milestone release dates are bounded to within the chosen campaign window.

---

## 21. Notification System

The platform operates a real-time in-app notification system backed by a `notifications` table in PostgreSQL with RLS protection. Notifications are pushed to users for investment status changes, project approvals, material change alerts, and refund completions. The frontend polls for new notifications on a defined interval and surfaces them via the notification bell in the navigation bar, with unread count badges.

Email notifications are dispatched for the same critical events through the Mailjet provider, ensuring users are informed even when not actively using the platform.

---

## 22. Penetration Testing Practices

The following penetration testing and security validation practices were conducted during and after development:

**SQL Injection Testing:** Test payloads including `' OR 1=1 --`, UNION-based payloads, and time-based blind injection strings were submitted to every user-facing input field and API endpoint. All inputs pass through the IDS layer and, separately, use parameterised queries (`pg` prepared statement placeholders) throughout `server.js`, making injection structurally impossible at the database layer.

**Authentication Bypass Testing:** Attempts were made to access protected routes with expired JWTs, tampered JWTs, tokens issued by a different Firebase project, and requests with no `Authorization` header. All such attempts were correctly rejected by the `verifyToken` middleware.

**Privilege Escalation Testing:** Authenticated investor accounts attempted to access admin-protected routes (`/owner/users`, `/owner/compliance`, etc.) by manipulating the `Authorization` header with their own valid token. The `AdminRoute` and `TeamOrAdminRoute` guards correctly blocked all such access.

**Brute Force Testing:** Automated scripts sent 20+ sequential failed login attempts to the `/api/login` endpoint. The IDS correctly flagged and blocked the IP after the configured threshold, logging a `BRUTE_FORCE` security event.

**XSS Testing:** Script injection payloads (`<script>alert(1)</script>`, `javascript:alert()`, `"><img onerror=alert(1)>`) were submitted in project description fields, ticket messages, and user profile fields. The IDS intercepted these at the middleware layer. Stored XSS attempts were further neutralised by React's default HTML escaping in rendered JSX.

**CORS Bypass Testing:** Requests were made from non-whitelisted origins (arbitrary domains and localhost ports not in the whitelist). All requests were correctly rejected at the CORS preflight stage with `403` responses.

**Rate Limit Testing:** Endpoints were hammered with automated requests at 100+ requests per second. The `express-rate-limit` middleware correctly throttled responses with `429 Too Many Requests` after the configured window was exceeded.

**Path Traversal Testing:** Requests containing `../../etc/passwd` and URL-encoded equivalents were submitted to file-serving and image-upload endpoints. The IDS flagged these as `PATH_TRAVERSAL` events and rejected them.

**Dependency Vulnerability Audit:** `npm audit` was run across the full dependency tree. All identified vulnerabilities of `high` severity or above were remediated before production deployment. The vulnerability scanner runs scheduled checks post-deployment to catch newly disclosed CVEs in the dependency tree.

---

## 23. Development Toolchain

The development environment uses **Concurrently** to run the Vite dev server and Express API server simultaneously in a single terminal process, enabling full-stack development with hot reloading. Environment variables are managed via **dotenv** in development and platform-native secret management (Render environment variables, Vercel environment variables) in production — ensuring secrets are never committed to the Git repository.

Type-safety across the backend is progressively increasing — the server is authored in modern ESM (`import`/`export`) JavaScript with JSDoc annotations, and the frontend is fully TypeScript with strict null-checking enabled.

---

## Summary Technology Matrix

| Layer | Technology | Purpose |
|---|---|---|
| Frontend Framework | React 18 | Component-based UI |
| Language | TypeScript | Type safety |
| Build Tool | Vite 6 | Fast bundling & HMR |
| UI Components | Radix UI + shadcn/ui | Accessible component primitives |
| Styling | Tailwind CSS | Utility-first design system |
| Backend Runtime | Node.js | Non-blocking I/O server |
| Backend Framework | Express 5 | HTTP routing & middleware |
| Frontend Hosting | Vercel | Edge CDN, CI/CD |
| Backend Hosting | Render | Managed web service |
| Containerisation | Docker | Environment reproducibility |
| Database | PostgreSQL (Supabase) | ACID-compliant relational data |
| Database Security | Row Level Security (RLS) | Per-table access policies |
| Authentication | Firebase Auth (JWT RS256) | Identity management |
| Data Encryption | AES-256-GCM | Encryption at rest |
| Email | Mailjet / Nodemailer / SendGrid | Transactional delivery |
| Payments | PayMongo | PCI DSS-compliant payments |
| IDS | Custom (Node.js) | Real-time threat detection |
| Audit Logging | Custom AuditLogger | Non-repudiation trail |
| Vulnerability Scanning | npm audit (automated) | CVE monitoring |
| Rate Limiting | express-rate-limit | Brute force / DDoS defence |
| HTTP Security | Helmet.js | Security headers |
| CORS | cors (whitelist) | Cross-origin protection |
| Routing | React Router v7 | Client-side navigation & guards |
| State Management | React Context API | Lightweight global state |
| Date Handling | date-fns | Safe date arithmetic |
| Calendar UI | FullCalendar | Compliance & event calendar |
| Compliance Engine | Custom (SEC PH rules) | Regulatory enforcement in code |

---

*Document prepared by the InitiatePH Engineering Team — March 2026*
