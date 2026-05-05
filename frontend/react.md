# React — Interview Preparation

---

## Core Concepts

### State Management

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

## Quick Reference

```
LOCAL:    useState (component) | useReducer (complex local)
GLOBAL:   Context (simple) | Redux (complex) | Zustand (lightweight) | Recoil (atoms)
REDUX:    dispatch → reducer → store → UI
HOOKS:    useState | useEffect | useContext | useReducer | useMemo | useCallback | useRef
```
