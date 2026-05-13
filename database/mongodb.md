# MongoDB — Interview Preparation

---

## Core Concepts

### Document Model

> ***MongoDB stores data as BSON documents in collections. No rigid schema — documents can vary.***

MongoDB stores data as BSON (Binary JSON) documents inside collections.

```json
{
  "_id": ObjectId("64f1a2b3c4d5e6f7a8b9c0d1"),
  "name": "Alice",
  "email": "alice@test.com",
  "orders": [
    { "item": "Laptop", "price": 1200 },
    { "item": "Mouse", "price": 25 }
  ]
}
```

| SQL Term | MongoDB Term |
|---|---|
| Database | Database |
| Table | Collection |
| Row | Document |
| Column | Field |
| JOIN | Embedding / `$lookup` |
| PRIMARY KEY | `_id` (auto-generated) |

### Embedding vs Referencing

| | Embedding | Referencing |
|-|-----------|-------------|
| Structure | Nested subdocuments | Separate collections with ObjectId |
| Reads | Faster (single query) | Slower (multiple queries / `$lookup`) |
| Writes | Slower for large nested data | Easier to update independently |
| Data duplication | Possible | Minimal |
| Document size | Watch 16MB limit | Not a concern |
| Use when | Data accessed together, 1:few | Many-to-many, large/growing subdocs |

**Embedding:**
```json
{
  "name": "Alice",
  "address": { "city": "NYC", "zip": "10001" }
}
```

**Referencing:**
```json
// users collection
{ "_id": ObjectId("..."), "name": "Alice", "addressId": ObjectId("...") }

// addresses collection
{ "_id": ObjectId("..."), "city": "NYC", "zip": "10001" }
```

---

## Deep Dive

### Aggregation Pipeline

> ***Sequential stages that transform documents: `$match` → `$group` → `$sort` → `$project`. Filter early for performance.***

The aggregation pipeline processes documents through a sequence of stages.

```txt
Collection → $match → $group → $sort → $project → Result
```

#### Common Stages

| Stage | Purpose | SQL Equivalent |
|---|---|---|
| `$match` | Filter documents | `WHERE` |
| `$group` | Group and aggregate | `GROUP BY` |
| `$project` | Shape output fields | `SELECT` |
| `$sort` | Order results | `ORDER BY` |
| `$limit` | Limit result count | `LIMIT` / `TOP` |
| `$skip` | Skip documents | `OFFSET` |
| `$unwind` | Flatten arrays | `JOIN` on array |
| `$lookup` | Join collections | `LEFT JOIN` |
| `$addFields` | Add computed fields | Computed column |
| `$count` | Count documents | `COUNT(*)` |
| `$facet` | Multiple pipelines in parallel | Multiple queries |

#### `$match` — Filter Documents

> ⚡ **Always place `$match` as early as possible** to reduce documents processed by later stages.

```javascript
db.orders.aggregate([
  { $match: { status: "completed" } }
]);
```

Equivalent SQL:
```sql
SELECT * FROM orders WHERE status = 'completed';
```

#### `$group` — Group and Aggregate

```javascript
db.orders.aggregate([
  {
    $group: {
      _id: "$customerId",
      totalSpent: { $sum: "$amount" },
      orderCount: { $count: {} },
      avgOrder: { $avg: "$amount" },
      maxOrder: { $max: "$amount" },
      minOrder: { $min: "$amount" }
    }
  }
]);
```

Equivalent SQL:
```sql
SELECT customerId, SUM(amount), COUNT(*), AVG(amount), MAX(amount), MIN(amount)
FROM orders
GROUP BY customerId;
```

**Accumulator operators:** `$sum`, `$avg`, `$min`, `$max`, `$count`, `$push`, `$addToSet`, `$first`, `$last`

#### `$project` — Shape Output

```javascript
db.users.aggregate([
  {
    $project: {
      fullName: { $concat: ["$firstName", " ", "$lastName"] },
      email: 1,
      _id: 0
    }
  }
]);
```

#### `$sort` + `$limit` — Top N Pattern

```javascript
// Top 5 customers by spending
db.orders.aggregate([
  { $group: { _id: "$customerId", totalSpent: { $sum: "$amount" } } },
  { $sort: { totalSpent: -1 } },
  { $limit: 5 }
]);
```

#### `$unwind` — Flatten Arrays

Deconstructs an array field into one document per element.

```javascript
// Document: { name: "Alice", tags: ["dev", "lead"] }
// After $unwind on tags:
// { name: "Alice", tags: "dev" }
// { name: "Alice", tags: "lead" }

db.users.aggregate([
  { $unwind: "$tags" },
  { $group: { _id: "$tags", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
```

#### `$lookup` — Join Collections

```javascript
db.orders.aggregate([
  {
    $lookup: {
      from: "customers",
      localField: "customerId",
      foreignField: "_id",
      as: "customerDetails"
    }
  },
  { $unwind: "$customerDetails" }
]);
```

Equivalent SQL:
```sql
SELECT * FROM orders
LEFT JOIN customers ON orders.customerId = customers._id;
```

