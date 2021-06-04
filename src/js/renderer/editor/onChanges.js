import { getCharAt, getPrevChars, getNextChars, setUnsavedChanges, getModeAndState, orderOrderedList } from "./editor-utils"
import { clearLineMarks, markDoc, markElement, markLine } from "./mark"
import { getElementAt, getLineClasses } from "./map"
import { Pos } from "codemirror"

/**
 * "Like the 'change' event, but batched per operation, passing an array containing all the changes that happened in the operation. This event is fired after the operation finished, and display changes it makes will trigger a new operation." — https://codemirror.net/doc/manual.html#event_changes
 */
export function onChanges(cm, changes) {

  const isMultipleChanges = changes.length > 1
  const oneOfChangesSpansMultipleLines = changes.some((change) =>
    change.from.line !== change.to.line ||
    change.origin === '+swapLine' ||
    // `text` is an array of strings representing the text 
    // that replaced the changed range, split by line. If
    // length is greater than zero, it means lines were added.
    change.text.length > 1
  )

  // Update `unsavedChanges` on parent panel.
  setUnsavedChanges(cm)

  // Update ordered lists
  changes.forEach((change) => {

    const { from, to, origin, removed, text } = change

    const lineWasDeleted = 
      origin !== 'undo' &&
      from.line !== to.line &&
      removed.length > 1

    const { state, mode } = getModeAndState(cm, change.from.line)

    if (state.list == 'ol' && lineWasDeleted) {
      
      // Find start and end
      let start = change.from.line

      // Find start of `ul`
      for (var i = change.from.line - 1; i >= 0; i--) {
        const lineIsOl = getModeAndState(cm, i).state.list == 'ol'
        if (lineIsOl) {
          start = i
        } else {
          break
        }
      }

      orderOrderedList(cm, start, origin) 
    }
  })



  // ------ If there are multiple changes, or a multi-line change... ------ //

  // Mark the entire doc...
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

  // 4/20: Not sure why I was looking for changes inside cursor, 
  // instead of at the change location... Changed it to the later.
  // const textMarker = cm.findMarksAt(cursor)[0]
  const textMarker = cm.findMarksAt(from)[0]
  if (textMarker) {
    textMarker.component?.update()
    return
  }


  // ------ If a new element was created, check if it needs a TextMarker ------ //

  // When new elements are created, mark them if:
  // 1) sourceMode is false
  // 2) they're markable, and don't already have a mark
  // 3) cursor is not currently inside them

  // We look one character ahead of `from.ch`.
  // This ensures we're looking inside bounds of the element if it
  // was created by pasting or replaceRange. And it still works
  // if the element was created by typing single characters.

  // We determine if element was created by checking for an element at the change position. 
  // When typing with single cursor, `from.ch` will be one ch -behind-
  // If we just typed `h`, from.ch will be at the `(`.
  // [test](h)
  //       ^|

  // When entering a selection of text (e.g. on paste, or when using autocomplete)
  // `from.ch` will be at the start of the paste operation.
  // If we paste `there`, from.ch will be at the space after `Hi`
  // Hi there
  //   ^    |

  // NOTE: Brittleness of this approach is cursor has to be at element position.
  // If their positions are decoupled (e.g. cursor position is changed before 
  // change is written), this won't work.

  if (!window.state.sourceMode) {

    // We look one character ahead of `from.ch`.
    // See explanation above.
    const elementAtCursor = getElementAt(cm, from.line, from.ch + 1)
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

        // If cursor is inside the element, and it needs a mark,
        // don't mark it yet; instead add a bookmark with a 
        // custom `isSpotToMark` property. This tells us that an
        // element needs marking. Every time the cursor position
        // changes, we check for these bookmarks. When we find them,
        // if the cursor is now clear, we create the marks.

        const marks = cm.getAllMarks()
        const alreadyBookmarked = marks.find((m) => m.type == 'bookmark' && m.isSpotToMark)
        if (!alreadyBookmarked) {
          const bookmark = cm.setBookmark(cursor)
          bookmark.isSpotToMark = true
        }
        return
      }
    }
  }

  return


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


