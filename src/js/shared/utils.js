import deepEql from 'deep-eql'
// import path from 'path'
// import mime from 'mime-types'


/* -------------------------------------------------------------------------- */
/*                            PROTOTYPE EXTENSIONS                            */
/* -------------------------------------------------------------------------- */

/**
 * Return true if array has ALL of the items
 * @param  {...any} items - One or more strings
 */
Array.prototype.hasAll = function (...items) {
  return items.every((i) => this.includes(i))
}

/**
 * Return true if array has ANY of the items
 * @param  {...any} items - One or more strings
 */
Array.prototype.hasAny = function (...items) {
  return items.some((i) => this.includes(i))
}

/**
 * Return true if string includes any of the items.
 * E.g. Returns true if item is `-span` and string is `text-span`
 * @param  {...any} items - One or more strings
 */
String.prototype.includesAny = function (...items) {
  return items.some((i) => this.includes(i))
}

/**
 * Return true if string includes ALL of the items.
 * E.g. Returns true if string is "reference-full" and items
 * are "reference" and "full"
 * @param  {...any} items - One or more strings
 */
String.prototype.includesAll = function (...items) {
  return items.every((i) => this.includes(i))
}

/**
 * Return true if string equals any of the items.
 * E.g. Returns true if item is `hello` and string is `hello`
 * @param  {...any} items - One or more strings
 */
String.prototype.equalsAny = function (...items) {
  return items.some((i) => i === this)
}

/**
 * Return first character of string
 */
String.prototype.firstChar = function () {
  return this.charAt(0)
}

/**
 * Return last character of string
 */
String.prototype.lastChar = function () {
  return this.charAt(this.length - 1)
}

/**
 * Round a number to two decimal places
 * From: https://www.delftstack.com/howto/javascript/javascript-round-to-2-decimal-places/
 */
Number.prototype.roundToTwo = function () {
  return +(Math.round(this + "e+2") + "e-2")
}



/* -------------------------------------------------------------------------- */
/*                                MISC HELPERS                                */
/* -------------------------------------------------------------------------- */

/**
 * Call the specified function after the specified delay.
 * Used to throttle functions that we don't want to fire
 * too rapidly. E.g. we're calling a complicated resize 
 * function from `mousemove` listener.
 * From: https://codeburst.io/throttling-and-debouncing-in-javascript-646d076d0a44
 */
export function throttle(delay, fn) {
  let lastCall = 0;
  return function (...args) {
    const now = (new Date).getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return fn(...args);
  }
}

/**
 * Return true if element has ancestor with specified id.
 * (or if the element itself has the id)
 * From: https://flaviocopes.com/how-to-check-element-descendant/
 * @param {object} el - DOM element.
 * @param {string} parentId - E.g. 'wizard'
 */
export function isDescendantOfId(el, parentId) {
  let isDescendant = false

  // First check if `el` is parentId.
  // If no, iterate up ancestors using while loop,
  // until there are no more parent nodes. In which case
  // `el.parentNode` returns null, and loop ends.

  if (el.id === parentId) {
    isDescendant = true
  } else {
    while (el = el.parentNode) {
      if (el.id == parentId) {
        isDescendant = true
      }
    }
  }

  return isDescendant
}

/**
 * Return true if element has ancestor with specified class.
 * (or if the element itself has the class)
 * @param {object} el - DOM element.
 * @param {string} parentClass - E.g. 'frontmatter'
 * @returns 
 */
export function isDescendantOfClass(el, parentClass) {
  let isDescendant = false

  // First check if `el` contains parentClass.
  // If no, iterate up ancestors using while loop,
  // until there are no more parent nodes. In which case
  // `el.parentNode` returns null, and loop ends.

  if (el.classList?.contains(parentClass)) {
    isDescendant = true
  } else {
    while (el = el.parentNode) {
      if (el.classList?.contains(parentClass)) {
        isDescendant = true
      }
    }
  }

  return isDescendant
}

