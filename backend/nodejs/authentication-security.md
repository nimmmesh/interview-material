# Node.js Security & Authentication — Interview Preparation

---

## Core Concepts

### Authentication vs Authorization

| | Authentication | Authorization |
|-|---------------|---------------|
| Question | Who are you? | What can you access? |
| Mechanism | Credentials, tokens, sessions | Roles, permissions, policies |
| Node.js tools | Passport.js, jsonwebtoken, bcrypt | Custom middleware, CASL, accesscontrol |

---

## Deep Dive

### Password Hashing with bcrypt

> ⚠️ **Never store plain-text passwords.** Use bcrypt with a salt rounds factor.

```javascript
const bcrypt = require('bcrypt');

// Hash password (registration)
async function hashPassword(plainText) {
  const saltRounds = 10;
  return await bcrypt.hash(plainText, saltRounds);
}

// Verify password (login)
async function verifyPassword(plainText, hash) {
  return await bcrypt.compare(plainText, hash);
}

// Usage
const hash = await hashPassword('myPassword123');
const isValid = await verifyPassword('myPassword123', hash); // true
```

> 💡 **Salt rounds:** **10** is standard. Each increment **doubles** computation time. **12+** for high-security apps.

### JWT Authentication with jsonwebtoken

> ***Access token: short-lived (**15m**). Refresh token: long-lived (**7d**). Never hardcode secrets.***

```javascript
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET; // ⚠️ Never hardcode

// Generate tokens
function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    SECRET,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify token middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: 'Token required' });

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
}
```

### Login & Refresh Flow

```javascript
const express = require('express');
const router = express.Router();

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token in DB or Redis
  user.refreshToken = refreshToken;
  await user.save();

  res.json({ accessToken, refreshToken });
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Token required' });

  const user = await User.findOne({ refreshToken });
  if (!user) return res.status(403).json({ message: 'Invalid refresh token' });

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token expired' });

    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  });
});
```

### Passport.js Strategies

> ***Passport = authentication middleware for Express with **500+** pluggable strategies.***

**Local Strategy** (username/password):
```javascript
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email });
      if (!user) return done(null, false, { message: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return done(null, false, { message: 'Invalid credentials' });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Route
router.post('/login', passport.authenticate('local', { session: false }),
  (req, res) => {
    const token = generateAccessToken(req.user);
    res.json({ token });
  }
);
```

**JWT Strategy:**
```javascript
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  },
  async (payload, done) => {
    try {
      const user = await User.findById(payload.userId);
      if (!user) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }
));

// Protected route
router.get('/profile',
  passport.authenticate('jwt', { session: false }),
  (req, res) => res.json(req.user)
);
```

**Google OAuth Strategy:**
```javascript
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName
      });
    }
    return done(null, user);
  }
));

router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = generateAccessToken(req.user);
    res.redirect(`/dashboard?token=${token}`);
  }
);
```

### Role-Based Authorization Middleware

```javascript
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

// Usage
router.get('/admin/dashboard', authenticateToken, authorize('admin'), (req, res) => {
  res.json({ message: 'Admin dashboard' });
});

router.get('/reports', authenticateToken, authorize('admin', 'manager'), (req, res) => {
  res.json({ data: 'Reports' });
});
```

### Session-Based Authentication

```javascript
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only in prod
    httpOnly: true,    // ✅ Prevents JavaScript access (XSS protection)
    maxAge: 24 * 60 * 60 * 1000, // ✅ 24 hours
    sameSite: 'strict' // ✅ CSRF protection
  }
}));
```

| | JWT (Stateless) | Sessions (Stateful) |
|-|-----------------|---------------------|
| Storage | Client-side (token) | Server-side (session store) |
| Scalability | Better (no server state) | Needs shared store (Redis) |
| Revocation | Hard (until expiry) | Easy (delete session) |
| Use case | APIs, microservices, mobile | Traditional web apps, SSR |

