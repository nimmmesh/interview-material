# OOP & SOLID Principles — Interview Preparation

---

## Core Concepts

### Four Pillars of OOP

| Pillar | Definition | C# Mechanism |
|--------|-----------|--------------|
| **Encapsulation** | Bundle data + methods, hide internals | Access modifiers (`private`, `protected`, `public`) |
| **Abstraction** | Expose only what's necessary | Abstract classes, interfaces |
| **Inheritance** | Derive new classes from existing ones | `: BaseClass`, `: IInterface` |
| **Polymorphism** | Same interface, different behavior | `virtual`/`override`, interfaces |

### Abstract Class vs Interface

| | Abstract Class | Interface |
|-|---------------|-----------|
| Instantiation | Cannot | Cannot |
| Constructor | Yes | No |
| Fields/state | Yes | No (until C# 8 default methods) |
| Access modifiers | Yes | No (all public implicitly) |
| Multiple inheritance | No (single only) | Yes (multiple interfaces) |
| Method implementation | Can have both abstract and concrete | Only signatures (pre-C# 8) |
| When to use | Related classes sharing common logic | Unrelated classes sharing a contract |

**Abstract class example — shared base for employees:**
```csharp
public abstract class BaseEmployee
{
    public int ID { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string GetFullName() => FirstName + " " + LastName;
    public abstract int GetMonthlySalary(); // subclass MUST implement
}

public class FullTimeEmployee : BaseEmployee
{
    public int AnnualSalary { get; set; }
    public override int GetMonthlySalary() => AnnualSalary / 12;
}

public class PartTimeEmployee : BaseEmployee
{
    public int HourlyPay { get; set; }
    public int TotalHoursWorked { get; set; }
    public override int GetMonthlySalary() => HourlyPay * TotalHoursWorked;
}
```

**Interface example — unrelated capabilities:**
```csharp
interface IStore { void Read(); void Write(); }
interface ICompress { void Compress(); void Decompress(); }

public class Document : IStore, ICompress
{
    public void Read() { /* ... */ }
    public void Write() { /* ... */ }
    public void Compress() { /* ... */ }
    public void Decompress() { /* ... */ }
}
```

**Same method in two interfaces?** Use explicit implementation: `ISupplier.MethodName()`.

### Static Class

> 💡 **Singleton ≠ Static class:** Singleton allows **one instance with state**; static class has **no instances**.

- Cannot be instantiated. All members must be `static`.
- Is implicitly `sealed`. No instance constructors.
- Use for stateless utility methods (e.g., `TemperatureConverter.CelsiusToFahrenheit()`).

### `virtual` / `override` / `new` — Method Overriding Deep Dive

> ***`virtual` + `override` = runtime polymorphism. `new` = compile-time hiding (breaks polymorphism).***

- `virtual` → base class declares method **can be** overridden
- `override` → derived class **replaces** base implementation (runtime polymorphism)
- `new` → derived class **hides** base method (compile-time, NOT polymorphism)

**Runtime polymorphism with `virtual`/`override`:**
```csharp
public class PaymentProcessor
{
    public virtual decimal CalculateFee(decimal amount)
    {
        return amount * 0.02m; // Base: 2% fee
    }
}

public class PremiumPaymentProcessor : PaymentProcessor
{
    public override decimal CalculateFee(decimal amount)
    {
        return amount * 0.01m; // Override: 1% fee for premium
    }
}

// Runtime polymorphism in action
PaymentProcessor processor = new PremiumPaymentProcessor();
processor.CalculateFee(1000); // Returns 10 (calls PremiumPaymentProcessor)
// The ACTUAL type (PremiumPaymentProcessor) determines which method runs
```

**`new` keyword — method hiding (dangerous):**
```csharp
public class Logger
{
    public virtual void Log(string msg) => Console.WriteLine($"[Base] {msg}");
}

public class FileLogger : Logger
{
    public new void Log(string msg) => Console.WriteLine($"[File] {msg}");
}

Logger logger = new FileLogger();
logger.Log("test");    // Prints "[Base] test" ❌ — new uses DECLARED type, not actual

FileLogger fl = new FileLogger();
fl.Log("test");        // Prints "[File] test" ✅ — only works with exact type
```

**When to use each:**

| Keyword | When | Polymorphism? |
|---------|------|---------------|
| `virtual` + `override` | You want derived classes to customize behavior | Yes (runtime) |
| `abstract` + `override` | You **require** derived classes to implement | Yes (runtime) |
| `new` | You must hide a base method (rare, usually a code smell) | No (compile-time) |

**Real-world use case — notification system:**
```csharp
public abstract class NotificationService
{
    public void Send(string userId, string message)
    {
        var user = GetUser(userId);
        var formatted = FormatMessage(message); // Template method pattern
        Deliver(user, formatted);
        LogDelivery(user);
    }

    protected abstract void Deliver(User user, string message); // MUST override
    protected virtual string FormatMessage(string msg) => msg;  // CAN override
    private void LogDelivery(User user) { /* ... */ }           // Cannot override
}

public class EmailNotification : NotificationService
{
    protected override void Deliver(User user, string message)
        => _emailClient.Send(user.Email, message);

    protected override string FormatMessage(string msg)
        => $"<html><body>{msg}</body></html>"; // HTML wrap
}

public class SmsNotification : NotificationService
{
    protected override void Deliver(User user, string message)
        => _smsClient.Send(user.Phone, message);
    // FormatMessage NOT overridden — uses base (plain text)
}
```

**Senior-Level Answer:** "Method overriding via `virtual`/`override` gives us runtime polymorphism — the CLR resolves the method call based on the actual object type, not the declared type. I use it heavily with the Template Method pattern where the base class defines the algorithm skeleton and derived classes customize specific steps. I avoid `new` keyword hiding because it breaks polymorphism and creates confusing bugs when objects are referenced through their base type."

**Common Cross Questions:**
- *Can you override a non-virtual method?* No. The base must mark it `virtual` or `abstract`.
- *Can you override a private method?* No. Private methods aren't visible to derived classes.
- *`override` vs `new` in method resolution?* Override = runtime type. New = compile-time declared type.
- *Can you call base implementation from override?* Yes, via `base.MethodName()`.
- *What if you forget `override`?* Compiler warning suggests `new`. The method hides, not overrides.

### Access Modifiers — `protected` vs `internal`

> ***`protected` = inheritance hierarchy. `internal` = assembly boundary. Different axes of access.***

| Modifier | Accessible From | Scope |
|----------|----------------|-------|
| `public` | Anywhere | Unrestricted |
| `private` | Same class only | Most restrictive |
| `protected` | Same class + **derived classes** (any assembly) | Inheritance-based |
| `internal` | Same **assembly** (project/DLL) only | Assembly-based |
| `protected internal` | Same assembly **OR** derived classes (even in other assemblies) | Union of both |
| `private protected` | Same assembly **AND** derived classes | Intersection of both |

```csharp
// Assembly A (MyApp.Core.dll)
public class BaseService
{
    protected void ValidateInput() { }       // Only derived classes can call
    internal void ClearCache() { }           // Any class in MyApp.Core.dll can call
    protected internal void Reset() { }      // Derived classes OR same assembly
    private protected void InternalHook() { } // Derived classes IN same assembly only
}

// Assembly A — same project
public class OrderService : BaseService
{
    public void Process()
    {
        ValidateInput();     // ✅ protected — we're a derived class
        ClearCache();        // ✅ internal — we're in the same assembly
        Reset();             // ✅ protected internal — both apply
        InternalHook();      // ✅ private protected — derived + same assembly
    }
}

public class HelperClass // NOT derived from BaseService
{
    public void DoWork(BaseService svc)
    {
        // svc.ValidateInput();  // ❌ protected — not derived
        svc.ClearCache();       // ✅ internal — same assembly
        svc.Reset();            // ✅ protected internal — same assembly satisfies it
        // svc.InternalHook();   // ❌ private protected — not derived
    }
}

// Assembly B (MyApp.Web.dll) — different project, references MyApp.Core
public class WebOrderService : BaseService
{
    public void Handle()
    {
        ValidateInput();     // ✅ protected — derived class
        // ClearCache();     // ❌ internal — different assembly
        Reset();             // ✅ protected internal — derived class satisfies it
        // InternalHook();   // ❌ private protected — different assembly
    }
}
```

**When to use each:**

| Modifier | Real-World Use Case |
|----------|--------------------|
| `protected` | Base class methods that only derived classes should customize (e.g., `FormatMessage()` in notification system) |
| `internal` | Implementation details within a library/project that shouldn't leak to consumers (e.g., repository helpers, cache managers) |
| `protected internal` | Framework extensibility points accessible within your assembly AND by external inheritors |
| `private protected` | Template methods that only derived classes within the same assembly should override |

**Senior-Level Answer:** "`protected` scopes access along the inheritance axis — derived classes anywhere can access it. `internal` scopes along the assembly boundary — any class in the same DLL can access it. `protected internal` is their union (either condition grants access), while `private protected` is their intersection (both conditions required). In our microservice architecture, I use `internal` extensively to hide implementation details within a service's assembly while exposing only `public` interfaces for inter-service contracts."

---

## Deep Dive

### SOLID Principles

#### S — Single Responsibility Principle (SRP)
> ⚡ **A class should have one, and only one, reason to change.**

**Violation:** `Customer` class doing both DB operations AND logging.
**Fix:** Extract logging into a separate `Logger` class.

**Real-world example** — layered architecture:
```
Service/     → HTTP handling, routing, DI config
Bridge/      → Business orchestration, external calls
Core/        → Interfaces, models, enums
Data/        → Database access, query building
```
Each layer has ONE reason to change. Database migration → only touches `Data`.

#### O — Open/Closed Principle (OCP)
> ⚡ **Open for extension, closed for modification.**

**Violation:** Growing `if/else` chains when new types are added.
**Fix:** Strategy pattern — each behavior is a class implementing a common interface.

```csharp
// Instead of: if (type == "amend") ... else if (type == "copy") ...

public interface ICopyOperationStrategy
{
    Task CopyVersion(JObject payload);
}

public class AmendContract : ICopyOperationStrategy { /* amend logic */ }
public class CopyContract : ICopyOperationStrategy { /* copy logic */ }
// New operation? Create new class. Existing code untouched.
```

**Factory resolves the right strategy:**
```csharp
public ICopyOperationStrategy Create(string operation) => operation switch
{
    "amend" => _sp.GetService<IAmendContract>(),
    "clone" => _sp.GetService<ICopyContract>(),
    _ => throw new NotImplementedException()
};
```

#### L — Liskov Substitution Principle (LSP)
> ⚡ **Subtypes must be substitutable for their base types without breaking behavior.**

**Violation:** `Enquiry : Customer` throws `NotImplementedException` on `Add()`.
**Fix:** Split into `IDiscount` and `IDatabase` interfaces. `Enquiry` implements only `IDiscount`.

**Behavioral contract rules:**
- Preconditions cannot be strengthened
- Postconditions cannot be weakened
- Invariants must be preserved
- No `NotImplementedException` in inherited methods

#### I — Interface Segregation Principle (ISP)
> ⚡ **No client should be forced to depend on methods it doesn't use.**

**Bad — fat interface:**
```csharp
public interface IBaseRepository  // 13+ methods mixing headers, config, module ID
{
    Dictionary<string, string> GetLeoHeaders();
    Task<string> GetPlatformConfigurationValue(string key);
    string GetSubTypeId();
    // ... 10 more unrelated methods
}
```

**Good — focused interfaces:**
```csharp
public interface IAddObligationsRepository
{
    Task<Maybe<JObject>> AddBulkObligationsByModelName(JToken request);
}
public interface IGetObligationsRepository
{
    Task<Maybe<JToken>> GetObligations(JObject requestObj, int limit, int skip);
}
public interface IDeleteObligationsRepository
{
    Task<Maybe<JObject>> DeleteBulkObligations(List<string> _ids);
}
```

#### D — Dependency Inversion Principle (DIP)
> ⚡ **High-level modules should not depend on low-level modules. Both should depend on abstractions.**

> ⚠️ **DIP ≠ DI:** DIP is a design **principle** (depend on abstractions). DI is a **technique** (inject at runtime).

**Flow:**
```
Controller (high-level) → depends on → ILineItemBridgeRepository (abstraction)
                                              ↑ implements
                          LineItemBridgeRepository (low-level, knows about DB)
```

**Wiring at composition root (Startup.cs):**
```csharp
services.TryAddScoped<ILineItemBridgeRepository, LineItemBridgeRepository>();
services.TryAddScoped<IBaseRepository, BaseRepository>();
```

**DI Lifetimes:**

| Lifetime | Behavior |
|----------|----------|
| `Singleton` | One instance for entire app lifetime |
| `Scoped` | One instance per HTTP request |
| `Transient` | New instance every time it's requested |

### How SOLID Works Together
```
Controller               → SRP: only handles HTTP
  ├─ IWorkflowFactory    → DIP: depends on abstraction
  │   └─ WorkflowFactory → OCP: new workflows = new classes
  │       └─ IWorkFlowManager → LSP: all 15 managers are substitutable
  └─ IAddObligationRepo  → ISP: focused interface
```

---

## C# Language Features

### Delegates & Events
- **Delegate** = type-safe function pointer. Holds reference to method(s) with matching signature.
- **Multicast delegate** = points to multiple methods (`del += Method2`). Return value = last invoked method's.
- **Events** = encapsulated delegates. Publisher/Subscriber pattern. Cannot be invoked outside declaring class.
- **Lambda** = inline delegate: `Employee.Promotion(emplist, x => x.Experience >= 5);`

### Generics — Deep Dive

> ***Generics = write once, work with any type, without losing type safety or incurring boxing overhead.***

**Why Generics?**

| Without Generics | With Generics |
|-----------------|---------------|
| Use `object` → boxing/unboxing overhead | No boxing — works directly with the type |
| Runtime `InvalidCastException` risk | Compile-time type checking |
| Need separate methods per type | One method handles all types |

**Boxing/Unboxing problem:**
```csharp
// Without generics — ArrayList uses object
ArrayList list = new ArrayList();
list.Add(42);                    // Boxing: int → object (heap allocation)
int val = (int)list[0];          // Unboxing: object → int (cast + copy)

// With generics — no boxing
List<int> list = new List<int>();
list.Add(42);                    // No boxing — stored as int directly
int val = list[0];               // No cast needed
```

**Generic method:**
```csharp
public static bool AreEqual<T>(T val1, T val2) => val1.Equals(val2);

AreEqual<int>(5, 5);         // true — type inferred
AreEqual("hello", "world");  // false — compiler infers T = string
```

**Generic constraints — restrict what T can be:**

| Constraint | Meaning | Example |
|-----------|---------|--------|
| `where T : class` | T must be a reference type | Exclude int, bool, struct |
| `where T : struct` | T must be a value type | Only int, bool, DateTime, etc. |
| `where T : new()` | T must have parameterless constructor | `new T()` inside method |
| `where T : BaseClass` | T must inherit from BaseClass | Restrict to specific hierarchy |
| `where T : IInterface` | T must implement IInterface | `T` can call interface methods |
| `where T : notnull` | T cannot be null | Non-nullable types only |

**Production example — Generic Repository Pattern:**
```csharp
public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(int id);
}

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    private readonly AppDbContext _context;
    private readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(int id)
        => await _dbSet.FindAsync(id);

    public async Task<IEnumerable<T>> GetAllAsync()
        => await _dbSet.AsNoTracking().ToListAsync();

    public async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _dbSet.FindAsync(id);
        if (entity != null) _dbSet.Remove(entity);
        await _context.SaveChangesAsync();
    }
}

// Registration — one line per entity
services.AddScoped<IRepository<Order>, Repository<Order>>();
services.AddScoped<IRepository<Product>, Repository<Product>>();
services.AddScoped<IRepository<Customer>, Repository<Customer>>();
```

**Generic service with multiple constraints:**
```csharp
public class CacheService<TKey, TValue>
    where TKey : notnull
    where TValue : class, new()
{
    private readonly Dictionary<TKey, TValue> _cache = new();

    public TValue GetOrCreate(TKey key)
    {
        if (!_cache.TryGetValue(key, out var value))
        {
            value = new TValue(); // new() constraint allows this
            _cache[key] = value;
        }
        return value;
    }
}
```

**Performance impact:**
- Value types (`int`, `struct`) → CLR generates specialized code per type (no boxing)
- Reference types → CLR shares one implementation (all reference types are pointers)
- Generic collections (`List<T>`, `Dictionary<TKey, TValue>`) are 2-3x faster than non-generic (`ArrayList`, `Hashtable`)

**Senior-Level Answer:** "Generics provide type safety at compile time while eliminating boxing overhead for value types. In our services, I use the Generic Repository pattern to avoid writing duplicate CRUD code for each entity — one `Repository<T>` implementation handles 20+ entity types. I also use generic constraints like `where T : BaseEntity` to ensure only valid entity types are used, and `where T : new()` when I need to instantiate types inside the generic method."

**Common Cross Questions:**
- *Generics vs object type?* Generics = compile-time safety + no boxing. Object = runtime casting + boxing for value types.
- *Can you have generic constraints on multiple types?* Yes: `where T : class, IComparable<T>, new()`
- *What is covariance/contravariance?* `out T` (covariance) = can return T. `in T` (contravariance) = can accept T. E.g., `IEnumerable<out T>` allows `IEnumerable<Dog>` → `IEnumerable<Animal>`.
- *Default value of generic type?* Use `default(T)` — returns `null` for reference types, `0` for numeric, `false` for bool.

### `async` / `await` in C#

> ***`async`/`await` = write asynchronous code that reads like synchronous. No thread blocking.***

**How it works:**
```
Thread calls async method
       │
       ▼
Hits `await` → if task not complete, thread is RELEASED back to thread pool
       │
       ▼
Task completes (I/O done) → continuation scheduled on available thread
       │
       ▼
Execution resumes after `await`
```

**Production example:**
```csharp
public class OrderService
{
    private readonly IRepository<Order> _orderRepo;
    private readonly IPaymentService _paymentService;
    private readonly INotificationService _notificationService;

    public async Task<OrderResult> ProcessOrderAsync(OrderRequest request)
    {
        // Each await releases the thread while waiting for I/O
        var order = await _orderRepo.AddAsync(new Order(request));  // DB I/O
        var payment = await _paymentService.ChargeAsync(order);     // External API
        
        // Fire-and-forget notification (intentional)
        _ = _notificationService.SendAsync(order.UserId, "Order placed!");
        
        return new OrderResult(order.Id, payment.TransactionId);
    }
}
```

**Parallel async operations:**
```csharp
// ❌ Sequential — total time = sum of all operations
var users = await _userService.GetAllAsync();       // 200ms
var orders = await _orderService.GetRecentAsync();   // 300ms
var stats = await _statsService.GetDashboardAsync(); // 150ms
// Total: ~650ms

// ✅ Parallel — total time = max of all operations
var usersTask = _userService.GetAllAsync();
var ordersTask = _orderService.GetRecentAsync();
var statsTask = _statsService.GetDashboardAsync();
await Task.WhenAll(usersTask, ordersTask, statsTask);
// Total: ~300ms (limited by slowest)

var users = usersTask.Result;
var orders = ordersTask.Result;
var stats = statsTask.Result;
```

**Common pitfalls:**

| Pitfall | Problem | Fix |
|---------|---------|-----|
| `async void` | Exceptions can't be caught, crashes the app | Always return `Task` or `Task<T>` (except event handlers) |
| `.Result` / `.Wait()` on async | Deadlock in ASP.NET (synchronization context) | Use `await` instead |
| Missing `await` | Task runs but result is ignored | Always `await` or explicitly handle the `Task` |
| `async` without `await` | Runs synchronously, compiler warning | Remove `async` or add actual async operation |
| Exception swallowing | Unawaited tasks lose their exceptions | `await` everything or use `Task.WhenAll` |

```csharp
// ❌ DEADLOCK in ASP.NET
public string GetData()
{
    var result = GetDataAsync().Result; // Blocks thread, waits for sync context
    return result;
}

// ✅ Async all the way
public async Task<string> GetDataAsync()
{
    var result = await _httpClient.GetStringAsync("/api/data");
    return result;
}
```

**`ConfigureAwait(false)` — library code:**
```csharp
// In library/service code (no UI context needed)
public async Task<Data> FetchDataAsync()
{
    var response = await _httpClient.GetAsync("/api")
        .ConfigureAwait(false); // Don't capture sync context → better performance
    return await response.Content.ReadAsAsync<Data>()
        .ConfigureAwait(false);
}
```

**Senior-Level Answer:** "`async`/`await` is about thread efficiency, not parallelism. When we `await` an I/O operation like a database query, the thread is released back to the thread pool instead of blocking. This means our API can handle thousands of concurrent requests with a small thread pool. I follow 'async all the way' — never mixing `.Result` or `.Wait()` with async because it causes deadlocks in ASP.NET's synchronization context. For independent operations, I use `Task.WhenAll` to run them in parallel."

### Dependency Injection Lifetimes — Deep Dive

> ***Singleton = one for the app. Scoped = one per request. Transient = one per injection.***

| Lifetime | Instance Created | Destroyed | Use Case |
|----------|-----------------|-----------|----------|
| `Singleton` | Once, on first request | App shutdown | Config, caching, HttpClient factories |
| `Scoped` | Once per HTTP request | End of request | DbContext, repositories, unit of work |
| `Transient` | Every time it's injected | When consumer is GC'd | Lightweight, stateless services |

```csharp
// Registration in Program.cs
builder.Services.AddSingleton<ICacheService, RedisCacheService>();  // One for entire app
builder.Services.AddScoped<AppDbContext>();                         // One per HTTP request
builder.Services.AddTransient<IEmailService, EmailService>();       // New every time
```

**Captive dependency problem (critical gotcha):**
```csharp
// ❌ WRONG — Singleton captures Scoped service
// The scoped DbContext lives as long as the singleton → stale data, concurrency bugs
public class CacheService // Registered as Singleton
{
    private readonly AppDbContext _db; // Scoped — CAPTURED, never refreshed!
    public CacheService(AppDbContext db) => _db = db;
}

// ✅ FIX — Inject IServiceScopeFactory, create scope when needed
public class CacheService // Singleton
{
    private readonly IServiceScopeFactory _scopeFactory;
    public CacheService(IServiceScopeFactory factory) => _scopeFactory = factory;

    public async Task RefreshCache()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // Now db is a fresh scoped instance
    }
}
```

**Rule: A service can only depend on services with equal or longer lifetime:**
```
Singleton → can inject: Singleton only
Scoped    → can inject: Singleton, Scoped
Transient → can inject: Singleton, Scoped, Transient
```

**Common Cross Questions:**
- *Why is DbContext Scoped, not Transient?* Scoped ensures all repositories in one request share the same DbContext instance → one transaction, one `SaveChanges()` call.
- *When would Transient cause bugs?* If two classes inject the same Transient service expecting shared state — they'll get different instances.
- *How to validate lifetime issues?* `builder.Services.BuildServiceProvider(validateScopes: true)` in Development throws on captive dependencies.

### Key Differentiations

| vs | Left | Right |
|----|------|-------|
| `var` vs `dynamic` | Compile-time type inference, fixed once assigned | Runtime type resolution, can change types |
| `const` vs `readonly` | Compile-time constant, must initialize at declaration | Runtime constant, can initialize in constructor |
| `out` vs `ref` | Must be assigned inside method, no need to initialize before | Must be initialized before passing |
| `String` vs `StringBuilder` | Immutable (creates new object on each modification) | Mutable (modifies in-place, better for loops) |
| `Dispose()` vs `Finalize()` | Deterministic cleanup, called by developer | Non-deterministic, called by GC |
| `sealed` | Prevents inheritance / method override | — |
| `partial` | Splits class definition across files | — |
| Extension methods | Static methods on static class with `this` first param | Adds methods to types without modifying them |
| `using` statement | Calls `Dispose()` automatically when block exits | Even on exceptions |

---

## Tradeoffs & Pitfalls

- **Abstract class vs Interface:** Use abstract when classes are *related* and share state. Use interface for *capability contracts* across unrelated types.
- **Over-applying SOLID:** Don't create 50 interfaces for a simple CRUD app. SOLID scales with complexity.
- **God classes:** Violate SRP. Split when a class has >1 reason to change.
- **Fat interfaces:** Violate ISP. Mock pain in tests is a smell.
- **`new` keyword hiding:** Breaks polymorphism silently. Prefer `override`.
- **Singleton abuse:** Makes testing hard, hides dependencies. Prefer DI-managed singletons.

---

## Interview Questions — Rapid Fire

| # | Question | Answer |
|---|----------|--------|
| 1 | **4 pillars of OOP?** | Encapsulation, Abstraction, Inheritance, Polymorphism |
| 2 | **Abstract class vs Interface?** | Abstract = shared impl for **related** types. Interface = contract for **unrelated** types + multiple inheritance |
| 3 | **Multiple abstract classes?** | No. **One** abstract class, but **multiple** interfaces |
| 4 | **SOLID in one line each?** | S=one reason to change, O=extend don't modify, L=subtypes substitutable, I=small interfaces, D=depend on abstractions |
| 5 | **What is a delegate?** | Type-safe function pointer. Enables passing methods as parameters |
| 6 | **`var` vs `dynamic`?** | `var` = compile-time (fixed). `dynamic` = runtime (flexible, no IntelliSense) |
| 7 | **Extension method?** | Static method in static class with `this` on first param. **Adds methods** to existing types |
| 8 | **Sealed class?** | Cannot be inherited. Prevents unintended derivation |
| 9 | **Partial class?** | Definition split across **multiple files**. Compiled as one class |
| 10 | **`using` statement?** | Ensures `Dispose()` called even if exception thrown. Try/finally sugar |
| 11 | **`virtual` vs `override` vs `new`?** | `virtual` = can override. `override` = runtime polymorphism. `new` = compile-time hiding (avoid) |
| 12 | **`protected` vs `internal`?** | `protected` = derived classes. `internal` = same assembly. `protected internal` = either |
| 13 | **Why use generics?** | Type safety at compile time + no boxing overhead + code reuse |
| 14 | **Abstract class vs Interface?** | Abstract = shared state/impl for related types. Interface = contract for unrelated types |
| 15 | **`async void` — why avoid?** | Exceptions can't be caught by caller. Always use `Task` return type |
| 16 | **Singleton vs Scoped vs Transient?** | Singleton = app lifetime. Scoped = per request. Transient = per injection |
| 17 | **Captive dependency?** | Singleton holding Scoped service → stale data. Fix: inject `IServiceScopeFactory` |

---

## Quick Reference

```
OOP:      Encapsulation | Abstraction | Inheritance | Polymorphism
SOLID:    SRP | OCP | LSP | ISP | DIP
CLASSES:  abstract (can't instantiate, can have impl) | sealed (can't inherit) | partial (split files) | static (no instances)
METHODS:  virtual (overridable) | override (replaces) | new (hides) | abstract (must implement)
TYPES:    var (compile-time) | dynamic (runtime) | const (compile constant) | readonly (runtime constant)
ACCESS:   public | private | protected (derived) | internal (assembly) | protected internal (either) | private protected (both)
GENERICS: List<T> | Dictionary<TK,TV> | IRepository<T> | Constraints: class, struct, new(), IInterface
ASYNC:    async Task<T> | await | Task.WhenAll | ConfigureAwait(false) | Never .Result/.Wait()
DI:       Singleton (app) | Scoped (request) | Transient (injection) | Captive dependency = bug
DI:       Singleton (app) | Scoped (request) | Transient (each resolve)
DELEGATES: Single | Multicast (+=) | Events (encapsulated delegates) | Lambda (inline)
PATTERNS: Strategy (OCP) | Factory (object creation) | Repository (data abstraction)
```
