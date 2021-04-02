import { indentList, unindentList } from "./indentList"
import { isLineClassesHeterogeneous, getTopAndBottomLines, getLineClasses, getLineSpans, getSpanAt, isSingleCursor, getFromAndTo, getCharAt, getModeAndState, orderOrderedList } from "./editor-utils"
import { getElementAt, getElementsAt, getElementsInsideRange, getLineElements } from "./map"
import { markLine } from "./mark"
import { isValidHttpUrl, wait } from "../../shared/utils"

/**
 * Create an element of the selected type at each selection.
 * @param {*} type - Of element. 'link inline', 'citation', etc.
 */
export async function makeElement(cm, type) {
  
  const selections = cm.listSelections()

  cm.operation(() => {
    selections.forEach(async (s) => {
      
      const { from, to } = getFromAndTo(s)
      const isSingleCursor = from.line == to.line && from.ch == to.ch
      const text = isSingleCursor ? '' : cm.getRange(from, to)
      const elementAtSelection = !isSingleCursor && getElementsInsideRange(cm, from, to, true)
      const clipboard = await getClipboardContents()
      const clipboardIsUrl = isValidHttpUrl(clipboard)
    
      // Determine new element to write
      let newEl = ''
      switch (type) {
        
        case 'link inline': {
          // If user has selected a bare-url element, use it as the 
          // link url, and leave text blank. Else, if user has a url
          // in the clipboard, use that as link url, and use selected
          // text as the link text. Else, just use selected text as
          // link text, and leave url blank.
          if (elementAtSelection?.type == 'bare-url') {
            newEl = `[](${text})`
          } else if (clipboardIsUrl) {
            newEl = `[${text}](${clipboard})`
          } else {
            newEl = `[${text}]()`
          }
          break
        }

        case 'image inline': {
          // (Same as for link line, plus `!` to make it an image)
          if (elementAtSelection?.type == 'bare-url') {
            newEl = `![](${text})`
          } else if (clipboardIsUrl) {
            newEl = `![${text}](${clipboard})`
          } else {
            newEl = `![${text}]()`
          }
          break
        }

        case 'footnote inline': {
          newEl = `^[${text}]`
          break
        }

        case 'citation': {
          newEl = `[@${text}]`
          break
        }
      }

      cm.replaceRange(newEl, from, to)
      
      // const isElementsAtCursor = getElementsAt()
      // const isSelectedTextInsideAnotherElement =
      //   !isSingleCursor &&
      //   getElementAt(cm, from.line, from.ch) !== undefined

    })
  })

  // Try to select the mark (if one was created)
  if (!window.state.sourceMode && selections.length == 1) {
    // Wait a beat for CM to update
    await wait(10)
    const { from } = getFromAndTo(selections[0])
    const mark = cm.findMarksAt(from)[0]
    if (mark) {
      mark.component.openWizard(true)
    }
  }

}

// TODO: Move into utils
async function getClipboardContents() {
  try {
    const text = await navigator.clipboard.readText()
    return text
  } catch (err) {
    console.error('Failed to read clipboard contents: ', err)
  }
}


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

/**
 * Make it hard to accidentally delete marks by selecting them first. 
 * User must press again to then actually delete the item.
 * Only works for single-cursor selections. If a range of text is 
 * selected, and/or there are multiple selections, we process
 * as usual.
 * @param {*} keyPressed 
 */
export function backspaceOrDelete(cm, keyPressed = '') {

  const ranges = cm.listSelections()

  // If there are multiple selections, or text is selected, 
  // process as normal backspace or delete.
  const multipleSelections = ranges.length > 1
  const textIsSelected = cm.somethingSelected()
  if (multipleSelections || textIsSelected) return CodeMirror.Pass

  // Else, if there is an adjacent mark and we're trying to 
  // backspace or delete it, select it instead.
  const cursor = cm.getCursor()
  const adjacentMark = cm.findMarksAt(cursor)[0]
  if (adjacentMark) {
    const { from, to } = adjacentMark.find()
    const cursorIsOnLeftEdge = cursor.ch == from.ch
    const cursorIsOnRightEdge = cursor.ch == to.ch
    if (cursorIsOnLeftEdge && keyPressed == 'delete') {
      cm.addSelection(from, to)
      return
    } else if (cursorIsOnRightEdge && keyPressed == 'backspace') {
      cm.addSelection(from, to)
      return
    }
  }

  // Else, process keypress as normal
  return CodeMirror.Pass
}

