# .NET Performance Optimization — Interview Preparation

---

## Application Performance

> ***Profile first, optimize second. Never guess where the bottleneck is.***

| Area | Techniques |
|------|-----------|
| **Memory** | StringBuilder over string concatenation, avoid boxing/unboxing |
| **Caching** | In-memory cache, distributed cache (Redis), output caching |
| **Concurrency** | Threading, parallel programming, async/await |
| **Data access** | Stored procedures over inline queries, batch operations |
| **GC** | Minimize allocations, dispose resources, use `using` statements |

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

## Quick Reference

```
APP:       StringBuilder | Caching | Async/Await | Parallel | Dispose resources
TOOLS:     New Relic | SSMS Execution Plan | SQL Profiler | DevTools | Load tests
GC:        Minimize allocations | using statements | Dispose pattern | weak references
```
