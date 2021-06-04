import { getFromAndTo, writeMultipleEdits } from "../editor-utils"
import { wrapText2 } from "./wrapText"

/**
 * If user types '*' at start of line, and there's no selection
 * start a list. Else, forward to wrapText.
 */
export function underscore(cm) {
  let edits = []
  const ranges = cm.listSelections()
  ranges.forEach((r) => {
    const { from, to, isMultiLine, isSingleCursor } = getFromAndTo(r, true)
    const text = wrapText2(cm, '_', from, to, isSingleCursor)
    edits.push({
      text,
      from,
      to,
      select: {
        type: 'around',
        inset: [1, 1]
      }
    })
  })

  writeMultipleEdits(cm, edits)
}
