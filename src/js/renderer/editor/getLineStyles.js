import { getTextFromRange } from './editor-utils'

/**
 * Map `lineHandle.styles` and return an array of objects containing information about each class instance, it's start/end characters, etc. 
 * 
 * `lineHandle.styles` is strangely-formatted (but very useful) array of classes (e.g. `link inline text`) and the token number they end on. The format is number-followed-by-string——e.g. `24, "link inline text", 35, "link inline url"`——where `24` is the ending character of `link inline text`, and the starting character of `link inline url`. This array can also contain empty strings (e.g. "") and multiple consecutive numbers, which we need to ignore when parsing (they seem to belong to empty tokens).
 */
function getLineStyles(doc, lineHandle) {

  let styles = []

  const lineNo = lineHandle.lineNo()

  // Check if array has anything we care about
  if (lineHandle.styles.some((s) => typeof s === 'string' && s !== '')) {
    lineHandle.styles.forEach((s, index) => {

      // Check if style has anything we care about
      if (typeof s === 'string' && s !== '') {

        // Two numbers preceding a class string and seperated by null, are the class's `start` and `end` values. Given `4, null, 6, "md footnote reference"`, 4 = start and 6 = end of "md footnote reference". `end` = the most-immediately preceding number (not string) in the array, before the class (s). `start` = the second-most-immediately preceding number

        let start = null
        let end = 0
        let counter = index

        while (start == null) {
          counter--
          if (typeof lineHandle.styles[counter] == 'number') {
            if (end == 0) {
              end = lineHandle.styles[counter]
            } else {
              // Fix for very annoying `lineHandle.styles` quirk: If a style starts at the first character of a line (0), the sequence of numbers looks like: `N, 3, "inline footnote malformed md"`, where `N` is the number of times the document has been loaded (very weird). In that case, we just set the first number to zero.
              start = counter == 0 ? 0 : lineHandle.styles[counter]
              // start = (counter == 0 && (lineHandle.styles[counter] == 1 || lineHandle.styles[counter] == 2)) ? 0 : lineHandle.styles[counter]
            }
          }
        }

        // Get line classes
        const lineClasses = lineHandle.styleClasses ? lineHandle.styleClasses.textClass : ""

        // Create the style object
        styles.push({
          text: getTextFromRange(doc, lineNo, start, end),
          classes: s.split(' '),
          lineClasses: lineClasses,
          start: start,
          end: end,
          collapsed: false,
          line: lineNo,
        })
      }
    })
  }

  return styles
}

export { getLineStyles }