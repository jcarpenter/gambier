import { getMode, Pos } from "codemirror"
import { getFromAndTo, getModeAndState, writeMultipleEdits } from "../editor-utils"

/**
 * Toggle header by adding/removing # characters at start of line.
 * If range includes a selection (is not single cursor), we work 
 * on the anchor line.
 */
export function toggleHeader(cm) {

  const ranges = cm.listSelections()
  let edits = []

  for (const r of ranges) {

    const { line, ch } = r.anchor
    const { state, mode } = getModeAndState(cm, line)
    const { from, to, isMultiLine, isSingleCursor } = getFromAndTo(r, true)
    if (mode.name !== 'markdown') continue

    if (state.header) {

      // Remove header characters,
      // https://regex101.com/r/YRtKTX/1
      const lineText = cm.getLine(line)
      const text = lineText.replace(/^#+\s*/, '')
      const diffLength = lineText.length - text.length
      edits.push({ 
        text,
        from: Pos(line, 0), 
        to: Pos(line, lineText.length), 
        select: { 
          type: 'range', 
          from: Pos(from.line, from.ch - diffLength),
          to: Pos(to.line, to.ch - diffLength),
        } 
      })

    } else {

      // Make line a header:
      // Always match level of preceding header:
      // If we toggle header on a line that follows an H3,
      // make the toggled line also an H3.
      // Exception: There should only be one H1 per doc.
      // If toggled line follows H1, make it an H2.
      // Else, there is no header in the doc yet, make it H1.

      let precedingHeaderDepth = 0
      for (var i = line; i >= 0; i--) {
        const { state, mode } = getModeAndState(cm, i)
        if (mode.name !== 'markdown') continue
        if (state.header) {
          precedingHeaderDepth = state.header
          break
        }
      }

      // Construct characters to insert at start of line:
      // one or more hashes followed by a space.
      let insertAtStartOfLine = ''
      switch (precedingHeaderDepth) {
        case 0:
          insertAtStartOfLine = '# '
          break
        case 1:
          insertAtStartOfLine = '## '
          break
        default:
          insertAtStartOfLine = '#'.repeat(precedingHeaderDepth) + ' '
      }

      edits.push({ 
        text: insertAtStartOfLine,
        from: Pos(line, 0), 
        to: Pos(line, 0), 
        select: { 
          type: 'range', 
          from: Pos(from.line, from.ch + insertAtStartOfLine.length),
          to: Pos(to.line, to.ch + insertAtStartOfLine.length),
        } 
      })

    }
  }

  writeMultipleEdits(cm, edits)
}


