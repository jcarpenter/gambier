import { Pos } from "codemirror"
import { CodeMirror } from "globalthis/implementation"
import * as WizardManager from "../../WizardManager"
import { getFromAndTo } from "../editor-utils"
import { getLineElements } from "../map"

/**
 * Select the next TextMarker or token.
 */
export function tabToNextElement(cm) {

  const cursor = cm.getCursor('anchor')
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
    // return false (keep looking for next token/mark)
    if (textMarkerAtSpan) {

      const markIsAlreadySelected = cm.listSelections().some((range) => {
        const rangePos = getFromAndTo(range)
        const markPos = textMarkerAtSpan.find()
        return markPos.from.line == rangePos.from.line &&
          markPos.to.line == rangePos.to.line &&
          markPos.from.ch == rangePos.from.ch &&
          markPos.to.ch == rangePos.to.ch
      })

      if (markIsAlreadySelected) {
        textMarkerAtSpan = undefined
        return false
      }
    }

    // If we pass all the above, then we've found the next
    // span or TextMarker to tab to.
    return true

  })

  // Select the next TextMarker or span
  // (the former gets priority).
  if (textMarkerAtSpan) {
    textMarkerAtSpan.component.altTabTo()
  } else if (nextSpan) {
    cm.setSelection(
      Pos(nextSpan.line, nextSpan.start),
      Pos(nextSpan.line, nextSpan.end)
    )
  }
}
