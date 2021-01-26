import { getBlockElements } from "./getBlockElements"
import { getInlineElementsForLine } from "./getInlineElementsForLine"

/**
 * Find each element in the loaded document, and save their information into block and inline element arrays, in editorState. We use these arrays to then mark the document, help drive interactions, etc.
 * 
 */
export function mapDoc(cm) {

  const state = cm.getEditorState()

  // Map block elements
  state.blockElements = getBlockElements(cm)

  // Map inline elements
  state.inlineElements = []
  cm.operation(() => {
    cm.eachLine((lineHandle) => {
      // Find elements in line
      const lineElements = getInlineElementsForLine(cm, lineHandle)
      // Add them (concat) to `state.inlineElements`
      if (lineElements.length) {
        state.inlineElements = state.inlineElements.concat(lineElements)
      }
    })
  })
}


/**
 * Remap inline elements for a single line.
 */
export function remapInlineElementsForLine(cm, lineHandle) {

  const state = cm.getEditorState()
  const inlineElements = state.inlineElements
  const lineNo = lineHandle.lineNo()

  let fromIndex = null
  let toIndex = null

  // Find the `from` and `to` index values of existing elements (in `state.inlineElements`) of the same line. We use these index values to remove them, below.
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