#### `$facet` — Multiple Aggregations in One Query

```javascript
db.products.aggregate([
  {
    $facet: {
      totalCount: [{ $count: "count" }],
      byCategory: [
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ],
      topRated: [
        { $sort: { rating: -1 } },
        { $limit: 5 }
      ]
    }
  }
]);
```

#### Full Pipeline Example

Revenue per category for completed orders, sorted descending:

```javascript
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $unwind: "$items" },
  {
    $group: {
      _id: "$items.category",
      totalRevenue: { $sum: "$items.price" },
      itemsSold: { $sum: 1 }
    }
  },
  { $sort: { totalRevenue: -1 } },
  { $project: { category: "$_id", totalRevenue: 1, itemsSold: 1, _id: 0 } }
]);
```

Equivalent SQL:
```sql
SELECT category, SUM(price) AS totalRevenue, COUNT(*) AS itemsSold
FROM orders
JOIN order_items ON orders.id = order_items.orderId
WHERE status = 'completed'
GROUP BY category
ORDER BY totalRevenue DESC;
```

### Aggregation Performance Tips

- Place `$match` and `$limit` early to reduce documents flowing through the pipeline
- Use indexes — `$match` and `$sort` at the start can leverage indexes
- Avoid `$unwind` on large arrays when possible — can explode document count
- Use `allowDiskUse: true` for memory-heavy aggregations (100MB pipeline limit)
- `$project` early to drop unneeded fields and reduce memory usage

### Interview Answer

"MongoDB's aggregation pipeline processes documents through sequential stages like `$match`, `$group`, `$sort`, and `$project`. It's similar to SQL's `WHERE`, `GROUP BY`, `ORDER BY`, and `SELECT`. The key is stage ordering — filtering early with `$match` reduces the data processed by expensive stages like `$group` and `$unwind`."

---

### Types of Indexes

| Index Type | Description | Use Case |
|------------|-------------|----------|
| **Single Field** | Index on one field | Simple equality/range queries |
| **Compound** | Index on **multiple fields** | Queries filtering/sorting on 2+ fields |
| **Multikey** | Automatically created when indexing an **array field** | Tags, categories, roles |
| **Text** | Supports full-text search on string content | Search in titles, descriptions |
| **Hashed** | Hashes the field value — supports **equality only** (no range) | Shard key for hash-based sharding |
| **Geospatial** (`2dsphere`) | For location-based queries | Find nearby stores, geo queries |
| **TTL** (Time-To-Live) | Automatically deletes documents after a set time | Session data, logs, temp records |
| **Unique** | Ensures no duplicate values | Email, username |
| **Partial** | Indexes only documents matching a filter expression | Index only active/recent records |
| **Wildcard** | Indexes all fields or fields matching a pattern | Dynamic/flexible schemas |

```javascript
// Single Field
db.users.createIndex({ email: 1 });

// Compound Index
db.orders.createIndex({ customerId: 1, status: 1, createdAt: -1 });

// Unique Index
db.users.createIndex({ email: 1 }, { unique: true });

// Text Index
db.articles.createIndex({ title: "text", content: "text" });
db.articles.find({ $text: { $search: "mongodb indexes" } });

// TTL Index — auto-delete after 1 hour
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });

// Partial Index — only index active users
db.users.createIndex(
  { email: 1 },
  { partialFilterExpression: { isActive: true } }
);

// Hashed Index (for sharding)
db.users.createIndex({ userId: "hashed" });

// Geospatial Index
db.stores.createIndex({ location: "2dsphere" });
db.stores.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [-73.97, 40.77] },
      $maxDistance: 5000
    }
  }
});

// Wildcard Index
db.products.createIndex({ "attributes.$**": 1 });
```

> 💡 **Rule of thumb:** More indexes = faster reads, slower writes. Use `explain()` to verify your indexes are actually being used.

---

### Query Optimization

MongoDB query optimization focuses on reducing collection scans, improving query selectivity, optimizing aggregation pipelines, designing proper indexes, and minimizing memory-intensive operations.

Optimization decisions should always be driven by query patterns, execution plans, profiler logs, and production metrics.

#### 1. Compound Indexing

**Problem** — without proper indexing, MongoDB performs collection scans:
```javascript
db.contracts.find({
  tenantId: 101,
  status: "ACTIVE"
}).sort({ createdAt: -1 });
```

**Solution** — compound index that supports filtering + sorting:
```javascript
db.contracts.createIndex({
  tenantId: 1,
  status: 1,
  createdAt: -1
});
```
Avoids in-memory sort operations and enables index-covered queries.

#### 2. Pipeline Stage Ordering

**Poor pipeline** — `$lookup` processes entire collection first:
```javascript
[
  { $lookup: {...} },
  { $match: { tenantId: 101 } }
]
```

**Optimized** — filter early to reduce intermediate dataset:
```javascript
[
  { $match: { tenantId: 101 } },
  { $lookup: {...} }
]
```

#### 3. Elasticsearch Offloading

