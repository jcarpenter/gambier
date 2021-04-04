import { getModeAndState, getPrimarySelection, getStartAndEndOfList, lineIsPlainText, orderOrderedList } from "../editor-utils"

/**
 * Turn line(s) of primary selection into the selected list type
 * If the list is currently the opposite type (e.g. `ul`, when you
 * want it to be `ol`), then convert while maintaining tree.
 * @param {string} type - 'ul' or 'ol'
 */
export function toggleList(cm, type) {

  const cursor = cm.getCursor('from')
  const { state, mode } = getModeAndState(cm, cursor.line)
  const oppositeListType = type == 'ul' ? 'ol' : 'ul'

  if (mode.name !== 'markdown') return

  // If list is already the same type, do nothing
  if (state.list == type) return

  // If line is currently the opposite type,
  // (e.g. an `ul`, when we want a `ol`)
  // then convert it.
  if (state.list == oppositeListType) {
    const { start, end } = getStartAndEndOfList(cm, cursor.line, oppositeListType)
    for (var i = start; i <= end; i++) {
      let lineText = cm.getLine(i)
      let lineTextLength = lineText.length
      if (state.list == 'ol') {
        lineText = lineText.replace(olLineStartRE, (match, p1, p2, p3, p4) => {
          return `${p1}*${p4}`
        })
      } else {
        lineText = lineText.replace(ulLineStartRE, (match, p1, p2, p3) => {
          return `${p1}1.${p3}`
        })
      }
      cm.replaceRange(lineText, { line: i, ch: 0 }, { line: i, ch: lineTextLength }, '+input')
    }

    if (type == 'ol') orderOrderedList(cm, start)
    return
  }

  // Else, if line is already the specified list type, 
  // convert the list to plain text
  // if (state.list == 'ul') {
  //   const { start, end } = getStartAndEndOfList(cm, cursor.line, 'ul')
  //   for (var i = start; i <= end; i++) {
  //     let lineText = cm.getLine(i)
  //     let lineTextLength = lineText.length
  //     lineText = lineText.replace(ulLineStartRE, '')
  //     cm.replaceRange(lineText, { line: i, ch: 0 }, { line: i, ch: lineTextLength }, '+input')
  //   }
  //   return
  // }

  // Else, make the selected lines into list
  // (as long as they are plain text, and not header, block, etc)

  let startLineWith = type == 'ul' ?
    `${window.state.markdown.ulMarkerChar} ` :
    `1. `

  // If previous line was list of same type, continue it 
  const { state: prevLineState } = getModeAndState(cm, cursor.line - 1)
  if (type == 'ul' && prevLineState.list == 'ul') {

    // Continue `ul` by matching indent and bullet char
    const prevLineText = cm.getLine(cursor.line - 1)
    const match = prevLineText.match(ulLineStartRE)
    if (match) startLineWith = match[0]

  } else if (type == 'ol' && prevLineState.list == 'ol') {

    // Continue `ol` by matching indent and incrementing digit.
    // Demo: https://regex101.com/r/TK2bzK/1
    const prevLineText = cm.getLine(cursor.line - 1)
    const match = prevLineText.match(olLineStartRE)
    if (match) {
      const indent = match[1]
      const digit = parseInt(match[2])
      const delineator = match[3]
      const whitespace = match[4]
      startLineWith = `${indent}${digit + 1}${delineator}${whitespace}`
    }
  }

  // For each line in the selection, add to the new list
  // one by one, top-to-bottom, until we hit a line that
  // is not plain text (e.g. a block quote or header) then 
  // break the loop and the list.
  const { from, to, isMultiLine } = getPrimarySelection(cm)
  for (var i = from.line; i <= to.line; i++) {
    if (lineIsPlainText(cm, i)) {
      cm.replaceRange(
        startLineWith,
        { line: i, ch: 0 },
        { line: i, ch: 0 },
        '+input'
      )
    } else {
      break
    }
  }

  // If new list is `ol`, find the start line, and order it.
  if (type == 'ol') {
    let startLine
    for (var i = from.line; i > 0; i--) {
      const prevLineIsOl = getModeAndState(cm, i - 1)?.state.list == 'ol'
      if (!prevLineIsOl) {
        startLine = i
        break
      }
    }
    orderOrderedList(cm, startLine)
  }
}
