# Angular — Interview Preparation

---

## Core Concepts

### Component Architecture

> ***Component = class + template + styles. Every Angular app is a tree of components.***

- Decorated with `@Component({ selector, templateUrl, styleUrls })`.
- Every app has a root component bootstrapped in `AppModule`.
- Components are directives with templates — they control a section of the view.

### Modules (`@NgModule`)
- Organizes components, directives, pipes, and services.
- Key properties: `declarations` (components/directives/pipes), `imports` (other modules), `providers` (services), `bootstrap` (root component).

### Data Binding (4 types)
| Type | Syntax | Direction |
|------|--------|-----------|
| Interpolation | `{{ value }}` | Component → DOM |
| Property binding | `[property]="value"` | Component → DOM |
| Event binding | `(event)="handler()"` | DOM → Component |
| Two-way binding | `[(ngModel)]="value"` | Both |

### Directives
- **Structural:** `*ngIf`, `*ngFor`, `*ngSwitch` — change DOM structure.
- **Attribute:** `[ngClass]`, `[ngStyle]` — change appearance/behavior.
- **Custom:** Create with `@Directive()`, e.g., highlight, dropdown behaviors.

### Services & Dependency Injection
- Services hold shared/reusable logic. Decorated with `@Injectable()`.
- `providedIn: 'root'` → singleton, app-wide (no need to add to `providers` array).
- Injection types: **Constructor** (most common), **Property**, **Static** (`Injector.get()`).

---

## Deep Dive

### Lifecycle Hooks (execution order)

```
ngOnChanges → ngOnInit → ngDoCheck → ngAfterContentInit →
ngAfterContentChecked → ngAfterViewInit → ngAfterViewChecked → ngOnDestroy
```

| Hook | When | Use Case |
|------|------|----------|
| `ngOnChanges` | Input property changes (before `ngOnInit` on first call) | React to input changes |
| `ngOnInit` | After first `ngOnChanges` | Fetch data, initialize component |
| `ngDoCheck` | Every change detection cycle | Custom change detection |
| `ngAfterContentInit` | After `<ng-content>` projected | Access projected content |
| `ngAfterViewInit` | After view + child views init | Access `@ViewChild` refs |
| `ngOnDestroy` | Before component destruction | Unsubscribe, cleanup |

### RxJS & Observables

**Observable vs Promise:**

| | Observable | Promise |
|-|-----------|---------|
| Execution | Lazy (nothing until `.subscribe()`) | Eager (executes immediately) |
| Values | Stream (multiple values over time) | Single value |
| Cancellation | Yes (`.unsubscribe()`) | No |
| Operators | `map`, `filter`, `switchMap`, etc. | `.then()`, `.catch()` |

**Subject Types:**

| Type | Behavior |
|------|----------|
| `Subject` | No initial value, subscribers get only future emissions |
| `BehaviorSubject` | Has initial value, new subscribers get current value immediately |
| `ReplaySubject` | Buffers N values, replays them to new subscribers |
| `AsyncSubject` | Emits only the last value, only on completion |

**Key Operators:**
- `map` — transform emitted values
- `filter` — emit only values matching condition
- `switchMap` — cancel previous inner observable, subscribe to new one (use for HTTP/search)
- `mergeMap` — subscribe to all inner observables concurrently
- `concatMap` — subscribe to inner observables sequentially
- `exhaustMap` — ignore new emissions until current inner completes
- `debounceTime` — delay emissions, discard if new value arrives (search input)
- `distinctUntilChanged` — emit only when value differs from previous
- `pipe` — compose operators into a chain

```typescript
source.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(query => this.http.get(`/api/search?q=${query}`)),
  catchError(error => of([]))
).subscribe(results => this.results = results);
```

### `debounceTime()` — Deep Dive

Waits for a pause in emissions. If a new value arrives before the delay expires, the timer resets and the previous value is discarded.

```typescript
// Only emit after 300ms of silence
searchControl.valueChanges.pipe(
  debounceTime(300)
).subscribe(value => console.log(value));
```

```
User types:  H    e    l    l    o
Time (ms):   0    80   160  240  320
             ×    ×    ×    ×    ← timer starts (300ms)
                                     620ms → emits "Hello"
```

