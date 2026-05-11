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
GLOBAL:   Context (simple) | Redux (complex) | Zustand (lightweight) | Recoil (atoms)
REDUX:    dispatch → reducer → store → UI
HOOKS:    useState | useEffect | useContext | useReducer | useMemo | useCallback | useRef
```
