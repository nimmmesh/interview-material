# Database Performance — Interview Preparation

---

## Core Techniques

> ***Index what you query, query only what you need, cache what doesn't change.***

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

## Quick Reference

```
INDEXES:     Clustered (1/table) | Non-clustered (many) | Covering (no lookup)
QUERY:       Avoid SELECT * | EXISTS > IN | JOINs > subqueries | No cursors
SCALING:     Read replicas | Sharding | Partitioning | Connection pooling
CACHING:     Redis | Memcached | Query result cache | TTL-based invalidation
MONITORING:  Execution plans | Slow query log | EXPLAIN ANALYZE | Index usage stats
```
