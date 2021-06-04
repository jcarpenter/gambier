import { Pos } from "codemirror";
import { getFromAndTo, getModeAndState, writeMultipleEdits } from "../editor-utils";
import { getElementAt, getStyledElementAtRange } from "../map";

/**
 * Toggle styled element at the selections. 
 * If text is selected and plain, wrap in the chars.
 * Else if single cursor and plain text, insert a pair
 * or the chars around the cursor. E.g. `**|**`,
 * Else if an existing styled element is selected, 
 * convert it to the selected `type`.
 * Works with multiple cursors and selections? Yes.
 * @param {*} cm 
 * @param {string} type - 'strong', 'emphasis', 'code', or 'strikethrough'
 * @param {string} chars - To insert pair of. E.g. '**' or '_'
 */
export async function toggleInlineStyle(cm, type, chars) {

  const ranges = cm.listSelections()
  let edits = []

  ranges.forEach((r) => {

    const { from, to, isMultiLine, isSingleCursor } = getFromAndTo(r, true)
    
    // Do nothing if range is not inside markdown
    const { state, mode } = getModeAndState(cm, from.line)
    if (mode.name !== 'markdown') return

    if (isSingleCursor) {

      const cursor = from
      const el = getElementAt(cm, cursor.line, cursor.ch, type)

      if (el) {

        // Toggle type OFF
        edits.push({ 
          text: el.spans[0].string, 
          from: Pos(el.line, el.start), 
          to: Pos(el.line, el.end), 
          select: { 
            type: 'cursor', 
            ch: from.ch - el.start - chars.length
          } 
        })

      } else {

        // Toggle type ON:
        // Insert pair of `chars` around the cursor.
        // E.g. `**|**` or `_|_`
        edits.push({ 
          text: `${chars}${chars}`, 
          from, 
          to, 
          select: { 
            type: 'cursor', 
            ch: chars.length
          } 
        })

      }

    } else {

      const el = getStyledElementAtRange(cm, from, to)
      console.log(el)

      if (el?.type == type) {

        // Toggle OFF type on the selected text
        edits.push({ 
          text: el.spans[0].string,
          from: Pos(el.line, el.start), 
          to: Pos(el.line, el.end), 
          select: { 
            type: 'around',
          }
        })

      } else if (el?.type.equalsAny('strong', 'emphasis', 'code', 'strikethrough')) {

        // Transform from one element type into another
        edits.push({ 
          text: `${chars}${el.spans[0].string}${chars}`,
          from: Pos(el.line, el.start), 
          to: Pos(el.line, el.end), 
          select: { 
            type: 'around',
            inset: [chars.length, chars.length], 
          }
        })

      } else {

        // Toggle ON type on the selected text.
        edits.push({ 
          text: `${chars}${cm.getRange(from, to)}${chars}`,
          from, 
          to, 
          select: { 
            type: 'around',
            inset: [chars.length, chars.length], 
          }
        })

      }
    }

  })

  writeMultipleEdits(cm, edits)

}