/**
  * From: https://stackoverflow.com/a/53187807
  * Returns the index of the last element in the array where predicate is true, and -1
  * otherwise.
  * @param array - The source array to search in
  * @param predicate - Calls predicate once for each element of the array, in descending
  * order, until it finds one where predicate returns true. If such an element is found,
  * findLastIndex immediately returns that element index. Otherwise, findLastIndex returns -1.
  * predicate receives 1) array item the index of l, 2) index l, and 3) the whole array.
  */
// export function findLastIndex(array, predicate: (value: T, index: number, obj: T[]) => boolean): number {
export function findLastIndex(array, predicate) {
  let l = array.length;
  while (l--) {
    if (predicate(array[l], l, array))
      return l;
  }
  return -1;
}

/**
 * Returns true if arrays have same items in same order
 * From: https://gomakethings.com/how-to-check-if-two-arrays-are-equal-with-vanilla-js/
 */
export function arraysEqual(arr1, arr2) {

  // Check if the arrays are the same length
  if (arr1.length !== arr2.length) return false

  // Check if all items exist and are in the same order
  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }

  return true
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

/**
 * Shorthand function for `JSON.stringify`
 * @param {*} value 
 */
export function stringify(value) {
  return JSON.stringify(value, null, '\t')
}

/** 
 * Unescape HTML characters in string
 * Before: `&lt;script&gt;alert(&#39;hi&#39;)&lt;/script&gt;`
 * After:  `<script>alert("hi")</script>`
 * From: https://www.educative.io/edpresso/how-to-escape-unescape-html-characters-in-string-in-javascript
 */
