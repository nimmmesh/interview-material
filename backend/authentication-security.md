# Security & Authentication — Interview Preparation

---

## Core Concepts

### Authentication vs Authorization

| | Authentication | Authorization |
|-|---------------|---------------|
| Question | Who are you? | What can you access? |
| Mechanism | Credentials, tokens, biometrics | Roles, permissions, policies |
| When | Before authorization | After authentication |
| Example | Login with username/password | Admin can delete, viewer can only read |

---

## Deep Dive

### OAuth 2.0

**Four Roles:**
1. **Resource Owner** — the user who owns the data
2. **Client Application** — app requesting access (web/mobile)
3. **Resource Server** — server hosting protected data
4. **Authorization Server** — authenticates user, issues tokens

**Grant Types:**

| Grant | Use Case | Security |
|-------|----------|----------|
| **Authorization Code** | Server-side apps | Most secure (code exchanged server-to-server) |
| **Implicit** | SPAs (legacy, deprecated) | Token exposed in URL |
| **Client Credentials** | Server-to-server (no user) | Machine-to-machine auth |
| **PKCE** | Modern SPAs & mobile | Authorization Code + code verifier |

### JWT Authentication Flow
```
1. Client sends credentials → Auth Server
2. Auth Server validates → issues JWT (ID token + access token)
3. Client stores JWT → sends with each request
4. API validates JWT signature → extracts claims
5. Authorization rules applied based on claims/roles
```

**Header:** `Authorization: Bearer <JWT_TOKEN>`

### OpenID Connect (OIDC) + Claims-Based Auth
1. Client redirects user to Identity Provider (IDP)
2. IDP authenticates user
3. IDP issues ID Token containing claims (name, email, roles)
4. Client extracts claims for authorization decisions

### Token Security Best Practices

| Practice | Why |
|----------|-----|
| Use HTTPS | Prevent token interception in transit |
| Short expiration | Limit window of compromise |
| HTTP-only cookies | Prevent JavaScript access (XSS protection) |
| Token binding | Bind token to specific client/device |
| `SameSite` cookie attribute | Prevent CSRF |
| Never store in localStorage | Vulnerable to XSS |
| Token encryption | Additional layer of protection |

---

## Web Security Threats & Prevention

### OWASP Top Threats

| Threat | Prevention |
|--------|-----------|
| **SQL Injection** | Parameterized queries, ORM (EF is injection-safe by default) |
| **XSS (Cross-Site Scripting)** | Input sanitization, CSP headers, output encoding |
| **CSRF (Cross-Site Request Forgery)** | Anti-forgery tokens, SameSite cookies |
| **Broken Authentication** | MFA, account lockout, secure password storage |
| **Sensitive Data Exposure** | HTTPS, encryption at rest, minimal data collection |

### Security Headers
```
Content-Security-Policy: default-src 'self'     → Prevents XSS
X-Content-Type-Options: nosniff                 → Prevents MIME sniffing
X-Frame-Options: DENY                           → Prevents clickjacking
Strict-Transport-Security: max-age=31536000     → Forces HTTPS
```

---

## Real-World Usage

### .NET Microservice Auth Flow
```
Client → API Gateway (validates JWT)
           ├── Service A (extracts claims, checks roles)
           ├── Service B (service-to-service: Client Credentials grant)
           └── Identity Provider (issues/refreshes tokens)
```

---

## End-to-End Authentication & Authorization Flow

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                         │
│                                                                    │
│  ┌──────────┐    POST /api/auth/login     ┌──────────────────┐     │
│  │  Angular  │ ──────────────────────────► │  .NET Web API    │     │
│  │  Frontend │    { email, password }      │  Auth Controller │     │
│  │           │                             └────────┬─────────┘     │
│  │           │                                      │               │
│  │           │                                      ▼               │
│  │           │                             ┌──────────────────┐     │
│  │           │                             │  SQL Server      │     │
│  │           │                             │  Users + Roles   │     │
│  │           │                             │  table           │     │
│  │           │    JWT (access + refresh)   └────────┬─────────┘     │
│  │           │ ◄──────────────────────────────────── │               │
│  └─────┬────┘                                                      │
│        │                                                           │
│        │  GET /api/admin/dashboard                                  │
│        │  Authorization: Bearer <JWT>                               │
│        ▼                                                           │
│  ┌──────────────────┐   Validate JWT    ┌──────────────────┐       │
│  │  HTTP Interceptor │ ───────────────► │  JWT Middleware   │       │
│  │  (attach token)   │                  │  [Authorize]      │       │
│  └──────────────────┘   Claims → RBAC  │  Role check       │       │
│                                         └──────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

### 1. Database — Users & Roles Tables

