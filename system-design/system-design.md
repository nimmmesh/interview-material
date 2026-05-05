# System Design & Microservices — Interview Preparation

---

## Core Concepts

### Monolithic vs Microservices

| | Monolithic | Microservices |
|-|-----------|--------------|
| Structure | Single deployable unit | Multiple independent services |
| Deployment | Redeploy entire app for any change | Deploy services independently |
| Scaling | Scale entire app | Scale individual services |
| Tech stack | Single technology | Polyglot (different tech per service) |
| Coupling | Tightly coupled | Loosely coupled |
| Failure | One module fails → entire app fails | One service fails → others continue |
| Complexity | Simple to start, hard to scale | Complex to start, easier to scale |
| Development | Slower at scale | Parallel team development |

### When to Use Microservices
- Large teams needing independent deployment
- Different services need different scaling profiles
- Technology diversity needed
- Frequent releases required
- High availability critical

### When to Stay Monolithic
- Small team (< 5 developers)
- Simple domain with few bounded contexts
- Early-stage product (not yet proven product-market fit)
- Tight deadlines with limited DevOps maturity

---

## Architecture Overview

### Typical Senior Full Stack Architecture
```
                    ┌─────────────────┐
   Client ─────────►  API Gateway     │ (auth, rate limiting, routing)
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                  ▼
    ┌──────────┐     ┌──────────┐      ┌──────────┐
    │ Service A │     │ Service B │      │ Service C │
    │ (.NET)    │     │ (Node.js) │      │ (.NET)    │
    └─────┬────┘     └─────┬────┘      └─────┬────┘
          │                │                  │
          ▼                ▼                  ▼
    ┌──────────┐     ┌──────────┐      ┌──────────┐
    │ SQL DB   │     │ MongoDB  │      │ SQL DB   │
    └──────────┘     └──────────┘      └──────────┘
          │                │                  │
          └────────┬───────┘──────────────────┘
                   ▼
            ┌──────────────┐
            │ Message Broker│ (Kafka / RabbitMQ)
            └──────────────┘
```

### Key Components

| Component | Purpose | Options |
|-----------|---------|---------|
| **API Gateway** | Single entry point, auth, routing | Azure API Management, Nginx, Kong |
| **Auth** | Identity management | OAuth 2.0 + JWT, Azure AD |
| **Database** | Persistence | SQL Server (relational), MongoDB (document) |
| **Cache** | Reduce DB load, speed up reads | Redis, Memcached |
| **Message Broker** | Async communication between services | Kafka (streaming), RabbitMQ (queuing) |
| **Logging** | Centralized monitoring | ELK Stack, Azure App Insights, Seq |
| **Container** | Package and deploy services | Docker + Kubernetes |

---

## Scaling Strategy

### Horizontal vs Vertical

| | Horizontal (Scale Out) | Vertical (Scale Up) |
|-|----------------------|-------------------|
| Method | Add more machines/instances | Add more CPU/RAM to existing |
| Limit | Practically unlimited | Hardware ceiling |
| Complexity | Need load balancing | Simple |
| Cost | Linear | Exponential |

### Load Balancing Algorithms
- **Round Robin** — distribute requests sequentially
- **Least Connections** — send to server with fewest active connections
- **IP Hash** — same client always goes to same server (sticky sessions)

### Caching Strategy
```
Client → API → Cache (hit?) ──yes──► Return cached data
                   │
                   no
                   ▼
              Database → Store in cache → Return data
```

**Cache invalidation:** Time-based (TTL), event-based (update triggers), manual purge.

---

## Bottlenecks & Solutions

| Bottleneck | Solution |
|-----------|---------|
| Single database | Read replicas, database sharding |
| API overwhelmed | Rate limiting, auto-scaling, CDN for static content |
| Slow queries | Indexes, query optimization, caching |
| Tight coupling | Event-driven architecture, message brokers |
| Single point of failure | Redundancy, health checks, circuit breakers |
| Large payloads | Pagination, compression, lazy loading |
| Cold starts (serverless) | Premium plan, keep-alive pings |

---

## Microservice Communication Patterns

### Synchronous (HTTP/gRPC)
- Direct service-to-service calls
- Simple, immediate response
- Creates temporal coupling (caller waits)

### Asynchronous (Message Broker)
- Fire and forget via Kafka/RabbitMQ
- Decoupled, resilient to failures
- Eventual consistency (not immediate)

### Pattern: Circuit Breaker
When downstream service is failing, stop sending requests temporarily:
```
Closed (normal) → failures exceed threshold → Open (reject all)
→ timeout → Half-Open (test with one request) → success → Closed
```

---

## Tradeoffs

| Decision | Tradeoff |
|----------|---------|
| Microservices vs Monolith | Operational complexity vs deployment independence |
| SQL vs NoSQL | ACID consistency vs horizontal scalability |
| Sync vs Async communication | Immediate consistency vs resilience |
| Cache | Speed vs stale data risk |
| CQRS | Read performance vs sync complexity |
| Saga | Cross-service consistency vs compensating transaction complexity |
| Event sourcing | Full audit trail vs storage + replay complexity |

---

## Interview Questions

1. **How would you design a system for your current project?** .NET Core APIs, Angular frontend, SQL Server, Redis cache, OAuth/JWT auth, Docker/K8s, Azure App Service, Kafka for async.
2. **How do microservices communicate?** Sync: HTTP/gRPC. Async: message brokers (Kafka/RabbitMQ).
3. **How to handle distributed transactions?** Saga pattern with compensating transactions.
4. **How to handle service failures?** Circuit breaker, retry with exponential backoff, fallback responses.
5. **SQL vs NoSQL?** SQL for structured data + transactions. NoSQL for flexible schema + horizontal scale.
6. **How to scale a database?** Read replicas, sharding, caching, query optimization.
7. **What is eventual consistency?** Data will be consistent *eventually* but not immediately after write. Tradeoff for availability.
8. **How to monitor microservices?** Centralized logging (ELK/App Insights), distributed tracing, health checks, alerting.
9. **What is an API Gateway?** Single entry point handling auth, rate limiting, routing, load balancing.
10. **CAP theorem?** Distributed system can guarantee only 2 of 3: Consistency, Availability, Partition tolerance.

---

## Quick Reference

```
ARCHITECTURE:  Client → API Gateway → Microservices → DB/Cache/Broker
COMMUNICATION: Sync (HTTP/gRPC) | Async (Kafka/RabbitMQ)
SCALING:       Horizontal (more instances) | Vertical (bigger machine)
CACHING:       Redis/Memcached | TTL-based | Event-based invalidation
PATTERNS:      CQRS | Saga | Circuit Breaker | API Gateway | Event Sourcing
DB:            SQL (ACID, relations) | NoSQL (scale, flexible schema)
MONITORING:    Centralized logging | Distributed tracing | Health checks
CAP:           Consistency + Availability + Partition Tolerance (pick 2)
RESILIENCE:    Circuit breaker | Retry | Fallback | Bulkhead
```