**Common use cases:** Search-as-you-type, form validation on stop typing, window resize handlers.

### `debounceTime()` vs `debounce()`

| | `debounceTime(ms)` | `debounce(durationSelector)` |
|-|-------------------|------------------------------|
| **Delay** | Fixed (e.g., `300ms`) | Dynamic — returns an Observable that controls delay per emission |
| **Use case** | Same delay every time | Variable delay based on the emitted value |
| **Simplicity** | Simpler, most common | More flexible, less common |

```typescript
// debounceTime — fixed 300ms delay, same every time
input$.pipe(
  debounceTime(300)
);

// debounce — dynamic delay based on value
// Short queries get more time (user probably still typing),
// long queries fire faster (likely done typing)
input$.pipe(
  debounce(value => {
    const delay = value.length < 3 ? 500 : 200;
    return timer(delay);
  })
);
```

**Another example — debounce based on priority:**
```typescript
notifications$.pipe(
  debounce(notification => {
    // High priority: emit immediately (0ms)
    // Low priority: wait 2 seconds (batch them)
    return notification.priority === 'high' ? timer(0) : timer(2000);
  })
);
```

**Rule of thumb:** Use `debounceTime()` by default. Use `debounce()` only when you need different delays for different values.

### `distinctUntilChanged()` — Deep Dive

Suppresses consecutive duplicate emissions. Only emits when the current value differs from the previous one.

```typescript
// Without distinctUntilChanged — emits duplicates
of(1, 1, 2, 2, 3, 1).subscribe(console.log);
// Output: 1, 1, 2, 2, 3, 1

// With distinctUntilChanged — skips consecutive duplicates
of(1, 1, 2, 2, 3, 1).pipe(
  distinctUntilChanged()
).subscribe(console.log);
// Output: 1, 2, 3, 1  (note: last 1 emits because it's not consecutive)
```

**With objects — custom comparator:**
```typescript
// Default comparison uses === (reference equality)
// For objects, provide a comparator function
users$.pipe(
  distinctUntilChanged((prev, curr) => prev.id === curr.id)
).subscribe(user => console.log('User changed:', user));
```

**Using `distinctUntilKeyChanged` (shorthand for objects):**
```typescript
// Same as above but cleaner
users$.pipe(
  distinctUntilKeyChanged('id')
).subscribe(user => console.log('User changed:', user));
```

**Real-world pattern — search input (all three together):**
```typescript
this.searchControl.valueChanges.pipe(
  debounceTime(300),              // Wait for user to stop typing
  distinctUntilChanged(),          // Skip if same query as before
  filter(query => query.length >= 2), // Ignore very short queries
  switchMap(query => this.searchService.search(query))
).subscribe(results => this.results = results);
```

```
User types:       "a"     "ab"    "ab"    "abc"
debounceTime:      ×       ×      emit    emit    (waits 300ms)
distinctUntilChanged:       ✓      ×       ✓      (skips duplicate "ab")
filter:                     ✓              ✓      (skips "a" — too short)
switchMap:                  →API           →API   (cancels previous if pending)
```

### Change Detection — Deep Dive

Angular uses **Zone.js** to monkey-patch all async APIs (setTimeout, addEventListener, XHR, Promises). When any async event completes, Zone.js notifies Angular, which triggers change detection from the root component downward.

**How it works:**
```
User clicks button
       │
       ▼
Zone.js intercepts the event
       │
       ▼
Angular's NgZone triggers ApplicationRef.tick()
       │
       ▼
Change detection runs from ROOT component downward
       │
       ▼
For each component: compare current values vs previous values
       │
       ├── Value changed? → Update the DOM
       └── No change? → Skip (but still checked in Default mode)
```

**Default vs OnPush:**

| | Default | OnPush |
|-|---------|--------|
| **Trigger** | Every async event (click, timer, HTTP, etc.) | Only specific triggers |
| **Scope** | Checks ALL components in the tree | Checks this component only when triggered |
| **Performance** | Slower (checks everything) | Faster (skips unchanged branches) |
| **Gotcha** | None — always works | Mutating objects won't trigger detection |

