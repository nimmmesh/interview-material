# SOLID Principles — Detailed Guide with Real-World Code Examples

> **Purpose:** Interview preparation reference. All code examples are from real .NET Core microservices in the CLM (Contract Lifecycle Management) workspace.

---

## Table of Contents

1. [S — Single Responsibility Principle (SRP)](#1-s--single-responsibility-principle-srp)
2. [O — Open/Closed Principle (OCP)](#2-o--openclosed-principle-ocp)
3. [L — Liskov Substitution Principle (LSP)](#3-l--liskov-substitution-principle-lsp)
4. [I — Interface Segregation Principle (ISP)](#4-i--interface-segregation-principle-isp)
5. [D — Dependency Inversion Principle (DIP)](#5-d--dependency-inversion-principle-dip)
6. [How All 5 Principles Work Together](#6-how-all-5-principles-work-together)

---

## 1. S — Single Responsibility Principle (SRP)

### Theory

> **"A class should have one, and only one, reason to change."** — Robert C. Martin

The Single Responsibility Principle states that every class, module, or function should have **exactly one responsibility** — one reason to exist, and therefore one reason to change. If a class handles both database access and business validation, then a change in validation rules *and* a change in the database schema would both require modifying the same class. This coupling increases the risk of bugs, makes testing harder, and reduces reusability.

**Key concepts:**
- **Responsibility** = a reason to change. If you can think of more than one reason a class might need to be modified, it likely has more than one responsibility.
- SRP doesn't mean a class should only have one method. It means all methods in the class should be **cohesive** — they should all relate to the same concern.
- SRP applies at every level: classes, methods, modules, and even projects/assemblies.

**Benefits:**
- **Easier testing:** A class with one responsibility is simpler to unit test in isolation.
- **Reduced coupling:** Changes in one area don't ripple into unrelated areas.
- **Better readability:** Developers can understand what a class does just by reading its name.
- **Parallel development:** Different team members can work on different responsibilities without merge conflicts.

**Common violations:**
- "God classes" that do everything — handle HTTP, validate, map data, call external APIs, and persist results.
- Controllers that contain business logic instead of delegating to services.
- Service classes that grow to handle 20+ methods spanning different concerns.

---

### Code Example — Layered Project Architecture (SRP at Project Level)

In our workspace, every microservice follows a consistent layered architecture where each project (assembly) has exactly one responsibility:

```
Leo.Clm.v2.Lines/
├── Leo.Clm.v2.LinesService/          → API layer (Controllers, Startup, DI config)
│   ├── Controllers/
│   ├── Extensions/
│   └── Startup.cs
├── Leo.Clm.V2.Lines.Bridge/          → Orchestration layer (Bridge/Service logic)
│   ├── Interface/
│   ├── Implementation/
│   ├── Strategies/
│   └── Factories/
├── Leo.Clm.v2.Lines.Core/            → Contracts layer (Interfaces, Models, Constants)
│   ├── Interface/
│   ├── Entity/
│   └── Enum/
└── Leo.Clm.v2.Lines.Data/            → Data Access layer (Repository implementations)
    ├── Lines/
    ├── LinePrice/
    └── ClmDetails/
```

| Project | Responsibility | Reason to Change |
|---------|---------------|------------------|
| **Service** | HTTP handling, routing, auth, DI registration | API contract changes, framework upgrades |
| **Bridge** | Business orchestration, external API calls, mapping | Business workflow changes |
| **Core** | Interface definitions, models, constants, enums | Contract/schema changes |
| **Data** | Database access, query building | Storage technology or schema changes |

This means a database migration only touches the `Data` project, a new business rule only touches `Bridge`, and an API versioning change only touches `Service`.

---

### Code Example — Thin Controller (SRP at Class Level)

**File:** `Leo.Clm.v2.Lines/Leo.Clm.v2.LinesService/Controllers/LineItemController.cs`

```csharp
[Authorize]
[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/LineItem")]
[ApiController]
public class LineItemController : ControllerBase
{
    private readonly ILineItemBridgeRepository _linesBridgeRepository;
    private readonly IDacService _dacService;

    public LineItemController(ILineItemBridgeRepository linesBridgeRepository, IDacService dacService)
    {
        _linesBridgeRepository = linesBridgeRepository;
        _dacService = dacService;
    }

    [HttpGet("GetLinesByDocumentCode")]
    public async Task<IActionResult> GetAllLinesByDocumentCode(string documentCode, bool IsCatalogEligibleLines = false)
    {
        var dacoutput = await _dacService.ClmDacValidatorAsync(documentCode, "view");
        if (dacoutput.IsDACSuccess)
        {
            return new JsonResult(await _linesBridgeRepository.GetAllLinesByDocumentCode(documentCode, IsCatalogEligibleLines));
        }
        else
        {
            return Unauthorized(JObject.Parse("{\"code\":\"401\",\"status\":\"Unauthorized Request\"}"));
        }
    }

    [HttpPost("DeleteLineDetails")]
    public async Task<IActionResult> DeleteLineDetails(List<JObject> lineDetailsList)
    {
        var dacoutput = await _dacService.ClmDacValidatorAsync(string.Empty, "saveall");
        if (dacoutput.IsDACSuccess)
            return new JsonResult(await _linesBridgeRepository.DeleteLineDetails(lineDetailsList));
        else
            return Unauthorized(JObject.Parse("{\"code\":\"401\",\"status\":\"Unauthorized Request\"}"));
    }
}
```

**Why this follows SRP:**
- The controller's **only responsibility** is HTTP request handling: receive the request, authorize via DAC, delegate to the bridge, and return the HTTP response.
- It does **not** contain any business logic, data transformation, or database calls.
- If the authorization mechanism changes, only the DAC service changes. If the business logic for line items changes, only the bridge repository changes. The controller itself only changes if the API surface (routes, parameters, response format) changes.

---

### Code Example — Separated DI Registration (SRP at Method Level)

**File:** `Leo.Clm.v2.Lines/Leo.Clm.v2.LinesService/Extensions/ServiceCollectionExtensionMethods.cs`

```csharp
public static class ServiceCollectionExtensionMethods
{
    // Each method has ONE responsibility: registering one category of services

    public static void AddBaseServices(this IServiceCollection services)
    {
        services.AddMvc().AddNewtonsoftJson(options => { /* serialization config */ });
        services.AddHsts(options => { /* security headers */ });
        services.ConfigureForwardedHeaders();
        services.AddCompression();
        services.AddVersioning();
        services.AddHttpContextAccessor();
        services.AddHealthChecks();
    }

    public static void AddBridgeServices(this IServiceCollection services)
    {
        services.TryAddScoped<ILineItemBridgeRepository, LineItemBridgeRepository>();
        services.TryAddScoped<ICommonService, CommonService>();
        services.TryAddScoped<ILinePriceBridgeRepository, LinePriceBridgeRepository>();
        services.TryAddScoped<IAmendContract, AmendContract>();
        services.TryAddScoped<ICopyContract, CopyContract>();
        services.TryAddScoped<IModifyContract, ModifyContract>();
        // ... more bridge registrations
    }

    public static void AddDataServices(this IServiceCollection services)
    {
        services.TryAddScoped<IBaseRepository, BaseRepository>();
        services.TryAddScoped<IReviewRequestRepository, ReviewRequestRepository>();
        services.TryAddScoped<ICommonEntityRepository, CommonEntityRepository>();
    }

    public static void AddLeoDataServices(this IServiceCollection services)
    {
        services.TryAddScoped<ILineItemRepository, LineItemRepository>();
        services.TryAddScoped<IContractOperationFactory, ContractOperationFactory>();
        services.TryAddScoped<ITieredPricingRepository, TieredPricingRepository>();
    }
}
```

**Why this follows SRP:**
- Instead of having one giant `ConfigureServices` method in `Startup.cs`, the DI registrations are broken into focused extension methods.
- `AddBridgeServices` only registers orchestration layer dependencies. `AddDataServices` only registers data layer dependencies. Each method has one reason to change.

---

## 2. O — Open/Closed Principle (OCP)

### Theory

> **"Software entities (classes, modules, functions) should be open for extension, but closed for modification."** — Bertrand Meyer

The Open/Closed Principle states that you should be able to **add new behavior** to a system **without changing existing, tested code**. When you modify an existing class to add a new feature, you risk breaking all the existing functionality that depends on that class. Instead, you should design classes so that new behavior can be added by creating new classes that extend or implement existing abstractions.

**Key concepts:**
- **Open for extension:** You can add new behavior (new classes, new implementations).
- **Closed for modification:** You don't need to change existing source code to support new features.
- This is typically achieved through **abstraction**: interfaces, abstract classes, and design patterns like Strategy, Template Method, and Factory.

**Design patterns that enable OCP:**
- **Strategy Pattern:** Define a family of algorithms behind an interface. New algorithms = new classes, no changes to existing code.
- **Factory Pattern:** A factory decides which implementation to create. New implementations can be added (though the factory dispatch may need updating).
- **Template Method:** Base class defines the skeleton; subclasses fill in the steps.
- **Decorator Pattern:** Wrap an existing implementation with additional behavior without modifying the original.

**Benefits:**
- Existing tested code remains untouched, reducing regression risk.
- New features are isolated in new classes, making them easy to test independently.
- The system becomes more modular and composable.

**Common violations:**
- Long `if/else` or `switch` chains that grow every time a new type is added.
- Modifying an existing service class to add a new business operation.

---

### Code Example — Strategy Pattern for Contract Operations

This is the best OCP example in our workspace. When a contract is copied, amended, or modified, the system needs different copy behavior. Instead of a large `if/else` block, each operation is its own class implementing a common interface.

#### Step 1: Define the Abstraction

**File:** `Leo.Clm.v2.Lines/Leo.Clm.V2.Lines.Bridge/Interface/ICopyOperationStrategy.cs`

```csharp
namespace Leo.Clm.V2.Lines.Bridge.Interface
{
    using Newtonsoft.Json.Linq;
    using System.Threading.Tasks;

    /// <summary>
    /// Strategy interface for contract copy operations
    /// </summary>
    public interface ICopyOperationStrategy
    {
        Task CopyVersion(JObject payload);
    }
}
```

#### Step 2: Define Specific Interfaces (Marker Interfaces for DI Resolution)

```csharp
// IAmendContract.cs
public interface IAmendContract : ICopyOperationStrategy { }

// ICopyContract.cs
public interface ICopyContract : ICopyOperationStrategy { }

// IModifyContract.cs
public interface IModifyContract : ICopyOperationStrategy { }
```

Each marker interface extends `ICopyOperationStrategy`, enabling both polymorphism (all can be used as `ICopyOperationStrategy`) and specific DI registration (each can be resolved individually).

#### Step 3: Implement Each Strategy

**File:** `Leo.Clm.v2.Lines/Leo.Clm.V2.Lines.Bridge/Strategies/AmendContract.cs`

```csharp
public class AmendContract : LeoBaseBridge, IAmendContract
{
    private readonly ILineVersionDetailBridgeRepository _lineVersionDetailBridgeRepository;
    private readonly ICommonService _commonService;

    public AmendContract(IBaseRepository baseRepository, IConfigurationService configurationService,
        ILeoHttpClient leoHttpClient, ILeoLogger leoLogger, IHttpContextAccessor httpContextAccessor,
        LogContext logContext, UserExecutionContext userExecutionContext,
        ILineVersionDetailBridgeRepository lineVersionDetailBridgeRepository,
        ICommonService commonService)
        : base(baseRepository, configurationService, leoHttpClient, leoLogger,
               httpContextAccessor, logContext, userExecutionContext)
    {
        _lineVersionDetailBridgeRepository = lineVersionDetailBridgeRepository;
        _commonService = commonService;
    }

    public async Task CopyVersion(JObject payload)
    {
        // Amend-specific logic:
        // 1. Get the active version from the old document
        // 2. Create a new version with "Copied" status
        // 3. Invoke copy with eventName = "amend"

        var oldDocumentCode = payload["oldDocumentCode"].ToString();
        var newDocumentCode = payload["newDocumentCode"].ToString();

        var oldVersionDetail = await _lineVersionDetailBridgeRepository.GetActiveLineVersionDetail(oldDocumentCode);
        var activeLineVersionDetail = oldVersionDetail.Data.FirstOrDefault(x => x.Value<bool>("isActive") == true) as JObject;
        var createVersion = await _commonService.CreateNewVersion(newDocumentCode, LineVersionStatus.Copied, skipIsActiveAssignment: true);

        // Build copy payload and invoke
        var transitJson = new JObject { ["eventName"] = "amend" };
        await _commonService.InvokeLinesCopy(invokeCopyLinesPayload, newDocumentCode, transitJson);
    }
}
```

**File:** `Leo.Clm.v2.Lines/Leo.Clm.V2.Lines.Bridge/Strategies/CopyContract.cs`

```csharp
public class CopyContract : LeoBaseBridge, ICopyContract
{
    private readonly ILineVersionDetailBridgeRepository _lineVersionDetailBridgeRepository;
    private readonly ICommonService _commonService;

    public CopyContract(/* similar constructor */) : base(/* ... */)
    {
        _lineVersionDetailBridgeRepository = lineVersionDetailBridgeRepository;
        _commonService = commonService;
    }

    public async Task CopyVersion(JObject payload)
    {
        // Copy-specific logic:
        // 1. Get active version from old document
        // 2. Create new version
        // 3. Invoke copy with eventName = "copy"

        var createVersion = await _commonService.CreateNewVersion(newDocumentCode, LineVersionStatus.Copied, skipIsActiveAssignment: true);

        JObject transitJson = new JObject
        {
            ["eventName"] = "copy",
            ["serverSideGridConfig"] = serverSideGridConfig
        };
        await _commonService.InvokeLinesCopy(invokeCopyLinesPayload, newDocumentCode, transitJson);
    }
}
```

**File:** `Leo.Clm.v2.Lines/Leo.Clm.V2.Lines.Bridge/Strategies/ModifyContract.cs`

```csharp
public class ModifyContract : LeoBaseBridge, IModifyContract
{
    private readonly ILineVersionDetailBridgeRepository _lineVersionDetailBridgeRepository;
    private readonly ICommonService _commonService;
    private readonly ILinesVersionsViewLogBridgeRepository _linesVersionsViewLogBridgeRepository;

    public async Task CopyVersion(JObject payload)
    {
        // Modify-specific logic (most complex):
        // 1. Get ALL versions (not just active) from old document
        // 2. Loop through each version chronologically
        // 3. Create corresponding versions in new document
        // 4. Copy view logs
        // 5. Invoke copy with eventName = "modify"

        var alterOlderVersionDetail = new JArray(oldVersionDetail.Data.OrderBy(obj => (DateTime)obj["createdOn"]));

        foreach (var versionItem in alterOlderVersionDetail)
        {
            // Create version-by-version copy
            var createVersion = await _lineVersionDetailBridgeRepository.CreateLineVersionDetail(versionItemObject, skipPayloadDefaulting);
            invokeCopyLinesPayloadJarray.Add(invokeCopyLinesPayload);
        }

        JObject transitJson = new JObject
        {
            ["eventName"] = "modify",
            ["serverSideGridConfig"] = serverSideGridConfig
        };
        await _commonService.InvokeLinesCopy(invokeCopyLinesPayloadJarray, newDocumentCode, transitJson);
    }
}
```

#### Step 4: Factory to Resolve the Right Strategy

**File:** `Leo.Clm.v2.Lines/Leo.Clm.V2.Lines.Bridge/Factories/ContractOperationFactory.cs`

```csharp
public class ContractOperationFactory : IContractOperationFactory
{
    private readonly IServiceProvider _serviceProvider;

    public ContractOperationFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public ICopyOperationStrategy Create(string contractOperation)
    {
        return contractOperation switch
        {
            "amend"            => (ICopyOperationStrategy)_serviceProvider.GetService(typeof(IAmendContract)),
            "clone"            => (ICopyOperationStrategy)_serviceProvider.GetService(typeof(ICopyContract)),
            "modifywithnewcopy" => (ICopyOperationStrategy)_serviceProvider.GetService(typeof(IModifyContract)),
            _ => throw new NotImplementedException()
        };
    }
}
```

**How OCP is applied:**
- To add a new contract operation (e.g., "renew"), you would:
  1. Create `IRenewContract : ICopyOperationStrategy`
  2. Create `RenewContract : LeoBaseBridge, IRenewContract`
  3. Register it in DI: `services.TryAddScoped<IRenewContract, RenewContract>()`
  4. Add one line to the factory switch
- The existing `AmendContract`, `CopyContract`, and `ModifyContract` classes are **never modified**. They are **closed for modification**.
- The system is **open for extension** — new strategies can be plugged in.

**Note on the factory switch:** The factory's switch statement is the one place that does need a small modification. A fully OCP-compliant approach would use a dictionary-based registry populated from DI, but the current approach is a pragmatic trade-off.

---

### Code Example — Workflow Factory in Obligations

The same pattern appears in the Obligations microservice with even more strategies:

**File:** `Leo.Clm.v2.Obligations/Leo.Clm.V2.Obligations.Bridge/Implementations/WorkflowFactory.cs`

```csharp
public class WorkflowFactory : IWorkflowFactory
{
    private readonly IServiceProvider _serviceProvider;

    public WorkflowFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public IWorkFlowManager GetWorkFlowManager(string eventName)
    {
        return eventName switch
        {
            ObligationWorkflowEventNames.MarkAsActive       => _serviceProvider.GetRequiredService<IMarkAsActiveWorkflowManager>(),
            ObligationWorkflowEventNames.MarkAsComplete      => _serviceProvider.GetRequiredService<IMarkAsCompleteWorkflowManager>(),
            ObligationWorkflowEventNames.NotRelevant          => _serviceProvider.GetRequiredService<IMarkAsNotRelevantWorkflowManager>(),
            ObligationWorkflowEventNames.MarkAsInActive       => _serviceProvider.GetRequiredService<IMarkAsInActiveWorkflowManager>(),
            ObligationWorkflowEventNames.ApprovalPending      => _serviceProvider.GetRequiredService<IMarkAsApprovalPendingManager>(),
            ObligationWorkflowEventNames.Approve              => _serviceProvider.GetRequiredService<ApproveWorkflowManager>(),
            ObligationWorkflowEventNames.Reject               => _serviceProvider.GetRequiredService<RejectWorkflowManager>(),
            ObligationWorkflowEventNames.SendBackToDraft      => _serviceProvider.GetRequiredService<ISendBackToDraftWorkflowManager>(),
            ObligationWorkflowEventNames.ActivitySendBackToDraft => _serviceProvider.GetRequiredService<IActivitySendBackToDraftWorkflowManager>(),
            ObligationWorkflowEventNames.AssignActvity        => _serviceProvider.GetRequiredService<IAssignActivityWorkflowManager>(),
            ObligationWorkflowEventNames.ActivityNotRelevant  => _serviceProvider.GetRequiredService<IActivityNotRelevantWorkflowManager>(),
            ObligationWorkflowEventNames.ActivityApprovalPending => _serviceProvider.GetRequiredService<IActivityApprovalPendingWorkflowManager>(),
            ObligationWorkflowEventNames.ActivtyInProgress    => _serviceProvider.GetRequiredService<IActivityInProgressWorkflowManager>(),
            ObligationWorkflowEventNames.ActivityMarkAsComplete => _serviceProvider.GetRequiredService<IActivityMarkAsCompleteWorkflowManager>(),
            ObligationWorkflowEventNames.ActivityMarkAsInActive => _serviceProvider.GetRequiredService<IActivityInActiveWorkflowManager>(),
            _ => throw new ArgumentException($"Event is not registered for Event: {eventName}"),
        };
    }
}
```

Here, 15 different workflow behaviors are provided through individual classes, all implementing `IWorkFlowManager`. Each workflow class can be developed, tested, and deployed independently.

---

## 3. L — Liskov Substitution Principle (LSP)

### Theory

> **"Objects of a supertype should be replaceable with objects of a subtype without altering the correctness of the program."** — Barbara Liskov

The Liskov Substitution Principle states that if class `B` is a subtype of class `A`, then you should be able to **replace `A` with `B` without breaking the program**. This means subtypes must honor the **behavioral contract** of their base type — not just the method signatures, but also the semantics: preconditions, postconditions, invariants, and exception behavior.

**Key concepts:**
- **Behavioral subtyping:** A subclass must do everything the base class promises, and optionally more — but never less.
- **Preconditions cannot be strengthened:** If the base method accepts any string, the subclass cannot reject empty strings.
- **Postconditions cannot be weakened:** If the base method guarantees a non-null return, the subclass must also return non-null.
- **Invariants must be preserved:** If the base class guarantees that `Count >= 0`, every subclass must maintain that.
- **History constraint:** Subclasses should not introduce state changes that the base class wouldn't allow.

**Violations to watch for:**
- A subclass that throws `NotImplementedException` for an inherited method.
- A derived class that silently ignores a call instead of performing the expected operation.
- A subclass that changes the return type's semantic meaning.
- Using `if (obj is ConcreteType)` checks — this often indicates LSP is being violated because the caller can't trust the abstraction.

**Benefits:**
- Code that depends on abstractions works correctly with any implementation.
- New implementations can be plugged in without testing every consumer again.
- Enables the Strategy and Factory patterns to work reliably.

---

### Code Example — Interchangeable Contract Operation Strategies

The `ICopyOperationStrategy` interface from the Lines microservice is a textbook LSP example. All three implementations — `AmendContract`, `CopyContract`, and `ModifyContract` — are **fully substitutable**.

```csharp
// The abstraction (contract)
public interface ICopyOperationStrategy
{
    Task CopyVersion(JObject payload);
}

// Three implementations — all honor the same contract
public class AmendContract : LeoBaseBridge, IAmendContract   // implements ICopyOperationStrategy
public class CopyContract  : LeoBaseBridge, ICopyContract    // implements ICopyOperationStrategy
public class ModifyContract : LeoBaseBridge, IModifyContract // implements ICopyOperationStrategy
```

**The consumer doesn't know (or care) which implementation it gets:**

```csharp
// In the factory — returns ICopyOperationStrategy, not a concrete type
public ICopyOperationStrategy Create(string contractOperation)
{
    return contractOperation switch
    {
        "amend"             => (ICopyOperationStrategy)_serviceProvider.GetService(typeof(IAmendContract)),
        "clone"             => (ICopyOperationStrategy)_serviceProvider.GetService(typeof(ICopyContract)),
        "modifywithnewcopy" => (ICopyOperationStrategy)_serviceProvider.GetService(typeof(IModifyContract)),
        _ => throw new NotImplementedException()
    };
}

// The calling code — works with any ICopyOperationStrategy
ICopyOperationStrategy strategy = _contractOperationFactory.Create(operationType);
await strategy.CopyVersion(payload);  // Works regardless of which implementation was returned
```

**Why LSP holds:**
1. All three implementations accept the same `JObject payload` (preconditions are not strengthened).
2. All three perform a complete copy operation (postconditions are not weakened).
3. All three throw on invalid input in the same way via `ValidateParameters` (exception behavior is consistent).
4. Swapping `AmendContract` for `CopyContract` doesn't crash the system — the caller never needs to know which one it's using.

---

### Code Example — Workflow Manager Substitution in Obligations

**File:** `Leo.Clm.v2.Obligations/Leo.Clm.V2.ObligationsService/Controllers/CompositeController.cs`

```csharp
public class CompositeController : Controller
{
    private readonly IWorkflowFactory _workflowFactory;

    public CompositeController(IRuleEngineBridge ruleEngineBridge,
                               IUpdateObligationBridgeRepository updateObligationBridgeRepository,
                               IWorkflowFactory workflowFactory)
    {
        _workflowFactory = workflowFactory;
    }

    [HttpPost("obligation")]
    public async Task<IActionResult> Handleobligation(JObject obligation)
    {
        var eventName = GetEventName();

        // The controller doesn't know which workflow manager it gets.
        // It could be ApproveWorkflowManager, RejectWorkflowManager,
        // MarkAsCompleteWorkflowManager, etc. — all 15 are substitutable.
        var workflowManager = _workflowFactory.GetWorkFlowManager(eventName);

        // LSP in action: PerformTask works identically regardless of which
        // IWorkFlowManager implementation was returned
        await workflowManager.PerformTask(obligation, obligation.Value<string>("obligationId"));

        return new JsonResult(new { Success = true });
    }

    [HttpPost("activity")]
    public async Task<IActionResult> HandleActivity(JObject activity)
    {
        var eventName = GetEventName();

        // Same pattern — the workflow abstraction is fully substitutable
        var workflow = _workflowFactory.GetWorkFlowManager(eventName);
        await workflow.PerformTask(activity, activity.Value<string>("activityId"));

        return new JsonResult(new { Success = true });
    }
}
```

**Why LSP holds here:**
- The `CompositeController` depends on `IWorkFlowManager` (the abstraction), not on any specific workflow manager.
- All 15 workflow manager implementations (`ApproveWorkflowManager`, `RejectWorkflowManager`, `MarkAsCompleteWorkflowManager`, etc.) implement `IWorkFlowManager` and honor the `PerformTask` contract.
- The controller can handle any current or future workflow event without being modified — it trusts that any `IWorkFlowManager` it receives will behave correctly.

---

## 4. I — Interface Segregation Principle (ISP)

### Theory

> **"No client should be forced to depend on methods it does not use."** — Robert C. Martin

The Interface Segregation Principle states that **large, monolithic interfaces should be broken down into smaller, more specific ones**. If an interface has 20 methods but a particular client only uses 3, that client is forced to depend on 17 methods it doesn't need. Any change to those 17 methods could force recompilation or re-testing of the client, even though it doesn't use them.

**Key concepts:**
- **Fat interfaces** = interfaces with too many methods, serving multiple clients with different needs.
- **Role interfaces** = small, focused interfaces that describe a specific role or capability.
- ISP is about the **client's perspective**, not the implementer's. Even if one class implements all methods, different clients should depend on different, narrow interfaces.
- A single class can implement multiple small interfaces — this is preferred over one large interface.

**Benefits:**
- **Reduced coupling:** Clients only depend on what they actually use.
- **Easier mocking in tests:** Mocking an interface with 2 methods is simpler than mocking one with 20.
- **Better documentation:** Small interfaces are self-documenting — their name tells you exactly what they provide.
- **Safer refactoring:** Changing one interface doesn't affect clients of other interfaces.

**Common violations:**
- A "god interface" like `IRepository` with methods for every CRUD operation plus caching, logging, and configuration.
- Interface evolution where new methods keep getting added to an existing interface instead of creating new ones.

---

### Code Example — GOOD ISP: Focused Repository Interfaces in Obligations

The Obligations microservice is the **best ISP example** in the workspace. Instead of one large `IObligationsRepository`, the operations are split into three focused interfaces:

**File:** `Leo.Clm.v2.Obligations/Leo.Clm.V2.Obligations.Core/Interface/ObligationsRepositories/IAddObligationsRepository.cs`

```csharp
namespace Leo.Clm.V2.Obligations.Core.Interface.ObligationsRepositories
{
    using Newtonsoft.Json.Linq;
    using System;
    using System.Threading.Tasks;

    public interface IAddObligationsRepository
    {
        Task<Maybe<JObject>> AddBulkObligationsByModelName(JToken request);
        Task<Maybe<JObject>> AddObligationsByModelName(JToken request);
    }
}
```

**File:** `Leo.Clm.v2.Obligations/Leo.Clm.V2.Obligations.Core/Interface/ObligationsRepositories/IGetObligationsRepository.cs`

```csharp
namespace Leo.Clm.V2.Obligations.Core.Interface.ObligationsRepositories
{
    using Newtonsoft.Json.Linq;
    using System;
    using System.Threading.Tasks;

    public interface IGetObligationsRepository
    {
        Task<Maybe<JToken>> GetObligations(JObject requestObj, int limit, int skip);
        Task<Maybe<JObject>> GetObligationsStructure();
    }
}
```

**File:** `Leo.Clm.v2.Obligations/Leo.Clm.V2.Obligations.Core/Interface/ObligationsRepositories/IDeleteObligationsRepository.cs`

```csharp
namespace Leo.Clm.V2.Obligations.Core.Interface.ObligationsRepositories
{
    using Newtonsoft.Json.Linq;
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;

    public interface IDeleteObligationsRepository
    {
        Task<Maybe<JObject>> DeleteBulkObligations(List<string> _ids);
    }
}
```

**Why this is good ISP:**
- A service that only needs to **read** obligations depends on `IGetObligationsRepository` (2 methods).
- A service that only needs to **add** obligations depends on `IAddObligationsRepository` (2 methods).
- A service that only needs to **delete** depends on `IDeleteObligationsRepository` (1 method).
- No client is forced to depend on methods it doesn't use.
- Each interface can evolve independently.

**The DI registrations confirm this separation:**

```csharp
// From ServiceCollectionExtensionMethods.cs in Obligations
services.TryAddScoped<IAddObligationBridgeRepository, AddObligationBridgeRepository>();
services.TryAddScoped<IGetObligationBridgeRepository, GetObligationBridgeRepository>();
services.TryAddScoped<IDeleteObligationBridgeRepository, DeleteObligationsBridgeRepository>();
services.TryAddScoped<IUpdateObligationBridgeRepository, UpdateObligationBridgeRepository>();
```

---

### Code Example — BAD ISP: Monolithic IBaseRepository in Aggregator

**File:** `Leo.Clm.v2.Aggregator/Leo.Clm.v2.Aggregator.Core/Interface/IBaseRepository.cs`

```csharp
public interface IBaseRepository
{
    // Header-related methods
    Dictionary<string, string> GetLeoHeaders();
    Dictionary<string, string> GetLeoSupplierHeaders();
    Dictionary<string, string> GetAICallbackHeaders();
    Dictionary<string, string> GetClauseExtractionHeaders();
    Dictionary<string, string> GetNexxeHeaders();
    Dictionary<string, string> GetSmartHeaders();
    Dictionary<string, string> GetClickHeaders(string key);
    Dictionary<string, string> GetTierIdHeader();

    // Module identification
    string GetSubTypeId();

    // Platform configuration
    Task<Maybe<Dictionary<string, string>>> GetPlatformConfiguration(string key = "", string type = "CLM.Basic", string appId = "101");
    Task<Maybe<Dictionary<string, string>>> GetPlatformConfiguration_List(List<string> keys, string type = "CLM.Basic", string appId = "101");
    Task<Maybe<Dictionary<string, string>>> GetConfigResponse(JObject requestPaylaod);
    Task<string> GetPlatformConfigurationValue(string key, string type = "CLM.Basic", string appId = "101");
    Task<object> GetPlatformConfigurationsForMultipleObjectType(JObject requestPayload, bool responseAsDictionary = false);
}
```

**Why this violates ISP:**
- This interface mixes **at least 3 different concerns**: HTTP headers, module identification, and platform configuration.
- A class that only needs to call `GetPlatformConfigurationValue` is forced to also depend on `GetLeoHeaders`, `GetSmartHeaders`, etc.
- This makes mocking painful in unit tests — you have to set up 13+ methods even if you only test one.

**How to fix it (ISP-compliant refactoring):**

```csharp
// Split into focused interfaces:
public interface IHeaderProvider
{
    Dictionary<string, string> GetLeoHeaders();
    Dictionary<string, string> GetLeoSupplierHeaders();
    Dictionary<string, string> GetSmartHeaders();
    // ... other header methods
}

public interface IPlatformConfigurationProvider
{
    Task<Maybe<Dictionary<string, string>>> GetPlatformConfiguration(string key, string type, string appId);
    Task<string> GetPlatformConfigurationValue(string key, string type, string appId);
    // ... other config methods
}

public interface IModuleContext
{
    string GetSubTypeId();
}
```

---

### Code Example — BAD ISP: Large ITermsMasterService

**File:** `Leo.CentralData.TermsService.api/Leo.CentralData.TermsMaster.Service/Interface/ITermsMasterService.cs`

```csharp
public interface ITermsMasterService
{
    // CRUD operations
    Task<Result> Delete(string _Id);
    Task<Result> Delete(List<string> _Ids);
    Task<Result> DeleteByCode(string code);
    Task<TermsMasterGetModel> GetAsync(string _Id);
    Task<TermsMasterGetModel> GetByCodeAsync(string code);
    Task<PagedResultSet<TermsMasterGetModel>> GetAll(PageModel pageModel, bool? IsActive, bool getAllCultures = false);
    Task<Result> Save(TermsMasterPostModel TermsMasterPostModel);
    Task<Result> Save(List<TermsMasterPostModel> TermsMasterPostModels);
    Task<Result> Update(TermsMasterPutModel TermsMasterPutModel, string code);
    Task<Result> Update(TermsMasterPutModel TermsMasterPutModel, bool isBasicDetails = false);
    Task<Result> UpdateBasicDetails(TermsMasterPutBasicModel termsMasterPutBasicModel);
    Task<Result> Update(List<TermsMasterPutModel> TermsMasterPutModels);

    // Advanced filtering
    Task<AdvanceFilterResponse<TermsMasterGetModel>> GetAdvancedFiltered(AdvanceFilterCustomAttributeModel advancedFilterModel);

    // Import/Export
    Task<string> ExportDataAsync(AdvanceFilterCustomAttributeModel advancedFilterModel);
    Task<string> ImportData(string fileId);
    Task<List<TermsExportImportGetModel>> ExportImportLogs(PageModel pageModel, string fileId, string fileName);
    Task<FileData> DownloadTemplate();
    Task<DownloadResponse> DownloadFileFromFileId(string fileId);

    // Sync
    Task<Result> SmartToCMDSSyncUp(dynamic eventData, string eventName);

    // Attachments
    Task<SyncModel> SaveAttachments(TermsMasterAttachmentsRequestModel request);
    Task<SyncModel> UpdateAttachments(TermsMasterAttachmentsRequestModel request);
    Task<SyncModel> DeleteAttachments(TermsMasterAttachmentsDeleteModel request);

    // Counts
    Task<long> GetRecordCountAsync();
}
```

**Why this violates ISP:** This single interface has **22+ methods** spanning CRUD, import/export, sync, attachments, and counting. A controller that only needs to read terms is forced to depend on delete, import, and attachment methods. Compare this to the Obligations approach where each operation group gets its own interface.

---

## 5. D — Dependency Inversion Principle (DIP)

### Theory

> **"High-level modules should not depend on low-level modules. Both should depend on abstractions."**
> **"Abstractions should not depend on details. Details should depend on abstractions."** — Robert C. Martin

The Dependency Inversion Principle is about **reversing the traditional dependency direction**. In traditional layered architecture, high-level business logic depends directly on low-level infrastructure (database access, HTTP clients, file I/O). DIP inverts this: both layers depend on abstractions (interfaces), and the concrete implementations are wired together at composition time.

**Key concepts:**
- **High-level modules** = business logic, orchestration, use cases.
- **Low-level modules** = database access, HTTP clients, file system, external APIs.
- **Abstraction** = interfaces or abstract classes defined in the core/domain layer.
- The high-level module **owns** the interface definition. The low-level module **implements** it. This is the "inversion" — the dependency arrow points upward.

**In .NET Core, DIP is implemented through:**
1. **Interface definitions** in Core/Domain projects.
2. **Concrete implementations** in Data/Infrastructure projects.
3. **Dependency Injection (DI) container** wiring abstractions to implementations in `Startup.cs`.

**Benefits:**
- **Testability:** You can substitute real implementations with mocks/stubs for unit testing.
- **Flexibility:** You can swap implementations (e.g., switch from SQL Server to MongoDB) without changing business logic.
- **Decoupling:** High-level code doesn't know or care about infrastructure details.

**DIP vs. Dependency Injection:**
- DIP is a **design principle** — it's about how you structure dependencies.
- DI is a **technique/pattern** — it's about how you supply dependencies at runtime.
- You can use DI without following DIP (e.g., injecting concrete classes). DIP requires depending on abstractions.

---

### Code Example — Full DIP Flow in the Lines Microservice

#### Step 1: Abstractions Defined in Core (Owned by High-Level Module)

```
Leo.Clm.v2.Lines.Core/
└── Interface/
    ├── IBaseRepository.cs
    ├── ILineItemRepository.cs
    ├── IConfigurationService.cs
    └── ...
```

The Core project defines **what** is needed, not **how** it's done. It has no reference to any data access library.

#### Step 2: Implementations in Data/Bridge (Low-Level Modules)

```
Leo.Clm.v2.Lines.Data/
└── Lines/
    ├── LineItemRepository.cs      → implements ILineItemRepository
    └── BaseRepository.cs          → implements IBaseRepository

Leo.Clm.V2.Lines.Bridge/
└── Implementation/
    ├── LineItemBridgeRepository.cs → implements ILineItemBridgeRepository
    └── CommonService.cs           → implements ICommonService
```

The Data project depends on the Core project (for the interface definitions), not the other way around.

#### Step 3: Wiring at Composition Root

**File:** `Leo.Clm.v2.Lines/Leo.Clm.v2.LinesService/Extensions/ServiceCollectionExtensionMethods.cs`

```csharp
public static void AddBridgeServices(this IServiceCollection services)
{
    // Interface → Implementation mappings
    services.TryAddScoped<ILineItemBridgeRepository, LineItemBridgeRepository>();
    services.TryAddScoped<IBlobProxyBridgeRepository, BlobProxyBridgeRepository>();
    services.TryAddScoped<ICommonService, CommonService>();
    services.TryAddScoped<IExportLineItemBridgeRepository, ExportLineItemBridgeRepository>();
    services.TryAddScoped<IImportLineItemsBridgeRepository, ImportLineItemsBridgeRepository>();
    services.TryAddScoped<ILinePriceBridgeRepository, LinePriceBridgeRepository>();
    services.TryAddScoped<ILineVersionDetailBridgeRepository, LineVersionDetailBridgeRepository>();
    services.TryAddScoped<IReviewRequestBridgeRepository, ReviewRequestBridgeRepository>();

    // Strategy registrations
    services.TryAddScoped<IAmendContract, AmendContract>();
    services.TryAddScoped<ICopyContract, CopyContract>();
    services.TryAddScoped<IModifyContract, ModifyContract>();
}

public static void AddDataServices(this IServiceCollection services)
{
    services.TryAddScoped<IBaseRepository, BaseRepository>();
    services.TryAddScoped<IReviewRequestRepository, ReviewRequestRepository>();
    services.TryAddScoped<ICommonEntityRepository, CommonEntityRepository>();
}

public static void AddLeoDataServices(this IServiceCollection services)
{
    services.TryAddScoped<ILineItemRepository, LineItemRepository>();
    services.TryAddScoped<IContractOperationFactory, ContractOperationFactory>();
    services.TryAddScoped<ITieredPricingRepository, TieredPricingRepository>();
}
```

#### Step 4: Controller Consuming Only Abstractions

```csharp
public class LineItemController : ControllerBase
{
    // Both dependencies are INTERFACES, not concrete classes
    private readonly ILineItemBridgeRepository _linesBridgeRepository;
    private readonly IDacService _dacService;

    // The DI container injects the concrete implementations at runtime
    public LineItemController(ILineItemBridgeRepository linesBridgeRepository, IDacService dacService)
    {
        _linesBridgeRepository = linesBridgeRepository;
        _dacService = dacService;
    }
}
```

**The dependency flow:**

```
┌─────────────────────────────────────────────────────────┐
│  Controller (High-Level)                                │
│  Depends on: ILineItemBridgeRepository, IDacService     │
│  Does NOT know about: LineItemBridgeRepository,         │
│                        database, HTTP clients            │
└───────────────────┬─────────────────────────────────────┘
                    │ depends on (interfaces)
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Core (Abstractions)                                    │
│  ILineItemBridgeRepository, IDacService, IBaseRepository│
│  No implementation details, no dependencies             │
└───────────────────▲─────────────────────────────────────┘
                    │ implements (interfaces)
┌───────────────────┴─────────────────────────────────────┐
│  Bridge / Data (Low-Level)                              │
│  LineItemBridgeRepository, BaseRepository               │
│  Knows about databases, HTTP clients, external APIs     │
└─────────────────────────────────────────────────────────┘
```

**Both the high-level (Controller) and low-level (Bridge/Data) depend on the Core abstractions. Neither depends on the other directly. This is the "inversion."**

---

### Code Example — DIP in Obligations with Workflow Factory

**File:** `Leo.Clm.v2.Obligations/Leo.Clm.V2.ObligationsService/Extensions/ServiceCollectionExtensionMethods.cs`

```csharp
public static void AddBridgeServices(this IServiceCollection services)
{
    // CRUD bridge registrations — all interface-to-implementation
    services.TryAddScoped<IAddObligationBridgeRepository, AddObligationBridgeRepository>();
    services.TryAddScoped<IUpdateObligationBridgeRepository, UpdateObligationBridgeRepository>();
    services.TryAddScoped<IDeleteObligationBridgeRepository, DeleteObligationsBridgeRepository>();
    services.TryAddScoped<IGetObligationBridgeRepository, GetObligationBridgeRepository>();

    // Workflow managers — 15 different implementations, all behind interfaces
    services.TryAddScoped<IObligationApproveWorkflowManager, ApproveWorkflowManager>();
    services.TryAddScoped<IMarkAsActiveWorkflowManager, MarkAsActiveWorkflowManager>();
    services.TryAddScoped<IMarkAsApprovalPendingManager, MarkAsApprovalPendingManager>();
    services.TryAddScoped<IMarkAsCompleteWorkflowManager, MarkAsCompleteWorkflowManager>();
    services.TryAddScoped<IMarkAsNotRelevantWorkflowManager, MarkAsNotRelevantWorkflowManager>();
    services.TryAddScoped<IObligationRejectWorkflowManager, RejectWorkflowManager>();
    services.TryAddScoped<ISendBackToDraftWorkflowManager, SendBackToDraftWorkflowManager>();
    services.TryAddScoped<IMarkAsInActiveWorkflowManager, MarkAsInActiveWorkflowManager>();

    // Activity workflow managers
    services.TryAddScoped<IActivityApprovalPendingWorkflowManager, ActivityApprovalPendingWorkflowManager>();
    services.TryAddScoped<IActivityInProgressWorkflowManager, ActivityInProgressWorkflowManager>();
    services.TryAddScoped<IActivityMarkAsCompleteWorkflowManager, ActivityMarkAsCompleteWorkflowManager>();
    services.TryAddScoped<IActivityNotRelevantWorkflowManager, ActivityNotRelevantWorkflowManager>();
    services.TryAddScoped<IActivitySendBackToDraftWorkflowManager, ActivitySendBackToDraftWorkflowManager>();
    services.TryAddScoped<IAssignActivityWorkflowManager, AssignActivityWorkflowManager>();

    // Factory itself is also behind an interface
    services.TryAddScoped<IWorkflowFactory, WorkflowFactory>();
}
```

**Every single dependency is registered as interface → implementation.** The `CompositeController` never knows about `ApproveWorkflowManager` or `RejectWorkflowManager` directly. It only knows about `IWorkflowFactory` and `IWorkFlowManager`.

---

## 6. How All 5 Principles Work Together

The SOLID principles are not independent — they reinforce each other. Here's how they work together in the Obligations microservice as an example:

```
CompositeController                           (SRP: only handles HTTP)
    │
    ├── depends on IWorkflowFactory            (DIP: depends on abstraction)
    │       │
    │       └── WorkflowFactory                (OCP: new workflows = new classes)
    │               │
    │               ├── returns IWorkFlowManager   (LSP: all managers are substitutable)
    │               │       │
    │               │       ├── ApproveWorkflowManager
    │               │       ├── RejectWorkflowManager
    │               │       ├── MarkAsActiveWorkflowManager
    │               │       └── ... (15 total)
    │               │
    │               └── uses IServiceProvider to resolve
    │
    ├── depends on IUpdateObligationBridgeRepository   (ISP: focused interface)
    │
    └── depends on IRuleEngineBridge                    (DIP: abstraction)
```

| Principle | How It's Applied |
|-----------|-----------------|
| **SRP** | Controller handles HTTP only. Each workflow manager handles one workflow. Factory handles resolution only. |
| **OCP** | New workflow = new class implementing `IWorkFlowManager`. Existing workflows are untouched. |
| **LSP** | Any `IWorkFlowManager` can be substituted into the controller. All honor the `PerformTask` contract. |
| **ISP** | Repository interfaces are split by operation (Add, Get, Delete, Update). Workflow manager interfaces are individual. |
| **DIP** | Controller depends on `IWorkflowFactory` (abstraction). Factory depends on `IServiceProvider`. All wired via DI. |

---

## Quick Reference for Interviews

| Principle | One-Liner | Key Pattern | Workspace Example |
|-----------|-----------|-------------|-------------------|
| **SRP** | One class, one reason to change | Layered architecture | Controller → Bridge → Data separation |
| **OCP** | Extend without modifying | Strategy + Factory | `AmendContract`, `CopyContract`, `ModifyContract` |
| **LSP** | Subtypes are substitutable | Interface implementations | `IWorkFlowManager` with 15 interchangeable managers |
| **ISP** | Small, focused interfaces | Role interfaces | `IAddObligationsRepository` vs monolithic `IBaseRepository` |
| **DIP** | Depend on abstractions | Dependency Injection | `ILineItemBridgeRepository` → `LineItemBridgeRepository` via DI |
