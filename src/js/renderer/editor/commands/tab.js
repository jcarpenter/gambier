import { getFromAndTo, getModeAndState, orderOrderedList } from "../editor-utils"
import { blankLineRE } from "../regexp"

/**
 * Tab performs different actions, depending on the line type
 * - Lists: Indent the list item
 * - Header: Increase the header depth
 */
export function tab(cm, shiftKey) {

  const ranges = cm.listSelections()

  ranges.forEach((range, index) => {

    // Base the action on the from
    const { from, to, isMultiLine } = getFromAndTo(range, true)

    if (!isMultiLine) {
      const i = from.line
      const { state, mode } = getModeAndState(cm, i)
      const lineText = cm.getLine(i)

      if (mode.name !== 'markdown') return

      if (state.header) {

        indentHeader(i, shiftKey, state, false)

      } else if (state.list) {

        // List: Indent or un-indent.
        // If list is `ol`, update order.
        if (shiftKey) {
          if (isSafeToIndentLine(cm, i, 'subtract')) {
            cm.indentLine(i, 'subtract')
            if (state.list == 'ol') orderOrderedList(cm, i, '+input', 1, true)

          }
        } else {
          if (isSafeToIndentLine(cm, i, 'add')) {
            cm.indentLine(i, 'add')
            if (state.list == 'ol') orderOrderedList(cm, i, '+input', 1, true)
          } else {
            cm.execCommand('defaultTab')
          }
        }

      } else {

        // Default tab
        cm.execCommand('defaultTab')

      }
    }

    if (isMultiLine) {

      // For each line in the selection...
      for (var i = from.line; i <= to.line; i++) {

        const { state, mode } = getModeAndState(cm, i)
        const lineText = cm.getLine(i)

        if (mode.name !== 'markdown' || blankLineRE.test(lineText)) continue

        if (state.header) {
          
          indentHeader(i, shiftKey, state, true)

        } else if (state.list) {
          
          if (shiftKey) {
            if (isSafeToIndentLine(cm, i, 'subtract')) {
              cm.indentLine(i, 'subtract')
              if (state.list == 'ol') orderOrderedList(cm, i, '+input', 1, true)
            }
          } else {
            if (isSafeToIndentLine(cm, i, 'add')) {
              cm.indentLine(i, 'add')
              if (state.list == 'ol') orderOrderedList(cm, i, '+input', 1, true)
            }
          }
        }
      }
    }
  })

  /**
   * Increase or decrease header depth at line (max 6).
   * @param {*} line 
   * @param {*} shiftKey 
   */
  function indentHeader(line, shiftKey, state, isMultiLineSelection) {
    if (!shiftKey && state.header < 6) {
      cm.replaceRange('#', { line, ch: 0 }, { line, ch: 0 }, '+input')
    } else if (shiftKey && state.header > 0) {
      cm.replaceRange('', { line, ch: 0 }, { line, ch: 1 }, '+input')
    } else if (!isMultiLineSelection) {
      cm.execCommand('defaultTab')
    }
  }
}


/**
 * Allow indentation ('add'), when the indentation of the list item above is equal or greater than the selected line. 
 * Allow un-indentation ('subtract'), when 1) the indentation of the list item below is equal or less than the selected line, or 2) the selected line is at the end of the list.
 */
function isSafeToIndentLine(cm, line, direction) {

  const thisLineClasses = getLineClasses(cm.getLineHandle(line))
  const thisLineDepth = thisLineClasses.match(/list-(\d)/)[1]

  if (direction == 'add') {

    const isFirstLineOfDoc = line == 0
    if (isFirstLineOfDoc) return false

    const prevLineClasses = getLineClasses(cm.getLineHandle(line - 1))
    const prevLineIsList = prevLineClasses.includes('list')
    const prevLineDepth = prevLineIsList && prevLineClasses.match(/list-(\d)/)[1]  

    const safeToIndent = prevLineDepth >= thisLineDepth
    return safeToIndent

  } else {

    const isLastLineOfDoc = line == cm.lastLine()
    if (isLastLineOfDoc) return true

    const nextLineClasses = getLineClasses(cm.getLineHandle(line + 1))
    const nextLineIsList = nextLineClasses.includes('list')
    const nextLineDepth = nextLineIsList && nextLineClasses.match(/list-(\d)/)[1]  

    const safeToUnIndent = !nextLineIsList || thisLineDepth >= nextLineDepth
    return safeToUnIndent
  }
}