**OnPush triggers (component re-checks when):**
1. `@Input()` reference changes (new object, not mutation)
2. DOM event fires inside the component or its children
3. `async` pipe receives a new emission
4. Manual `ChangeDetectorRef.markForCheck()` or `detectChanges()`

**Example — OnPush pitfall:**
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserComponent {
  @Input() user!: User;
}

// Parent component:
// ❌ WRONG — mutation, same reference, OnPush won't detect it
this.user.name = 'Alice';

// ✅ CORRECT — new object reference triggers OnPush
this.user = { ...this.user, name: 'Alice' };
```

**Manual change detection:**
```typescript
constructor(private cdr: ChangeDetectorRef) {}

updateFromWebSocket(data: any) {
  this.data = data;
  this.cdr.markForCheck();    // Mark this component and ancestors as dirty
  // OR
  this.cdr.detectChanges();   // Run change detection immediately for this component only
}
```

**`detach()` / `reattach()` — full control:**
```typescript
ngOnInit() {
  this.cdr.detach();  // Completely remove from change detection tree
}

onRefresh() {
  this.cdr.detectChanges();  // Manually check only when needed
}
```

**Angular Signals (16+) — the future of change detection:**
- Signals provide fine-grained reactivity without Zone.js
- Only the specific component that reads a changed signal re-renders
- Eventually replaces zone.js-based detection entirely

```typescript
name = signal('Alice');
updatedName = computed(() => this.name().toUpperCase());

// Template
// {{ name() }} — automatically re-renders when signal changes
```

### `ngOnInit` vs `constructor`

| | `constructor` | `ngOnInit` |
|-|--------------|------------|
| **What** | TypeScript/ES6 class feature | Angular lifecycle hook |
| **When** | Called when class is instantiated (before Angular) | Called after Angular sets `@Input()` properties |
| **`@Input()` available?** | No — inputs are `undefined` | Yes — all inputs are bound |
| **DI available?** | Yes — injected services are available | Yes |
| **Use for** | Dependency injection only | Initialization logic, API calls, subscriptions |
| **Called** | Once (by JavaScript engine) | Once (by Angular) |

```typescript
@Component({ selector: 'app-user' })
export class UserComponent implements OnInit {
  @Input() userId!: number;
  user: User;

  constructor(private userService: UserService) {
    // ✅ DI injection — this is what constructors are for
    console.log(this.userId);  // ❌ undefined — not set yet!
  }

  ngOnInit() {
    // ✅ @Input() values are now available
    console.log(this.userId);  // ✅ has the value from parent
    this.userService.getUser(this.userId).subscribe(u => this.user = u);
  }
}
```

> 💡 **Rule of thumb:** Constructor = inject dependencies. `ngOnInit` = everything else.

### Forms

| | Template-Driven | Reactive |
|-|----------------|----------|
| Module | `FormsModule` | `ReactiveFormsModule` |
| Logic location | Template (HTML) | Component (TypeScript) |
| Binding | `ngModel` | `formControlName` / `[formControl]` |
| Validation | HTML attributes (`required`, `pattern`) | `Validators` class in code |
| Dynamic controls | Difficult | Easy (`addControl`, `removeControl`) |
| Testability | Lower | Higher |
| Best for | Simple forms | Complex forms, dynamic fields, custom validation |

**Reactive Forms setup:**
```typescript
this.myForm = this.fb.group({
  name: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]],
});
```

**`setValue` vs `patchValue`:** `setValue` requires ALL controls to be set; `patchValue` updates only specified controls.

### Routing & Guards

**Guard types:**

| Guard | Purpose |
|-------|---------|
| `CanActivate` | Can user visit this route? (auth check) |
| `CanActivateChild` | Can user visit child routes? |
| `CanDeactivate` | Can user leave? (unsaved changes warning) |
| `Resolve` | Pre-fetch data before route activation |
| `CanLoad` | Can lazy-loaded module be loaded? |

**Router State:** Contains current active route, URL, params, query params, navigation history. Access via `Router` service and `ActivatedRoute`.

### Lazy Loading

Lazy loading defers loading of feature modules until the user navigates to them, reducing the initial bundle size.

**Step-by-step configuration:**

**1. Create a feature module with routing:**
```bash
ng generate module admin --route admin --module app.module
```

**2. Configure lazy route in `app-routing.module.ts`:**
```typescript
const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'reports',
    loadChildren: () => import('./reports/reports.module').then(m => m.ReportsModule)
  }
];
```

**3. Feature module has its own routing:**
```typescript
// admin-routing.module.ts
const routes: Routes = [
  { path: '', component: AdminDashboardComponent },
  { path: 'users', component: UserListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],  // forChild, not forRoot
  exports: [RouterModule]
})
export class AdminRoutingModule {}
```

**Preloading Strategies:**
```typescript
// app-routing.module.ts
@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: PreloadAllModules  // preload all lazy modules after app loads
  })]
})
```

| Strategy | Behavior |
|----------|----------|
| `NoPreloading` (default) | Load only when navigated |
| `PreloadAllModules` | Preload all lazy modules in background after initial load |
| **Custom strategy** | Selective preloading based on conditions |

**Custom preloading strategy (preload based on route data):**
```typescript
@Injectable({ providedIn: 'root' })
export class SelectivePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    return route.data?.['preload'] ? load() : of(null);
  }
}

