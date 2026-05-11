# JavaScript — Interview Preparation

---

## Core Concepts

### `var` vs `let` vs `const`

| | `var` | `let` | `const` |
|-|-------|-------|---------|
| Scope | Function | Block | Block |
| Hoisting | Yes (initialized as `undefined`) | Yes (TDZ — not accessible) | Yes (TDZ) |
| Re-declaration | Yes | No | No |
| Re-assignment | Yes | Yes | No |

### Closures

> ***A function that retains access to its outer scope’s variables even after the outer function has returned.***

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

### `sessionStorage` vs `localStorage` vs Cookies

| | `localStorage` | `sessionStorage` | Cookies |
|-|---------------|------------------|--------|
| **Capacity** | ~5-10 MB | ~5 MB | ~4 KB |
| **Lifetime** | Permanent (until manually cleared) | Until tab/window closes | Configurable (`Expires` / `Max-Age`) |
| **Scope** | Same origin, all tabs | Same origin, **same tab only** | Same origin, sent with every HTTP request |
| **Sent to server?** | No | No | Yes — automatically with every request |
| **Access** | JavaScript only | JavaScript only | JavaScript (unless `HttpOnly`) + server |
| **Use case** | User preferences, theme, cached data | Wizard form state, one-time session data | Auth tokens, session IDs, tracking |
| **XSS vulnerable?** | Yes | Yes | No (if `HttpOnly` flag set) |

```javascript
// localStorage — persists across tabs and browser restarts
localStorage.setItem('theme', 'dark');
localStorage.getItem('theme');          // 'dark'
localStorage.removeItem('theme');
localStorage.clear();                   // Remove all

// sessionStorage — same API, but tab-scoped
sessionStorage.setItem('step', '3');
sessionStorage.getItem('step');         // '3' — gone when tab closes

// Cookies — set via document.cookie (or from server via Set-Cookie header)
document.cookie = 'token=abc123; Secure; SameSite=Strict; Max-Age=3600';
```

**Security best practices for tokens:**
- **Auth tokens (JWT):** Store in `HttpOnly` cookies (not accessible via JS → XSS safe)
> ⚠️ **Never store sensitive data in `localStorage`** — vulnerable to XSS attacks.

**When to use what:**
```
Auth tokens       → HttpOnly cookies (most secure)
User preferences  → localStorage (persists across sessions)
Form wizard state → sessionStorage (auto-clears on tab close)
Tracking/consent  → cookies (server needs access)
```

---

## Tradeoffs & Pitfalls

> ⚡ **Always use `===`** (strict equality). `==` does type coercion (`"0" == false` is `true`).
- **Arrow functions:** No own `this`, `arguments`, or `super`. Can't be used as constructors.
- **`typeof null === "object"`:** Known JS quirk. Check null explicitly.
- **Floating point:** `0.1 + 0.2 !== 0.3`. Use `toFixed()` or integer math for money.
- **Hoisting:** `var` declarations hoist but not assignments. `let`/`const` have temporal dead zone.
- **Reference vs Value:** Primitives are copied by value. Objects/arrays by reference. Use spread (`...`) or `structuredClone()` for deep copies.

---

## Interview Questions

| # | Question | Answer |
|---|----------|--------|
| 1 | **What is hoisting?** | Declarations moved to top of scope. `var` → `undefined`, `let`/`const` → TDZ error |
| 2 | **Explain closures** | Function retaining outer scope variables after outer function returns. Used in module pattern, memoization |
| 3 | **What is the event loop?** | Processes call stack → microtask queue (Promises) → macrotask queue (setTimeout) in a loop |
| 4 | **`==` vs `===`?** | `==` coerces types. `===` compares type **AND** value |
| 5 | **What is a Promise?** | Object representing eventual completion/failure. States: **pending**, **fulfilled**, **rejected** |
| 6 | **`Promise.all` vs `allSettled` vs `race`?** | `all` = fail-fast. `allSettled` = wait for all. `race` = first to settle wins |
| 7 | **Debouncing vs throttling?** | Debounce = execute after delay, reset on new trigger. Throttle = at most once per interval |
| 8 | **Prototypal inheritance?** | Objects inherit via prototype chain. `Object.create()`, `class extends` |

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
