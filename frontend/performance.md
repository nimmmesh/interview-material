# Frontend Performance — Interview Preparation

---

## Core Techniques

> ***Reduce what you ship, defer what you can, cache what doesn't change.***

| Technique | Impact |
|-----------|--------|
| Minification & compression | Smaller file sizes, faster downloads |
| Bundling | Fewer HTTP requests |
| Lazy loading | Load modules/images on demand |
| CDN | Serve static assets from nearest edge server |
| Dynamic paging | Don't load **10K** rows at once |
| OnPush change detection | Reduce unnecessary Angular re-renders |
| `trackBy` in `*ngFor` | Avoid full DOM re-render on list changes |

---

## Quick Reference

```
NETWORK:    Minify | Bundle | Compress (gzip/brotli) | CDN | HTTP/2
RENDERING:  Lazy load | Virtual scrolling | Pagination | Skeleton screens
ANGULAR:    OnPush | trackBy | async pipe | @defer | Signals
REACT:      React.memo | useMemo | useCallback | lazy() + Suspense
IMAGES:     WebP/AVIF | srcset | lazy loading | CDN resizing
CACHING:    Service Worker | Cache-Control headers | ETag
```