export function wrapText(cm, char) {

  const sels = cm.getSelections()
  for (var i = 0; i < sels.length; i++)
    sels[i] = char + sels[i] + char;
  // sels.forEach((s) => s = 'Texican')
  cm.replaceSelections(sels, "around");
  // sels = cm.listSelections().slice();
}


export function autoCloseAsterix(cm) {
  console.log("autoCloseAsterix")
  return CodeMirror.Pass
}


/**
 * Tab performs different actions, depending on the line type
 * - Lists: Indent the list item
 * - Header: Increase the header depth
 */
export function tab(cm, shiftKey) {

  // Start by determing what's selected. In order of probability:
  // 1. Single cursor
  // 2. Single selection
  // 3. Multiple selections
  const ranges = cm.listSelections()

  // const isSingleCursor =
  //   ranges.length == 1 &&
  //   ranges[0].anchor.ch == ranges[0].head.ch &&
  //   ranges[0].anchor.line == ranges[0].head.line

  // const isSingleSelection =
  //   ranges.length == 1 &&
  //   ranges[0].anchor.ch !== ranges[0].head.ch ||
  //   ranges[0].anchor.line !== ranges[0].head.line

  // const isMultipleCursorsOrSelections = 
  //   ranges.length > 1

  ranges.forEach((range, index) => {

    // If the selection spans multiple lines and includes a 
    // heterogeneous mix of line types (e.g. header AND list)
    // do nothing (perform the default tab action).
    if (isLineClassesHeterogeneous(cm, range)) {
      // TODO
      // cm.execCommand('defaultTab')
      return CodeMirror.Pass
    }

    // Else, perform the appropriate action, based on line style.

    // Top and bottom lines of the selection
    const { topLine, bottomLine } = getTopAndBottomLines(range)

    // The "main" line class
    let mainLineClass = ''

    // Array of line numbers with the main line class
    let styledLines = []

    // Populate `lineClass` and `styledLines`
    for (var i = topLine; i <= bottomLine; i++) {
      const lineHandle = cm.getLineHandle(i)
      const lineClasses = getLineClasses(lineHandle)
      console.log(lineHandle)
      if (lineClasses) {
        // lineClasses are formatted like `header h1` and `ol list-1`
        // The "main" style is always the first word.
        // That's the one we want.
        mainLineClass = lineClasses.split(' ')[0]
        styledLines.push(i)
      }
    }

    // For each styled line, apply the appropriate tab action
    styledLines.forEach((line) => {

      const lineHandle = cm.getLineHandle(line)
      const lineClasses = getLineClasses(lineHandle)

      if (mainLineClass == 'header') {

        // Header: Increase or decrease depth
        // Max depth is 6.
        const headerDepth = lineClasses.match(/h(\d)/)[1]
        if (!shiftKey && headerDepth < 6) {
          // Increase
          cm.replaceRange('#', { line, ch: 0 })
        } else if (shiftKey && headerDepth > 0) {
          // Decrease
          cm.replaceRange('',
            { line, ch: 0 },
            { line, ch: 1 },
          )
        }

      } else if (mainLineClass == 'ul' || mainLineClass == 'ol') {

        // List: Indent or un-indent
        if (!shiftKey) {
          indentList(cm)
        } else {
          unindentList(cm)
        }


      }
    })
  })
}


/**
 * Toggle task list item(s). 
 */
export function toggleTaskChecked(cm) {
  if (cm.getOption('disableInput')) return CodeMirror.Pass
  const ranges = cm.listSelections()
  // For each selection...
  ranges.forEach((range) => {
    const { topLine, bottomLine } = getTopAndBottomLines(range)
    // For each line selected...
    for (var line = topLine; line <= bottomLine; line++) {
      // If the line is in a task list...
      const lineHandle = cm.getLineHandle(line)
      const lineClasses = getLineClasses(lineHandle)
      const isTaskList = lineClasses.includes('task')
      if (!isTaskList) continue
      // Toggle the open/closed value...
      const spans = getLineSpans(cm, lineHandle)
      const span = spans.find((s) => s.classes.includes('task'))
      cm.replaceRange(
        span.element.isClosed ? ' ' : 'x',
        { line, ch: span.start + 1 },
        { line, ch: span.start + 2 }
      )
    }
  })
  return CodeMirror.Pass
}


