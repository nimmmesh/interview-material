# React — Interview Preparation

---

## Core Concepts

### State Management

> ***Local state = `useState`. Global state = Redux / Context / Zustand. Pick by complexity.***

| Scope | Tool | Use Case |
|-------|------|----------|
| **Local** | `useState` | UI state, component-specific data |
| **Global** | Redux / Context / Zustand / Recoil | Shared data across components |

### Local State
```jsx
const [count, setCount] = useState(0);
```

### Global State Options

| Solution | Best For | Complexity |
|----------|----------|------------|
| **Context API** | Simple shared state (theme, auth) | Low |
| **Redux** | Large apps, complex flows, team standardization | High |
| **Zustand** | Lightweight Redux alternative | Low |
| **Recoil** | Fine-grained atom-based state | Medium |

### Redux Flow
```
Component → dispatch(action) → Reducer → Store updates → UI re-renders
```

**Benefits:** Predictable state updates, centralized state, time-travel debugging.

### Context API vs Redux

> ***Context = prop-drilling escape hatch. Redux = predictable state management system. Different tools for different problems.***

| | Context API | Redux |
|-|------------|-------|
| **Purpose** | Avoid prop drilling for shared values | Full state management with predictable updates |
| **Complexity** | Low (built into React) | High (actions, reducers, middleware, store) |
| **Re-renders** | ALL consumers re-render when value changes | Only connected components with changed state |
| **DevTools** | None built-in | Time-travel debugging, action logging |
| **Middleware** | None | Redux Thunk, Redux Saga (async logic) |
| **Scalability** | Poor for frequent updates | Designed for complex, large-scale state |
| **Best for** | Theme, locale, auth, user preferences | Cart, forms, dashboards, real-time data |

```tsx
// Context API — simple global state (theme)
const ThemeContext = createContext<'light' | 'dark'>('light');

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  return (
    <ThemeContext.Provider value={theme}>
      <Header />
      <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
        Toggle
      </button>
    </ThemeContext.Provider>
  );
}

function Header() {
  const theme = useContext(ThemeContext); // No prop drilling needed
  return <header className={theme}>...</header>;
}
```

**When Context causes problems:**
```tsx
// ❌ BAD — all consumers re-render when ANY value changes
<AppContext.Provider value={{ user, cart, theme, notifications }}>
  {children}
</AppContext.Provider>
// Changing `notifications` re-renders components that only use `theme`

// ✅ FIX — split into separate contexts
<UserContext.Provider value={user}>
  <CartContext.Provider value={cart}>
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  </CartContext.Provider>
</UserContext.Provider>
```

**Senior-Level Answer:** "Context and Redux solve different problems. Context is a dependency injection mechanism — it prevents prop drilling for values that change infrequently (theme, auth, locale). Redux is a state management system for complex, frequently-changing state where you need predictable updates, middleware for side effects, and debugging tools. The mistake I see is using Context for high-frequency state like shopping carts — it causes unnecessary re-renders because all consumers update when the provider value changes."

---

## Hooks Optimization — Deep Dive

### React Re-rendering — How It Works

```
State/props change
       │
       ▼
Component re-renders
       │
       ▼
ALL child components re-render too (by default)
       │
       ▼
Virtual DOM diff → only changed DOM nodes updated
```

> ***Virtual DOM diffing is fast, but re-rendering 1000 child components to diff them is not.***

### `React.memo` — Prevent Child Re-renders

Wraps a component to skip re-rendering when its props haven't changed (shallow comparison).

```tsx
// ❌ Without memo — ChildList re-renders every time Parent re-renders
function ChildList({ items }: { items: string[] }) {
  console.log('ChildList rendered');  // Logs on EVERY parent render
  return <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>;
}

// ✅ With memo — skips re-render if `items` reference hasn't changed
const ChildList = React.memo(({ items }: { items: string[] }) => {
  console.log('ChildList rendered');  // Only logs when items actually change
  return <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>;
});
```

### `useMemo` — Cache Expensive Computations

```tsx
function Dashboard({ orders }: { orders: Order[] }) {
  // ❌ Without useMemo — recalculates on EVERY render (even if orders didn't change)
  const stats = calculateExpensiveStats(orders);

  // ✅ With useMemo — recalculates ONLY when `orders` changes
  const stats = useMemo(() => calculateExpensiveStats(orders), [orders]);

  return <StatsPanel data={stats} />;
}
```

**When to use `useMemo`:**
- Expensive calculations (filtering/sorting large arrays, aggregations)
- Creating objects/arrays passed as props to memoized children
- Deriving data from state (computed values)

**When NOT to use:**
```tsx
// ❌ Pointless — simple operations are faster without memo overhead
const fullName = useMemo(() => `${first} ${last}`, [first, last]);
// ✅ Just compute it
const fullName = `${first} ${last}`;
```

### `useCallback` — Cache Function References

Functions are recreated on every render. This breaks `React.memo` on child components receiving those functions as props.