export function unEscape(htmlStr) {
  htmlStr = htmlStr.replace(/&lt;/g, "<")
  htmlStr = htmlStr.replace(/&gt;/g, ">")
  htmlStr = htmlStr.replace(/&quot;/g, "\"")
  htmlStr = htmlStr.replace(/&#39;/g, "\'")
  htmlStr = htmlStr.replace(/&amp;/g, "&")
  return htmlStr;
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

export function findInTree(tree, value, key = 'id', reverse = false) {
  const stack = [tree[0]]
  while (stack.length) {
    const node = stack[reverse ? 'pop' : 'shift']()
    if (node[key] === value) return node
    node.children && stack.push(...node.children)
  }
  return null
}

// Copied from:
// https://github.com/Rich-Harris/yootils/blob/master/src/number/clamp.ts
export function clamp(num, min, max) {
  return num < min ? min : num > max ? max : num;
}


/* -------------------------------------------------------------------------- */
/*                                CHECK FORMAT                                */
/* -------------------------------------------------------------------------- */

const formats = {
  document: ['.md', '.markdown'],
  image: ['.apng', '.bmp', '.gif', '.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp', '.png', '.svg', '.tif', '.tiff', '.webp'],
  av: ['.flac', '.mp4', '.m4a', '.mp3', '.ogv', '.ogm', '.ogg', '.oga', '.opus', '.webm'],

  // Video containers (file types)
  // If a container supports both audio and video (e.g. WebM), we categorize as video,
  // since <video> also works for audio, but <audio> does not work for video.
  // See: https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Containers#index_of_media_container_formats_file_types
  // video: [

  //   // Mp4
  //   // Supported by Chrome? - Y
  //   '.mp4', 

  //   // WebM
  //   // Supported by Chrome? - Y
  //   '.webm',

  //   // Ogg
  //   // Supported by Chrome? - Y
  //   '.ogg',

  //   // QuickTime
  //   // Supported by Chrome? - N
  //   '.mov',

  //   // The OGM file format is a compressed video container file format. The files can contain streams of audio and video data as well as text and metadata. OGM files use the Ogg Vorbis compression technology and contain audio and video stream files that can be played on a user's computer.
  //   '.ogm', 

  //   // An OGV file is a video file saved in the Xiph.Org open source Ogg container format. It contains video streams that may use one or more different codecs, such as Theora, Dirac, or Daala.
  //   '.ogv',

  //   // The 3GP or 3GPP media container is used to encapsulate audio and/or video that is specifically intended for transmission over cellular networks for consumption on mobile devices.
  //   '.3gp'
  // ],

  // audio: [

  //   // "The Free Lossless Audio Codec (FLAC) is a lossless audio codec; there is also an associated simple container format, also called FLAC, that can contain this audio."
  //   // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Containers#flac
  //   '.flac', 

  //   // M4A is a file extension for an audio file encoded with advanced audio coding (AAC) which is a lossy compression. M4A was generally intended as the successor to MP3, which had not been originally designed for audio only but was layer III in an MPEG 1 or 2 video files. M4A stands for MPEG 4 Audio.
  //   '.m4a', 

  //   // Mp4s are MPEG files that contain Layer_III/MP3 sound data.
  //   '.mp3', 
  //   ''
  // ]
}

export const urlRE = new RegExp(/^((?:(?:aaas?|about|acap|adiumxtra|af[ps]|aim|apt|attachment|aw|beshare|bitcoin|bolo|callto|cap|chrome(?:-extension)?|cid|coap|com-eventbrite-attendee|content|crid|cvs|data|dav|dict|dlna-(?:playcontainer|playsingle)|dns|doi|dtn|dvb|ed2k|facetime|feed|file|finger|fish|ftp|geo|gg|git|gizmoproject|go|gopher|gtalk|h323|hcp|https?|iax|icap|icon|im|imap|info|ipn|ipp|irc[6s]?|iris(?:\.beep|\.lwz|\.xpc|\.xpcs)?|itms|jar|javascript|jms|keyparc|lastfm|ldaps?|magnet|mailto|maps|market|message|mid|mms|ms-help|msnim|msrps?|mtqp|mumble|mupdate|mvn|news|nfs|nih?|nntp|notes|oid|opaquelocktoken|palm|paparazzi|platform|pop|pres|proxy|psyc|query|res(?:ource)?|rmi|rsync|rtmp|rtsp|secondlife|service|session|sftp|sgn|shttp|sieve|sips?|skype|sm[bs]|snmp|soap\.beeps?|soldat|spotify|ssh|steam|svn|tag|teamspeak|tel(?:net)?|tftp|things|thismessage|tip|tn3270|tv|udp|unreal|urn|ut2004|vemmi|ventrilo|view-source|webcal|wss?|wtai|wyciwyg|xcon(?:-userid)?|xfire|xmlrpc\.beeps?|xmpp|xri|ymsgr|z39\.50[rs]?):(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]|\([^\s()<>]*\))+(?:\([^\s()<>]*\)|[^\s`*!()\[\]{};:'".,<>?«»“”‘’]))/i)

const imagePathRE = new RegExp(/^.*?\.(apng|bmp|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|tif|tiff|webp)$/i)

export const htmlRE = new RegExp(/<\/?[a-z][\s\S]*>/)


/**
 * Return true if URL tests positive against GitHub's URL regex.
 * https://github.com/codemirror/CodeMirror/blob/master/mode/gfm/gfm.js#L14
 */
export function isUrl(string) {
  return urlRE.test(string)
}

/**
 * Return true if `string` is URL and protocol is http or https.
 * Uses browser `URL` interface.
 * @param {*} string - url to text
 */
export function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

/**
 * Return true if string has valid image file format extension
 * E.g. .jpg, .gif, .apng.
 */
export function isImagePath(string) {
  return imagePathRE.test(string)
}

/**
 * Return true if file extension is among valid doc formats.
 */
export function isDoc(extension) {
  return formats.document.includes(extension)
}

/**
 * Return true if Content-Type of file is 
 */
export function isMedia(extension) {

  // Return false if json. Helps prevent error from mime package.
  // if (filepath.includesAny('.DS_Store', '.json')) return false

  // const contentType = mime.lookup(filepath)

  // return contentType.includesAny('video', 'audio', 'image')

  const isImage = formats.image.includes(extension)
  const isAV = formats.av.includes(extension)
  return isImage || isAV
}

/**
 * Check if string contains HTML. Uses regexp from StackOverflow:
 * https://stackoverflow.com/a/15458987
 */
export function isHTML(string) {
  return htmlRE.test(string)
}

/**
 * Return media type ('img' or 'av'), based on file extension.
 */
export function getMediaType(extension) {
  const isImage = formats.image.includes(extension)
  const isAV = formats.av.includes(extension)
  if (isImage) {
    return 'img'
  } else if (isAV) {
    return 'av'
  } else {
    console.error('File extension does not match supported media types')
  }
}

/**
 * Return file type ('doc', 'img', 'av'), based on file extension.
 */
export function getFileType(extension) {
  if (isDoc(extension)) {
    return 'doc'
  } else if (isMedia(extension)) {
    return getMediaType(extension)
  }
}


/* -------------------------------------------------------------------------- */
/*                               COMPARE PATCHES                              */
/* -------------------------------------------------------------------------- */

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


/* -------------------------------------------------------------------------- */
/*                              WORK WITH OBJECTS                             */
/* -------------------------------------------------------------------------- */

/**
 * Check if object is empty" {}
 */
// Taken from https://coderwall.com/p/_g3x9q/how-to-check-if-javascript-object-is-empty
export function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key))
      return false
  }
  return true
}

/**
 * Return true if property values of two objects do not match.
 */
export function hasChanged(key, objA, objB) {
  return objA[key] !== objB[key]
}

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
  if (!keysAsString || !value) {
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
 * Utility function for `propHasChangedTo`. 
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
 * Utility function for ``propHasChangedTo``. 
 * @param {*} nestedObj 
 * @param {*} pathArr 
 */
const getNestedObject = (nestedObj, pathArr) => {
  return pathArr.reduce((obj, key) =>
    (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
}


/* -------------------------------------------------------------------------- */
/*                             RENDER-PROCESS ONLY                            */
/* -------------------------------------------------------------------------- */
// Main process cannot use these functions

/**
 * Take a CSS time value, like "500ms", and return as milliseconds.
 * "500ms" --> 500
 * "2.5s" --> 2500
 */
export function convertCSSTimeToMilliseconds(time) {

  // If it's not a string, it's not a CSS value. 
  // Return the value unchanged.
  if (typeof time !== 'string') return time

  const isInSeconds = time.match(/\d+s/)

  // Use parseFloat to strip CSS <time> prefix "ms" or "s" values.
  time = parseFloat(time)

  // If format was seconds, convert to milliseconds
  if (isInSeconds) time = time * 1000

  return time
}

/**
 * Return the value of the CSS custom property of the
 * specified name, on the body element.
 * All this does is make declaration more compact.
 * @param {string} propName - Property name, without double dashes. E.g. "sidebar-color". 
 */
export function getCssProp(propName) {
  return window.getComputedStyle(document.body).getPropertyValue(propName)
}

/**
 * Mount Svelte component without the unnecessary empty parent frag.
 * From: https://github.com/sveltejs/svelte/issues/1549#issuecomment-397819063
 * @param {*} Component - To be rendered
 * @param {*} options - For the component (e.g. target)
 */
export function mountComponent(Component, options) {
  const frag = document.createDocumentFragment();
  const component = new Component({ ...options, target: frag });
  options.target.parentNode.replaceChild(frag, options.target);
  return component;
}

/**
 * Select the contents of a target input element or content editable.
 * @param {*} target 
 */
export function selectInputContents(target) {
  let selection = window.getSelection();
  let range = document.createRange();
  range.selectNodeContents(target);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * For the element (e.g. contenteditable or input), set the caret 
 * to the specified position (e.g. 6 character in).
 * @param {dom element} element 
 * @param {integer} index - To place caret at
 */
export function setCaretPositionByIndex(element, index) {
  const range = document.createRange()
  const sel = window.getSelection()
  range.setStart(element.childNodes[0], index)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}


/**
 * Return array of focusable elements for the given element.
 */
export function getFocusableElements(el) {

  const focusables = 'button:not(disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  return el.querySelectorAll(focusables)

}