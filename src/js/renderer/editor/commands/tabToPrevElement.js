/**
 * Select the closest preceding selectable span in the doc.
 */
export function tabToPrevElement(cm) {

  // 'from' gets us the position from the left side of the cursor/selection.
  // This lets us tab to spans inside the current selection.
  const cursor = cm.getCursor('from')

  let element = null

  // Check if the cursor is already inside an element
  // 1) If it's NOT a TextMarker
  // 2) and it contains more (non-formatting) spans to select
  // ...set it as element.
  const surroundingElement = getElementAt(cm, cursor.line, cursor.ch)
  if (surroundingElement && isSingleCursor(cm)) {
    const isNotTextMarker = cm.findMarksAt(cursor).length == 0
    const hasMoreSpansToSelect = surroundingElement.spans.find((s) => {
      return !s.isFormatting && s.start > cursor.ch
    }) !== undefined
    if (isNotTextMarker && hasMoreSpansToSelect) {
      element = surroundingElement
    }
  }

  // Else, find the prev element
  if (!element) {

    for (var i = cursor.line; i >= 0; i--) {
      const lineHandle = cm.getLineHandle(i)
      const elements = getLineElements(cm, lineHandle)
      // Find the prev element on this line, or preceding
      element = elements.reverse().find((e) => {
        const isOnSameLineAndLesserCh =
          e.line == cursor.line &&
          e.end < cursor.ch
        const isOnPrecedingLine =
          e.line < cursor.line
        return isOnSameLineAndLesserCh || isOnPrecedingLine
      })
      // Break for loop once we've found the element
      if (element) break
    }
  }

  // If no element found, return
  if (!element) return

  // If there's a textmarker, select it, and return
  const textMarker = cm.findMarksAt({ line: element.line, ch: element.start + 1 })[0]
  if (!window.state.sourceMode && textMarker) {
    textMarker.component.altTabTo()
    return
  }

  // If element has `content` property (as in case of links)
  // try to select that first.
  if (element.content) {
    const contentAlreadySelected =
      cm.getCursor('from').ch == element.content.start &&
      cm.getCursor('to').ch == element.content.end

    if (!contentAlreadySelected) {
      cm.setSelection(
        { line: element.line, ch: element.content.start },
        { line: element.line, ch: element.content.end }
      )
      return
    }
  }
}
