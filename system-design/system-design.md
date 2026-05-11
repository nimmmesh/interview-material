# System Design & Microservices — Interview Preparation

---

## Core Concepts

### Monolithic vs Microservices

> ***Start monolithic, migrate to microservices when team/scale demands it.***

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

## Kafka Event Streaming Architecture

### High-Level Architecture
```
Vehicle Devices
      ↓
Ingestion APIs
      ↓
Kafka Producers
      ↓
Kafka Topics
      ↓
Consumer Services
      ↓
MongoDB / PostgreSQL / Analytics
```

### Why Kafka?
Kafka provides durability, replay capability, high throughput, fault tolerance, and horizontal scalability. Useful for high-throughput systems, decoupled architectures, and scalable event processing.

### Example: Telemetry Platform

Vehicle devices continuously send GPS coordinates, speed, fuel data, ignition state, and sensor readings. Backend ingestion APIs validate requests and publish events into Kafka topics. Consumer services process analytics, notifications, dashboard updates, persistence, and alerts.

### Key Concepts

**Partitions:**
Topics are partitioned by `vehicleId` / `deviceId` for horizontal scaling and ordered processing per device.

**Consumer Groups:**
Used for parallel processing, workload distribution, and scalability.

**Retry Handling:**
Failed events are retried with backoff and eventually pushed to DLQ (Dead Letter Queue).

---

## Payment System Design

### Problem
Implement User A transfers money to User B — at large scale.

### Incorrect Approach
One long-running DB transaction for the entire flow. Problems: lock contention, poor scalability, transaction bottlenecks, throughput collapse.

### Production-Grade Approach
Use short-lived transactions, async processing, event-driven architecture, queues, and idempotency.

### Architecture
```
User Initiates Payment
          ↓
API Validation
          ↓
Create Payment Record (PENDING)
          ↓
Publish Payment Event to Queue
          ↓
Payment Worker Consumes Event
          ↓
Debit Sender → Credit Receiver → Insert Ledger Entry → Commit Transaction
          ↓
Update Payment Status → Send Notification
```

### API Layer
```javascript
POST /transfer

validateRequest();
createPaymentRecord({ status: "PENDING" });
publishToQueue(paymentEvent);
return 202 Accepted;
```
Key idea: API returns quickly, processing happens asynchronously.

### Consumer Layer
```javascript
consumePaymentEvent(event) {
   beginTransaction();
   debit(sender);
   credit(receiver);
   insertLedgerEntry();
   commitTransaction();
   updatePaymentStatus("SUCCESS");
}
```

### Why This Works
- Lightweight APIs with short DB transactions
- Reduced lock contention
- Scalable consumers with retry handling
- Failure isolation

### Critical Payment Concepts

> ⚡ **Idempotency:** Prevent duplicate transfers during retries using unique `requestId` / `paymentId`. Repeated requests are safely ignored.

**Retry Handling:** Retry queues, exponential backoff, DLQ.

**Ledger-Based Accounting:** Never directly overwrite balances — maintain immutable transaction ledger and audit trail.

### Related Patterns
- **Saga Pattern:** Distributed transaction orchestration with compensating transactions
- **Outbox Pattern:** Reliable event publishing — prevents DB-event inconsistencies

### Interview Answer

"For large-scale payment systems, I would avoid long-running synchronous database transactions. Instead, I'd create a pending payment record and publish an event to a durable queue like Kafka. Dedicated workers would process transfers using short-lived ACID transactions only for balance updates. This minimizes lock contention and allows horizontal scaling. I'd also implement idempotency, retries, ledger entries, and DLQ handling for resiliency."

---

## Downtime Handling (STAR format)

> ⚡ **6-step framework:** Assess → Communicate → Isolate → Fix → Document → Prevent

1. **Immediate Assessment** — identify root cause quickly
2. **Communication** — notify team members and stakeholders
3. **Isolation** — isolate affected components
4. **Temporary Fix** — restore functionality with quick solution
5. **Documentation** — record actions taken and timeline
6. **Post-Incident** — root cause analysis, preventive measures

---

## Senior-Level Backend Concepts Checklist

> 💡 **These topics frequently appear in senior/lead interviews. Know at least 2-3 deep examples per category.**

### Distributed Systems
- CAP theorem, eventual consistency, strong consistency, partition tolerance

### Database Concepts
- Indexing, cardinality, selectivity, optimistic locking, pessimistic locking, connection pooling

### Scalability
- Horizontal scaling, load balancing, caching, sharding, partitioning

### Event-Driven Architecture
- Kafka, retries, DLQ, event ordering, consumer groups, backpressure

### Reliability Patterns
- Circuit breakers, retries, saga pattern, outbox pattern, idempotency

### Performance
- Redis caching, rate limiting, query optimization, batching, async processing

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

| # | Question | Answer |
|---|----------|--------|
| 1 | **Design your current system?** | .NET APIs, Angular, SQL Server, Redis, OAuth/JWT, Docker/K8s, Kafka |
| 2 | **Microservice communication?** | Sync: HTTP/gRPC. Async: Kafka/RabbitMQ |
| 3 | **Distributed transactions?** | **Saga pattern** with compensating transactions |
| 4 | **Handle service failures?** | Circuit breaker, retry + exponential backoff, fallback responses |
| 5 | **SQL vs NoSQL?** | SQL = structured + ACID. NoSQL = flexible schema + horizontal scale |
| 6 | **Scale a database?** | Read replicas, sharding, caching, query optimization |
| 7 | **Eventual consistency?** | Data consistent *eventually*, not immediately. Tradeoff for availability |
| 8 | **Monitor microservices?** | Centralized logging (ELK), distributed tracing, health checks, alerting |
| 9 | **API Gateway?** | Single entry point: auth, rate limiting, routing, load balancing |
| 10 | **CAP theorem?** | Pick **2 of 3**: Consistency, Availability, Partition tolerance |

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
