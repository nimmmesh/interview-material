# Security & Authentication — Interview Preparation

---

## Core Concepts

### Authentication vs Authorization

| | Authentication | Authorization |
|-|---------------|---------------|
| Question | Who are you? | What can you access? |
| Mechanism | Credentials, tokens, biometrics | Roles, permissions, policies |
| When | Before authorization | After authentication |
| Example | Login with username/password | Admin can delete, viewer can only read |

---

## Deep Dive

### OAuth 2.0

**Four Roles:**
1. **Resource Owner** — the user who owns the data
2. **Client Application** — app requesting access (web/mobile)
3. **Resource Server** — server hosting protected data
4. **Authorization Server** — authenticates user, issues tokens

**Grant Types:**

| Grant | Use Case | Security |
|-------|----------|----------|
| **Authorization Code** | Server-side apps | Most secure (code exchanged server-to-server) |
| **Implicit** | SPAs (legacy, deprecated) | Token exposed in URL |
| **Client Credentials** | Server-to-server (no user) | Machine-to-machine auth |
| **PKCE** | Modern SPAs & mobile | Authorization Code + code verifier |

### JWT Authentication Flow
```
1. Client sends credentials → Auth Server
2. Auth Server validates → issues JWT (ID token + access token)
3. Client stores JWT → sends with each request
4. API validates JWT signature → extracts claims
5. Authorization rules applied based on claims/roles
```

**Header:** `Authorization: Bearer <JWT_TOKEN>`

### OpenID Connect (OIDC) + Claims-Based Auth
1. Client redirects user to Identity Provider (IDP)
2. IDP authenticates user
3. IDP issues ID Token containing claims (name, email, roles)
4. Client extracts claims for authorization decisions

### Token Security Best Practices

| Practice | Why |
|----------|-----|
| Use HTTPS | Prevent token interception in transit |
| Short expiration | Limit window of compromise |
| HTTP-only cookies | Prevent JavaScript access (XSS protection) |
| Token binding | Bind token to specific client/device |
| `SameSite` cookie attribute | Prevent CSRF |
| Never store in localStorage | Vulnerable to XSS |
| Token encryption | Additional layer of protection |

---

## Web Security Threats & Prevention

### OWASP Top Threats

| Threat | Prevention |
|--------|-----------|
| **SQL Injection** | Parameterized queries, ORM (EF is injection-safe by default) |
| **XSS (Cross-Site Scripting)** | Input sanitization, CSP headers, output encoding |
| **CSRF (Cross-Site Request Forgery)** | Anti-forgery tokens, SameSite cookies |
| **Broken Authentication** | MFA, account lockout, secure password storage |
| **Sensitive Data Exposure** | HTTPS, encryption at rest, minimal data collection |

### Security Headers
```
Content-Security-Policy: default-src 'self'     → Prevents XSS
X-Content-Type-Options: nosniff                 → Prevents MIME sniffing
X-Frame-Options: DENY                           → Prevents clickjacking
Strict-Transport-Security: max-age=31536000     → Forces HTTPS
```

---

## Real-World Usage

### .NET Microservice Auth Flow
```
Client → API Gateway (validates JWT)
           ├── Service A (extracts claims, checks roles)
           ├── Service B (service-to-service: Client Credentials grant)
           └── Identity Provider (issues/refreshes tokens)
```

### Security Checklist for Interviews
- [ ] HTTPS everywhere
- [ ] Input validation at all boundaries
- [ ] Parameterized queries (never string concatenation)
- [ ] JWT with short expiry + refresh tokens
- [ ] RBAC (Role-Based Access Control)
- [ ] CSP headers for XSS prevention
- [ ] Anti-forgery tokens for CSRF
- [ ] Secrets in environment variables, not code

---

## Interview Questions — Rapid Fire

1. **Authentication vs Authorization?** AuthN = verify identity. AuthZ = verify permissions.
2. **How does OAuth 2.0 work?** Client gets auth code from auth server, exchanges for tokens, presents token to resource server.
3. **What are JWT claims?** Key-value pairs in token payload (sub, name, email, roles, exp).
4. **How to prevent SQL injection?** Parameterized queries. Never concatenate user input into SQL.
5. **XSS vs CSRF?** XSS = inject malicious scripts. CSRF = trick user into making unintended requests.
6. **Where to store tokens?** HTTP-only cookies (not localStorage — XSS vulnerable).
7. **Client Credentials grant?** Server-to-server auth without user involvement. Machine-to-machine.
8. **What is CORS?** Browser policy that blocks cross-origin requests. Server must explicitly allow origins.
9. **What is Content Security Policy?** HTTP header that restricts resource sources, preventing XSS.
10. **How to secure a microservice?** API Gateway auth, JWT validation, HTTPS, input validation, rate limiting.

---

## Quick Reference

```
AUTH FLOW:    Credentials → AuthN Server → JWT → Client → API (Bearer token) → AuthZ
OAUTH:        Auth Code (server) | Client Credentials (machine) | PKCE (SPA/mobile)
JWT:          Header.Payload.Signature  (claims: sub, name, roles, exp)
STORAGE:      HTTP-only cookie (safe) | localStorage (XSS risk) | sessionStorage (tab only)
THREATS:      SQL Injection | XSS | CSRF | Broken Auth | Data Exposure
PREVENTION:   Parameterized queries | CSP headers | Anti-forgery tokens | HTTPS | Input validation
HEADERS:      CSP | X-Content-Type-Options | X-Frame-Options | HSTS
```
