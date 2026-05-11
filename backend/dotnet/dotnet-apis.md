# .NET APIs & Frameworks — Interview Preparation

---

## Core Concepts

### ASP.NET Web API
- Framework for building HTTP services (REST APIs) on .NET.
- Uses standard HTTP verbs: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`.
- Returns JSON/XML via content negotiation. No SOAP, no WSDL.
- Can be hosted in IIS or self-hosted (OWIN, console app, Windows service).

### REST Principles

> ***Resource-oriented URLs + HTTP verbs + stateless + JSON. That's REST.***

- **Resource-oriented:** URLs represent resources (`/api/v1/students`), not actions.
- **Stateless:** Each request contains all info needed to process it.
- **HTTP methods = operations:** GET (read), POST (create), PUT (replace), PATCH (partial update), DELETE (remove).
- **Best practices:** Accept/respond with JSON, use plural nouns (`/cars` not `/car`), use HTTP status codes, version your API, use SSL/TLS.

### PUT vs PATCH

| | PUT | PATCH |
|-|-----|-------|
| **Semantics** | Replace the **entire** resource | Update **specific fields** only |
| **Idempotent?** | Yes | Yes (in practice) |
| **Payload** | Must send full object | Send only changed fields |
| **Missing fields** | Set to null/default | Left unchanged |

```csharp
// PUT /api/users/1 — replaces the entire user
[HttpPut("{id}")]
public IActionResult UpdateUser(int id, [FromBody] UserDto dto)
{
    var user = _db.Users.Find(id);
    if (user == null) return NotFound();

    // ALL fields overwritten — if dto.Phone is null, user.Phone becomes null
    user.Name = dto.Name;
    user.Email = dto.Email;
    user.Phone = dto.Phone;
    _db.SaveChanges();
    return Ok(user);
}

// PATCH /api/users/1 — updates only provided fields
[HttpPatch("{id}")]
public IActionResult PatchUser(int id, [FromBody] JsonPatchDocument<UserDto> patchDoc)
{
    var user = _db.Users.Find(id);
    if (user == null) return NotFound();

    var dto = _mapper.Map<UserDto>(user);
    patchDoc.ApplyTo(dto);   // Only modifies fields specified in patch
    _mapper.Map(dto, user);
    _db.SaveChanges();
    return Ok(user);
}
```

```json
// PATCH request body (JSON Patch format)
[
  { "op": "replace", "path": "/name", "value": "Alice Updated" },
  { "op": "replace", "path": "/phone", "value": "+1-555-0123" }
]
```

**When to use:** PUT for full form submissions (edit user profile). PATCH for partial updates (toggle status, update a single field).

### Passing Data in GET Requests

> ⚠️ **GET requests should NOT have a request body.** Most servers/proxies ignore or reject it.

**Recommended approaches:**

```csharp
// 1. Query parameters (most common)
// GET /api/users?name=Alice&role=admin
[HttpGet]
public IActionResult GetUsers([FromQuery] string name, [FromQuery] string role)
{
    var users = _db.Users.Where(u => u.Name == name && u.Role == role);
    return Ok(users);
}

// 2. Route parameters (for resource identification)
// GET /api/users/42
[HttpGet("{id}")]
public IActionResult GetUser(int id) => Ok(_db.Users.Find(id));

// 3. Complex filter object via query string
// GET /api/users?Name=Alice&MinAge=25&SortBy=name
[HttpGet]
public IActionResult Search([FromQuery] UserFilter filter)
{
    // filter.Name, filter.MinAge, filter.SortBy all bound from query string
    return Ok(_userService.Search(filter));
}