/**
 * Select the closest preceding selectable span in the doc.
 */
export function tabToPrevElement(cm) {

  // 'from' gets us the position from the left side of the cursor/selection.
  // This lets us tab to spans inside the current selection.
  const cursor = cm.getCursor('from')

  let element = null

  // Check if the cursor is already inside an element
  // 1) If it's NOT a TextMarker
  // 2) and it contains more (non-formatting) spans to select
  // ...set it as element.
  const surroundingElement = getElementAt(cm, cursor.line, cursor.ch)
  if (surroundingElement && isSingleCursor(cm)) {
    const isNotTextMarker = cm.findMarksAt(cursor).length == 0
    const hasMoreSpansToSelect = surroundingElement.spans.find((s) => {
      return !s.isFormatting && s.start > cursor.ch
    }) !== undefined
    if (isNotTextMarker && hasMoreSpansToSelect) {
      element = surroundingElement
    }
  }

  // Else, find the prev element
  if (!element) {

    for (var i = cursor.line; i >= 0; i--) {
      const lineHandle = cm.getLineHandle(i)
      const elements = getLineElements(cm, lineHandle)
      // Find the prev element on this line, or preceding
      element = elements.reverse().find((e) => {
        const isOnSameLineAndLesserCh =
          e.line == cursor.line &&
          e.end < cursor.ch
        const isOnPrecedingLine =
          e.line < cursor.line
        return isOnSameLineAndLesserCh || isOnPrecedingLine
      })
      // Break for loop once we've found the element
      if (element) break
    }
  }

  // If no element found, return
  if (!element) return

  // If there's a textmarker, select it, and return
  const textMarker = cm.findMarksAt({ line: element.line, ch: element.start + 1 })[0]
  if (!window.state.sourceMode && textMarker) {
    textMarker.component.altTabTo()
    return
  }

  // If element has `content` property (as in case of links)
  // try to select that first.
  if (element.content) {
    const contentAlreadySelected =
      cm.getCursor('from').ch == element.content.start &&
      cm.getCursor('to').ch == element.content.end

    if (!contentAlreadySelected) {
      cm.setSelection(
        { line: element.line, ch: element.content.start },
        { line: element.line, ch: element.content.end }
      )
      return
    }
  }
}

/**
 * Select the next 1) TextMarker, or 2) child span.
 * Do so by finding the next (or surrounding) element. 
 * If it's marked, call its `altTabTo` function.
 * Else, call the next of its child spans.
 */
export function tabToNextElement(cm) {

  const cursor = cm.getCursor('anchor')
  let element

  // Else, find the next element in the doc...
  for (var i = cursor.line; i < cm.lineCount(); i++) {
    const elements = getLineElements(cm, i)
    element = elements.find((e, index) => {

      // If we're inside an element, it's not a TextMarker
      // and it has more child spans to select, after the
      // current cursor position, select it.
      // E.g. Jump between child spans of a link, image, etc.

      const cursorIsInsideAnElement =
        e.line == cursor.line &&
        e.start < cursor.ch &&
        e.end > cursor.ch

      const elementIsNotMarker =
        !e.mark.isMarkable ||
        window.state.sourceMode

      const elementHasContentsToSelect =
        e.spans.find((c) => c.start > cursor.ch)

      if (cursorIsInsideAnElement && elementIsNotMarker && elementHasContentsToSelect) {
        return true
      }

      // Else, find next element on same or subsequent line:

      // Skip element if it's already selected
      const alreadySelected =
        e.line == cursor.line &&
        e.start == cursor.ch &&
        e.end == cm.getCursor('to').ch

      if (alreadySelected) return false

      // Find next element on same line...
      // Edge case check: make sure it's not inside a marked
      // element. E.g. some strong text inside a footnote.
      // Determine by looking for multiple elements at same spot.

      const isOnSameLineAndGreaterCh =
        e.line == cursor.line &&
        e.start >= cursor.ch

      if (isOnSameLineAndGreaterCh) {
        if (!window.state.sourceMode) {
          const markAt = cm.findMarksAt({ line: e.line, ch: e.start })[0]
          // If there's a mark present at the element start
          // we can tell if _around_ the element by checking the 
          // from and to values.
          const isNestedInsideMark =
            markAt !== undefined &&
            markAt?.find().from.ch < e.start ||
            markAt?.find().to.ch > e.end
          if (!isNestedInsideMark) return true
        } else {
          return true
        }
      }

      // Else, find first element on subsequent line...

      const isOnSubsequentLine =
        e.line > cursor.line

      if (isOnSubsequentLine) return true
    })

    // if (element) console.log(element)
    if (element) break
  }

  if (!element) return

  // If element has a marker, select it and return...
  if (!window.state.sourceMode && element.mark.isMarkable) {
    const textMarker = cm.findMarksAt({ line: element.line, ch: element.start + 1 })[0]
    if (textMarker) {
      textMarker.component.altTabTo()
      return
    }
  }

  // Else, select next child span
  const nextContents = element.spans.find((c) => {

    // If element is on subsequent line, get first content
    const isOnSubsequentLine =
      element.line > cursor.line
    if (isOnSubsequentLine) return true

    // Else, get next one
    const isOnSameLineAndGreaterCh =
      element.line == cursor.line &&
      c.start > cursor.ch
    return isOnSameLineAndGreaterCh
  })

  if (nextContents) {
    cm.setSelection(
      { line: element.line, ch: nextContents.start },
      { line: element.line, ch: nextContents.end }
    )
  }
}



