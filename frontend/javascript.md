# JavaScript — Interview Preparation

---

## Core Concepts

### CSS Specificity

Specificity determines which CSS rule wins when multiple rules target the same element.

**Hierarchy (highest → lowest):**
```
!important  >  Inline styles  >  ID selectors  >  Class/Attribute/Pseudo-class  >  Element/Pseudo-element  >  Universal (*)
```

**Specificity Calculation:** Each selector gets a score as `(a, b, c, d)`:

| Component | Selector Type | Example | Weight |
|-----------|--------------|---------|--------|
| `a` | Inline styles | `style="color: red"` | 1,0,0,0 |
| `b` | ID selectors | `#header` | 0,1,0,0 |
| `c` | Classes, attributes, pseudo-classes | `.nav`, `[type="text"]`, `:hover` | 0,0,1,0 |
| `d` | Elements, pseudo-elements | `div`, `::before` | 0,0,0,1 |

**Examples:**
```css
/* Specificity: 0,0,0,1 */
p { color: blue; }

/* Specificity: 0,0,1,0 — wins over element */
.text { color: green; }

/* Specificity: 0,1,0,0 — wins over class */
#main { color: red; }

/* Specificity: 0,1,1,1 — highest combined */
#main .text p { color: purple; }

/* !important overrides everything (avoid in production) */
p { color: orange !important; }
```

**Resolution order when specificity is equal:** Last rule in source order wins.

**Best Practices:**
- Avoid `!important` — makes debugging/overriding painful
- Prefer classes over IDs for styling (lower specificity = easier to override)
- Use BEM naming convention (`.block__element--modifier`) to avoid specificity wars
- Inline styles should be reserved for dynamic/JS-driven styles only

---

### `var` vs `let` vs `const`

| | `var` | `let` | `const` |
|-|-------|-------|---------|
| Scope | Function | Block | Block |
| Hoisting | Yes (initialized as `undefined`) | Yes (TDZ — not accessible) | Yes (TDZ) |
| Re-declaration | Yes | No | No |
| Re-assignment | Yes | Yes | No |

### Closures
A closure is a function that retains access to its outer scope's variables even after the outer function has returned.

```javascript
function createCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    getCount: () => count
  };
}
const counter = createCounter();
counter.increment(); // 1 — `count` persists via closure
```

**Use cases:** Data privacy, factory functions, partial application, memoization.

### `call`, `apply`, `bind`

| Method | Syntax | Invocation |
|--------|--------|-----------|
| `call` | `fn.call(thisArg, arg1, arg2)` | Immediate, args individually |
| `apply` | `fn.apply(thisArg, [args])` | Immediate, args as array |
| `bind` | `fn.bind(thisArg, arg1)` | Returns new function |

```javascript
const obj = { name: 'Alice' };
function greet(greeting) { return `${greeting}, ${this.name}`; }

greet.call(obj, 'Hello');    // "Hello, Alice"
greet.apply(obj, ['Hello']); // "Hello, Alice"
const bound = greet.bind(obj);
bound('Hello');              // "Hello, Alice"
```

### Prototypes & Custom Methods
Every object has a `__proto__` chain. Add custom methods to built-in types via prototype:
```javascript
Array.prototype.last = function() { return this[this.length - 1]; };
[1, 2, 3].last(); // 3
```

### Object Immutability

| Method | Prevents | Add | Delete | Modify |
|--------|----------|-----|--------|--------|
| `Object.preventExtensions()` | Adding properties | No | Yes | Yes |
| `Object.seal()` | Adding/deleting | No | No | Yes |
| `Object.freeze()` | All mutations (shallow) | No | No | No |

For deep freeze, recursively freeze nested objects.

---

## Deep Dive

### Event Loop
JavaScript is single-threaded. The event loop manages async execution:

```
┌──────────────┐
│  Call Stack   │ ← Synchronous code executes here
└──────┬───────┘
       ↓
┌──────────────┐
│  Microtask Q  │ ← Promise callbacks, queueMicrotask, MutationObserver
└──────┬───────┘
       ↓
┌──────────────┐
│  Macrotask Q  │ ← setTimeout, setInterval, I/O, UI rendering
└──────────────┘
```

**Order:** Call stack empties → ALL microtasks → ONE macrotask → repeat.

```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// Output: 1, 4, 3, 2
```

### Callback Hell → Solutions
**Problem:** Deeply nested callbacks for sequential async operations.
```javascript
getData(a => {
  getMore(a, b => {
    getEvenMore(b, c => { /* pyramid of doom */ });
  });
});
```

**Solutions:**
1. **Promises:** `.then()` chaining flattens nesting
2. **Async/Await:** Synchronous-looking async code
3. **RxJS:** Observable streams with operators

