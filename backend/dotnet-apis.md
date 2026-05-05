# .NET APIs & Frameworks — Interview Preparation

---

## Core Concepts

### ASP.NET Web API
- Framework for building HTTP services (REST APIs) on .NET.
- Uses standard HTTP verbs: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`.
- Returns JSON/XML via content negotiation. No SOAP, no WSDL.
- Can be hosted in IIS or self-hosted (OWIN, console app, Windows service).

### REST Principles
- **Resource-oriented:** URLs represent resources (`/api/v1/students`), not actions.
- **Stateless:** Each request contains all info needed to process it.
- **HTTP methods = operations:** GET (read), POST (create), PUT (replace), PATCH (partial update), DELETE (remove).
- **Best practices:** Accept/respond with JSON, use plural nouns (`/cars` not `/car`), use HTTP status codes, version your API, use SSL/TLS.

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
| Type | Full ORM | Micro ORM |
| Features | Change tracking, lazy loading, migrations | Raw SQL, manual mapping |
| Performance | Slower | Faster (2nd fastest ORM) |
| Use case | Complex domain models | Performance-critical queries |

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

1. **What is REST?** Client-server architecture using HTTP verbs on resources, stateless, returns JSON/XML.
2. **Web API vs WCF?** Web API = lightweight HTTP/JSON. WCF = heavyweight multi-protocol SOAP.
3. **What is content negotiation?** Server selects response format based on `Accept` header.
4. **How to handle CORS?** Install CORS package, enable globally or per-controller with allowed origins.
5. **FromUri vs FromBody?** Simple types → URI. Complex types → body.
6. **What is EF?** ORM that maps C# objects to DB tables. Supports Code First, DB First, Model First.
7. **EF vs Dapper?** EF = full ORM (change tracking, migrations). Dapper = micro ORM (raw SQL, faster).
8. **What is OData?** Protocol for queryable REST APIs with standard CRUD operations.
9. **API versioning approaches?** URI (`/v1/`), query string, header, media type.
10. **Where is bearer token stored?** Client-side. Server verifies signature, doesn't store it.

---

## Quick Reference

```
REST:         GET=read  POST=create  PUT=replace  PATCH=partial  DELETE=remove
HEADERS:      Accept (want) | Content-Type (sending) | Authorization: Bearer <token>
BINDING:      Simple types → FromUri | Complex types → FromBody
STATUS:       200=OK  201=Created  204=NoContent  400=BadRequest  401=Unauth  404=NotFound  500=Error
CORS:         Install package → config.EnableCors() → [EnableCors] attribute
EF:           Code First | DB First | Model First
EF STATES:    Added | Modified | Deleted | Unchanged | Detached
LINQ:         Select | Where | GroupBy | OrderBy | Take | First | SelectMany
EXECUTION:    Deferred (lazy) until ToList()/foreach/Count()
WCF ABC:      Address (where) + Binding (how) + Contract (what)
DI:           Singleton | Scoped | Transient
```
