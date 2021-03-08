<script>
  import { state, project, isMetaKeyDown } from '../../StateManager'
  import { files } from '../../FilesManager'
  import { onMount, createEventDispatcher } from 'svelte'
  import { makeEditor } from '../../editor/editor2';

  import Wizard from './wizard/Wizard.svelte'
  import Autocomplete from './Autocomplete.svelte'
  import Preview from './preview/Preview.svelte'
  import { markDoc2 } from '../../editor/mark';
  import { loadDoc, saveDoc, saveDocAs, saveCursorPosition, loadEmptyDoc, promptToSave } from '../../editor/editor-utils';
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

    const shouldSaveChanges = 
      statusHasChanged && 
      panel.unsavedChanges && 
        (panel.status == 'userWantsToLoadDoc' || 
         panel.status == 'userWantsToClosePanel')
    
    if (shouldSaveChanges) {
      saveCursorPosition(cm)
      promptToSave(cm, doc, isNewDoc)
      // saveDoc(cm, doc)
    }

    // If doc has changed, load new one
    // This will also load initial doc, on Editor creation.
    const noDocIsLoadedYet = panel.docId && !cm.state.panel.docId
    const docHasChanged = panel.docId !== cm.state.panel.docId
    if (isNewDoc) {
      saveCursorPosition(cm)
      loadEmptyDoc(cm)
    } else if (noDocIsLoadedYet || docHasChanged) {
      saveCursorPosition(cm)
      loadDoc(cm, doc)
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
        type: 'PROMPT_TO_SAVE_DOC',
        panelIndex: panel.index,
        outgoingDoc,
        outgoingDocData: cm.getValue(),
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


  onMount(async () => {

    // ------ CREATE EDITOR INSTANCE ------ //

    cm = makeEditor(el)
    window.cmInstances.push(cm)

    // ------ CREATE LISTENERS ------ //

    // User has clicked File > Save
    window.api.receive('mainRequestsSaveFocusedPanel', () => {
      if (isFocusedPanel && panel.unsavedChanges) {
        if (panel.docId == 'newDoc') {
          saveDocAs(cm, doc, true)
        } else {
          saveDoc(cm, doc)
        }
      }
    })

    // User has clicked File > Save As
    window.api.receive('mainRequestsSaveAsFocusedPanel', () => {
      if (isFocusedPanel) {
        const isNewDoc = panel.docId == 'newDoc'
        saveDocAs(cm, doc, isNewDoc)
      }
    })

    // User has clicked File > Save All
    window.api.receive('mainRequestsSaveAll', () => {
      if (panel.unsavedChanges) {
        saveDoc(cm, doc)
      }
    })

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


</script>

<style type="text/scss">

  .editor {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
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
