# CSS — Interview Preparation

---

## Core Concepts

### CSS Specificity

> ***Specificity determines which CSS rule wins. Higher specificity = higher priority.***

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

> ⚠️ **Avoid `!important`** — makes debugging/overriding painful. Use it only as a last resort.

**Best Practices:**
- Prefer classes over IDs for styling (lower specificity = easier to override)
- Use BEM naming convention (`.block__element--modifier`) to avoid specificity wars
- Inline styles should be reserved for dynamic/JS-driven styles only

---

## Quick Reference

```
SPECIFICITY:  !important > inline > #id > .class > element > *
CALCULATION:  (inline, IDs, classes, elements) — compare left to right
TIE-BREAKER:  Last rule in source order wins
BEST PRACTICE: Prefer classes, avoid !important, use BEM naming
```
