# Interview Preparation — Senior Full Stack Engineer

A high-signal, interview-ready knowledge base covering full stack concepts (.NET + Node.js), system design, coding problems, and behavioral prep. Every topic includes code examples, comparison tables, and rapid-fire Q&A.

## Repository Structure

```
interview-material/
├── backend/
│   ├── dotnet/
│   │   ├── oop-solid.md                 — 4 OOP pillars, SOLID principles with .NET microservice examples
│   │   ├── dotnet-apis.md               — ASP.NET Web API, REST, EF, CORS, PUT vs PATCH, HTTP status codes
│   │   ├── authentication-security.md   — OAuth 2.0, JWT, OWASP, end-to-end auth flow (Angular → .NET → SQL)
│   │   ├── design-patterns.md           — Singleton, Factory, Strategy, Observer, CQRS, Saga, API Gateway (C#)
│   │   └── performance.md              — .NET app optimization, GC, bottleneck identification tools
│   └── nodejs/
│       ├── authentication-security.md   — Passport.js, bcrypt, JWT, session auth, Helmet, CORS, rate limiting
│       ├── nodejs-apis.md               — Express.js, middleware, error handling, REST, PM2, Winston
│       ├── design-patterns.md           — Module, Singleton, Factory, Strategy, Observer, Middleware, DI, Repository
│       └── event-loop.md               — Event loop phases, microtask/macrotask, async execution, process.nextTick
├── coding/
│   ├── coding-problems-javascript.md    — Two Sum, Longest Palindrome, Merge Intervals, Second Highest, Max Consecutive Ones
│   └── coding-problems-dotnet.md        — C# equivalents of all problems + LINQ one-liners
├── database/
│   ├── sql.md                           — Normalization, indexes, joins, query patterns, index cardinality
│   ├── mongodb.md                       — Aggregation pipeline, query optimization, index cardinality, sparse/partial indexes
│   └── performance.md                   — Database performance techniques, indexing, sharding, partitioning
├── devops/
│   └── cloud-devops.md                  — Azure (App Service, Functions), Kafka vs RabbitMQ, Docker/K8s
├── frontend/
│   ├── css.md                           — CSS specificity calculation, resolution rules, best practices
│   ├── javascript.md                    — Closures, this, prototypes, debounce/throttle, storage, immutability
│   ├── angular.md                       — Lifecycle hooks, RxJS, change detection, lazy loading, microfrontends, tooling
│   ├── react.md                         — State management, microfrontends, tooling
│   └── performance.md                   — Frontend performance techniques, bundling, lazy loading, CDN
├── resume/
│   └── professional-resume-writing-guidelines.md  — PAR/STAR bullet structures, action verbs, quantification
├── system-design/
│   └── system-design.md                 — Monolith vs microservices, scaling, caching, Kafka, payment systems, CAP theorem
├── _full-knowledge-base.txt             — All files combined as plain text (for ChatGPT/LLM export)
└── README.md
```

## File Format

Every file follows a consistent structure:

1. **Core Concepts** — Fundamentals and definitions
2. **Deep Dive** — Detailed explanations with code examples and diagrams
3. **Real-World Usage** — Practical patterns and architecture
4. **Tradeoffs & Pitfalls** — Common mistakes and gotchas
5. **Interview Questions — Rapid Fire** — Quick Q&A for last-minute revision
6. **Quick Reference** — Cheatsheet for at-a-glance review

## Stats

| Metric | Value |
|--------|-------|
| Files | 22 |
| Total lines | ~6,600 |
| Topics covered | 70+ |
| Coding problems | 6 |

## ChatGPT / LLM Export

`_full-knowledge-base.md` combines all 13 files into a single file (~36K tokens). Use it to:

- **Upload** directly to ChatGPT as an attachment
- **Create a Custom GPT** with this file as its knowledge base
- **Paste** into any LLM for context-aware interview prep Q&A

## Quick Start

Pick a topic and start reviewing:

| Preparing for... | Start with |
|-------------------|------------|
| Frontend round | `frontend/angular.md`, `frontend/javascript.md` |
| Backend/API round | `backend/dotnet-apis.md`, `backend/oop-solid.md` |
| System design round | `system-design/system-design.md`, `system-design/design-patterns.md` |
| Security questions | `backend/authentication-security.md` |
| SQL/Database round | `database/sql.md` |
| Coding round | `coding/coding-problems.md` |
| Resume review | `resume/professional-resume-writing-guidelines.md` |