// Route config — only this route gets preloaded
{ path: 'dashboard', loadChildren: () => import(...), data: { preload: true } }
{ path: 'settings', loadChildren: () => import(...) }  // NOT preloaded
```

**Dynamic lazy loading based on user roles:**
```typescript
this.dynamicRouteService.getDynamicRoutes().subscribe(routesData => {
  const routes = routesData.map(r => ({
    path: r.path,
    loadChildren: () => import(r.modulePath).then(m => m[r.moduleName])
  }));
  this.router.config.unshift(...routes);
});
```

### Lazy Loading Components by User Behavior (Angular 17+ `@defer`)

Angular 17 introduced `@defer` blocks — lazy load **individual components** (not just modules) based on triggers like viewport visibility, interaction, or idle time.

```html
<!-- Load when component enters the viewport (scroll-triggered) -->
@defer (on viewport) {
  <app-heavy-chart [data]="chartData" />
} @placeholder {
  <div class="skeleton-loader">Loading chart...</div>
} @loading (minimum 500ms) {
  <app-spinner />
} @error {
  <p>Failed to load chart.</p>
}

<!-- Load when user hovers over the area -->
@defer (on hover) {
  <app-detailed-tooltip />
} @placeholder {
  <span>Hover for details</span>
}

<!-- Load when user interacts (click, keydown) with trigger element -->
@defer (on interaction(loadBtn)) {
  <app-admin-panel />
} @placeholder {
  <button #loadBtn>Open Admin Panel</button>
}

<!-- Load after browser is idle (good for below-fold content) -->
@defer (on idle) {
  <app-recommendations />
}

<!-- Load after a timer -->
@defer (on timer(3s)) {
  <app-promo-banner />
}

