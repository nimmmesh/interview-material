# Backend Interview Notes (.NET / Microservices)

## 1. Common Design Patterns in .NET

### Dependency Injection (Most Common)

Used to decouple components by injecting dependencies instead of
creating them.

Benefits: - Loose coupling - Testability - Maintainability

Example:

``` csharp
services.AddScoped<IUserService, UserService>();
```

Types of DI lifetimes:

  Type        Description
  ----------- ----------------------------
  Singleton   One instance for whole app
  Scoped      One instance per request
  Transient   New instance each time

------------------------------------------------------------------------

## Other Common Patterns

### Repository Pattern

Abstracts data access logic.

    Controller -> Service -> Repository -> Database

### Factory Pattern

Used to create objects without exposing creation logic.

### Strategy Pattern

Allows selecting algorithms at runtime.

Example: payment processors or validation strategies.

------------------------------------------------------------------------

## 2. Authentication vs Authorization

### Authentication

Verifies **who the user is**.

Examples: - Login with username/password - OAuth login - JWT token
validation

### Authorization

Determines **what the user can access**.

Examples: - Role-based access control - Permission checks

------------------------------------------------------------------------

## Typical Authentication Flow in .NET Microservices

1.  Client logs in via identity provider (Auth Server).
2.  Auth server validates credentials.
3.  JWT token is issued.
4.  Client sends token with requests.
5.  API Gateway / Service validates token.
6.  Authorization rules determine access.

Example header:

    Authorization: Bearer <JWT_TOKEN>

------------------------------------------------------------------------

## 3. LINQ Core Operators

### Select

Transforms data.

    .Select(x => x.Name)

### Where

Filters elements.

    .Where(x => x.Age > 18)

### GroupBy

Groups elements by key.

    .GroupBy(x => x.Category)

### OrderBy / OrderByDescending

    .OrderBy(x => x.Price)

### Take

    .Take(3)

------------------------------------------------------------------------

## LINQ Execution Model

Deferred execution means queries run only when enumerated.

Examples that trigger execution:

-   ToList()
-   First()
-   Count()
-   foreach
