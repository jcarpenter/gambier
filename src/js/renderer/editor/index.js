export { default as createEditor } from './createEditor';


// -------- LOAD, FOCUS, TOGGLE -------- //

/**
 * Save editor contents to filepath
 */
export function saveFile(cm, filePath) {
  window.api.send('dispatch', {
    type: 'SAVE_FILE',
    path: filePath,
    data: cm.getValue(),
  })
}

/**
 * Load file at `filePath` from disk, and load it's value into editor.
 */
export async function loadFileByPath(cm, filePath) {
  if (filePath == '') {

    // Clear editor content and history
    cm.swapDoc(CodeMirror.Doc(''))

  } else {

    // Load file into editor
    const file = await window.api.invoke('getFileByPath', filePath, 'utf8')

    // "Each editor is associated with an instance of CodeMirror.Doc, its document. A document represents the editor content, plus a selection, an undo history, and a mode. A document can only be associated with a single editor at a time. You can create new documents by calling the CodeMirror.Doc(text: string, mode: Object, firstLineNumber: ?number, lineSeparator: ?string) constructor" — https://codemirror.net/doc/manual.html#Doc

    cm.swapDoc(CodeMirror.Doc(file, 'gambier'))

    // Map, mark and focus the editor
    cm.focus()
    mapDoc(cm)
    markDoc(cm)
    focusEditor(cm)

    // TODO 10/29: Been disabled for a while.
    // Update media path
    // mediaBasePath = filePath.substring(0, filePath.lastIndexOf('/'))
    // console.log(`mediaBasePath is ${mediaBasePath}`)
  }
}

/**
 * TODO 10/1: Restore cursor position in document. As is we're just setting it to the end of the document.
 * @param {*} cm 
 */
export function focusEditor(cm) {
  setTimeout(() => {
    cm.focus();
    cm.setCursor({
      line: cm.lastLine(),
      ch: cm.getLine(cm.lastLine()).length,
    });
  }, 0)
}

/**
 * Called when `sourceMode` state changes. Re-runs the doc marking logic.
 * If `sourceMode` is true, we render plain markup, without widgets.
 */
export function toggleSource(cm) {

  // Focus the editor first. If we don't do this, and the cursor is inside an editable widget when the toggle is flipped, we get an error.
  clearDocMarks(cm)
  markDoc(cm)
}


// -------- MAP -------- //

import { getBlockElements } from '../editor/getBlockElements'
import { getInlineElementsForLine } from '../editor/getInlineElementsForLine'

/**
 * Find each element in the loaded document, and save their information into block and inline element arrays, in editorState. We use these arrays to then mark the document, help drive interactions, etc.
 * 
 */
export function mapDoc(cm) {

  const editorState = cm.getEditorState()

  // Map block elements
  editorState.blockElements = getBlockElements(cm)

  // Map inline elements
  editorState.inlineElements = []
  cm.operation(() => {
    cm.eachLine((lineHandle) => {
      // Find elements in line
      const lineElements = getInlineElementsForLine(cm, lineHandle)
      // Add them (concat) to `editorState.inlineElements`
      if (lineElements.length) {
        editorState.inlineElements = editorState.inlineElements.concat(lineElements)
      }
    })
  })
}


/**
 * Remap inline elements for a single line.
 */
export function remapInlineElementsForLine(cm, lineHandle) {

  const editorState = cm.getEditorState()
  const inlineElements = editorState.inlineElements
  const lineNo = lineHandle.lineNo()

  let fromIndex = null
  let toIndex = null

  // Find the `from` and `to` index values of existing elements (in `editorState.inlineElements`) of the same line. We use these index values to remove them, below.
  inlineElements.forEach((il, index) => {
    if (il.line == lineNo) {
      if (fromIndex == null) {
        fromIndex = index
      } else {
        toIndex = index
      }
    }
  })
  if (toIndex == null) toIndex = fromIndex

  // Get new line elements
  const lineElements = getInlineElementsForLine(cm, lineHandle)

  // Update inlineElements array by 1) deleting existing same-line elements, and 2) inserting new line elements
  inlineElements.splice(fromIndex, toIndex - fromIndex + 1, ...lineElements)
}



// -------- MARK -------- //

// import markLinks from '../editor/markLinks.js'
import markText from '../editor/markText.js'

/**
 * Mark all lines in the document
 */
export function markDoc(cm) {
  cm.getAllMarks().forEach((mark) => mark.clear())
  cm.operation(() => {
    cm.eachLine((lineHandle) => markLine(cm, lineHandle))
  })
}

/**
 * Mark selected line
 */
export function markLine(cm, lineHandle) {

  const editorState = cm.getEditorState()
  const lineNo = lineHandle.lineNo()

  let links = []
  let images = []
  let footnotes = []

  editorState.inlineElements.forEach((e) => {
    if (e.line !== lineNo) return
    if (e.type.includes('link') && !e.type.includes('image')) {
      links.push(e)
    } else if (e.type.includes('image')) {
      images.push(e)
    } else if (e.type.includes('footnote')) {
      footnotes.push(e)
    }
  })

  if (links.length) {
    markText(cm, lineNo, links, 'links')
  }

  if (images.length) {
    markText(cm, lineNo, images, 'images')
  }

  if (footnotes.length) {
    markText(cm, lineNo, footnotes, 'footnotes')
  }
}

/**
 * Clear marks from a line
 */
export function clearLineMarks(cm, lineHandle) {
  const lineNo = lineHandle.lineNo()
  const lineLength = lineHandle.text.length
  const lineMarks = cm.findMarks({ line: lineNo, ch: 0 }, { line: lineNo, ch: lineLength })
  lineMarks.forEach((m) => m.clear())
}

/**
 * Clear all marks from the document
 */
export function clearDocMarks(cm) {
  cm.getAllMarks().forEach((m) => m.clear())
}
