# SQL — Interview Preparation

---

## Core Concepts

### Normalization vs Denormalization

> ***Normalize for write integrity (OLTP). Denormalize for read speed (OLAP).***

| | Normalization | Denormalization |
|-|--------------|----------------|
| Goal | Eliminate redundancy | Improve read performance |
| Data integrity | High | Lower (redundant data) |
| Write performance | Better | Worse (update anomalies) |
| Read performance | Slower (more joins) | Faster (fewer joins) |
| Use case | OLTP (transactional) | OLAP (analytics/reporting) |

**Normal Forms:**
- **1NF:** Atomic values, no repeating groups (split "Full Name" → FirstName, MiddleName, LastName)
- **2NF:** 1NF + all non-key columns fully depend on the *entire* primary key
- **3NF:** 2NF + no non-key column depends on another non-key column

### Indexes

| | Clustered | Non-Clustered |
|-|-----------|---------------|
| Data storage | Rows stored in index order | Separate structure with pointers to rows |
| Per table | Only 1 | Many |
| Speed | Faster for range queries | Faster for specific lookups |
| Default | Created on Primary Key | Must create explicitly |
| Structure | B-Tree (leaf = actual data) | B-Tree (leaf = pointer to data) |

**Choosing non-clustered indexes:**
- Columns in `WHERE`, `ORDER BY`, `GROUP BY` clauses
- Keep clustered index short (columns may appear in non-clustered indexes)
- **Covering index:** Includes all columns needed by query → no table lookup needed
- Avoid over-indexing (storage + write overhead)

### Index Cardinality

Index cardinality refers to the **uniqueness of values** in an indexed column — how many distinct values exist relative to the total number of rows.

**High Cardinality** — many unique values (`UserId`, `Email`, `OrderId`):
```txt
1M rows → 1M unique emails
```
✅ Very efficient — index lookup narrows down results quickly, fewer rows need scanning.
```sql
SELECT * FROM Users WHERE Email = 'abc@test.com';
-- Index on Email is highly effective
```

**Low Cardinality** — very few unique values (`Gender`, `Status`, `IsActive`):
```txt
1M rows → only 2 values (true/false)
```
❌ Often less useful — database may prefer full table scan over index lookup + row fetch.
```sql
SELECT * FROM Users WHERE IsActive = 1;
-- If 95% rows are active, index adds overhead
```

**Selectivity:**

How effectively an index filters rows.
```txt
Selectivity = unique values / total rows
```
Higher selectivity → better index performance.

**Good vs Poor Index Candidates:**

| Column | Cardinality | Good Index? |
|---|---|---|
| Email | High | ✅ |
| UserId | High | ✅ |
| OrderId | High | ✅ |
| Gender | Low | ❌ |
| IsActive | Low | ❌ |
| Status | Low/Medium | Depends |

**Composite Index Best Practice:**
```sql
CREATE INDEX idx_user_status_created
ON Orders(UserId, Status, CreatedAt);
```
Place high-cardinality columns first — `UserId` before `Status` — for better filtering efficiency.

**MongoDB Note:**
High-cardinality fields are ideal for indexes. Indexing low-cardinality fields (e.g., `isDeleted`) increases index size with little benefit.

**Interview Answer:**
"Index cardinality refers to the uniqueness of values in an indexed column. High-cardinality indexes like email or user ID are more efficient because they narrow results quickly, whereas low-cardinality indexes like boolean flags are often less useful because many rows share the same value."

### Indexing Decision — Employee Table Scenario

**Table:** `Employee(Id, Status)`
**Question:** Which column should be indexed?

**Answer:** "It depends on the query patterns and cardinality of the column."

**Index on `Id`:**
- High cardinality, unique values, extremely selective lookups
- `Id` is typically already the Primary Key → automatically has a clustered/unique index
```sql
SELECT * FROM Employee WHERE Id = 101;
-- Directly locates a single row
```

**What about `Status`?** (values: `Active`, `Inactive`, `Pending`)
- Low-cardinality column — if 90% employees are Active, selectivity is poor
- Optimizer may choose full table scan over index lookup
```sql
SELECT * FROM Employee WHERE Status = 'Active';
-- Index may be ignored if most rows match
```

**When low-cardinality indexes still help:**