```sql
-- Users table
CREATE TABLE Users (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Email NVARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(500) NOT NULL,     -- bcrypt/PBKDF2 hashed, NEVER plain text
    FullName NVARCHAR(100) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    RefreshToken NVARCHAR(500) NULL,
    RefreshTokenExpiry DATETIME2 NULL
);

-- Roles table
CREATE TABLE Roles (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(50) UNIQUE NOT NULL        -- 'Admin', 'User', 'Manager'
);

-- Many-to-many: User-Roles
CREATE TABLE UserRoles (
    UserId INT FOREIGN KEY REFERENCES Users(Id),
    RoleId INT FOREIGN KEY REFERENCES Roles(Id),
    PRIMARY KEY (UserId, RoleId)
);

-- Seed roles
INSERT INTO Roles (Name) VALUES ('Admin'), ('User'), ('Manager');
```

### 2. Backend — .NET Web API

**appsettings.json — JWT Configuration:**
```json
{
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyAtLeast32Characters!",
    "Issuer": "MyApp",
    "Audience": "MyAppUsers",
    "AccessTokenExpiryMinutes": 15,
    "RefreshTokenExpiryDays": 7
  }
}
```

**Program.cs — Configure Authentication Middleware:**
```csharp
// 1. Register JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]!))
        };
    });

// 2. Register Authorization with role policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ManagerOrAdmin", policy => policy.RequireRole("Admin", "Manager"));
});

// 3. Middleware pipeline (ORDER MATTERS)
app.UseAuthentication();   // Must come before UseAuthorization
app.UseAuthorization();
```

**TokenService.cs — JWT Generation:**
```csharp
public class TokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config) => _config = config;

    public string GenerateAccessToken(User user, List<string> roles)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
        };

        // Add each role as a claim
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["JwtSettings:SecretKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["JwtSettings:Issuer"],
            audience: _config["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
                double.Parse(_config["JwtSettings:AccessTokenExpiryMinutes"]!)),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}
```

**AuthController.cs — Login & Refresh Endpoints:**
```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokenService;

    public AuthController(AppDbContext db, TokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // 1. Find user by email
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid credentials" });

        // 2. Get user roles
        var roles = await _db.UserRoles
            .Where(ur => ur.UserId == user.Id)
            .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
            .ToListAsync();

        // 3. Generate tokens
        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var refreshToken = _tokenService.GenerateRefreshToken();

        // 4. Store refresh token in DB
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _db.SaveChangesAsync();

        // 5. Return tokens
        return Ok(new { accessToken, refreshToken, roles });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(
            u => u.RefreshToken == request.RefreshToken
              && u.RefreshTokenExpiry > DateTime.UtcNow);

        if (user == null) return Unauthorized(new { message = "Invalid refresh token" });

        var roles = await _db.UserRoles
            .Where(ur => ur.UserId == user.Id)
            .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
            .ToListAsync();

        var newAccessToken = _tokenService.GenerateAccessToken(user, roles);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _db.SaveChangesAsync();

        return Ok(new { accessToken = newAccessToken, refreshToken = newRefreshToken });
    }
}
```

**Protected Controller — Role-Based Authorization:**
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]  // All endpoints require authentication
public class AdminController : ControllerBase
{
    [HttpGet("dashboard")]
    [Authorize(Policy = "AdminOnly")]  // Only users with "Admin" role
    public IActionResult GetDashboard()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        return Ok(new { message = $"Welcome Admin {email}", userId });
    }

    [HttpGet("reports")]
    [Authorize(Policy = "ManagerOrAdmin")]  // Admin OR Manager role
    public IActionResult GetReports() => Ok(new { data = "Sensitive reports" });
}
```

### 3. Frontend — Angular

**auth.service.ts — Login, Token Storage, Refresh:**
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Restore user from token on app startup
    const token = this.getAccessToken();
    if (token && !this.isTokenExpired(token)) {
      this.currentUserSubject.next(this.decodeToken(token));
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(
        tap(response => {
          localStorage.setItem('access_token', response.accessToken);
          localStorage.setItem('refresh_token', response.refreshToken);
          this.currentUserSubject.next(this.decodeToken(response.accessToken));
        })
      );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post<AuthResponse>('/api/auth/refresh', { refreshToken })
      .pipe(
        tap(response => {
          localStorage.setItem('access_token', response.accessToken);
          localStorage.setItem('refresh_token', response.refreshToken);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.roles?.includes(role) ?? false;
  }

  private isTokenExpired(token: string): boolean {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  }

  private decodeToken(token: string): User {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload[ClaimTypes.NameIdentifier],
      email: payload[ClaimTypes.Email],
      name: payload[ClaimTypes.Name],
      roles: Array.isArray(payload[ClaimTypes.Role])
        ? payload[ClaimTypes.Role]
        : [payload[ClaimTypes.Role]]
    };
  }
}
```

