# Design Patterns — Interview Preparation

---

## Core Concepts

### Pattern Categories

| Category | Focus | Patterns |
|----------|-------|----------|
| **Creational** | Object creation | Singleton, Factory, Abstract Factory, Builder, Prototype |
| **Structural** | Object composition | Adapter, Facade, Decorator, Proxy, Bridge, Composite |
| **Behavioral** | Object interaction | Strategy, Observer, Chain of Responsibility, Command, Template Method |

---

## Deep Dive — Key Patterns

### 1. Singleton (Creational)
**Intent:** Ensure a class has only one instance with a global access point.

```csharp
public sealed class Logger
{
    private static Logger _instance;
    private static readonly object _lock = new object();

    private Logger() { }

    public static Logger Instance
    {
        get
        {
            if (_instance == null)                 // First check (no lock)
            {
                lock (_lock)                       // Thread safety
                {
                    if (_instance == null)          // Second check (inside lock)
                        _instance = new Logger();
                }
            }
            return _instance;
        }
    }
}
```

**Why `sealed`?** Prevents nested class from inheriting and creating another instance.
**Double-checked locking:** First `null` check avoids lock overhead after initialization.
**Use case:** Logging, configuration, connection pools, load balancers.

---

### 2. Factory / Abstract Factory (Creational)
**Intent:** Create objects without exposing creation logic. Let subclasses decide which class to instantiate.

```csharp
// Abstract Factory
public interface IMobilePhone
{
    ISmartPhone CreateSmartPhone();
    INormalPhone CreateNormalPhone();
}

public class Nokia : IMobilePhone
{
    public ISmartPhone CreateSmartPhone() => new NokiaLumia();
    public INormalPhone CreateNormalPhone() => new Nokia1000();
}

public class Samsung : IMobilePhone
{
    public ISmartPhone CreateSmartPhone() => new SamsungGalaxy();
    public INormalPhone CreateNormalPhone() => new SamsungGuru();
}

// Usage — client doesn't know concrete types
IMobilePhone factory = new Nokia();
ISmartPhone phone = factory.CreateSmartPhone();
```

**Solves:** Scattered `new` keywords, client coupling to concrete classes.
**Use case:** Cross-platform UI, database providers, payment processors.

---

### 3. Strategy (Behavioral)
**Intent:** Define a family of algorithms, encapsulate each one, make them interchangeable.

```csharp
// This is the OCP example from SOLID
public interface ICopyOperationStrategy
{
    Task CopyVersion(JObject payload);
}

public class AmendContract : ICopyOperationStrategy { /* amend logic */ }
public class CopyContract : ICopyOperationStrategy  { /* copy logic */ }
public class ModifyContract : ICopyOperationStrategy { /* modify logic */ }

// Factory resolves the right strategy at runtime
ICopyOperationStrategy strategy = factory.Create(operationType);
await strategy.CopyVersion(payload);
```

**Eliminates:** Long `if/else` or `switch` chains.
**Use case:** Payment methods, validation rules, sorting algorithms, contract operations.

---

### 4. Observer (Behavioral)
**Intent:** One-to-many dependency. When subject changes state, all observers are notified automatically.

```csharp
// Subject
public class NewsPublisher
{
    private List<ISubscriber> _subscribers = new();
    public void Subscribe(ISubscriber s) => _subscribers.Add(s);
    public void Unsubscribe(ISubscriber s) => _subscribers.Remove(s);
    public void Publish(string news)
    {
        foreach (var s in _subscribers) s.Notify(news);
    }
}

// Observers
public interface ISubscriber { void Notify(string message); }
public class EmailSubscriber : ISubscriber
{
    public void Notify(string message) => Console.WriteLine($"Email: {message}");
}
```

**Use case:** Event systems, UI updates, pub/sub messaging, real-time notifications.

---

### 5. Chain of Responsibility (Behavioral)
**Intent:** Pass request along a chain of handlers. Each handler decides to process or pass to the next.

```csharp
public abstract class LeaveHandler
{
    protected LeaveHandler _next;
    public void SetNext(LeaveHandler next) => _next = next;
    public abstract void Handle(LeaveRequest request);
}

public class TeamLead : LeaveHandler
{
    public override void Handle(LeaveRequest req)
    {
        if (req.Days <= 2) Console.WriteLine("Approved by Team Lead");
        else _next?.Handle(req);
    }
}

public class Manager : LeaveHandler { /* approves <= 5 days */ }
public class Director : LeaveHandler { /* approves > 5 days */ }

// Wire the chain
teamLead.SetNext(manager);
manager.SetNext(director);
teamLead.Handle(new LeaveRequest { Days = 5 });
```

