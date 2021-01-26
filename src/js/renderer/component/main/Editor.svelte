<script>
  import { state, project } from '../../StateManager'
  import { files } from '../../FilesManager'
  import { onMount, createEventDispatcher } from 'svelte'
  import { makeEditor } from '../../editor/editor2';

  import Wizard from './wizard/Wizard.svelte'
  import Autocomplete from './Autocomplete.svelte'
  import Preview from './Preview.svelte'
  import { clearDocMarks, markDoc } from '../../editor/mark';
  import { saveDoc } from '../../editor/editor-utils';

  export let panel = {}
  export let doc = {}
  export let isFocusedPanel = false // 1/18: Not using these yet
  export let visible = false

  // Bindings
  let cm // CodeMirror (Editor) instance
  let el // This element


  $: panel, onPanelChange()

  /**
   * Handle panel changes. Determine what changed, and make the appropriate updates/
   */
  function onPanelChange() {
    if (!cm) return

    // If doc has changed, load new one
    const docHasChanged = cm.state.panel.docId !== panel.docId
    if (docHasChanged) {
      cm.dispatch({ type: 'loadDoc', doc })
    }

    // If save status has changed, and it's now "no unsaved changes", mark the doc clea
    // Per: https://codemirror.net/doc/manual.html#markClean
    const saveStatusHasChanged = cm.state.panel.unsavedChanges !== panel.unsavedChanges
    if (saveStatusHasChanged) {
      if (!panel.unsavedChanges) {
        cm.doc.markClean()
      }
    }

    // Set cm.state.panel to a copy of panel, when panel changes.
    cm.dispatch({ type: 'panelChanged', panel: panel })
  }


  $: sourceMode = $state.sourceMode
  $: sourceMode, toggleSource()
  
  /**
   * When sourceMode changes, if false, create marks.
   */
  function toggleSource() {
    if (!cm) return
    // Clear current marks, regardless of sourceMode true/false.
    clearDocMarks(cm)
    if (!sourceMode) { markDoc(cm) }
  }



  // Focused panel - Can't remember where we use this

  onMount(async () => {

    // ------ CREATE EDITOR INSTANCE ------ //

    cm = makeEditor(el)
    cm.dispatch({ type: 'loadDoc', doc })

    // ------ CREATE LISTENERS ------ //

    // Save open doc when main requests (e.g. user clicks File > Save)
    window.api.receive('mainRequestsSaveFocusedPanel', () => {
      if (isFocusedPanel && panel.unsavedChanges) {
        saveDoc(cm, doc)
      }
    })

    // Save open doc when main requests (e.g. user clicks File > Save)
    window.api.receive('mainRequestsSaveAll', () => {
      if (panel.unsavedChanges) {
        saveDoc(cm, doc)
      }
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

    // ------ CREATE COMPONENTS ------ //

    // Add wizard, autocomplete and preview components to CodeMirror's scroller element. If we don't, and instead were to define them as components here, in Editor.svelte,they would be siblings of the top-level CodeMirror element (which is added to the `el` div), and therefore NOT scroll with the editor.

    // const wizard = new Wizard({
    //   target: cm.getScrollerElement(),
    //   props: {
    //     cm: cm
    //   }
    // })

    // const autocomplete = new Autocomplete({
    //   target: cm.getScrollerElement(),
    //   props: {
    //     cm: cm
    //   }
    // })

    // const preview = new Preview({
    //   target: cm.getScrollerElement(),
    //   props: {
    //     cm: cm
    //   }
    // })
  })


</script>

<style type="text/scss">

  .editor {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .testing {
    @include label-normal-small;
    background: pink;
    padding: 1em;
  }

  // Docs: https://codemirror.net/doc/manual.html#styling

  // ".CodeMirror: The outer element of the editor. This should be used for the editor width, height, borders and positioning. Can also be used to set styles that should hold for everything inside the editor (such as font and font size), or to set a background. Setting this class' height style to auto will make the editor resize to fit its content (it is recommended to also set the viewportMargin option to Infinity when doing this."
  .editor > :global(.CodeMirror) {
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: -apple-system, "BlinkMacSystemFont", sans-serif;
      font-size: 1rem; // TODO: Replace these
      line-height: 1.4rem;
      // font-size: var(--font-sml-1); // OLD approach, with variables
      // line-height: var(--baseLineHeight);
      background: transparent;
  }

  // "The visible lines. This is where you specify vertical padding for the editor content."
  :global(.CodeMirror .CodeMirror-lines) {
    background: transparent;
    // We want the white space on the left and right of each line to be a selectable.
    // thereby increasing the hit target for selections. Hence the large margin.
    // The margin `auto` width value also automatically centers the content.
    margin: 1em auto;
    min-width: 24em;
    max-width: 40em;

    // Add padding to bottom of doc, so that when we're at bottom of
    // scroll, there's padding before edge of editor.
    padding: 0 1em 18em;
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
  on:click
>
</div>
