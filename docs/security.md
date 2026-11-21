# CodeAtlas AI Security & Hardening Architecture

This document outlines the defensive engineering practices, input validation, and sandboxing mechanisms implemented in CodeAtlas AI.

---

## 1. Input Sanitization & Attack Mitigation

Every user query, search parameter, and repository URL passes through the central `backend/app/core/security.py` validation layer:

- **Path Traversal Protection**:
  - Rejects attempts using `..`, `~/`, backslash traversal, and null-byte injection (`%00`, `\x00`).
  - Resolves all file paths relative to the canonical repository workspace base directory using `os.path.commonpath`.
- **SQL & Query Injection Mitigation**:
  - All database interactions use SQLAlchemy 2.0 parameterized async queries.
  - Query inputs are scanned for dangerous SQL command injection patterns (`UNION SELECT`, `DROP TABLE`, `1=1--`).
- **Command & Shell Injection Protection**:
  - File indexing and git cloning avoid `shell=True`. All subprocess calls use explicit argument arrays.
  - User search queries containing command chaining operators (`;`, `&&`, `||`, `|`, `` ` ``) are stripped and sanitized.

---

## 2. Token Bucket Rate Limiting

The API implements sliding-window token bucket rate limiting (`backend/app/core/rate_limiter.py`):
- Default capacity: 120 requests/minute per client identity.
- Configurable burst limits.
- Throttled requests receive standard `429 Too Many Requests` responses with `Retry-After` calculation.

---

## 3. Production Security Headers

The `SecurityAndTimingMiddleware` automatically attaches hardened HTTP headers to all outgoing responses:
- `X-Content-Type-Options: nosniff` — Prevents MIME-sniffing vulnerabilities.
- `X-Frame-Options: DENY` — Protects against clickjacking.
- `X-XSS-Protection: 1; mode=block` — Enables cross-site scripting filtering.
- `Referrer-Policy: strict-origin-when-cross-origin` — Restricts sensitive referrer leakage.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` — Mandates HTTPS transport.

---

## 4. Citation and LLM Grounding Security

To prevent prompt injection or hallucinated repository data from misrepresenting code:
- Model output citations are strictly validated against the repository database.
- Extracted references `[file:path#L10-L20]` verify the physical existence of the file and the exact line boundaries.
- Fabricated files or line intervals trigger automatic citation removal and fallback disclaimers.