**auth.interceptor.ts — Attach JWT + Auto-Refresh:**
```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth endpoints
    if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
      return next.handle(req);
    }

    // Attach token to request
    const token = this.authService.getAccessToken();
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError(error => {
        if (error.status === 401) {
          return this.handle401(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(response => {
          this.isRefreshing = false;
          this.refreshSubject.next(response.accessToken);
          return next.handle(req.clone({
            setHeaders: { Authorization: `Bearer ${response.accessToken}` }
          }));
        }),
        catchError(() => {
          this.isRefreshing = false;
          this.authService.logout();
          return throwError(() => new Error('Session expired'));
        })
      );
    }

    // Queue other requests while refresh is in progress
    return this.refreshSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next.handle(req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      })))
    );
  }
}
```

**auth.guard.ts — Route Protection:**
```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = this.authService.getAccessToken();

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // Check role-based access
    const requiredRoles = route.data['roles'] as string[];
    if (requiredRoles && !requiredRoles.some(r => this.authService.hasRole(r))) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}

// Route config with role-based guard
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    data: { roles: ['Admin'] }   // Only Admin role can access
  },
  {
    path: 'reports',
    component: ReportsComponent,
    canActivate: [AuthGuard],
    data: { roles: ['Admin', 'Manager'] }
  }
];
```

### 4. Complete Flow Summary

```
Step 1: User enters email + password in Angular LoginComponent
          │
Step 2:   ├──► AuthService.login() sends POST /api/auth/login
          │
Step 3:   ├──► .NET AuthController validates credentials against DB (bcrypt verify)
          │    └── Queries UserRoles + Roles tables to get user's roles
          │
Step 4:   ├──► TokenService generates JWT with claims (userId, email, roles)
          │    └── Generates secure refresh token, stores in DB
          │
Step 5:   ├──► Angular stores tokens, decodes JWT, updates currentUser$ subject
          │
Step 6:   ├──► User navigates to /admin
          │    └── AuthGuard checks: (a) token exists, (b) user has 'Admin' role
          │
Step 7:   ├──► HTTP request made → Interceptor attaches "Bearer <token>" header
          │
Step 8:   ├──► .NET middleware validates JWT signature, expiry, issuer, audience
          │    └── [Authorize(Policy = "AdminOnly")] checks ClaimTypes.Role
          │
Step 9:   ├──► If token expired → Interceptor auto-calls /auth/refresh
          │    └── Retries original request with new token
          │
Step 10:  └──► If refresh token also expired → Logout, redirect to /login
```

### Security Checklist for Interviews
- [ ] HTTPS everywhere
- [ ] Input validation at all boundaries
- [ ] Parameterized queries (never string concatenation)
- [ ] JWT with short expiry + refresh tokens
- [ ] RBAC (Role-Based Access Control)
- [ ] CSP headers for XSS prevention
- [ ] Anti-forgery tokens for CSRF
- [ ] Secrets in environment variables, not code

---

## Interview Questions — Rapid Fire

1. **Authentication vs Authorization?** AuthN = verify identity. AuthZ = verify permissions.
2. **How does OAuth 2.0 work?** Client gets auth code from auth server, exchanges for tokens, presents token to resource server.
3. **What are JWT claims?** Key-value pairs in token payload (sub, name, email, roles, exp).
4. **How to prevent SQL injection?** Parameterized queries. Never concatenate user input into SQL.
5. **XSS vs CSRF?** XSS = inject malicious scripts. CSRF = trick user into making unintended requests.
6. **Where to store tokens?** HTTP-only cookies (not localStorage — XSS vulnerable).
7. **Client Credentials grant?** Server-to-server auth without user involvement. Machine-to-machine.
8. **What is CORS?** Browser policy that blocks cross-origin requests. Server must explicitly allow origins.
9. **What is Content Security Policy?** HTTP header that restricts resource sources, preventing XSS.
10. **How to secure a microservice?** API Gateway auth, JWT validation, HTTPS, input validation, rate limiting.

---

## Quick Reference

```
AUTH FLOW:    Credentials → AuthN Server → JWT → Client → API (Bearer token) → AuthZ
OAUTH:        Auth Code (server) | Client Credentials (machine) | PKCE (SPA/mobile)
JWT:          Header.Payload.Signature  (claims: sub, name, roles, exp)
STORAGE:      HTTP-only cookie (safe) | localStorage (XSS risk) | sessionStorage (tab only)
THREATS:      SQL Injection | XSS | CSRF | Broken Auth | Data Exposure
PREVENTION:   Parameterized queries | CSP headers | Anti-forgery tokens | HTTPS | Input validation
HEADERS:      CSP | X-Content-Type-Options | X-Frame-Options | HSTS
```
