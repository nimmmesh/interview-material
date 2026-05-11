# Node.js & Express.js APIs — Interview Preparation

---

## Core Concepts

### Express.js Fundamentals

> ***Express = minimal, unopinionated web framework for Node.js. Middleware-driven pipeline architecture.***

```javascript
const express = require('express');
const app = express();

// Built-in middleware
app.use(express.json());              // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static('public'));     // Serve static files

app.listen(3000, () => console.log('Server running on port 3000'));
```

### HTTP Methods & REST Structure

```javascript
const router = express.Router();

// CRUD mapping
router.get('/users',        getAllUsers);     // Read all
router.get('/users/:id',    getUserById);     // Read one
router.post('/users',       createUser);      // Create
router.put('/users/:id',    updateUser);      // Full update
router.patch('/users/:id',  patchUser);       // Partial update
router.delete('/users/:id', deleteUser);      // Delete

app.use('/api', router);
```

### HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors, malformed body |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but no permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, version conflict |
| 422 | Unprocessable Entity | Valid syntax but semantic errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unhandled server errors |

### Passing Data in GET Requests

> ⚠️ **GET requests should NOT have a request body.** Most servers/proxies ignore or reject it.

| Method | How | Example URL / Code |
|--------|-----|--------------------|
| **Route params** | `/users/:id` | `GET /users/42` → `req.params.id` |
| **Query string** | `?key=value` | `GET /users?role=admin&page=2` → `req.query.role` |
| **Headers** | Custom headers | `req.headers['x-tenant-id']` |

```javascript
// Route params — identify a specific resource
router.get('/users/:id', (req, res) => {
  const userId = req.params.id;         // "42"
});

// Query params — filtering, pagination, sorting
router.get('/users', (req, res) => {
  const { page = 1, limit = 10, sort = 'name', role } = req.query;
  // GET /users?page=2&limit=20&sort=-createdAt&role=admin
});

// 💡 For complex search with many filters, use POST with body instead
router.post('/users/search', (req, res) => {
  const { filters, dateRange, tags } = req.body;
});
```

### PUT vs PATCH

| | PUT | PATCH |
|-|-----|-------|
| **Action** | Replace **entire** resource | **Partial** update |
| **Body** | Full object required | Only changed fields |
| **Missing fields** | Set to null/default | Left unchanged |
| **Idempotent** | Yes | Yes |

```javascript
// PUT — full replacement (must send all fields)
router.put('/users/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,                           // Replaces entire document
    { new: true, overwrite: true }
  );
  res.json(user);
});

// PATCH — partial update (send only what changed)
router.patch('/users/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },                 // Updates only provided fields
    { new: true, runValidators: true }
  );
  res.json(user);
});
```

### When to Use Raw Queries vs ORM

> 💡 **Rule of thumb:** Start with ORM (Mongoose/Prisma) for everything. Drop to raw queries only when ORM is **measurably slow**.

| Scenario | Use | Why |
|----------|-----|-----|
| Standard CRUD operations | **ORM** (Mongoose / Prisma) | Validation, schema, type safety |
| Complex aggregations | **Raw query** / Aggregation pipeline | ORM abstractions add overhead |
| Bulk insert/update (**10K+** rows) | **Raw query** | ORM tracks every document — very slow |
| Simple joins / population | **ORM** (`.populate()` / Prisma `include`) | Clean, readable, auto-typed |
| Performance-critical hot paths | **Raw query** | Full control, no ORM overhead |
| Dynamic query building | **ORM** | Chainable query builders |

```javascript
// ORM — Mongoose (simple, validated)
const users = await User.find({ role: 'admin' }).sort('-createdAt').limit(10);

// Raw query — MongoDB native driver (complex aggregation)
const stats = await db.collection('orders').aggregate([
  { $match: { status: 'completed', createdAt: { $gte: lastMonth } } },
  { $group: { _id: '$vendorId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  { $sort: { total: -1 } }
]).toArray();

// Raw query — SQL via knex/pg (when using PostgreSQL with Node.js)
const result = await pool.query(
  'SELECT department, AVG(salary) as avg_sal FROM employees GROUP BY department HAVING AVG(salary) > $1',
  [50000]
);
```

---

## Deep Dive

### Middleware — The Express Pipeline

> ***Middleware = functions that execute in sequence. Each has `(req, res, next)`. Must call `next()` or send response.***

```javascript
// Custom logging middleware
function logger(req, res, next) {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next(); // Pass control to next middleware
}

// Timing middleware
function timing(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} took ${Date.now() - start}ms`);
  });
  next();
}

app.use(logger);
app.use(timing);
```

**Middleware execution order:**
```
Request → logger → timing → cors → helmet → auth → route handler → error handler → Response
```

| # | Type | Example |
|---|------|--------|
| 1 | **Application-level** | `app.use()`, `app.get()` |
| 2 | **Router-level** | `router.use()`, `router.get()` |
| 3 | **Error-handling** | `(err, req, res, next)` — **4 parameters** |
| 4 | **Built-in** | `express.json()`, `express.static()` |
| 5 | **Third-party** | `cors`, `helmet`, `morgan` |

### Route Handlers — Controller Pattern

```javascript
// controllers/userController.js
const User = require('../models/User');

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const users = await User.find()
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-passwordHash');

    const total = await User.countDocuments();

    res.json({
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
```

### Error Handling

> ⚡ **Pattern:** `AppError` class + `asyncHandler` wrapper + global error middleware. Eliminates try/catch in every handler.

```javascript
// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async wrapper — eliminates try/catch in every handler
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage with asyncHandler
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  res.json(user);
}));

