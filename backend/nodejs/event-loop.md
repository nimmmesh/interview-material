# Node.js Event Loop — Interview Preparation

---

## Core Concepts

### Event Loop

> ***Single-threaded JS uses a loop: Call Stack → all Microtasks → one Macrotask → repeat.***

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

| Microtasks 🔵 | Macrotasks 🟠 |
|---------------|---------------|
| `Promise.then` / `catch` / `finally` | `setTimeout` / `setInterval` |
| `await` continuation | `setImmediate` |
| `process.nextTick` | I/O callbacks |
| `queueMicrotask` | DOM events |

> ⚡ **Key Rule:** ALL microtasks drain completely before the event loop processes the **next macrotask**.

```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// Output: 1, 4, 3, 2
```

---

## Deep Dive

### Event Loop Execution Order — Async Interview Question

> 💡 **Interview tip:** Walk through the code aloud, labeling each line as SYNC / MICRO / MACRO.

```javascript
console.log("A");                          // 1️⃣ SYNC — prints immediately

setTimeout(() => console.log("B"), 0);     // 📥 → Macrotask queue

Promise.resolve().then(() => {
  console.log("C");                        // 3️⃣ MICRO — runs after all sync
  setTimeout(() => console.log("D"), 0);   // 📥 → Macrotask queue (scheduled during micro phase)
});

(async function () {
  console.log("E");                        // 2️⃣ SYNC — before await
  await Promise.resolve();
  console.log("F");                        // 4️⃣ MICRO — code after await = microtask
})();

console.log("G");                          // 1️⃣ SYNC — prints immediately

// Output: A → E → G → C → F → B → D
//         ───SYNC───   ─MICRO─   ─MACRO─
```

#### Execution Breakdown

| Phase | What runs | Output |
|-------|-----------|--------|
| 🔴 **Synchronous** | `console.log("A")`, `console.log("E")` (before await), `console.log("G")` | `A E G` |
| 🔵 **Microtasks** | `.then()` → `"C"`, `await` continuation → `"F"` | `C F` |
| 🟠 **Macrotasks** | `setTimeout` → `"B"`, inner `setTimeout` → `"D"` | `B D` |

> ⚡ **Core Rule:**
> ```
> 1. Call Stack (Synchronous code)
> 2. Microtask Queue (Promises, async/await)
> 3. Macrotask Queue (setTimeout, setInterval)
> ```

> ⚠️ **`async/await` gotcha:** Code *before* `await` runs **synchronously**. Code *after* `await` becomes a **microtask**.

#### Quick Interview Explanation

> *"JavaScript first runs synchronous code, then processes all microtasks like Promise callbacks and async/await continuations, and finally processes macrotasks like setTimeout callbacks."*

---

### Callback Hell → Solutions

> ***Deeply nested callbacks → flatten with Promises or async/await.***

```javascript
// ❌ Callback Hell (pyramid of doom)
getData(a => {
  getMore(a, b => {
    getEvenMore(b, c => { /* deeply nested */ });
  });
});

// ✅ Async/Await (cleanest)
async function fetchAll() {
  const a = await getData();
  const b = await getMore(a);
  const c = await getEvenMore(b);
  return c;
}
```

| Solution | How |
|----------|-----|
| **Promises** | `.then()` chaining flattens nesting |
| **Async/Await** | Synchronous-looking async code |
| **RxJS** | Observable streams with operators |

---

## Node.js Event Loop Phases (Advanced)

> ***Node.js has **6 phases** per loop iteration, managed by libuv.***

```
   ┌───────────────────────────┐
┌─>│        1. timers          │  ← setTimeout, setInterval callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │   2. pending callbacks    │  ← I/O callbacks deferred to next loop
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     3. idle, prepare      │  ← Internal use only
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │         4. poll           │  ← Retrieve new I/O events, execute I/O callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │        5. check           │  ← setImmediate() callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │    6. close callbacks     │  ← socket.on('close'), cleanup
│  └───────────────────────────┘
```

### `setImmediate()` vs `setTimeout()` vs `process.nextTick()`

#### ⚡ Execution Priority

```
🔴 process.nextTick()     ← highest (before ALL I/O)
🟠 Promise.then()
🟡 setTimeout(fn, 0)      ← timer phase
🟢 setImmediate()         ← check phase (lowest outside I/O)
```

| | `process.nextTick()` | `setImmediate()` | `setTimeout(fn, 0)` |
|-|---------------------|-------------------|---------------------|
| **Queue** | Microtask (before Promises) | Check phase | Timer phase |
| **When** | After current op, before ANY I/O | After I/O poll phase | After minimum delay |
| **Use case** | Ensure callback runs before any I/O | Run after current I/O events | General deferred execution |

```javascript
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));

// ✅ Guaranteed order:
// nextTick    ← always first
// promise     ← microtask, after nextTick
// timeout OR immediate  ← non-deterministic outside I/O
```

> ⚠️ **Inside I/O callbacks, order IS guaranteed:**

```javascript
const fs = require('fs');

fs.readFile('file.txt', () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
  // ✅ Always: immediate, timeout — setImmediate runs in check phase, right after poll
});
```

---

## Interview Questions — Rapid Fire

| # | Question | Answer |
|---|----------|--------|
| 1 | **What is the Event Loop?** | Mechanism that processes call stack → microtasks (Promises) → macrotasks (setTimeout) in a loop |
| 2 | **Microtask vs Macrotask?** | Microtasks (Promises, nextTick) run before macrotasks (setTimeout, I/O). **ALL** microtasks drain first |
| 3 | **What is `process.nextTick()`?** | Runs callback after current op, **before any I/O or timers**. Higher priority than Promises |
| 4 | **`setImmediate` vs `setTimeout(0)`?** | Inside I/O: **setImmediate always first**. Outside I/O: non-deterministic |
| 5 | **Is Node.js single-threaded?** | Yes for JS execution. But libuv uses **4 threads** (default) for file I/O, DNS, crypto |
| 6 | **What is callback hell?** | Deeply nested callbacks. Fix with Promises, async/await, or RxJS |
| 7 | **Block the event loop?** | All async stalls — no I/O, no timers, no requests. Use `worker_threads` for CPU work |
| 8 | **`async/await` + event loop?** | Code after `await` is scheduled as a **microtask**, just like `.then()` |

---

## Quick Reference

```
EVENT LOOP:   Call Stack → Microtasks (ALL) → Macrotask (ONE) → repeat
MICROTASKS:   process.nextTick > Promise.then > queueMicrotask
MACROTASKS:   setTimeout | setInterval | setImmediate | I/O callbacks
NODE PHASES:  timers → pending → idle → poll → check → close
PRIORITY:     nextTick > Promises > timers > setImmediate (outside I/O)
INSIDE I/O:   setImmediate always before setTimeout(0)
THREAD POOL:  libuv uses 4 threads (UV_THREADPOOL_SIZE) for file I/O, DNS, crypto
BLOCKING:     Never block event loop — use worker_threads for CPU-intensive tasks
```
