// Given a string s, return the longest palindromic substring in s.
// 
// Example 1:
// Input: s = "babad"

// Output: "bab"
// Explanation: "aba" is also a valid answer.
// Example 2:
// 
// Input: s = "cbbd"
// Output: "bb"

const s = "cbbd";
let longest = "";

const expand = (left, right) => {
    while(left>=0 && right < s.length && s[left]===s[right]) {
        const str = s.substring(left, right + 1);
        if (str.length > longest.length) {
            longest = str;
        }
        left--;
        right++;
    }
}

const longestPalindrome = (str) => {
    for (i=0; i<str.length; i++) {
        expand(i,i); // odd palindrome
        expand(i, i + 1); // even palindrome
    }
    console.log(longest);
}

longestPalindrome(s);
