import deepEql from 'deep-eql'

export function stringify(value) {
  return JSON.stringify(value, null, '\t')
}

function extractKeysFromString(keyAsString) {
	// Convert propAddress string to array of keys
  // Before: "projects[5].window"
  // After: ["projects", 5, "window"]
  const regex = /[^\.\[\]]+?(?=\.|\[|\]|$)/g
  const keys = keyAsString.match(regex)
  if (keys && keys.length) {
    keys.forEach((p, index, thisArray) => {
      // Find strings that are just integers, and convert to integers
      if (/\d/.test(p)) {
        thisArray[index] = parseInt(p, 10)
      }
    })
  }
  return keys
}

const getNestedObject = (nestedObj, pathArr) => {
	return pathArr.reduce((obj, key) =>
		(obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
}

export function hasChanged(keysAsString = undefined, objA, objB) {
  if (keysAsString && keysAsString !== '*') {
    const keys = extractKeysFromString(keysAsString)
    const objAVal = getNestedObject(objA, keys)
    const objBVal = getNestedObject(objB, keys)
    if (objAVal == undefined || objBVal == undefined) {
      // If either is undefined, return undefined
      return undefined
    } else if (typeof objAVal == 'object' && typeof objBVal == 'object') {
      // If both are objects, do a deep object comparison
      return !deepEql(objAVal, objBVal)
    } else {
      // Else, compare values
      return objAVal !== objBVal
    }
  } else {
    return !deepEql(objA, objB)
  }
}

export function hasChangedTo(keysAsString, value, objTo, objFrom) {
  if (!keysAsString || !value ) {
    // If either required arguments are missing or empty, return undefined
    return undefined
  } else {
    const keys = extractKeysFromString(keysAsString)
    const objToVal = getNestedObject(objTo, keys)
    const objFromVal = getNestedObject(objFrom, keys)
    if (typeof objToVal == 'object' || typeof objFromVal == 'object') {
      // If either value is an object, return undefined.
      // For now, we don't allow checking against objects.
      return undefined
    } else if (objToVal === objFromVal) {
      // If no change, return false
      return false
    } else {
      // Else, check if objTo equals value
      return objToVal === value
    }
  }
}