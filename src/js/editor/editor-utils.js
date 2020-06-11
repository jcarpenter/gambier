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
    {line: line, ch: ch}, // from
    {line: line, ch: ch + 1} // to
  ) 
}

/**
 * A _slighty_ more compact snippet for getting text from a range.
 */
function getTextFromRange(editor, line, start, end) {
  return editor.getRange({ line: line, ch: start }, { line: line, ch: end })
}

export { getTextFromRange, getCharAt, replaceMarkWithElement }