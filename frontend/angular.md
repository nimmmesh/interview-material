# Angular — Interview Preparation

---

## Core Concepts

### Component Architecture
- **Component** = class + template + styles. Decorated with `@Component({ selector, templateUrl, styleUrls })`.
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

### Change Detection

- **Default:** Checks entire component tree on every event/timer/HTTP response.
- **OnPush:** Checks only when: (1) input reference changes, (2) event fires in component/child, (3) async pipe emits, (4) manual `markForCheck()`.
- Use OnPush for performance — prevents unnecessary re-renders.

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

- **Memory leaks:** Always unsubscribe from observables. Use `takeUntil`, `async` pipe, or `DestroyRef`.
- **OnPush gotcha:** Mutating objects won't trigger change detection — must create new references.
- **Eager loading everything:** Use lazy loading for feature modules to reduce initial bundle size.
- **`ngFor` without `trackBy`:** Causes full DOM re-render on list changes.
- **Template-driven forms at scale:** Become unmanageable; switch to reactive forms early.
- **`ViewEncapsulation.None`:** Causes global CSS pollution — avoid unless intentional.
- **Callback hell:** Use RxJS operators or async/await instead of nested subscriptions.

---

## Interview Questions — Rapid Fire

1. **Angular vs AngularJS?** Angular = TypeScript, component-based, RxJS. AngularJS = JavaScript, scope/controller-based.
2. **AOT vs JIT?** AOT compiles at build time (smaller bundle, faster). JIT compiles at runtime (default for `ng serve`).
3. **What is Transpiling?** TypeScript → JavaScript conversion during build.
4. **Why TypeScript?** Strict OOP, type safety, better tooling, catches errors at compile time.
5. **Standalone Components?** (Angular 14+) Components without `NgModule`, import dependencies directly.
6. **Signals?** (Angular 16+) Fine-grained reactive primitives, more predictable than zone.js-based detection.
7. **`ng-content` vs `ng-template`?** `ng-content` = content projection (transclusion). `ng-template` = lazy template, rendered conditionally.
8. **`ViewChild` vs `ViewChildren`?** `ViewChild` = first match. `ViewChildren` = QueryList of all matches.
9. **Angular Material?** UI component library following Material Design.
10. **Building blocks?** Components, Modules, Services, Directives, Pipes, Routing, Templates, Data Binding, DI.

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