// 4. Headers (for metadata, not data)
// Authorization: Bearer <token>
// X-Tenant-Id: 42
[HttpGet]
public IActionResult GetData([FromHeader(Name = "X-Tenant-Id")] int tenantId) { }
```

**Why no body in GET?**
- GET is for retrieval — should be cacheable and bookmarkable
- Proxies, CDNs, and browsers may strip or ignore GET body
- REST convention: data retrieval params go in URL

> 💡 **For complex search with many filters:** Use `POST` with a body to `/api/users/search` — this is an accepted REST exception.

### HTTP Status Codes

| Code | Name | Meaning | When to Use |
|------|------|---------|-------------|
| **200** | OK | Request succeeded | Successful GET, PUT, PATCH |
| **201** | Created | Resource created | Successful POST (return with `Location` header) |
| **204** | No Content | Success, no body | Successful DELETE |
| **301** | Moved Permanently | Resource moved | URL changed permanently |
| **304** | Not Modified | Cached version is current | Conditional GET (ETag/If-Modified-Since) |
| **400** | Bad Request | Invalid input | Validation errors, malformed JSON |
| **401** | Unauthorized | Not authenticated | Missing or invalid auth token |
| **403** | Forbidden | Authenticated but not authorized | User lacks required role/permission |
| **404** | Not Found | Resource doesn't exist | Invalid URL or missing resource |
| **405** | Method Not Allowed | Wrong HTTP verb | POST to a GET-only endpoint |
| **409** | Conflict | State conflict | Duplicate entry, concurrent update conflict |
| **413** | Payload Too Large | Request body exceeds limit | File upload too big, JSON body too large |
| **429** | Too Many Requests | Rate limit exceeded | API throttling |
| **500** | Internal Server Error | Unhandled exception | Server-side bug |
| **502** | Bad Gateway | Upstream server error | Reverse proxy can't reach backend |
| **503** | Service Unavailable | Server overloaded/maintenance | Temporary downtime |

**413 vs 404 — key difference:**

| | 413 Payload Too Large | 404 Not Found |
|-|----------------------|---------------|
| **Category** | Client error (request issue) | Client error (routing issue) |
| **Cause** | Request body exceeds server's size limit | URL doesn't match any resource/endpoint |
| **Example** | Uploading a 500MB file when limit is 100MB | `GET /api/userz` (typo) or `GET /api/users/99999` (doesn't exist) |
| **Fix** | Reduce payload size, increase server limit | Correct the URL or check if resource exists |

```csharp
// Configuring max request body size in .NET
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 100 * 1024 * 1024; // 100 MB
});

// Returning proper status codes
[HttpPost("upload")]
public IActionResult Upload(IFormFile file)
{
    if (file.Length > 100_000_000)
        return StatusCode(413, new { message = "File exceeds 100MB limit" });

    return Ok();
}

[HttpGet("{id}")]
public IActionResult GetUser(int id)
{
    var user = _db.Users.Find(id);
    if (user == null)
        return NotFound(new { message = $"User {id} not found" });  // 404

    return Ok(user);  // 200
}
```

### MVC vs Web API

| | ASP.NET MVC | ASP.NET Web API |
|-|------------|----------------|
| Purpose | Web apps (HTML views) | HTTP services (raw data) |
| Returns | Views + data | JSON/XML |
| Content negotiation | No | Yes |
| Use case | Server-rendered UI | APIs for any client |

---

## Deep Dive

### Content Negotiation
Two key headers drive format selection:
- **`Accept`** — client tells server what format it wants back
- **`Content-Type`** — client tells server what format it's *sending*
- Accept header takes precedence when both are present.

```
// Force JSON for browser requests
config.Formatters.JsonFormatter.SupportedMediaTypes
    .Add(new MediaTypeHeaderValue("text/html"));

// Remove XML formatter entirely
config.Formatters.XmlFormatter.SupportedMediaTypes.Clear();

// CamelCase JSON output
config.Formatters.JsonFormatter.SerializerSettings.ContractResolver
    = new CamelCasePropertyNamesContractResolver();
```

### Routing & Versioning
- **Convention-based:** `config.Routes.MapHttpRoute("api/{controller}/{action}/{id}")`
- **Attribute-based:** `[Route("api/v1/students")]`, `[RoutePrefix("students")]`
- **Versioning via URI:** `/api/v1/students` vs `/api/v2/students`
- Keep old versions alive to avoid breaking existing clients.

### Parameter Binding
| Type | Binding Source | Example |
|------|---------------|---------|
| Simple types (`int`, `string`, `bool`) | URL (query string) | `[FromUri]` |
| Complex types (objects) | Request body | `[FromBody]` |

### CORS (Cross-Origin Resource Sharing)
Allows APIs to accept requests from different domains:
```csharp
// Global
var cors = new EnableCorsAttribute("https://example.com", "*", "*");
config.EnableCors(cors);

