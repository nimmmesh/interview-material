# Coding Problems — Interview Preparation

---

## Problem 1: Two Sum / Pair Sum

**Pattern:** Hash Set lookup
**Difficulty:** Easy

### Approach
For each number, check if `target - num` exists in a set. If yes, pair found. Otherwise, add `num` to set.

### Code (JavaScript)
```javascript
function hasPairSum(arr, target) {
  const seen = new Set();
  for (const num of arr) {
    if (seen.has(target - num)) return true;
    seen.add(num);
  }
  return false;
}
```

### Complexity
| | Time | Space |
|-|------|-------|
| Brute force (nested loops) | O(n²) | O(1) |
| **Optimized (hash set)** | **O(n)** | **O(n)** |

### Variations
- Return indices instead of boolean (use Map instead of Set)
- Find all pairs (don't return early)
- Three Sum (sort + two pointers, O(n²))

---

## Problem 2: Longest Palindromic Substring

**Pattern:** Expand Around Center
**Difficulty:** Medium

### Approach
For each index, expand outward while characters match. Check both odd-length (center = single char) and even-length (center = between two chars) palindromes.

### Code (JavaScript)
```javascript
function longestPalindrome(s) {
  let longest = "";

  const expand = (left, right) => {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      const sub = s.substring(left, right + 1);
      if (sub.length > longest.length) longest = sub;
      left--;
      right++;
    }
  };

  for (let i = 0; i < s.length; i++) {
    expand(i, i);     // odd-length palindrome
    expand(i, i + 1); // even-length palindrome
  }
  return longest;
}
```

### Complexity
| | Time | Space |
|-|------|-------|
| **Expand around center** | **O(n²)** | **O(1)** |
| Manacher's algorithm | O(n) | O(n) |

### Variations
- Longest palindromic subsequence (DP)
- Count palindromic substrings
- Check if string can form palindrome (character frequency)

---

## Problem 3: Merge Intervals

**Pattern:** Sort + Greedy Merge
**Difficulty:** Medium

### Approach
Sort intervals by start time. Iterate: if current overlaps with previous result, extend the end. Otherwise, push new interval.

### Code (JavaScript)
```javascript
function mergeIntervals(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const result = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const prev = result[result.length - 1];
    const curr = intervals[i];
    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      result.push(curr);
    }
  }
  return result;
}
// Input:  [[1,3],[2,6],[8,10],[15,18]]
// Output: [[1,6],[8,10],[15,18]]
```

### Complexity
| | Time | Space |
|-|------|-------|
| **Sort + merge** | **O(n log n)** | **O(n)** |

### Variations
- Insert interval into sorted non-overlapping list
- Meeting rooms (can attend all? → check for any overlap)
- Meeting rooms II (min rooms needed → min heap)

---

## Problem 4: LINQ One-Liners (C#)

**Pattern:** GroupBy + Aggregation

### Top K Frequent Elements
```csharp
var result = nums.GroupBy(x => x)
    .OrderByDescending(g => g.Count())
    .Take(k)
    .Select(g => g.Key);
```

### First Non-Repeating Character
```csharp
var result = input.GroupBy(c => c)
    .Where(g => g.Count() == 1)
    .Select(g => g.Key)
    .FirstOrDefault();
```

### Flatten Nested Lists
```csharp
var flat = list.SelectMany(x => x);
```

### Word Frequency Dictionary
```csharp
var freq = words.GroupBy(w => w)
    .ToDictionary(g => g.Key, g => g.Count());
```

### Find Duplicates
```csharp
var duplicates = nums.GroupBy(x => x)
    .Where(g => g.Count() > 1)
    .Select(g => g.Key);
```

---

## Quick Reference — Common Patterns

```
TWO SUM:          Hash Set/Map → O(n)
SLIDING WINDOW:   Two pointers, expand/shrink window
MERGE INTERVALS:  Sort by start, greedy merge
PALINDROME:       Expand around center → O(n²)
BINARY SEARCH:    Sorted array, halve search space → O(log n)
BFS/DFS:          Graph/tree traversal
DYNAMIC PROG:     Overlapping subproblems + optimal substructure
GREEDY:           Local optimal → global optimal
STACK:            Matching brackets, next greater element
HEAP:             Top K elements, merge K sorted lists
```
