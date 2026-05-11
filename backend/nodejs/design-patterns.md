# Node.js Design Patterns — Interview Preparation

---

## Core Concepts

### Why Design Patterns in Node.js?

> ***Node.js has unique patterns driven by its event-driven, non-blocking nature. Some classical patterns map directly; others are Node-specific.***

| Pattern | Node.js Twist |
|---------|---------------|
| **Singleton** | Module caching = natural singleton |
| **Observer** | Built into core via `EventEmitter` |
| **Middleware** | Defining pattern of Express.js |
| **Module** | Every file is a module (`module.exports`) |

---

## Deep Dive

### Module Pattern (Node.js Native)

> ***Every file in Node.js is a module. `module.exports` / `require` provides encapsulation by default.***

```javascript
// counter.js — Private state via closure
let count = 0; // Private — not exported

function increment() {
  return ++count;
}

function getCount() {
  return count;
}

module.exports = { increment, getCount };

// app.js
const counter = require('./counter');
counter.increment();   // 1
counter.increment();   // 2
counter.getCount();    // 2
// counter.count → undefined (private)
```

**Revealing Module Pattern:**
```javascript
const UserService = (() => {
  const users = new Map();

  function addUser(id, data) {
    users.set(id, data);
  }

  function getUser(id) {
    return users.get(id);
  }

  function getAllUsers() {
    return [...users.values()];
  }

  return { addUser, getUser, getAllUsers };
})();

module.exports = UserService;
```

### Singleton Pattern (Module Caching)

> ***`require()` caches modules after first load. Same instance returned everywhere — a natural Singleton.***

> ⚠️ **Gotcha:** Module caching is **per-file-path**. Different paths to same file = different instances.

```javascript
// database.js
const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect(uri) {
    if (this.connection) return this.connection;
    this.connection = await mongoose.connect(uri, { maxPoolSize: 10 });
    console.log('Database connected');
    return this.connection;
  }

  getConnection() {
    if (!this.connection) throw new Error('Database not connected');
    return this.connection;
  }
}

// Singleton via module caching — ✅ same instance everywhere
module.exports = new Database();

// userService.js
const db = require('./database'); // ✅ Same instance
```

### Factory Pattern

> ***Create objects without exposing creation logic. Swap implementations (loggers, payment providers) without changing consumers.***

```javascript
// loggerFactory.js
class ConsoleLogger {
  log(message) { console.log(`[CONSOLE] ${message}`); }
  error(message) { console.error(`[CONSOLE ERROR] ${message}`); }
}

class FileLogger {
  constructor() {
    this.fs = require('fs');
  }
  log(message) {
    this.fs.appendFileSync('app.log', `[LOG] ${message}\n`);
  }
  error(message) {
    this.fs.appendFileSync('error.log', `[ERROR] ${message}\n`);
  }
}

class CloudLogger {
  log(message) { /* Send to CloudWatch/Datadog */ }
  error(message) { /* Send to Sentry */ }
}

function createLogger(type) {
  switch (type) {
    case 'console': return new ConsoleLogger();
    case 'file':    return new FileLogger();
    case 'cloud':   return new CloudLogger();
    default:        return new ConsoleLogger();
  }
}

module.exports = createLogger;

// Usage
const createLogger = require('./loggerFactory');
const logger = createLogger(process.env.NODE_ENV === 'production' ? 'cloud' : 'console');
logger.log('App started');
```

### Strategy Pattern

> ***Define a family of algorithms and make them interchangeable at runtime.***

```javascript
// Payment strategies
class StripePayment {
  async process(amount, currency) {
    console.log(`Processing $${amount} via Stripe`);
    // Stripe API call
    return { provider: 'stripe', amount, status: 'success' };
  }
}

class PayPalPayment {
  async process(amount, currency) {
    console.log(`Processing $${amount} via PayPal`);
    // PayPal API call
    return { provider: 'paypal', amount, status: 'success' };
  }
}

class CryptoPayment {
  async process(amount, currency) {
    console.log(`Processing $${amount} via Crypto`);
    return { provider: 'crypto', amount, status: 'success' };
  }
}

// Context
class PaymentProcessor {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  async pay(amount, currency = 'USD') {
    return this.strategy.process(amount, currency);
  }
}

// Usage
const processor = new PaymentProcessor(new StripePayment());
await processor.pay(99.99);

processor.setStrategy(new PayPalPayment());
await processor.pay(49.99);
```