1. **Combined with another column** — selectivity improves:
```sql
CREATE INDEX idx_status_department ON Employee(Status, DepartmentId);
```

2. **Table is very large** — even low selectivity can reduce I/O on huge datasets

3. **Queries heavily filter by status** — dashboards, background jobs, archival cleanup

4. **Partial / Filtered indexes** (PostgreSQL):
```sql
CREATE INDEX idx_active_employees ON Employee(Id) WHERE Status = 'Active';
```

**What the interviewer is testing:**

| Concept | What They Want to Hear |
|---|---|
| Cardinality | High vs low uniqueness awareness |
| Selectivity | Why DB may ignore an index |
| Query Optimizer | Full scan can beat index lookup |
| Tradeoffs | Reads vs writes cost |
| Real-world thinking | "Depends on workload" mindset |

**Senior-level answer:**
"`Id` is the obvious candidate — high cardinality, typically already indexed as the primary key. For `Status`, it depends on data distribution and query frequency. A standalone index on a low-cardinality column may not be efficient since the optimizer may prefer a table scan. However, if the app frequently filters by status or the table is very large, a composite or filtered index could still help. I'd decide based on actual query patterns and execution plans rather than blindly indexing every searchable column."

### Types of Indexes

| Index Type | Description | Use Case |
|------------|-------------|----------|
| **Clustered** | Sorts and stores data rows in the table based on key values. **One per table.** | Primary key lookups, range queries |
| **Non-Clustered** | Separate structure with pointers to data rows. **Multiple per table.** | Frequent WHERE/JOIN columns |
| **Unique** | Ensures no duplicate values in the indexed column(s) | Email, username, SSN |
| **Composite** | Index on **multiple columns** | Queries filtering on 2+ columns |
| **Covering** | Includes all columns needed by a query — no table lookup | High-performance read queries |
| **Filtered** | Index with a WHERE clause — indexes only a subset of rows | Partial data (e.g., active records only) |
| **Full-Text** | Optimized for searching text content within large text columns | Search in articles, descriptions |
| **Columnstore** | Stores data column-wise instead of row-wise | Analytics, data warehousing, aggregations |

```sql
-- Unique Index
CREATE UNIQUE INDEX idx_email ON Users(Email);

-- Composite Index
CREATE INDEX idx_tenant_status ON Orders(TenantId, Status);

-- Covering Index (INCLUDE adds non-key columns)
CREATE INDEX idx_orders_cover ON Orders(CustomerId)
  INCLUDE (OrderDate, TotalAmount);

-- Filtered Index (PostgreSQL / SQL Server)
CREATE INDEX idx_active_users ON Users(Id)
  WHERE IsActive = 1;

-- Full-Text Index (SQL Server)
CREATE FULLTEXT INDEX ON Articles(Content)
  KEY INDEX PK_Articles;

-- Columnstore Index
CREATE NONCLUSTERED COLUMNSTORE INDEX idx_cs_sales
  ON Sales(ProductId, Quantity, Amount);
```

> 💡 **Rule of thumb:** More indexes = faster reads, slower writes. Only index columns you actually query on.

### Stored Procedure vs Function

| | Stored Procedure | Function |
|-|-----------------|----------|
| Return value | Optional (can return 0 or multiple) | Must return a value |
| Parameters | Input + Output | Input only |
| DML statements | SELECT + INSERT/UPDATE/DELETE | SELECT only |
| Transaction mgmt | Yes | No |
| Try-Catch | Yes | No |
| Call in SELECT | No | Yes |
| Compilation | Precompiled (cached plan) | Compiled each execution |

**Function types:**
- **Scalar:** Returns single value (`ABS()`, `ROUND()`, custom)
- **Inline Table-Valued:** Returns table from single SELECT
- **Multi-Statement Table-Valued:** Returns table from multiple statements

---

## Deep Dive

### Common Query Patterns

**Nth highest salary (using CTE + ROW_NUMBER):**
```sql
WITH CTE AS (
    SELECT EmpName, Salary,
           ROW_NUMBER() OVER (ORDER BY Salary DESC) AS RN
    FROM Employee
)
SELECT * FROM CTE WHERE RN = @N;
```

