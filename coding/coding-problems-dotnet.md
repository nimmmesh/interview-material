# Coding Problems (.NET / C#) — Interview Preparation

| # | Problem | Pattern | Difficulty | Time |
|---|---------|---------|------------|------|
| 1 | Two Sum / Pair Sum | HashSet | Easy | O(n) |
| 2 | Longest Palindromic Substring | Expand from center | Medium | O(n²) |
| 3 | Merge Intervals | Sort + merge | Medium | O(n log n) |
| 4 | Second Highest Element | Single pass | Easy | O(n) |
| 5 | Max Consecutive Ones | Sliding window | Easy | O(n) |
| 6 | LINQ One-Liners | LINQ | — | — |
| 7 | Matching Brackets | Stack | Easy | O(n) |

---

## Problem 1: Two Sum / Pair Sum

**Pattern:** HashSet lookup
**Difficulty:** Easy

### Code (C#)
```csharp
public static bool HasPairSum(int[] arr, int target)
{
    var seen = new HashSet<int>();
    foreach (var num in arr)
    {
        if (seen.Contains(target - num)) return true;
        seen.Add(num);
    }
    return false;
}

// Return indices variant
public static int[] TwoSum(int[] nums, int target)
{
    var map = new Dictionary<int, int>();
    for (int i = 0; i < nums.Length; i++)
    {
        int complement = target - nums[i];
        if (map.ContainsKey(complement))
            return new[] { map[complement], i };
        map[nums[i]] = i;
    }
    return Array.Empty<int>();
}
```

### Complexity
| | Time | Space |
|-|------|-------|
| Brute force (nested loops) | O(n²) | O(1) |
| **Optimized (HashSet)** | **O(n)** | **O(n)** |

---

## Problem 2: Longest Palindromic Substring

**Pattern:** Expand Around Center
**Difficulty:** Medium

### Code (C#)
```csharp
public static string LongestPalindrome(string s)
{
    if (string.IsNullOrEmpty(s)) return "";
    string longest = "";

    void Expand(int left, int right)
    {
        while (left >= 0 && right < s.Length && s[left] == s[right])
        {
            string sub = s.Substring(left, right - left + 1);
            if (sub.Length > longest.Length) longest = sub;
            left--;
            right++;
        }
    }

    for (int i = 0; i < s.Length; i++)
    {
        Expand(i, i);       // odd-length palindrome
        Expand(i, i + 1);   // even-length palindrome
    }
    return longest;
}
```

### Complexity
| | Time | Space |
|-|------|-------|
| **Expand around center** | **O(n²)** | **O(1)** |

---

## Problem 3: Merge Intervals

**Pattern:** Sort + Greedy Merge
**Difficulty:** Medium

### Code (C#)
```csharp
public static int[][] MergeIntervals(int[][] intervals)
{
    Array.Sort(intervals, (a, b) => a[0].CompareTo(b[0]));
    var result = new List<int[]> { intervals[0] };

    for (int i = 1; i < intervals.Length; i++)
    {
        var prev = result[^1]; // last element
        var curr = intervals[i];

        if (curr[0] <= prev[1])
        {
            prev[1] = Math.Max(prev[1], curr[1]);
        }
        else
        {
            result.Add(curr);
        }
    }
    return result.ToArray();
}

// Input:  [[1,3],[2,6],[8,10],[15,18]]
// Output: [[1,6],[8,10],[15,18]]
```

### Complexity
| | Time | Space |
|-|------|-------|
| **Sort + merge** | **O(n log n)** | **O(n)** |

---

## Problem 4: Second Highest Element

**Pattern:** Single pass tracking
**Difficulty:** Easy

