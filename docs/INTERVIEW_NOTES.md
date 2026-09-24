# DesignCheck AI — Technical Interview Preparation & Architecture Q&A

This document provides clear, concise, and developer-friendly explanations for the architectural design decisions in DesignCheck AI.

---

### 1. What real-world problem does this solve?
When frontend developers translate Figma mockups into code, human error introduces discrepancies in spacing, padding, font weights, colors, component dimensions, and responsive breakpoints. Manually comparing every page across different viewports is tedious and prone to misses. DesignCheck AI automates visual QA by taking deterministic browser screenshots of the live website, computing pixel differences against Figma references, clustering changes into bounding boxes, and leveraging Gemini AI to suggest exact CSS fixes.

### 2. Why React?
React provides an intuitive component-based architecture for rich interactive developer tools. It makes managing state for the multi-mode diff viewer, interactive bounding box overlays, and real-time test run polling straightforward and modular.

### 3. Why Vite?
Vite uses native ES modules (ESM) during development, providing instant server start and lightning-fast Hot Module Replacement (HMR). Its production build uses optimized bundling, completing builds in under a second.

### 4. Why Node.js & Express?
Node.js provides a single-language full-stack JavaScript environment, allowing code reuse (like validation schemas and coordinate math). Express provides a lightweight, unopinionated routing layer that makes it easy to compose security middlewares like Helmet, rate limiting, and granular permission checking.

### 5. Why MongoDB & Mongoose?
Visual QA data is naturally document-oriented. A test run contains variable pages, each with bounding box coordinate arrays and nested metadata. MongoDB handles flexible JSON structures effortlessly while Mongoose provides strict schema enforcement, default values, and index optimization.

### 6. Why Playwright?
Playwright Chromium was chosen because it allows complete control over headless browser execution. We can enforce deterministic rendering: disabling animations, hiding blinking carets, setting exact viewports (1440x900 or 390x844), waiting for `document.fonts.ready`, and capturing pixel-perfect PNG screenshots.

### 7. Why Figma REST API?
The Figma API allows developers to programmatically fetch file documents, inspect canvas and frame hierarchies, and export high-resolution PNG reference images directly using node IDs.

### 8. Why Gemini API?
Gemini provides fast, cost-effective multimodal and structured JSON intelligence. Using `@google/genai`, we receive strict JSON schemas for both generating safe website layouts and classifying visual discrepancies.

### 9. Why perform image comparison before invoking AI?
AI models are non-deterministic and can miss subtle 4px or 8px padding deviations. Deterministic pixel algorithms (`pixelmatch` + `sharp`) provide mathematical precision down to the exact pixel. Doing diff comparison first gives the AI concrete bounding box coordinates and similarity metrics.

### 10. Why not let Gemini alone compare the two screenshots?
LLMs are excellent at semantic understanding ("this is a blue button"), but poor at measuring exact pixel coordinates or verifying that margin-top is 24px instead of 32px. Using pixel comparison guarantees exact coordinates, while AI explains *why* the difference exists and *how* to investigate it.

### 11. Why use deterministic diff?
Deterministic algorithms ensure consistent test runs: the same two images will always yield the exact same match percentage and difference coordinates.

### 12. Why use AI after diff detection?
A raw diff image is just red pixels—it doesn't tell a developer what to fix. Gemini bridges this gap: it translates coordinate clusters into human-readable tickets (e.g., "Hero CTA position mismatch: The CTA appears lower than in Figma; check margin-top or parent flex gap").

### 13. How does role-based authorization work?
Users have a `role` (`SUPER_ADMIN`, `ADMIN_L2`, `ADMIN_L3`, `USER`) and an explicit `permissions` array. While normal users only view their own projects, L2 and L3 admins have specific permissions assigned by the Super Admin. Express middleware (`requirePermission`) validates permissions on every sensitive API endpoint, returning `403 FORBIDDEN` if unauthorized.

### 14. How is the Figma token protected?
The personal access token is encrypted on the backend using AES-256-GCM authenticated encryption before being saved in MongoDB. The decryption key is stored in environment variables, and the API response serializer explicitly strips encrypted tokens and password hashes before returning data to the client.

### 15. How is SSRF handled?
When Playwright visits website URLs, `safeUrlValidator` inspects the target: it restricts protocols to HTTP/HTTPS, blocks loopback IPs (`127.0.0.1`, `localhost`), blocks private corporate ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and blocks cloud metadata IPs (`169.254.169.254`).

### 16. How are uploaded themes secured?
Static site ZIPs are decompressed safely: paths containing `..` or absolute prefixes are rejected to prevent path traversal; uncompressed sizes are capped at 50MB; and only standard web extensions (`.html`, `.css`, `.js`, etc.) are permitted.

### 17. How is AI-generated code secured?
We do not ask Gemini to generate executable code that gets executed on the server. Instead, Gemini returns a validated JSON schema containing predefined UI component types (`navbar`, `hero`, `productGrid`, `newsletter`, `footer`). A safe React preview renderer displays these components, completely mitigating code injection risks.

### 18. Why is Playwright separated into a worker?
Browser automation is CPU- and memory-intensive. Running Playwright synchronously inside an Express HTTP request would block the event loop and cause timeouts for users. By enqueuing jobs in MongoDB and having a worker pick them up asynchronously, the API stays responsive.

### 19. How does retesting work?
When a project is retested after a developer fixes their code, new screenshots and difference clusters are calculated. If a previously open bug's coordinates no longer show differences, it is marked as `RESOLVED`. If a previously resolved bug reappears, it is marked as `REGRESSED`.

### 20. What would be improved for a larger production system?
1. **Queue Architecture**: Transition from MongoDB polling to Redis + BullMQ for multi-worker distributed concurrency.
2. **Containerized Sandboxing**: Run Playwright inside ephemeral Docker containers or AWS ECS tasks with strict memory and network limits.
3. **Cloud Storage**: Switch from local storage to S3 or Cloudflare R2 with signed URLs.
4. **Git Integration**: Add GitHub Actions / GitLab CI webhooks to run visual tests automatically on every Pull Request.
