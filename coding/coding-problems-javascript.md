# Coding Problems — Interview Preparation

| # | Problem | Pattern | Difficulty | Time |
|---|---------|---------|------------|------|
| 1 | Two Sum / Pair Sum | Hash Set | Easy | O(n) |
| 2 | Longest Palindromic Substring | Expand from center | Medium | O(n²) |
| 3 | Merge Intervals | Sort + merge | Medium | O(n log n) |
| 4 | Second Highest Element | Single pass | Easy | O(n) |
| 5 | Max Consecutive Ones | Sliding window | Easy | O(n) |

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

## Problem 4: Second Highest Element

**Pattern:** Set deduplication + sorting
**Difficulty:** Easy

### Approach (Initial — has a flaw)
Sort descending, deduplicate with Set, return second element.

```javascript
const secondHighest = (arr) => {
  arr.sort((a, b) => b - a);
  const set = new Set(arr);
  if (set.size < 2) return null;
  return [...set][1];
};

console.log(secondHighest([5, 5]));       // null ✅ (only one unique value)
console.log(secondHighest([3, 1, 4, 4])); // 3 ✅
console.log(secondHighest([-5, -1, -3])); // -3 ❌ WRONG — returns -5 (Set doesn't preserve sort order)
```

**Problem:** `Set` preserves *insertion order*, but `sort((a,b) => b-a)` sorts descending by numeric value, so the Set seems to work — **except** `Set` does not re-sort. The real issue: this approach is O(n log n) due to sort, and the Set spread creates an extra array.

### Optimized — Single Pass O(n)
```javascript
function secondHighest(arr) {
  let first = -Infinity;
  let second = -Infinity;

  for (const num of arr) {
    if (num > first) {
      second = first;
      first = num;
    } else if (num > second && num !== first) {
      second = num;
    }
  }

  return second === -Infinity ? null : second;
}

console.log(secondHighest([5, 5]));         // null ✅
console.log(secondHighest([3, 1, 4, 4]));   // 3 ✅
console.log(secondHighest([-5, -1, -3]));   // -3 ✅
console.log(secondHighest([1]));            // null ✅
console.log(secondHighest([7, 7, 7]));      // null ✅
console.log(secondHighest([-10, -20, 0]));  // -10 ✅
```

### Complexity
| Approach | Time | Space |
|----------|------|-------|
| Sort + Set | O(n log n) | O(n) |
| **Single pass** | **O(n)** | **O(1)** |

### Edge Cases
- All elements are the same → return `null`
- Array has only one element → return `null`
- Negative numbers → must use `-Infinity` as initial values (not `0`)
- Duplicates of the highest → skip them (`num !== first` check)

---

## Problem 5: Max Consecutive Ones

**Pattern:** Sliding window / counter
**Difficulty:** Easy
**LeetCode:** #485

### Approach
Track a running count of consecutive 1s. Reset to 0 when a non-1 is encountered. Track the max seen so far.

### Code (JavaScript)
```javascript
var findMaxConsecutiveOnes = function(nums) {
  let count = 0;
  let max = 0;
  nums.forEach((ele) => {
    if (ele === 1) {
      count++;
      max = Math.max(count, max);
    } else {
      count = 0;
    }
  });
  return max;
};

console.log(findMaxConsecutiveOnes([1, 1, 0, 1, 1, 1])); // 3
console.log(findMaxConsecutiveOnes([1, 0, 1, 1, 0, 1])); // 2
console.log(findMaxConsecutiveOnes([0, 0, 0]));           // 0
console.log(findMaxConsecutiveOnes([1]));                  // 1
console.log(findMaxConsecutiveOnes([]));                   // 0
```

### Complexity
| | Time | Space |
|-|------|-------|
| **Single pass** | **O(n)** | **O(1)** |

### Variations
- **Max Consecutive Ones II** (LeetCode #487): You may flip at most one 0 → sliding window with at most one 0 inside
- **Max Consecutive Ones III** (LeetCode #1004): You may flip at most K zeros → sliding window tracking zero count

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
