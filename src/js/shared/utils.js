import deepEql from 'deep-eql'

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

/**
 * Check Immer patches to see if a property has changed, and (optionally) if it equals a specified value. For each patch, check if `path` array contains specified `props`, and if `value` value equals specified `toValue`.
 * @param {*} props - Either a string, or an array (for more precision).
 * @param {*} [toValue] - Optional value to check prop against
 */
export function propHasChanged(patches, props, toValue = '') {
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