// Controller-level
[EnableCors(origins: "https://example.com", headers: "*", methods: "get,post")]
public class TestController : ApiController { }
```

### Exception Handling

| Approach | Scope | Use Case |
|----------|-------|----------|
| `HttpResponseException` | Single action | Throw specific HTTP status |
| `ExceptionFilterAttribute` | Controller/action | Custom error filter |
| Exception Handlers | Global | Catch-all handler |
| `HttpError` + `CreateErrorResponse` | Any | Structured error response |

Default for uncaught exceptions: **500 Internal Server Error**.

### Return Types

| Type | Description |
|------|-------------|
| `void` | Returns 204 No Content |
| `HttpResponseMessage` | Full control over response |
| `IHttpActionResult` | Calls `ExecuteAsync` internally |
| Other types | Serialized to response body |

### Bearer Tokens
- Not stored server-side — issued to client, presented on each call.
- Verified via OWIN host's protection key (machine key in web.config).
- Valid as long as token hasn't expired.

---

## Entity Framework

### Approaches

| Approach | Start From | Best When |
|----------|-----------|-----------|
| **Code First** | C# classes → DB generated | Full code control, greenfield |
| **Database First** | Existing DB → classes generated | Legacy DB, DBA-designed schema |
| **Model First** | Visual designer (.edmx) → DB | Architect-led, rarely used |

### Key Concepts
- **ORM:** Maps C# objects to database tables automatically.
- **POCO classes:** Plain C# classes used as entities.
- **Proxy objects:** Auto-generated from POCOs for change tracking + lazy loading. Require: public class, not sealed, virtual properties, `ICollection<T>` for navigation.
- **Entity states:** `Added`, `Modified`, `Deleted`, `Unchanged`, `Detached`.
- **SQL injection protection:** EF generates parameterized queries by default.

### EF vs Dapper

| | Entity Framework | Dapper |
|-|-----------------|--------|
| **Type** | Full ORM | Micro ORM |
| **Features** | Change tracking, lazy loading, migrations | Raw SQL, manual mapping |
| **Performance** | Slower | **Faster** (2nd fastest ORM) |
| **Use case** | Complex domain models | Performance-critical queries |

### When to Use Raw SQL vs ORM

| Scenario | Use | Why |
|----------|-----|-----|
| Standard CRUD operations | **ORM (EF)** | Clean, type-safe, change tracking handles inserts/updates |
| Complex reports with many joins | **Raw SQL / Dapper** | ORM-generated SQL can be inefficient for complex queries |
| Bulk insert/update (10K+ rows) | **Raw SQL** | EF tracks every entity — very slow for bulk operations |
| Stored procedures | **Dapper or EF raw** | Both support it; Dapper is simpler |
| Dynamic queries (runtime filters) | **ORM (EF LINQ)** | Compose `.Where()` chains dynamically |
| Performance-critical hot paths | **Dapper / Raw SQL** | Full control, no ORM overhead |
| Rapid prototyping / new features | **ORM (EF)** | Faster development, migrations, less boilerplate |
| Legacy database with unusual schema | **Dapper** | No need to map every relationship |

**Hybrid approach (recommended for production):**
```csharp
// Standard CRUD — use EF (clean, type-safe)
public async Task<User> GetUser(int id)
    => await _context.Users.FindAsync(id);

public async Task CreateUser(User user)
{
    _context.Users.Add(user);
    await _context.SaveChangesAsync();
}

// Complex reporting query — use Dapper (performance)
public async Task<IEnumerable<SalesReport>> GetSalesReport(DateTime from, DateTime to)
{
    var sql = @"
        SELECT p.Category, SUM(o.Amount) AS TotalSales, COUNT(*) AS OrderCount
        FROM Orders o
        JOIN Products p ON o.ProductId = p.Id
        WHERE o.OrderDate BETWEEN @From AND @To
        GROUP BY p.Category
        ORDER BY TotalSales DESC";

    using var conn = new SqlConnection(_connectionString);
    return await conn.QueryAsync<SalesReport>(sql, new { From = from, To = to });
}

