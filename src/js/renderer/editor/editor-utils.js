// -------- MISC -------- //

/**
 * Mark text and replace with specified element.
 * @param {*} cm - Instance
 * @param {*} element - To render where the marked text used to be
 * @param {*} line - Of text to mark
 * @param {*} start - Of text to mark
 * @param {*} end - Of text to mark
 */
export function replaceMarkWithElement(cm, element, line, start, end) {
  cm.markText({ line: line, ch: start }, { line: line, ch: end }, {
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
export function getCharAt(cm, line, ch = 0) {
  return cm.getRange(
    { line: line, ch: ch }, // from
    { line: line, ch: ch + 1 } // to
  )
}

/**
 * A _slighty_ more compact snippet for getting text from a range.
 */
export function getTextFromRange(doc, line, start, end) {
  return doc.getRange({ line: line, ch: start }, { line: line, ch: end })
}



// -------- SAVE, LOAD, FOCUS, TOGGLE -------- //

/**
 * Save editor contents
 */
export function saveDoc(cm, doc) {
  window.api.send('dispatch', {
    type: 'SAVE_DOC',
    doc: doc,
    data: cm.getValue(),
    panelIndex: cm.state.panel.index
  })
}

import { mapDoc } from "./map"
import { markDoc } from "./mark"

/**
 * Load doc into the editor, and clear history
 * @param {*} doc - Instance of an object from `files.byId`
 */
export async function loadDoc(cm, doc) {

  if (!cm || !doc) return

  // Get the doc text
  const text = doc.path ? 
    await window.api.invoke('getFileByPath', doc.path, 'utf8') : ''

  // Load the doc text into the editor, and clear history.
  // "Each editor is associated with an instance of CodeMirror.Doc, its document. A document represents the editor content, plus a selection, an undo history, and a mode. A document can only be associated with a single editor at a time. You can create new documents by calling the CodeMirror.Doc(text: string, mode: Object, firstLineNumber: ?number, lineSeparator: ?string) constructor" — https://codemirror.net/doc/manual.html#Doc
  cm.swapDoc(CodeMirror.Doc(text, 'gambier'))

  // Map, mark and focus the editor
  mapDoc(cm)
  markDoc(cm)
  focusEditor(cm)

  // TODO 10/29: Been disabled for a while.
  // Update media path
  // mediaBasePath = filePath.substring(0, filePath.lastIndexOf('/'))
  // console.log(`mediaBasePath is ${mediaBasePath}`)
}


/**
 * TODO 10/1: Restore cursor position in document. As is we're just setting it to the end of the document.
 * @param {*} cm 
 */
export function focusEditor(cm) {
  // setTimeout(() => {
  //   cm.focus()
  //   cm.setCursor({
  //     line: cm.lastLine(),
  //     ch: cm.getLine(cm.lastLine()).length,
  //   })
  // }, 0)
}

/**
 * Called when `sourceMode` state changes. Re-runs the doc ma rking logic.
 * If `sourceMode` is true, we render plain markup, without widgets.
 */
export function toggleSource(cm) {

  // Focus the editor first. If we don't do this, and the cursor is inside an editable widget when the toggle is flipped, we get an error.
  clearDocMarks(cm)
  markDoc(cm)
}