### Observer Pattern (EventEmitter)

> ***Node.js has Observer built into core via `EventEmitter`. Key methods: `on()`, `once()`, `emit()`, `removeListener()`***

```javascript
const EventEmitter = require('events');

class OrderSystem extends EventEmitter {
  placeOrder(order) {
    console.log(`Order placed: ${order.id}`);
    this.emit('orderPlaced', order);
  }

  cancelOrder(orderId) {
    console.log(`Order cancelled: ${orderId}`);
    this.emit('orderCancelled', orderId);
  }
}

const orderSystem = new OrderSystem();

// Subscribe — multiple listeners
orderSystem.on('orderPlaced', (order) => {
  console.log(`[Email] Confirmation sent for order ${order.id}`);
});

orderSystem.on('orderPlaced', (order) => {
  console.log(`[Inventory] Stock reduced for order ${order.id}`);
});

orderSystem.on('orderPlaced', (order) => {
  console.log(`[Analytics] Order tracked: $${order.total}`);
});

orderSystem.on('orderCancelled', (orderId) => {
  console.log(`[Inventory] Stock restored for order ${orderId}`);
});

// Trigger
orderSystem.placeOrder({ id: 'ORD-001', total: 99.99 });
// Output:
// Order placed: ORD-001
// [Email] Confirmation sent for order ORD-001
// [Inventory] Stock reduced for order ORD-001
// [Analytics] Order tracked: $99.99
```

> 💡 **Key methods:** `on()`, `once()`, `emit()`, `removeListener()`, `listenerCount()`

### Pub/Sub Pattern

> ***Decoupled communication — publishers don't know about subscribers.***

```javascript
// pubsub.js — Simple in-process Pub/Sub
class PubSub {
  constructor() {
    this.subscribers = {};
  }

  subscribe(event, callback) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
    };
  }

  publish(event, data) {
    if (!this.subscribers[event]) return;
    this.subscribers[event].forEach(callback => callback(data));
  }
}

const pubsub = new PubSub();

// Service A subscribes
const unsub = pubsub.subscribe('user:created', (user) => {
  console.log(`Send welcome email to ${user.email}`);
});

// Service B publishes (doesn't know about Service A)
pubsub.publish('user:created', { email: 'john@example.com' });

unsub(); // Cleanup
```

**Observer vs Pub/Sub:**
| | Observer (EventEmitter) | Pub/Sub |
|-|------------------------|---------|
| **Coupling** | Subject knows observers exist | **Fully decoupled** |
| **Communication** | Direct (subject → observers) | Through message broker |
| **Use case** | In-process events | Cross-service / microservices |

### Middleware Pattern

> ***The defining pattern of Express.js — chain of responsibility with `next()`.***

```javascript
// Generic middleware pipeline (not Express-specific)
class Pipeline {
  constructor() {
    this.middlewares = [];
  }

  use(fn) {
    this.middlewares.push(fn);
    return this; // Chainable
  }

  async execute(context) {
    let index = 0;

    const next = async () => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        await middleware(context, next);
      }
    };

    await next();
    return context;
  }
}

// Usage
const pipeline = new Pipeline();

pipeline
  .use(async (ctx, next) => {
    ctx.startTime = Date.now();
    await next();
    ctx.duration = Date.now() - ctx.startTime;
  })
  .use(async (ctx, next) => {
    console.log(`Processing: ${ctx.data}`);
    ctx.data = ctx.data.toUpperCase();
    await next();
  })
  .use(async (ctx, next) => {
    ctx.processed = true;
    await next();
  });

const result = await pipeline.execute({ data: 'hello' });
// { data: 'HELLO', processed: true, startTime: ..., duration: ... }
```

