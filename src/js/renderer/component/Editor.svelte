<script>
  // import * as editor from '../editor/editor.js'
  import { onMount, createEventDispatcher } from 'svelte'
  import {
    clearLineMarks,
    createEditor,
    focusEditor,
    loadFileByPath,
    mapDoc,
    markDoc,
    markLine,
    remapInlineElementsForLine,
    saveFile,
    toggleSource,
  } from '../editor/index.js'

  import Wizard from './wizard/Wizard.svelte'
  import Autocomplete from './Autocomplete.svelte'
  import Preview from './Preview.svelte'

  export let focused
  export let visible
  export let state = {}
  export let oldState = {}

  let cm = null
  let showAutocomplete = false // TODO

  // Event dispatcher
  const dispatch = createEventDispatcher()

  // Bindings
  let editor
  let wizard
  let autocomplete
  let preview

  // ------------ STATE ------------ //

  // Define `editorState` properties
  let editorState = {
    isMetaKeyDown: false,
    sourceMode: false,
    lastChanges: {},
    openDoc: {},
    widget: {
      hovered: null,
      selected: null,
      target: null,
      isHovered: false,
      isSelected: false,
    },
    selections: [],
    blockElements: [],
    inlineElements: [],
  }

  // Set state
  function setEditorState(action) {
    // console.log('setEditorState', action)
    switch (action.type) {
      case 'loadDoc':
        // Save outgoing file
        if (editorState.openDoc.path) {
          saveFile(cm, editorState.openDoc.path)
        }
        // Update editorState
        editorState.openDoc = state.openDoc
        // Load new file
        loadFileByPath(cm, state.openDoc.path)
        break
      case 'setMetaKey':
        editorState.isMetaKeyDown = action.isMetaKeyDown
        cm.getScrollerElement().setAttribute(
          'data-metakeydown',
          action.isMetaKeyDown
        )
        CodeMirror.signal(this, 'editorStateChanged', 'metaKey')
        break

      case 'changes':
        editorState.lastChanges = action.changes
        CodeMirror.signal(this, 'editorStateChanged', 'lastChanges')
        break

      case 'setSourceMode':
        editorState.sourceMode = action.boolean
        CodeMirror.signal(this, 'editorStateChanged', 'sourceMode')
        break

      case 'setSelections':
        editorState.selections = cm.getDoc().listSelections()
        CodeMirror.signal(this, 'editorStateChanged', 'selections')
        break

      case 'hoverWidget':
        editorState.widget.hovered = action.target
        CodeMirror.signal(this, 'editorStateChanged', ['widget', 'hovered'])
        break

      case 'selectWidget':
        cm.setSelection(
          { line: action.target.line, ch: action.target.start },
          { line: action.target.line, ch: action.target.end }
        )
        editorState.selections = cm.getDoc().listSelections()
        editorState.widget.selected = action.target
        CodeMirror.signal(this, 'editorStateChanged', ['widget', 'selected'])
        break

      case 'deSelectWidget':
        editorState.widget.selected = null
        CodeMirror.signal(this, 'editorStateChanged', ['widget', 'selected'])
        break
    }
    // console.log(editorState)
  }

  // ------------ EVENTS ------------ //

  /**
   * "This event is fired before a change is applied, and its handler may choose to modify or cancel the change" — https://codemirror.net/doc/manual.html#event_beforeChange
   * Handle paste operations. If URL, generate link; else, if HTML, convert to markdown.
   */
  async function onBeforeChange(cm, change) {
    // console.log('onBeforeChange', change)

    // If a new doc was loaded, and we don't want to run these operations.
    if (change.origin === 'setValue') {
      return
    }

    // Handle paste operations
    if (change.origin === 'paste') {
      const selection = cm.getSelection()
      const isURL = isUrl(change.text)

      if (isURL) {
        if (selection) {
          const text = selection
          const url = change.text
          const newText = change.text.map(
            (line) => (line = `[${text}](${url})`)
          )
          change.update(null, null, newText)
        }
      } else {
        change.cancel()
        const formats = await window.api.invoke('getFormatOfClipboard')
        if (formats.length === 1 && formats[0] === 'text/plain') {
          cm.replaceSelection(change.text.join('\n'))
        } else if (formats.includes('text/html')) {
          const html = await window.api.invoke('getHTMLFromClipboard')
          const markdown = turndownService.turndown(html)
          cm.replaceSelection(markdown)
        }
      }
    }
  }

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
    cm.setEditorState({ type: 'setSelections' })
  }

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

    cm.setEditorState({ type: 'changes', changes: changes })

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
   * Forward click events to parent `Layout` component. It dispatches focus changes to main, to help track which section of the UI is focused.
   */
  function forwardClick(evt) {
    dispatch('click', evt)
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
    editorState.sourceMode = state.sourceMode

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

    // Setup method properties on `cm`
    cm.setEditorState = setEditorState
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
        cm.setEditorState({ type: 'setMetaKey', isMetaKeyDown: true })
      }
    })

    window.addEventListener('keyup', (evt) => {
      if (evt.key == 'Meta') {
        cm.setEditorState({ type: 'setMetaKey', isMetaKeyDown: false })
      }
    })

    // Reset to false when window is focused. This prevents a bug wherein the value can get stuck on `true` when we switch away from the app window while holding down the metaKey (which is easy to do, when we MetaKey-Tab to invoke the app switcher).
    window.addEventListener('focus', (evt) => {
      cm.getScrollerElement().setAttribute('data-metakeydown', false)
    })

    // Set initial value
    cm.getScrollerElement().setAttribute('data-metakeydown', false)

    // Setup app `stateChanged` listeners
    window.api.receive('stateChanged', async (newState, oldState) => {
      state = newState

      if (state.changed.includes('openDoc')) {
        if (state.openDoc.path) {
          cm.setEditorState({ type: 'loadDoc', target: state.openDoc })
        }
      }

      if (state.changed.includes('focusedLayoutSection')) {
        if (state.focusedLayoutSection == 'editor') {
          focusEditor(cm)
        }
      }

      if (state.changed.includes('sourceMode')) {
        cm.setEditorState({ type: 'setSourceMode', boolean: state.sourceMode })
        toggleSource(cm)
      }

      if (state.changed.includes('appearance')) {
        cm.setOption('theme', newState.appearance.theme)
      }
    })

    // Save open doc when main requests (e.g. user clicks File > Save.)
    window.api.receive('mainRequestsSaveFile', () => {
      saveFile(cm, editorState.openDoc.path)
    })

    // Save open doc when app quits
    window.api.receive('mainWantsToCloseWindow', async () => {
      window.api.send(
        'saveFileThenCloseWindow',
        editorState.openDoc.path,
        cm.getValue()
      )
    })

    // Save open doc when app quits
    window.api.receive('mainWantsToQuitApp', async () => {
      window.api.send(
        'saveFileThenQuitApp',
        editorState.openDoc.path,
        cm.getValue()
      )
    })

    // Load the openDoc
    if (state.openDoc.path) {
      cm.setEditorState({ type: 'loadDoc', target: state.openDoc })
    }

    // ------- TEMP ------- //

    // Fire event (TEMP: Testing handlers)
    // setTimeout(() => {
    //   cm.setState({ type: 'selectWidget', id: 'timothy' })
    // }, 100)
  })
</script>

<style type="text/scss">
</style>

<div
  bind:this={editor}
  id="editor"
  on:click={forwardClick}
  class:focused
  class:visible>
  <Wizard bind:this={wizard} {editorState} />
  <Autocomplete bind:this={autocomplete} />
  <Preview bind:this={preview} {editorState} />
</div>