### Code (C#)
```csharp
public static int? SecondHighest(int[] arr)
{
    if (arr.Length < 2) return null;

    int first = int.MinValue;
    int second = int.MinValue;

    foreach (var num in arr)
    {
        if (num > first)
        {
            second = first;
            first = num;
        }
        else if (num > second && num != first)
        {
            second = num;
        }
    }

    return second == int.MinValue ? null : second;
}

// LINQ alternative (less optimal but concise)
public static int? SecondHighestLinq(int[] arr)
{
    var distinct = arr.Distinct().OrderByDescending(x => x).ToList();
    return distinct.Count >= 2 ? distinct[1] : null;
}
```

### Complexity
| Approach | Time | Space |
|----------|------|-------|
| LINQ Distinct + OrderBy | O(n log n) | O(n) |
| **Single pass** | **O(n)** | **O(1)** |

---

## Problem 5: Max Consecutive Ones

**Pattern:** Counter
**Difficulty:** Easy

### Code (C#)
```csharp
public static int FindMaxConsecutiveOnes(int[] nums)
{
    int count = 0;
    int max = 0;

    foreach (var num in nums)
    {
        if (num == 1)
        {
            count++;
            max = Math.Max(count, max);
        }
        else
        {
            count = 0;
        }
    }
    return max;
}

// LINQ alternative
public static int FindMaxConsecutiveOnesLinq(int[] nums)
{
    return string.Join(",", nums)
        .Split('0')
        .Max(s => s.Split(',').Count(x => x == "1"));
}
```

### Complexity
| | Time | Space |
|-|------|-------|
| **Single pass** | **O(n)** | **O(1)** |

---

## Problem 6: LINQ One-Liners

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

## Problem 7: Matching Brackets (Valid Parentheses)

**Pattern:** Stack
**Difficulty:** Easy
**LeetCode:** #20

### Approach
Use a stack. For every opening bracket, push the corresponding closing bracket. For every closing bracket, check if it matches the top of the stack. If the stack is empty at the end, the string is valid.

### Code (C#)
```csharp
public static bool IsValid(string s)
{
    var stack = new Stack<char>();
    var map = new Dictionary<char, char>
    {
        { '(', ')' },
        { '{', '}' },
        { '[', ']' }
    };

    foreach (var c in s)
    {
        if (map.ContainsKey(c))
        {
            stack.Push(map[c]);
        }
        else
        {
            if (stack.Count == 0 || stack.Pop() != c) return false;
        }
    }
    return stack.Count == 0;
}

// Tests
Console.WriteLine(IsValid("()"));       // True
Console.WriteLine(IsValid("()[]{}"));   // True
Console.WriteLine(IsValid("(]"));       // False
Console.WriteLine(IsValid("([)]"));     // False
Console.WriteLine(IsValid("{[]}"));     // True
Console.WriteLine(IsValid(""));         // True
```

### Complexity
| | Time | Space |
|-|------|-------|
| **Stack** | **O(n)** | **O(n)** |

### Edge Cases
- Empty string → valid (return `true`)
- Odd-length string → always invalid (quick early return)
- Only opening brackets → invalid (stack not empty)
- Only closing brackets → invalid (`stack.Count == 0` check)

### Variations
- **Minimum Remove to Make Valid Parentheses** (LeetCode #1249): Track indices of invalid brackets
- **Longest Valid Parentheses** (LeetCode #32): Stack or DP, O(n)
- **Generate Parentheses** (LeetCode #22): Backtracking with open/close counts

---

## Quick Reference — Common Patterns

```
TWO SUM:          HashSet/Dictionary → O(n)
SLIDING WINDOW:   Two pointers, expand/shrink window
MERGE INTERVALS:  Array.Sort + greedy merge
PALINDROME:       Expand around center → O(n²)
BINARY SEARCH:    Sorted array, halve search space → O(log n)
STACK:            Matching brackets, next greater element
LINQ:             GroupBy | Where | Select | OrderBy | Distinct | SelectMany
COLLECTIONS:      HashSet<T> | Dictionary<K,V> | List<T> | SortedSet<T>
STRING:           Substring | Split | Join | ToCharArray | StringBuilder
```
