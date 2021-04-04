import { getFromAndTo } from "../editor-utils"

/**
 * Make alt-right into editable marks (e.g. links) work the same
 * as alt-right through lines of text: jump to end of the next
 * word on the same line.
 * TODO: Handle multiple cursors. As-is, if there are multiple
 * and one of them enters a mark, the others will disappear.
 * @param {*} direction - 'left' or 'right'
 */
export function altArrow(cm, buttonPressed) {

  const ranges = cm.listSelections()

  for (const range of ranges) {
    
    const isSingleCursor =
      range.anchor.line == range.head.line &&
      range.anchor.ch == range.head.ch

    if (!isSingleCursor) {

      return CodeMirror.Pass

    } else {

      const { from, to } = getFromAndTo(range)
      const lineText = cm.getLine(from.line)

      if (buttonPressed == 'right') {
        // Find index of next instance of whitespace followed
        // by word character, or ] or ).
        // Demo: https://regex101.com/r/tOhVub/1
        const indexOfEndOfNextWord = lineText.slice(from.ch).search(/\S[\s|]|\)]/)
        if (indexOfEndOfNextWord !== -1) {
          const mark = cm.findMarksAt({ line: from.line, ch: from.ch + indexOfEndOfNextWord + 1 })[0]
          if (mark?.isEditable) {
            mark.component.altArrowInto('left')
            return
          }
        }
      } else if (buttonPressed == 'left') {
        // Find index of prev instance of whitespace followed
        // by word character, or ] or ).
        // Demo: https://regex101.com/r/tOhVub/1
        const lineTextReversed = [...lineText.slice(0, from.ch)].reverse().join('')
        const indexOfStartOfPrevWord = lineTextReversed.search(/\S[\s|]|\)]/)
        if (indexOfStartOfPrevWord !== -1) {
          const mark = cm.findMarksAt({ line: from.line, ch: from.ch - indexOfStartOfPrevWord - 1 })[0]
          if (mark?.isEditable) {
            mark.component.altArrowInto('right')
            return
          }
        }
      }
    }
  }

  return CodeMirror.Pass
}