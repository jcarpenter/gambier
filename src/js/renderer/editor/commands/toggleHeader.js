import { getLineClasses } from "../editor-utils"

/**
 * Toggle header by adding/removing # characters at start of line.
 * TODO: Update to new state-based system, add markdown check, etc.
 */
export function toggleHeader(cm) {

  const { line, ch } = cm.getCursor()
  const lineHandle = cm.getLineHandle(line)
  const lineIsHeader = getLineClasses(lineHandle).includes('header')

  if (lineIsHeader) {
    /* 
    Remove header characters: 
    */

    // First span is the formatting characters
    // Delete from the `start` to the `end` points.
    const spans = getLineSpans(cm, lineHandle)
    const { start, end } = spans[0]
    cm.replaceRange('',
      { line, ch: start },
      { line, ch: end }
    )
  } else {
    /*
    Make line a header:
    Always match level of preceding header:
    If we toggle header on a line that follows an H3,
    make the toggled line also an H3.
    Exception: There should only be one H1 per doc.
    If toggled line follows H1, make it an H2.
    Else, there is no header in the doc yet, make it H1.
    */

    // Find preceding header depth
    let precedingHeaderDepth = 0
    for (var i = line; i >= 0; i--) {
      const lineHandle = cm.getLineHandle(i)
      const lineClasses = getLineClasses(lineHandle)
      if (lineClasses.includes('header')) {
        precedingHeaderDepth = lineClasses.match(/h(\d)/)[1]
        precedingHeaderDepth = parseInt(precedingHeaderDepth)
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

    // Insert hash(es) and space at start of the line
    cm.replaceRange(insertAtStartOfLine, { line, ch: 0 })
  }
}