```tsx
function Parent() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');

  // ❌ Without useCallback — new function reference every render
  // ExpensiveList re-renders when `text` changes even though `handleDelete` logic didn't change
  const handleDelete = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // ✅ With useCallback — same function reference across renders
  const handleDelete = useCallback((id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []); // Empty deps = function never changes

  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <ExpensiveList items={items} onDelete={handleDelete} />
    </>
  );
}

const ExpensiveList = React.memo(({ items, onDelete }) => {
  // Only re-renders when items or onDelete reference changes
  return items.map(item => (
    <Item key={item.id} data={item} onDelete={onDelete} />
  ));
});
```

### The `useMemo` + `useCallback` + `React.memo` Triad

```
React.memo      → Prevents component re-render when props unchanged
  ↑ requires
useMemo         → Ensures object/array props maintain same reference
useCallback     → Ensures function props maintain same reference
```

**Complete production example — search with filters:**
```tsx
function ProductSearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);

  // Memoize filtered results — only recalculates when products or filters change
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .filter(p => category === 'all' || p.category === category);
  }, [products, query, category]);

  // Memoize callback — same reference unless dependencies change
  const handleAddToCart = useCallback((productId: number) => {
    cartService.add(productId);
  }, []);

  return (
    <>
      <SearchBar value={query} onChange={setQuery} />
      <CategoryFilter value={category} onChange={setCategory} />
      <ProductList products={filteredProducts} onAddToCart={handleAddToCart} />
    </>
  );
}

// Memoized child — only re-renders when filtered products or handler changes
const ProductList = React.memo(({ products, onAddToCart }: Props) => {
  return products.map(p => (
    <ProductCard key={p.id} product={p} onAdd={() => onAddToCart(p.id)} />
  ));
});
```

### Common Misuse Patterns

| Misuse | Problem | Fix |
|--------|---------|-----|
| `useMemo` for simple operations | Memo overhead > computation cost | Just compute directly |
| `useCallback` without `React.memo` child | Function is cached but child re-renders anyway | Wrap child in `React.memo` or remove `useCallback` |
| Missing dependencies in deps array | Stale closures — function uses old values | Include all used variables in deps array |
| Memoizing everything | Over-optimization, harder to read/debug | Profile first, memo only bottlenecks |
| `useMemo` with new object in deps | `useMemo(() => ..., [{ id: 1 }])` — new object ref every render | Destructure or use primitive deps |

### `useEffect` vs `useLayoutEffect`

| | `useEffect` | `useLayoutEffect` |
|-|------------|-------------------|
| **When runs** | After paint (async) | After DOM mutation, before paint (sync) |
| **Blocks paint?** | No | Yes — blocks visual update until complete |
| **Use case** | API calls, subscriptions, analytics | DOM measurements, scroll position, animations |
| **Performance** | Non-blocking (preferred) | Blocking (use sparingly) |
| **SSR** | Works | Warning in SSR (no DOM to measure) |

```tsx
// useEffect — runs AFTER the browser paints
useEffect(() => {
  fetchUserData(userId);  // Non-blocking — user sees initial render immediately
}, [userId]);

// useLayoutEffect — runs BEFORE the browser paints
useLayoutEffect(() => {
  // Measure DOM element and adjust position BEFORE user sees it
  // Prevents visual "flicker" of elements jumping positions
  const rect = elementRef.current.getBoundingClientRect();
  setPosition({ top: rect.top, left: rect.left });
}, []);
```

**When to use `useLayoutEffect`:**
```tsx
// Tooltip positioning — must measure BEFORE paint to avoid flicker
useLayoutEffect(() => {
  const tooltip = tooltipRef.current;
  const trigger = triggerRef.current;
  const triggerRect = trigger.getBoundingClientRect();

  tooltip.style.top = `${triggerRect.bottom + 8}px`;
  tooltip.style.left = `${triggerRect.left}px`;
}, [isVisible]);
```

> 💡 **Rule of thumb:** Always start with `useEffect`. Switch to `useLayoutEffect` only if you see visual flickering caused by DOM measurements.

**Senior-Level Answer:** "`useMemo` and `useCallback` are referential stability tools, not performance tools by themselves. They become valuable only when paired with `React.memo` on child components. The pattern is: `React.memo` prevents a child from re-rendering when props haven't changed, but it uses shallow comparison — so `useMemo` ensures object/array props maintain the same reference, and `useCallback` does the same for function props. I profile with React DevTools first and only add memoization where I see actual re-render bottlenecks."

---

## Microfrontends

### What is a Microfrontend?

> ***Split a monolithic frontend into independently deployable UI apps that compose into one experience.***

A microfrontend extends microservice principles to the frontend.

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

> ⚡ **In CI/CD:** Add `npm audit --audit-level=high` to fail builds on high/critical vulnerabilities.

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
LOCAL:    useState (component) | useReducer (complex local)
GLOBAL:   Context (simple, low-frequency) | Redux (complex, high-frequency) | Zustand (lightweight)
REDUX:    dispatch → reducer → store → UI
HOOKS:    useState | useEffect | useContext | useReducer | useMemo | useCallback | useRef
MEMO:     React.memo (component) + useMemo (values) + useCallback (functions) = prevent re-renders
EFFECT:   useEffect (after paint, async) | useLayoutEffect (before paint, sync DOM measurements)
CONTEXT:  Avoid for high-frequency updates. Split providers. Use Redux/Zustand for complex state
OPTIMIZE: Profile first → React.memo children → useMemo/useCallback for their props
```
