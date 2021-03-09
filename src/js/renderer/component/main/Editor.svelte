<script>
  import { state, project, isMetaKeyDown } from '../../StateManager'
  import { files } from '../../FilesManager'
  import { onMount, onDestroy } from 'svelte'
  import { makeEditor } from '../../editor/editor2';

  import Wizard from './wizard/Wizard.svelte'
  import Autocomplete from './Autocomplete.svelte'
  import Preview from './preview/Preview.svelte'
  import { markDoc2 } from '../../editor/mark';
  import { loadDoc, saveCursorPosition, loadEmptyDoc } from '../../editor/editor-utils';
  import { mapDoc } from '../../editor/map';

  export let panel = {}
  export let doc = undefined
  export let isFocusedPanel = false // 1/18: Not using these yet
  export let visible = false

  // Bindings
  let cm // CodeMirror (Editor) instance
  let el // This element


  $: panel, onPanelChange()

  /**
   * Handle panel changes. Determine what changed, and make the appropriate updates.
   */
  function onPanelChange() {
    if (!cm) return

    // If status has changed...
    const statusHasChanged = panel.status !== cm.state.panel.status

    const isNewDoc = panel.docId == 'newDoc'

    // If doc has changed, load new one
    // This will also load initial doc, on Editor creation.
    const docHasChanged = panel.docId !== cm.state.panel.docId
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
    const saveStatusHasChanged = cm.state.panel.unsavedChanges !== panel.unsavedChanges
    if (saveStatusHasChanged) {
      if (!panel.unsavedChanges) {
        cm.doc.markClean()
      }
    }

    // Set cm.state.panel to a copy of panel when panel changes.
    cm.state.panel = { ...panel }
  }


  $: sourceMode = $state.sourceMode
  $: sourceMode, toggleSource()
  
  /**
   * When sourceMode changes, clear marks if true.
   * Else, if false, create marks.
   */
  function toggleSource() {
    if (!cm) return
    // Clear current marks, regardless of sourceMode true/false.
    cm.getAllMarks().forEach((m) => m.clear())
    if (!sourceMode) { 
      // mapDoc(cm)
      // markDoc(cm) 
      markDoc2(cm) 
    }
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

  $: editorTheme = $state.theme.editorTheme
  $: editorTheme, setEditorTheme()

  function setEditorTheme() {
    // TODO
  }

  let removeListenerMethods = []

  onMount(async () => {

    // ------ CREATE EDITOR INSTANCE ------ //

    cm = makeEditor(el)
    window.cmInstances.push(cm)

    // If the panel is focused, focus the CodeMirror instance
    if (isFocusedPanel) cm.focus()

    // Set `cm.state.panel` to a copy of panel
    // cm.state.panel = { ...panel }

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

    // ------ CREATE COMPONENTS ------ //

    // Add wizard, autocomplete and preview components to CodeMirror's scroller element. If we don't, and instead were to define them as components here, in Editor.svelte,they would be siblings of the top-level CodeMirror element (which is added to the `el` div), and therefore NOT scroll with the editor.

    // const autocomplete = new Autocomplete({
    //   target: cm.getScrollerElement(),
    //   props: {
    //     cm: cm
    //   }
    // })

    const preview = new Preview({
      target: cm.getScrollerElement(),
      props: { cm }
    })

    const wizard = new Wizard({
      target: cm.getScrollerElement(),
      props: { cm }
    })

    // Expose as props on `cm`
    cm.preview = preview
    cm.wizard = wizard
  })

  onDestroy(() => {
    // Remove `window.api.receive` listeners
    removeListenerMethods.forEach((remove) => remove())
  })

</script>

<style type="text/scss">

  .editor {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .isFocusedPanel {

  }
</style>

<!-- <div class="testing">
  {panel.id}<br>
  {panel.docId}<br>
  {panel.width}<br>
  {panel.unsavedChanges}<br>
</div> -->

<div
  bind:this={el}
  class="editor"
  class:isFocusedPanel
  class:visible
  class:metaKeyDown={$isMetaKeyDown}
  on:click
>
</div>
