import { getBlockElements } from "./getBlockElements"
import { getInlineElementsForLine } from "./getInlineElementsForLine"

/**
 * Find each element in the loaded document, and save their information into block and inline element arrays, in editorcm.State. We use these arrays to then mark the document, help drive interactions, etc.
 * 
 */
export function mapDoc(cm) {
  console.trace()
  // Map block elements
  cm.state.blockElements = getBlockElements(cm)

  // Map inline elements
  cm.state.inlineElements = []
  cm.operation(() => {
    cm.eachLine((lineHandle) => {
      // Find elements in line
      const lineElements = getInlineElementsForLine(cm, lineHandle)
      // Add them (concat) to `cm.state.inlineElements`
      if (lineElements.length) {
        cm.state.inlineElements = cm.state.inlineElements.concat(lineElements)
      }
    })
  })

  // console.log(cm.state.inlineElements)
}


/**
 * Remap inline elements for a single line.
 */
export function remapInlineElementsForLine(cm, lineHandle) {

  const inlineElements = cm.state.inlineElements
  const lineNo = lineHandle.lineNo()

  let fromIndex = null
  let toIndex = null

  // Find the `from` and `to` index values of existing elements (in `cm.state.inlineElements`) of the same line. We use these index values to remove them, below.
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