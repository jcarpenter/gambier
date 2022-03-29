<script>
  import { state, project, isMetaKeyDown, markdownOptions } from '../../StateManager'
  import { onMount, onDestroy, tick } from 'svelte'
  import { makeEditor, setMode } from '../../editor/editor';
  import { markDoc } from '../../editor/mark';
  import { loadDoc, saveCursorPosition, loadEmptyDoc, getCmDataByPanelId, restoreCursorScrollPosition } from '../../editor/editor-utils';

  export let panel = {}
  export let doc = undefined
  export let isFocusedPanel = false // 1/18: Not using these yet
  export let visible = false
  export let width = 0
  // export let parentEl
  
  let cm // CodeMirror (Editor) instance
  let el // This element
  let widgets // Widgets element

  // We have to call `cm.refresh()` when the panel size
  // changes or selections and cursors don't update.
  $: width, refreshSize()
  function refreshSize() {
    if (!cm) return
    cm.refresh()
  }

  $: panel, onPanelChange()

  /**
   * Handle panel changes. Determine what changed, and make the appropriate updates.
   */
  function onPanelChange() {

    if (!cm) return

    // Determine what's changed
    // const statusHasChanged = panel.status !== cm.panel.status
    const isNewDoc = panel.docId == 'newDoc'
    const docHasChanged = panel.docId !== cm.panel.docId
    const saveStatusHasChanged = panel.unsavedChanges !== cm.panel.unsavedChanges

    // Apply updated `panel` oject to `cm.panel` property
    cm.panel = { ...panel }
    // console.log('onPanelChange: cm.panel: ', cm.panel)

    // If doc has changed, load new one
    // This will also load initial doc, on Editor creation.
    if (docHasChanged) {
      saveCursorPosition(cm)
      if (isNewDoc) {
        loadEmptyDoc(cm)
      } else {
        loadDoc(cm, doc)
      }
    }

    // If save status has changed, and it's now "no unsaved changes", mark the doc clean
    // Per: https://codemirror.net/doc/manual.html#markClean
    if (saveStatusHasChanged) {
      if (!panel.unsavedChanges) {
        cm.doc.markClean()
      }
    }
  }

  $: fontSize = $state.editorFont.size
  $: lineHeight = $state.editorLineHeight.size
  $: maxLineWidth = $state.editorMaxLineWidth.size
  $: fontSize, lineHeight, maxLineWidth, refreshEditorOnTypographyChange()

  /**
   * We need to refresh CM instance when typography variables 
   * change or the layout of character-related items such as
   * selections and cursors do not update.
   */
  function refreshEditorOnTypographyChange() {
    if (!cm) return
    cm.refresh()
  }

  $: frontMatterCollapsed = $state.frontMatterCollapsed
  $: frontMatterCollapsed, toggleFrontMatterCollapsed()
  
  /**
   * When `frontMatterCollapsed` changes, we need to re-mark
   * the document. We use marks to hide the front matter, and 
   * need to either create them, or remove them.
   */
  async function toggleFrontMatterCollapsed() {
    if (!cm) return
    
    // Get cursor position before change so we can restore it after
    const cursorYPosBefore = cm.cursorCoords(true, "window").top

    cm.getAllMarks().forEach((m) => m.clear())
    markDoc(cm) 
    await tick()
    cm.refresh()

    // Restore cursor position
    restoreCursorScrollPosition(cm, cursorYPosBefore)
  }


  $: sourceMode = $state.sourceMode
  $: sourceMode, toggleSource()
  
  /**
   * When sourceMode changes, update marks.
   * Then restore cursor scroll position.
   */
  async function toggleSource() {
    if (!cm) return
    
    // Get cursor position before change so we can restore it after
    const cursorYPosBefore = cm.cursorCoords(true, "window").top
    
    // Clear current marks, regardless of sourceMode true/false.
    // Then mark . Then forece refresh.
    // Refresh to ensure positions are correct
    cm.getAllMarks().forEach((m) => m.clear())
    markDoc(cm) 
    await tick()
    cm.refresh()

    // Restore cursor position
    restoreCursorScrollPosition(cm, cursorYPosBefore)
  }

  $: windowStatus = $project.window.status
  $: windowStatus, windowStatusChanged()

  /**
   * Save doc in the panel when the window requests it.
   */
  function windowStatusChanged() {
    if (!cm) return
    if (windowStatus == 'wantsToClose' && panel.unsavedChanges) {
      window.api.send('dispatch', {
        type: 'SAVE_PANEL_CHANGES_SO_WE_CAN_CLOSE_WINDOW',
        panelIndex: panel.index,
        outgoingDoc: doc,
        outgoingDocData: cm.getValue(),
        isNewDoc: panel.docId == 'newDoc'
      })
    }
  }

  $: $isMetaKeyDown, toggleMetaKeyClass()

  function toggleMetaKeyClass() {
    if (!cm) return
    cm.state.isMetaKeyDown = $isMetaKeyDown
  }

  // $: editorTheme = $state.editorTheme.id
  // $: editorTheme, setEditorTheme()

  // function setEditorTheme() {
  //   // TODO
  // }

  $: $markdownOptions, setMarkdownOptions()

  function setMarkdownOptions() {
    if (!cm) return
    setMode(cm)
  }

  let removeListenerMethods = []

  onMount(async () => {

    // ------ CREATE EDITOR INSTANCE ------ //

    cm = makeEditor(el, panel)
    window.cmInstances.push(cm)

    // If the panel is focused, focus the CodeMirror instance
    if (isFocusedPanel) cm.focus()

    if (doc) loadDoc(cm, doc)

    // ------ CREATE LISTENERS ------ //

    const newDocListener = window.api.receive('mainRequestsCreateNewDocInFocusedPanel', () => {
      const isNewDoc = panel.docId == 'newDoc'
      if (isFocusedPanel) {
        window.api.send('dispatch', { 
        type: 'OPEN_NEW_DOC_IN_PANEL', 
        panelIndex: panel.index,
        outgoingDoc: doc,
        outgoingDocData: panel.unsavedChanges ?
          getCmDataByPanelId(panel.id) : '',
        isNewDoc
      })
      }
    })
    
    // Save
    const saveListener = window.api.receive('mainRequestsSaveFocusedPanel', () => {
      if (isFocusedPanel && panel.unsavedChanges) {
        console.log(panel)
        const isNewDoc = panel.docId == 'newDoc'
        if (isNewDoc) {
          window.api.send('dispatch', {
            type: 'SAVE_DOC_AS',
            panelIndex: panel.index,
            doc,
            data: cm.getValue(),
            isNewDoc
          })
        } else {
          window.api.send('dispatch', {
            type: 'SAVE_DOC',
            panelIndex: panel.index,
            doc,
            data: cm.getValue(),
          })
        }
      }
    })

    // Save As
    const saveAsListener = window.api.receive('mainRequestsSaveAsFocusedPanel', () => {
      if (isFocusedPanel) {
        const isNewDoc = panel.docId == 'newDoc'
        window.api.send('dispatch', {
          type: 'SAVE_DOC_AS',
          panelIndex: panel.index,
          doc,
          data: cm.getValue(),
          isNewDoc
        })
      }
    })

    // Save All
    const saveAllListener = window.api.receive('mainRequestsSaveAll', () => {
      if (panel.unsavedChanges) {
        const isNewDoc = panel.docId == 'newDoc'
        if (isNewDoc) {
          window.api.send('dispatch', {
            type: 'SAVE_DOC_AS',
            panelIndex: panel.index,
            doc,
            data: cm.getValue(),
            isNewDoc
          })
        } else {
          window.api.send('dispatch', {
            type: 'SAVE_DOC',
            panelIndex: panel.index,
            doc,
            data: cm.getValue(),
          })
        }
      }
    })

    removeListenerMethods.push(newDocListener, saveListener, saveAsListener, saveAllListener)

  })

  onDestroy(() => {
    // Remove `window.api.receive` listeners
    removeListenerMethods.forEach((remove) => remove())
  })

</script>

<style type="text/scss">

  .editor {
    position: relative;
    width: 100%;
    padding: 0;
    flex-grow: 1;
    overflow: hidden;
  }

</style>

<div
  bind:this={el}
  class="editor"
  class:sourceMode={$state.sourceMode}
  class:isFocusedPanel
  class:visible
  class:metaKeyDown={$isMetaKeyDown}
  on:click
/>