### Dependency Injection (with Awilix)

```javascript
const { createContainer, asClass, asValue, Lifetime } = require('awilix');

// Services
class UserRepository {
  constructor({ db }) {
    this.db = db;
  }
  async findById(id) {
    return this.db.collection('users').findOne({ _id: id });
  }
}

class UserService {
  constructor({ userRepository, logger }) {
    this.userRepository = userRepository;
    this.logger = logger;
  }
  async getUser(id) {
    this.logger.log(`Fetching user ${id}`);
    return this.userRepository.findById(id);
  }
}

// Container setup
const container = createContainer();

container.register({
  db: asValue(mongoConnection),
  logger: asValue(console),
  userRepository: asClass(UserRepository).setLifetime(Lifetime.SINGLETON),
  userService: asClass(UserService).setLifetime(Lifetime.SINGLETON)
});

// Resolve
const userService = container.resolve('userService');
await userService.getUser('123');
```

### Repository Pattern (Mongoose)

```javascript
// repositories/baseRepository.js
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    return this.model.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
  }

  async findById(id) {
    return this.model.findById(id);
  }

  async create(data) {
    return this.model.create(data);
  }

  async update(id, data) {
    return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return this.model.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }
}

// repositories/userRepository.js
const User = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return this.model.findOne({ email });
  }

  async findActiveUsers() {
    return this.model.find({ status: 'active' });
  }
}

module.exports = new UserRepository();
```

### Repository Pattern (Prisma)

```javascript
// repositories/prismaUserRepository.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PrismaUserRepository {
  async findAll(options = {}) {
    const { page = 1, limit = 10 } = options;
    return prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data) {
    return prisma.user.create({ data });
  }

  async update(id, data) {
    return prisma.user.update({ where: { id }, data });
  }

  async delete(id) {
    return prisma.user.delete({ where: { id } });
  }
}

module.exports = new PrismaUserRepository();
```

---

## Interview Questions — Rapid Fire

| # | Question | Answer |
|---|----------|--------|
| 1 | **Singleton in Node.js?** | Module caching — `require()` caches after first load. **Same instance** for subsequent imports |
| 2 | **Observer vs Pub/Sub?** | Observer: subject knows observers (`EventEmitter`). Pub/Sub: **fully decoupled** via broker |
| 3 | **Middleware pattern?** | Chain of responsibility — functions execute in sequence, each calls `next()` |
| 4 | **Why Factory pattern?** | Decouple creation from usage. **Swap implementations** without changing consumers |
| 5 | **DI in Node.js?** | Constructor injection manually, or `awilix` container. Pass deps instead of importing |
| 6 | **Repository pattern?** | Abstraction over data access. **Decouples** business logic from DB queries |
| 7 | **Module vs Revealing Module?** | Module: Node.js native (`exports`). Revealing: IIFE returning public API |
| 8 | **When Strategy pattern?** | Multiple algorithms for same task (payment, auth) — **swap at runtime** |
| 9 | **EventEmitter methods?** | `on()` (subscribe), `once()` (once), `emit()` (publish), `removeListener()` (cleanup) |
| 10 | **Mongoose vs Prisma?** | Mongoose: schema-based, MongoDB-native. Prisma: **type-safe**, multi-DB, auto-generated client |

---

## Quick Reference

```
MODULE:       module.exports + require() | Private via closure | One file = one module
SINGLETON:    Module caching (require) | new Instance() exported | ⚠️ Path-dependent
FACTORY:      createThing(type) → returns instance | Swap implementations at runtime
STRATEGY:     setStrategy(impl) | Interchangeable algorithms | Payment/Auth/Logging
OBSERVER:     EventEmitter | on/emit/once | Subject knows observers
PUB/SUB:      subscribe(event, cb) + publish(event, data) | Fully decoupled
MIDDLEWARE:   (req/ctx, next) → next() | Chain of responsibility | Express pipeline
DI:           Constructor injection | awilix (container) | Register + resolve
REPOSITORY:   BaseRepository → findAll/findById/create/update/delete | Mongoose or Prisma
```
