# Frontend Interview Notes (React)

## React State Management

State management refers to how application data is stored and shared
across components.

### Local State

Managed inside components using hooks.

Example:

    const [count, setCount] = useState(0);

Used for: - UI state - component-specific data

------------------------------------------------------------------------

### Global State

Used when multiple components need shared data.

Common solutions:

1.  Redux
2.  Context API
3.  Zustand
4.  Recoil

------------------------------------------------------------------------

### Redux Flow

    Component
     ↓
    Dispatch Action
     ↓
    Reducer
     ↓
    Store Updates
     ↓
    UI Re-renders

Benefits:

-   predictable state updates
-   centralized state
-   debugging support
