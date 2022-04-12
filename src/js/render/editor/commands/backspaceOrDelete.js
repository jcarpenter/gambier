/**
 * Make it hard to accidentally delete marks by selecting them first. 
 * User must press again to then actually delete the item.
 * Only works for single-cursor selections. If a range of text is 
 * selected, and/or there are multiple selections, we process
 * as usual.
 * @param {*} keyPressed 
 */
export function backspaceOrDelete(cm, keyPressed = '') {

  const ranges = cm.listSelections()

  // If there are multiple selections, or text is selected, 
  // process as normal backspace or delete.
  const multipleSelections = ranges.length > 1
  const textIsSelected = cm.somethingSelected()
  if (multipleSelections || textIsSelected) return CodeMirror.Pass

  // Else, if there is an adjacent mark, and it's NOT a bookmark,
  // select it instead of backspace or deleting it.
  const cursor = cm.getCursor()
  const adjacentMark = cm.findMarksAt(cursor)[0]
  if (adjacentMark && adjacentMark.type !== 'bookmark') {
    const { from, to } = adjacentMark.find()
    const cursorIsOnLeftEdge = cursor.ch == from.ch
    const cursorIsOnRightEdge = cursor.ch == to.ch
    if (cursorIsOnLeftEdge && keyPressed == 'delete') {
      cm.addSelection(from, to)
      return
    } else if (cursorIsOnRightEdge && keyPressed == 'backspace') {
      cm.addSelection(from, to)
      return
    }
  }

  // Else, process keypress as normal
  return CodeMirror.Pass
}
