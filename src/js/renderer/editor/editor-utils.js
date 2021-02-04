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


// -------- OPENING & CLOSING -------- //

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

  // Update `cm.state.doc` to a copy of action.doc 
  // (so we reduce risk of mutating action.doc).
  cm.state.doc = { ...doc }

  // Get the doc text
  const text = doc.path ?
    await window.api.invoke('getFileByPath', doc.path, 'utf8') : ''

  // Load the doc text into the editor, and clear history.
  // "Each editor is associated with an instance of CodeMirror.Doc, its document. A document represents the editor content, plus a selection, an undo history, and a mode. A document can only be associated with a single editor at a time. You can create new documents by calling the CodeMirror.Doc(text: string, mode: Object, firstLineNumber: ?number, lineSeparator: ?string) constructor" — https://codemirror.net/doc/manual.html#Doc
  cm.swapDoc(CodeMirror.Doc(text, 'gambier'))

  // Restore cursor position, if possible
  const cursorHistory = window.state.cursorPositionHistory[doc.id]
  if (cursorHistory) {
    cm.setCursor(cursorHistory)
    
    // Vertically center cursor inside scrollable area
    const heightOfEditor = cm.getScrollInfo().clientHeight
    cm.scrollIntoView(null, heightOfEditor / 2)
  }

  // Map, mark and focus the editor
  mapDoc(cm)
  markDoc(cm)

  // setCursor(cm)

  // TODO 10/29: Been disabled for a while.
  // Update media path
  // mediaBasePath = filePath.substring(0, filePath.lastIndexOf('/'))
  // console.log(`mediaBasePath is ${mediaBasePath}`)
}

/**
 * Focus the editor. We wrap in a setTimeout or it doesn't work.
 * @param {*} cm 
 */
export function focusEditor(cm) {
  setTimeout(() => {
    cm.focus()
  }, 0)
}

/** 
 * Save cursor position, so we can restore it if the doc is-reopened during the same app session (cursor position histories are erased at the start of each new app session).
 */
export function saveCursorPosition(cm) {

  const docId = cm.state.doc.id
  const cursorPos = cm.doc.getCursor()

  // Only save if the doc is not empty, 
  // and the cursor is not on the first line.
  const shouldSaveCursorPos = docId && cursorPos.line !== 0
  
  if (shouldSaveCursorPos) {
    window.api.send('dispatch', {
      type: 'SAVE_CURSOR_POSITION',
      docId,
      line: cursorPos.line,
      ch: cursorPos.ch
    })
  }
}