import { getTopAndBottomLines, getLineClasses, isList } from "./editor-utils"


/**
 * Indent list line
 * If single line is selected, indent if 1) the line is a list, and 2) the preceding line is a list of an equal or lower depth. Else, if (1) is not true, just enter normal tab character.
 * If multiple lines are selected, only indent if 1) the selection starts and ends inside a list (and it's the same list) and 2) the topLine is safe to indent (same criteria as singe line).
 * @param {*} cm 
 */
export function indentList(cm) {
  if (cm.getOption('disableInput')) return CodeMirror.Pass
  const ranges = cm.listSelections()
  // For each selection...
  ranges.forEach((range, index) => {
    const isSingleLine = range.anchor.line == range.head.line
    if (isSingleLine) {
      const line = range.head.line
      const lineIsList = isList(cm, line)
      if (lineIsList) {
        const lineIsSafeToIndent = isSafeToIndentLine(cm, line, 'add')
        if (lineIsSafeToIndent) {
          // Indent the list line
          cm.indentLine(line, 'add')
        }
      } else {
        // Perform the default action
        cm.execCommand('defaultTab')
      }
    } else {
      const { topLine, bottomLine } = getTopAndBottomLines(range)
      // Is it safe to indent the selected lines?
      const topLineIsSafeToIndent = isSafeToIndentLine(cm, topLine, 'add')
      const selectionIsInsideSameList = selectionStartsAndEndsInsideSameList(cm, topLine, bottomLine)
      if (topLineIsSafeToIndent && selectionIsInsideSameList) {
        // Indent the list lines
        for (var i = topLine; i <= bottomLine; i++) {
          cm.indentLine(i, 'add')
        }
      }
    }
  })
}

/**
 * Un-indent list line
 * Almost identical logic to `indentList`. 
 * Except the dependency is on the subsequent ('next') line.
 * @param {*} cm 
 */
export function unindentList(cm) {
  if (cm.getOption('disableInput')) return CodeMirror.Pass
  const ranges = cm.listSelections()
  // For each selection...
  ranges.forEach((range) => {
    const isSingleLine = range.anchor.line == range.head.line
    if (isSingleLine) {
      const line = range.head.line
      const lineIsList = isList(cm, line)
      if (lineIsList) {
        const lineIsSafeToUnIndent = isSafeToIndentLine(cm, line, 'subtract')
        if (lineIsSafeToUnIndent) {
          // Un-indent the list line
          cm.indentLine(line, 'subtract')
        }
      } else {
        // Perform the default action
        cm.execCommand('indentAuto')
      }
    } else {
      const { topLine, bottomLine } = getTopAndBottomLines(range)
      // Is it safe to un-indent the selected lines?
      const bottomLineIsSafeToUnIndent = isSafeToIndentLine(cm, bottomLine, 'subtract')
      const selectionIsInsideSameList = selectionStartsAndEndsInsideSameList(cm, topLine, bottomLine)
      if (bottomLineIsSafeToUnIndent && selectionIsInsideSameList) {
        // Indent the list lines
        for (var i = topLine; i <= bottomLine; i++) {
          cm.indentLine(i, 'subtract')
        }
      }
    }
  })
}


// ---------- UTILITY FUNCTIONS ---------- //


/**
 * We only allow indentating multiple lines if the selection starts and 
 * stops inside the same list.
 */
function selectionStartsAndEndsInsideSameList(cm, topLine, bottomLine) {
  const topLineIsList = isList(cm, topLine)
  const bottomLineIsList = isList(cm, bottomLine)
  if (!topLineIsList || !bottomLineIsList) return false
  for (var i = topLine; i <= bottomLine; i++) {
    const lineIsList = isList(cm, i)
    if (!lineIsList) {
      return false
    }
  }
  return true
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
