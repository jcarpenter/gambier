import { getLineElements } from "../map"

/**
 * Select the next 1) TextMarker, or 2) child span.
 * Do so by finding the next (or surrounding) element. 
 * If it's marked, call its `altTabTo` function.
 * Else, call the next of its child spans.
 */
export function tabToNextElement(cm) {

  const cursor = cm.getCursor('anchor')
  let element

  // Else, find the next element in the doc...
  for (var i = cursor.line; i < cm.lineCount(); i++) {
    const elements = getLineElements(cm, i)
    element = elements.find((e, index) => {

      // If we're inside an element, it's not a TextMarker
      // and it has more child spans to select, after the
      // current cursor position, select it.
      // E.g. Jump between child spans of a link, image, etc.

      const cursorIsInsideAnElement =
        e.line == cursor.line &&
        e.start < cursor.ch &&
        e.end > cursor.ch

      const elementIsNotMarker =
        !e.mark.isMarkable ||
        window.state.sourceMode

      const elementHasContentsToSelect =
        e.spans.find((c) => c.start > cursor.ch)

      if (cursorIsInsideAnElement && elementIsNotMarker && elementHasContentsToSelect) {
        return true
      }

      // Else, find next element on same or subsequent line:

      // Skip element if it's already selected
      const alreadySelected =
        e.line == cursor.line &&
        e.start == cursor.ch &&
        e.end == cm.getCursor('to').ch

      if (alreadySelected) return false

      // Find next element on same line...
      // Edge case check: make sure it's not inside a marked
      // element. E.g. some strong text inside a footnote.
      // Determine by looking for multiple elements at same spot.

      const isOnSameLineAndGreaterCh =
        e.line == cursor.line &&
        e.start >= cursor.ch

      if (isOnSameLineAndGreaterCh) {
        if (!window.state.sourceMode) {
          const markAt = cm.findMarksAt({ line: e.line, ch: e.start })[0]
          // If there's a mark present at the element start
          // we can tell if _around_ the element by checking the 
          // from and to values.
          const isNestedInsideMark =
            markAt !== undefined &&
            markAt?.find().from.ch < e.start ||
            markAt?.find().to.ch > e.end
          if (!isNestedInsideMark) return true
        } else {
          return true
        }
      }

      // Else, find first element on subsequent line...

      const isOnSubsequentLine =
        e.line > cursor.line

      if (isOnSubsequentLine) return true
    })

    // if (element) console.log(element)
    if (element) break
  }

  if (!element) return

  // If element has a marker, select it and return...
  if (!window.state.sourceMode && element.mark.isMarkable) {
    const textMarker = cm.findMarksAt({ line: element.line, ch: element.start + 1 })[0]
    if (textMarker) {
      textMarker.component.altTabTo()
      return
    }
  }

  // Else, select next child span
  const nextContents = element.spans.find((c) => {

    // If element is on subsequent line, get first content
    const isOnSubsequentLine =
      element.line > cursor.line
    if (isOnSubsequentLine) return true

    // Else, get next one
    const isOnSameLineAndGreaterCh =
      element.line == cursor.line &&
      c.start > cursor.ch
    return isOnSameLineAndGreaterCh
  })

  if (nextContents) {
    cm.setSelection(
      { line: element.line, ch: nextContents.start },
      { line: element.line, ch: nextContents.end }
    )
  }
}
