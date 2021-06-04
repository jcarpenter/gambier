import { Pos } from "codemirror"
import { getFromAndTo, getModeAndState, getStartAndEndOfList, orderOrderedList, getLineTextWithoutBlockFormatting } from "../editor-utils"
import { blankLineRE, olLineStartRE, ulLineStartRE, taskListStartRE } from "../regexp"


/**
 * Turn line(s) of primary selection into the selected list type
 * If the list is currently the opposite type (e.g. `ul`, when you
 * want it to be `ol`), then convert while maintaining tree.
 * @param {object} config - E.g. { type: 'ol', taskList: false }
 */
export function toggleList(cm, type) {

  const ulMarkerChar = window.state.markdown.ulMarkerChar
  const ranges = cm.listSelections()

  // When we process a line as an ol, add it to `olLines`.
  // We'll use this array later to order the lists.
  let olLines = []

  for (const r of ranges) {

    const { from, to, isMultiLine, isSingleCursor } = getFromAndTo(r, true)

    // First try to toggle a surrounding list, if selection 
    // is singleCursor or a selection inside a line, and the 
    // line is already a list.

    if (isSingleCursor || !isMultiLine) {

      const cursor = from
      const { state, mode } = getModeAndState(cm, cursor.line)
      if (mode.name !== 'markdown') continue

      // If current line is not a list, make it one.
      if (!state.list) {
        makeLineIntoList(cm, cursor.line, type)
        if (type == 'ol') olLines.push(cursor.line)
        continue
      }

      // If line is list, and type is 'task', 
      // toggle task list on/off.
      if (type == 'task') {
        const { start, end } = getStartAndEndOfList(cm, cursor.line, state.list)
        for (var i = start; i <= end; i++) {
          toggleTaskListOnLine(cm, i, state)
        }
        continue
      }

      // Else, if line is list, and it's ul when it should be ol
      // (or vice versa), convert between the two types.
      const needToConvertUlOl =
        (type == 'ol' && state.list == 'ul') ||
        (type == 'ul' && state.list == 'ol')

      if (needToConvertUlOl) {
        const { start, end } = getStartAndEndOfList(cm, cursor.line, state.list)
        for (var i = start; i <= end; i++) {
          convertLineBetweenUlOl(cm, i, type, state)
        }
        if (type == 'ol') orderOrderedList(cm, start)
        continue
      }

      // Else, do nothing. Trying to toggle a list that's
      // already of the correct type does nothing. We 
      // could make it turn off the list, but won't, for now.
      continue
    }

    // Else, process line by line

    // First check for homgeneity.
    // Only toggle OFF if -all- selected lines are of desired type.
    // E.g. if type is 'ul', and -any- of the lines are not
    // ul, then toggle ul on for them, and don't touch the others.
    // Only toggle off if -all- the selected lines are `ul`.

    let allSelectedLinesAreOfSpecifiedType

    for (var i = from.line; i <= to.line; i++) {

      // Skip blank and non-markdown lines
      const { state, mode } = getModeAndState(cm, i)
      const isBlank = blankLineRE.test(cm.getLine(i))
      if (mode.name !== 'markdown' || isBlank) continue

      // If we find a line that is not of the desired type
      // we break the loop, and proceed
      const lineIsOfSpecifiedType =
        (type == 'ul' && state.list == 'ul') ||
        (type == 'ol' && state.list == 'ol') ||
        (type == 'task' && state.taskList)

      if (!lineIsOfSpecifiedType) {
        allSelectedLinesAreOfSpecifiedType = false
        break
      }

      // If we make it to last line, we know all 
      // all selected lines are of the type.
      if (to.line == i) {
        allSelectedLinesAreOfSpecifiedType = true
      }
    }

    // Once we know if all lines are of the specified type,
    // process the selection line by line.

    cm.operation(() => {

      for (var i = from.line; i <= to.line; i++) {

        // Skip blank and non-markdown lines
        const { state, mode } = getModeAndState(cm, i)
        const isBlank = blankLineRE.test(cm.getLine(i))
        if (mode.name !== 'markdown' || isBlank) continue

        // If type is task, toggle taskList
        
        if (type == 'task') {
          if (allSelectedLinesAreOfSpecifiedType) {
            // Toggle task list off
            toggleTaskListOnLine(cm, i, state)
          } else {
            // Toggle task list on
            if (!state.taskList) toggleTaskListOnLine(cm, i, state)
          }
          continue
        }

        // Else, if type is ul or ol, and the list is already
        // the desired type, strip formatting.

        const shouldStripFormatting =
          allSelectedLinesAreOfSpecifiedType &&
          (type == 'ol' || type == 'ul')

        if (shouldStripFormatting) {
          const text = getLineTextWithoutBlockFormatting(cm, i)
          cm.replaceRange(text, Pos(i, 0), Pos(i, cm.getLine(i).length), '+input')
          continue
        }

        // Else, if the type is ul or ol, and the list is
        // not uniformly the desired type, make it so.
        // If the line is already a list, but of the wrong type,
        // convert it. Else, if the line is not already a list,
        // make it a list of the desired type (ul or ol).

        if (state.list) {
          // Convert between ul/ol
          convertLineBetweenUlOl(cm, i, type, state)
          if (type == 'ol') olLines.push(i)
        } else {
          // Make the line a list of the specified type
          makeLineIntoList(cm, i, type)
          if (type == 'ol') olLines.push(i)
        }
      }

      // If type is ol, order each ol list that we created.
      // We could call `orderedList` on each line in `olLines`, 
      // but we calling it once per ol list is sufficient, and
      // more efficient. So we go through `olLines` to find 
      // the distinct lists, and then call orderLines on the
      // first line in each of them.
      if (type == 'ol') {

        // Find the start line of each ol list. It's a start if 
        // it's first in the array, OR if the preceding value is 
        // not sequential.
        // E.g. [5, 6, 7, 8, 11, 12, 13, 14]
        //       ^           ^
        const olListStarts = olLines.filter((l, index) => {
          const isFirstLine = index == 0
          const prevLine = olLines[index - 1]
          const isStartOfNewList = isFirstLine || prevLine !== l - 1
          return isStartOfNewList
        })

        olListStarts.forEach((line) => {
          orderOrderedList(cm, line, '+input', 1, true)
        })
      }
    })
  }
}


