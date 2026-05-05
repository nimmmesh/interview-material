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
- Cannot be instantiated. All members must be `static`.
- Is implicitly `sealed`. No instance constructors.
- Use for stateless utility methods (e.g., `TemperatureConverter.CelsiusToFahrenheit()`).
- **Singleton ≠ Static class:** Singleton allows one instance with state; static class has no instances.

### `virtual` / `override` / `new`
- `virtual` → base class declares method can be overridden
- `override` → derived class replaces base implementation (runtime polymorphism)
- `new` → derived class *hides* base method (compile-time, NOT polymorphism)

```csharp
A obj = new B();
obj.Show(); // override → calls B.Show() | new → calls A.Show()
```

---

## Deep Dive

### SOLID Principles

#### S — Single Responsibility Principle (SRP)
> A class should have one, and only one, reason to change.

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
> Open for extension, closed for modification.

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
> Subtypes must be substitutable for their base types without breaking behavior.

**Violation:** `Enquiry : Customer` throws `NotImplementedException` on `Add()`.
**Fix:** Split into `IDiscount` and `IDatabase` interfaces. `Enquiry` implements only `IDiscount`.

**Behavioral contract rules:**
- Preconditions cannot be strengthened
- Postconditions cannot be weakened
- Invariants must be preserved
- No `NotImplementedException` in inherited methods

#### I — Interface Segregation Principle (ISP)
> No client should be forced to depend on methods it doesn't use.

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
> High-level modules should not depend on low-level modules. Both should depend on abstractions.

**DIP ≠ DI:** DIP is a design principle (depend on abstractions). DI is a technique (inject at runtime).

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

### Generics
Type-safe, reusable code without boxing/unboxing overhead:
```csharp
public static bool AreEqual<T>(T val1, T val2) => val1.Equals(val2);
```

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

1. **What are the 4 pillars of OOP?** Encapsulation, Abstraction, Inheritance, Polymorphism.
2. **Abstract class vs Interface — when to use each?** Abstract = shared implementation for related types. Interface = contract for unrelated types + multiple inheritance.
3. **Can a class inherit multiple abstract classes?** No. Only one abstract class, but multiple interfaces.
4. **Explain SOLID in one line each.** S=one reason to change, O=extend don't modify, L=subtypes are substitutable, I=small focused interfaces, D=depend on abstractions.
5. **What is a delegate?** Type-safe function pointer. Enables passing methods as parameters.
6. **`var` vs `dynamic`?** `var` = compile-time inference (fixed). `dynamic` = runtime resolution (flexible, no IntelliSense).
7. **What is an extension method?** Static method in static class with `this` modifier on first param. Adds methods to existing types.
8. **What is a sealed class?** Cannot be inherited. Used for security, preventing unintended derivation.
9. **What is a partial class?** Class definition split across multiple files. Compiled as one class.
10. **What is the `using` statement?** Ensures `Dispose()` is called even if exception thrown. Syntactic sugar for try/finally.

---

## Quick Reference

```
OOP:      Encapsulation | Abstraction | Inheritance | Polymorphism
SOLID:    SRP | OCP | LSP | ISP | DIP
CLASSES:  abstract (can't instantiate, can have impl) | sealed (can't inherit) | partial (split files) | static (no instances)
METHODS:  virtual (overridable) | override (replaces) | new (hides) | abstract (must implement)
TYPES:    var (compile-time) | dynamic (runtime) | const (compile constant) | readonly (runtime constant)
DI:       Singleton (app) | Scoped (request) | Transient (each resolve)
DELEGATES: Single | Multicast (+=) | Events (encapsulated delegates) | Lambda (inline)
PATTERNS: Strategy (OCP) | Factory (object creation) | Repository (data abstraction)
```