/**
 * Select the next element in the doc
 * First, find the next (or surrounding) element. 
 * If it's a TextMarker, select the TextMarker `component`
 * Else, select the element's `content`
 */
export function tabToNextElementOLD(cm) {

  // 'anchor' will usually give us the ch position on the _left_ side 
  // of the cursor/selection. This helps us tab to spans nested inside the 
  // current selection. E.g. the emphasized text in a header:
  // `## A most _difficult_ year.
  const cursor = cm.getCursor('anchor')

  let element = null

  // Check if the cursor is already inside an element
  // 1) If it's NOT a TextMarker
  // 2) and it contains more (non-formatting) spans to select
  // ...set it as element.
  const surroundingElement = getElementAt(cm, cursor.line, cursor.ch)
  if (surroundingElement && isSingleCursor(cm)) {
    const isNotTextMarker = cm.findMarksAt(cursor).length == 0
    const hasMoreSpansToSelect = surroundingElement.spans.find((s) => {
      return !s.isFormatting && s.start > cursor.ch
    }) !== undefined
    if (isNotTextMarker && hasMoreSpansToSelect) {
      element = surroundingElement
    }
  }

  // Else, find the next element
  if (!element) {
    cm.eachLine(cursor.line, cm.lineCount(), (lineHandle) => {
      // If we're already found it, exit
      if (element) return
      const elements = getLineElements(cm, lineHandle)
      // Find the next element on this line, or subsequent
      element = elements.find((e) => {
        const alreadySelected =
          e.line == cursor.line &&
          e.start == cursor.ch &&
          e.end == cm.getCursor('to').ch
        if (alreadySelected) return false
        const isOnSameLineAndGreaterCh =
          e.line == cursor.line &&
          e.start >= cursor.ch
        const isOnSubsequentLine =
          e.line > cursor.line
        return isOnSameLineAndGreaterCh || isOnSubsequentLine
      })
    })
  }

  // If no element found, return
  if (!element) return

  // If there's a textmarker, select it, and return
  const textMarker = cm.findMarksAt({ line: element.line, ch: element.start + 1 })[0]
  if (!window.state.sourceMode && textMarker) {
    textMarker.component.altTabTo()
    return
  }

  // If element has `content` property (as in case of links)
  // try to select that first.
  if (element.content) {
    const contentAlreadySelected =
      cm.getCursor('from').ch == element.content.start &&
      cm.getCursor('to').ch == element.content.end

    if (!contentAlreadySelected) {
      cm.setSelection(
        { line: element.line, ch: element.content.start },
        { line: element.line, ch: element.content.end }
      )
      return
    }
  }

  // Else, get next non-formatting span, at element
  // const nextSpan = element
  // const nextSpan = element.spans.find((s) => {
  //   const isOnSameLineAndGreaterCh =
  //     s.line == cursor.line &&
  //     s.start > cursor.ch
  //   const isOnSubsequentLine =
  //     s.line > cursor.line &&
  //     s.start >= 0
  //   return !s.isFormatting && (isOnSameLineAndGreaterCh || isOnSubsequentLine)
  // })

  // // Select next span
  // if (nextSpan) {
  //   const { line, start, end } = nextSpan
  //   cm.setSelection({ line, ch: start }, { line, ch: end })
  // }

}