**Max salary per department:**
```sql
SELECT DeptName, MAX(Salary)
FROM Employee e
JOIN Department d ON e.DeptId = d.DeptID
GROUP BY DeptName;
```

**Self-join — employees who are managers:**
```sql
SELECT e1.Name AS Employee, e2.Name AS Manager
FROM Employee e1
LEFT JOIN Employee e2 ON e1.ManagerId = e2.Id;
```

**Find duplicates:**
```sql
-- Find which values are duplicated and how many times
SELECT Name, COUNT(*) AS DuplicateCount
FROM Employee
GROUP BY Name
HAVING COUNT(*) > 1;

-- Find all duplicate rows with full details
WITH CTE AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY Name ORDER BY Id) AS RN
    FROM Employee
)
SELECT * FROM CTE WHERE RN > 1;   -- duplicate rows only
-- SELECT * FROM CTE WHERE Name IN (SELECT Name FROM CTE WHERE RN > 1);  -- all rows including originals
```

**Delete duplicates (keep first):**
```sql
WITH CTE AS (
    SELECT Id, ROW_NUMBER() OVER (PARTITION BY Name ORDER BY Id) AS RN
    FROM Employee
)
DELETE FROM Employee WHERE Id IN (SELECT Id FROM CTE WHERE RN > 1);
```

**Alternate rows (even/odd):**
```sql
WITH CTE AS (
    SELECT ROW_NUMBER() OVER (ORDER BY Id) AS RowNum, *
    FROM Employee
)
SELECT * FROM CTE WHERE RowNum % 2 = 0; -- even rows
```

**Handle NULL parameters:**
```sql
WHERE (@code IS NULL OR code = @code)
```

**Names ending with a specific character (LIKE pattern):**
```sql
SELECT DISTINCT Name
FROM student_marks
WHERE Name LIKE '%a';

-- Other LIKE patterns:
-- 'A%'     → starts with A
-- '%an%'   → contains "an"
-- '_a%'    → second character is "a"
-- '[ABC]%' → starts with A, B, or C
```

**Total marks per student (aggregate across subjects):**
```sql
SELECT Name, SUM(Marks) AS TotalMarks
FROM student_marks
GROUP BY Name;

-- With filtering: only students with total > 200
SELECT Name, SUM(Marks) AS TotalMarks
FROM student_marks
GROUP BY Name
HAVING SUM(Marks) > 200;
```

> 💡 **`WHERE` vs `HAVING`:** `WHERE` filters rows *before* grouping. `HAVING` filters groups *after* aggregation. You cannot use aggregate functions in `WHERE`.

### Temp Tables vs Table Variables

| | Temp Table (`#temp`) | Table Variable (`@table`) |
|-|---------------------|--------------------------|
| Storage | TempDB | Memory |
| Transactions | Participates | Does not participate |
| Indexes | Full index support | Only via PK/UNIQUE constraints |
| Scope | Session (local `#`) or global (`##`) | Batch/scope |
| Performance | Better for large datasets | Faster for small datasets |

### Views
- Virtual table based on a SELECT query. No physical storage.
- Simplifies complex queries. Can be indexed for performance.
- Use for: reusable queries, row-level security, abstraction layer.

### Common Table Expressions (CTE)
```sql
WITH CTE AS (
    SELECT ... FROM ...
)
SELECT * FROM CTE;
```
- Temporary named result set within a single statement.
- Can be recursive (hierarchical data like org charts).
- Can be referenced multiple times in the same query.
- Not stored as an object.

### Triggers & Magic Tables
- **Triggers:** Auto-execute SQL on INSERT/UPDATE/DELETE events.
- **`INSERTED` table:** Contains new rows (on INSERT/UPDATE).
- **`DELETED` table:** Contains old rows (on DELETE/UPDATE).

### Composite Keys
```sql
CREATE TABLE OrderItems (
    OrderId INT,
    ProductId INT,
    PRIMARY KEY (OrderId, ProductId)  -- composite key
);
```
- Combination of columns that uniquely identifies a row.
- Used when no single column is unique.

**Composite index behavior:** If index is on `(A, B, C)`:
- `WHERE A = ? AND B = ?` → index used (leftmost prefix)
- `WHERE B = ? AND C = ?` → index NOT used (missing leading column)

---

## Real-World Usage

