import { indentList, unindentList } from "./indentList"
import { getSurroundingSpan, isLineClassesHeterogeneous, getTopAndBottomLines, getLineClasses, getLineSpans, getSpanAt } from "./editor-utils"


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

  // Select the _surrounding_ span, if the cursor is a single cursor
  // (there's no selected text), and is inside a selectable span.

  let spanToSelect = getSurroundingSpan(cm)

  // Else, if the above didn't find a span to select, find and
  // select the _previous_ span in the doc.

  if (!spanToSelect) {

    // 'from' gets us the position from the left side of the cursor/selection.
    // This lets us tab to spans inside the current selection.
    const cursor = cm.getCursor('from')

    for (var i = cursor.line; i >= 0; i--) {
      const lookFromCh = i == cursor.line ? cursor.ch : cm.doc.getLine(i).length + 1
      let spans = getLineSpans(cm, cm.getLineHandle(i))

      // Ignore formatting
      spans = spans.filter((s) => !s.isFormatting)

      // Find preceding span on the line
      spanToSelect = spans.reverse().find((s) => {
        // TODO, 2/18: We're not selecting parent spans in nested span situations.
        // I think s.end needs to be s.start, but when I make the change, nothing happens.
        // Might need to change cursor `from` to `to`?
        const isBeforeCursor = lookFromCh >= s.end
        return isBeforeCursor
      })

      // If a span was found on this line, exit (break) the loop
      // Else, the loop runs again and checks the next line.
      if (spanToSelect) break
    }
  }

  // If the above have found a span, select it.
  // If the span is a marked element, select it and open the wizard.
  // Else, do nothing.
  if (spanToSelect) {
    if (spanToSelect.element?.isMarked) {
      spanToSelect.element.mark.component.altTabTo()
    } else {
      const { line, start, end } = spanToSelect
      cm.doc.setSelection({ line, ch: start }, { line, ch: end })
    }
  }
}


/**
 * Select the next selectable span in the doc.
 */
export function tabToNextElement(cm) {

  // Select the _surrounding_ span, if the cursor is a single cursor
  // (there's no selected text), and is inside a selectable span.

  let spanToSelect = getSurroundingSpan(cm)

  // Else, if the above didn't find a span to select, find and
  // select the _next_ span in the doc.

  if (!spanToSelect) {

    // 'anchor' will usually give us the ch position on the _left_ side 
    // of the cursor/selection. This helps us tab to spans nested inside the 
    // current selection. E.g. the emphasized text in a header:
    // `## A most _difficult_ year.
    const cursor = cm.getCursor('anchor')

    for (var i = cursor.line; i <= cm.lineCount() - 1; i++) {
      const lookFromCh = i == cursor.line ? cursor.ch : 0
      let spans = getLineSpans(cm, cm.getLineHandle(i))

      // Ignore formatting
      spans = spans.filter((s) => !s.isFormatting)

      // Find next span on the lne
      spanToSelect = spans.find((s) => {
        const isAfterCursor =
          lookFromCh < s.start ||
          lookFromCh == 0 && s.start == 0
        return isAfterCursor
      })

      // If a span was found on this line, exit (break) the loop
      // Else, the loop runs again and checks the next line.
      if (spanToSelect) break
    }
  }

  // If the above have found a span, select it.
  // If the span is a marked element, select it and open the wizard.
  // Else, do nothing.
  if (spanToSelect) {
    if (spanToSelect.element?.isMarked) {
      spanToSelect.element.mark.component.altTabTo()
    } else {
      const { line, start, end } = spanToSelect
      cm.doc.setSelection({ line, ch: start }, { line, ch: end })
    }
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
 */
export function wasUrlClicked(cm, pos) {
  const spanAtCursor = getSpanAt(cm, pos.line, pos.ch)
  if (!spanAtCursor) return CodeMirror.Pass
  switch (spanAtCursor.element?.type) {
    case 'bare-url':
      window.api.send('openUrlInDefaultBrowser', spanAtCursor.element.markdown)
      return
    case 'email-in-brackets':
      window.api.send('openUrlInDefaultBrowser', `mailto:${spanAtCursor.element.url.string}`)
      return
    case 'url-in-brackets':
      window.api.send('openUrlInDefaultBrowser', spanAtCursor.element.url.string)
      return
  }
  // const isUrl = spanAtCursor.classes.includes()
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