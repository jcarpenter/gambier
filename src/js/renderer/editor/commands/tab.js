import { getFromAndTo, getModeAndState, orderOrderedList } from "../editor-utils"
import { getLineClasses } from "../map"
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
      const lineHandle = cm.getLineHandle(i)
      const lineClasses = getLineClasses(lineHandle)
      const lineText = lineHandle.text
      const { state, mode } = getModeAndState(cm, i)

      const isUl = lineClasses.includes('ul')
      const isOl = lineClasses.includes('ol')
      const isList = isUl || isOl

      if (mode.name !== 'markdown') {
        cm.execCommand('defaultTab')
        return
      }

      if (state.header) {

        indentHeader(i, shiftKey, state, false)

      } else if (isList) {


        // List: Indent or un-indent.
        // If list is `ol`, update order.
        if (shiftKey) {
          if (isSafeToIndentLine(cm, i, state, 'subtract')) {
            cm.indentLine(i, 'subtract')
            if (isOl) orderOrderedList(cm, i, '+input', 1, true)
          }
        } else {

          // If it's safe to indent the list, do so.
          // Else, do nothing. Ignore the tab command.
          // TODO: Fine tune this in the future so that if cursor is on left
          // side of bullet, we do nothing (prevent indent), but we enter
          // tab command as normal if it's on right side of the bullet.

          if (isSafeToIndentLine(cm, i, state, 'add')) {
            cm.indentLine(i, 'add')
            if (isOl) orderOrderedList(cm, i, '+input', 1, true)
          } else {
            // Do nothing if user presses tab on 
            // cm.execCommand('defaultTab')
          }
        }

      } else {

        // Default tab
        // console.log('default tab')
        cm.execCommand('defaultTab')

      }
    }

    if (isMultiLine) {

      // For each line in the selection...
      for (var i = from.line; i <= to.line; i++) {

        const lineHandle = cm.getLineHandle(i)
        const lineClasses = getLineClasses(lineHandle)
        const lineText = lineHandle.text
        const { state, mode } = getModeAndState(cm, i)
  
        const isUl = lineClasses.includes('ul')
        const isOl = lineClasses.includes('ol')
        const isList = isUl || isOl  

        if (mode.name !== 'markdown' || blankLineRE.test(lineText)) continue

        if (state.header) {

          indentHeader(i, shiftKey, state, true)

        } else if (isList) {

          // If it's safe to indent the list, do so.
          // Else, do nothing. Ignore the tab command.
          // TODO: Fine tune this in the future so that if cursor is on left
          // side of bullet, we do nothing (prevent indent), but we enter
          // tab command as normal if it's on right side of the bullet.

          if (shiftKey) {
            if (isSafeToIndentLine(cm, i, 'subtract')) {
              cm.indentLine(i, 'subtract')
              if (isOl) orderOrderedList(cm, i, '+input', 1, true)
            }
          } else {
            if (isSafeToIndentLine(cm, i, 'add')) {
              cm.indentLine(i, 'add')
              if (isOl) orderOrderedList(cm, i, '+input', 1, true)
            } else {
              // Do nothing if user presses tab on 
              // cm.execCommand('defaultTab')
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
 * Allow indentation ('add'), when the indentation of the list 
 * item above is equal or greater than the selected line. 
 * Allow un-indentation ('subtract'), when 1) the indentation of 
 * the list item below is equal or less than the selected line, 
 * or 2) the selected line is at the end of the list.
 */
function isSafeToIndentLine(cm, lineNo, lineState, direction) {

  const lineHandle = cm.getLineHandle(lineNo)
  const lineClasses = getLineClasses(lineHandle)
  const isUl = lineClasses.includes('ul')
  const isOl = lineClasses.includes('ol')
  const listDepth = lineState.listStack.length

  if (direction == 'add') {

    // Can't indent first line of document.
    const isFirstLineOfDoc = lineNo == 0
    if (isFirstLineOfDoc) return false

    // We can indent if previous line is 1) of same list type,
    // and 2) greater or equal indentation, to current line.

    const prevLineHandle = cm.getLineHandle(lineNo - 1)
    const prevLineClasses = getLineClasses(prevLineHandle)
    const isPrevLineListOfSameType =
      isUl && prevLineClasses.includes('ul') ||
      isOl && prevLineClasses.includes('ol')

    const prevLineState = getModeAndState(cm, lineNo - 1).state
    const prevLineListDepth = prevLineState.listStack.length

    const safeToIndent = isPrevLineListOfSameType && prevLineListDepth >= listDepth
    return safeToIndent

  } else if (direction == 'subtract') {

    // Can un-indent if last line of document
    const isLastLineOfDoc = lineNo == cm.lastLine()
    if (isLastLineOfDoc) return true

    // We can un-indent if next line is not a list,
    // OR if current line indentation is greater than or equal to 
    // the next line indentation.

    const nextLineHandle = cm.getLineHandle(lineNo + 1)
    const nextLineClasses = getLineClasses(nextLineHandle)
    const isNextLineList = nextLineClasses.includes('list')

    const nextLineState = getModeAndState(cm, lineNo + 1).state
    const nextLineListDepth = nextLineState.listStack.length

    const safeToUnIndent = !isNextLineList || listDepth >= nextLineListDepth
    return safeToUnIndent
  }

  // 5/6/2021: Old state-based version
  // const listDepth = lineState.listStack.length

  // if (direction == 'add') {

  //   const isFirstLineOfDoc = lineNo == 0
  //   if (isFirstLineOfDoc) return false

  //   const prevLineState = getModeAndState(cm, lineNo - 1).state
  //   const isPrevLineListOfSameType = prevLineState.list == lineState.list
  //   const prevLineListDepth = prevLineState.listStack.length

  //   const safeToIndent = isPrevLineListOfSameType && prevLineListDepth >= listDepth
  //   return safeToIndent

  // } else {

  //   const isLastLineOfDoc = lineNo == cm.lastLine()
  //   if (isLastLineOfDoc) return true

  //   const nextLineState = getModeAndState(cm, lineNo + 1).state
  //   const isNextLineList = nextLineState.list
  //   const nextLineListDepth = nextLineState.listStack.length

  //   const safeToUnIndent = !isNextLineList || listDepth >= nextLineListDepth
  //   return safeToUnIndent
  // }
}
