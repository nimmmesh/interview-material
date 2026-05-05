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
