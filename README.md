# Interview Preparation — Senior Full Stack Engineer

A high-signal, interview-ready knowledge base covering full stack concepts, system design, coding problems, and behavioral prep. Every topic includes code examples, comparison tables, and rapid-fire Q&A.

## Repository Structure

```
interview-material/
├── backend/
│   ├── authentication-security.md   — OAuth 2.0, JWT, OWASP, end-to-end auth flow (Angular → .NET → SQL)
│   ├── dotnet-apis.md               — ASP.NET Web API, REST, EF, CORS, PUT vs PATCH, HTTP status codes, raw SQL vs ORM
│   ├── oop-solid.md                 — 4 OOP pillars, SOLID principles with .NET microservice examples
│   └── performance.md              — App/frontend/DB optimization, bottleneck identification
├── coding/
│   └── coding-problems.md          — Two Sum, Longest Palindrome, Merge Intervals, Second Highest, Max Consecutive Ones, LINQ one-liners
├── database/
│   └── sql.md                      — Normalization, indexes, joins, query patterns (find/delete duplicates, Nth salary), optimization tips
├── devops/
│   └── cloud-devops.md             — Azure (App Service, Functions), Kafka vs RabbitMQ, Docker/K8s
├── frontend/
│   ├── angular.md                  — Lifecycle hooks, RxJS (debounceTime vs debounce, distinctUntilChanged), change detection, lazy loading with @defer, ngOnInit vs constructor
│   ├── javascript.md               — Closures, event loop, CSS specificity, npm audit, package.json vs lock, sessionStorage vs localStorage vs cookies, debounce vs throttle
│   └── react.md                    — State management (useState, Redux, Context API, Zustand)
├── resume/
│   └── professional-resume-writing-guidelines.md  — PAR/STAR bullet structures, action verbs, quantification
├── system-design/
│   ├── design-patterns.md          — Singleton, Factory, Strategy, Observer, CQRS, Saga, API Gateway
│   └── system-design.md            — Monolith vs microservices, scaling, caching, microfrontends, CAP theorem
├── _full-knowledge-base.md         — All files combined (for ChatGPT/LLM export)
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
| Files | 13 |
| Total lines | ~3,800 |
| Topics covered | 50+ |
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
