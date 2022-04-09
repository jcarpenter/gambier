import { Pos } from "codemirror"
import { getFromAndTo } from "../editor-utils"
import { getElementAt, getLineElements } from "../map"



/**
 * Select the closest preceding TextMarker or span.
 */
export function tabToPrevSpanOrMarker(cm) {

  const cursor = cm.getCursor('to')
  let spans = []
  let prevSpan = undefined
  let textMarkerAtSpan = undefined

  // Get all spans in doc before cursor
  // ordered from closest (to cursor) to furthest
  for (var i = cursor.line; i >= 0; i--) {
    const elements = getLineElements(cm, i)
    const lineSpans = []
    elements.reverse().forEach((e) => {
      lineSpans.push(...e.spans)
    })
    // Sort spans based on `end` ch value.
    lineSpans.sort((a, b) => {
      return b.end - a.end
    })
    spans.push(...lineSpans)
  }

  // Find closest preceding span
  prevSpan = spans.find(({ line, start, end }) => {
    const isOnSameLineAndLesserCh = line == cursor.line && end < cursor.ch
    const isOnPrecedingLine = line < cursor.line

    // If the above are not true, keep looking...
    if (!isOnSameLineAndLesserCh && !isOnPrecedingLine) return false

    // Else, we've found the closest preceding span!

    // Now check if there's a TextMarker at its position.
    textMarkerAtSpan = cm.findMarksAt(Pos(line, start))[0]

    // If there's a mark at the token, but it's already selected
    // return false (keep looking)
    if (textMarkerAtSpan && markIsAlreadySelected(cm, textMarkerAtSpan)) {
      textMarkerAtSpan = undefined
      return false
    }

    // Else, if we pass all the above, then we've found the closest
    // preceding or TextMarker to tab to.
    return true

  })

  // Select the TextMarker or span
  // (the former gets priority).
  if (textMarkerAtSpan) {
    textMarkerAtSpan.component.altTabTo()
  } else if (prevSpan) {
    cm.setSelection(
      Pos(prevSpan.line, prevSpan.start),
      Pos(prevSpan.line, prevSpan.end)
    )
  }
}


/**
 * Select the next span or TextMarker in the doc.
 */
export function tabToNextSpanOrMarker(cm) {

  const cursor = cm.getCursor('from')
  let spans = []
  let nextSpan = undefined
  let textMarkerAtSpan = undefined

  // Get all spans in doc after cursor
  for (var i = cursor.line; i < cm.lineCount(); i++) {
    const elements = getLineElements(cm, i)
    elements.forEach((e) => {
      spans.push(...e.spans)
    })
  }
    
  // Find next span
  nextSpan = spans.find(({ line, start, end }) => {

    const isOnSameLineAndGreaterCh = line == cursor.line && start > cursor.ch
    const isOnSubsequentLine = line > cursor.line

    // If the above are not true, keep looking...
    if (!isOnSameLineAndGreaterCh && !isOnSubsequentLine) return false

    // Else, we've found the next span!

    // Now check if there's a TextMarker at its position.
    textMarkerAtSpan = cm.findMarksAt(Pos(line, start))[0]

    // If there's a mark at the token, but it's already selected
    // return false (keep looking)
    if (textMarkerAtSpan && markIsAlreadySelected(cm, textMarkerAtSpan)) {
      textMarkerAtSpan = undefined
      return false
    }

    // Else, if we pass all the above, then we've found the next
    // span or TextMarker to tab to.
    return true

  })

  // Select the TextMarker or span
  // (the former gets priority).
  if (textMarkerAtSpan) {
    const { from, to } = textMarkerAtSpan.find()
    const element = getElementAt(cm, from.line, from.ch)
    
    textMarkerAtSpan.component.altTabTo()
  } else if (nextSpan) {
    cm.setSelection(
      Pos(nextSpan.line, nextSpan.start),
      Pos(nextSpan.line, nextSpan.end)
    )
  }
}


/**
 * Return true if the specified mark is already selected
 * @param {*} mark - TextMarker
 */
function markIsAlreadySelected(cm, mark) {
  if (!mark) return false
  const { from, to } = mark.find()
  const isSelected = cm.listSelections().some((range) => {
    const rangePos = getFromAndTo(range)
    return from.line == rangePos.from.line &&
      to.line == rangePos.to.line &&
      from.ch == rangePos.from.ch &&
      to.ch == rangePos.to.ch
  })
  return isSelected
}