Regex-based searches on large MongoDB collections are expensive. Use Elasticsearch for full-text search, fuzzy matching, and complex search filtering — reduces MongoDB load and improves search latency.

#### 4. Use Projections

Avoid fetching unnecessary fields:
```javascript
// Bad
db.users.find({});

// Good
db.users.find({}, { name: 1, email: 1 });
```

#### 5. Pagination

Avoid `skip()` for large datasets — prefer cursor-based or indexed pagination.

#### 6. Measuring Improvements

Use `explain()`, MongoDB profiler, APM tools, query execution stats, and API latency metrics.

#### Interview Answer

"We optimized MongoDB performance using explain plans, compound indexing, aggregation tuning, and query selectivity improvements. We also offloaded expensive text-search workloads to Elasticsearch. The optimizations were driven by actual query patterns and production profiling rather than blindly adding indexes."

---

### Index Cardinality

**Cardinality** = number of distinct values in a field. Directly impacts how effective an index is.

#### High vs Low Cardinality

| | High Cardinality | Low Cardinality |
|-|-----------------|-----------------|
| **Example** | `email`, `userId`, `_id` | `status` (active/inactive), `gender`, `boolean flags` |
| **Distinct values** | Many (close to document count) | Few (2-10 values) |
| **Index effectiveness** | Excellent — each lookup narrows to few documents | Poor — index scan still returns large portion of collection |
| **Selectivity** | High (queries filter out most documents) | Low (queries still match many documents) |

> 💡 **Rule:** Index fields with **high cardinality first**. Low-cardinality fields alone are rarely worth indexing.

#### Compound Index Ordering

In compound indexes, **put the highest cardinality field first** for maximum selectivity:

```javascript
// Collection: orders (1M documents)
// status: 3 distinct values (pending, shipped, delivered)
// customerId: 50K distinct values

// ❌ Low cardinality first — poor selectivity
db.orders.createIndex({ status: 1, customerId: 1 });
// Query { status: "pending", customerId: "C123" }
// First narrows to ~333K docs, then filters by customerId

// ✅ High cardinality first — excellent selectivity
db.orders.createIndex({ customerId: 1, status: 1 });
// Query { status: "pending", customerId: "C123" }
// First narrows to ~20 docs, then filters by status
```

**Exception — ESR Rule (Equality, Sort, Range):**
```javascript
// For queries with equality + sort + range:
// Put Equality fields first, then Sort fields, then Range fields
// regardless of cardinality

db.orders.createIndex({ status: 1, createdAt: 1, amount: 1 });
// Supports: { status: "pending" } sorted by createdAt, with amount range
```

#### Measuring Cardinality

```javascript
// Check distinct count for a field
db.orders.distinct("status").length;        // 3 → low cardinality
db.orders.distinct("customerId").length;    // 50000 → high cardinality

// Using aggregation for large collections (distinct has 16MB limit)
db.orders.aggregate([
  { $group: { _id: "$status" } },
  { $count: "distinctCount" }
]);
```

#### Using `explain()` to Validate Index Effectiveness

```javascript
db.orders.find({ customerId: "C123", status: "pending" })
  .explain("executionStats");

// Key fields to check:
// executionStats.totalKeysExamined    → keys scanned in index
// executionStats.totalDocsExamined    → documents fetched
// executionStats.nReturned            → documents returned
// 
// Ideal: totalDocsExamined ≈ nReturned (no wasted scans)
// Bad: totalDocsExamined >> nReturned (index not selective enough)
```

#### Sparse & Partial Indexes

For fields that don't exist in every document, avoid bloated indexes:

```javascript
// Sparse index — only indexes documents where the field exists
db.users.createIndex({ phoneNumber: 1 }, { sparse: true });
// Skips documents without phoneNumber → smaller index, faster lookups

// Partial index — indexes only documents matching a filter
db.orders.createIndex(
  { createdAt: 1 },
  { partialFilterExpression: { status: "pending" } }
);
// Only indexes pending orders → much smaller index for active order queries
```

| | Regular Index | Sparse Index | Partial Index |
|-|--------------|-------------|---------------|
| **Indexes** | All documents | Only docs where field exists | Only docs matching filter |
| **Size** | Largest | Smaller | Smallest (most targeted) |
| **Use case** | Field exists in all docs | Optional/rare fields | Query-specific optimization |

---

## Quick Reference

```txt
CRUD:           insertOne | insertMany | find | updateOne | updateMany | deleteOne | deleteMany
AGGREGATION:    $match | $group | $project | $sort | $limit | $skip | $unwind | $lookup | $facet
ACCUMULATORS:   $sum | $avg | $min | $max | $count | $push | $addToSet | $first | $last
CARDINALITY:    High (email, userId) → index first | Low (status, boolean) → avoid solo index
INDEX ORDER:    High cardinality first | ESR rule (Equality → Sort → Range) for complex queries
EXPLAIN:        totalDocsExamined ≈ nReturned = good | >> nReturned = bad selectivity
SPARSE/PARTIAL: sparse (field exists) | partial (filter match) → smaller, targeted indexes
```
