import { Pos } from "codemirror"
import { getFromAndTo, writeMultipleEdits } from "../editor-utils"
import { getElementsAt } from "../map"
import { wrapText2 } from "./wrapText"

/**
 * If user types '*' at start of line, and there's no selection
 * start a list. Else, forward to wrapText.
 */
export function asterix(cm) {
  let edits = []
  const ranges = cm.listSelections()
  ranges.forEach((r) => {
    const { from, to, isMultiLine, isSingleCursor } = getFromAndTo(r, true)
    if (from.ch == 0 && isSingleCursor) {
      edits.push({
        text: '* ',
        from: Pos(from.line, 0),
        to: Pos(from.line, 0),
        select: {
          type: 'end'
        }
      })
    } else {
      const text = wrapText2(cm, '*', from, to, isSingleCursor)
      edits.push({
        text,
        from,
        to,
        select: {
          type: 'around',
          inset: [1, 1]
        }
      })
    }
  })

  writeMultipleEdits(cm, edits)
}
