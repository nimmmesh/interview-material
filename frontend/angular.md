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
- `pipe` — compose operators into a chain

```typescript
source.pipe(
  debounceTime(300),
  switchMap(query => this.http.get(`/api/search?q=${query}`)),
  catchError(error => of([]))
).subscribe(results => this.results = results);
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

**Static:** Use `loadChildren` in route config:
```typescript
{ path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) }
```

**Dynamic:** Fetch routes from API based on user roles, then push to `router.config`:
```typescript
this.dynamicRouteService.getDynamicRoutes().subscribe(routesData => {
  const routes = routesData.map(r => ({
    path: r.path,
    loadChildren: () => import(r.modulePath).then(m => m[r.moduleName])
  }));
  this.router.config.unshift(...routes);
});
```

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
