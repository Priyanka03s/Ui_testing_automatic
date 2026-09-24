# DesignCheck AI — Security & Threat Modeling Specification

## 1. Authentication & Session Security

### Password Hashing
* Uses `bcryptjs` with a work factor of 12 salt rounds.
* Passwords must contain at least 8 characters, with letters and numeric digits enforced by Zod schema validation.
* Passwords are never logged or stored in plain text.

### JWT in HttpOnly Cookies
* User sessions are managed via JSON Web Tokens signed with `HS256` using `JWT_SECRET`.
* Set using strict cookie flags:
  * `httpOnly: true`: Prevents client-side script access, mitigating Cross-Site Scripting (XSS) session theft.
  * `secure: true`: Enforced in production environments over HTTPS.
  * `sameSite: 'lax'` or `'none'` (with secure): Mitigates Cross-Site Request Forgery (CSRF).

### Google OAuth Identity Verification
* Verified server-side using `google-auth-library` (`OAuth2Client.verifyIdToken`).
* Validates audience (`GOOGLE_CLIENT_ID`), issuer, expiration, and user subject identifier.
* **Account Takeover Mitigation**: Prevents silent account takeover if an existing password-authenticated account exists with the same email.

---

## 2. Secrets & Token Encryption

### Figma Personal Access Tokens (PAT)
* Figma Personal Access Tokens are encrypted before insertion into MongoDB using **AES-256-GCM** (Galois/Counter Mode).
* Encrypted payload structure:
  ```json
  {
    "iv": "hex string",
    "data": "ciphertext hex",
    "tag": "authentication tag hex"
  }
  ```
* The encryption key (`FIGMA_ENCRYPTION_KEY`) is a 32-byte hexadecimal key kept in server-side environment variables.
* The API response serializer (`toJSON`) strips `encryptedAccessToken` and `passwordHash` to ensure secrets are never leaked to frontend clients.

---

## 3. Server-Side Request Forgery (SSRF) Protection

When the Playwright worker visits website preview routes or user-provided URLs:
* `safeUrlValidator.js` validates all URLs:
  * Prohibits `file:`, `ftp:`, `gopher:` (permits only `http:` and `https:`).
  * Rejects `localhost`, `127.0.0.0/8`, `::1`.
  * Blocks private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
  * Blocks cloud provider instance metadata endpoints (`169.254.169.254`).
  * Blocks Carrier-Grade NAT (`100.64.0.0/10`) and IPv6 link-local addresses.
* Only explicitly designated local preview server ports (`5000` / `5173`) are permitted for development preview verification.

---

## 4. Archive Upload & ZIP Security

Static website ZIP uploads are validated against malicious attacks:
* **Path Traversal Guard**: Rejects any entries containing `..` or absolute path prefixes.
* **Extraction Bounds**: Limits uncompressed archive size to a maximum of 50MB and a maximum of 500 files to prevent zip bomb attacks.
* **File Extension Whitelist**: Only permits standard web assets (`.html`, `.css`, `.js`, `.json`, `.svg`, `.png`, `.jpg`, `.webp`, `.woff2`, `.ico`). Executable scripts (`.exe`, `.sh`, `.bat`, `.cmd`, `.ps1`) are strictly rejected.
* **Symlink Disallowance**: Symbolic links are ignored during decompression.

---

## 5. AI Website Generator Security

* **Zero Arbitrary Execution**: The system **never** passes AI-generated text directly to `eval()`, `exec()`, or executes raw Node/React code on the host server.
* **Schema Validation**: Gemini produces structured JSON strictly conforming to `themeSchema` (enforced via Zod).
* **Controlled Renderer**: The preview HTML is constructed using a fixed set of predefined UI components (`navbar`, `hero`, `productGrid`, `newsletter`, `footer`), eliminating cross-site scripting and unauthorized DOM execution.

---

## 6. Granular Role-Based Access Control (RBAC)

The application enforces a 4-tier permission hierarchy:
1. `SUPER_ADMIN`: Holds all system permissions unconditionally.
2. `ADMIN_L2`: Senior Administrator with explicit permission sets assigned by Super Admin.
3. `ADMIN_L3`: Junior Administrator with explicit permission sets assigned by Super Admin.
4. `USER`: Normal authenticated user restricted strictly to their own projects and test runs.

All permissions are verified on the backend via Express middleware:
```javascript
router.get('/admin/users', requireAuth, requirePermission('users.view'), getUsers);
```
Unassigned endpoints return `403 FORBIDDEN` with code `INSUFFICIENT_PERMISSIONS`.
