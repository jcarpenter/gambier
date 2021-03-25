import { indentList, unindentList } from "./indentList"
import { getSurroundingSpan, isLineClassesHeterogeneous, getTopAndBottomLines, getLineClasses, getLineSpans, getSpanAt, isSingleCursor } from "./editor-utils"
import { getElementAt, getElementsAt, getLineElements } from "./map"
import { citeEnd } from "citeproc"

/**
 * Make it hard to accidentally delete marks by selecting them first. 
 * User must press again to then actually delete the item.
 * Only works for single-cursor selections. If a range of text is 
 * selected, and/or there are multiple selections, we process
 * as usual.
 * @param {*} keyPressed 
 */
export function backspaceOrDelete(cm, keyPressed = '') {

  const cursor = cm.getCursor()
  const ranges = cm.listSelections()

  // Are there multiple selections?
  const multipleSelections = ranges.length > 1

  // Is a range of text selected?
  const textIsSelected =
    ranges[0].head.line !== ranges[0].anchor.line ||
    ranges[0].head.ch !== ranges[0].anchor.ch

  // If text is selected, process as normal backspace or delete.
  if (multipleSelections || textIsSelected) return CodeMirror.Pass

  // Else, check for and selected any adjacent marks.
  const { line, ch } = ranges[0].head
  const adjacentMark = cm.doc.findMarksAt({ line, ch })[0]
  if (adjacentMark) {
    // Get `from` and `to` objects
    const { from, to } = adjacentMark.find()
    // Select the adjacent mark
    cm.addSelection(
      { line: from.line, ch: from.ch },
      { line: to.line, ch: to.ch }
    )
  } else {
    return CodeMirror.Pass
  }
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