### Query Performance Optimization (15 tips)
1. Define Primary Keys and Foreign Keys
2. Normalize the database
3. Avoid `SELECT *` — name specific columns
4. Create appropriate clustered/non-clustered indexes
5. Use `EXISTS` instead of `IN` for existence checks
6. Choose appropriate data types (varchar > nvarchar if ASCII-only)
7. Keep clustered index columns short
8. Use joins instead of subqueries
9. Avoid cursors (use set-based operations)
10. Use table variables for small datasets, temp tables for large
11. Use schema name before objects (`dbo.Employee`)
12. Use `SET NOCOUNT ON` to reduce network traffic
13. Use `TRY-CATCH` to handle deadlocks gracefully
14. Don't prefix user SPs with `sp_` (SQL Server checks `master` DB first)
15. Use covering indexes to avoid table lookups

### SQL Profiler / Execution Plans
- **Execution Plan:** `CTRL + M` in SSMS. Shows how SQL Server processes query.
- **SQL Profiler:** Captures and analyzes SQL events. Find slow queries.
- Look for: table scans (bad), index seeks (good), high-cost operators.

---

## Tradeoffs & Pitfalls

> ⚠️ **Over-indexing:** Each index = storage + write overhead on INSERT/UPDATE/DELETE.
- **`COUNT(*)` vs `COUNT(column)`:** `COUNT(*)` counts NULLs. `COUNT(column)` skips NULLs.
- **Cursors:** Extremely slow. Replace with set-based operations or CTEs.
- **`UNION` vs `UNION ALL`:** UNION removes duplicates (slower). UNION ALL keeps all rows (faster).
- **`IN` vs `EXISTS`:** EXISTS stops at first match (faster for correlated subqueries).
- **Temp tables in production:** Clean up after use. Global temp tables (`##`) visible to all sessions.
- **NULL comparisons:** `NULL = NULL` is FALSE. Use `IS NULL` / `IS NOT NULL`.
- **COALESCE:** Returns first non-null value. Use for default values.

---

## Interview Questions — Rapid Fire

| # | Question | Answer |
|---|----------|--------|
| 1 | **What is normalization?** | DB design to eliminate redundancy. **1NF→2NF→3NF** |
| 2 | **Clustered vs Non-Clustered?** | Clustered = data in index order (**1**/table). Non-clustered = pointers (many/table) |
| 3 | **SP vs Function?** | SP = DML + transactions + output params. Function = must return value, SELECT only |
| 4 | **What is a CTE?** | Temporary named result set with `WITH`. Can be **recursive** |
| 5 | **Nth highest salary?** | `ROW_NUMBER() OVER (ORDER BY Salary DESC)` in CTE, filter `RN = N` |
| 6 | **Delete duplicates?** | `ROW_NUMBER() OVER (PARTITION BY ...)`, delete where `RN > 1` |
| 7 | **Temp table vs Table var?** | Temp = TempDB + indexes. Table var = memory, faster for **small data** |
| 8 | **What is a trigger?** | Auto-executed SQL on DML events. Uses `INSERTED`/`DELETED` magic tables |
| 9 | **`UNION` vs `UNION ALL`?** | UNION removes duplicates (slower). UNION ALL keeps all (**faster**) |
| 10 | **Optimize slow query?** | Check execution plan, add indexes, avoid `SELECT *`, use `EXISTS` over `IN` |

---

## Quick Reference

```
NORMAL FORMS:   1NF (atomic) → 2NF (full key dependency) → 3NF (no transitive dependency)
INDEXES:        Clustered (1/table, data=index) | Non-clustered (many, pointer to data)
JOINS:          INNER | LEFT | RIGHT | FULL OUTER | CROSS | SELF
FUNCTIONS:      Scalar (single value) | Inline TVF | Multi-Statement TVF
TEMP:           #local (session) | ##global (all sessions) | @variable (memory)
AGGREGATES:     COUNT | SUM | AVG | MIN | MAX | GROUP BY + HAVING
WINDOW:         ROW_NUMBER() | RANK() | DENSE_RANK() | OVER (PARTITION BY ... ORDER BY ...)
NULL:           IS NULL | COALESCE(a,b,c) | NULLIF(a,b)
PERF:           Execution plan | SQL Profiler | SET NOCOUNT ON | covering indexes
```