**Use case:** Approval workflows, middleware pipelines, request validation.

---

### 6. Facade (Structural)
**Intent:** Provide a simplified interface to a complex subsystem.

```csharp
public class OrderFacade
{
    private InventoryService _inventory = new();
    private PaymentService _payment = new();
    private ShippingService _shipping = new();

    public void PlaceOrder(Order order)
    {
        _inventory.Reserve(order);
        _payment.Charge(order);
        _shipping.Ship(order);
    }
}
// Client calls one method instead of coordinating 3 subsystems
```

**Use case:** API aggregation, complex library wrappers, service orchestration.

---

### 7. Repository + Unit of Work (Structural/Enterprise)
**Intent:** Abstract data access. Ensure multiple repositories share one DB context per transaction.

```csharp
// Generic Repository
public interface IRepository<T>
{
    Task<T> GetById(int id);
    Task Add(T entity);
    Task Delete(T entity);
}

// Unit of Work — shared context
public interface IUnitOfWork : IDisposable
{
    IRepository<Order> Orders { get; }
    IRepository<Product> Products { get; }
    Task<int> SaveChanges();
}
```

**Why generic repository?** Reduces redundant CRUD code across entity types. UoW ensures atomic transactions.

---

## Microservice Patterns

### CQRS (Command Query Responsibility Segregation)
- Separates read and write models.
- Write model: RDBMS (normalized, consistent).
- Read model: NoSQL/denormalized (fast queries).
- **Sync via:** Event-driven architecture (Kafka pub/sub).

### Saga Pattern
- Maintains data consistency across microservices without distributed transactions.
- Each step has a **compensating transaction** to rollback on failure.
- **Orchestrator Saga:** Central coordinator (e.g., Azure Durable Function) manages the sequence.

### API Gateway
- Single entry point for all clients.
- Handles: load balancing, auth, rate limiting, protocol translation.
- Clients → Gateway → Microservices.

---

## Tradeoffs & Pitfalls

| Pattern | Pitfall |
|---------|---------|
| Singleton | Hides dependencies, makes testing hard. Prefer DI-managed singletons. |
| Factory | Factory switch statement violates OCP. Consider dictionary-based registry. |
| Observer | Memory leaks if observers not unsubscribed. |
| Strategy | Overkill for simple 2-option logic. |
| Repository | Generic repository can become a leaky abstraction over EF. |
| CQRS | Eventual consistency is complex. Don't use for simple CRUD apps. |
| Saga | Compensating transactions are hard to get right. Debug complexity increases. |

---

## Interview Questions — Rapid Fire

1. **What is Singleton?** One instance per app. Use `sealed` class + double-checked locking + private constructor.
2. **Factory vs Abstract Factory?** Factory creates one type. Abstract Factory creates families of related objects.
3. **When to use Strategy?** When you have multiple algorithms/behaviors selectable at runtime. Replaces if/else chains.
4. **What is CQRS?** Separate read/write models. Read = optimized queries. Write = business rules + validation.
5. **What is Saga?** Cross-service transaction pattern. Each step has compensating action for rollback.
6. **What is Repository pattern?** Abstracts data access behind interface. Enables swapping DB implementations.
7. **Observer vs Pub/Sub?** Observer = direct subscription. Pub/Sub = decoupled via message broker.
8. **What is Facade?** Simplified interface to complex subsystem. One method orchestrates multiple services.
9. **Chain of Responsibility use case?** Middleware pipelines, approval workflows, request validation chains.
10. **DI types?** Constructor (most common), Property, Method injection.

---

## Quick Reference

```
CREATIONAL:   Singleton (one instance) | Factory (create without knowing type) | Builder (step-by-step)
STRUCTURAL:   Facade (simplify) | Adapter (convert interface) | Decorator (wrap + extend) | Repository (abstract data)
BEHAVIORAL:   Strategy (swap algorithms) | Observer (notify many) | Chain (pass along) | Command (encapsulate action)
MICRO:        CQRS (read/write split) | Saga (distributed rollback) | API Gateway (single entry)
DI:           Constructor | Property | Method
DI LIFETIME:  Singleton | Scoped | Transient
```
