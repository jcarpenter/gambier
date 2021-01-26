/**
 * "Like the 'change' event, but batched per operation, passing an array containing all the changes that happened in the operation. This event is fired after the operation finished, and display changes it makes will trigger a new operation." — https://codemirror.net/doc/manual.html#event_changes
 */
export function onChanges(cm, changes) {
  // console.trace('onChanges()', changes)
  console.log('onChanges')
 
  // On change, update unsavedChanges value on the panel.
  // Avoid spamming by first checking if there's a mismatch
  // between current state value and `cm.doc.isClean()`
  const docIsNowClean = cm.doc.isClean()
  const prevStateHadUnsavedChanges = cm.state.panel.unsavedChanges

  if (docIsNowClean && prevStateHadUnsavedChanges) {
    // Need to update panel state: The doc is now clean.
    window.api.send('dispatch', {
      type: 'SET_UNSAVED_CHANGES',
      panelIndex: cm.state.panel.index,
      value: false
    })
  } else if (!prevStateHadUnsavedChanges) {
    // Need to update panel state: The doc now has unsaved changes.
    window.api.send('dispatch', {
      type: 'SET_UNSAVED_CHANGES',
      panelIndex: cm.state.panel.index,
      value: true
    })
  }

  return

  // Checks
  const hasMultipleLinesChanged = changes.some((change) => {
    return (
      change.from.line !== change.to.line || change.origin === '+swapLine'
    )
  })
  const isSingleEdit = changes.length == 1
  const isUndo = changes.some((change) => change.origin == 'undo')

  // Set cursor, if `cm.setCursorAfterChanges` !== null. We use this when want to place the cursor at a specific position _after_ we've changed the text.

  // if (cm.setCursorAfterChanges !== null) {
  //   cm.setCursor(cm.setCursorAfterChanges)
  //   // Reset
  //   cm.setCursorAfterChanges = null
  // }

  // Remap elements and re-mark:
  // * Everything, if multiple lines have changed.
  // * Else, one line only

  if (hasMultipleLinesChanged) {
    mapDoc(cm)
    markDoc(cm)
  } else {
    // We assume only one line has changed...

    const lineNo = changes[0].from.line
    const lineHandle = cm.getLineHandle(lineNo)

    // Autocomplete: Determine if we need to open it or not
    if (showAutocomplete && isSingleEdit && !isUndo) {
      // If preceding character was `^`, user is trying to create an inline footnote, so we don't open the autocomplete UI. We just make sure the wizard opens after the widget is created.

      const changeText = changes[0].text[0]
      const emptyBrackets = changeText == '[]'
      const bracketsAroundSingleSelection =
        !emptyBrackets &&
        changeText.charAt(0) == '[' &&
        changeText.charAt(changeText.length - 1) == ']'

      if (emptyBrackets || bracketsAroundSingleSelection) {
        markAutocomplete(cm, changeText)
        showAutocomplete = false
      }
    } else {
      // Remap everything if line changed had block styles. We do this because blockElements can contain reference definitions. And if reference definitions change, lineElements also need to be remapped (because they incorporate data from reference definitions).

      const hasBlockElementChanged = lineHandle.styleClasses !== undefined
      if (hasBlockElementChanged) {
        mapDoc(cm)
        markDoc(cm)
      } else {
        // Remap lineElements, redo line marks, and finish
        remapInlineElementsForLine(cm, lineHandle)
        clearLineMarks(cm, lineHandle)
        markLine(cm, lineHandle)
      }
    }
  }

  cm.dispatch({ type: 'changes', changes: changes })

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