<!-- Combine conditions -->
@defer (on viewport; when user.isAdmin) {
  <app-admin-widget />
}
```

**`@defer` triggers:**

| Trigger | When Component Loads |
|---------|---------------------|
| `on idle` | Browser is idle (requestIdleCallback) |
| `on viewport` | Element scrolls into view (IntersectionObserver) |
| `on interaction` | User clicks/focuses/hovers on trigger element |
| `on hover` | User hovers over placeholder |
| `on timer(Xms)` | After specified delay |
| `when condition` | When expression becomes truthy |

**Why this matters:** Before `@defer`, you needed complex `ViewContainerRef` + `ComponentFactoryResolver` code to lazy-load individual components. Now it's declarative in the template.

### Pipes

| Type | Behavior | Instances |
|------|----------|-----------|
| **Pure** (default) | Re-evaluates only when input reference changes. Result is cached. | Single instance |
| **Impure** (`pure: false`) | Re-evaluates on every change detection cycle | Multiple instances |
| **Async** | Subscribes to Observable/Promise, auto-updates view, auto-unsubscribes | — |

### ViewEncapsulation

| Mode | Behavior |
|------|----------|
| `Emulated` (default) | Scoped CSS via generated attributes. No style leakage. |
| `None` | Global CSS. Styles can leak to/from other components. |
| `ShadowDom` | Native Shadow DOM. Strongest encapsulation. |

---

## Real-World Usage

### HTTP Interceptors
- Attach auth tokens to every request
- Handle global errors (401 → redirect to login)
- Log request/response timing
- Show/hide loading spinner

### State Management Options
| Approach | When to Use |
|----------|------------|
| Service + `BehaviorSubject` | Simple apps, few shared states |
| NgRx | Large apps, complex state flows, team standardization |
| Signals (Angular 16+) | Fine-grained reactivity, replacing zone.js |

### Authentication Flow
1. User submits credentials → API validates → returns JWT
2. Store JWT (HTTP-only cookie preferred)
3. Interceptor attaches JWT to `Authorization` header
4. Guards check auth state before route activation
5. Authorization = role-based access control on routes/features

---

## Tradeoffs & Pitfalls

> ⚠️ **Memory leaks:** Always unsubscribe from observables. Use `takeUntil`, `async` pipe, or `DestroyRef`.
> ⚠️ **OnPush gotcha:** Mutating objects won't trigger change detection — must create new references.
- **Eager loading everything:** Use lazy loading for feature modules to reduce initial bundle size.
- **`ngFor` without `trackBy`:** Causes full DOM re-render on list changes.
- **Template-driven forms at scale:** Become unmanageable; switch to reactive forms early.
- **`ViewEncapsulation.None`:** Causes global CSS pollution — avoid unless intentional.
- **Callback hell:** Use RxJS operators or async/await instead of nested subscriptions.

---

## AOT vs JIT Compilation — Deep Dive

> ***AOT = compile templates at build time. JIT = compile templates at runtime in the browser.***

### Compilation Workflow

```
                    JIT (Just-In-Time)                    AOT (Ahead-Of-Time)
                    ──────────────────                    ───────────────────
Source Code     →   Bundled with compiler   →   Source Code    →   Compiled at build
                    shipped to browser                              only JS shipped
                         │                                              │
Browser loads   →   Angular compiler runs   →   Browser loads   →   Runs immediately
                    in browser (slower)                              (no compiler needed)
                         │                                              │
Templates       →   Compiled at runtime     →   Templates       →   Already compiled
                    (errors found late)                              (errors found early)
```

### Comparison

| | JIT | AOT |
|-|-----|-----|
| **When** | Templates compiled in browser at runtime | Templates compiled during `ng build` |
| **Bundle size** | Larger (includes Angular compiler ~1MB) | Smaller (compiler not shipped) |
| **Startup speed** | Slower (compile + render) | Faster (just render) |
| **Error detection** | Runtime (user sees template errors) | Build time (caught by developer) |
| **Security** | Templates available as strings (injectable) | Templates pre-compiled to JS (not injectable) |
| **Used for** | Development (`ng serve`) | Production (`ng build --configuration production`) |
| **Tree shaking** | Limited (compiler can't analyze well) | Better (compiler marks unused code) |
| **Build time** | Faster build | Slower build (compilation happens here) |

### Why AOT for Production?

```bash
# Development — JIT (fast rebuild, hot module replacement)
ng serve

# Production — AOT (enabled by default since Angular 9)
ng build --configuration production
# Includes: AOT compilation + tree shaking + minification + dead code elimination
```

**Security benefit:**
```html
<!-- JIT: template is a string, vulnerable to template injection -->
<!-- An attacker could inject: {{ constructor.constructor('return this')() }} -->