```javascript
// Async/Await (cleanest)
async function fetchAll() {
  const a = await getData();
  const b = await getMore(a);
  const c = await getEvenMore(b);
  return c;
}
```

### `this` Context Rules
1. **Global:** `window` (browser) / `undefined` (strict mode)
2. **Method call:** `obj.method()` → `this` = `obj`
3. **Constructor:** `new Fn()` → `this` = new instance
4. **Explicit:** `call`/`apply`/`bind` → `this` = specified object
5. **Arrow function:** Inherits `this` from enclosing scope (lexical)

### Debounce vs Throttle

Both limit how often a function executes, but they work differently:

| | Debounce | Throttle |
|-|----------|----------|
| **Behavior** | Waits until user *stops* triggering, then executes once | Executes at most once per interval, even if triggered repeatedly |
| **Analogy** | Elevator door — resets wait timer every time someone enters | Gatekeeping — allows one person through every N seconds |
| **Use case** | Search input, window resize, form validation | Scroll events, button clicks, API polling |

**Debounce — Implementation:**
```javascript
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);                   // Reset timer on every call
    timer = setTimeout(() => {
      fn.apply(this, args);                // Execute after delay with no new calls
    }, delay);
  };
}

// Usage: API search — only fires 300ms after user stops typing
const searchInput = document.getElementById('search');
searchInput.addEventListener('input', debounce((e) => {
  fetch(`/api/search?q=${e.target.value}`)
    .then(res => res.json())
    .then(data => renderResults(data));
}, 300));
```

**How it works step-by-step:**
```
User types: H  e  l  l  o
Time:       0  50 100 150 200
                              ← 300ms of silence
                              ← NOW the function fires (once, with "Hello")
```

**Throttle — Implementation:**
```javascript
function throttle(fn, limit) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Usage: Scroll handler — fires at most once every 200ms
window.addEventListener('scroll', throttle(() => {
  console.log('Scroll position:', window.scrollY);
}, 200));
```

**In Angular (RxJS debounce):**
```typescript
this.searchControl.valueChanges.pipe(
  debounceTime(300),           // Built-in RxJS operator
  distinctUntilChanged(),       // Skip if same value
  switchMap(query => this.http.get(`/api/search?q=${query}`))
).subscribe(results => this.results = results);
```

**In React (custom hook):**
```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Usage
const debouncedSearch = useDebounce(searchTerm, 300);
useEffect(() => { fetchResults(debouncedSearch); }, [debouncedSearch]);
```

---

## Tradeoffs & Pitfalls

- **`==` vs `===`:** Always use `===` (strict equality). `==` does type coercion (`"0" == false` is `true`).
- **Arrow functions:** No own `this`, `arguments`, or `super`. Can't be used as constructors.
- **`typeof null === "object"`:** Known JS quirk. Check null explicitly.
- **Floating point:** `0.1 + 0.2 !== 0.3`. Use `toFixed()` or integer math for money.
- **Hoisting:** `var` declarations hoist but not assignments. `let`/`const` have temporal dead zone.
- **Reference vs Value:** Primitives are copied by value. Objects/arrays by reference. Use spread (`...`) or `structuredClone()` for deep copies.

---

## Interview Questions

1. **What is hoisting?** Variable/function declarations are moved to top of scope during compilation. `var` → `undefined`, `let`/`const` → TDZ error.
2. **Explain closures with example.** Function retaining outer scope variables after outer function returns. Used in module pattern, memoization.
3. **What is the event loop?** Mechanism that processes call stack, microtask queue (Promises), then macrotask queue (setTimeout) in a loop.
4. **Difference between `==` and `===`?** `==` coerces types before comparing. `===` compares type AND value.
5. **What is a Promise?** Object representing eventual completion/failure of an async operation. States: pending, fulfilled, rejected.
6. **`Promise.all` vs `Promise.allSettled` vs `Promise.race`?** `all` = fail-fast on first rejection. `allSettled` = wait for all, return all results. `race` = first to resolve/reject wins.
7. **What is debouncing vs throttling?** Debounce = execute after delay, reset on new trigger. Throttle = execute at most once per interval.
8. **Explain prototypal inheritance.** Objects inherit from other objects via prototype chain. `Object.create()`, `class extends`.

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
SCOPE:        var=function  let/const=block
ASYNC:        Callbacks → Promises → Async/Await
EVENT LOOP:   Stack → Microtasks (ALL) → Macrotask (ONE) → repeat
THIS:         Global | Method | Constructor | Explicit | Arrow (lexical)
COPY:         Shallow: spread/Object.assign  Deep: structuredClone()
IMMUTABLE:    preventExtensions < seal < freeze
EQUALITY:     Always use === (strict)
TYPES:        string, number, boolean, null, undefined, symbol, bigint, object
FALSY:        false, 0, "", null, undefined, NaN
```
