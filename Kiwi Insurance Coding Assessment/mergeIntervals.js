// Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.
// 
//  
// 
// Example 1:
// 
// Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
// [1,3] --> 1,2,3
//[2,6] --> 2,3,4,5,6
// 1,2,3,4,5,6 --> [1,6]
// Output: [[1,6],[8,10],[15,18]]
// Explanation: Since intervals [1,3] and [2,6] overlap, merge them into [1,6].
// Example 2:
// 
// Input: intervals = [[1,4],[4,5]]
// Output: [[1,5]]
// Explanation: Intervals [1,4] and [4,5] are considered overlapping.
// Example 3:
// 
// Input: intervals = [[4,7],[1,4]]
// Output: [[1,7]]
// Explanation: Intervals [1,4] and [4,7] are considered overlapping.
// 

const mergeIntervals = (intervals) => {
    intervals.sort((a,b) => a[0] - b[0]);
    const result = [];
    result.push(intervals[0]);
    
    for(i=1; i<intervals.length; i++) {
        const current = intervals[i];
        const prev = result[result.length - 1];
        if (current[0] <= prev[1]) {
            prev[1] = Math.max(prev[1], current[1]);
        } else {
            result.push(current);
        }
    }
    
    return result;
}

const input1 = [[1,3],[2,6],[8,10],[15,18]];
const input2 = [[1,4],[4,5]];
const input3 = [[4,7],[1,4]];

console.log(mergeIntervals(input3));