// Global error handler (⚠️ must have 4 parameters)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';

  if (!err.isOperational) {
    console.error('UNEXPECTED ERROR:', err);
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

> ⚠️ **Unhandled rejection / uncaught exception:**
```javascript
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  // Graceful shutdown
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); // ⚠️ Must exit — process is in undefined state
});
```

### Project Structure

```
src/
├── config/
│   └── db.js           # Database connection
├── controllers/        # Route handlers (business logic)
├── middleware/          # Auth, validation, error handling
├── models/             # Mongoose/Prisma schemas
├── routes/             # Route definitions
│   ├── index.js
│   └── userRoutes.js
├── services/           # Business logic (reusable)
├── utils/              # Helpers (AppError, asyncHandler)
├── validators/         # Joi/Zod schemas
├── app.js              # Express setup
└── server.js           # Entry point
```

### Environment Variables & Configuration

> ⚠️ **Never commit `.env` files.** Use `dotenv` for local dev, environment variables in production.

```javascript
// config/index.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development'
};

// .env (never commit)
PORT=3000
MONGO_URI=mongodb://localhost:27017/myapp
JWT_SECRET=super-secret-key
NODE_ENV=development
```

### Database Connection (Mongoose)

```javascript
// config/db.js
const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10    // ✅ Limit concurrent connections
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

module.exports = connectDB;
```

### Logging with Winston & Morgan

```javascript
// Winston — Application logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;

// Morgan — HTTP request logging
const morgan = require('morgan');
app.use(morgan('dev'));  // :method :url :status :response-time ms
```

### Process Manager — PM2

> ***PM2 = process manager for production Node.js. Clustering, auto-restart, zero-downtime reload, log management.***

```bash
# Start with PM2
pm2 start server.js --name "my-api"

# Cluster mode (utilize all CPU cores)
pm2 start server.js -i max

# Ecosystem file
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'my-api',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: { NODE_ENV: 'development' },
    env_production: { NODE_ENV: 'production' }
  }]
};

# Commands
pm2 list            # List processes
pm2 logs            # View logs
pm2 restart all     # Restart all
pm2 reload all      # Zero-downtime reload
pm2 monit           # Monitor CPU/Memory
```

### Graceful Shutdown

> 💡 **Why?** Finish in-flight requests, close DB connections, prevent data corruption before process exit.

```javascript
const server = app.listen(3000);

function gracefulShutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    console.log('HTTP server closed');
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  });

  // ⚠️ Force shutdown after 10s
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

---

## Interview Questions — Rapid Fire

| # | Question | Answer |
|---|----------|--------|
| 1 | **What is middleware?** | Functions with `(req, res, next)` in pipeline order. Must call `next()` or send response |
| 2 | **Async errors in Express?** | `asyncHandler` wrapper catches rejections → `next(err)`. Express **5** does this natively |
| 3 | **`app.use()` vs `app.get()`?** | `use()` = all methods + path prefixes. `get()` = only GET on exact path |
| 4 | **`express.Router()`?** | Mini-application for modular routes. Groups related routes with own middleware |
| 5 | **PUT vs PATCH?** | PUT = **replace entire** resource. PATCH = **partial** update. Both idempotent |
| 6 | **`express.json()`?** | Built-in middleware that parses JSON bodies → populates `req.body` |
| 7 | **Forget `next()`?** | Request **hangs** — never reaches next middleware or route handler |
| 8 | **Handle 404?** | Catch-all middleware after all routes: `app.use((req, res) => res.status(404)...)` |
| 9 | **What is PM2?** | Process manager: clustering, auto-restart, **zero-downtime reload**, log management |
| 10 | **Graceful shutdown?** | Finish in-flight requests, close DB, prevent data corruption before `exit()` |

---

## Quick Reference

```
EXPRESS:      express() | app.use() | app.listen() | express.Router()
MIDDLEWARE:   express.json() | cors | helmet | morgan | custom (req, res, next)
HTTP:         GET (read) | POST (create) | PUT (replace) | PATCH (update) | DELETE (remove)
STATUS:       200 OK | 201 Created | 204 No Content | 400 Bad | 401 Unauth | 403 Forbidden | 404 Not Found | 500 Error
ERRORS:       AppError class | asyncHandler wrapper | global (err, req, res, next) | process.on('unhandledRejection')
STRUCTURE:    controllers/ | routes/ | middleware/ | models/ | services/ | validators/ | config/
CONFIG:       dotenv (.env) | never commit secrets | process.env.VAR_NAME
LOGGING:      winston (app logs) | morgan (HTTP logs) | PM2 logs
PM2:          pm2 start -i max | pm2 reload all | pm2 monit | ecosystem.config.js
SHUTDOWN:     SIGTERM/SIGINT → close server → close DB → exit(0) | timeout → exit(1)
```