/**
 * Turn the line into a list line.
 * @param {integer} line - Line number
 * @param {string} type - "ol", "ul", or "task"
 */
function makeLineIntoList(cm, line, type) {
  
  const ulMarkerChar = window.state.markdown.ulMarkerChar
  switch (type) {
    case 'ul': var lineStart = `${ulMarkerChar} `; break;
    case 'ol': var lineStart = `1. `; break;
    case 'task': var lineStart = `${ulMarkerChar} [ ] `; break;
  }
  
  // Remove any existing line formatting
  const text = getLineTextWithoutBlockFormatting(cm, line, state)
  
  // Replace line with the text, plus line formatting
  cm.replaceRange(
    `${lineStart}${text}`,
    Pos(line, 0),
    Pos(line, cm.getLine(line).length),
    '+input'
  )
}


/**
 * Toggle the line between being a task list and not.
 * If we're toggling task list on, and the line isn't already 
 * a list, make it into a `ul`.
 * @param {integer} line - Line number
 * @param {object} state - CM state for the line
 */
function toggleTaskListOnLine(cm, line, state) {

  const enableTaskList = state.taskList == false
  const disableTaskList = state.taskList == true

  let lineText = cm.getLine(line)
  let lineLength = lineText.length

  if (!state.list) {
    makeLineIntoList(cm, line, 'task')
  } else if (enableTaskList) {
    if (state.list == 'ol') {
      lineText = lineText.replace(olLineStartRE, (match) => {
        return `${match}[ ] `
      })
    } else if (state.list == 'ul') {
      lineText = lineText.replace(ulLineStartRE, (match) => {
        return `${match}[ ] `
      })
    }
    cm.replaceRange(lineText, Pos(line, 0), Pos(line, lineLength), '+input')
  } else if (disableTaskList) {
    lineText = lineText.replace(taskListStartRE, (match, p1, p2) => {
      return `${p1}`
    })
    cm.replaceRange(lineText, Pos(line, 0), Pos(line, lineLength), '+input')
  }

}

/**
 * For the given line, if it's a list, convert it from one
 * type to the other (ul <--> ol).
 * @param {integer} line - Line number
 * @param {object} state - CM state for the line
 */
function convertLineBetweenUlOl(cm, line, type, state = undefined) {
  const ulMarkerChar = window.state.markdown.ulMarkerChar
  if (!state) state = getModeAndState(cm, line).state
  if (!state.list) return
  let lineText = cm.getLine(line)
  let lineLength = lineText.length

  const convertOlToUl = state.list == 'ol' && type == 'ul'
  const convertUlToOl = state.list == 'ul' && type == 'ol'

  if (convertOlToUl) {
    lineText = lineText.replace(olLineStartRE, (match, p1, p2, p3, p4) => {
      return `${p1}${ulMarkerChar}${p4}`
    })
  } else if (convertUlToOl) {
    lineText = lineText.replace(ulLineStartRE, (match, p1, p2, p3) => {
      return `${p1}1.${p3}`
    })
  }

  cm.replaceRange(lineText, Pos(line, 0), Pos(line, lineLength), '+input')
}