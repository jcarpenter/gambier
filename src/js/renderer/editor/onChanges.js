import { getCharAt, getLineClasses, getPrevChars, getNextChars, getTextFromRange, getDocElements, setUnsavedChanges, getLineElements } from "./editor-utils"
import { clearLineMarks, markDoc, markElement, markLine } from "./mark"
import { getElementAt } from "./map"

/**
 * "Like the 'change' event, but batched per operation, passing an array containing all the changes that happened in the operation. This event is fired after the operation finished, and display changes it makes will trigger a new operation." — https://codemirror.net/doc/manual.html#event_changes
 */
export function onChanges(cm, changes) {


  const isMultipleChanges = changes.length > 1
  const oneOfChangesSpansMultipleLines = changes.some((change) =>
    change.from.line !== change.to.line ||
    change.origin === '+swapLine'
  )

  // Update `unsavedChanges` on parent panel.
  setUnsavedChanges(cm)

  // Set cursor, if `cm.setCursorAfterChanges` !== null. We use this when want to place the cursor at a specific position _after_ we've changed the text.
  // if (cm.setCursorAfterChanges !== null) {
  //   cm.setCursor(cm.setCursorAfterChanges)
  //   // Reset
  //   cm.setCursorAfterChanges = null
  // }


  // ------ If there are multiple changes, or a multi-line change... ------ //

  // markDoc...
  if (isMultipleChanges || oneOfChangesSpansMultipleLines) {
    markDoc(cm)
    return
  }


  // ------ Else, process as single edit on single line ------ //

  const { from, to, text, removed, origin } = changes[0]
  const lineHandle = cm.getLineHandle(from.line)
  const lineClasses = getLineClasses(lineHandle)
  const textMarkers = cm.findMarks(
    { line: from.line, ch: 0 },
    { line: from.line, ch: cm.getLine(from.line).length }
  )
  const cursor = cm.getCursor()


  // ------ If a reference definition was changed, we re-mark whole doc ------ //

  // Because if reference definitions change, links/images/footnotes
  // that point to them also need to change.

  const isReferenceDefinition = lineClasses.includes('definition')
  if (isReferenceDefinition) {
    markDoc(cm)
    return
  }


  // ------ If change happened inside TextMarker, update it ------ //

  const textMarker = cm.findMarksAt(cursor)[0]
  if (textMarker) {
    textMarker.component.updateDisplayedText()
    return
  }


  // ------ If a new element was created, check if it needs a TextMarker ------ //

  if (!window.state.sourceMode) {
    const elementAtCursor = getElementAt(cm, from.line, from.ch)
    const isMarkable = elementAtCursor?.mark.isMarkable
    if (elementAtCursor && isMarkable) {
      const isAlreadyMarked = cm.findMarksAt({ line: from.line, ch: from.ch }).length
      const elementNeedsMark = isMarkable && !isAlreadyMarked
      const cursorIsInside =
        cursor.ch > elementAtCursor?.start &&
        cursor.ch < elementAtCursor?.end
      if (elementNeedsMark && !cursorIsInside) {
        markElement(cm, elementAtCursor)
        return
      } else {
        const marks = cm.getAllMarks()
        const alreadyBookmarked = marks.find((m) => m.type == 'bookmark' && m.isSpotToMark)
        if (!alreadyBookmarked) {
          const bookmark = cm.setBookmark(cursor)
          bookmark.isSpotToMark = true
          console.log(cm.getAllMarks())
        }
        return
      }
    }
  }


  // ------ Else, determine if we should show autocomplete ------ //

  // We never show autocomplete on undo
  const isUndo = changes.some((change) => change.origin == 'undo')
  const changeText = text[0]
  const isSingleChar = changeText.length == 1
  const isMultipleChar = changeText.length > 2

  const isEmptyBrackets =
    changeText == '[]' &&
    getPrevChars(cm, 0, 2, cursor) !== '[[' && // local link (open)
    getNextChars(cm, 0, 2, cursor) !== ']]' && // local link (close)
    getPrevChars(cm, 0, 2, cursor) !== '^[' // inline footnote (open)

  const isBracketsAroundSelection =
    changeText.length > 2 &&
    changeText.firstChar() == '[' &&
    changeText.lastChar() == ']' &&
    getPrevChars(cm, 0, 2, cursor) !== '[[' &&
    getNextChars(cm, 0, 2, cursor) !== ']]' &&
    getPrevChars(cm, 0, 2, cursor) !== '^['

  const showElementsAutocomplete = !isUndo && (isEmptyBrackets || isBracketsAroundSelection)

  if (showElementsAutocomplete) {
    cm.autocomplete.show('elements')
    return
  }

  // ------ Else, if there are TextMarkers, clear and re-mark the line ------ //

  // if (textMarkers.length) {
  //   console.log("clear and re-mark the line")
  //   clearLineMarks(cm, lineHandle)
  //   markLine(cm, lineHandle)
  // }

  return


  const isInlineFootnote =
    getCharAt(cm, from.line, to.ch - 1) == '^'

  const showCitationsAutocomplete =
    changeText == '@' &&
    getPrevChars(cm, 0, 2, cursor) == '[@' &&
    getNextChars(cm, 0, 1, cursor) == ']' &&
    !isUndo

  const showLocalLinkAutocomplete =
    changeText == '[]' &&
    getPrevChars(cm, 0, 2, cursor) == '[[' &&
    getNextChars(cm, 0, 2, cursor) == ']]' &&
    !isUndo






  // cm.dispatch({ type: 'changes', changes: changes })

  // Focus widget, if `cm.focusWidgetAfterChanges` !== null. We use this when we want to focus a widget after making changes (e.g. creating it in Autocomplete).

  // if (cm.focusWidgetAfterChanges !== null) {
  //   const from = cm.focusWidgetAfterChanges.from
  //   const to = cm.focusWidgetAfterChanges.to
  //   const element = editorState.inlineElements.find(
  //     (e) =>
  //       from.line == e.line &&
  //       from.ch <= e.start &&
  //       to.ch >= e.end &&
  //       e.widget &&
  //       e.widget.editable
  //   )
  //   if (element) element.widget.tabInto()

  //   // Reset
  //   cm.focusWidgetAfterChanges = null
  // }

  // isChangesPending = false
}


