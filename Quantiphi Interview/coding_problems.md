# C# Coding Practice Problems

## Problem 1: Top K Frequent Elements

Given a list of numbers, return the top K most frequent.

Solution:

``` csharp
var result = nums
    .GroupBy(x => x)
    .OrderByDescending(g => g.Count())
    .Take(k)
    .Select(g => g.Key);
```

------------------------------------------------------------------------

## Problem 2: First Non-Repeating Character

    string input = "swiss";

    var result = input
        .GroupBy(c => c)
        .Where(g => g.Count() == 1)
        .Select(g => g.Key)
        .FirstOrDefault();

------------------------------------------------------------------------

## Problem 3: Flatten Nested Lists

    var flat = list.SelectMany(x => x);

------------------------------------------------------------------------

## Problem 4: Count Word Frequency

    var freq = words
        .GroupBy(w => w)
        .ToDictionary(g => g.Key, g => g.Count());

------------------------------------------------------------------------

## Problem 5: Find Duplicate Numbers

    var duplicates = nums
        .GroupBy(x => x)
        .Where(g => g.Count() > 1)
        .Select(g => g.Key);
