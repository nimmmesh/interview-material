function isPairContainsSum (arr, sum) {
  const len = arr.length //5
  for (let i = 0; i <= len - 1; i++) {
    for (let j = i + 1; j <= len - 1; j++) {
      let sumOfPair = arr[i] + arr[j]
      if (sumOfPair === sum) {
        console.log('Sum of ' + arr[i] + ' & ' + arr[j])
        return true
      }
    }
  }
  return false
}

//console.log(isPairContainsSum(array1, sum))

const array1 = [3, 4, 7, 3, 22, 33, 9, 54]
let resultSum = 87

function isPairContainsSumOptimized (arr, sum) { 
  var mySet = new Set()
  for (const num of arr) {       
    if (mySet.has(num)) {        
      return true
    }
    mySet.add(sum - num)  
    //console.log(mySet);
  }
  return false
}

const array2 = [3, 4, 7, 3, 22, 33, 9, 54]
function chatGpt (arr, sum) {
  var mySet = new Set()
  for (const num of arr) {
    const comp = sum - num
    if (mySet.has(comp)) {
         console.log('Sum of ' + num + ' & ' + comp)
      return true
    }
    mySet.add(num)
    console.log(mySet);
  }
  return false
}

console.log(isPairContainsSumOptimized(array1, resultSum))
console.log(chatGpt(array1, resultSum))