<!-- AOT: templates are pre-compiled to JavaScript -->
<!-- No template compiler in browser = no template injection possible -->
```

**Performance numbers (typical):**
- First Contentful Paint: AOT ~40-60% faster than JIT
- Bundle size: AOT removes ~1MB (Angular compiler) from bundle
- Parse time: Less JavaScript to parse = faster on mobile devices

**Senior-Level Answer:** "AOT compiles Angular templates into optimized JavaScript at build time. This gives us three benefits: faster startup because the browser doesn't need the Angular compiler, smaller bundles because we don't ship the compiler (~1MB savings), and better security because templates aren't available as injectable strings. We use JIT only during development for faster rebuild cycles. Since Angular 9, AOT is the default for production builds."

**Common Cross Questions:**
- *Can you use JIT in production?* Technically yes, but never recommended — larger bundle, slower startup, security risk.
- *Does AOT catch all template errors?* It catches structural errors (wrong property bindings, missing components) but not runtime data errors.
- *What is Ivy?* Angular's modern compilation engine (default since Angular 9) that improved both AOT and JIT compilation. Enables features like tree-shakable components and better lazy loading.
- *How does AOT affect lazy loading?* Each lazy-loaded module is AOT-compiled into its own chunk — loaded and ready to render instantly without compilation.

---

## Interview Questions — Rapid Fire

| # | Question | Answer |
|---|----------|--------|
| 1 | **Angular vs AngularJS?** | Angular = TypeScript, component-based, RxJS. AngularJS = JS, scope/controller-based |
| 2 | **AOT vs JIT?** | AOT = build time (smaller, faster). JIT = runtime (default for `ng serve`) |
| 3 | **What is Transpiling?** | TypeScript → JavaScript conversion during build |
| 4 | **Why TypeScript?** | Strict OOP, type safety, better tooling, **compile-time error detection** |
| 5 | **Standalone Components?** | (Angular **14+**) Components without `NgModule`, import dependencies directly |
| 6 | **Signals?** | (Angular **16+**) Fine-grained reactive primitives, more predictable than zone.js |
| 7 | **`ng-content` vs `ng-template`?** | `ng-content` = content projection. `ng-template` = lazy template, rendered conditionally |
| 8 | **`ViewChild` vs `ViewChildren`?** | `ViewChild` = first match. `ViewChildren` = QueryList of all matches |
| 9 | **Angular Material?** | UI component library following Material Design |
| 10 | **Building blocks?** | Components, Modules, Services, Directives, Pipes, Routing, Templates, DI |

---

## Microfrontends

### What is a Microfrontend?
A microfrontend extends microservice principles to the frontend — splitting a monolithic frontend into smaller, independently deployable UI applications that compose into a single user experience.

```
┌──────────────────────────────────────────────────┐
│                  Container / Shell                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │  Team A     │  │  Team B     │  │  Team C     │  │
│  │  (Angular)  │  │  (React)    │  │  (Vue)      │  │
│  │  Catalog    │  │  Cart       │  │  Checkout   │  │
│  └────────────┘  └────────────┘  └────────────┘  │
└──────────────────────────────────────────────────┘
```

### Implementation Approaches

| Approach | How | Pros | Cons |
|----------|-----|------|------|
| **Module Federation** (Webpack 5) | Load remote modules at runtime | Best DX, shared dependencies, lazy loading | Webpack-only, version alignment needed |
| **Single-SPA** | Framework-agnostic orchestrator | Polyglot (mix Angular + React), mature ecosystem | Complex setup, global state tricky |
| **iframes** | Embed each micro-app in iframe | Complete isolation, simple | Poor UX (no shared styles/routing), performance hit |
| **Web Components** | Each micro-app as custom element | Framework-agnostic, native browser support | Limited tooling, Shadow DOM styling challenges |

### Data Sharing Between Microfrontends

| Pattern | How | When to Use |
|---------|-----|-------------|
| **Custom Events** | `window.dispatchEvent(new CustomEvent('cart-updated', { detail }))` | Loose coupling, simple notifications |
| **Shared State Store** | Shared Redux/Zustand store loaded via Module Federation | Complex shared state, multiple consumers |
| **URL / Route Params** | Pass data via URL query params or route segments | Navigation-driven data |
| **Props / Attributes** | Pass data as Web Component attributes or framework props | Parent → child data flow |
| **Pub/Sub (Event Bus)** | Lightweight event bus (RxJS Subject on `window`) | Decoupled, event-driven communication |
| **Shared API Layer** | Each MFE fetches from same backend, caches shared | Independent data fetching |

**Custom Events example:**
```javascript
// Producer (Cart MFE)
window.dispatchEvent(new CustomEvent('cart:updated', {
  detail: { items: cart, total: cart.length }
}));

