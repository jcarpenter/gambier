export let oldState = {}


// ------------ EVENTS ------------ //


/**
 * "Fires every time the content of the editor is changed. This event is fired before the end of an operation, before the DOM updates happen." — https://codemirror.net/doc/manual.html#event_change
 */
// function onChange(cm, change) {
//   console.log('onChange: ', change)
// }

/**
 * "Like the 'change' event, but batched per operation, passing an array containing all the changes that happened in the operation. This event is fired after the operation finished, and display changes it makes will trigger a new operation." — https://codemirror.net/doc/manual.html#event_changes
 * @param {*} cm
 * @param {*} changes
 */
// function onChanges(cm, changes) {
//   editorState.blockElements = mapBlockElements(cm)
//   editorState.inlineElements = mapInlineElements(cm, editorState)
//   markDoc(cm, editorState)
// }

/**
 * "Will be fired when the cursor or selection moves, or any change is made to the editor content." - https://codemirror.net/doc/manual.html#event_cursorActivity
 */
function onCursorActivity(e) {
  // Update editorState.selections
  cm.dispatch({ type: 'setSelections' })
}

let showAutocomplete = false // TODO

/**
 * "Like the 'change' event, but batched per operation, passing an array containing all the changes that happened in the operation. This event is fired after the operation finished, and display changes it makes will trigger a new operation." — https://codemirror.net/doc/manual.html#event_changes
 */
function onChanges(cm, changes) {
  // console.trace('onChanges()', changes)

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

/**
 * TODO
 */
// function onFocus() {
//   // console.log('onFocus')
//   if (cm.setCursorAfterChanges !== null) {
//     cm.setCursor(cm.setCursorAfterChanges)
//     cm.setCursorAfterChanges = null
//   }
// }





// ------------ SETUP ------------ //

onMount(async () => {

  // Set initial values
  // editorState.sourceMode = state.sourceMode

  // Create the editor
  cm = createEditor(editor, state.appearance.theme, editorState)

  // Setup listeners
  // cm.on('beforeChange', onBeforeChange)
  // cm.on('change', onChange)
  cm.on('changes', onChanges)

  // cm.on('blur', () => { console.log("onBlur") })
  // cm.on('scrollCursorIntoView', (cm, evt) => {
  //   console.log('scrollCursorIntoView', evt)
  // })
  // cm.on('cursorActivity', () => {
  //   console.log('cursorActivity')
  // })
  // cm.on('scroll', () => {
  //   console.log('scroll')
  // })

  cm.on('cursorActivity', onCursorActivity)

  // cm.on("focus", onFocus)

  // Setup convenience methods on `cm`
  cm.dispatch = dispatch
  cm.getEditorState = () => {
    return editorState
  }

  // Move wizard and autocomplete menus inside CodeMirror's scroller element. If we do not, and leave them as defined below in the markup, they will be siblings of the editor (which is added to the #editor div), and therefore NOT scroll when the CodeMirror editor scrolls.
  cm.getScrollerElement().append(wizard.element)
  cm.getScrollerElement().append(autocomplete.element)
  cm.getScrollerElement().append(preview.element)

  // Pass `cm` to components
  wizard.cm = cm
  autocomplete.cm = cm
  preview.cm = cm

  // Add `data-metakeydown` attribute to `sizer` element while meta key is pressed. We use this in various CSS :hover styles to cue to user that clicking will trigger a different action (e.g. jump to reference definition) than normal clicking.
  window.addEventListener('keydown', (evt) => {
    if (evt.key == 'Meta') {
      cm.dispatch({ type: 'setMetaKey', isMetaKeyDown: true })
    }
  })

  window.addEventListener('keyup', (evt) => {
    if (evt.key == 'Meta') {
      cm.dispatch({ type: 'setMetaKey', isMetaKeyDown: false })
    }
  })

  // Reset to false when window is focused. This prevents a bug wherein the value can get stuck on `true` when we switch away from the app window while holding down the metaKey (which is easy to do, when we MetaKey-Tab to invoke the app switcher).
  window.addEventListener('focus', (evt) => {
    cm.getScrollerElement().setAttribute('data-metakeydown', false)
  })

  // Set initial value
  cm.getScrollerElement().setAttribute('data-metakeydown', false)





  // Setup app `stateChanged` listeners
  window.api.receive('stateChanged', async (state, oldState) => {
    // state = newState

    if (state.changed.includes('doc')) {
      if (state.doc.path) {
        cm.dispatch({ type: 'loadDoc', target: state.doc })
      }
    }

    if (state.changed.includes('focusedLayoutSection')) {
      if (state.focusedLayoutSection == 'editor') {
        focusEditor(cm)
      }
    }

    if (state.changed.includes('sourceMode')) {
      cm.dispatch({ type: 'setSourceMode', boolean: state.sourceMode })
      toggleSource(cm)
    }

    if (state.changed.includes('appearance')) {
      cm.setOption('theme', state.appearance.theme)
    }
  })

  // Save open doc when main requests (e.g. user clicks File > Save.)
  window.api.receive('mainRequestsSaveFile', () => {
    saveFile(cm, editorState.doc.path)
  })

  // Save open doc when app quits
  window.api.receive('mainWantsToCloseWindow', async () => {
    window.api.send(
      'saveFileThenCloseWindow',
      editorState.doc.path,
      cm.getValue()
    )
  })

  // Save open doc when app quits
  window.api.receive('mainWantsToQuitApp', async () => {
    window.api.send(
      'saveFileThenQuitApp',
      editorState.doc.path,
      cm.getValue()
    )
  })

  // Load the doc
  console.log(project.doc.id)
  if (project.doc.id) {
    cm.dispatch({ type: 'loadDoc', docId: project.doc.id })
  }

  // ------- TEMP ------- //

  // Fire event (TEMP: Testing handlers)
  // setTimeout(() => {
  //   cm.setState({ type: 'selectWidget', id: 'timothy' })
  // }, 100)
})