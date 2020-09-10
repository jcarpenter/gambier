/**
 * Mark text and replace with specified element.
 * @param {*} editor - Instance
 * @param {*} element - To render where the marked text used to be
 * @param {*} line - Of text to mark
 * @param {*} start - Of text to mark
 * @param {*} end - Of text to mark
 */
function replaceMarkWithElement(editor, element, line, start, end) {
  editor.markText({ line: line, ch: start }, { line: line, ch: end }, {
    replacedWith: element,
    clearOnEnter: false,
    inclusiveLeft: false,
    inclusiveRight: false,
    handleMouseEvents: false
  })
}

/**
 * Return a single character at the specified position
 */
function getCharAt(editor, line, ch = 0) {
  return editor.getRange(
    { line: line, ch: ch }, // from
    { line: line, ch: ch + 1 } // to
  )
}

/**
 * Find classes on the given line and their start/stop points.
 * We parse `lineHandle.styles` to get this. It's a strangely-formatted but useful array of classes (e.g. `link inline text`) and token number they end on. The format is number-followed-by-string——e.g. `24, "link inline text", 35, "link inline url"`——where `24` is the ending character of `link inline text`, and the starting character of `link inline url`. This array can also contain empty strings (e.g. "") and multiple consecutive numnbers, which we need to ignore when parsing (they seem to belong to empty tokens).
 * @param {*} editor 
 * @param {*} line 
 * @param {*} start 
 * @param {*} end 
 */
function getLineStyles(editor, lineHandle) {
  let classes = []

  if (lineHandle.styles.some((s) => typeof s === 'string' && s !== '')) {
    lineHandle.styles.forEach((s, index) => {
      if (typeof s === 'string' && s !== '') {
        classes.push({
          class: s,
          start: lineHandle.styles[index - 1],
          end: lineHandle.styles[index + 1],
          text: getTextFromRange(editor, lineHandle.lineNo(), lineHandle.styles[index - 3], lineHandle.styles[index - 1])
        })

        // console.log("- - - -")
        // console.log(s)Í
        // console.log(styles[index - 1])
        // console.log(styles[index - 3])
        // console.log(getTextFromRange(editor, lineHandle.lineNo(), styles[index - 3], styles[index - 1]))
      }
    })
    // console.log(lineHandle)
    // console.log(styleObjects)
  }

  return classes
}

/**
 * A _slighty_ more compact snippet for getting text from a range.
 */
function getTextFromRange(editor, line, start, end) {
  return editor.getRange({ line: line, ch: start }, { line: line, ch: end })
}

export { replaceMarkWithElement, getCharAt, getLineStyles, getTextFromRange }