export function tabToNextMark(cm) {

  // If cursor is inside a mark, select that mark...
  // (only do this if there's a single, cursor)

  if (isSingleCursor(cm)) {
    const cursor = cm.getCursor()
    const surroundingMark = cm.findMarksAt(cursor)[0]
    if (surroundingMark) {
      selectMark(cm, surroundingMark)
      return
    }
  }

  // Else, select next mark in the doc

  // 'anchor' will usually give us the ch position on the _left_ side of the cursor/selection. This helps us tab to spans nested inside the current selection. E.g. the emphasized text in a header: `## A most _difficult_ year.
  const cursor = cm.getCursor('anchor')

  const allMarks = cm.getAllMarks()
  const nextMark = allMarks.find((m) => {
    const { from, to } = m.find()
    const isOnSameLineAndGreaterCh =
      from.line == cursor.line &&
      from.ch > cursor.ch
    const isOnSubsequentLine =
      from.line > cursor.line
    return isOnSameLineAndGreaterCh || isOnSubsequentLine
  })

  if (nextMark) selectMark(cm, nextMark)

}

function selectMark(cm, mark) {
  if (mark.component) {
    mark.component.altTabTo()
  } else {
    const { from, to } = mark.find()
    cm.setSelection(from, to)
  }
}



/**
 * Toggle header by adding/removing # characters at start of line.
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


/**
 * Toggle unordered list
 */
export function toggleUnorderedList(cm) {

  const { line, ch } = cm.getCursor()
  const lineHandle = cm.getLineHandle(line)
  const isUnorderedList = getLineClasses(lineHandle).includes('ul')

  if (isUnorderedList) {

    // Remove list:
    // Find ul characters and whitespace at start of line. E.g. `    * `
    // Regex demo: https://regex101.com/r/HjpoOO/1/
    const numOfCharactersToRemoveFromStart = cm.getLine(line).match(/^[ |\t]*[\*|\-|+][ |\t]+/m)[0].length
    cm.replaceRange('',
      { line, ch: 0 },
      { line, ch: numOfCharactersToRemoveFromStart }
    )

  } else {

    // Make list:
    // If immediately-previous line was unordered list, continue it 
    // by using that line's bullet list marker (*, -, or +).
    // Else, use *.

    const prevLineHandle = cm.getLineHandle(line - 1)
    const prevLineIsUl = prevLineHandle && getLineClasses(prevLineHandle).includes('ul')

    let charToUse = '*'
    if (prevLineIsUl) {
      // Get bullet character
      // Demo: https://regex101.com/r/jvG3GF/2
      charToUse = cm.getLine(line - 1).match(/^[ |\t]*(\*|\-|\+)/m)[1]
    }

    cm.replaceRange(`${charToUse} `, { line, ch: 0 })
  }
}


/**
 * If line is already ordered list, make it plain text.
 * If line is not ordered list, make it so.
 * If prev line was ordered list, continue it (increment, etc)
 * If line was unordered list, block quote, etc, convert it.
 * If next lines are ordered list, increment each.
 * If selection spans multiple lines, process each.
 * @param {*} cm 
 */