// Consumer (Header MFE)
window.addEventListener('cart:updated', (e) => {
  document.getElementById('cart-count').textContent = e.detail.total;
});
```

**Shared state via Module Federation:**
```javascript
// shared-store (remote module exposed by Shell)
import { BehaviorSubject } from 'rxjs';
export const user$ = new BehaviorSubject(null);
export const setUser = (user) => user$.next(user);

// Auth MFE — sets user after login
import { setUser } from 'shell/shared-store';
setUser({ name: 'Alice', role: 'admin' });

// Dashboard MFE — reads user
import { user$ } from 'shell/shared-store';
user$.subscribe(user => console.log('Logged in:', user?.name));
```

### Key Design Principles
- **Independent deployment** — each MFE has its own CI/CD pipeline
- **Team ownership** — each team owns a vertical slice (UI + API + DB)
- **Shared nothing** — minimize shared dependencies; share only contracts
- **Consistent UX** — use a shared design system / component library

---

## Tooling & Package Management

### `npm audit`

Scans your project's dependency tree for known security vulnerabilities.

```bash
# Run a vulnerability audit
npm audit

# Output: table of vulnerabilities with severity (low/moderate/high/critical)

# Auto-fix vulnerabilities (updates to patched versions)
npm audit fix

# Force fix — may include breaking major version changes
npm audit fix --force

# Generate JSON report (useful for CI/CD pipelines)
npm audit --json
```

**How it works:**
1. Reads `package-lock.json` to get exact installed versions
2. Checks against npm's security advisory database
3. Reports vulnerable packages, severity, and recommended fix version

**In CI/CD:** Add `npm audit --audit-level=high` to fail builds on high/critical vulnerabilities.

### `package.json` vs `package-lock.json`

| | `package.json` | `package-lock.json` |
|-|---------------|--------------------|
| **Purpose** | Project manifest — metadata, scripts, dependency ranges | Exact dependency tree lock |
| **Version format** | Ranges: `^1.2.3`, `~1.2.3`, `>=1.0.0` | Exact: `1.2.3` |
| **Created by** | `npm init` or manually | Auto-generated by `npm install` |
| **Commit to git?** | Always | Always (ensures reproducible builds) |
| **Editable?** | Yes (manually) | No (auto-managed by npm) |
| **Contains** | Direct dependencies only | Entire nested dependency tree |

**Version range symbols:**
```
^1.2.3  →  >=1.2.3 and <2.0.0  (minor + patch updates allowed)
~1.2.3  →  >=1.2.3 and <1.3.0  (patch updates only)
1.2.3   →  exactly 1.2.3       (pinned)
```

**Why `package-lock.json` matters:**
- Without it, `npm install` on different machines may install different versions (within the `^`/`~` range)
- Guarantees every developer and CI/CD gets the exact same dependency versions
- Makes builds reproducible and deterministic

**Common scenario:**
```bash
# Developer A adds a package
npm install lodash      # Updates both package.json AND package-lock.json

# Developer B pulls and installs
npm install             # Reads package-lock.json → gets exact same versions

# To update all dependencies to latest allowed by ranges
npm update              # Updates package-lock.json
```

---

## Quick Reference

```
LIFECYCLE:  OnChanges → OnInit → DoCheck → AfterContentInit → AfterContentChecked
            → AfterViewInit → AfterViewChecked → OnDestroy

BINDING:    {{ }}  |  [prop]  |  (event)  |  [(ngModel)]

DIRECTIVES: *ngIf  *ngFor  *ngSwitch  [ngClass]  [ngStyle]

RXJS:       map | filter | switchMap | mergeMap | concatMap | exhaustMap | debounceTime

GUARDS:     CanActivate | CanActivateChild | CanDeactivate | Resolve | CanLoad

FORMS:      Template-driven (FormsModule) vs Reactive (ReactiveFormsModule)

PIPES:      Pure (cached) | Impure (every cycle) | Async (auto-subscribe)

DETECTION:  Default (check all) vs OnPush (check on input change/event/async)

LOADING:    Eager (default) | Lazy (loadChildren) | Preloading (PreloadAllModules)

AOT > JIT:  Faster render, smaller bundle, earlier error detection
```
