import deepEql from 'deep-eql'

/**
 * Returns true if arrays have same items in same order
 * From: https://gomakethings.com/how-to-check-if-two-arrays-are-equal-with-vanilla-js/
 */
export function arraysEqual (arr1, arr2) {

	// Check if the arrays are the same length
	if (arr1.length !== arr2.length) return false

	// Check if all items exist and are in the same order
	for (var i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) return false
  }
  
  return true
}

/**
 * Return true if array has ALL of the items
 * @param  {...any} items - One or more strings
 */
Array.prototype.hasAll = function(...items) {
  return items.every((i) => this.includes(i))
}

/**
 * Return true if array has ANY of the items
 * @param  {...any} items - One or more strings
 */
Array.prototype.hasAny = function(...items) {
  return items.some((i) => this.includes(i))
}

/**
 * Return true if string includes any of the items.
 * E.g. Returns true if item is `-span` and string is `text-span`
 * @param  {...any} items - One or more strings
 */
String.prototype.includesAny = function(...items) {
  return items.some((i) => this.includes(i))
}

/**
 * Return true if string equals any of the items.
 * E.g. Returns true if item is `-span` and string is `text-span`
 * @param  {...any} items - One or more strings
 */
String.prototype.equalsAny = function(...items) {
  return items.some((i) => this === i)
}


/**
 * Get the diff between two arrays
 * For [1, 2, 3] and [1, 2], it will return [3]
 * From: https://stackoverflow.com/a/33034768
 */
export function getArrayDiff(arr1, arr2) {
  return arr1.filter(x => !arr2.includes(x));
}

/**
 * Get file size in KB, MB, GB, or TB (whatever is closest), from bytes.
 * From: https://gist.github.com/lanqy/5193417#gistcomment-3240729
 * @param {*} bytes
 * @param {*} separator 
 * @param {*} postFix 
 */
export function prettySize(bytes, separator = ' ', postFix = '') {
  if (bytes) {
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.min(parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString(), 10), sizes.length - 1);
      return `${(bytes / (1024 ** i)).toFixed(i ? 1 : 0)}${separator}${sizes[i]}${postFix}`;
  }
  return 'n/a';
}

const formats = {
  document: ['.md', '.markdown'],
  image: [
    '.apng', '.bmp', '.gif', '.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp', '.png', '.svg', '.tif', '.tiff', '.webp'
  ],
  av: [
    '.flac', '.mp4', '.m4a', '.mp3', '.ogv', '.ogm', '.ogg', '.oga', '.opus', '.webm'
  ]
}

/**
 * Wrap setTimeout in a promise so we can use with async/await. 
 * Use like: `await wait(1000);`
 * @param {*} ms 
 */
export async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function isDoc(fileExtension) {
  return formats.document.includes(fileExtension)
}

export function isMedia(fileExtension) {
  const isImage = formats.image.includes(fileExtension)
  const isAV = formats.av.includes(fileExtension)
  return isImage || isAV
}

export function getMediaType(fileExtension) {
  const isImage = formats.image.includes(fileExtension)
  const isAV = formats.av.includes(fileExtension)
  if (isImage) {
    return 'img'
  } else if (isAV) {
    return 'av'
  } else {
    console.error('File extension does not match supported media types')
  }
}

/**
 * Return file type ('doc', 'img', 'av') based on file extension.
 * @param {*} fileExtension - String. E.g. 'gif'
 */
export function getFileType(fileExtension) {
  if (isDoc(fileExtension)) {
    return 'doc'
  } else if (isMedia(fileExtension)) {
    return getMediaType(fileExtension)
  }
}

export function findInTree (tree, value, key = 'id', reverse = false) {
  const stack = [ tree[0] ]
  while (stack.length) {
    const node = stack[reverse ? 'pop' : 'shift']()
    if (node[key] === value) return node
    node.children && stack.push(...node.children)
  }
  return null
}

export function stringify(value) {
  return JSON.stringify(value, null, '\t')
}


// -------- COMPARE PATCHES -------- //

/**
 * Check if state property has changed by comparing Immer patches. And (optionally) if property now equals a specified value. For each patch, check if `path` array contains specified `props`, and if `value` value equals specified `toValue`.
 * @param {*} props - Either a string, or an array (for more precision).
 * @param {*} [toValue] - Optional value to check prop against
 */
export function stateHasChanged(patches, props, toValue = '') {
	return patches.some((patch) => {

  	const pathAsString = patch.path.toString()
		const checkMultipleProps = Array.isArray(props)

		const hasChanged = checkMultipleProps ?
    	props.every((key) => pathAsString.includes(key)) :
      pathAsString.includes(props)
    
    // If optional 'toValue' argument is specified, check it.
    // Else, only check `hasChanged`
    if (toValue) {
      const equalsValue = patch.value == toValue
      return hasChanged && equalsValue
    } else {
      return hasChanged
    }
  })
}


// -------- COMPARE OBJECTS -------- //

/**
 * Compare two objects and return `true` if they differ.
 * @param {*} objA 
 * @param {*} objB 
 */
export function objHasChanged(objA, objB) {
  return !deepEql(objA, objB)
}

/**
 * Check if an object property has changed, 
 * by comparing two versions of the object.
 * @param {*} keysAsString - Path of property to check. E.g. 'colors.systemBlue'
 * @param {*} objA - Old version of object
 * @param {*} objB - New version of object
 */
export function propHasChanged(keysAsString, objA, objB) {
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
}

/**
 * Check if an object property has changed to a specific value,
 * by comparing old and new versions of the object.
 * @param {*} keysAsString 
 * @param {*} value 
 * @param {*} objTo 
 * @param {*} objFrom 
 */
export function propHasChangedTo(keysAsString, value, objTo, objFrom) {
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

/**
 * Utility function for hasChanged. 
 * Convert propAddress string to array of keys.
 * Before: "projects[5].window"
 * After: ["projects", 5, "window"]
 * @param {*} keyAsString 
 */
function extractKeysFromString(keyAsString) {
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

/**
 * Utility function for `hasChanged`. 
 * @param {*} nestedObj 
 * @param {*} pathArr 
 */
const getNestedObject = (nestedObj, pathArr) => {
	return pathArr.reduce((obj, key) =>
		(obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
}