export function toggleOrderedList(cm) {

  let ulLineStart = /(\s*?)(\*|\-|\+)(\s*)/
  let olLineStart = /(\s*?)(\d)(\.|\))(\s*)/

  const cursor = cm.getCursor('head')
  const { state, mode } = getModeAndState(cm, cursor.line)
  if (mode.name !== 'markdown') return

  // If ul, convert to ol
  if (state.list == 'ul') {
    // Find start and end lines of the ul
    let start = cursor.line
    let end = cursor.line
    
    // Find start of `ul`
    for (var i = cursor.line - 1; i >= 0; i--) {
      const lineIsUl = getModeAndState(cm, i).state.list == 'ul'
      if (lineIsUl) {
        start = i
      } else {
        break
      }
    }
    
    // Find end of `ul`
    for (var i = cursor.line + 1; i <= cm.lastLine(); i++) {
      const lineIsUl = getModeAndState(cm, i).state.list == 'ul'
      if (lineIsUl) {
        end = i
      } else {
        break
      }
    }

    // cm.operation(() => {

      for (var i = start; i <= end; i++) {
        let line = cm.getLine(i)
        line = line.replace(ulLineStart, (match, p1, p2, p3) => {
          return `${p1}1.${p3}`
        })
        cm.replaceRange(line, { line: i, ch: 0 }, { line: i, ch: cm.getLine(i).length }, '+input')
      }

      orderOrderedList(cm, start)
    // })
  }

  return

  const ranges = cm.listSelections()
  
  // For each selection...
  for (const r of ranges) {
    const { from, to } = getFromAndTo(r)
    console.log(from.line, to.line)
    
    // For each line in the selection...
    for (let i = from.line; i <= to.line; i++) {
      console.log(i)
    
      const { state, mode } = getModeAndState(cm, i)
      if (mode.name !== 'markdown') continue
      
      // If line is already ordered list, make it plain text
      if (state.list == 'ol') {
        const line = cm.getLine(i)
        const charsToTrim = line.match(olLineStart)[0].length
        cm.replaceRange('', { line: i, ch: 0 }, { line: i, ch: charsToTrim })
        // TODO: If next lines are ol, decrement them
        continue
      }
      
      // Else, if line is not ordered list, make it so.  
      const { state: prevLineState } = getModeAndState(cm, i-1)
      if (prevLineState.list == 'ol') {
        // Continue list by matching indentation and incrementing.
        // Demo: https://regex101.com/r/TK2bzK/1
        const prevLine = cm.getLine(from.line-1)
        const match = prevLine.match(/(\s*?)(\d)(\.|\))(\s*)/)
        if (match) {
          const indent = match[1]
          const digit = parseInt(match[2])
          const delineator = match[3]
          const whitespace = match[4]
          const lineStart = `${indent}${digit+1}${delineator}${whitespace}`
          cm.replaceRange(lineStart, { line: from.line, ch: 0 }, { line: from.line, ch: 0 })
        } else {
          // We can get false positives on previous line being an ol
          // if it's actually a blank line _after_ and ol line.
          // In which case, match will fail, and we start a new list.
          cm.replaceRange('1. ', { line: i, ch: 0 }, { line: i, ch: 0 })
        }
      } else {
        cm.replaceRange('1. ', { line: i, ch: 0 }, { line: i, ch: 0 })
      }


    }
  }
}


/**
 * Open URL when user clicks w/ Cmd button held down,
 * if the click happens on a span with a URL.
 * Does not apply to TexMarkers w/ mark replacements
 * (CodeMirror doesn't get those clicks).
 */
export function wasUrlClicked(cm, pos) {

  const element = getElementAt(cm, pos.line, pos.ch)
  if (!element) return CodeMirror.Pass

  switch (element.type) {
    case 'link-inline':
      const span = getSpanAt(cm, pos.line, pos.ch)
      const clickedOnUrl = span.classes.includes('url')
      if (clickedOnUrl && span.string) {
        window.api.send('openUrlInDefaultBrowser', span.string)
        return
      }
      break
    case 'bare-url':
      window.api.send('openUrlInDefaultBrowser', element.markdown)
      return
    case 'email-in-brackets':
      window.api.send('openUrlInDefaultBrowser', `mailto:${element.url.string}`)
      return
    case 'url-in-brackets':
      window.api.send('openUrlInDefaultBrowser', element.url.string)
      return
  }

  // Else
  return CodeMirror.Pass
}


/**
 * Open URL when user keys 'Cmd-Enter', if a span with a url is selected.
 * NOTE: Only works if there is one selection active in the doc.
 * Behind the scenes, we re-use logic from `wasUrlClicked`.
 */
export function wasUrlEntered(cm) {

  const activeSelections = cm.listSelections()

  // Return if there are multiple selections, or no selection.
  if (activeSelections.length > 1) return CodeMirror.Pass

  const selectionPos = activeSelections[0].anchor

  wasUrlClicked(cm, selectionPos)

}