---

## Security Best Practices

> ⚡ **Defense in depth:** Layer multiple protections — headers, CORS, rate limiting, input validation, sanitization.

### Helmet.js — Security Headers

```javascript
const helmet = require('helmet');
app.use(helmet());

// Sets these headers automatically:
// Content-Security-Policy, X-Content-Type-Options: nosniff,
// X-Frame-Options: DENY, Strict-Transport-Security, etc.
```

### CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: ['https://myapp.com', 'https://admin.myapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Allow cookies
  maxAge: 86400      // Preflight cache 24h
}));
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window per IP
  message: { error: 'Too many requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// ⚠️ Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,                     // Only 5 login attempts per 15min
  message: { error: 'Too many login attempts' }
});
app.use('/auth/login', authLimiter);
```

### Input Validation with Joi

```javascript
const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  name: Joi.string().min(2).max(100).required()
});

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map(d => d.message);
      return res.status(400).json({ errors: messages });
    }
    next();
  };
}

router.post('/register', validate(registerSchema), async (req, res) => {
  // req.body is validated
});
```

### OWASP Top Threats — Node.js Context

| Threat | Prevention |
|--------|-----------|
| **SQL/NoSQL Injection** | Parameterized queries, Mongoose sanitization, `express-mongo-sanitize` |
| **XSS** | `helmet`, output encoding, CSP headers, `xss-clean` |
| **CSRF** | `csurf` middleware, SameSite cookies |
| **Broken Auth** | bcrypt, rate limiting, account lockout |
| **Sensitive Data Exposure** | HTTPS, `helmet`, environment variables, never log secrets |
| **Prototype Pollution** | Validate input, `Object.freeze()`, use `Map` over plain objects |

```javascript
// Prevent NoSQL injection
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize()); // Strips $ and . from req.body/query/params
```

---

## Interview Questions — Rapid Fire

| # | Question | Answer |
|---|----------|--------|
| 1 | **How to hash passwords?** | `bcrypt` with salt rounds (**10+**). Never use MD5/SHA for passwords |
| 2 | **JWT vs Sessions?** | JWT = stateless, scalable, **hard to revoke**. Sessions = stateful, **easy to revoke**, needs shared store |
| 3 | **What is Passport.js?** | Auth middleware with **500+** pluggable strategies (Local, JWT, OAuth, Google) |
| 4 | **Prevent brute force?** | `express-rate-limit`, account lockout, CAPTCHA |
| 5 | **Where to store JWT?** | **HttpOnly cookies** (not localStorage). Use `Secure` + `SameSite` flags |
| 6 | **What is Helmet.js?** | Middleware that sets security headers (CSP, HSTS, X-Frame-Options) |
| 7 | **How to validate input?** | `Joi` or `express-validator`. Validate at **route level** before business logic |
| 8 | **Prevent NoSQL injection?** | `express-mongo-sanitize` strips `$` operators from user input |
| 9 | **What is CORS?** | Browser policy blocking cross-origin requests. Configure `cors` with allowed origins |
| 10 | **Refresh tokens?** | Store in **DB/Redis**, validate on refresh endpoint, rotate on use, revoke on logout |

---

## Quick Reference

```
AUTH:         bcrypt (hash) | jsonwebtoken (JWT) | passport (strategies)
PASSPORT:     Local | JWT | Google OAuth | Facebook | GitHub
JWT FLOW:     Login → sign token → client stores → sends Bearer header → verify middleware
SESSION:      express-session + connect-mongo/connect-redis | httpOnly cookies
SECURITY:     helmet (headers) | cors (origins) | express-rate-limit | express-mongo-sanitize
VALIDATION:   joi | express-validator | validate at route level
HEADERS:      CSP | X-Content-Type-Options | X-Frame-Options | HSTS (all via helmet)
STORAGE:      HttpOnly cookie (safe) | localStorage (XSS risk) | sessionStorage (tab only)
```