// Bulk insert — use raw SQL (EF would be 100x slower)
public async Task BulkInsertLogs(List<LogEntry> logs)
{
    var dt = new DataTable();
    dt.Columns.Add("Message"); dt.Columns.Add("Level"); dt.Columns.Add("Timestamp");
    foreach (var log in logs)
        dt.Rows.Add(log.Message, log.Level, log.Timestamp);

    using var conn = new SqlConnection(_connectionString);
    using var bulk = new SqlBulkCopy(conn) { DestinationTableName = "Logs" };
    await conn.OpenAsync();
    await bulk.WriteToServerAsync(dt);
}
```

> 💡 **Rule of thumb:** Start with EF for everything. Switch to Dapper/raw SQL for specific queries where EF is **measurably slow** (profiled, not guessed).

---

## WCF (Legacy — know for comparison)

### WCF Endpoint = ABC
- **A**ddress — WHERE (URL)
- **B**inding — HOW (HTTP, TCP, Named Pipes, MSMQ)
- **C**ontract — WHAT (Service/Operation/Data/Message/Fault contracts)

### WCF vs Web API

| | WCF | Web API |
|-|-----|---------|
| Weight | Heavy (WSDL/SOAP) | Lightweight (JSON/XML) |
| Protocols | HTTP, TCP, Named Pipes, MSMQ | HTTP only |
| Parsing | Complex SOAP parsing | Simple JSON/XML |
| Use case | Enterprise interop, duplex | Modern REST APIs |

### Message Exchange Patterns
- **Request/Response** — default, synchronous
- **One-Way** — fire and forget
- **Duplex** — bidirectional (callbacks)

---

## Real-World Usage

### LINQ

**Core operators:**
```csharp
.Select(x => x.Name)              // Transform
.Where(x => x.Age > 18)           // Filter
.GroupBy(x => x.Category)         // Group
.OrderBy(x => x.Price)            // Sort
.Take(3)                          // Limit
.First() / .FirstOrDefault()      // Single element
.SelectMany(x => x)               // Flatten nested collections
```

**Deferred execution:** Queries don't run until enumerated (`ToList()`, `foreach`, `Count()`).

```csharp
int[] numbers = { 1, 2, 3, 4 };
int max = 2;
var large = numbers.Where(i => i > max); // Not executed yet
max = 3;                                  // Closure captures variable
var list = large.ToList();                // NOW executes — result: { 4 }
```

---

## Tradeoffs & Pitfalls

- **WCF vs Web API:** Use Web API for new projects. WCF only for existing enterprise systems needing non-HTTP protocols.
- **Code First vs DB First:** Code First for greenfield. DB First for existing schemas. Don't fight the DBA.
- **EF performance:** Use `.AsNoTracking()` for read-only queries. Use Dapper for hot paths.
- **CORS misconfiguration:** Never use `*` for origins in production. Whitelist specific domains.
- **Missing `[FromBody]`:** Complex types won't bind from query string without explicit annotation.
- **Over-returning data:** Always select specific columns, use DTOs. Never expose entity models directly.

---

## Interview Questions — Rapid Fire

| # | Question | Answer |
|---|----------|--------|
| 1 | **What is REST?** | Client-server arch using HTTP verbs on resources, stateless, returns JSON/XML |
| 2 | **Web API vs WCF?** | Web API = lightweight HTTP/JSON. WCF = heavyweight multi-protocol SOAP |
| 3 | **Content negotiation?** | Server selects response format based on `Accept` header |
| 4 | **Handle CORS?** | Install CORS package, enable globally or per-controller with allowed origins |
| 5 | **FromUri vs FromBody?** | Simple types → URI. Complex types → body |
| 6 | **What is EF?** | ORM mapping C# objects to DB tables. Code First, DB First, Model First |
| 7 | **EF vs Dapper?** | EF = full ORM (change tracking, migrations). Dapper = micro ORM (**raw SQL, faster**) |
| 8 | **What is OData?** | Protocol for queryable REST APIs with standard CRUD operations |
| 9 | **API versioning?** | URI (`/v1/`), query string, header, media type |
| 10 | **Bearer token stored?** | **Client-side.** Server verifies signature, doesn't store it |

---

## Quick Reference

```
REST:         GET=read  POST=create  PUT=replace  PATCH=partial  DELETE=remove
HEADERS:      Accept (want) | Content-Type (sending) | Authorization: Bearer <token>
BINDING:      Simple types → FromUri | Complex types → FromBody
STATUS:       200=OK  201=Created  204=NoContent  400=BadRequest  401=Unauth  403=Forbidden  404=NotFound  413=TooLarge  429=RateLimit  500=Error
METHODS:      GET=read  POST=create  PUT=replace(full)  PATCH=update(partial)  DELETE=remove
GET DATA:     Query params (?key=val) | Route params (/id) | Headers | NO body
CORS:         Install package → config.EnableCors() → [EnableCors] attribute
EF:           Code First | DB First | Model First
EF STATES:    Added | Modified | Deleted | Unchanged | Detached
LINQ:         Select | Where | GroupBy | OrderBy | Take | First | SelectMany
EXECUTION:    Deferred (lazy) until ToList()/foreach/Count()
WCF ABC:      Address (where) + Binding (how) + Contract (what)
DI:           Singleton | Scoped | Transient
```
