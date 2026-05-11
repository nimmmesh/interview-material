# Performance Optimization — Interview Preparation

---

## Application Performance

| Area | Techniques |
|------|-----------|
| **Memory** | StringBuilder over string concatenation, avoid boxing/unboxing |
| **Caching** | In-memory cache, distributed cache (Redis), output caching |
| **Concurrency** | Threading, parallel programming, async/await |
| **Data access** | Stored procedures over inline queries, batch operations |
| **GC** | Minimize allocations, dispose resources, use `using` statements |

---

## Frontend Performance

| Technique | Impact |
|-----------|--------|
| Minification & compression | Smaller file sizes, faster downloads |
| Bundling | Fewer HTTP requests |
| Lazy loading | Load modules/images on demand |
| CDN | Serve static assets from nearest edge server |
| Dynamic paging | Don't load 10K rows at once |
| OnPush change detection | Reduce unnecessary Angular re-renders |
| `trackBy` in `*ngFor` | Avoid full DOM re-render on list changes |

---

## Database Performance

| Technique | Why |
|-----------|-----|
| Indexing | B-Tree lookup vs full table scan |
| Query optimization | Select specific columns, avoid `SELECT *` |
| Avoid subqueries | Use JOINs instead (usually faster) |
| Use `EXISTS` over `IN` | Stops at first match |
| Covering indexes | Query answered from index alone, no table lookup |
| Avoid cursors | Set-based operations are orders of magnitude faster |
| Caching | Reduce repeated DB hits |
| Normalization | Eliminate redundant data |
| Sharding | Distribute data across multiple databases |
| Partitioning | Split large tables for faster queries |

---

## Identifying Bottlenecks

| Tool/Approach | Purpose |
|--------------|---------|
| Profiling tools (New Relic, App Insights) | Identify slow endpoints |
| Load testing (JMeter, k6) | Simulate concurrent users |
| SQL execution plans (`CTRL+M` in SSMS) | Find table scans, missing indexes |
| SQL Profiler | Capture and analyze slow queries |
| Browser DevTools (Network tab) | Identify slow API calls, large payloads |
| Logging & monitoring | Track response times, error rates |

---

## Downtime Handling (STAR format)

1. **Immediate Assessment** — identify root cause quickly
2. **Communication** — notify team members and stakeholders
3. **Isolation** — isolate affected components
4. **Temporary Fix** — restore functionality with quick solution
5. **Documentation** — record actions taken and timeline
6. **Post-Incident** — root cause analysis, preventive measures

---

## Quick Reference

```
APP:       StringBuilder | Caching | Async/Await | Parallel | Dispose resources
FRONTEND:  Minify | Bundle | Lazy load | CDN | OnPush | trackBy | Pagination
DATABASE:  Index | Avoid SELECT * | EXISTS > IN | No cursors | Covering indexes
TOOLS:     New Relic | SSMS Execution Plan | SQL Profiler | DevTools | Load tests
INCIDENT:  Assess → Communicate → Isolate → Fix → Document → Prevent
```

---

## Senior-Level Backend Concepts Checklist

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
